"use client"

import { Layers, Type, BookOpen, Target } from "lucide-react"
import { AnimateIn } from "../components/animate-in"
import { GoldButton } from "../components/gold-button"

const VERBATIM_URL = "https://verbatim.squaredthought.com/auth/signup"

const features = [
  {
    icon: Layers,
    name: "Chunking",
    desc: "Break any text into pieces your brain can hold paragraphs, sentences, or lines.",
  },
  {
    icon: Type,
    name: "First-Letter Recall",
    desc: "Build the neural pathway before the full test. Start with anchors, graduate to memory.",
  },
  {
    icon: BookOpen,
    name: "Guided Flow",
    desc: "Read → Train → Test. The sequence is the system. Follow it and the words come.",
  },
  {
    icon: Target,
    name: "Progress Tracking",
    desc: "Watch your retention climb over time. Every session moves the needle.",
  },
]

export function ProductIntroSection() {
  return (
    <section className="px-6 py-28 md:py-36">
      <div className="mx-auto max-w-4xl">
        {/* Label */}
        <AnimateIn className="mb-4 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b5520]">The Tool</p>
        </AnimateIn>

        {/* H2 */}
        <AnimateIn delay={0.1} className="mb-4 text-center">
          <h2
            className="leading-tight text-[#f0ede6]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 300,
            }}
          >
            Meet Verbatim.
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.15} className="mb-16 text-center">
          <p
            className="text-[#7a7570]"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "1.2rem",
              fontStyle: "italic",
            }}
          >
            Built to run this system.
          </p>
        </AnimateIn>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <AnimateIn key={f.name} delay={0.1 * i}>
              <div className="flex flex-col gap-3 rounded-2xl border border-[#c9a447]/10 bg-[#111111] p-6 transition-colors hover:border-[#c9a447]/25">
                <div className="flex size-10 items-center justify-center rounded-xl border border-[#c9a447]/20 bg-[#1a1a1a]">
                  <f.icon className="size-4.5" style={{ color: "#c9a447" }} />
                </div>
                <div>
                  <h3
                    className="mb-1 text-[#f0ede6]"
                    style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", fontWeight: 500 }}
                  >
                    {f.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#7a7570]">{f.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* CTA */}
        <AnimateIn delay={0.3} className="mt-12 flex justify-center">
          <GoldButton href={VERBATIM_URL} size="md">
            Start Using Verbatim →
          </GoldButton>
        </AnimateIn>
      </div>
    </section>
  )
}
