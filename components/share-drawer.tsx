'use client'

import { Check, Copy, LinkIcon, Mail, MessageSquare, Share2 } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface ShareDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  shareUrl: string | null
  shareCopied: boolean
  onCopy: () => void
  onRevoke: () => void
}

export function ShareDrawer({ open, onOpenChange, title, shareUrl, shareCopied, onCopy, onRevoke }: ShareDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92svh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="pb-2 pt-4 text-center">
            <DrawerTitle className="text-lg font-semibold">Share</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
            {shareUrl ? (
              <>
                {/* Set identity */}
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.22_240)]/15 to-[oklch(0.65_0.20_150)]/15 border border-primary/10">
                    <Share2 className="size-6 text-primary" />
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can preview and import this set
                  </p>
                </div>

                {/* Copy link — primary action */}
                <button
                  onClick={onCopy}
                  className="group relative flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/70 active:bg-muted"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border">
                    {shareCopied
                      ? <Check className="size-4 text-green-500" />
                      : <LinkIcon className="size-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{shareCopied ? 'Copied!' : 'Copy link'}</span>
                    <span className="truncate text-xs text-muted-foreground">{shareUrl}</span>
                  </div>
                  <Copy className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </button>

                {/* Share via */}
                <div className="flex flex-col gap-2">
                  <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Share via</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Native share — shown only when available */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button
                        onClick={() => {
                          navigator.share({
                            title: `Practice "${title}" with me`,
                            text: `I'm memorizing "${title}" on Verbatim — here's the link to practice it too:`,
                            url: shareUrl,
                          }).catch(() => {})
                        }}
                        className="col-span-2 flex items-center gap-3 rounded-2xl border bg-primary/5 px-4 py-3.5 text-left transition-colors hover:bg-primary/10 active:bg-primary/15"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Share2 className="size-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">Share…</span>
                          <span className="text-xs text-muted-foreground">Open share sheet</span>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const msg = `Hey! I'm memorizing "${title}" on Verbatim — here's the link to practice it too:\n${shareUrl}`
                        window.open(`sms:?body=${encodeURIComponent(msg)}`)
                      }}
                      className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/70 active:bg-muted"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                        <MessageSquare className="size-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Text</span>
                        <span className="text-xs text-muted-foreground">iMessage / SMS</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        const subject = `Practice "${title}" with me on Verbatim`
                        const body = `I'm memorizing "${title}" on Verbatim and thought you'd want to practice it too.\n\nClick here to import it:\n${shareUrl}`
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                      }}
                      className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/70 active:bg-muted"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                        <Mail className="size-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-xs text-muted-foreground">Send via mail app</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Stop sharing — low-emphasis */}
                <div className="flex justify-center pt-1">
                  <button
                    className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors py-1"
                    onClick={onRevoke}
                  >
                    Stop sharing this set
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40">
                  <Share2 className="size-6 text-muted-foreground animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">Generating share link…</p>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
