"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarClock, Sparkles } from "lucide-react"

const STORAGE_KEY = "verbatim_trial_disclaimer_seen"

export function TrialDisclaimerModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss() }}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden" showCloseButton={false}>
        {/* Header gradient */}
        <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary/10 to-background px-6 pt-8 pb-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15">
            <Sparkles className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold leading-tight">
            Welcome to Verbatim
          </DialogTitle>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 pb-6 pt-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 dark:bg-amber-900/20 dark:border-amber-800">
              <CalendarClock className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Limited time free trial</span> scheduled to end{" "}
                <span className="font-semibold">5/14/2026</span>.
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed px-1">
              Please be aware that membership plans may be introduced at that time. We&apos;ll give you plenty of notice before anything changes.
            </p>
          </div>

          <Button onClick={handleDismiss} className="w-full" size="lg">
            I Acknowledge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
