import { LandingNav } from "./components/nav"
import { HeroSection } from "./sections/hero"
import { ProblemSection } from "./sections/problem"
import { TheShiftSection } from "./sections/the-shift"
import { ProductIntroSection } from "./sections/product-intro"
import { ExperienceSection } from "./sections/experience"
import { BetaPushSection } from "./sections/beta-push"
import { CreatorSection } from "./sections/creator"
import { FinalCtaSection } from "./sections/final-cta"

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      <main>
        <HeroSection />
        <ProblemSection />
        <TheShiftSection />
        <ProductIntroSection />
        <ExperienceSection />
        <BetaPushSection />
        <CreatorSection />
        <FinalCtaSection />
      </main>

      <footer className="border-t border-[#c9a447]/10 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-[#7a7570]">
            © {new Date().getFullYear()} Squared Thought. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://verbatim.squaredthought.com/privacy"
              className="text-xs text-[#7a7570] transition-colors hover:text-[#c9a447]"
            >
              Privacy
            </a>
            <a
              href="https://verbatim.squaredthought.com"
              className="text-xs text-[#7a7570] transition-colors hover:text-[#c9a447]"
            >
              verbatim.squaredthought.com
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
