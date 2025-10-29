# WebSocket Connection & Ollama Integration Fix

## Issues Fixed

### 1. Infinite WebSocket Reconnection Loop ✅

**Problem:**
The frontend was creating 30+ connections per second, causing the AI service logs to be flooded with connect/disconnect events.

**Root Cause:**
The `useSocket` hook had a `useEffect` with `connect` and `disconnect` functions in its dependency array. Since these were `useCallback` functions that depended on `user?.id`, `onMessageReceived`, and `onError`, they were being recreated on every render, causing the effect to run repeatedly.

**Solution:**
```typescript
// Before (WRONG):
useEffect(() => {
  if (options.autoConnect) {
    connect()
  }
  return () => {
    disconnect()
  }
}, [options.autoConnect, connect, disconnect]) // ❌ Causes infinite loop

// After (CORRECT):
useEffect(() => {
  if (options.autoConnect) {
    connect()
  }
  return () => {
    disconnect()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [options.autoConnect]) // ✅ Only re-run when autoConnect changes
```

**Files Modified:**
- `/frontend/hooks/use-socket.ts` (line 172-180)

---

### 2. Ollama Model Configuration Error ✅

**Problem:**
Chat messages were failing with error:
```
Ollama API error: Request failed with status code 404
```

**Root Cause:**
The AI service was configured to use model `gpt-oss` but the actual model installed in Ollama was `gpt-oss:20b`. Ollama requires the full model name including the tag.

**Solution:**
Updated the AI service environment configuration:

```bash
# Before (WRONG):
OLLAMA_DEFAULT_MODEL=gpt-oss

# After (CORRECT):
OLLAMA_DEFAULT_MODEL=gpt-oss:20b
```

**Files Modified:**
- `/ai/.env` (line 12)

**Verification:**
```bash
# Check available models
curl http://localhost:11434/api/tags

# Test model response
curl -s http://localhost:11434/api/generate \
  -d '{"model":"gpt-oss:20b","prompt":"Hello","stream":false}'
```

---

## Current Status

### ✅ Working Components

1. **WebSocket Connection**
   - Single stable connection maintained
   - No more reconnection loops
   - Connection status indicator working (🟢/🔴)

2. **AI Service**
   - Running on port 3004
   - CORS configured for localhost:3000
   - WebSocket gateway operational at `/chat`

3. **Ollama Integration**
   - Model `gpt-oss:20b` loaded and responding
   - API endpoint: `http://localhost:11434`
   - Streaming and non-streaming modes supported

4. **Frontend Chat Interface**
   - Socket.IO client connected
   - Message sending functionality ready
   - Error handling implemented
   - Typing indicators configured

---

## Testing the Integration

### 1. Check Service Status

```bash
# Verify AI service is running
lsof -i :3004 | grep LISTEN

# Check Ollama service
curl http://localhost:11434/api/tags

# View AI service logs
tail -f /tmp/ai-service.log
```

### 2. Test WebSocket Connection

Open browser console and verify:
- ✅ Single "Client connected" log in AI service
- ✅ No rapid connect/disconnect cycles
- ✅ Connection indicator shows green dot (🟢)

### 3. Test Chat Message

1. Navigate to chat interface at `http://localhost:3000/chat` (or wherever your chat is)
2. Send a test message: "Hello"
3. Verify:
   - Message appears in chat
   - AI service receives message (check logs)
   - Ollama processes the request
   - Response returns to frontend

---

## Architecture Overview

```
Frontend (Next.js)                  AI Service (NestJS)              Ollama
Port 3000                          Port 3004                        Port 11434
┌─────────────────┐               ┌──────────────────┐             ┌──────────┐
│                 │  WebSocket    │                  │   HTTP      │          │
│  ChatInterface  ├───────────────►  ChatGateway    ├─────────────►  GPT-OSS │
│                 │  (Socket.IO)  │                  │   POST      │  :20b    │
│  useSocket()    │               │  ChatService     │  /api/chat  │          │
│                 │◄───────────────┤                  │◄────────────┤          │
│  Message UI     │  Responses    │  OllamaService   │  Response   │          │
└─────────────────┘               └──────────────────┘             └──────────┘
```

---

## Key Configuration Files

### Frontend

**`.env`**
```properties
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3004
```

**`hooks/use-socket.ts`**
- WebSocket connection management
- Auto-reconnect logic
- Message sending/receiving
- Connection state tracking

**`components/chat/chat-interface.tsx`**
- Chat UI component
- Socket integration
- Message history
- Connection status display

### AI Service

**`.env`**
```properties
PORT=3004
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss:20b
DATABASE_SERVICE_URL=http://localhost:3002
BACKEND_SERVICE_URL=http://localhost:3001
```

**`src/main.ts`**
- CORS configuration
- WebSocket namespace setup
- Port configuration

**`src/chat/chat.gateway.ts`**
- WebSocket event handlers
- Connection lifecycle management
- Message routing

**`src/chat/chat.service.ts`**
- Message processing logic
- Ollama integration
- MCP tools orchestration

**`src/ollama/ollama.service.ts`**
- Ollama API wrapper
- Model management
- Chat, generate, embeddings endpoints

---

## Common Issues & Solutions

### Issue: "Chat error: {}" or "Ollama API error: 404"

**Solution:** Verify the model name matches exactly
```bash
# Check installed models
curl http://localhost:11434/api/tags

# Update .env to match
OLLAMA_DEFAULT_MODEL=<exact-model-name-from-above>

# Restart AI service
cd ai && npm run start:dev
```

### Issue: Infinite connection logs

**Solution:** Check useEffect dependencies in `use-socket.ts`
- Remove callbacks from dependency array
- Use stable references or memoized values

### Issue: Connection refused on port 3004

**Solution:** Ensure AI service is running
```bash
cd ai && npm run start:dev
```

### Issue: CORS errors

**Solution:** Verify CORS configuration in `ai/src/main.ts`
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
});
```

---

## Next Steps

- [ ] Test end-to-end message flow
- [ ] Verify typing indicators work
- [ ] Test conversation history persistence
- [ ] Implement error recovery mechanisms
- [ ] Add loading states for AI responses
- [ ] Test MCP tools integration
- [ ] Add message retry logic
- [ ] Implement rate limiting

---

## References

- **Socket.IO Documentation:** https://socket.io/docs/v4/
- **NestJS WebSockets:** https://docs.nestjs.com/websockets/gateways
- **Ollama API:** https://github.com/ollama/ollama/blob/main/docs/api.md
- **React Hooks Best Practices:** https://react.dev/reference/react/hooks

---

## Changelog

**2025-10-29**
- ✅ Fixed infinite WebSocket reconnection loop
- ✅ Updated Ollama model configuration to `gpt-oss:20b`
- ✅ Restarted AI service with correct configuration
- ✅ Verified stable connection established
- ✅ Tested Ollama integration successfully
