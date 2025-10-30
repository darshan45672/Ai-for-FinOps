# Chat Persistence Quick Test Guide

## Prerequisites
✅ All services running (database, AI, frontend)
✅ User authenticated in frontend
✅ Database migration applied

## Quick Test Steps

### 1. Test Conversation Creation
```bash
# Start services
./start-services.sh

# Visit frontend
open http://localhost:3000

# Login and navigate to chat
# Send a message "Hello, test message"
# ✓ Check sidebar shows new conversation
# ✓ Check conversationId appears in browser console
```

### 2. Test Message Persistence
```bash
# Send 3-5 messages in the conversation
# Refresh the browser (Cmd+R / Ctrl+R)
# Click on the conversation in sidebar
# ✓ All messages should reload
```

### 3. Verify Database
```bash
# Check conversations in database
curl "http://localhost:3002/chat/conversations?userId=YOUR_USER_ID" | jq

# Check messages for specific conversation
curl "http://localhost:3002/chat/conversations/CONVERSATION_ID/messages" | jq
```

### 4. Test Delete Conversation
```bash
# In UI: Click three dots on conversation → Delete
# ✓ Conversation removed from sidebar
# ✓ New chat started automatically

# Verify in database
curl "http://localhost:3002/chat/conversations?userId=YOUR_USER_ID" | jq
# Should not show deleted conversation
```

### 5. Test Rename Conversation
```bash
# In UI: Click three dots on conversation → Rename
# Enter new title → Save
# ✓ Title updates in sidebar
# ✓ Refresh page - title persists
```

## Debugging Commands

### Check Service Status
```bash
# Database service
lsof -i :3002 | grep LISTEN

# AI service
lsof -i :3004 | grep LISTEN

# Frontend
lsof -i :3000 | grep LISTEN
```

### View Logs
```bash
# Database service logs
tail -f logs/database.log

# AI service logs  
tail -f logs/ai.log

# Frontend logs (check browser console)
```

### Test API Endpoints Directly

**Create Conversation:**
```bash
curl -X POST http://localhost:3002/chat/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manual Test Chat",
    "userId": "test-user-123"
  }' | jq
```

**Get User Conversations:**
```bash
curl "http://localhost:3002/chat/conversations?userId=test-user-123" | jq
```

**Create Message:**
```bash
curl -X POST http://localhost:3002/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "CONVERSATION_ID",
    "role": "USER",
    "content": "Test message"
  }' | jq
```

**Get Conversation Messages:**
```bash
curl "http://localhost:3002/chat/conversations/CONVERSATION_ID/messages" | jq
```

## Expected Behaviors

### ✅ Success Indicators
- New conversations appear in sidebar immediately
- Conversation titles auto-generated from first message
- Messages persist after page refresh
- Multiple conversations can exist
- Deleting conversation works without errors
- Renaming conversation updates immediately

### ❌ Common Issues

**Issue: "Not connected to chat service"**
- Solution: Check AI service is running on port 3004
- Verify NEXT_PUBLIC_AI_SERVICE_URL in frontend .env

**Issue: "Failed to save user message"**
- Solution: Check database service is running on port 3002
- Verify DATABASE_SERVICE_URL in AI service .env
- Check database logs for errors

**Issue: Conversations not loading in sidebar**
- Solution: Verify user is authenticated
- Check browser console for API errors
- Verify userId is being passed correctly

**Issue: Messages don't persist**
- Solution: Check conversationId is being sent in socket payload
- Verify AI service logs show "Saved user message" and "Saved assistant message"
- Check database connection

## Expected Console Logs

### Frontend (Browser Console)
```
Connected to AI service
Chat connection established: {message: "Connected to AI FinOps Assistant", ...}
Received chat response: {message: "...", conversationId: "...", ...}
```

### AI Service
```
[ChatGateway] Client connected: socketId
[ChatGateway] Received message from socketId: Hello, test message...
[ChatGateway] Created new conversation: conv-uuid
[ChatGateway] Saved user message to conversation conv-uuid
[ChatGateway] Saved assistant message to conversation conv-uuid
[ChatGateway] Sent response to socketId
```

### Database Service
```
[ChatController] POST /chat/conversations
[ChatController] POST /chat/messages
[ChatController] GET /chat/conversations/:id/messages
```

## Performance Checks

### Response Times (Expected)
- Create conversation: < 200ms
- Save message: < 100ms
- Load messages: < 300ms
- Get conversations: < 200ms

### Test with Multiple Conversations
1. Create 5-10 conversations
2. Send messages in each
3. Refresh page
4. Click through each conversation
5. ✓ All should load quickly
6. ✓ No lag or errors

## Clean Up

### Reset Database (if needed)
```bash
cd database
npx prisma migrate reset
npx prisma migrate deploy
```

### Clear Test Data
```bash
# Delete all test user conversations
curl -X DELETE "http://localhost:3002/chat/conversations/CONVERSATION_ID"
```

## Troubleshooting Checklist

- [ ] Database service running on port 3002?
- [ ] AI service running on port 3004?
- [ ] Frontend running on port 3000?
- [ ] User authenticated in frontend?
- [ ] DATABASE_URL configured correctly?
- [ ] DATABASE_SERVICE_URL configured in AI service?
- [ ] Prisma schema up to date?
- [ ] Migration applied successfully?
- [ ] ValidationPipe enabled in database service?
- [ ] DTOs have validation decorators?
- [ ] CORS enabled for localhost:3000?
- [ ] Socket.IO connection established?
- [ ] userId being passed in socket auth?
- [ ] conversationId being sent in chat_message?

## Success Criteria

When everything works correctly:

1. ✅ User sends message → Conversation auto-created
2. ✅ Conversation appears in sidebar with auto-generated title
3. ✅ Messages persist after page refresh
4. ✅ Clicking conversation loads all messages
5. ✅ Delete conversation removes it from database and UI
6. ✅ Rename conversation updates title
7. ✅ Multiple conversations work independently
8. ✅ No errors in any service logs
9. ✅ Fast response times (<300ms)
10. ✅ Real-time updates work smoothly

---

**Ready to test!** Follow steps 1-5 above and check off each success indicator.
