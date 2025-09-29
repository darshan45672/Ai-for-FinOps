import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FinOps AI</h1>
                <p className="text-sm text-muted-foreground">Intelligent Financial Operations</p>
              </div>
            </div>
            <blockquote className="space-y-4">
              <p className="text-lg leading-relaxed">
                &ldquo;Transform your financial operations with AI-powered insights and automation. 
                Make data-driven decisions faster than ever before.&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground">
                — Built for modern finance teams
              </footer>
            </blockquote>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FinOps AI</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}