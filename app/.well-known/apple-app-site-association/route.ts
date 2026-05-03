// Served at /.well-known/apple-app-site-association (no .json extension — Apple requires this exact path)
// Required for iOS Universal Links — allows magic link emails to open the native app instead of Safari
// Replace TEAMID with your Apple Team ID from https://developer.apple.com → Membership (format: ABC123DEF4)
export async function GET() {
  return new Response(
    JSON.stringify({
      applinks: {
        details: [
          {
            appID: 'TEAMID.com.squaredthought.verbatim',
            paths: ['/auth/callback*', '/auth/reset-password*'],
          },
        ],
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
