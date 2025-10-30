# Chat Integration Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                           │  │
│  │                      (Port 3000)                              │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │         Chat Interface Component                       │  │  │
│  │  │                                                          │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │  │
│  │  │  │          useSocket() Hook                        │  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  │  • isConnected: boolean                          │  │  │  │
│  │  │  │  • isTyping: boolean                             │  │  │  │
│  │  │  │  • sendMessage(msg: string)                      │  │  │  │
│  │  │  │  • clearConversation()                           │  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  │  Socket.IO Client Instance                       │  │  │  │
│  │  │  └────────────────┬───────────────────────────────┘  │  │  │
│  │  └───────────────────┼──────────────────────────────────┘  │  │
│  └────────────────────┬─┼──────────────────────────────────────┘  │
└────────────────────┬──┼─┼──────────────────────────────────────────┘
                     │  │ │
                     │  │ └─── WebSocket Events
                     │  │        • chat_message
                     │  │        • chat_response
                     │  │        • ai_typing
                     │  │        • chat_error
                     │  │
                     │  └────── HTTP/HTTPS (fallback)
                     │
                     └────────── WebSocket Connection (Primary)
                                  ws://localhost:3004/chat
                                  │
┌────────────────────────────────┼───────────────────────────────────┐
│                                ▼                                    │
│                    NestJS AI Service                                │
│                      (Port 3004)                                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │              Chat Gateway                                   │    │
│  │          (@WebSocketGateway)                               │    │
│  │                                                             │    │
│  │  • handleConnection()      ──┐                            │    │
│  │  • handleDisconnect()        │                            │    │
│  │  • handleChatMessage()       ├──► Socket Event Handlers   │    │
│  │  • handleClearConversation() │                            │    │
│  │  • handleGetHistory()      ──┘                            │    │
│  │                                                             │    │
│  └───────────────────┬─────────────────────────────────────┘    │
│                      │                                            │
│                      ▼                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Chat Service                                   │  │
│  │                                                             │  │
│  │  processMessage(userMessage, conversationHistory)          │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  1. Add system prompt                               │  │  │
│  │  │  2. Call Ollama with tools                          │  │  │
│  │  │  3. Execute tool calls (MCP)                        │  │  │
│  │  │  4. Add tool results to conversation                │  │  │
│  │  │  5. Get final response                              │  │  │
│  │  │  6. Return formatted response                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  └───────┬─────────────────────────────────┬───────────────┘  │
│          │                                  │                   │
│          ▼                                  ▼                   │
│  ┌─────────────────┐             ┌──────────────────────┐     │
│  │  Ollama Service │             │   MCP Tools Service   │     │
│  │                 │             │                       │     │
│  │  • chat()       │             │  • getAvailableTools()│     │
│  │  • generate()   │             │  • executeTool()      │     │
│  │  • embeddings() │             │                       │     │
│  └────────┬────────┘             └──────────┬────────────┘     │
└───────────┼───────────────────────────────┼──────────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌────────────────────────┐
│   Ollama Runtime      │        │   Database Service     │
│   (Port 11434)        │        │   (Port 3002)          │
│                       │        │                        │
│  • LLM Models         │        │  • User queries        │
│  • Embeddings         │        │  • Data operations     │
│  • Token generation   │        │  • Azure integration   │
└───────────────────────┘        └────────────────────────┘
```

## Message Flow Sequence

```
┌──────┐                 ┌──────────┐                ┌──────────┐               ┌────────┐
│ User │                 │ Frontend │                │ AI Gateway│               │Ollama  │
└──┬───┘                 └────┬─────┘                └─────┬────┘               └───┬────┘
   │                          │                            │                        │
   │ 1. Type "Hello"          │                            │                        │
   ├─────────────────────────►│                            │                        │
   │                          │                            │                        │
   │                          │ 2. emit('chat_message')    │                        │
   │                          ├───────────────────────────►│                        │
   │                          │                            │                        │
   │                          │ 3. emit('ai_typing', true) │                        │
   │                          │◄───────────────────────────┤                        │
   │                          │                            │                        │
   │ 4. Show typing dots      │                            │ 5. Process message     │
   │◄─────────────────────────┤                            ├───────────────────────►│
   │        ● ● ●             │                            │                        │
   │                          │                            │ 6. Generate response   │
   │                          │                            │◄───────────────────────┤
   │                          │                            │                        │
   │                          │ 7. emit('ai_typing',false) │                        │
   │                          │◄───────────────────────────┤                        │
   │                          │                            │                        │
   │                          │ 8. emit('chat_response')   │                        │
   │                          │◄───────────────────────────┤                        │
   │                          │                            │                        │
   │ 9. Display AI response   │                            │                        │
   │◄─────────────────────────┤                            │                        │
   │                          │                            │                        │
