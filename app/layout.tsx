import type { Metadata, Viewport } from 'next'
import { Montserrat, Poppins, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { MemorizationProvider } from '@/lib/memorization-context'
import { PostHogProvider } from '@/components/posthog-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat"
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'Verbatim',
  description: 'Master any text through progressive memorization techniques',
  generator: 'Verbatim by Squared Thought',
  icons: {
    icon: [
      {
        url: '/verbatim-logo-icon.png',
        type: 'image/png',
      },
    ],
    apple: '/verbatim-logo-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${montserrat.variable} ${poppins.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <PostHogProvider>
          <MemorizationProvider>
            {children}
          </MemorizationProvider>
        </PostHogProvider>
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
