"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  onStop?: () => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  onStop,
  placeholder = "Type your message...",
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!input.trim() || isLoading || disabled) return

    onSendMessage(input.trim())
    setInput("")
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        handleSubmit()
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[60px] max-h-[200px] resize-none rounded-xl border-2 pr-12",
                "focus:border-primary/30 focus:ring-0 focus:ring-offset-0",
                "placeholder:text-muted-foreground/60",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              rows={1}
            />
            
            <div className="absolute bottom-2 right-2">
              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onStop}
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!input.trim() || disabled}
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-3 max-w-4xl mx-auto">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border ml-1">Shift + Enter</kbd> for new line
        </div>
      </div>
    </div>
  )
}

export default ChatInput