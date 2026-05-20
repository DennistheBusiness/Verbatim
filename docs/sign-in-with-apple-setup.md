# Sign in with Apple — Setup Guide

Stack: **Next.js (App Router) + Supabase + Capacitor (iOS)**

This guide covers the full native + web implementation used in Verbatim. Apple Sign-In uses a native `ASAuthorizationAppleIDProvider` dialog on iOS (no browser redirect needed) and falls back to Supabase OAuth on web.

---

## Prerequisites

- Apple Developer account with access to create App IDs and Service IDs
- Supabase project with Apple provider enabled
- Capacitor iOS project initialized (`cap add ios`)
- App deployed to a public HTTPS domain (required for Apple's OAuth callback and `apple-app-site-association`)

---

## 1. Apple Developer Console

### 1a. Register your App ID

1. Go to **Certificates, Identifiers & Profiles → Identifiers**
2. Create or select your App ID (e.g. `com.yourteam.yourapp`)
3. Enable **Sign in with Apple** capability
4. Note your **Team ID** (top-right of developer portal, e.g. `4HJGF8HQK2`)

### 1b. Create a Service ID (for web OAuth)

1. Create a new Identifier → **Services ID** (e.g. `com.yourteam.yourapp.web`)
2. Enable **Sign in with Apple**
3. Configure the Service ID:
   - **Primary App ID:** select the App ID from step 1a
   - **Domains:** your public domain (e.g. `yourdomain.com`)
   - **Return URLs:** your Supabase callback URL (from step 2 below)

### 1c. Create a Key

1. Create a new Key, enable **Sign in with Apple**
2. Associate it with your App ID
3. Download the `.p8` file — you'll need it for Supabase

---

## 2. Supabase Configuration

1. In your Supabase project → **Authentication → Providers → Apple**
2. Enable Apple provider
3. Fill in:
   - **Service ID:** the Services ID from step 1b (e.g. `com.yourteam.yourapp.web`)
   - **Authorized Client IDs:** your native App ID (e.g. `com.yourteam.yourapp`)
   - **Secret Key:** contents of the `.p8` file from step 1c
   - **Key ID:** ID of the key created in step 1c
   - **Team ID:** your Apple Team ID
4. Note your Supabase **Redirect URL** (shown in the provider settings) — add it to the Apple Service ID return URLs in step 1b

---

## 3. Install the Capacitor Plugin

```bash
pnpm add @capacitor-community/apple-sign-in
npx cap sync ios
```

---

## 4. iOS Native Configuration

### 4a. Register the Swift Package

In `ios/App/CapApp-SPM/Package.swift`, add to the `dependencies` array:

```swift
.package(
    name: "CapacitorCommunityAppleSignIn",
    path: "../../../node_modules/.pnpm/@capacitor-community+apple-sign-in@7.1.0_@capacitor+core@8.3.1/node_modules/@capacitor-community/apple-sign-in"
),
```

And add to your target's `dependencies`:

```swift
.target(
    name: "Plugin",
    dependencies: [
        // ... existing deps
        .product(name: "Plugin", package: "CapacitorCommunityAppleSignIn"),
    ]
)
```

> **Note:** The exact pnpm path segment (`@capacitor-community+apple-sign-in@7.1.0_@capacitor+core@8.3.1`) will vary by installed version. Check `node_modules/.pnpm/` if the path doesn't resolve.

### 4b. Add to Capacitor Plugin List

In `ios/App/App/capacitor.config.json`, add `"SignInWithApple"` to `packageClassList`:

```json
{
  "appId": "com.yourteam.yourapp",
  "plugins": {
    "SplashScreen": { ... }
  },
  "packageClassList": [
    "...existing plugins...",
    "SignInWithApple"
  ]
}
```

### 4c. Enable Capability in Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the App target → **Signing & Capabilities**
3. Click **+** and add **Sign In with Apple**
4. Also add **Associated Domains** if you want Universal Links (see section 6)

---

## 5. Code Implementation

### 5a. Shared SHA-256 Nonce Utility

Add this helper wherever your auth functions live:

```typescript
async function sha256hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### 5b. The handleAppleLogin Function

```typescript
import { Capacitor } from '@capacitor/core'

const handleAppleLogin = async () => {
  setIsAppleLoading(true)
  try {
    if (Capacitor.isNativePlatform()) {
      // --- Native iOS flow ---
      // 1. Generate nonce pair
      const rawNonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const hashedNonce = await sha256hex(rawNonce)

      // 2. Trigger native Apple Sign-In dialog
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
      const result = await SignInWithApple.authorize({
        clientId: 'com.yourteam.yourapp',   // must match your App ID
        redirectURI: 'https://yourdomain.com/auth/callback',
        scopes: 'email name',
        nonce: hashedNonce,                  // only the HASH goes to Apple
      })

      // 3. Exchange Apple identity token for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: result.response.identityToken,
        nonce: rawNonce,                     // raw nonce — Supabase verifies sha256(rawNonce) == hashedNonce
      })
      if (error) throw error

      // 4. Success — redirect
      window.location.href = '/'
    } else {
      // --- Web fallback (OAuth redirect) ---
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Error code 1001 = user tapped Cancel — silently ignore
    if (!msg.includes('1001')) {
      toast.error('Sign in with Apple failed. Please try again.')
    }
  } finally {
    setIsAppleLoading(false)
  }
}
```

### 5c. The Button

```tsx
<button
  onClick={handleAppleLogin}
  disabled={isAppleLoading}
  className="..."
