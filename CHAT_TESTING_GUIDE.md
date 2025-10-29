# Chat Integration Testing Guide

## ✅ Integration Status: WORKING

The WebSocket chat integration between the frontend and AI service is now fully operational!

---

## Quick Verification

### 1. Check Services Are Running

```bash
# Frontend (Next.js) - Port 3000
lsof -i :3000 | grep LISTEN

# AI Service (NestJS) - Port 3004
lsof -i :3004 | grep LISTEN

# Ollama - Port 11434
curl http://localhost:11434/api/tags
```

### 2. Monitor AI Service Logs

```bash
# Real-time log monitoring
tail -f /tmp/ai-service.log

# Or check last 30 lines
tail -30 /tmp/ai-service.log
```

---

## Testing the Chat

### Test 1: Simple Greeting

1. **Open your browser** to `http://localhost:3000` and navigate to the chat interface
2. **Check connection status**: You should see a green dot (🟢) indicating connected
3. **Send message**: Type "Hi" and press Enter
4. **Expected result**: 
   - Message appears in chat
   - Typing indicator shows briefly
   - AI responds with a greeting

**Console Output:**
```
✅ Connected to AI service
✅ Message sent: Hi
✅ Response received: [AI greeting]
```

**AI Service Logs:**
```
[ChatGateway] Client connected: [socket-id]
[ChatGateway] Received message from [socket-id]: Hi...
[ChatService] Processing chat message: Hi...
[OllamaService] Sending chat request to Ollama with model: gpt-oss:20b
[ChatGateway] Sent response to [socket-id]
```

---

### Test 2: Complex Question

**Message:** "Explain quantum computing in simple terms"

**Expected Behavior:**
- ⏳ Longer processing time (5-10 seconds)
- 💬 Typing indicator active
- 📝 Detailed AI response
- ✅ Response appears in chat interface

**AI Service Logs:**
```
[ChatGateway] Received message: Explain quantum computing...
[ChatService] Processing chat message: Explain quantum computing...
[OllamaService] Sending chat request to Ollama with model: gpt-oss:20b
[ChatGateway] Sent response to [socket-id]
```

---

### Test 3: Rapid Messages

1. Send multiple messages quickly:
   - "Hello"
   - "What's 2+2?"
   - "Tell me a joke"

2. **Expected behavior:**
   - All messages queued and processed
   - Responses return in order
   - No connection drops
   - No duplicate messages

---

### Test 4: Connection Stability

**What to Monitor:**

1. **No Infinite Loops**
   - ❌ Should NOT see rapid connect/disconnect cycles
   - ✅ Should see ONE stable connection

2. **Proper Disconnection**
   - Close browser tab
   - Check logs show single disconnect event

3. **Reconnection**
   - Reopen chat
   - Should reconnect automatically
   - Previous conversation may be cleared (by design)

---

## Expected Log Patterns

### ✅ GOOD (Working)
```
[ChatGateway] Client connected: abc123
[ChatGateway] Received message from abc123: Hello...
[ChatService] Processing chat message: Hello...
[OllamaService] Sending chat request to Ollama with model: gpt-oss:20b
[ChatGateway] Sent response to abc123
```

### ❌ BAD (Broken - Should NOT See)
```
[ChatGateway] Client connected: abc123
[ChatGateway] Client disconnected: abc123
[ChatGateway] Client connected: def456
[ChatGateway] Client disconnected: def456
[ChatGateway] Client connected: ghi789
[ChatGateway] Client disconnected: ghi789
... (repeating 30+ times per second)
```

---

## Browser Console Testing

### Open Developer Tools (F12)

**Expected Console Messages:**
```javascript
✅ Socket connected to AI service
✅ Connection status: connected
✅ Message sent: [your message]
✅ Response received: [AI response]
```

**Should NOT See:**
```javascript
❌ Socket error: Failed to connect to AI service
❌ Chat error: Ollama API error: Request failed with status code 404
❌ Connection refused
❌ CORS error
```

---

## API Testing (Optional)

### Test Ollama Directly

```bash
# Test model availability
curl http://localhost:11434/api/tags

# Test generation
curl -s http://localhost:11434/api/generate \
  -d '{
    "model": "gpt-oss:20b",
    "prompt": "Say hello",
    "stream": false
  }' | jq .
```

### Test AI Service WebSocket

You can use a WebSocket client or Socket.IO client library:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004/chat', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected!');
  
  socket.emit('chat_message', {
    message: 'Hello from test client',
  });
});

