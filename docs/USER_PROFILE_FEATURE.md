# User Profile Feature Documentation

## Overview
The profile feature allows users to view and update their personal information, including name, username, and avatar.

## Features Implemented

### ✅ Profile Page (`/app/profile/page.tsx`)
- **Route**: `http://localhost:3000/profile`
- **Access**: Protected (requires authentication)
- **Layout**: Clean, card-based design with overview and edit sections

### ✅ Profile Form Component (`/components/profile/profile-form.tsx`)
- Real-time avatar preview
- Form validation with Zod schema
- Success/error feedback
- Auto-reload after successful update
- Disabled email field (read-only)

### ✅ User Menu in Header
- Avatar display in top-right corner
- Dropdown menu with:
  - User info (name/email)
  - Profile link
  - Settings link (placeholder)
  - Logout button

### ✅ Profile Update API
- Direct integration with database service
- Updates user information via PATCH request
- Automatic token management
- Local storage sync

## File Structure

```
frontend/
├── app/
│   └── profile/
│       └── page.tsx                 # Profile page route
├── components/
│   ├── profile/
│   │   └── profile-form.tsx         # Profile edit form
│   └── chat/
│       └── chat-interface.tsx       # Updated with user menu
├── lib/
│   └── api/
│       └── auth.ts                  # Added updateProfile method
└── types/
    └── auth.ts                      # User interface (already had id field)
```

## Component Details

### Profile Page (`/app/profile/page.tsx`)

**Features:**
- Authentication check (redirects if not logged in)
- Loading state
- Profile overview card with avatar
- Edit profile card with form

**Layout:**
```tsx
<Container>
  <Header>
    <Title>Profile Settings</Title>
    <Description>Manage your account settings</Description>
  </Header>
  
  <ProfileOverviewCard>
    <Avatar + User Info>
  </ProfileOverviewCard>
  
  <EditProfileCard>
    <ProfileForm>
  </EditProfileCard>
</Container>
```

### Profile Form (`/components/profile/profile-form.tsx`)

**Fields:**
1. **Avatar URL** (Text input with preview)
   - Type: URL
   - Optional
   - Real-time preview
   - Supports any image URL

2. **First Name** (Required)
   - Min: 1 character
   - Max: 50 characters
   - Validation: Required

3. **Last Name** (Required)
   - Min: 1 character
   - Max: 50 characters
   - Validation: Required

4. **Username** (Optional)
   - Min: 3 characters
   - Max: 30 characters
   - Validation: Optional

5. **Email** (Read-only)
   - Disabled field
   - Cannot be changed
   - Description: "Contact support to change email"

**Validation Schema:**
```typescript
const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30).optional().or(z.literal('')),
  email: z.string().email(),
  avatar: z.string().url().optional().or(z.literal('')),
});
```

**Form Behavior:**
- ✅ Submit → Call API → Show success → Reload page (2s delay)
- ❌ Error → Show error message → Stay on form
- 🔄 Loading → Disable button → Show spinner

### User Menu (in Chat Interface Header)

**Dropdown Menu Items:**
1. **Profile** → Navigate to `/profile`
2. **Settings** → Navigate to `/settings` (placeholder)
3. **Log out** → Call `signOut()` → Redirect to `/auth/register`

**Avatar Display:**
- Shows user avatar if available
- Fallback to initials (first letter of first name + last name)
- Fallback to first letter of email if no name

## API Integration

### Update Profile Method

**File:** `/lib/api/auth.ts`

**Method:** `updateProfile(data)`

**Implementation:**
```typescript
async updateProfile(data: {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}): Promise<User> {
  const user = this.getUser();
  if (!user) {
    throw new Error('No user found');
  }

  // Call database service directly
  const response = await axios.patch(
    `http://localhost:3002/users/${user.id}`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    }
  );

  // Update stored user data
  const updatedUser = { ...user, ...response.data };
  this.setUser(updatedUser);
  
  return updatedUser;
}
```

**Flow:**
1. Get current user from localStorage
2. Make PATCH request to `/users/:id`
3. Include auth token in headers
4. Receive updated user data
5. Merge with existing user data
6. Update localStorage
7. Return updated user

## User Flow

### Accessing Profile

**From Header:**
1. Click avatar in top-right corner
2. Dropdown menu opens
3. Click "Profile"
4. Navigate to `/profile`

**From URL:**
1. Visit `http://localhost:3000/profile` directly
2. Middleware checks authentication
3. If logged in → Show profile page
4. If not logged in → Redirect to `/auth/register`

### Updating Profile

**Step-by-Step:**
1. Navigate to profile page
2. See current information in overview card
3. Scroll to edit form (pre-filled with current data)
4. Modify desired fields:
   - Change first name
   - Change last name
   - Add/change username
   - Add/change avatar URL
5. Click "Save Changes"
6. Loading state shows (button disabled, spinner)
7. Success message appears
8. Page reloads after 2 seconds
9. See updated information

**Avatar Update:**
1. Paste image URL in avatar field
2. Avatar preview updates instantly
3. Submit form to save
4. Avatar updates in:
   - Profile overview card
   - Header user menu
   - All other places user avatar appears

## Styling

### Theme Support
- ✅ Light mode
- ✅ Dark mode
- Uses shadcn/ui theme system

### Responsive Design
- ✅ Mobile: Single column, stacked cards
- ✅ Tablet: Single column, wider cards
- ✅ Desktop: Centered container, max-width 4xl

### Components Used
- `Card` - Container for sections
- `Avatar` - User profile picture
- `Input` - Form fields
- `Button` - Actions
- `Label` - Field labels
- `Form` - Form wrapper with validation
- `DropdownMenu` - User menu in header

## Security

