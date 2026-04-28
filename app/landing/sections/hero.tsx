"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GoldButton } from "../components/gold-button"

const VERBATIM_URL = "https://verbatim.squaredthought.com/auth/signup"

const headline = "Train Your Mind to Perform Under Pressure"
const words = headline.split(" ")

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
}
const wordVariants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
}

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 pt-24">
      {/* Geometric mesh background */}
      <GeometricBg />

      {/* Radial dark overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #080808 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8 text-center">
        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-2 rounded-full border border-[#c9a447]/20 px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9a447]" />
          <span className="text-xs tracking-[0.25em] uppercase text-[#c9a447]/80">
            Squared Thought · Beta
          </span>
        </motion.div>

        {/* Headline with word-by-word reveal */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="leading-[1.1] tracking-tight text-[#f0ede6]"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
            fontWeight: 300,
          }}
        >
          {words.map((word, i) => (
            <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.25em]">
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="max-w-xl text-lg leading-relaxed text-[#7a7570]"
        >
          A system for memorizing speeches, ceremonies, and ideas without relying on notes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <GoldButton href={VERBATIM_URL} size="lg">
            Try Verbatim Free
          </GoldButton>
          <GoldButton href={VERBATIM_URL} variant="outline" size="lg">
            Join the Beta
          </GoldButton>
        </motion.div>

        {/* Microcopy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="text-xs tracking-widest uppercase text-[#6b5520]"
        >
          Early access · Free during beta
        </motion.p>

        {/* Scroll chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollY < 80 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M1 1L10 10L19 1" stroke="#c9a447" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function GeometricBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.06 }}
    >
      <defs>
        <pattern id="mesh" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="1.2" fill="#c9a447" />
          <line x1="40" y1="40" x2="80" y2="0" stroke="#c9a447" strokeWidth="0.4" />
          <line x1="40" y1="40" x2="80" y2="80" stroke="#c9a447" strokeWidth="0.4" />
          <line x1="40" y1="40" x2="0" y2="80" stroke="#c9a447" strokeWidth="0.4" />
          <line x1="40" y1="40" x2="0" y2="0" stroke="#c9a447" strokeWidth="0.4" />
          <line x1="40" y1="40" x2="80" y2="40" stroke="#c9a447" strokeWidth="0.3" />
          <line x1="40" y1="40" x2="40" y2="0" stroke="#c9a447" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh)" />
    </svg>
  )
}
