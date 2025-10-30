"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  PenSquare,
  Search, 
  MoreHorizontal, 
  Trash2,
  Share2,
  Archive,
  MessageSquare
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

export interface ChatHistory {
  id: string
  title: string
  lastMessage?: string
  timestamp: Date
  messageCount: number
}

interface SidebarProps {
  chatHistory: ChatHistory[]
  currentChatId?: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  className?: string
}

export function Sidebar({
  chatHistory,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  className,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedHistory = groupChatsByDate(filteredHistory)

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent scroll propagation to parent when scrolling sidebar
    e.stopPropagation()
  }

  return (
    <div className={cn("flex flex-col h-full w-full bg-sidebar overflow-hidden", className)}>
      {/* Top Navigation */}
      <div className="flex-shrink-0 p-3 space-y-1">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="w-full justify-start h-10 px-3 font-normal hover:bg-sidebar-accent"
        >
          <PenSquare className="h-4 w-4 mr-3" />
          New chat
        </Button>
        
        <Button
          onClick={() => setSearchOpen(true)}
          variant="ghost"
          className="w-full justify-start h-10 px-3 font-normal hover:bg-sidebar-accent"
        >
          <Search className="h-4 w-4 mr-3" />
          Search chats
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden" onWheel={handleWheel}>
        <ScrollArea className="h-full scrollbar-thin">
          <div className="px-3 pb-4">
            {/* Chats Section Header */}
            <div className="px-3 py-2 mb-1">
              <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Chats
              </h3>
            </div>

            {/* Chat List */}
            <div className="space-y-0.5">
              {Object.entries(groupedHistory).map(([dateGroup, chats]) => (
                <div key={dateGroup}>
                  {chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === currentChatId}
                      onSelect={() => onSelectChat(chat.id)}
                      onDelete={() => onDeleteChat(chat.id)}
                      onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {filteredHistory.length === 0 && (
              <div className="flex items-center justify-center min-h-[200px]">
                <p className="text-sm text-sidebar-foreground/50">
                  No chats yet
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Search Dialog - Client-side only to avoid hydration errors */}
      {isMounted && (
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chatHistory.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.title}
                  onSelect={() => {
                    onSelectChat(chat.id)
                    setSearchOpen(false)
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{chat.title}</span>
                  {chat.id === currentChatId && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      )}
    </div>
  )
}

interface ChatListItemProps {
  chat: ChatHistory
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ChatListItemProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== chat.title) {
      onRename(renameValue.trim())
    }
    setIsRenameDialogOpen(false)
  }
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "hover:bg-sidebar-accent/50"
      )}
      onClick={onSelect}
    >
      {/* Chat Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-normal text-sidebar-foreground">
          {chat.title}
        </p>
      </div>

      {/* Actions Menu - Always visible for debugging */}
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent data-[state=open]:bg-accent"
              onClick={(e) => e.stopPropagation()}
              aria-label="Chat options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setIsRenameDialogOpen(true)
              }}
            >
              <PenSquare className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
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
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function groupChatsByDate(chats: ChatHistory[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: Record<string, ChatHistory[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
  }

  chats
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .forEach((chat) => {
      const chatDate = new Date(
        chat.timestamp.getFullYear(),
        chat.timestamp.getMonth(),
        chat.timestamp.getDate()
      )

      if (chatDate.getTime() >= today.getTime()) {
        groups.Today.push(chat)
      } else if (chatDate.getTime() >= yesterday.getTime()) {
        groups.Yesterday.push(chat)
      } else if (chatDate.getTime() >= weekAgo.getTime()) {
        groups["Last 7 days"].push(chat)
      } else {
        groups.Older.push(chat)
      }
    })

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })

  return groups
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}