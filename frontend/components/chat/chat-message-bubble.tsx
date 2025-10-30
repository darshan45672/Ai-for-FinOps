"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { User, Copy, Sparkles, ThumbsUp, ThumbsDown, RotateCcw, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import "highlight.js/styles/github-dark.css"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatMessageBubbleProps {
  message: Message
  onRegenerate?: () => void
}

export function ChatMessageBubble({ message, onRegenerate }: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(feedback === type ? null : type)
    console.log(`Feedback for message ${message.id}: ${type}`)
  }

  const isUser = message.role === "user"

  return (
    <div className={cn(
      "group relative flex gap-3 px-2 py-4 md:px-4 md:py-6",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content Container */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm break-words overflow-hidden",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted text-foreground rounded-bl-md border border-border"
        )}>
          {isUser ? (
            // Simple text for user messages
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            // Rich markdown for assistant messages
            <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  p: ({ children, ...props }) => (
                    <p className="mb-4 last:mb-0 text-[15px] leading-relaxed break-words" {...props}>
                      {children}
                    </p>
                  ),
                  h1: ({ children, ...props }) => (
                    <h1 className="text-xl font-semibold mb-3 mt-6 first:mt-0" {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 className="text-lg font-semibold mb-2 mt-5 first:mt-0" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0" {...props}>
                      {children}
                    </h3>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="my-3 ml-6 list-disc space-y-1.5 [&>li]:pl-1" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="my-3 ml-6 list-decimal space-y-1.5 [&>li]:pl-1" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="text-[15px] leading-relaxed" {...props}>
                      {children}
                    </li>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match
                    
                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-sm border border-border/50"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    }

                    return (
                      <code className={cn("text-sm", className)} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children, ...props }) => (
                    <div className="relative group/code my-4 -mx-4">
                      <pre
                        className="overflow-x-auto rounded-lg border border-border bg-zinc-950 p-4 text-sm scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
                        {...props}
                      >
                        {children}
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 transition-opacity bg-zinc-800/80 hover:bg-zinc-700"
                        onClick={() => {
                          const code = (children as any)?.props?.children
                          if (code) {
                            navigator.clipboard.writeText(String(code))
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ),
                  a: ({ children, ...props }) => (
                    <a
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="mt-4 border-l-4 border-border pl-4 italic text-muted-foreground"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  table: ({ children, ...props }) => (
                    <div className="my-4 overflow-x-auto -mx-4 px-4">
                      <table className="min-w-full border-collapse border border-border" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th
                      className="border border-border bg-muted px-3 py-2 text-left font-semibold"
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="border border-border px-3 py-2" {...props}>
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action Buttons (Only for Assistant Messages) */}
        {!isUser && (
          <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{copied ? "Copied!" : "Copy"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-lg",
                      feedback === 'up' && "bg-green-500/10 text-green-500"
                    )}
                    onClick={() => handleFeedback('up')}
                  >
                    <ThumbsUp className={cn(
                      "h-3.5 w-3.5",
                      feedback === 'up' && "fill-current"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Good response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-lg",
                      feedback === 'down' && "bg-red-500/10 text-red-500"
                    )}
                    onClick={() => handleFeedback('down')}
                  >
                    <ThumbsDown className={cn(
                      "h-3.5 w-3.5",
                      feedback === 'down' && "fill-current"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Bad response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onRegenerate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={onRegenerate}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Regenerate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 border-2 border-border">
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}
