"use client"

import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/signin-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signIn(data.email, data.password, data.rememberMe)
      router.push('/') // Redirect to chat interface after successful login
    } catch (error: any) {
      console.error("Sign in error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Sign in failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your FinOps AI account"
    >
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}
      <SignInForm 
        onSubmit={handleSignIn}
        isLoading={isLoading}
      />
    </AuthLayout>
  )
}