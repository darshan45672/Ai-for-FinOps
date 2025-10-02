# Profile Page - Quick Reference Guide

## Overview
Modern, responsive profile management interface with two-column layout, tabbed navigation, and professional design.

---

## Page Structure

```
/profile
├── Header Section
│   ├── Title: "Profile Settings"
│   ├── Description
│   └── GitHub Badge (if connected)
│
├── Left Sidebar (Desktop)
│   ├── Large Avatar (132px)
│   ├── Full Name
│   ├── Username (if set)
│   ├── Email Card
│   ├── Role Card
│   └── Member Since Card
│
└── Right Content (Tabs)
    ├── Edit Profile Tab
    │   ├── Avatar Section (Featured)
    │   ├── Personal Info Section
    │   └── Action Buttons
    │
    └── Settings Tab (Placeholder)
```

---

## Responsive Behavior

### Desktop (1024px+)
- 3-column grid (sidebar 1 col, content 2 cols)
- Sticky sidebar
- Horizontal tabs
- 2-column form fields

### Tablet (640px - 1024px)
- Single column
- All elements stacked
- 2-column form fields
- Inline tabs

### Mobile (<640px)
- Single column
- Full-width elements
- Single column form
- Full-width tabs

---

## Key Components

### Avatar Display
```tsx
Sidebar: 132px with gradient fallback
Form: 112px with camera icon
Fallback: Gradient + initials
GitHub: Badge overlay (if connected)
```

### Info Cards
```tsx
Each card includes:
- Icon (Mail, Shield, Calendar)
- Label (muted text)
- Value (emphasized)
- Muted background
```

### Form Sections
```tsx
1. Avatar Section (Featured)
   - Large preview
   - URL input
   - Validation
   - Helper text

2. Personal Information
   - First Name (required)
   - Last Name (required)
   - Username (optional)
   - Email (read-only)

3. Actions
   - Cancel (outline)
   - Save Changes (primary)
```

---

## Color Scheme

### Backgrounds
```
Page: gradient-to-br from-background to-muted/20
Cards: bg-card with border
Info Cards: bg-muted/50
Avatar Fallback: gradient-to-br from-primary to-primary/70
Form Inputs: bg-background
```

### States
```
Success: green-500/10 bg, green-600 text
Error: destructive/10 bg, destructive text
Disabled: muted/50 bg
Focus: ring-2 ring-primary
```

---

## Typography Scale

```css
Page Title: text-3xl md:text-4xl font-bold
Sidebar Name: text-2xl font-bold
Section Headers: text-lg font-semibold
Labels: text-base font-medium
Body Text: text-sm
Helper Text: text-xs
Username: text-sm text-muted-foreground
```

---

## Spacing System

```css
Container Padding: py-6 md:py-10
Grid Gap: gap-6
Card Padding: p-6
Form Sections: space-y-8
Info Cards: space-y-3
Button Gap: gap-3
```

---

## Icons Used

```
User - Edit Profile tab
Shield - Settings tab, Role card
Mail - Email card
Calendar - Member Since card
Github - GitHub connection
Camera - Avatar upload
Loader2 - Loading state
Check - Success state
AlertCircle - Error/Info state
```

---

## Form Validation

### Rules
```typescript
firstName: min 1, max 50, required
lastName: min 1, max 50, required
username: min 3, max 30, optional
avatar: valid URL, optional
email: read-only
```

### Error Display
```
Field-level: Below input
Form-level: Card with icon
Success: Card with icon + auto-reload
```

---

## Interactive States

### Buttons
```
Default: Normal state
Hover: Subtle highlight
Active: Pressed state
Disabled: Reduced opacity
Loading: Spinner + disabled
Success: Check icon + green
```

### Form Fields
```
Default: Border
Focus: Ring
Error: Red border
Disabled: Muted bg
```

---

## Tab Navigation

### Edit Profile Tab
- Default active tab
- Contains profile form
- Full edit capabilities

### Settings Tab
- Placeholder currently
- Coming soon message
- Ready for expansion

---

## User Flow

1. **Page Load**
   - Show loading spinner
   - Redirect if not authenticated
   - Load user data
   - Display profile

2. **View Profile**
   - See overview in sidebar
   - Switch between tabs
   - View all information

