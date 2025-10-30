# Chat Persistence Implementation Guide

## Overview
This document describes the complete implementation of chat persistence in the AI-for-FinOps application, enabling conversations and messages to be stored in the database and survive page refreshes.

## Architecture

### Flow Diagram
```
Frontend (React) 
    ↓ Socket.IO (WebSocket)
AI Service (NestJS Gateway)
    ↓ HTTP/REST API
Database Service (NestJS + Prisma)
    ↓ Prisma ORM
PostgreSQL Database (Neon)
```

## Database Schema

### Conversation Model
```prisma
model Conversation {
  id        String    @id @default(uuid())
  title     String
  userId    String
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Message[]
}
```

### Message Model
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String
  role           MessageRole
  content        String
  toolsUsed      String[]     @default([])
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

## Implementation Details

### 1. Database Service (Port 3002)

#### API Endpoints

**Conversations:**
- `POST /chat/conversations` - Create new conversation
  ```json
  {
    "title": "Chat about Azure costs",
    "userId": "user-uuid"
  }
  ```

- `GET /chat/conversations?userId={userId}` - Get user's conversations
- `GET /chat/conversations/:id` - Get conversation by ID
- `PUT /chat/conversations/:id` - Update conversation title
- `DELETE /chat/conversations/:id` - Delete conversation

**Messages:**
- `POST /chat/messages` - Create new message
  ```json
  {
    "conversationId": "conv-uuid",
    "role": "USER",
    "content": "How can I reduce Azure costs?",
    "toolsUsed": []
  }
  ```

- `GET /chat/conversations/:id/messages` - Get all messages for conversation

#### Data Transfer Objects (DTOs)

All DTOs include class-validator decorators for validation:

```typescript
export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(MessageRole)
  @IsNotEmpty()
  role: MessageRole;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toolsUsed?: string[];
}
```

### 2. AI Service (Port 3004)

#### Chat Gateway Implementation

The WebSocket gateway handles real-time chat and database persistence:

**Key Features:**
1. **Auto-create conversations** - When user sends first message without conversationId
2. **Load conversation history** - Fetch messages from database when conversationId provided
3. **Save all messages** - Both user and assistant messages persisted to database
4. **Conversation context** - Maintain conversation state per socket connection

**Flow:**
```typescript
handleChatMessage() {
  1. Check if conversationId exists
  2. If not, create new conversation in database
  3. If yes, load message history from database
  4. Save user message to database
  5. Process with Ollama AI
  6. Save assistant response to database
  7. Emit response to client with conversationId
}
```

**Important Headers:**
```typescript
socketRef.current.emit('chat_message', {
  message: content,
  conversationId: currentConversationId,
  userId: user?.id,
})
```

### 3. Frontend Implementation

#### useSocket Hook Updates

**New Features:**
- Track `conversationId` state
- Pass `userId` in socket auth
- Include `conversationId` in chat_message payload
- Receive and update `conversationId` from server response

```typescript
const {
  isConnected,
  isTyping,
  sendMessage,
  conversationId,
  setConversationId,
} = useSocket(handleMessageReceived, handleSocketError)
```

#### ChatInterface Component

**Conversation Management:**

1. **Load conversations on mount:**
   ```typescript
   useEffect(() => {
     if (user?.id) {
       loadUserConversations()
     }
   }, [user?.id])
   ```

2. **Create new chat:**
   - Clears messages
   - Resets conversationId
   - Server auto-creates conversation on first message

3. **Select existing chat:**
   - Loads messages from database
   - Sets conversationId
   - Displays conversation history

4. **Delete conversation:**
   - Calls DELETE endpoint
   - Removes from UI
   - Starts new chat if current was deleted

5. **Rename conversation:**
   - Calls PUT endpoint
   - Updates title in UI

**Message Persistence Flow:**
```
1. User types message
2. Add to UI immediately
3. Send via Socket.IO with userId and conversationId
4. AI Service creates/loads conversation
5. AI Service saves user message
6. AI processes and responds
7. AI Service saves assistant message
8. Response sent back with conversationId
9. UI updates with conversationId
10. Sidebar refreshes to show updated conversation
```

## Environment Variables

### Database Service
```env
DATABASE_URL="postgresql://..."
PORT=3002
```