```

## Component Hierarchy

```
ChatInterface
│
├─── Header
│    ├─── Mobile Menu (Sheet)
│    │    └─── Sidebar
│    ├─── App Title & Icon
│    ├─── Connection Status Indicator 🟢/🔴
│    ├─── Theme Toggle
│    └─── User Menu (Dropdown)
│
├─── Messages Area
│    ├─── Empty State (when no messages)
│    │    ├─── Icon
│    │    ├─── Welcome Text
│    │    └─── Suggestion Buttons
│    │
│    └─── Message List (ScrollArea)
│         ├─── ChatMessage (role: user)
│         ├─── ChatMessage (role: assistant)
│         ├─── ChatMessage (role: user)
│         ├─── ChatMessage (role: assistant)
│         └─── Typing Indicator (when isTyping)
│
└─── Chat Input
     ├─── Textarea (auto-resize)
     ├─── Send Button
     └─── Stop Button (when typing)
```

## WebSocket Event Flow

```
CONNECTION LIFECYCLE
════════════════════

1. Component Mount
   useSocket() hook initializes
          │
          ▼
2. Socket.IO Connection
   io('http://localhost:3004/chat')
          │
          ▼
3. Server Receives Connection
   handleConnection(client: Socket)
          │
          ▼
4. Server Emits 'connected'
   { message, clientId, timestamp }
          │
          ▼
5. Client Updates State
   setIsConnected(true)
          │
          ▼
6. UI Shows Green Indicator 🟢
```

```
MESSAGE LIFECYCLE
═════════════════

1. User Types & Presses Enter
          │
          ▼
2. handleSendMessage(content)
          │
          ▼
3. Add User Message to UI
   setMessages([...messages, userMsg])
          │
          ▼
4. sendSocketMessage(content)
   socket.emit('chat_message', { message })
          │
          ▼
5. Server Receives Message
   @SubscribeMessage('chat_message')
          │
          ▼
6. Server Emits Typing Indicator
   client.emit('ai_typing', { isTyping: true })
          │
          ▼
7. UI Shows Typing Dots
   {isTyping && <TypingIndicator />}
          │
          ▼
8. Server Processes with AI
   chatService.processMessage()
          │
          ├─► Call Ollama
          ├─► Execute MCP Tools
          └─► Format Response
          │
          ▼
9. Server Emits Response
   client.emit('chat_response', { message, toolsUsed })
          │
          ▼
10. Client Receives Response
    handleMessageReceived(message, toolsUsed)
          │
          ▼
11. Add AI Message to UI
    setMessages([...messages, aiMsg])
          │
          ▼
12. Server Stops Typing Indicator
    client.emit('ai_typing', { isTyping: false })
```

## State Management

```
FRONTEND STATE
══════════════

┌──────────────────────────────────────┐
│      ChatInterface Component         │
│                                      │
│  Local State:                        │
│  ├─ messages: Message[]              │
│  ├─ chatHistory: ChatHistory[]       │
│  ├─ currentChatId?: string           │
│  └─ isMobileMenuOpen: boolean        │
│                                      │
│  Socket Hook State:                  │
│  ├─ isConnected: boolean             │
│  ├─ isTyping: boolean                │
│  └─ socket: Socket | null            │
│                                      │
│  Auth Context:                       │
│  ├─ user?: User                      │
│  └─ signOut: () => void              │
└──────────────────────────────────────┘
```

```
BACKEND STATE
═════════════