socket.on('chat_response', (data) => {
  console.log('Response:', data);
});
```

---

## Troubleshooting

### Issue: No Connection (Red Dot 🔴)

**Check:**
1. Is AI service running? `lsof -i :3004`
2. Check CORS settings in `ai/src/main.ts`
3. Verify WebSocket namespace is `/chat`
4. Check browser console for errors

**Fix:**
```bash
cd ai
npm run start:dev
```

---

### Issue: Message Sent But No Response

**Check:**
1. AI service logs for errors: `tail -f /tmp/ai-service.log`
2. Is Ollama running? `curl http://localhost:11434/api/tags`
3. Is model name correct in `.env`?

**Fix:**
```bash
# Check Ollama is running
ollama list

# If not, start it
ollama serve

# Verify model exists
ollama list | grep gpt-oss

# Restart AI service
cd ai && npm run start:dev
```

---

### Issue: "Ollama API error: 404"

**This means the model name doesn't match!**

**Fix:**
```bash
# Check actual model name
curl http://localhost:11434/api/tags | jq '.models[].name'

# Update ai/.env with exact name
OLLAMA_DEFAULT_MODEL=gpt-oss:20b

# Restart AI service
cd ai && npm run start:dev
```

---

### Issue: Infinite Connection Loops

**This was fixed! But if it returns:**

**Check:**
- `frontend/hooks/use-socket.ts` line 172-180
- Ensure dependency array only has `[options.autoConnect]`
- Do NOT include `connect` or `disconnect` in dependencies

---

## Performance Benchmarks

### Response Times (Approximate)

| Message Type | Expected Time | Status |
|-------------|---------------|--------|
| Simple greeting | 1-3 seconds | ✅ Normal |
| Short question | 3-5 seconds | ✅ Normal |
| Complex question | 5-15 seconds | ✅ Normal |
| MCP tool usage | 10-30 seconds | ⚠️ Variable |

**Note:** First message after service start may be slower due to model loading.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Port 3000)                    │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  ChatInterface   │────────▶│   useSocket()    │        │
│  │   Component      │         │      Hook        │        │
│  └──────────────────┘         └──────────────────┘        │
│                                         │                   │
│                                         │ Socket.IO         │
│                                         │ WebSocket         │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Service (Port 3004)                   │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   ChatGateway    │────────▶│   ChatService    │        │
│  │  (WebSocket)     │         │                  │        │
│  └──────────────────┘         └──────────────────┘        │
│                                         │                   │
│                                         │ HTTP POST         │
│                                         ▼                   │
│                                ┌──────────────────┐        │
│                                │  OllamaService   │        │
│                                └──────────────────┘        │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                                          │ HTTP
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Port 11434)                      │
│                                                             │
│                  Model: gpt-oss:20b (20.9B params)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### ✅ Integration is Working When:

- [x] Single stable WebSocket connection
- [x] Messages sent from frontend
- [x] Messages received by AI service
- [x] Ollama processes requests
- [x] Responses return to frontend
- [x] Responses display in chat UI
- [x] No infinite connection loops
- [x] No 404 errors from Ollama
- [x] Typing indicators function
- [x] Connection status accurate

### 🎉 Current Status: ALL CRITERIA MET!

---

## Next Steps

1. **User Testing**: Have actual users test the chat interface
2. **Load Testing**: Test with multiple concurrent users
3. **Error Handling**: Add retry logic and better error messages
4. **Features**: 
   - Conversation persistence
   - Message editing
   - Code syntax highlighting
   - File attachments
   - Voice input
5. **Optimization**:
   - Streaming responses
   - Response caching
   - Connection pooling
   - Rate limiting

---

## Support

If you encounter issues:

1. **Check this guide first**
2. **Review logs**: `tail -f /tmp/ai-service.log`
3. **Check browser console**: F12 → Console tab
4. **Verify services**: All services must be running
5. **Restart services**: When in doubt, restart everything

**Service Restart Order:**
```bash
# 1. Stop all services (Ctrl+C in each terminal)
# 2. Start Ollama (if not running)
ollama serve

# 3. Start AI service
cd ai && npm run start:dev > /tmp/ai-service.log 2>&1 &

# 4. Start Frontend
cd frontend && npm run dev
```

---

**Last Updated:** 2025-10-29
**Status:** ✅ Fully Operational
**Version:** 1.0.0
