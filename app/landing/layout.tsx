import type { Metadata } from "next"
import { Cormorant_Garamond } from "next/font/google"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  title: "Squared Thought — Train Your Mind to Perform",
  description:
    "A system for memorizing speeches, ceremonies, and ideas without relying on notes.",
  openGraph: {
    title: "Train Your Mind to Perform Under Pressure",
    description:
      "A system for memorizing speeches, ceremonies, and ideas without relying on notes.",
    images: [{ url: "/og-landing.png", width: 1200, height: 630 }],
    siteName: "Squared Thought",
  },
  twitter: {
    card: "summary_large_image",
    title: "Train Your Mind to Perform Under Pressure",
    description: "A system for memorizing speeches, ceremonies, and ideas without relying on notes.",
  },
  alternates: {
    canonical: "https://squaredthought.com",
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} bg-[#080808] text-[#f0ede6] min-h-screen overflow-x-hidden`}>
      {children}
    </div>
  )
}
