"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useMounted } from "@/hooks/use-mounted"
import { useSocket } from "@/hooks/use-socket"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatMessageBubble, type Message } from "./chat-message-bubble"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Sidebar, type ChatHistory } from "./sidebar"
import { ThemeToggle } from "../theme-toggle"
import { Menu, MessageSquare, Sparkles, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  className?: string
  showEmptyState?: boolean
}

export function ChatInterface({ className, showEmptyState }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isMounted = useMounted()

  // Get conversationId from URL params
  const urlConversationId = params?.id as string | undefined

  // Socket.IO integration
  const handleMessageReceived = (message: string, toolsUsed?: string[], conversationId?: string) => {
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: message,
      role: "assistant",
      timestamp: new Date(),
    }
    
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1]
      updateChatHistory(lastMessage, assistantMessage)
      return [...prev, assistantMessage]
    })
    
    // Update currentChatId and navigate to the conversation URL if we got a new conversationId
    if (conversationId && !currentChatId) {
      setCurrentChatId(conversationId)
      setConversationId(conversationId)
      
      // Navigate to the conversation URL
      if (pathname === '/') {
        router.push(`/chat/${conversationId}`)
      }
    }
    
    if (toolsUsed && toolsUsed.length > 0) {
      console.log('Tools used:', toolsUsed)
    }
  }

  const handleSocketError = (error: string) => {
    console.error('Socket error:', error)
    // You could show a toast notification here
  }

  const { 
    isConnected, 
    isTyping, 
    sendMessage: sendSocketMessage,
    clearConversation: clearSocketConversation,
    conversationId,
    setConversationId,
  } = useSocket(handleMessageReceived, handleSocketError)

  // Load user's conversations on mount
  useEffect(() => {
    if (user?.id && isMounted) {
      loadUserConversations()
    }
  }, [user?.id, isMounted])

  // Load conversation from URL on mount or when URL changes
  useEffect(() => {
    if (urlConversationId && urlConversationId !== currentChatId && user?.id && isMounted) {
      setCurrentChatId(urlConversationId)
      setConversationId(urlConversationId)
      loadConversationMessages(urlConversationId)
    } else if (!urlConversationId && currentChatId) {
      // If we're on root path, clear current conversation
      setCurrentChatId(undefined)
      setConversationId(undefined)
      setMessages([])
    }
  }, [urlConversationId, user?.id, isMounted])

  const loadUserConversations = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DATABASE_SERVICE_URL || 'http://localhost:3003'}/chat/conversations?userId=${user.id}`
      )
      
      if (response.ok) {
        const conversations = await response.json()
        const history: ChatHistory[] = conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.lastMessage?.content || '',
          timestamp: new Date(conv.updatedAt),
          messageCount: conv.messageCount || 0,
        }))
        setChatHistory(history)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DATABASE_SERVICE_URL || 'http://localhost:3003'}/chat/conversations/${conversationId}/messages`
      )
      
      if (response.ok) {
        const dbMessages = await response.json()
        const loadedMessages: Message[] = dbMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          timestamp: new Date(msg.createdAt),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error)
      handleSocketError('Failed to load conversation')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
      }
    }

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages, isTyping])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !isConnected) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Send message via Socket.IO with conversationId if available
      sendSocketMessage(content, conversationId)
    } catch (error) {
      console.error("Error sending message:", error)
      handleSocketError('Failed to send message')
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    setConversationId(undefined)
    setMessages([])
    clearSocketConversation()
    setIsMobileMenuOpen(false)
    
    // Navigate to root path for new chat
    router.push('/')
  }

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    setConversationId(chatId)
    setIsMobileMenuOpen(false)
    
    // Navigate to the conversation URL
    router.push(`/chat/${chatId}`)
    
    // Load messages will happen automatically via the useEffect watching urlConversationId
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DATABASE_SERVICE_URL || 'http://localhost:3003'}/chat/conversations/${chatId}`,
        { method: 'DELETE' }
      )
      
      if (response.ok) {
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId))
        if (currentChatId === chatId) {
          handleNewChat()
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DATABASE_SERVICE_URL || 'http://localhost:3003'}/chat/conversations/${chatId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        }
      )
      
      if (response.ok) {
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          )
        )
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const handleRegenerateMessage = (messageId: string) => {
    // Find the message and regenerate response
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === "user") {
        // Remove the assistant message and regenerate
        setMessages((prev) => prev.slice(0, messageIndex))
        handleSendMessage(userMessage.content)
      }
    }
  }

  const handleMessageFeedback = (messageId: string, feedback: "up" | "down") => {
    console.log(`Feedback for message ${messageId}:`, feedback)
    // Implement feedback handling
  }

  const updateChatHistory = async (userMessage: Message, assistantMessage: Message) => {
    if (!currentChatId || !user?.id) return

    // Reload conversations to get the updated list from database
    await loadUserConversations()
  }

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80">
        <Sidebar
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              {isMounted ? (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Chat Navigation</SheetTitle>
                    </SheetHeader>
                    <Sidebar
                      chatHistory={chatHistory}
                      currentChatId={currentChatId}
                      onNewChat={handleNewChat}
                      onSelectChat={handleSelectChat}
                      onDeleteChat={handleDeleteChat}
                      onRenameChat={handleRenameChat}
                    />
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="ghost" size="sm" className="md:hidden" disabled>
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="font-semibold text-lg">AI Chat</h1>
                {/* Connection Status */}
                <div className="flex items-center gap-1.5 ml-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              {/* User Menu */}
              {user && (
                isMounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || undefined} alt={user.email} />
                          <AvatarFallback>
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || 'User'}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full" disabled>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar || undefined} alt={user.email} />
                      <AvatarFallback>
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                )
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-hidden bg-background">
          {messages.length === 0 && showEmptyState ? (
            <div className="flex items-center justify-center h-full px-4 py-8 sm:px-6 lg:px-8">
              <div className="text-center space-y-8 max-w-3xl mx-auto w-full">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    How can I help you today?
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    I'm your AI assistant for Azure FinOps
                  </p>
                </div>
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 sm:mt-8 w-full max-w-4xl mx-auto">
                  {[
                    { 
                      icon: "💡", 
                      title: "Explain a concept", 
                      text: "What is quantum computing?" 
                    },
                    { 
                      icon: "💰", 
                      title: "Analyze costs", 
                      text: "Help me analyze my Azure cloud costs" 
                    },
                    { 
                      icon: "🚀", 
                      title: "Get started", 
                      text: "How do I optimize my cloud spending?" 
                    },
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-3 sm:p-4 flex flex-col items-start gap-1.5 sm:gap-2 hover:bg-accent hover:border-primary/50 transition-all group text-left"
                      onClick={() => handleSendMessage(suggestion.text)}
                    >
                      <span className="text-xl sm:text-2xl">{suggestion.icon}</span>
                      <span className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </span>
                      <span className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
                        {suggestion.text}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md mx-auto px-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Ready to chat</h2>
                  <p className="text-muted-foreground text-sm">
                    {isLoadingHistory ? "Loading conversation..." : "Type a message to start the conversation"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="pb-4 px-2">
                {messages.map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    onRegenerate={() => handleRegenerateMessage(message.id)}
                  />
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 px-4 py-6 md:px-6">
                    <div className="flex-shrink-0">
                      <Avatar className="h-8 w-8 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-px" />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isTyping}
          onStop={() => {}}
          disabled={!isConnected}
        />
      </div>
    </div>
  )
}

export default ChatInterface