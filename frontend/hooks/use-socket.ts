"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: any[]
  toolCallId?: string
  name?: string
}

interface ChatResponse {
  message: string
  toolsUsed?: string[]
  conversationId?: string
  timestamp: string
}

interface ChatError {
  error: string
  message: string
  timestamp: string
}

interface ConnectedEvent {
  message: string
  clientId: string
  timestamp: string
}

interface UseSocketOptions {
  autoConnect?: boolean
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isTyping: boolean
  sendMessage: (message: string, conversationId?: string) => void
  clearConversation: () => void
  getHistory: () => void
  disconnect: () => void
  connect: () => void
  conversationId?: string
  setConversationId: (id: string | undefined) => void
}

export function useSocket(
  onMessageReceived: (message: string, toolsUsed?: string[], conversationId?: string) => void,
  onError?: (error: string) => void,
  options: UseSocketOptions = { autoConnect: true }
): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3004'
    
    const socket = io(`${aiServiceUrl}/chat`, {
      transports: ['websocket', 'polling'],
      auth: {
        userId: user?.id || 'anonymous',
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to AI service')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from AI service')
      setIsConnected(false)
      setIsTyping(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
      onError?.('Failed to connect to AI service')
    })

    // Chat event handlers
    socket.on('connected', (data: ConnectedEvent) => {
      console.log('Chat connection established:', data)
    })

    socket.on('chat_response', (data: ChatResponse) => {
      console.log('Received chat response:', data)
      setIsTyping(false)
      
      // Update conversationId if provided in response
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }
      
      onMessageReceived(data.message, data.toolsUsed, data.conversationId)
    })

    socket.on('ai_typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping)
    })

    socket.on('chat_error', (data: ChatError) => {
      console.error('Chat error:', data)
      setIsTyping(false)
      onError?.(data.message || data.error)
    })

    socket.on('conversation_cleared', (data) => {
      console.log('Conversation cleared:', data)
    })

    socket.on('conversation_history', (data: { messages: ChatMessage[]; timestamp: string }) => {
      console.log('Conversation history:', data)
    })

    socket.on('pong', (data: { timestamp: string }) => {
      console.log('Pong received:', data)
    })

    socketRef.current = socket
  }, [user?.id, onMessageReceived, onError])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setIsTyping(false)
    }
  }, [])

  const sendMessage = useCallback((message: string, convId?: string) => {
    if (!socketRef.current?.connected) {
      onError?.('Not connected to chat service')
      return
    }

    socketRef.current.emit('chat_message', {
      message,
      conversationId: convId || conversationId,
      userId: user?.id,
    })
  }, [onError, conversationId, user?.id])

  const clearConversation = useCallback(() => {
    if (!socketRef.current?.connected) {
      return
    }

    socketRef.current.emit('clear_conversation')
  }, [])

  const getHistory = useCallback(() => {
    if (!socketRef.current?.connected) {
      return
    }

    socketRef.current.emit('get_history')
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.autoConnect])

  return {
    socket: socketRef.current,
    isConnected,
    isTyping,
    sendMessage,
    clearConversation,
    getHistory,
    disconnect,
    connect,
    conversationId,
    setConversationId,
  }
}
