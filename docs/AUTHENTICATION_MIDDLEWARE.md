# Authentication Middleware Documentation

## Overview
The authentication middleware automatically protects all routes in the application, redirecting unauthenticated users to the registration page.

## How It Works

### Middleware (`/middleware.ts`)
The middleware runs on every request and manages authentication state.

**Flow:**
1. Request comes in
2. Check if route is a public asset → Allow
3. Get authentication status from cookies
4. Check if user is trying to access auth pages (signin/register/etc.)
5. **If authenticated AND on auth page** → Redirect to home (`/`)
6. **If NOT authenticated AND on protected page** → Redirect to register (`/auth/register`)
7. Otherwise → Allow access

This creates a seamless experience:
- Logged-in users can't access auth pages (no need to login again)
- Logged-out users can't access protected pages
- Users are automatically redirected to the right place

### Public Routes
The following routes are authentication pages (accessible only when NOT logged in):
- `/auth/signin`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/callback` (OAuth callback - always accessible)
- All static assets (`/_next`, `/favicon.ico`, etc.)

### Protected Routes
All other routes require authentication:
- `/` (home page)
- Any custom routes you add

## Token Storage

Tokens are now stored in **both** localStorage and cookies:

### localStorage
- **Key**: `accessToken`, `refreshToken`, `user`
- **Purpose**: Client-side access for API calls
- **Lifetime**: Until manually cleared or expired

### Cookies
- **Keys**: `accessToken`, `refreshToken`
- **Purpose**: Server-side middleware access
- **Lifetime**: 
  - Access token: 15 minutes
  - Refresh token: 7 days
- **Security**: 
  - `HttpOnly`: No (need client-side access)
  - `Secure`: Only in production
  - `SameSite`: Lax

## Updated Files

### 1. `/middleware.ts` (NEW)
Server-side middleware that checks cookies for authentication.

### 2. `/lib/cookies.ts` (NEW)
Utility functions for cookie management:
- `setCookie(name, value, options)`
- `getCookie(name)`
- `deleteCookie(name)`
- `hasCookie(name)`

### 3. `/lib/api/auth.ts` (UPDATED)
- Now stores tokens in both localStorage and cookies
- `setTokens()` - Stores in both places
- `getAccessToken()` - Checks localStorage first, then cookies
- `clearTokens()` - Clears both localStorage and cookies

### 4. `/app/auth/callback/page.tsx` (UPDATED)
OAuth callback now stores tokens in both localStorage and cookies.

## Authentication Flow

### Regular Login
1. User submits login form
2. `authService.login()` called
3. Tokens received from API
4. `setTokens()` stores in localStorage + cookies
5. User data stored in localStorage
6. Middleware allows access to protected routes

### OAuth Login (GitHub)
1. User clicks "GitHub" button
2. Redirected to GitHub for authorization
3. GitHub redirects back to `/auth/callback?accessToken=...&refreshToken=...`
4. Callback page extracts tokens
5. Tokens stored in localStorage + cookies
6. User profile fetched and stored
7. Redirected to home page
8. Middleware allows access

### Logout
1. User clicks logout
2. `authService.logout()` called
3. `clearTokens()` removes from localStorage + cookies
4. Middleware redirects to `/auth/register`

## Testing

### Test Middleware Protection

**When NOT logged in:**
1. Visit `http://localhost:3000/` → Should redirect to `/auth/register` ✓
2. Visit `http://localhost:3000/auth/signin` → Should show signin page ✓
3. Visit `http://localhost:3000/auth/register` → Should show register page ✓

**When logged in:**
1. Visit `http://localhost:3000/` → Should show home page ✓
2. Visit `http://localhost:3000/auth/signin` → Should redirect to `/` (home) ✓
3. Visit `http://localhost:3000/auth/register` → Should redirect to `/` (home) ✓

**After logout:**
1. Visit `http://localhost:3000/` → Should redirect to `/auth/register` ✓
2. Visit `http://localhost:3000/auth/signin` → Should show signin page ✓

### Test Public Routes
Visit these without logging in (should work):
- `http://localhost:3000/auth/signin`
- `http://localhost:3000/auth/register`
- `http://localhost:3000/auth/forgot-password`

## Customization

### Change Redirect Destination
Edit `/middleware.ts`:
```typescript
// Change this line to redirect to signin instead
url.pathname = '/auth/signin'; // or '/auth/register'
```

### Add More Public Routes
Edit `/middleware.ts`:
```typescript
const publicRoutes = [
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/callback',
  '/your-new-public-route', // Add here
];
```

### Protect Specific Routes Only
To protect only specific routes instead of all routes:
```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    // Only these routes will be protected
  ],
};
```

## Security Considerations

### Cookie Security
- **Production**: Cookies use `Secure` flag (HTTPS only)
- **Development**: Cookies work over HTTP
- **SameSite**: Set to `lax` to prevent CSRF while allowing OAuth

### Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- Automatic refresh handled by axios interceptor

### XSS Protection
- Tokens are in cookies and localStorage (both accessible by JS)
- Use Content Security Policy (CSP) in production
- Sanitize all user inputs
- Use HTTPS in production

## Troubleshooting

### Issue: Middleware Not Working
**Check:**
1. Is `/middleware.ts` in the root of the `frontend` folder?
2. Run `npm run dev` to rebuild
3. Clear browser cookies and localStorage
4. Check browser console for errors

### Issue: Infinite Redirect Loop
**Causes:**
- Auth pages are not in `publicRoutes`
- Token is malformed or expired
**Fix:**
- Add route to `publicRoutes` array
- Clear cookies and try logging in again

### Issue: Can't Access Protected Routes After Login
**Check:**
1. Are tokens stored? (Check Application tab in DevTools)
2. Are cookies set? (Check Application → Cookies)
3. Check middleware logs in terminal

### Issue: OAuth Callback Fails
**Check:**
1. Is `/auth/callback` in `publicRoutes`? ✓ (it is)
2. Are tokens being extracted from URL?
3. Check browser console for errors

## Next Steps

### Add Role-Based Access Control
Extend middleware to check user roles:
```typescript
// In middleware.ts
const user = JSON.parse(getCookie('user') || '{}');
if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/unauthorized', request.url));
}
```

### Add Token Refresh in Middleware
Check token expiration and refresh automatically:
```typescript
// Decode JWT and check expiration
// If expired, call refresh endpoint
// Update cookies with new token
```

### Add Logging/Analytics
Track authentication events:
```typescript
// Log successful authentications
// Track failed login attempts
// Monitor protected route access
```
