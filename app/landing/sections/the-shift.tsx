"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { AnimateIn } from "../components/animate-in"

const steps = [
  { num: "01", label: "Input",  desc: "Load your text, speech, or ceremony" },
  { num: "02", label: "Encode", desc: "Compress it into first-letter anchors" },
  { num: "03", label: "Anchor", desc: "Repeat until the pattern holds" },
  { num: "04", label: "Recall", desc: "Perform from memory, not from notes" },
]

export function TheShiftSection() {
  const lineRef = useRef<SVGLineElement>(null)
  const inView = useInView(lineRef, { once: true, amount: 0.5 })

  return (
    <section className="relative bg-[#0d0d0d] px-6 py-28 md:py-36">
      {/* Divider */}
      <div className="mx-auto mb-20 h-px max-w-xs bg-gradient-to-r from-transparent via-[#c9a447]/20 to-transparent" />

      <div className="mx-auto max-w-4xl">
        {/* Label */}
        <AnimateIn className="mb-4 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b5520]">The System</p>
        </AnimateIn>

        {/* H2 */}
        <AnimateIn delay={0.1} className="mb-16 text-center">
          <h2
            className="leading-tight text-[#f0ede6]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
            }}
          >
            This is a system. Not a trick.
          </h2>
        </AnimateIn>

        {/* Flow diagram */}
        <div className="relative">
          {/* Desktop: horizontal */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-0">
            {steps.map((step, i) => (
              <AnimateIn key={step.num} delay={0.15 * i} className="relative flex flex-col items-center text-center px-4">
                {/* Connecting line (between nodes) */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 + 0.15 * i, ease: "easeOut" }}
                    className="absolute top-[22px] left-[calc(50%+28px)] right-[-calc(50%-28px)] h-px origin-left bg-gradient-to-r from-[#c9a447]/40 to-[#c9a447]/20"
                    style={{ width: "calc(100% - 56px)" }}
                  />
                )}
                {/* Circle */}
                <div
                  className="relative z-10 mb-4 flex size-11 items-center justify-center rounded-full border border-[#c9a447]/40 bg-[#111111] text-sm font-light text-[#c9a447]"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {step.num}
                </div>
                <p className="mb-2 text-base font-medium tracking-wide text-[#f0ede6]"
                   style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem" }}>
                  {step.label}
                </p>
                <p className="text-xs leading-relaxed text-[#7a7570]">{step.desc}</p>
              </AnimateIn>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex flex-col gap-0 md:hidden">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-start gap-5">
                <div className="flex flex-col items-center">
                  <AnimateIn delay={0.12 * i}>
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#c9a447]/40 bg-[#111111] text-sm text-[#c9a447]"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {step.num}
                    </div>
                  </AnimateIn>
                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 + 0.12 * i }}
                      className="mt-1 h-10 w-px origin-top bg-[#c9a447]/20"
                    />
                  )}
                </div>
                <AnimateIn delay={0.12 * i + 0.05} className="pb-6">
                  <p className="mb-1 text-base text-[#f0ede6]"
                     style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem" }}>
                    {step.label}
                  </p>
                  <p className="text-sm text-[#7a7570]">{step.desc}</p>
                </AnimateIn>
              </div>
            ))}
          </div>
        </div>

        {/* Body copy */}
        <AnimateIn delay={0.2} className="mt-16 text-center">
          <p
            className="mx-auto max-w-lg text-[#7a7570]"
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", fontStyle: "italic" }}
          >
            We don&apos;t teach you to memorize. We train you to perform.
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
