"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MessageSquare, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit3 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedHistory = groupChatsByDate(filteredHistory)

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Header */}
      <div className="p-4 space-y-4">
        <NewChatButton onClick={onNewChat} />
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      <Separator />

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          {Object.entries(groupedHistory).map(([dateGroup, chats]) => (
            <div key={dateGroup} className="space-y-2">
              <div className="px-2 py-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {dateGroup}
                </h3>
              </div>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <ChatHistoryItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onSelect={() => onSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                    onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No chats found" : "No chat history yet"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface NewChatButtonProps {
  onClick: () => void
}

function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="w-full justify-start gap-2 h-11 text-left font-medium"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search chats..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
      />
    </div>
  )
}

interface ChatHistoryItemProps {
  chat: ChatHistory
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

function ChatHistoryItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ChatHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chat.title)

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
    setEditTitle(chat.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditTitle(chat.title)
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-transparent hover:border-border transition-colors",
        isActive && "bg-accent border-border"
      )}
    >
      {isEditing ? (
        <div className="p-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="w-full text-sm bg-transparent border-none outline-none focus:ring-0"
            autoFocus
          />
        </div>
      ) : (
        <div className="relative flex items-start justify-between gap-2 p-3 hover:bg-accent/50 transition-colors rounded-lg">
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onSelect}
          >
            <h4 className="text-sm font-medium truncate">{chat.title}</h4>
            {chat.lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {chat.lastMessage}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {chat.messageCount} messages
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(chat.timestamp)}
              </span>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
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