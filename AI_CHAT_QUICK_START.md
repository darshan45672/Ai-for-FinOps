# AI Chat Service - Quick Start Guide

## What We've Built

A complete AI-powered chat system for FinOps that:
- ✅ Uses Ollama (local LLM) with GPT-OSS model
- ✅ Implements Model Context Protocol (MCP) for tool calling
- ✅ Connects to your database to fetch real Azure resource data
- ✅ Uses WebSocket (Socket.IO) for real-time chat
- ✅ Supports conversation history and context
- ✅ Provides intelligent cost and resource analysis

## Architecture

```
┌─────────────┐ WebSocket  ┌──────────────┐
│  Frontend   │◄──────────►│  AI Service  │
│ (Port 3000) │            │ (Port 3003)  │
└─────────────┘            └──────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
              │  Ollama    │ │Database│ │  Backend   │
              │(Port 11434)│ │(3002)  │ │  (3001)    │
              └────────────┘ └────────┘ └────────────┘
```

## Prerequisites

### 1. Install Ollama Locally
```bash
# macOS
brew install ollama

# Or download from https://ollama.com/download

# Verify installation
ollama --version
```

### 2. Pull GPT-OSS Model
```bash
ollama pull gpt-oss

# Verify model is available
ollama list
```

### 3. Start Ollama Service
```bash
# Ollama usually starts automatically
# If not, run:
ollama serve

# Verify it's running
curl http://localhost:11434/
```

## Installation

### 1. Install Dependencies
```bash
cd ai
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env if needed (defaults should work)
nano .env
```

### 3. Start the AI Service
```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The service will start on **http://localhost:3003**

## API Endpoints

### REST API
- **Swagger Docs**: http://localhost:3003/api/docs
- **Health Check**: http://localhost:3003/health
- **AI Health**: http://localhost:3003/ai/health

### WebSocket
- **Namespace**: `/chat`
- **URL**: `ws://localhost:3003/chat`

## Testing the Chat

### Using cURL (REST API)
```bash
# Test Ollama connection
curl http://localhost:3003/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Hello!"
    }]
  }'
```

### Using WebSocket (from browser console)
```javascript
// Connect to chat
const socket = io('http://localhost:3003/chat');

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Listen for responses
socket.on('chat_response', (data) => {
  console.log('AI Response:', data.message);
  console.log('Tools Used:', data.toolsUsed);
});

// Listen for typing indicator
socket.on('ai_typing', (data) => {
  console.log('AI is typing:', data.isTyping);
});

// Send a message
socket.emit('chat_message', {
  message: 'What are my Azure resources?'
});

// Clear conversation
socket.emit('clear_conversation');

// Get history
socket.emit('get_history');
```

## MCP Tools Available

The AI can use these tools to fetch real data:

1. **get_azure_resources** - Query Azure resources
   ```
   "Show me all virtual machines"
   "What resources are in East US?"
   "List stopped resources"
   ```

2. **get_resource_costs** - Get cost information
   ```
   "What are my costs for the last 7 days?"
   "Show costs for the production resource group"
   ```

3. **get_cost_summary** - Get aggregated costs
   ```
   "Summarize my costs by service"
   "Show daily cost breakdown for this month"
   ```

4. **get_activity_logs** - Query activity logs
   ```
   "Show me recent errors"
   "What operations happened today?"
   ```

5. **get_resource_utilization** - Get metrics
   ```
   "What's the utilization of my VMs?"
   ```

6. **analyze_cost_trends** - Analyze trends
   ```
   "Are there any cost spikes?"
   "Analyze my spending trends"
   ```

7. **get_subscription_info** - Get subscription details
   ```
   "What subscriptions do I have?"
   ```

## Example Conversations

### 1. Resource Inquiry
```
User: What Azure resources do I have running?
AI: [Uses get_azure_resources] 
    You currently have 15 running resources:
    - 5 Virtual Machines
    - 3 Storage Accounts
    - 2 SQL Databases
    ...
```

### 2. Cost Analysis
```
User: Show me my costs for the last month
AI: [Uses get_resource_costs]
    Your total costs for the last 30 days: $1,234.56
    Top spending services:
    - Virtual Machines: $567.89
    - Storage: $234.56
    ...
```

### 3. Anomaly Detection
```
User: Are there any unusual cost spikes?
AI: [Uses analyze_cost_trends]
    Yes, I detected a 45% cost increase on Jan 15th.
    The spike was caused by:
    - New VM deployment in West US ($123.45)
    - Increased storage usage ($45.67)
```

## Frontend Integration

### Install Socket.IO Client
```bash
cd ../frontend
npm install socket.io-client
```

### Create Chat Component
```typescript
// components/chat/ai-chat.tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function AIChat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Connect to chat
    const newSocket = io('http://localhost:3003/chat');

    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    newSocket.on('chat_response', (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        toolsUsed: data.toolsUsed,
        timestamp: data.timestamp
      }]);
      setIsTyping(false);
    });

    newSocket.on('ai_typing', (data) => {
      setIsTyping(data.isTyping);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (!socket || !input.trim()) return;

    // Add user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: input
    }]);

    // Send to server
    socket.emit('chat_message', { message: input });
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.toolsUsed && (
              <small>Tools: {msg.toolsUsed.join(', ')}</small>
            )}
          </div>
        ))}
        {isTyping && <div className="typing">AI is thinking...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your Azure resources..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## Troubleshooting

### Ollama Not Running
```bash
# Check if Ollama is running
curl http://localhost:11434/

# If not, start it
ollama serve

# Or restart
pkill ollama && ollama serve
```

### Model Not Found
```bash
# Pull the model again
ollama pull gpt-oss

# Verify
ollama list
```

### WebSocket Connection Failed
- Check CORS settings in `main.ts`
- Ensure frontend is on allowed origin
- Check firewall settings

### Tools Not Working
- Ensure database service is running on port 3002
- Ensure backend service is running on port 3001
- Check service URLs in `.env`

### TypeScript Errors
```bash
# Install dependencies
npm install

# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Performance Tips

### 1. Preload Model
```bash
# Keep model in memory
ollama run gpt-oss ""
```

### 2. Adjust Temperature
Lower temperature = more deterministic responses
```typescript
options: {
  temperature: 0.3  // For factual responses
}
```

### 3. Connection Pooling
The HttpModule already uses connection pooling for database queries.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start Ollama: `ollama serve`
3. ✅ Pull model: `ollama pull gpt-oss`
4. ✅ Start AI service: `npm run start:dev`
5. 🚀 Integrate with frontend
6. 📊 Add chat persistence to database
7. 🔒 Add authentication to WebSocket

## Resources

- **Ollama Docs**: https://github.com/ollama/ollama
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **MCP Specification**: https://modelcontextprotocol.io/
- **API Docs**: http://localhost:3003/api/docs

## Support

For issues:
1. Check logs: `npm run start:dev` (shows all logs)
2. Test Ollama: `curl http://localhost:11434/`
3. Test service: `curl http://localhost:3003/health`
4. Check WebSocket: Use browser dev tools Network tab

Happy coding! 🤖✨
