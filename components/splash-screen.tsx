"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2200 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 400)
    const completeTimer = setTimeout(() => onComplete(), duration)
    return () => { clearTimeout(fadeTimer); clearTimeout(completeTimer) }
  }, [duration, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(145deg, oklch(0.97 0.02 240) 0%, oklch(0.97 0.02 150) 100%)" }}
    >
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Full wordmark logo — fills most of the screen */}
        <Image
          src="/verbatim-logo.png"
          alt="Verbatim"
          width={600}
          height={600}
          priority
          className="drop-shadow-xl w-[80vw] max-w-[500px]"
          style={{ height: "auto" }}
        />
        <p className="text-xs text-muted-foreground/60 tracking-widest uppercase -mt-6">
          by Squared Thought
        </p>
      </div>
    </div>
  )
}
