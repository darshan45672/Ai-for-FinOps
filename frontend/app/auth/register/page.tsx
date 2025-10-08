"use client"

import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleRegister = async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    acceptTerms: boolean
  }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signUp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })
      
      router.push('/') // Redirect to chat interface after successful registration
    } catch (error: unknown) {
      console.error("Registration error:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Registration failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your journey with FinOps AI"
    >
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}
      <RegisterForm 
        onSubmit={handleRegister}
        isLoading={isLoading}
      />
    </AuthLayout>
  )
}