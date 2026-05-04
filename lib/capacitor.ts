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

  // When the keyboard opens, scroll the focused input into view.
  // resize:'body' (capacitor.config.ts) shrinks window.innerHeight to the visible area,
  // but WKWebView doesn't auto-scroll — we do it manually with the minimum offset needed.
  Keyboard.addListener('keyboardDidShow', () => {
    const el = document.activeElement as HTMLElement | null
    const isInput = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true')
    const fallbackTarget = document.querySelector('[data-keyboard-anchor="true"]') as HTMLElement | null
    const targetEl = (isInput ? el : null) ?? fallbackTarget
    if (!targetEl) return

    setTimeout(() => {
      const rect = targetEl.getBoundingClientRect()
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      const visibleBottom = Math.min(window.innerHeight, viewportHeight) - 24 // 24px breathing room above keyboard
      if (rect.bottom > visibleBottom) {
        window.scrollBy({ top: rect.bottom - visibleBottom, behavior: 'smooth' })
      }
    }, 100)
  })
}
