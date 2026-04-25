"use client"

import { AnimateIn } from "../components/animate-in"
import { GoldButton } from "../components/gold-button"

const VERBATIM_URL = "https://verbatim.squaredthought.com/auth/signup"

export function FinalCtaSection() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24">
      {/* Deep gold radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(201,164,71,0.09) 0%, transparent 65%)",
        }}
      />

      {/* Geometric mesh — very subtle */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.03 }}
      >
        <defs>
          <pattern id="final-mesh" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.8" fill="#c9a447" />
            <line x1="30" y1="30" x2="60" y2="0" stroke="#c9a447" strokeWidth="0.3" />
            <line x1="30" y1="30" x2="60" y2="60" stroke="#c9a447" strokeWidth="0.3" />
            <line x1="30" y1="30" x2="0" y2="60" stroke="#c9a447" strokeWidth="0.3" />
            <line x1="30" y1="30" x2="0" y2="0" stroke="#c9a447" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#final-mesh)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <AnimateIn>
          <h2
            className="leading-tight text-[#f0ede6]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(3rem, 8vw, 6.5rem)",
              fontWeight: 300,
            }}
          >
            Train Your Mind Differently.
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <GoldButton href={VERBATIM_URL} size="lg">
            Try Verbatim Free →
          </GoldButton>
        </AnimateIn>

        <AnimateIn delay={0.35}>
          <p className="text-xs tracking-widest uppercase text-[#6b5520]">
            Early access · Free during beta
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
