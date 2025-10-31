# Sidebar Actions Menu Implementation

## Overview
Implemented a ChatGPT-style 3-dot menu for each chat item in the sidebar with Share, Rename, Archive, and Delete actions.

## Features

### 1. **Hover-Revealed Menu**
- 3-dot menu button (MoreHorizontal icon) appears on hover
- Also visible when the chat is active
- Smooth opacity transition
- Positioned on the right side of each chat item

### 2. **Menu Actions**

#### Share
- Icon: Share2 (upload/share icon)
- Functionality: Placeholder for share feature

#### Rename
- Icon: PenSquare (edit/pen icon)
- Opens a dialog to rename the conversation
- Pre-filled with current chat title
- Enter key to confirm, Escape to cancel
- Only saves if the name is different and not empty

#### Archive
- Icon: Archive (archive box icon)
- Functionality: Placeholder for archive feature

#### Delete
- Icon: Trash2 (trash bin icon)
- Red/destructive styling
- Separated from other actions with a divider
- Immediately calls `onDelete()` callback

### 3. **Rename Dialog**
```tsx
<Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Rename chat</DialogTitle>
      <DialogDescription>
        Enter a new name for this conversation
      </DialogDescription>
    </DialogHeader>
    <Input
      value={renameValue}
      onChange={(e) => setRenameValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleRename()
        }
      }}
      placeholder="Chat name"
      autoFocus
    />
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleRename}>
        Rename
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Technical Implementation

### Component Structure
```tsx
<ChatListItem>
  <div> <!-- Chat title -->
  <div> <!-- 3-dot menu -->
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button> <!-- MoreHorizontal icon -->
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem> <!-- Share -->
        <DropdownMenuItem> <!-- Rename -->
        <DropdownMenuItem> <!-- Archive -->
        <DropdownMenuSeparator />
        <DropdownMenuItem> <!-- Delete (red) -->
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <Dialog> <!-- Rename Dialog -->
</ChatListItem>
```

### State Management
```tsx
const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
const [renameValue, setRenameValue] = useState(chat.title)

const handleRename = () => {
  if (renameValue.trim() && renameValue !== chat.title) {
    onRename(renameValue.trim())
  }
  setIsRenameDialogOpen(false)
}
```

### Styling
- **Hover State**: `opacity-0 group-hover:opacity-100`
- **Active State**: Always visible (`opacity-100`)
- **Button Size**: `h-7 w-7` (compact)
- **Menu Width**: `w-48` (fixed width)
- **Delete Color**: `text-destructive` with custom focus styles

### Event Handling
- **stopPropagation()**: Prevents chat selection when clicking menu
- **Enter Key**: Submits rename in dialog
- **Auto Focus**: Input automatically focused when dialog opens

## User Experience

### Interaction Flow

1. **Hover over chat** → 3-dot button appears
2. **Click 3-dot button** → Dropdown menu opens
3. **Select action**:
   - **Share**: Opens share functionality (placeholder)
   - **Rename**: Opens rename dialog → Enter new name → Press Enter or click Rename
   - **Archive**: Archives chat (placeholder)
   - **Delete**: Immediately deletes chat (with confirmation would be better)

### Visual Feedback
- ✅ Smooth opacity transitions
- ✅ Hover states on all menu items
- ✅ Icons with consistent spacing (mr-2)
- ✅ Destructive styling for delete action
- ✅ Menu separator before delete
- ✅ Active chat always shows menu

## Props Interface

```typescript
interface ChatListItemProps {
  chat: ChatHistory
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}
```

## Parent Integration

```tsx
<ChatListItem
  key={chat.id}
  chat={chat}
  isActive={chat.id === currentChatId}
  onSelect={() => onSelectChat(chat.id)}
  onDelete={() => onDeleteChat(chat.id)}
  onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
/>
```

## Future Enhancements

### Share Functionality
- [ ] Implement share link generation
- [ ] Copy to clipboard
- [ ] Share via email/social media
- [ ] Share permissions management

### Archive Functionality
- [ ] Move chat to archived section
- [ ] Toggle archived chats visibility
- [ ] Unarchive functionality
- [ ] Archive filters

### Delete Confirmation
- [ ] Add confirmation dialog before delete
- [ ] "Are you sure?" message
- [ ] Undo option (toast notification)
- [ ] Bulk delete option

### Additional Actions
- [ ] Pin/Unpin chat
- [ ] Mark as unread
- [ ] Add to folder/category
- [ ] Export conversation
- [ ] Copy conversation

## Dependencies
- `@/components/ui/dropdown-menu` - Menu component
- `@/components/ui/dialog` - Rename dialog
- `@/components/ui/input` - Text input for rename
- `@/components/ui/button` - Action buttons
- `lucide-react` - Icons (MoreHorizontal, Share2, PenSquare, Archive, Trash2)

## Testing Checklist
- [x] Hover reveals 3-dot menu
- [x] Menu visible on active chat
- [x] Click menu doesn't select chat
- [x] Share menu item displays
- [x] Rename opens dialog
- [x] Rename dialog pre-fills current title
- [x] Enter key submits rename
- [x] Cancel button closes dialog
- [x] Archive menu item displays
- [x] Delete calls onDelete callback
- [x] Delete has destructive styling
- [x] Menu separator before delete
- [x] No errors in console

## Accessibility
- ✅ Icon-only button has proper click target (28x28px)
- ✅ Menu items have icons and labels
- ✅ Dialog has title and description
- ✅ Input has placeholder text
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ⚠️ Consider adding aria-labels for screen readers

## Performance
- ✅ Dialog state only initialized when needed
- ✅ stopPropagation prevents unnecessary re-renders
- ✅ Memoization not needed (small component)
- ✅ No performance issues with many chats

## Related Files
- `/frontend/components/chat/sidebar.tsx` - Main implementation
- `/frontend/components/ui/dropdown-menu.tsx` - shadcn dropdown
- `/frontend/components/ui/dialog.tsx` - shadcn dialog
- `/frontend/components/ui/input.tsx` - shadcn input

## Resources
- [shadcn/ui Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)
- [ChatGPT Interface Reference](https://chat.openai.com)
