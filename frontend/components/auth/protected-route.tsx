"use client"

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/auth/signin' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
