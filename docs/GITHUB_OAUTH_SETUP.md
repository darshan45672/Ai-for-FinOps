# GitHub OAuth Setup Guide

## Overview
GitHub OAuth has5. **Token Generation**: JWT tokens are generated and sent to frontend
6. **Frontend Redirect**: User is redirected to `http://localhost:3000/auth/callback` with tokens
7. **Complete**: Tokens are stored and user is logged inen successfully integrated into the authentication system. To complete the setup, you need to create a GitHub OAuth App and configure the credentials.

## Steps to Set Up GitHub OAuth App

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on **"New OAuth App"**
3. Fill in the following details:
   - **Application name**: `Ai-for-FinOps` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: `AI-powered FinOps platform` (optional)
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
4. Click **"Register application"**

### 2. Get Client ID and Secret

1. After creating the app, you'll see your **Client ID** on the page
2. Click **"Generate a new client secret"** to create a client secret
3. **Important**: Copy the client secret immediately - you won't be able to see it again!

### 3. Update Environment Variables

Add the following variables to `/authentication/.env`:

```env
GITHUB_CLIENT_ID="your-github-client-id-here"
GITHUB_CLIENT_SECRET="your-github-client-secret-here"
```

Replace `"your-github-client-id-here"` and `"your-github-client-secret-here"` with the actual values from GitHub.

### 4. Restart the Authentication Service

After updating the `.env` file, restart the authentication service:

```bash
cd authentication
npm run start:dev
```

## How It Works

### Authentication Flow

1. **User clicks "Sign in with GitHub"** on the signin page
2. **Redirect to GitHub**: User is redirected to `http://localhost:3001/auth/github`
3. **GitHub Authorization**: GitHub shows authorization page asking user to grant access
4. **Callback**: GitHub redirects back to `http://localhost:3001/auth/github/callback` with auth code
5. **User Creation/Login**:
   - If user's GitHub ID exists → Log them in
   - If email exists → Link GitHub account to existing user
   - If new user → Create account with GitHub details
6. **Token Generation**: JWT tokens are generated and sent to frontend
7. **Frontend Redirect**: User is redirected to `http://localhost:3003/auth/callback` with tokens
8. **Complete**: Tokens are stored and user is logged in

### Database Changes

The following changes were made to support OAuth:

**Prisma Schema Updates:**
- Added `githubId String? @unique` to User model
- Made `password` optional (OAuth users don't need password)
- Added index on `githubId` for faster lookups

**New Endpoints:**
- `GET /auth/github` - Initiates OAuth flow
- `GET /auth/github/callback` - Handles OAuth callback
- `GET /users/github/:githubId` - Finds user by GitHub ID
- `PATCH /users/:id` - Updates user with OAuth data

### Frontend Changes

**New Page:**
- `/app/auth/callback/page.tsx` - Handles OAuth redirect and stores tokens

**Updated Components:**
- `signin-form.tsx` - GitHub button redirects to OAuth endpoint

## Testing

Once configured, you can test the OAuth flow:

1. Start all services:
   ```bash
   # Terminal 1 - Database service
   cd database && npm run start:dev
   
   # Terminal 2 - Authentication service
   cd authentication && npm run start:dev
   
   # Terminal 3 - Frontend
   cd frontend && npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`
3. Click the **"GitHub"** button
4. Authorize the app on GitHub
5. You should be redirected back and logged in automatically

## Troubleshooting

### Issue: "Callback URL mismatch"
- Make sure the callback URL in GitHub matches exactly: `http://localhost:3001/auth/github/callback`
- No trailing slash!

### Issue: "Client authentication failed"
- Double-check your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces or quotes

### Issue: "Failed to complete sign in"
- Check that all three services are running (database, auth, frontend)
- Verify the database migration was successful
- Check browser console and server logs for errors

## Production Deployment

For production, you'll need to:

1. Create a new GitHub OAuth App with production URLs
2. Update the following in production `.env`:
   ```env
   GITHUB_CLIENT_ID="production-client-id"
   GITHUB_CLIENT_SECRET="production-client-secret"
   GITHUB_CALLBACK_URL="https://your-domain.com/auth/github/callback"
   FRONTEND_URL="https://your-frontend-domain.com"
   ```
3. Update the callback URL in your GitHub OAuth App settings

## Features Implemented

✅ GitHub OAuth authentication
✅ Automatic user creation on first OAuth login
✅ Account linking (OAuth with existing email)
✅ Avatar import from GitHub profile
✅ Email verification status from GitHub
✅ Seamless token management
✅ Error handling and fallbacks

## Next Steps

You could extend this by:
- Adding Google OAuth using a similar pattern
- Implementing account unlinking
- Adding more OAuth providers (Twitter, LinkedIn, etc.)
- Storing OAuth refresh tokens for GitHub API access
- Syncing profile updates from GitHub
