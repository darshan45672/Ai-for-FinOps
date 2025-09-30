"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChatMessage, type Message } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Sidebar, type ChatHistory } from "./sidebar"
import { ThemeToggle } from "../theme-toggle"
import { Menu, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I received your message: "${content}". This is a simulated response. In a real implementation, this would be connected to your AI backend.`,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      // Update chat history
      updateChatHistory(userMessage, assistantMessage)
      
    } catch (error) {
      console.error("Error sending message:", error)
      // Handle error state
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    setCurrentChatId(newChatId)
    setMessages([])
    setIsMobileMenuOpen(false)
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // In a real app, load messages for this chat
    setMessages([])
    setIsMobileMenuOpen(false)
  }

  const handleDeleteChat = (chatId: string) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      handleNewChat()
    }
  }

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    )
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

  const updateChatHistory = (userMessage: Message, assistantMessage: Message) => {
    if (!currentChatId) return

    const existingChatIndex = chatHistory.findIndex(
      (chat) => chat.id === currentChatId
    )

    const title = userMessage.content.slice(0, 50) + 
                 (userMessage.content.length > 50 ? "..." : "")
    
    const updatedChat: ChatHistory = {
      id: currentChatId,
      title,
      lastMessage: assistantMessage.content.slice(0, 100),
      timestamp: new Date(),
      messageCount: messages.length + 2, // +2 for the new messages
    }

    if (existingChatIndex >= 0) {
      setChatHistory((prev) => [
        updatedChat,
        ...prev.slice(0, existingChatIndex),
        ...prev.slice(existingChatIndex + 1),
      ])
    } else {
      setChatHistory((prev) => [updatedChat, ...prev])
    }
  }

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 border-r">
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

              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="font-semibold text-lg">AI Chat</h1>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md mx-auto px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Ask me anything or try one of these suggestions:
                  </p>
                </div>
                <div className="grid gap-2">
                  {[
                    "Explain quantum computing in simple terms",
                    "Help me plan a weekend project",
                    "Write a short story about AI",
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto p-3 whitespace-normal"
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="container mx-auto max-w-4xl space-y-6 py-6 px-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onCopy={handleCopyMessage}
                    onRegenerate={handleRegenerateMessage}
                    onFeedback={handleMessageFeedback}
                  />
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={() => setIsLoading(false)}
          disabled={false}
        />
      </div>
    </div>
  )
}

export default ChatInterface