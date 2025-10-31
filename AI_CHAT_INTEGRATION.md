# AI Chat Integration Guide

This guide explains how the frontend chat interface is integrated with the AI service using Socket.IO for real-time communication.

## Architecture Overview

The chat system uses WebSocket connections (Socket.IO) to enable real-time, bidirectional communication between the frontend and the AI service:

```
Frontend (Next.js) <---> Socket.IO <---> AI Service (NestJS) <---> Ollama
     Port 3000                              Port 3004              Port 11434
```

## Components

### Backend Components

#### 1. AI Service (`/ai`)
- **Port**: 3004
- **WebSocket Namespace**: `/chat`
- **Main Files**:
  - `src/main.ts` - Service entry point with CORS configuration
  - `src/chat/chat.gateway.ts` - WebSocket gateway handling client connections
  - `src/chat/chat.service.ts` - Business logic for processing chat messages
  - `src/ollama/ollama.service.ts` - Integration with Ollama LLM
  - `src/mcp/mcp-tools.service.ts` - MCP tools for enhanced capabilities

#### 2. WebSocket Events

**Client → Server Events:**
- `chat_message` - Send a chat message
  ```typescript
  { message: string, conversationId?: string }
  ```
- `clear_conversation` - Clear conversation history
- `get_history` - Request conversation history
- `ping` - Health check

**Server → Client Events:**
- `connected` - Connection established
  ```typescript
  { message: string, clientId: string, timestamp: string }
  ```
- `chat_response` - AI response to user message
  ```typescript
  { message: string, toolsUsed?: string[], timestamp: string }
  ```
- `ai_typing` - AI is processing (typing indicator)
  ```typescript
  { isTyping: boolean }
  ```
- `chat_error` - Error occurred
  ```typescript
  { error: string, message: string, timestamp: string }
  ```
- `conversation_cleared` - Conversation was cleared
- `conversation_history` - Historical messages
- `pong` - Health check response

### Frontend Components

#### 1. Socket Hook (`/frontend/hooks/use-socket.ts`)

Custom React hook that manages WebSocket connections:

```typescript
const {
  socket,           // Socket.IO client instance
  isConnected,      // Connection status
  isTyping,         // AI typing indicator
  sendMessage,      // Send a chat message
  clearConversation,// Clear conversation
  getHistory,       // Get chat history
  disconnect,       // Disconnect from server
  connect,          // Connect to server
} = useSocket(onMessageReceived, onError)
```

**Features:**
- Automatic connection management
- Reconnection handling
- Typing indicators
- Error handling
- User authentication support

#### 2. Chat Interface (`/frontend/components/chat/chat-interface.tsx`)

Main chat UI component that:
- Displays messages
- Sends user messages via Socket.IO
- Shows typing indicators
- Displays connection status
- Handles errors gracefully

#### 3. Supporting Components
- `chat-message.tsx` - Individual message display
- `chat-input.tsx` - Message input with Send/Stop buttons
- `sidebar.tsx` - Chat history sidebar

## Setup Instructions

### 1. Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- npm or yarn
- Ollama (https://ollama.com/download)

### 2. Environment Configuration

**AI Service** (`/ai/.env`):
```env
NODE_ENV=development
PORT=3004
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gpt-oss
DATABASE_SERVICE_URL=http://localhost:3002
BACKEND_SERVICE_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend** (`/frontend/.env`):
```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3004
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3003
```

### 3. Install Dependencies

**AI Service:**
```bash
cd ai
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4. Start Services

**Start Ollama:**
```bash
ollama serve
```

**Pull the AI Model:**
```bash
ollama pull gpt-oss
# Or use another model like:
# ollama pull llama2
# ollama pull mistral
```

**Start AI Service:**
```bash
cd ai
npm run dev
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

The chat interface will automatically connect to the AI service.

## Usage

### Sending Messages

1. Type your message in the input field
2. Press `Enter` or click the Send button
3. Watch the typing indicator while AI processes your message
4. Receive the AI's response

### Connection Status

The connection status is shown in the header:
- 🟢 **Connected** - Ready to chat
- 🔴 **Disconnected** - Connection lost, attempting to reconnect

### Features

- **Real-time Communication**: Instant message delivery
- **Typing Indicators**: See when AI is processing
- **Auto-reconnection**: Automatic reconnection on disconnect
- **Error Handling**: User-friendly error messages
- **MCP Tools**: AI can use tools for enhanced capabilities
- **Conversation History**: Messages persist during session

## Development

### Adding New Events

**Backend (AI Service):**

1. Add event handler in `chat.gateway.ts`:
```typescript
@SubscribeMessage('your_event')
handleYourEvent(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
  // Handle event
  client.emit('response_event', { data: 'response' })
}
```

**Frontend:**

2. Update `use-socket.ts` hook:
```typescript
socket.on('response_event', (data) => {
  console.log('Response:', data)
  // Handle response
})
```

### Debugging

Enable debug logs by setting in your browser console:
```javascript
localStorage.debug = 'socket.io-client:*'
```

Or in the AI service:
```typescript
// In main.ts
import { Logger } from '@nestjs/common';
const logger = new Logger('WebSocket');
logger.debug('Debug message');
```

## Troubleshooting

### Connection Issues

**Problem**: Frontend can't connect to AI service

**Solutions**:
1. Verify AI service is running on port 3004
2. Check CORS configuration in `ai/src/main.ts`
3. Ensure `NEXT_PUBLIC_AI_SERVICE_URL` is set correctly
4. Check browser console for errors

### Ollama Issues

**Problem**: AI not responding or errors about Ollama

**Solutions**:
1. Verify Ollama is running: `ollama list`
2. Check model is available: `ollama pull gpt-oss`
3. Verify `OLLAMA_BASE_URL` in AI service `.env`
4. Check AI service logs for Ollama connection errors

### Message Not Sending

**Problem**: Messages not appearing or not being sent

**Solutions**:
1. Check connection status indicator
2. Verify WebSocket connection in browser DevTools (Network → WS)
3. Check AI service logs for errors
4. Ensure `sendMessage` is being called correctly

### Performance Issues

**Problem**: Slow responses or timeouts

**Solutions**:
1. Check Ollama resource usage
2. Use a smaller/faster model if needed
3. Increase timeout values in `chat.service.ts`
4. Monitor AI service memory usage

## API Reference

### Socket.IO Events

See the **Components** section above for detailed event payloads.

### useSocket Hook API

```typescript
interface UseSocketReturn {
  socket: Socket | null          // Socket.IO client instance
  isConnected: boolean           // Connection status
  isTyping: boolean              // AI typing indicator
  sendMessage: (message: string) => void
  clearConversation: () => void
  getHistory: () => void
  disconnect: () => void
  connect: () => void
}
```

## Security Considerations

1. **CORS**: Properly configured to only allow localhost in development
2. **Authentication**: User ID is passed in Socket.IO auth handshake
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Message Validation**: Messages are validated on the server
5. **Error Handling**: Sensitive error details are not exposed to clients

## Production Deployment

For production deployment:

1. Update CORS origins in `ai/src/main.ts`
2. Use environment-specific URLs
3. Enable HTTPS/WSS for secure WebSocket connections
4. Add rate limiting and DDoS protection
5. Implement proper authentication/authorization
6. Add monitoring and logging
7. Configure load balancing for WebSocket connections
8. Use Redis for multi-instance session management

## Related Documentation

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs in `logs/` directory
3. Check browser console for client-side errors
4. Verify all services are running