### Authentication
- ✅ Profile page is protected by middleware
- ✅ Redirects to `/auth/register` if not logged in
- ✅ JWT token required for API calls

### Authorization
- ✅ Users can only update their own profile
- ✅ Token includes user ID for verification
- ✅ Email cannot be changed (prevents account hijacking)

### Data Validation
- ✅ Client-side validation with Zod
- ✅ Server-side validation in database service
- ✅ Type safety with TypeScript

## Error Handling

### Network Errors
- API call fails → Show error message
- Token expired → Automatic refresh (handled by interceptor)
- No internet → Show connection error

### Validation Errors
- Invalid email → "Please enter a valid email"
- Short username → "Username must be at least 3 characters"
- Empty name → "First/Last name is required"
- Invalid URL → "Please enter a valid URL"

### User Errors
- No changes made → Form still submits (idempotent)
- Cancel button → Returns to home page
- Network timeout → Show retry option

## Testing

### Manual Testing Checklist

**Profile Page Access:**
- [ ] Visit `/profile` while logged in → Shows profile page
- [ ] Visit `/profile` while logged out → Redirects to `/auth/register`
- [ ] Click avatar in header → Shows dropdown menu
- [ ] Click "Profile" in menu → Navigates to `/profile`

**Profile Display:**
- [ ] Overview card shows current avatar
- [ ] Overview card shows current name/email
- [ ] Form is pre-filled with current data
- [ ] Email field is disabled (read-only)

**Profile Update:**
- [ ] Change first name → Submit → Success
- [ ] Change last name → Submit → Success
- [ ] Change username → Submit → Success
- [ ] Change avatar URL → Preview updates → Submit → Success
- [ ] Leave username empty → Submit → Success (optional field)
- [ ] Clear avatar → Submit → Success (falls back to initials)

**Avatar Preview:**
- [ ] Paste valid image URL → Preview updates immediately
- [ ] Paste invalid URL → Preview shows fallback
- [ ] Clear avatar field → Preview shows initials

**Form Validation:**
- [ ] Submit with empty first name → Shows error
- [ ] Submit with empty last name → Shows error
- [ ] Submit with 1-2 char username → Shows error
- [ ] Submit with 51+ char name → Shows error

**Success Flow:**
- [ ] Submit valid changes → Loading spinner shows
- [ ] Success message appears (green background)
- [ ] Page reloads after 2 seconds
- [ ] Changes are reflected everywhere

**Navigation:**
- [ ] Click "Cancel" → Returns to home page
- [ ] Click "Log out" in menu → Logs out and redirects

### Integration Testing

**Test Scenarios:**

1. **New User (No Name Set):**
   ```
   - Register with email only
   - Avatar shows email initial
   - Visit profile
   - Set first/last name
   - Submit
   - Avatar shows name initials
   ```

2. **GitHub OAuth User:**
   ```
   - Sign in with GitHub
   - Avatar shows GitHub profile picture
   - Visit profile
   - Change avatar URL
   - Submit
   - Avatar shows new image
   ```

3. **Update All Fields:**
   ```
   - Visit profile
   - Change all editable fields
   - Submit
   - Verify all changes saved
   - Check header avatar updated
   ```

4. **Network Failure:**
   ```
   - Disconnect internet
   - Try to update profile
   - See error message
   - Reconnect internet
   - Retry → Success
   ```

## Future Enhancements

### Planned Features
- [ ] **Upload avatar from file** (currently only URL)
- [ ] **Change email** (with verification)
- [ ] **Change password**
- [ ] **Two-factor authentication**
- [ ] **Account deletion**
- [ ] **Activity log** (last login, recent changes)
- [ ] **Social media links**
- [ ] **Bio/description field**
- [ ] **Privacy settings**

### Nice to Have
- [ ] Crop/resize avatar
- [ ] Multiple avatars (select from gallery)
- [ ] Profile badges/achievements
- [ ] Custom themes per user
- [ ] Profile visibility settings (public/private)

## Troubleshooting

### Issue: Avatar not showing
**Causes:**
- Invalid URL
- CORS blocked image
- Image doesn't exist

**Solutions:**
- Use image hosting services (Imgur, Cloudinary)
- Use Gravatar with email hash
- Check browser console for CORS errors

### Issue: Changes not saving
**Causes:**
- Token expired
- Network error
- Server down

**Solutions:**
- Check browser console for errors
- Try logging out and back in
- Verify all services are running

### Issue: Profile page not loading
**Causes:**
- Not authenticated
- Middleware blocking
- Frontend not running

**Solutions:**
- Check if logged in (look for avatar in header)
- Clear cookies and localStorage
- Restart frontend service

### Issue: "User not found" error
**Causes:**
- User ID mismatch
- Database out of sync
- Token invalid

**Solutions:**
- Log out and log back in
- Check database for user record
- Verify token payload

## API Endpoints Used

### Database Service

**PATCH /users/:id**
- **Purpose**: Update user profile
- **Auth**: Bearer token required
- **Body**: 
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "username": "string",
    "avatar": "string"
  }
  ```
- **Response**: Updated user object
- **Errors**:
  - 404: User not found
  - 401: Unauthorized
  - 409: Username already taken

**GET /users/:id**
- **Purpose**: Get user profile (used by getProfile)
- **Auth**: Bearer token required
- **Response**: User object

## Summary

The profile feature is now fully integrated with:
- ✅ Dedicated profile page at `/profile`
- ✅ Profile edit form with validation
- ✅ User menu in header with avatar
- ✅ API integration for updates
- ✅ Real-time avatar preview
- ✅ Protected routes with middleware
- ✅ Success/error handling
- ✅ Responsive design
- ✅ Dark/light theme support

Users can now easily view and update their profile information with a beautiful, intuitive interface! 🎉