┌──────────────────────────────────────┐
│         ChatGateway                  │
│                                      │
│  conversations: Map<string, {        │
│    messages: ChatMessage[],          │
│    userId?: string                   │
│  }>                                  │
│                                      │
│  Key: Socket Client ID               │
│  Value: Conversation State           │
└──────────────────────────────────────┘
```

## File Structure

```
Ai-for-FinOps/
│
├─── frontend/
│    ├─── components/
│    │    └─── chat/
│    │         ├─── chat-interface.tsx    ← Main chat UI
│    │         ├─── chat-message.tsx      ← Message display
│    │         ├─── chat-input.tsx        ← Input field
│    │         └─── sidebar.tsx           ← Chat history
│    │
│    ├─── hooks/
│    │    └─── use-socket.ts              ← WebSocket hook ⭐
│    │
│    ├─── contexts/
│    │    └─── auth-context.tsx           ← User auth
│    │
│    └─── .env
│         └─── NEXT_PUBLIC_AI_SERVICE_URL
│
├─── ai/
│    ├─── src/
│    │    ├─── main.ts                    ← Entry point with CORS ⭐
│    │    ├─── chat/
│    │    │    ├─── chat.gateway.ts       ← WebSocket server ⭐
│    │    │    ├─── chat.service.ts       ← AI logic ⭐
│    │    │    └─── chat.module.ts
│    │    ├─── ollama/
│    │    │    └─── ollama.service.ts     ← LLM integration
│    │    └─── mcp/
│    │         └─── mcp-tools.service.ts  ← Tool execution
│    │
│    └─── .env
│         ├─── PORT=3004
│         └─── OLLAMA_BASE_URL
│
└─── Documentation/
     ├─── AI_CHAT_INTEGRATION.md          ← Full guide
     ├─── CHAT_INTEGRATION_SUMMARY.md     ← Technical summary
     ├─── CHAT_QUICK_START.md             ← Quick reference
     └─── INTEGRATION_COMPLETE.md         ← Completion report

⭐ = Key integration files
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│                                                          │
│  React 19.2.0 | Next.js 15.5.4 | Tailwind CSS 4        │
│  Radix UI | Lucide Icons | TypeScript 5                │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  COMMUNICATION LAYER                     │
│                                                          │
│  Socket.IO Client 4.8.1 ◄──WebSocket──► Socket.IO      │
│  (Browser)                                (Server)      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     BUSINESS LAYER                       │
│                                                          │
│  NestJS | Chat Service | Conversation Management        │
│  WebSocket Gateways | Event Handlers                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                     │
│                                                          │
│  Ollama Service | MCP Tools Service                     │
│  Database Client | HTTP Clients                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
│                                                          │
│  Ollama LLM | PostgreSQL | Azure APIs                   │
└─────────────────────────────────────────────────────────┘
```

## Connection Status States

```
STATES
══════

┌────────────────┐
│ NOT CONNECTED  │  Initial state, component not mounted
└────────────────┘
        │
        │ useSocket hook initializes
        ▼
┌────────────────┐
│  CONNECTING    │  Socket.IO attempting connection
└────────────────┘
        │
        ├─► Success
        │   ▼
        │   ┌────────────────┐
        │   │   CONNECTED    │  🟢 Green pulsing dot
        │   └────────────────┘
        │           │
        │           │ Network issue / Server down
        │           ▼
        │   ┌────────────────┐
        │   │  RECONNECTING  │  Attempting to reconnect
        │   └────────────────┘
        │           │
        │           ├─► Success: Back to CONNECTED
        │           └─► Failure: Back to DISCONNECTED
        │
        └─► Failure
            ▼
        ┌────────────────┐
        │  DISCONNECTED  │  🔴 Red solid dot
        └────────────────┘
                │
                │ Retry (automatic, up to 5 times)
                ▼
        ┌────────────────┐
        │  CONNECTING    │
        └────────────────┘
```

## Visual UI Elements

```
HEADER
══════
┌──────────────────────────────────────────────────────────────┐
│ ☰  ✨ AI Chat  🟢 Connected    [🌙]  [👤]                   │
└──────────────────────────────────────────────────────────────┘

EMPTY STATE
═══════════
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                     💬                                        │
│                                                               │
│               Start a conversation                            │
│      Ask me anything or try one of these suggestions:        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Explain quantum computing in simple terms             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Help me plan a weekend project                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘

MESSAGE VIEW
════════════
┌──────────────────────────────────────────────────────────────┐
│  [U] How are you?                                             │
│                                                               │
│  [AI] I'm doing great! How can I help you today?             │
│      [📋] [👍] [👎] [🔄]                                     │
│                                                               │
│  [U] Tell me about FinOps                                     │
│                                                               │
│  [AI] ● ● ● (typing...)                                      │
└──────────────────────────────────────────────────────────────┘

INPUT AREA
══════════
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Type your message...                              [➤]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│ Press Enter to send, Shift+Enter for new line               │
└──────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- 🟢 Connected (green pulsing)
- 🔴 Disconnected (red solid)
- ● ● ● Typing indicator
- [U] User message
- [AI] AI message
- ⭐ Key files in integration

This visual guide provides a comprehensive overview of the chat integration architecture, flows, and UI elements.
