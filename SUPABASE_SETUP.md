# Supabase Migration Setup Guide

## ✅ Completed Steps

The foundation for Supabase integration has been set up:

1. ✅ Supabase dependencies installed (@supabase/supabase-js, @supabase/ssr, @supabase/auth-ui-react, @supabase/auth-ui-shared)
2. ✅ Supabase client configuration created (lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/types.ts)
3. ✅ Database schema SQL file created (supabase-schema.sql)
4. ✅ Authentication pages created (login, signup, callback)
5. ✅ Authentication middleware created (middleware.ts)
6. ✅ Supabase-enabled context provider created (lib/memorization-context-supabase.tsx)
7. ✅ Migration tool page created (app/migrate/page.tsx)

## 📋 Next Steps to Complete Migration

### Step 1: Create Supabase Project (10 minutes)

1. **Visit Supabase**: Go to [https://supabase.com](https://supabase.com)
2. **Sign up/Login**: Create account or sign in
3. **Create New Project**:
   - Click "New Project"
   - Name: `verbatim-dev` (or any name you prefer)
   - Database Password: Choose a strong password (save it somewhere safe)
   - Region: Select closest to you
   - Click "Create new project"
4. **Wait for provisioning**: Takes ~2 minutes

### Step 2: Configure Environment Variables (5 minutes)

1. **Get Supabase Credentials**:
   - In Supabase Dashboard, go to: **Settings → API**
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon/public** key (starts with `eyJhbGc...`)

2. **Create `.env.local` file** in project root:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Edit `.env.local`** with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### Step 3: Run Database Schema (5 minutes)

1. **Open Supabase SQL Editor**:
   - In Supabase Dashboard: **SQL Editor** (left sidebar)
   - Click "New query"

2. **Copy entire contents** of `supabase-schema.sql`

3. **Paste and run** in SQL Editor:
   - Click "Run" (or Cmd/Ctrl + Enter)
   - Should see "Success. No rows returned"

4. **Verify tables created**:
   - Go to **Table Editor** (left sidebar)
   - Should see: profiles, memorization_sets, chunks, tags, set_tags

### Step 4: Configure Google OAuth (Optional - 10 minutes)

**Skip this if you only want email/password auth**

1. **Google Cloud Console**:
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable "Google+ API"

2. **Create OAuth Credentials**:
   - Navigate to: **APIs & Services → Credentials**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Verbatim Dev"
   - Authorized redirect URIs:
     - Add: `http://localhost:3000/auth/callback`
     - Add: `https://your-project-id.supabase.co/auth/v1/callback`
   - Click "Create"
   - Copy **Client ID** and **Client Secret**

3. **Configure in Supabase**:
   - Supabase Dashboard: **Authentication → Providers**
   - Find "Google" and toggle it ON
   - Paste Client ID and Client Secret
   - Click "Save"

### Step 5: Switch to Supabase Context Provider (2 minutes)

**Replace the old localStorage context with the new Supabase one:**

1. **Backup current context** (already done - it's still there):
   ```bash
   # The old file is: lib/memorization-context.tsx
   # The new file is: lib/memorization-context-supabase.tsx
   ```

2. **Replace the context**:
   ```bash
   mv lib/memorization-context.tsx lib/memorization-context-localstorage.backup.tsx
   mv lib/memorization-context-supabase.tsx lib/memorization-context.tsx
   ```

   Or use this command to do both at once:
   ```bash
   cd lib && mv memorization-context.tsx memorization-context-localstorage.backup.tsx && mv memorization-context-supabase.tsx memorization-context.tsx && cd ..
   ```

### Step 6: Test the Application (15 minutes)

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test Authentication**:
   - Visit http://localhost:3000 (should redirect to login)
   - Click "Sign up" and create an account
   - Check your email for confirmation (if email confirmation is enabled)
   - Or click the email link in Supabase Dashboard → Authentication → Users
   - Login with your credentials
   - Should redirect to home page

3. **Test Google OAuth** (if configured):
   - Click "Continue with Google"
   - Sign in with Google account
   - Should redirect back to app

4. **Test Create Flow**:
   - Click "Create new set"
   - Fill in title, content, tags
   - Click "Create"
   - Should see success toast
   - Should navigate to memorization page

5. **Test Library View**:
   - Navigate back to home `/`
   - Should see your created set
   - Test search functionality
   - Test tag filtering

6. **Test Edit/Delete**:
   - Click on a set
   - Try editing content
   - Try deleting a set
   - Verify changes persist after page refresh

7. **Test Migration Tool** (if you have localStorage data):
   - Visit http://localhost:3000/migrate
   - Click "Check for Local Data"
   - If data found, click "Start Migration"
   - Verify all sets migrated successfully
   - Check that localStorage is cleared

8. **Test Multi-user Isolation**:
   - Open incognito window
   - Create second account
   - Verify you can't see first user's data
   - This tests Row Level Security (RLS)

### Step 7: Update Components for Better UX (Optional)

The context provider now returns `isLoading` and `error` states. You can use these in components:

**Example for app/page.tsx:**
```tsx
const { sets, isLoading, error } = useMemorization()

if (isLoading) {
  return <div>Loading your memorization sets...</div>
}

if (error) {
  return <div>Error: {error}</div>
}
```

All CRUD operations are now async, but the function signatures remain the same, so your existing components should work without changes. The context uses optimistic updates for better UX.

## 🔍 Troubleshooting

### Error: "Failed to load memorization sets"
- **Check**: Environment variables are set correctly
- **Check**: Database schema was run successfully
- **Fix**: Refresh page, check browser console for errors

### Error: "Not authenticated"
- **Check**: You're logged in (check dev tools → Application → Cookies for `sb-` cookies)
- **Fix**: Clear cookies, logout and login again

### Error: "Row Level Security policy violation"
- **Check**: Database schema includes RLS policies
- **Fix**: Re-run the SQL schema, particularly the RLS policy sections

### Google OAuth not working
- **Check**: Redirect URIs match exactly (including https vs http)
- **Check**: Google OAuth credentials are correctly pasted in Supabase
- **Fix**: Double-check credentials, try regenerating them

### Migration tool shows "Failed to migrate"
- **Check**: You're logged in
- **Check**: Browser console for specific errors
- **Fix**: Try migrating one set at a time manually if needed

## 📁 File Structure

```
Verbatim/
├── .env.local                          # YOUR SUPABASE CREDENTIALS (create this)
├── .env.local.example                  # Template for environment variables
├── supabase-schema.sql                 # Database schema (run in Supabase SQL Editor)
├── middleware.ts                       # Auth middleware (protects routes)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server Supabase client
│   │   └── types.ts                   # TypeScript types for database
│   ├── memorization-context.tsx       # REPLACE THIS with -supabase version
│   └── memorization-context-supabase.tsx  # New Supabase-enabled context
├── app/
│   ├── auth/
│   │   ├── login/page.tsx            # Login page
│   │   ├── signup/page.tsx           # Signup page
│   │   └── callback/route.ts         # OAuth callback handler
│   └── migrate/page.tsx              # Migration tool
```

## ✨ Benefits After Migration

- ✅ **Multi-device sync**: Access your data from any device
- ✅ **User accounts**: Secure authentication with email/password + OAuth
- ✅ **Data persistence**: Never lose your data (cloud backup)
- ✅ **Scalability**: Ready for thousands of users
- ✅ **Security**: Row Level Security ensures users only see their own data
- ✅ **Foundation for premium features**: Ready for AI image generation, premium tiers

## 🚀 After Local Testing Works

Once everything works on localhost:3000, you're ready to:
1. Deploy to production (Vercel or VPS)
2. Update Supabase redirect URLs for production domain
3. Update Google OAuth redirect URLs for production domain
4. Add SSL certificate (required for OAuth in production)

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → API/Auth logs
2. Check browser console for JavaScript errors
3. Check Network tab for failed requests
4. Verify RLS policies are active: Table Editor → Policies tab
