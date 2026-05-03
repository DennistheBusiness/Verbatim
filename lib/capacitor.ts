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

  // iOS keyboard scroll handling.
  // resize:'body' shrinks document.body.height to the visible area, leaving zero scroll
  // range on the window — window.scrollBy and scrollIntoView both no-op.
  // Fix: extend the <html> element's paddingBottom by the keyboard height so the document
  // becomes scrollable, then use scrollIntoView on the active element.
  // paddingBottom is removed on keyboardWillHide so layout snaps back instantly.
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.paddingBottom = `${info.keyboardHeight}px`
  })

  Keyboard.addListener('keyboardDidShow', () => {
    const el = document.activeElement as HTMLElement | null
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return
    // rAF ensures the paddingBottom layout pass has completed before we scroll
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  })

  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.paddingBottom = ''
  })
}
