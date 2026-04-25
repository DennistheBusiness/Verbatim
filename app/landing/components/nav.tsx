"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GoldButton } from "./gold-button"

const VERBATIM_URL = "https://verbatim.squaredthought.com/auth/signup"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-black/70 border-b border-[#c9a447]/10"
          : "bg-transparent"
      }`}
    >
      {/* Wordmark */}
      <span
        className="text-lg tracking-[0.2em] uppercase font-light"
        style={{ fontFamily: "var(--font-cormorant), serif", color: "#c9a447" }}
      >
        Squared Thought
      </span>

      {/* CTA */}
      <GoldButton href={VERBATIM_URL} size="sm">
        Try Verbatim Free →
      </GoldButton>
    </motion.nav>
  )
}
