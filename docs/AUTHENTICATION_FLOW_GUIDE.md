# Authentication Flow Visual Guide

## User States & Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION STATES                        │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║                    NOT AUTHENTICATED                           ║
║  (No accessToken cookie)                                       ║
╚═══════════════════════════════════════════════════════════════╝

    Try to access: /                  →  Redirect to: /auth/register
    Try to access: /dashboard         →  Redirect to: /auth/register
    Try to access: /profile           →  Redirect to: /auth/register
    
    Try to access: /auth/signin       →  ✓ Allow (Show signin page)
    Try to access: /auth/register     →  ✓ Allow (Show register page)
    Try to access: /auth/forgot       →  ✓ Allow (Show forgot page)


╔═══════════════════════════════════════════════════════════════╗
║                      AUTHENTICATED                             ║
║  (Has valid accessToken cookie)                                ║
╚═══════════════════════════════════════════════════════════════╝

    Try to access: /                  →  ✓ Allow (Show home page)
    Try to access: /dashboard         →  ✓ Allow (Show dashboard)
    Try to access: /profile           →  ✓ Allow (Show profile)
    
    Try to access: /auth/signin       →  Redirect to: /
    Try to access: /auth/register     →  Redirect to: /
    Try to access: /auth/forgot       →  Redirect to: /


┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 1: New User Registration                             ║
╚════════════════════════════════════════════════════════════════╝

1. Visit: http://localhost:3000/
   ↓
2. Middleware detects: No accessToken cookie
   ↓
3. Redirect to: /auth/register
   ↓
4. User fills registration form
   ↓
5. Submit → API call to /auth/register
   ↓
6. Receive tokens → Store in cookies + localStorage
   ↓
7. Redirect to: / (home)
   ↓
8. Middleware detects: Valid accessToken
   ↓
9. ✓ Show home page


╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 2: Existing User Login                               ║
╚════════════════════════════════════════════════════════════════╝

1. Visit: http://localhost:3000/
   ↓
2. Middleware detects: No accessToken cookie
   ↓
3. Redirect to: /auth/register
   ↓
4. User clicks "Sign in" link
   ↓
5. Navigate to: /auth/signin
   ↓
6. User fills login form
   ↓
7. Submit → API call to /auth/login
   ↓
8. Receive tokens → Store in cookies + localStorage
   ↓
9. Redirect to: / (home)
   ↓
10. Middleware detects: Valid accessToken
    ↓
11. ✓ Show home page


╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 3: GitHub OAuth Login                                ║
╚════════════════════════════════════════════════════════════════╝

1. Visit: http://localhost:3000/auth/signin
   ↓
2. Click "GitHub" button
   ↓
3. Redirect to: http://localhost:3001/auth/github
   ↓
4. Redirect to: https://github.com/login/oauth/authorize
   ↓
5. User authorizes app on GitHub
   ↓
6. GitHub redirects to: /auth/github/callback?code=...
   ↓
7. Backend exchanges code for user data
   ↓
8. Backend creates/updates user
   ↓
9. Backend generates tokens
   ↓
10. Backend redirects to: /auth/callback?accessToken=...&refreshToken=...
    ↓
11. Frontend extracts tokens from URL
    ↓
12. Store tokens in cookies + localStorage
    ↓
13. Fetch user profile
    ↓
14. Redirect to: / (home)
    ↓
15. Middleware detects: Valid accessToken
    ↓
16. ✓ Show home page


╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 4: Already Logged In (Try to access auth pages)     ║
╚════════════════════════════════════════════════════════════════╝

1. Already logged in with valid tokens
   ↓
2. Try to visit: /auth/signin
   ↓
3. Middleware detects: Valid accessToken + Auth page
   ↓
4. Redirect to: / (home)
   ↓
5. ✓ Show home page (prevents accessing login again)


╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 5: User Logout                                       ║
╚════════════════════════════════════════════════════════════════╝

1. User on home page (authenticated)
   ↓
2. Click "Logout" button
   ↓
3. API call to: /auth/logout
   ↓
4. Clear tokens from cookies + localStorage
   ↓
5. Redirect to: /auth/register
   ↓
6. Middleware detects: No accessToken
   ↓
7. ✓ Show register page


╔════════════════════════════════════════════════════════════════╗
║  SCENARIO 6: Token Expiration (Auto Refresh)                  ║
╚════════════════════════════════════════════════════════════════╝

1. User makes API call with expired accessToken
   ↓
2. API returns: 401 Unauthorized
   ↓
3. Axios interceptor catches error
   ↓
4. Try to refresh: POST /auth/refresh with refreshToken
   ↓
5a. Success:
    - Receive new tokens
    - Update cookies + localStorage
    - Retry original request
    - ✓ Continue working
    
5b. Refresh Failed:
    - Clear all tokens
    - Redirect to: /auth/signin
    - User must log in again


┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LOGIC FLOW                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Request comes  │
                    │      in         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Is public      │
                    │  asset?         │
                    │ (_next, *.svg)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Yes → Allow    │
                    └─────────────────┘
                             │ No
                    ┌────────▼────────┐
                    │ Get accessToken │
                    │  from cookies   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Is user        │
                    │ authenticated?  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │    YES      │          │     NO      │
         │ Has token   │          │  No token   │
         └──────┬──────┘          └──────┬──────┘
                │                        │
      ┌─────────▼─────────┐    ┌─────────▼─────────┐
      │  Is trying to     │    │  Is trying to     │
      │  access auth      │    │  access auth      │
      │  page?            │    │  page?            │
      └─────────┬─────────┘    └─────────┬─────────┘
                │                        │
       ┌────────┴────────┐      ┌────────┴────────┐
       │ Yes       │ No  │      │ Yes       │ No  │
       ▼           ▼     │      ▼           ▼     │
  Redirect to    Allow   │    Allow    Redirect to│
      /           ✓      │     ✓       /auth/     │
                         │            register    │
                         └────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                     KEY SECURITY FEATURES                        │
└─────────────────────────────────────────────────────────────────┘

✓ Automatic route protection
✓ Prevents accessing login pages when already logged in
✓ Tokens stored in secure cookies (with HttpOnly option in production)
✓ Automatic token refresh on expiration
✓ Clear tokens on logout
✓ Server-side middleware (runs before page renders)
✓ Client-side localStorage backup
✓ OAuth flow support (GitHub)
✓ Type-safe with TypeScript
