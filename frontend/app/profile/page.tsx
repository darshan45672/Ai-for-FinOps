'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfileForm } from '@/components/profile/profile-form';
import { ChangePassword } from '@/components/settings/change-password';
import { ResetPassword } from '@/components/settings/reset-password';
import { DeleteAccount } from '@/components/settings/delete-account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Loader2, User, Mail, Calendar, Shield, Github, ArrowLeft, Home } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username || user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            {/* Breadcrumb Navigation */}
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      <span>Home</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* GitHub Badge */}
          {user.githubId && (
            <Badge variant="secondary" className="hidden md:flex gap-2">
              <Github className="h-3 w-3" />
              GitHub Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile Settings</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Manage your account settings and personal information
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          {/* Left Sidebar - Profile Card */}
          <aside className="space-y-6">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center space-y-5">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-28 w-28 border-2 border-border shadow-lg">
                      <AvatarImage src={user.avatar || undefined} alt={fullName} />
                      <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {user.githubId && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1.5 shadow-md ring-2 ring-background">
                        <Github className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="space-y-1 text-center w-full">
                    <h2 className="text-xl font-bold truncate px-2">{fullName}</h2>
                    {user.username && user.username !== fullName && (
                      <p className="text-sm text-muted-foreground truncate px-2">@{user.username}</p>
                    )}
                  </div>

                  <Separator />

                  {/* User Details */}
                  <div className="w-full space-y-3">
                    <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                      </div>
                    </div>

                    {user.role && (
                      <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                          <p className="text-sm font-medium capitalize">{user.role}</p>
                        </div>
                      </div>
                    )}

                    {user.createdAt && (
                      <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Since</p>
                          <p className="text-sm font-medium">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Content - Tabs */}
          <main className="space-y-6">
            <Tabs defaultValue="edit" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="gap-2">
                  <User className="h-4 w-4" />
                  Edit Profile
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Edit Profile Tab */}
              <TabsContent value="edit" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-0">
                <div className="space-y-6">
                  {/* Security Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Security</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your password and account security settings
                      </p>
                    </div>
                    
                    <ChangePassword />
                    <ResetPassword />
                  </div>

                  <Separator />

                  {/* Danger Zone Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">
                        Irreversible actions that permanently affect your account
                      </p>
                    </div>
                    
                    <DeleteAccount />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