3. **Edit Profile**
   - Update avatar URL
   - Edit personal info
   - See live preview
   - Validate fields

4. **Submit Changes**
   - Show loading state
   - Disable form
   - Display success
   - Auto-reload after 2s

5. **Handle Errors**
   - Show error card
   - Keep form data
   - Allow retry

---

## Customization Points

### Adding New Tabs
```tsx
<TabsTrigger value="newTab">New Tab</TabsTrigger>
<TabsContent value="newTab">
  {/* New content */}
</TabsContent>
```

### Adding Info Cards
```tsx
<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
  <Icon className="h-4 w-4 text-muted-foreground" />
  <div className="flex-1 space-y-0.5">
    <p className="text-xs font-medium text-muted-foreground">Label</p>
    <p className="text-sm font-medium">Value</p>
  </div>
</div>
```

### Extending Form
```tsx
<FormField
  control={form.control}
  name="newField"
  render={({ field }) => (
    <FormItem>
      <FormLabel>New Field</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Accessibility

### Keyboard Navigation
```
Tab: Move between fields
Shift+Tab: Move backwards
Enter: Submit form
Escape: Cancel (if implemented)
```

### Screen Readers
```
- Proper heading hierarchy
- Form labels associated
- Error messages announced
- Loading states announced
- Success messages announced
```

### Visual
```
- High contrast text
- Focus indicators
- Large touch targets (44px+)
- Clear error messages
```

---

## Performance

### Loading Strategy
```
1. Show loading spinner
2. Verify authentication
3. Load user data from context
4. Render profile
```

### Optimization
```
- Minimal JavaScript
- CSS Grid/Flexbox (no JS layout)
- Lazy load images
- Debounced validation
```

---

## Testing

### Manual Testing
```
1. View profile page
2. Check responsive layouts
3. Edit each field
4. Submit form
5. Test validation
6. Check error handling
7. Verify success flow
8. Test dark mode
9. Test GitHub user vs email user
```

### Responsive Testing
```
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px (Standard)
- Large: 1920px (HD)
```

---

## Common Issues & Solutions

### Avatar Not Loading
```
Issue: Invalid URL or CORS
Solution: Use GitHub/Gravatar URLs
Fallback: Gradient initials shown
```

### Form Not Submitting
```
Issue: Validation errors
Solution: Check error messages below fields
Verify: All required fields filled
```

### Layout Not Responsive
```
Issue: Browser cache
Solution: Hard refresh (Cmd+Shift+R)
Check: Browser dev tools responsive mode
```

---

## Future Enhancements

### Phase 1 (Settings Tab)
- [ ] Password change form
- [ ] Two-factor authentication
- [ ] Email preferences

### Phase 2 (Profile)
- [ ] File upload for avatar
- [ ] Crop avatar tool
- [ ] Multiple OAuth connections

### Phase 3 (Advanced)
- [ ] Activity log
- [ ] API keys management
- [ ] Account deletion

---

## Related Files

```
Components:
- app/profile/page.tsx
- components/profile/profile-form.tsx
- components/ui/tabs.tsx
- components/ui/avatar.tsx
- components/ui/card.tsx
- components/ui/form.tsx

Types:
- types/auth.ts

API:
- lib/api/auth.ts (updateProfile method)

Docs:
- docs/PROFILE_UI_DESIGN.md
- docs/PROFILE_DESIGN_IMPROVEMENTS.md
- docs/USER_PROFILE_FEATURE.md
```

---

## API Integration

### Update Profile Endpoint
```typescript
authService.updateProfile({
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
})

Returns: Updated User object
Throws: Error with message
```

### Authentication Check
```typescript
useAuth() hook provides:
- user: User object
- isLoading: boolean
- isAuthenticated: boolean
- signOut: function
```

---

## Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- CSS Grid
- Flexbox
- CSS Variables
- ES6+ JavaScript
- Modern CSS (gap, aspect-ratio)

---

## Summary

**The profile page is now:**
- ✅ Modern and professional
- ✅ Fully responsive
- ✅ Accessible
- ✅ Easy to extend
- ✅ Well-documented
- ✅ Type-safe
- ✅ Performance optimized

**Key improvements:**
- Two-column layout with sticky sidebar
- Tabbed navigation for organization
- Enhanced form with grid layout
- Professional visual design
- Better user experience
- Mobile-first responsive design
