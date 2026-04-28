"use client"

import { motion } from "framer-motion"
import { AnimateIn } from "../components/animate-in"

export function ExperienceSection() {
  return (
    <section className="relative bg-[#0d0d0d] px-6 py-28 md:py-36 overflow-hidden">
      <div className="mx-auto mb-20 h-px max-w-xs bg-gradient-to-r from-transparent via-[#c9a447]/20 to-transparent" />

      <div className="mx-auto max-w-4xl">
        {/* Label */}
        <AnimateIn className="mb-4 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b5520]">The Difference</p>
        </AnimateIn>

        <AnimateIn delay={0.1} className="mb-16 text-center">
          <h2
            className="leading-tight text-[#f0ede6]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              fontStyle: "italic",
            }}
          >
            What changes.
          </h2>
        </AnimateIn>

        {/* Before / After split */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#111111] p-8"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-white/20">Before</p>
            <div className="flex flex-col gap-3">
              {[
                "Reading from your phone mid-performance.",
                "Pausing to find your place.",
                "Losing the room to your own hesitation.",
                "Hours of prep that still leave you anxious.",
              ].map((line, i) => (
                <p
                  key={i}
                  className="leading-snug text-white/30"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
            className="flex flex-col gap-4 rounded-2xl border border-[#c9a447]/15 bg-[#111111] p-8"
            style={{
              boxShadow: "0 0 40px rgba(201,164,71,0.06) inset",
            }}
          >
            <p
              className="text-xs tracking-[0.25em] uppercase"
              style={{ color: "#c9a447" }}
            >
              After
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Words arriving without thinking.",
                "Presence not performance anxiety.",
                "The room is yours.",
                "You practiced the right way.",
              ].map((line, i) => (
                <p
                  key={i}
                  className="leading-snug"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    color: "rgba(240,237,230,0.85)",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
