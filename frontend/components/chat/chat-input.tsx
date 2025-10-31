"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Square } from "lucide-react"
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
  placeholder = "Message AI Assistant...",
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
    <div className="border-t bg-background px-4 py-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 rounded-3xl border border-border bg-background shadow-sm focus-within:shadow-md focus-within:border-primary/30 transition-all">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 pr-12",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/50 text-[15px] leading-6",
              "scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
          
          <div className="absolute bottom-2 right-2">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onStop}
                className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className={cn(
                  "h-9 w-9 rounded-full transition-all",
                  input.trim() && !disabled
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground/70 text-center mt-3">
          Press <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-muted/50 rounded border border-border/50">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-muted/50 rounded border border-border/50 ml-1">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}

export default ChatInput