"use client"

import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const handleForgotPassword = async (data: { email: string }) => {
    setIsLoading(true)
    
    try {
      await forgotPassword(data.email)
      setIsSuccess(true)
    } catch (error) {
      console.error("Forgot password error:", error)
      alert("Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email to receive a reset link"
    >
      <ForgotPasswordForm 
        onSubmit={handleForgotPassword}
        isLoading={isLoading}
        isSuccess={isSuccess}
      />
    </AuthLayout>
  )
}