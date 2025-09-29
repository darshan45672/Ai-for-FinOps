"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordForm) => Promise<void>
  isLoading?: boolean
  isSuccess?: boolean
}

export function ForgotPasswordForm({ onSubmit, isLoading = false, isSuccess = false }: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We&apos;ve sent a password reset link to {form.getValues("email")}
            </p>
          </div>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>Didn&apos;t receive the email? Check your spam folder.</p>
            <p>The link will expire in 24 hours for security reasons.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={() => onSubmit(form.getValues())}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend email"
            )}
          </Button>
          
          <Link href="/auth/signin">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </Form>

      <Link href="/auth/signin">
        <Button variant="ghost" className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Button>
      </Link>
    </div>
  )
}