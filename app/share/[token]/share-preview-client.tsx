'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookOpen, Type, Layers, Brain, Sparkles, Share2, Mic } from 'lucide-react'
import { toast } from 'sonner'

interface SharePreviewClientProps {
  token: string
  title: string
  content: string
  chunkCount: number
  wordCount: number
  previewChunks: string[]
  hiddenCount: number
  creatorName: string | null
  isLoggedIn: boolean
  userId: string | null
}

const FEATURES = [
  {
    icon: Brain,
    label: 'Progressive Encoding',
    desc: 'Words fade out chunk by chunk until recall is effortless',
  },
  {
    icon: Sparkles,
    label: 'AI Transcription',
    desc: 'Record audio and get a clean transcript in seconds',
  },
  {
    icon: Mic,
    label: 'Audio Playback',
    desc: 'Listen along as you memorize — great for speeches',
  },
  {
    icon: Type,
    label: 'First-Letter Recall',
    desc: 'Test yourself with just initials as your scaffold',
  },
  {
    icon: Share2,
    label: 'Share Any Set',
    desc: 'Send a link — anyone can import it in one tap',
  },
  {
    icon: Layers,
    label: 'Chunk by Chunk',
    desc: 'Break any text into manageable pieces automatically',
  },
] as const

export function SharePreviewClient({
  token,
  title,
  wordCount,
  chunkCount,
  previewChunks,
  hiddenCount,
  creatorName,
  isLoggedIn,
}: SharePreviewClientProps) {
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await fetch(`/api/share/${token}/import`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to import set')
        return
      }
      if (data.alreadyOwned) {
        toast.success('This is already in your library!')
      } else {
        toast.success('Set added to your library!')
      }
      window.location.href = `/memorization/${data.importedSetId}`
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b">
        <Image src="/verbatim-logo-icon.png" alt="Verbatim" width={28} height={28} style={{ width: 28, height: 28 }} />
        <span className="text-sm font-semibold">Verbatim</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10 gap-6 max-w-lg mx-auto w-full">
        {/* Creator attribution */}
        {creatorName && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{creatorName}</span> shared a memorization set with you
          </p>
        )}

        {/* Set card */}
        <div className="w-full rounded-2xl border bg-card p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Type className="size-3" />
                {wordCount} words
              </Badge>
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Layers className="size-3" />
                {chunkCount} {chunkCount === 1 ? 'chunk' : 'chunks'}
              </Badge>
            </div>
          </div>

          {/* Preview chunks */}
          <div className="flex flex-col gap-3">
            {previewChunks.map((chunk, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground/80">
                {chunk}
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="rounded-lg border border-dashed p-4 flex items-center justify-center gap-2 text-muted-foreground text-sm select-none">
                <BookOpen className="size-4 opacity-50" />
                <span className="blur-[3px] pointer-events-none">+ {hiddenCount} more {hiddenCount === 1 ? 'chunk' : 'chunks'} — import to read</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {isLoggedIn ? (
          <Button
            size="lg"
            className="w-full h-12 text-[15px] font-semibold"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />Adding to library…</>
            ) : (
              'Add to my library'
            )}
          </Button>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="text-center flex flex-col gap-1">
              <p className="text-sm font-semibold">Memorize this, word for word.</p>
              <p className="text-sm text-muted-foreground">Verbatim guides you through it chunk by chunk until it sticks.</p>
            </div>
            <Button size="lg" className="w-full h-12 text-[15px] font-semibold" asChild>
              <Link href={`/auth/signup?importShare=${token}`}>
                Create Account
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href={`/auth/login?importShare=${token}`} className="text-foreground font-medium hover:underline">
                Log in to import
              </Link>
            </p>
          </div>
        )}

        {/* Feature highlights — conversion section for non-logged-in visitors */}
        {!isLoggedIn && (
          <div className="w-full flex flex-col gap-5 pt-2 pb-4">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">What you get</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="rounded-xl border bg-card p-4 flex flex-col gap-2.5 hover:border-primary/30 hover:bg-card/80 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-semibold leading-snug">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" variant="outline" className="w-full h-11 text-[14px] font-semibold" asChild>
              <Link href={`/auth/signup?importShare=${token}`}>
                Start Memorizing
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
