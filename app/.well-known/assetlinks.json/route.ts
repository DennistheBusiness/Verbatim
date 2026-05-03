// Served at /.well-known/assetlinks.json
// Required for Android App Links — allows magic link emails to open the native app
// Replace YOUR_KEYSTORE_SHA256 with the fingerprint from: keytool -list -v -keystore release-key.jks
export async function GET() {
  return new Response(
    JSON.stringify([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.squaredthought.verbatim',
          // SHA256 from: keytool -list -v -keystore release-key.jks -alias verbatim
          sha256_cert_fingerprints: ['YOUR_KEYSTORE_SHA256'],
        },
      },
    ]),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
