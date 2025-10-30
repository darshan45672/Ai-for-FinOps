# Chat Integration Quick Start

## 🚀 Quick Start (3 Commands)

```bash
# Terminal 1 - Start Ollama
ollama serve

# Terminal 2 - Start AI Service (from project root)
cd ai && npm run dev

# Terminal 3 - Start Frontend (from project root)
cd frontend && npm run dev
```

Then open: **http://localhost:3000**

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/hooks/use-socket.ts` | WebSocket connection hook |
| `frontend/components/chat/chat-interface.tsx` | Main chat UI |
| `ai/src/chat/chat.gateway.ts` | WebSocket server |
| `ai/src/chat/chat.service.ts` | AI message processing |

## 🔌 WebSocket Events

### Send (Client → Server)
```typescript
socket.emit('chat_message', { message: 'Hello!' })
socket.emit('clear_conversation')
socket.emit('get_history')
```

### Receive (Server → Client)
```typescript
socket.on('chat_response', (data) => {
  console.log(data.message)      // AI response
  console.log(data.toolsUsed)    // Tools used (optional)
})

socket.on('ai_typing', ({ isTyping }) => {
  // Show/hide typing indicator
})

socket.on('chat_error', ({ error, message }) => {
  // Handle error
})
```

## 💡 Usage in Components

```typescript
import { useSocket } from '@/hooks/use-socket'

function MyComponent() {
  const handleMessage = (message: string, tools?: string[]) => {
    console.log('AI says:', message)
  }
  
  const { isConnected, isTyping, sendMessage } = useSocket(handleMessage)
  
  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {isTyping && <p>AI is typing...</p>}
      <button onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  )
}
```

## ⚙️ Environment Variables

**Frontend `.env`:**
```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3004
```

**AI Service `.env`:**
```env
PORT=3004
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss
CORS_ORIGINS=http://localhost:3000
```

## 🐛 Quick Debug

### Check Connection
```javascript
// Browser Console
localStorage.debug = 'socket.io-client:*'
```

### Verify Services
```bash
# Check if AI service is running
curl http://localhost:3004

# Check if Ollama is running
ollama list
```

### View Logs
- AI Service: Terminal running `npm run dev`
- Frontend: Browser DevTools Console
- WebSocket: DevTools → Network → WS tab

## 🔧 Common Issues

| Issue | Fix |
|-------|-----|
| Can't connect | Ensure AI service is running on port 3004 |
| No response | Check Ollama is running (`ollama list`) |
| CORS error | Verify CORS_ORIGINS in AI service `.env` |
| Slow responses | Try a smaller model (`ollama pull llama2:7b`) |

## 📊 Architecture

```
User Input
    ↓
[Frontend] → emit('chat_message')
    ↓
[Socket.IO WebSocket]
    ↓
[AI Gateway] → [Chat Service]
    ↓
[Ollama LLM] + [MCP Tools]
    ↓
[Chat Service] → emit('chat_response')
    ↓
[Socket.IO WebSocket]
    ↓
[Frontend] → Display Response
```

## 🎯 Testing Checklist

- [ ] AI service starts without errors
- [ ] Frontend shows green connection dot
- [ ] Can send "Hello" message
- [ ] See typing indicator
- [ ] Receive AI response
- [ ] Can send follow-up messages
- [ ] Connection status updates on disconnect

## 📚 Full Documentation

See these files for detailed information:
- `AI_CHAT_INTEGRATION.md` - Complete integration guide
- `CHAT_INTEGRATION_SUMMARY.md` - Implementation summary

## 🎨 UI Features

- ✅ Real-time messaging
- ✅ Typing indicators
- ✅ Connection status
- ✅ Auto-reconnect
- ✅ Message history
- ✅ Copy messages
- ✅ Regenerate responses
- ✅ Dark/Light theme

## 🚦 Status Indicators

| Color | Meaning |
|-------|---------|
| 🟢 Green (pulsing) | Connected and ready |
| 🔴 Red (solid) | Disconnected |

## 💻 Development

### Add New Event

1. **Backend** (`ai/src/chat/chat.gateway.ts`):
```typescript
@SubscribeMessage('my_event')
handleMyEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
  client.emit('my_response', { result: 'success' })
}
```

2. **Frontend** (`hooks/use-socket.ts`):
```typescript
socket.on('my_response', (data) => {
  console.log(data)
})
```

### Use Different Model

```bash
# Pull a different model
ollama pull mistral

# Update .env
OLLAMA_DEFAULT_MODEL=mistral
```

## 🎓 Learn More

- [Socket.IO Docs](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Ollama Models](https://ollama.com/library)

---

**Ready to chat!** 💬 Just start all three services and open localhost:3000
