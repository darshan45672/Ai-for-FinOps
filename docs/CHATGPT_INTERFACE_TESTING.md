# ChatGPT Interface - Testing Guide

## Quick Test Steps

### Test 1: New Chat Flow
1. ✅ Navigate to `http://localhost:3001/`
2. ✅ Verify you see the welcome screen with "How can I help you today?"
3. ✅ Verify there are 3 suggestion cards visible
4. ✅ Click on one of the suggestions OR type a message
5. ✅ Send the message
6. ✅ Watch the URL change from `/` to `/chat/[some-id]`
7. ✅ Verify the AI responds
8. ✅ Verify both messages appear in the chat area

**Expected Result**: URL should be something like `http://localhost:3001/chat/cmhd7a77g090vs8wlx68w8kmy`

### Test 2: Page Refresh Persistence
1. ✅ While on a conversation URL (e.g., `/chat/[id]`)
2. ✅ Press F5 or Cmd+R to refresh the page
3. ✅ Verify the page reloads
4. ✅ Verify all messages are still visible
5. ✅ Verify you can send new messages
6. ✅ Verify the URL remains the same

**Expected Result**: Conversation persists after refresh, all messages intact.

### Test 3: Sidebar Conversations
1. ✅ Look at the left sidebar (desktop) or hamburger menu (mobile)
2. ✅ Verify you see conversations listed (not individual messages)
3. ✅ Each conversation should show:
   - Title (e.g., "Explain quantum computing")
   - Last message preview
   - Message count badge (e.g., "2 messages")
   - Relative timestamp (e.g., "5m ago")
4. ✅ Verify conversations are grouped by time (Today, Yesterday, etc.)

**Expected Result**: Sidebar shows conversation list, not message list.

### Test 4: New Chat Button
1. ✅ While viewing a conversation at `/chat/[id]`
2. ✅ Click the "New Chat" button in the sidebar
3. ✅ Verify you're navigated to `/` (root path)
4. ✅ Verify the chat area is empty
5. ✅ Verify you see the welcome screen again
6. ✅ Verify the previous conversation is still in the sidebar

**Expected Result**: New chat starts fresh, old conversation saved in sidebar.

### Test 5: Switching Between Conversations
1. ✅ Have at least 2 conversations in the sidebar
2. ✅ Click on conversation A in the sidebar
3. ✅ Verify URL changes to `/chat/[id-A]`
4. ✅ Verify conversation A messages load
5. ✅ Click on conversation B in the sidebar
6. ✅ Verify URL changes to `/chat/[id-B]`
7. ✅ Verify conversation B messages load

**Expected Result**: Can switch between conversations seamlessly.

### Test 6: Conversation Actions
1. ✅ Hover over a conversation in the sidebar
2. ✅ Verify a three-dot menu appears
3. ✅ Click the menu
4. ✅ Verify "Rename" and "Delete" options appear
5. ✅ Try renaming the conversation
6. ✅ Verify the title updates in the sidebar
7. ✅ Try deleting a conversation
8. ✅ Verify it's removed from the sidebar

**Expected Result**: Can rename and delete conversations.

### Test 7: Mobile Responsiveness
1. ✅ Resize browser to mobile width (< 768px) or use mobile device
2. ✅ Verify sidebar is hidden
3. ✅ Verify hamburger menu icon appears in header
4. ✅ Click hamburger menu
5. ✅ Verify sidebar opens as a drawer/sheet
6. ✅ Verify all sidebar functionality works in mobile view

**Expected Result**: Mobile-friendly interface with drawer navigation.

### Test 8: Empty States
1. ✅ Navigate to `/` (New Chat)
   - Should see: Large welcome message, suggestion cards, Sparkles icon
2. ✅ Navigate to `/chat/[id]` for a conversation with no messages
   - Should see: Simple "No messages yet" message
3. ✅ Navigate to `/chat/[invalid-id]`
   - Should see: Loading or error state

**Expected Result**: Different empty states for different contexts.

## Browser Console Checks

### Check for Errors
Open browser console (F12) and verify:
- ✅ No red error messages
- ✅ No "404 Not Found" for API calls
- ✅ Socket connection shows "Connected"
- ✅ No TypeScript compilation errors

### Expected Console Logs
You should see logs like:
```
[ChatGateway] Client connected: [socket-id]
[ChatGateway] Created new conversation: [conversation-id]
[ChatGateway] Saved user message to conversation [conversation-id]
[ChatGateway] Saved assistant message to conversation [conversation-id]
```

## Network Tab Checks

### API Calls to Verify
1. ✅ `GET /chat/conversations?userId=[user-id]` - Should return 200 with conversation list
2. ✅ `GET /chat/conversations/[id]/messages` - Should return 200 with message list
3. ✅ WebSocket connection to `ws://localhost:3004` - Should show "101 Switching Protocols"

## Common Issues & Solutions

### Issue: Blank screen on `/`
**Solution**: Check that `showEmptyState` prop is passed correctly in `app/page.tsx`

### Issue: URL doesn't change when sending message
**Solution**: Verify Socket.IO is returning conversationId in the response

### Issue: Conversations don't load in sidebar
**Solution**: 
1. Check DATABASE_SERVICE_URL is correct (http://localhost:3003)
2. Verify database service is running
3. Check browser console for API errors

### Issue: Refresh shows blank page
**Solution**: 
1. Verify useEffect is watching urlConversationId
2. Check loadConversationMessages is called correctly
3. Verify conversationId exists in database

### Issue: Sidebar shows individual messages instead of conversations
**Solution**: This should not happen - sidebar is already configured for conversations. If it does, check ChatHistory interface and API response format.

## Performance Checks

### Load Times
- ✅ Page load < 2 seconds
- ✅ Conversation switch < 1 second
- ✅ Message send response < 5 seconds (depends on AI)
- ✅ Sidebar search filters instantly

### Memory Usage
- Check browser dev tools → Memory
- Should not increase significantly over time
- Refresh if memory usage is > 500MB

## Accessibility Checks

- ✅ Can navigate with Tab key
- ✅ Can press Enter to send message
- ✅ Screen reader announces new messages
- ✅ All buttons have proper labels
- ✅ Proper heading hierarchy (h1, h2, h3)

## Final Verification

### Smoke Test Checklist
- [ ] Can create new conversation
- [ ] URL updates automatically
- [ ] Can refresh and stay on same conversation
- [ ] Sidebar shows conversations with correct info
- [ ] Can switch between conversations
- [ ] New Chat button works
- [ ] Conversations persist in database
- [ ] AI responses are saved
- [ ] Mobile view works correctly
- [ ] No console errors

## Test Data Cleanup

After testing, you may want to:
1. Delete test conversations from sidebar
2. Check database for orphaned data
3. Clear browser localStorage if needed

## Reporting Issues

If you find bugs, note:
1. URL you were on
2. Action you performed
3. Expected behavior
4. Actual behavior
5. Console errors (if any)
6. Browser and version

## Test Environment

- Frontend: http://localhost:3001
- AI Service: http://localhost:3004
- Database Service: http://localhost:3003
- Authentication Service: http://localhost:3002

All services must be running for full functionality.
