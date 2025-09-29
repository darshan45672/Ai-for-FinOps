import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, feedback: "up" | "down") => void
}

export function ChatMessage({ 
  message, 
  onCopy, 
  onRegenerate, 
  onFeedback 
}: ChatMessageProps) {
  const isUser = message.role === "user"
  
  return (
    <div className={cn(
      "group w-full",
      isUser ? "pl-12" : "pr-12"
    )}>
      <div className={cn(
        "flex gap-4 p-4 rounded-lg",
        isUser 
          ? "bg-muted/30 ml-auto max-w-[80%]" 
          : "bg-background max-w-full"
      )}>
        {!isUser && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              AI
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 space-y-2">
          <MessageContent content={message.content} />
          
          {!isUser && (
            <MessageActions
              messageId={message.id}
              content={message.content}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
            />
          )}
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              U
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

interface MessageContentProps {
  content: string
}

export function MessageContent({ content }: MessageContentProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
        {content}
      </div>
    </div>
  )
}

interface MessageActionsProps {
  messageId: string
  content: string
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, feedback: "up" | "down") => void
}

export function MessageActions({
  messageId,
  content,
  onCopy,
  onRegenerate,
  onFeedback,
}: MessageActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onCopy?.(content)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onFeedback?.(messageId, "up")}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Good response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onFeedback?.(messageId, "down")}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Poor response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onRegenerate?.(messageId)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Regenerate response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}