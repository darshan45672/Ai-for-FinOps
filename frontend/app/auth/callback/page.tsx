'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { setCookie } from '@/lib/cookies';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (!accessToken || !refreshToken) {
          setError('No authentication tokens received');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Store tokens in cookies for middleware
        setCookie('accessToken', accessToken, {
          expires: 1/96, // 15 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        
        setCookie('refreshToken', refreshToken, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        // Fetch user profile with the new access token
        const response = await axios.get('http://localhost:3001/auth/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data));

        // Redirect to home (force reload to update auth context)
        window.location.href = '/';
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Failed to complete sign in');
        setTimeout(() => router.push('/auth/signin'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Redirecting to sign in...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">Completing sign in...</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
}
