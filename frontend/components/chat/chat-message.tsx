import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Sparkles, User as UserIcon, Check } from "lucide-react"
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
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null)
  
  const handleCopy = () => {
    onCopy?.(message.content)
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (feedback: "up" | "down") => {
    setFeedbackGiven(feedback)
    onFeedback?.(message.id, feedback)
  }
  
  return (
    <div className={cn(
      "group relative w-full border-b border-border/40",
      isUser ? "bg-background" : "bg-muted/30"
    )}>
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="flex gap-4 md:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                "text-sm font-medium",
                isUser 
                  ? "bg-background border-2 border-border" 
                  : "bg-primary text-primary-foreground"
              )}>
                {isUser ? (
                  <UserIcon className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Message Content */}
          <div className="flex-1 space-y-2 overflow-hidden min-w-0">
            {/* Name & Metadata */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {isUser ? "You" : "AI Assistant"}
              </span>
              {message.toolsUsed && message.toolsUsed.length > 0 && !isUser && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Used {message.toolsUsed.length} tool{message.toolsUsed.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Message Body */}
            <MessageContent content={message.content} isUser={isUser} />
            
            {/* Action Buttons */}
            {!isUser && (
              <div className="flex items-center gap-1 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <TooltipProvider delayDuration={300}>
                  {/* Copy Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-2.5 text-xs hover:bg-muted",
                          copied && "text-green-600"
                        )}
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {copied ? "Copied to clipboard" : "Copy message"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Regenerate Button */}
                  {onRegenerate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs hover:bg-muted"
                          onClick={() => onRegenerate(message.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Regenerate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Regenerate response
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Feedback Buttons */}
                  {onFeedback && (
                    <>
                      <div className="w-px h-5 bg-border mx-1" />
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 hover:bg-muted",
                              feedbackGiven === "up" && "text-green-600"
                            )}
                            onClick={() => handleFeedback("up")}
                          >
                            <ThumbsUp className={cn(
                              "h-3.5 w-3.5",
                              feedbackGiven === "up" && "fill-current"
                            )} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Good response</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 hover:bg-muted",
                              feedbackGiven === "down" && "text-red-600"
                            )}
                            onClick={() => handleFeedback("down")}
                          >
                            <ThumbsDown className={cn(
                              "h-3.5 w-3.5",
                              feedbackGiven === "down" && "fill-current"
                            )} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Bad response</TooltipContent>
                      </Tooltip>
                    </>
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
      <div className="text-[15px] leading-7 whitespace-pre-wrap break-words text-foreground">
        {content}
      </div>
    )
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none 
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
      [&>p]:text-[15px] [&>p]:leading-7 [&>p]:my-4
      [&>ul]:my-4 [&>ol]:my-4
      [&>li]:text-[15px] [&>li]:leading-7 [&>li]:my-1
      [&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:mt-6 [&>h1]:mb-4
      [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-3
      [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2
      [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
      [&>table]:w-full [&>table]:my-4 [&>table]:border-collapse
      [&>table>thead]:bg-muted
      [&>table>tbody>tr]:border-b [&>table>tbody>tr]:border-border
      [&>table>tbody>tr>td]:px-3 [&>table>tbody>tr>td]:py-2
      [&>table>thead>tr>th]:px-3 [&>table>thead>tr>th]:py-2 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            return !inline ? (
              <div className="relative group/code my-4">
                {language && (
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border-b border-border">
                    <span className="text-xs font-mono text-muted-foreground uppercase">{language}</span>
                  </div>
                )}
                <div className="relative">
                  <pre className={cn("m-0 overflow-x-auto", !language && "rounded-lg", language && "rounded-t-none rounded-b-lg")}>
                    <code className={cn(className, "block px-4 py-3 text-sm font-mono")} {...props}>
                      {children}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-8 px-2 opacity-0 group-hover/code:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background" 
                    onClick={() => { navigator.clipboard.writeText(String(children).replace(/\n$/, '')) }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
              </div>
            ) : (
              <code className={cn(className, "px-1.5 py-0.5 rounded-md bg-muted text-[14px] font-mono before:content-none after:content-none")} {...props}>
                {children}
              </code>
            )
          },
          pre({ children }: any) {
            return <>{children}</>
          },
          a({ href, children, ...props }: any) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline underline-offset-2 font-medium" 
                {...props}
              >
                {children}
              </a>
            )
          },
          ul({ children, ...props }: any) {
            return (
              <ul className="list-disc list-outside ml-4 space-y-1" {...props}>
                {children}
              </ul>
            )
          },
          ol({ children, ...props }: any) {
            return (
              <ol className="list-decimal list-outside ml-4 space-y-1" {...props}>
                {children}
              </ol>
            )
          },
          strong({ children, ...props }: any) {
            return (
              <strong className="font-semibold text-foreground" {...props}>
                {children}
              </strong>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
