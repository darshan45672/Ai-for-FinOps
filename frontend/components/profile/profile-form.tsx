'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from '@/types/auth';
import { authService } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Upload, Check, AlertCircle, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  avatar: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
  const router = useRouter();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email,
      avatar: user.avatar || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username || undefined,
        avatar: data.avatar || undefined,
      });

      setSuccess(true);
      
      // Show success message for 2 seconds then reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarPreview(url || null);
    form.setValue('avatar', url);
  };

  const initials = `${form.watch('firstName')?.[0] || ''}${form.watch('lastName')?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/30 p-6 sm:flex-row sm:items-start">
          <div className="relative flex-shrink-0">
            <Avatar className="h-24 w-24 border-2 border-border shadow-md">
              <AvatarImage src={avatarPreview || undefined} alt="Profile" />
              <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1.5 shadow-sm ring-2 ring-background">
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="avatar" className="text-sm font-semibold">Profile Picture</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://avatars.githubusercontent.com/u/..."
              value={form.watch('avatar') || ''}
              onChange={handleAvatarChange}
              className="bg-background"
            />
            <FormDescription className="flex items-start gap-1.5 text-xs">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Enter a URL to your profile picture from GitHub, Gravatar, or any image URL.
              </span>
            </FormDescription>
            {form.formState.errors.avatar && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.avatar.message}
              </p>
            )}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold">Personal Information</h3>
            <p className="text-sm text-muted-foreground">
              Update your personal details displayed on your profile.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe123" {...field} className="bg-background" />
                </FormControl>
                <FormDescription>
                  A unique username for your account (optional but recommended).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (Read-only) */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    disabled 
                    className="bg-muted/50 cursor-not-allowed" 
                  />
                </FormControl>
                <FormDescription className="flex items-start gap-1.5 text-xs">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Your email address cannot be changed. Contact support if you need assistance.
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3.5">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-destructive">Error</h4>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-3.5">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">Success</h4>
              <p className="text-sm text-green-600/90 dark:text-green-400/90">
                Your profile has been updated successfully! Refreshing...
              </p>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/')}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || success}
            className="w-full sm:w-auto gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {success ? (
              <>
                <Check className="h-4 w-4" />
                Updated!
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
