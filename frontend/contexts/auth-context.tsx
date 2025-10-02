"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/api/auth'
import { User } from '@/types/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signUp: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    username?: string
  }) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getAccessToken()
        const userData = authService.getUser()
        
        if (token && userData) {
          try {
            const user = await authService.getProfile()
            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
            })
          } catch (error) {
            console.error('Token validation failed:', error)
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            })
          }
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authService.login({ email, password })
      
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signUp = async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    username?: string
  }) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authService.register(userData)
      
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      await authService.logout()
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const forgotPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Password reset requested for:', email)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return
    
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const updatedUser = await authService.getProfile()
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }))
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/auth/signin'
    }
  }, [auth.isLoading, auth.isAuthenticated])
  
  return auth
}
