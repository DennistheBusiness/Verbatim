# Admin Panel Documentation

## Overview
The Verbatim admin panel provides tools for managing users and viewing system statistics. All admin actions are validated server-side — the UI never trusts client-side role claims.

---

## Setting Up Admin Access

### 1. Grant Admin Role

Run this SQL in your Supabase SQL Editor:

```sql
-- Find your user ID
SELECT id, email, user_role FROM profiles;

-- Grant admin role (replace with your email)
UPDATE profiles
SET user_role = 'admin'
WHERE email = 'your-email@example.com';
```

### 2. Access the Panel

1. Log out and log back in to refresh the session
2. Open the hamburger menu (☰) in the top right
3. A red **Admin Panel** link will appear
4. Click to access the dashboard

> Admin Panel link is only shown to users whose `profiles.user_role = 'admin'`. The middleware also enforces this server-side — visiting `/admin/*` without the role redirects to `/`.

---

## Admin Features

### Dashboard Statistics

The panel opens with four stat cards:
- **Total Users** — all registered profiles
- **Total Sets** — all memorization sets created
- **Active Users** — mirrors total users (activity tracking not yet implemented)
- **Delete Requests** — always 0 (delete-request workflow not yet built)

### Users Tab

#### View All Users
Lists every registered user with: email, full name, join date, current role.
Use the search bar to filter by email or name.

#### Change User Roles
Click the role badge on any user row to cycle through:
- **General** — standard user (default for new signups)
- **VIP** — premium/priority user
- **Admin** — full panel access

> You cannot change your own role from the UI. The API rejects self-role-change attempts.

#### View a User's Sets
Click **View Sets** on any user row to open a dialog showing:
- All of that user's memorization sets
- Title, content preview, chunk mode, creation date, tags
- Learning progress summary

This is the supported way to inspect a user's data for support/debugging purposes.

#### Delete a User
Click the trash icon next to any user to permanently:
1. Delete all their memorization sets (cascades chunks, tags via FK)
2. Delete their profile row
3. Delete their Supabase Auth account

> This action is irreversible. There is no soft-delete or recovery period.

---

## Technical Implementation

### `requireAdmin()` — Server-Side Auth Guard

All admin API routes call `requireAdmin()` before doing anything:

```typescript
// lib/admin-auth.ts
export async function requireAdmin(): Promise<{ adminId: string } | NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single()

  if (profile?.user_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { adminId: user.id }
}
```

Routes check `if (auth instanceof NextResponse) return auth` immediately after to short-circuit on failure.

### Service Role Client

After auth is verified, routes use `createServiceClient()` (service role) to bypass RLS and access any user's data:

```typescript
import { createServiceClient } from '@/lib/supabase/service'
// Used only in server-side API routes — never in client components
const service = createServiceClient()
```

The `SUPABASE_SERVICE_ROLE_KEY` is a server-only env var and never exposed to the browser.

### Middleware Protection

`middleware.ts` performs an independent admin check for all `/admin/*` paths — it queries `profiles.user_role` from the server before the page renders, so even direct URL access is blocked.

---

## API Endpoints

All routes require a valid session with `user_role = 'admin'`. Unauthenticated requests get 401; non-admin authenticated requests get 403.

### `GET /api/admin/users`
Returns all user profiles ordered by `created_at DESC`.

```json
[{ "id": "...", "email": "...", "full_name": "...", "user_role": "general", "created_at": "..." }]
```

### `PATCH /api/admin/users/[userId]`
Updates a user's role. Body: `{ "user_role": "admin" | "vip" | "general" }`. Validated with Zod.

### `DELETE /api/admin/users/[userId]`
Deletes user sets → profile → auth account in sequence.

### `GET /api/admin/users/[userId]/sets`
Returns all memorization sets for a specific user, including nested chunks and tags.

### `GET /api/admin/stats`
Returns `{ totalUsers, totalSets, activeUsers, pendingDeletes }`.

---

## Security Considerations

- **No client-side trust**: Role is always verified server-side via `requireAdmin()`
- **Service role stays server-only**: `createServiceClient()` is never called from client components or `lib/supabase/client.ts`
- **Input validated with Zod**: Role update endpoint validates the `user_role` value before the DB write
- **No impersonation**: The previous localStorage-based "Login As" feature was removed — it was a security risk that allowed the admin's session to be hijacked. Use **View Sets** instead

---

## Troubleshooting

### Can't See Admin Panel
1. Confirm `user_role = 'admin'` in Supabase for your profile row
2. Log out and back in (session needs refresh)
3. Check browser console for redirect or RLS errors

### Users Not Loading
1. Open Network tab — look for `/api/admin/users` request
2. Check the response status: 401 = not authenticated, 403 = not admin, 500 = DB error
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env vars

### View Sets Dialog Shows Empty
1. Check `/api/admin/users/[userId]/sets` response in Network tab
2. Confirm the target user has sets in the `memorization_sets` table
3. Verify service role key has access (check Supabase → Settings → API)

### Delete Fails
- If sets delete but auth user deletion logs an error, the profile and data are still gone — auth deletion failure is non-fatal and logged server-side only
