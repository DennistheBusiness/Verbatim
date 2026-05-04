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

  await StatusBar.setOverlaysWebView({ overlay: false })
  await StatusBar.setStyle({ style: Style.Default })
  await StatusBar.setBackgroundColor({ color: '#ffffff' })
  await SplashScreen.hide()
  await Keyboard.setAccessoryBarVisible({ isVisible: false })

  // resize:'body' (capacitor.config.ts) shrinks window.innerHeight when the keyboard
  // opens, but gives the page zero scroll range because body height also shrinks.
  // Fix: pad the <html> element by the keyboard height so the page can scroll,
  // then scroll the focused input into view.
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.paddingBottom = `${info.keyboardHeight}px`
  })

  Keyboard.addListener('keyboardDidShow', () => {
    const el = document.activeElement as HTMLElement | null
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  })

  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.paddingBottom = ''
  })
}
