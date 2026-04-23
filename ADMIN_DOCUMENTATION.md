# Admin Panel Documentation

## Overview
The Verbatim admin panel provides comprehensive tools for managing users, handling delete requests, and viewing system statistics.

## Setting Up Admin Access

### 1. Make Yourself an Admin

Run this SQL in your Supabase SQL Editor to grant admin privileges:

```sql
-- First, find your user ID and email
SELECT id, email, user_role FROM profiles;

-- Then update your role (replace with your actual email)
UPDATE profiles 
SET user_role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 2. Verify Admin Access

Once you've set your user role to 'admin':
1. Log out and log back in
2. Click the hamburger menu (☰) in the top right
3. You should see a red "Admin Panel" menu item
4. Click it to access the admin dashboard

## Admin Features

### Dashboard Overview

The admin panel opens with key statistics:
- **Total Users**: Total number of registered users
- **Total Sets**: Total memorization sets created
- **Active Users**: Users with recent activity
- **Delete Requests**: Pending account deletion requests

### Users Management Tab

#### View All Users
- See a complete list of all registered users
- View email, name, join date, and current role
- Search users by email or name using the search bar

#### User Roles
Each user has one of three roles:
- **General**: Standard user (default)
- **VIP**: Premium user with potential extra features
- **Admin**: Full system access

#### Change User Roles
Click the role badge dropdown for any user to change their role between:
- General
- VIP  
- Admin

⚠️ **Note**: You cannot change your own role from the UI for security.

#### Impersonate Users
The "Login As" feature allows you to:
1. Click "Login As" next to any user
2. View the application from their perspective
3. See their memorization sets and progress
4. Test features as that user
5. Click "End Impersonation" to return to admin view

**Use Cases**:
- Debug user-reported issues
- Verify user-specific problems
- Test permission systems
- Provide customer support

⚠️ **Important**: Impersonation is logged. Use responsibly and only for support/debugging.

#### Delete Users
Click the trash icon (🗑️) next to any user to:
1. Delete all their memorization sets
2. Delete their profile
3. Remove their account data

⚠️ **Warning**: This action cannot be undone. User data is permanently deleted.

### Delete Requests Tab

**Status**: Currently implemented as a placeholder for future functionality.

#### Future Implementation
To enable delete request tracking:
1. Run the SQL migration: `supabase-delete-requests-table.sql`
2. Update the account page to create delete requests instead of immediate deletion
3. Admins can then review and approve/deny requests

#### Benefits
- Prevents accidental deletions
- Allows review before permanent data loss
- Provides audit trail
- Can implement "cooling off" periods

## Technical Implementation

### Admin Role Check
```typescript
// The system checks user role from the profiles table
const { data: profile } = await supabase
  .from('profiles')
  .select('user_role')
  .eq('id', user.id)
  .single()

const isAdmin = profile?.user_role === 'admin'
```

### Access Control
- The admin panel checks role on page load
- Redirects non-admin users to home page
- Navigation menu only shows "Admin Panel" for admin users
- Uses Row Level Security (RLS) for database-level protection

### User Impersonation
Current implementation:
- Stores impersonation state in localStorage
- Navigation-based (redirects to user's view)
- Can be extended to full session token switching

For production impersonation:
```typescript
// Enhanced implementation would use Supabase Admin API
// to generate auth tokens for the target user
const { data, error } = await supabaseAdmin.auth.admin
  .generateLink({
    type: 'magiclink',
    email: targetUser.email
  })
```

## Security Considerations

### Admin Actions Should Be:
1. **Logged**: Consider adding admin action logging
2. **Reversible**: Where possible, soft-delete instead of hard-delete
3. **Auditable**: Track who did what and when
4. **Restricted**: Only grant admin role to trusted users

### Recommended Enhancements:
- Add admin action logging table
- Implement soft deletes with recovery period
- Add email notifications for sensitive actions
- Require 2FA for admin accounts
- Add IP address logging for admin actions

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_role TEXT NOT NULL DEFAULT 'general' 
    CHECK (user_role IN ('admin', 'general', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Optional: Delete Requests Table
See `supabase-delete-requests-table.sql` for full schema.

## API Endpoints (Future)

For enhanced admin functionality, consider creating these API routes:

### `/api/admin/users`
- GET: List all users with pagination
- POST: Create user
- PUT: Update user role
- DELETE: Delete user

### `/api/admin/impersonate`
- POST: Generate impersonation token
- DELETE: End impersonation

### `/api/admin/delete-requests`
- GET: List pending requests
- PUT: Approve/deny request
- DELETE: Cancel request

### `/api/admin/stats`
- GET: System statistics
- Cached for performance

## Troubleshooting

### Can't See Admin Panel
1. Verify your user role is set to 'admin' in database
2. Log out and log back in to refresh session
3. Check browser console for errors
4. Verify RLS policies allow profile reading

### Impersonation Not Working
1. Check localStorage is enabled
2. Verify target user exists
3. Check for browser console errors
4. Ensure you're not trying to impersonate yourself

### Users Not Loading
1. Check Supabase RLS policies
2. Verify admin user has 'admin' role
3. Check network tab for API errors
4. Ensure profiles table is accessible

## Best Practices

### For Admins:
- Only impersonate users when absolutely necessary
- Document why you're accessing user accounts
- Inform users if you need to access their data for support
- Use test accounts for testing features

### For Developers:
- Always use RLS policies for data access
- Log admin actions for audit trails
- Implement role-based access control (RBAC)
- Test admin features with non-admin accounts
- Use environment variables for admin emails
- Implement rate limiting on admin endpoints

## Future Enhancements

### Planned Features:
1. **Activity Logs**: Track all admin actions
2. **User Analytics**: Detailed user behavior insights
3. **Bulk Operations**: Process multiple users at once
4. **Export Data**: Export user lists and statistics
5. **Email Management**: Send notifications to users
6. **Feature Flags**: Toggle features per user or globally
7. **A/B Testing**: Control experiment groups
8. **Support Tickets**: Integrated help desk

### Advanced Features:
- Real-time user session monitoring
- Automated abuse detection
- Content moderation tools
- Payment/subscription management
- Advanced search and filtering
- Custom reports and dashboards

## Support

For admin-related issues:
1. Check this documentation
2. Review Supabase logs
3. Check browser developer console
4. Contact development team

## Changelog

### v1.0.0 (Current)
- Initial admin panel implementation
- User management (list, role change, delete)
- Basic impersonation system
- System statistics dashboard
- Delete requests placeholder
- Role-based navigation menu access
