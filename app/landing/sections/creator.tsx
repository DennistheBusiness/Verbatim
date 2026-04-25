"use client"

import { AnimateIn } from "../components/animate-in"

export function CreatorSection() {
  return (
    <section className="bg-[#0d0d0d] px-6 py-24 md:py-32">
      <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-[#c9a447]/20 to-transparent mb-20" />

      <div className="mx-auto max-w-2xl text-center">
        <AnimateIn className="mb-8">
          <blockquote
            className="leading-relaxed text-[#f0ede6]/70"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
              fontWeight: 300,
              fontStyle: "italic",
            }}
          >
            "Built from real experience speaking under pressure — in lodge rooms, at podiums, and in moments where there&apos;s no safety net."
          </blockquote>
        </AnimateIn>

        <AnimateIn delay={0.15} className="mb-4">
          <p
            className="tracking-wide"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "1.8rem",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#c9a447",
            }}
          >
            Coral D. Fowler
          </p>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <p className="text-sm text-[#7a7570]">Founder, Squared Thought</p>
        </AnimateIn>
      </div>
    </section>
  )
}
