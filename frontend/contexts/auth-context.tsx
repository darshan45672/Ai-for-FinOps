"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
}

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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has a valid token in localStorage
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          // In a real app, you would validate the token with your backend
          const user = JSON.parse(userData)
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          })
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user data - in a real app, this would come from your API
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      }
      
      // Store auth data
      localStorage.setItem('auth_token', 'mock_jwt_token')
      localStorage.setItem('user_data', JSON.stringify(mockUser))
      
      setState({
        user: mockUser,
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
  }) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      }
      
      // Store auth data
      localStorage.setItem('auth_token', 'mock_jwt_token')
      localStorage.setItem('user_data', JSON.stringify(newUser))
      
      setState({
        user: newUser,
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
      // Clear auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Password reset requested for:', email)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return
    
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const updatedUser = { ...state.user, ...data }
      
      // Update stored data
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      
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

// Hook for protecting routes
export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // In a real app, you would redirect to sign in page
      window.location.href = '/auth/signin'
    }
  }, [auth.isLoading, auth.isAuthenticated])
  
  return auth
}