>
  {isAppleLoading ? <Spinner /> : (
    <>
      <AppleIcon />
      Continue with Apple
    </>
  )}
</button>
```

### 5d. OAuth Callback Route

`app/auth/callback/route.ts` — handles the web OAuth flow redirect:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

> The native iOS flow **does not hit this callback route** — the session is established directly via `signInWithIdToken`. The callback is only used for web OAuth.

---

## 6. Universal Links (Optional but Recommended)

Universal Links let iOS open your app directly when the user taps a magic link or is redirected to `/auth/callback`.

### 6a. apple-app-site-association

Create `app/.well-known/apple-app-site-association/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    applinks: {
      details: [{
        appID: 'YOURTEAMID.com.yourteam.yourapp',   // TeamID.BundleID
        paths: ['/auth/callback*', '/auth/reset-password*'],
      }],
    },
  })
}
```

### 6b. Xcode Associated Domains

In Xcode → **Signing & Capabilities → Associated Domains**, add:

```
applinks:yourdomain.com
```

Verify the file is accessible at:
`https://yourdomain.com/.well-known/apple-app-site-association`

---

## 7. How the Native Flow Works (Summary)

```
User taps "Continue with Apple"
  │
  ├─ [Native] Generate rawNonce (32 random bytes)
  │           Compute hashedNonce = sha256(rawNonce)
  │           Call SignInWithApple.authorize({ nonce: hashedNonce })
  │           ↓
  │           iOS shows native Apple Sign-In dialog
  │           Apple returns identityToken (JWT containing hashedNonce)
  │           ↓
  │           supabase.auth.signInWithIdToken({
  │             provider: 'apple',
  │             token: identityToken,
  │             nonce: rawNonce       ← Supabase verifies sha256(rawNonce) matches JWT
  │           })
  │           ↓ Session created immediately
  │           Redirect to home
  │
  └─ [Web]   supabase.auth.signInWithOAuth({ provider: 'apple' })
             ↓ Browser → Apple OAuth → /auth/callback?code=...
             exchangeCodeForSession(code)
             ↓ Redirect to home
```

**Why two different flows?**
- Native iOS: `ASAuthorizationAppleIDProvider` returns a JWT directly — no browser or redirect needed. This is the preferred UX.
- Web: Standard OAuth code flow via browser redirect.

**Why a nonce?**
The nonce prevents replay attacks. Only the SHA-256 hash leaves the app; the raw nonce is kept locally. Supabase verifies `sha256(rawNonce) === nonce_in_jwt` before creating a session.

---

## 8. Testing Checklist

- [ ] Native Apple Sign-In dialog appears on iOS device/simulator
- [ ] First sign-in creates a new user in Supabase Auth dashboard
- [ ] Repeat sign-in (same Apple ID) restores the existing session, not a duplicate user
- [ ] User cancelling the dialog (error 1001) shows no error toast
- [ ] Web fallback works in desktop browser
- [ ] `/auth/callback` correctly redirects to home after web OAuth
- [ ] User's email is captured (Note: Apple only provides email on *first* sign-in per app)

---

## 9. Common Issues

| Issue | Fix |
|---|---|
| `Package.swift` path doesn't resolve | Check exact pnpm path in `node_modules/.pnpm/` — version suffix changes on upgrade |
| `SignInWithApple` not found in iOS build | Ensure `cap sync ios` ran after install and the plugin is in `packageClassList` |
| Supabase returns "invalid nonce" | Confirm you pass `rawNonce` (not `hashedNonce`) to `signInWithIdToken` |
| Apple only sends email once | Email is only provided on the *first* authorization; store it on first sign-in |
| Web OAuth redirect fails | Verify the callback URL in Apple Service ID matches your Supabase redirect URL exactly |
| Error 1001 in native flow | User tapped Cancel — expected, not a bug; suppress the error toast for this code |
