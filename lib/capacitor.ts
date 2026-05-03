'use client'

export async function initCapacitorPlugins() {
  if (typeof window === 'undefined') return
  const { Capacitor } = await import('@capacitor/core')
  if (!Capacitor.isNativePlatform()) return

  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/keyboard'),
  ])

  // Place WebView below the status bar rather than behind it.
  // This is more reliable than CSS env(safe-area-inset-top) which requires
  // viewport-fit=cover and can vary by iOS version.
  await StatusBar.setOverlaysWebView({ overlay: false })
  await StatusBar.setStyle({ style: Style.Default })
  await StatusBar.setBackgroundColor({ color: '#ffffff' })
  await SplashScreen.hide()
  await Keyboard.setAccessoryBarVisible({ isVisible: false })
}
