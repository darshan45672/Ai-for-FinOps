"use client"

import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/signin-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSignIn = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setIsLoading(true)
    
    try {
      await signIn(data.email, data.password, data.rememberMe)
      router.push('/') // Redirect to chat interface after successful login
    } catch (error) {
      console.error("Sign in error:", error)
      alert("Sign in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your FinOps AI account"
    >
      <SignInForm 
        onSubmit={handleSignIn}
        isLoading={isLoading}
      />
    </AuthLayout>
  )
}