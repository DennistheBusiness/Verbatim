"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out slightly before completion for smooth transition
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, duration - 300)

    // Complete and unmount
    const completeTimer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, oklch(0.98 0.01 240) 0%, oklch(0.98 0.01 150) 100%)"
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="relative">
          <Image
            src="/verbatim-logo.png"
            alt="Verbatim"
            width={120}
            height={120}
            priority
            className="drop-shadow-lg"
          />
        </div>

        {/* App Name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight brand-gradient-text">
            Verbatim
          </h1>
          <p className="text-sm text-muted-foreground/80 tracking-wide">
            Train your memory for precision
          </p>
        </div>
      </div>
    </div>
  )
}
