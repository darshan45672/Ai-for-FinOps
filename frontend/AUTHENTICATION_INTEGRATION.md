# Authentication Integration Guide

## Overview

This frontend application is integrated with the Authentication Service microservice. The authentication system provides:

- User registration
- User login with JWT tokens
- Token refresh mechanism
- Protected routes
- User profile management
- Persistent authentication state

## Architecture

### Services Communication

```
Frontend (Next.js:3003) → Authentication Service (NestJS:3001) → Database Service (NestJS:3002) → PostgreSQL (Neon)
```

### Authentication Flow

1. **Registration**: `POST /auth/register` → Returns user data + tokens
2. **Login**: `POST /auth/login` → Returns user data + tokens
3. **Token Refresh**: `POST /auth/refresh` → Returns new access + refresh tokens
4. **Get Profile**: `GET /auth/profile` → Returns current user data
5. **Logout**: `POST /auth/logout` → Invalidates tokens

## File Structure

```
frontend/
├── .env.local                          # Environment configuration
├── types/
│   └── auth.ts                         # TypeScript types for auth
├── lib/
│   └── api/
│       └── auth.ts                     # Auth API client service
├── contexts/
│   └── auth-context.tsx                # Auth context provider
├── components/
│   └── auth/
│       ├── protected-route.tsx         # Protected route wrapper
│       ├── signin-form.tsx             # Sign-in form component
│       ├── register-form.tsx           # Registration form component
│       └── auth-layout.tsx             # Auth pages layout
└── app/
    └── auth/
        ├── signin/
        │   └── page.tsx                # Sign-in page
        ├── register/
        │   └── page.tsx                # Registration page
        └── forgot-password/
            └── page.tsx                # Forgot password page
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install axios
```

### 2. Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_DATABASE_API_URL=http://localhost:3002
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="AI for FinOps"
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 3. Start the Services

**Terminal 1 - Database Service:**
```bash
cd database
npm run start:dev
```

**Terminal 2 - Authentication Service:**
```bash
cd authentication
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## Usage

### Auth Context Provider

The `AuthProvider` must wrap your app in `app/layout.tsx`:

```tsx
import { AuthProvider } from '@/contexts/auth-context'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Using the Auth Hook

```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Protecting Routes

**Method 1: Using the ProtectedRoute Component**

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

**Method 2: Using the useRequireAuth Hook**

```tsx
import { useRequireAuth } from '@/contexts/auth-context'

export default function ProfilePage() {
  const auth = useRequireAuth() // Automatically redirects if not authenticated

  return <div>Welcome {auth.user?.firstName}!</div>
}
```

### Sign In

```tsx
const { signIn } = useAuth()

try {
  await signIn('user@example.com', 'password123', true)
  // Redirect to dashboard
} catch (error) {
  console.error('Login failed:', error)
}
```

### Register

```tsx
const { signUp } = useAuth()

try {
  await signUp({
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe', // optional
  })
  // Redirect to dashboard
} catch (error) {
  console.error('Registration failed:', error)
}
```

### Sign Out

```tsx
const { signOut } = useAuth()

await signOut()
// User will be redirected to sign-in page
```

## Authentication Service API

### Register User
```
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

### Login
```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Get Profile
```
GET http://localhost:3001/auth/profile
Authorization: Bearer <access_token>
```

### Refresh Token
```
POST http://localhost:3001/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Logout
```
POST http://localhost:3001/auth/logout
Authorization: Bearer <access_token>
```

## Token Management

### Storage
- `access_token` - Stored in localStorage, short-lived (15 minutes)
- `refresh_token` - Stored in localStorage, long-lived (7 days)
- `user_data` - Stored in localStorage, user profile information

### Automatic Token Refresh

The auth service automatically refreshes expired access tokens using the refresh token. This happens transparently in the axios interceptor.

### Token Lifecycle

1. User logs in → Receives access + refresh tokens
2. Access token expires → Interceptor automatically refreshes it
3. Refresh token expires → User must log in again
4. User logs out → All tokens are cleared

## Security Best Practices

### ✅ Implemented

- JWT tokens stored in localStorage
- Automatic token refresh
- Token validation on page load
- Protected routes
- HTTPS in production (recommended)

### 🔐 Production Considerations

1. **Use HTTP-only cookies** instead of localStorage (prevents XSS)
2. **Enable CSRF protection**
3. **Implement rate limiting** on auth endpoints
4. **Use HTTPS** for all communications
5. **Set up proper CORS** policies
6. **Implement refresh token rotation**
7. **Add 2FA** for enhanced security

## Error Handling

All authentication errors are caught and displayed to the user:

```tsx
try {
  await signIn(email, password)
} catch (error: any) {
  const errorMessage = 
    error?.response?.data?.message || 
    error?.message || 
    "Authentication failed"
  
  // Display error to user
  setError(errorMessage)
}
```

## Troubleshooting

### Issue: "Cannot connect to authentication service"

**Solution:**
- Ensure authentication service is running on port 3001
- Check `.env.local` has correct `NEXT_PUBLIC_AUTH_API_URL`
- Verify CORS is enabled on the authentication service

### Issue: "Token validation failed"

**Solution:**
- Check JWT_SECRET matches between services
- Ensure tokens are not expired
- Clear localStorage and login again

### Issue: "User not found after login"

**Solution:**
- Verify database service is running
- Check database connection string
- Ensure database migrations have run

### Issue: "CORS error"

**Solution:**
Add to authentication service `main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:3003',
  credentials: true,
});
```

## Testing

### Manual Testing

1. **Start all services** (database, authentication, frontend)
2. **Open browser** to `http://localhost:3003`
3. **Register a new user** at `/auth/register`
4. **Sign in** at `/auth/signin`
5. **Verify redirect** to home page
6. **Check token** in localStorage (DevTools → Application → Local Storage)
7. **Refresh page** - should stay authenticated
8. **Sign out** - should clear tokens and redirect

### API Testing with curl

**Register:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test","lastName":"User"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Get Profile:**
```bash
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <your_access_token>"
```

## Next Steps

1. **Implement password reset** functionality
2. **Add email verification**
3. **Implement 2FA** (Two-Factor Authentication)
4. **Add social login** (Google, GitHub, etc.)
5. **Implement refresh token rotation**
6. **Add user profile editing**
7. **Implement role-based access control** (RBAC)

## Support

For issues or questions:
- Check the authentication service logs
- Verify all environment variables are set correctly
- Ensure all services are running
- Check browser console for errors

## API Documentation

- **Authentication Service Swagger**: http://localhost:3001/api/docs
- **Database Service Swagger**: http://localhost:3002/api/docs
