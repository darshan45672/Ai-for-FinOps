"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Context7State {
  isEnabled: boolean
  apiKey?: string
  baseUrl: string
}

interface Context7ContextType {
  state: Context7State
  updateApiKey: (apiKey: string) => void
  toggleEnabled: () => void
  resolveLibraryId: (libraryName: string) => Promise<string | null>
  getLibraryDocs: (libraryId: string, topic?: string) => Promise<string | null>
}

const Context7Context = createContext<Context7ContextType | undefined>(undefined)

interface Context7ProviderProps {
  children: ReactNode
}

export function Context7Provider({ children }: Context7ProviderProps) {
  const [state, setState] = useState<Context7State>({
    isEnabled: false,
    baseUrl: 'https://api.context7.com',
  })

  const updateApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }))
  }

  const toggleEnabled = () => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
  }

  const resolveLibraryId = async (libraryName: string): Promise<string | null> => {
    if (!state.isEnabled || !state.apiKey) {
      console.warn('Context7: Not enabled or no API key provided')
      return null
    }

    try {
      // This is a placeholder for actual Context7 API integration
      // In a real implementation, you would make an API call here
      console.log(`Context7: Resolving library ID for ${libraryName}`)
      
      // Mock response - replace with actual API call
      const mockLibraryIds: Record<string, string> = {
        'react': '/facebook/react',
        'next.js': '/vercel/next.js',
        'tailwindcss': '/tailwindlabs/tailwindcss',
        'typescript': '/microsoft/typescript',
      }
      
      return mockLibraryIds[libraryName.toLowerCase()] || null
    } catch (error) {
      console.error('Context7: Error resolving library ID:', error)
      return null
    }
  }

  const getLibraryDocs = async (libraryId: string, topic?: string): Promise<string | null> => {
    if (!state.isEnabled || !state.apiKey) {
      console.warn('Context7: Not enabled or no API key provided')
      return null
    }

    try {
      // This is a placeholder for actual Context7 API integration
      console.log(`Context7: Getting docs for ${libraryId}${topic ? ` on topic: ${topic}` : ''}`)
      
      // Mock response - replace with actual API call
      return `Mock documentation for ${libraryId}${topic ? ` regarding ${topic}` : ''}`
    } catch (error) {
      console.error('Context7: Error getting library docs:', error)
      return null
    }
  }

  const value: Context7ContextType = {
    state,
    updateApiKey,
    toggleEnabled,
    resolveLibraryId,
    getLibraryDocs,
  }

  return (
    <Context7Context.Provider value={value}>
      {children}
    </Context7Context.Provider>
  )
}

export function useContext7() {
  const context = useContext(Context7Context)
  if (context === undefined) {
    throw new Error('useContext7 must be used within a Context7Provider')
  }
  return context
}

// Hook for easy library documentation fetching
export function useLibraryDocs() {
  const { resolveLibraryId, getLibraryDocs } = useContext7()

  const fetchDocs = async (libraryName: string, topic?: string) => {
    const libraryId = await resolveLibraryId(libraryName)
    if (!libraryId) return null
    
    return await getLibraryDocs(libraryId, topic)
  }

  return { fetchDocs }
}