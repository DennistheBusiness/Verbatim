"use client"

import { AnimateIn } from "../components/animate-in"
import { GoldButton } from "../components/gold-button"

const VERBATIM_URL = "https://verbatim.squaredthought.com/auth/signup"

const benefits = [
  "Free during beta no credit card",
  "Be part of the first cohort",
  "Help shape the product",
]

export function BetaPushSection() {
  return (
    <section className="relative overflow-hidden px-6 py-32 md:py-44">
      {/* Radial gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,164,71,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-xl text-center">
        {/* Label */}
        <AnimateIn className="mb-4">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b5520]">Early Access</p>
        </AnimateIn>

        {/* H2 */}
        <AnimateIn delay={0.1} className="mb-8">
          <h2
            className="leading-tight text-[#f0ede6]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 300,
            }}
          >
            Get Early Access
          </h2>
        </AnimateIn>

        {/* Benefits */}
        <AnimateIn delay={0.2} className="mb-10">
          <div className="flex flex-col gap-3">
            {benefits.map((b, i) => (
              <p key={i} className="flex items-center justify-center gap-3 text-[#7a7570]">
                <span className="text-[#c9a447]">✦</span>
                <span className="text-sm tracking-wide">{b}</span>
              </p>
            ))}
          </div>
        </AnimateIn>

        {/* CTA */}
        <AnimateIn delay={0.3} className="mb-5">
          <GoldButton href={VERBATIM_URL} size="lg">
            Start Using Verbatim Now
          </GoldButton>
        </AnimateIn>

        {/* Microcopy */}
        <AnimateIn delay={0.35}>
          <p className="text-xs tracking-widest uppercase text-[#6b5520]">
            No credit card &nbsp;·&nbsp; No commitment
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