### AI Service
```env
DATABASE_SERVICE_URL="http://localhost:3002"
OLLAMA_DEFAULT_MODEL="gpt-oss:20b"
PORT=3004
```

### Frontend
```env
NEXT_PUBLIC_DATABASE_SERVICE_URL="http://localhost:3002"
NEXT_PUBLIC_AI_SERVICE_URL="http://localhost:3004"
```

## Testing the Implementation

### 1. Start All Services
```bash
# Terminal 1 - Database Service
cd database && npm run start:dev

# Terminal 2 - AI Service  
cd ai && npm run start:dev

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### 2. Test Flow

**Create New Conversation:**
1. Open chat interface
2. Type message
3. Send message
4. Check that conversationId is created
5. Verify sidebar shows new conversation

**Verify Persistence:**
1. Send several messages in conversation
2. Refresh browser page
3. Click on conversation in sidebar
4. Verify all messages load correctly

**Test Database Directly:**
```bash
# Check conversations
curl http://localhost:3002/chat/conversations?userId=YOUR_USER_ID

# Check messages for a conversation
curl http://localhost:3002/chat/conversations/CONVERSATION_ID/messages
```

### 3. Debugging

**Check Database Service Logs:**
```bash
tail -f logs/database.log
```

**Check AI Service Logs:**
```bash
tail -f logs/ai.log
```

**Common Issues:**

1. **400 Bad Request on POST /chat/conversations**
   - Ensure DTOs have validation decorators
   - Check request payload matches DTO structure

2. **Conversations not showing in sidebar**
   - Verify user is authenticated
   - Check userId is being passed correctly
   - Inspect network tab for API calls

3. **Messages not persisting**
   - Confirm conversationId is being sent to socket
   - Check AI service logs for database errors
   - Verify DATABASE_SERVICE_URL is correct

## API Response Examples

### Create Conversation Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Chat about Azure costs",
  "userId": "user-123",
  "isActive": true,
  "createdAt": "2025-10-30T20:00:00.000Z",
  "updatedAt": "2025-10-30T20:00:00.000Z"
}
```

### Get Conversations Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Chat about Azure costs",
    "userId": "user-123",
    "isActive": true,
    "createdAt": "2025-10-30T20:00:00.000Z",
    "updatedAt": "2025-10-30T20:05:00.000Z",
    "messageCount": 8,
    "lastMessage": {
      "content": "I recommend reviewing your storage accounts...",
      "createdAt": "2025-10-30T20:05:00.000Z"
    }
  }
]
```

### Get Messages Response
```json
[
  {
    "id": "msg-1",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "USER",
    "content": "How can I reduce Azure costs?",
    "toolsUsed": [],
    "createdAt": "2025-10-30T20:00:30.000Z"
  },
  {
    "id": "msg-2",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "ASSISTANT",
    "content": "There are several ways to reduce Azure costs...",
    "toolsUsed": ["azure_cost_analysis"],
    "createdAt": "2025-10-30T20:00:45.000Z"
  }
]
```

## Key Design Decisions

1. **Auto-create conversations**: Simplifies UX - users don't need to explicitly create conversations
2. **Server-side conversation creation**: Ensures proper validation and database consistency
3. **Lazy loading messages**: Only load when conversation is selected to improve performance
4. **Real-time updates**: Socket.IO provides instant feedback while database ensures persistence
5. **Cascade deletes**: When conversation is deleted, all messages are automatically removed

## Future Enhancements

1. **Conversation sharing** - Share conversations between users
2. **Export conversations** - Export as PDF, Markdown, etc.
3. **Search conversations** - Full-text search across messages
4. **Conversation analytics** - Track usage, popular topics, etc.
5. **Message editing** - Allow users to edit sent messages
6. **Conversation archiving** - Archive old conversations without deleting
7. **Conversation tags** - Categorize conversations with tags
8. **Conversation templates** - Pre-defined conversation starters

## References

- NestJS WebSocket Gateway: https://docs.nestjs.com/websockets/gateways
- Prisma Schema: https://www.prisma.io/docs/concepts/components/prisma-schema
- Socket.IO Client: https://socket.io/docs/v4/client-api/
- class-validator: https://github.com/typestack/class-validator
