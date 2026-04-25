"use client"

import { motion } from "framer-motion"
import { AnimateIn } from "../components/animate-in"

const statements = [
  "You forget mid-sentence.",
  "You rely on notes you promised yourself you'd ditch.",
  "You lose the room.",
  "You spend hours preparing and still feel unprepared.",
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

export function ProblemSection() {
  return (
    <section className="relative px-6 py-28 md:py-36">
      {/* Subtle top line */}
      <div className="mx-auto mb-20 h-px max-w-xs bg-gradient-to-r from-transparent via-[#c9a447]/20 to-transparent" />

      <div className="mx-auto max-w-3xl">
        <AnimateIn className="mb-16 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b5520]">The problem</p>
        </AnimateIn>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col gap-8"
        >
          {statements.map((s, i) => (
            <motion.p
              key={i}
              variants={itemVariants}
              className="leading-tight text-[#f0ede6]/80"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)",
                fontWeight: 300,
                fontStyle: "italic",
              }}
            >
              "{s}"
            </motion.p>
          ))}
        </motion.div>

        {/* Closing line */}
        <AnimateIn delay={0.4} className="mt-16 text-center">
          <p
            className="tracking-wide"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              color: "#c9a447",
              fontStyle: "italic",
            }}
          >
            There&apos;s a better way.
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
