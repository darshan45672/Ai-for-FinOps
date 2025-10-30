import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Bot, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'
import { useState } from "react"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  toolsUsed?: string[]
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
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    onCopy?.(message.content)
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className={cn(
      "group w-full py-4 px-4 md:px-6",
      isUser ? "bg-muted/30" : "bg-background"
    )}>
      <div className="max-w-4xl mx-auto flex gap-4">
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className={cn(
            "text-sm font-semibold",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          )}>
            {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isUser ? "You" : "AI Assistant"}
            </span>
            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • Used {message.toolsUsed.length} tool{message.toolsUsed.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <MessageContent content={message.content} isUser={isUser} />
          
          <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {!isUser && (
              <div className="flex items-center gap-1 ml-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopy}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied!" : "Copy message"}
                    </TooltipContent>
                  </Tooltip>

                  {onFeedback && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onFeedback(message.id, "up")}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Helpful</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onFeedback(message.id, "down")}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Not helpful</TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {onRegenerate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRegenerate(message.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Regenerate</TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageContentProps {
  content: string
  isUser: boolean
}

function MessageContent({ content, isUser }: MessageContentProps) {
  if (isUser) {
    return (
      <div className="text-sm whitespace-pre-wrap break-words">
        {content}
      </div>
    )
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            return !inline ? (
              <div className="relative group/code">
                <code className={cn(className, "block p-4 rounded-lg bg-muted text-sm overflow-x-auto")} {...props}>
                  {children}
                </code>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(String(children)) }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <code className={cn(className, "px-1.5 py-0.5 rounded bg-muted text-sm font-mono")} {...props}>
                {children}
              </code>
            )
          },
          pre({ children }: any) {
            return <>{children}</>
          },
          a({ href, children, ...props }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
