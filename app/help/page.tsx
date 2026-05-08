"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Help & FAQ" showBack />

      <main className="flex flex-1 flex-col gap-6 p-4 pb-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center pt-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Help & FAQ</h1>
            <p className="text-muted-foreground">Common questions and answers about Verbatim</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/onboarding">View Tour</Link>
              </Button>
              <Button asChild className="flex-1" variant="outline">
                <Link href="/about">About Verbatim</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Sections */}
        <div className="flex flex-col gap-6">
          {/* Getting Started */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create my first memorization set?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tap the "+" button on the library page. Give your set a title, then paste or type your content — or record it with your voice. Choose how you want it chunked (paragraph, sentence, line, or custom), then tap "Create Memorization Set."
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>What type of content works best?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Verbatim works great with speeches, scripts, poems, vows, presentations, religious texts, or any passage you need to know word-for-word. It's equally effective for short quotes and longer material — just use a chunking mode that matches the structure of your content.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How does chunking work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Chunking breaks your content into manageable pieces for practice. Choose from:
                    <br /><br />
                    <strong>Paragraph</strong> — splits on blank lines (best for prose)<br />
                    <strong>Sentence</strong> — splits on periods, exclamation points, and question marks<br />
                    <strong>Line</strong> — splits on every line break (best for poetry or scripts)<br />
                    <strong>Custom</strong> — you control the splits by placing "/" in your text
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* The 3-Step System */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">The 3-Step Learning System</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-4">
                  <AccordionTrigger>What is the Teach step?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Teach (Step 1) is about building familiarity before you start memorizing. There are three ways to do it:
                    <br /><br />
                    <strong>Read it yourself</strong> — scroll through your full text to absorb the content<br />
                    <strong>Flashcards</strong> — swipe through each chunk one at a time, bookmark sections you want to revisit<br />
                    <strong>AI Read it</strong> — listen to an AI-generated audio reading of your text
                    <br /><br />
                    The goal is to get comfortable with your material before moving to active training.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>What are the Train modes?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Train (Step 2) has three active methods to build memory:
                    <br /><br />
                    <strong>First Letter</strong> — the core encoding method. Work through 3 progressive levels: all first letters visible → reduced cues → complete recall. Select individual chunks or train all at once.<br /><br />
                    <strong>Finish That Phrase</strong> — each chunk is shown partially; you complete it from memory. Builds phrase-level recognition.<br /><br />
                    <strong>Sorting Game</strong> — your chunks are shuffled and you drag them back into the correct order. Great for locking in structure.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>What are the Test modes?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Test (Step 3) is where you prove your recall under pressure. Three modes:
                    <br /><br />
                    <strong>Full Recall</strong> — type the entire passage from memory, no cues<br />
                    <strong>First Letter Recall</strong> — only the first letter of each word is shown; you type the full text<br />
                    <strong>Audio Recall</strong> — record yourself speaking the text aloud; AI transcribes and grades your accuracy instantly
                    <br /><br />
                    Each mode gives you a score. Try all three to stress-test your memory from different angles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Do I have to follow the steps in order?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No — all 9 modes are accessible directly from the memorization detail page at any time. The app shows your progress per mode so you can see what you've completed and what's left. That said, Teach → Train → Test is the recommended sequence for the best results, especially for new material.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-8">
                  <AccordionTrigger>How do Flashcards work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    In the Teach step, tap "Flashcards" to enter swipe mode. Navigate with swipe gestures, arrow keys, or the on-screen buttons. Tap the bookmark icon to flag important chunks. Use the "Bookmarked" filter to review only your marked sections.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger>How does Audio Recall work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    In the Test step, tap "Audio Recall." Hit "Begin Recording," recite your text from memory, then tap "Stop." Verbatim uses AI transcription to compare your speech to the original and gives you an instant accuracy score.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger>What is AI Read it?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    AI Read it uses text-to-speech to read your content aloud for you. It's useful for auditory learners or for passively reviewing material while doing something else. Find it in the Teach section on the memorization detail page.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger>What is the Sorting Game?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Sorting Game shuffles your chunks into a random order. You drag and drop (or use up/down arrows on mobile) to rearrange them back into the correct sequence. When you submit, you get a score and see exactly which chunks were in the right position. It's especially effective for material with a specific structure or narrative order.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger>What is Finish That Phrase?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Finish That Phrase shows each chunk partially — the beginning is visible and you complete the rest from memory. It's a gentler form of active recall that sits between passive reading and full recall testing. Find it in the Train section.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-13">
                  <AccordionTrigger>How does progress tracking work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Each memorization set has an overall progress ring that combines your Teach, Train, and Test completion. The detail page also shows score charts for each test mode over time, so you can see improvement at a glance. Individual mode progress is shown as a percentage or checkmark on each icon.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-14">
                  <AccordionTrigger>What is Spaced Repetition?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Spaced Repetition schedules review sessions at increasing intervals — the more confident you are with a set, the less frequently you need to review it. Toggle it on from the memorization detail page. The app will surface sets that are due for review on your library home screen.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-15">
                  <AccordionTrigger>Can I share a memorization set?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. From the memorization detail page, tap the share icon to generate a shareable link. Anyone with the link can preview the set and, if they have an account, import it directly into their own library.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-16">
                  <AccordionTrigger>Can I edit my memorization sets?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. Tap the edit icon from the detail page or library card. You can update the title, content, tags, and chunking mode. Note: changing the content or chunking mode will reset encoding progress for affected chunks.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-17">
                  <AccordionTrigger>What are tags and how do I use them?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tags help you organize your sets. Add tags like "Speech," "Scripture," or "Work" when creating or editing a set. Filter your library by tag to quickly surface related content.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Account & Data */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account & Data</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-18">
                  <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. Your memorization sets are private to your account and stored securely. We use industry-standard security practices. See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for full details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-19">
                  <AccordionTrigger>Does Verbatim work offline?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    An internet connection is required to sync data and use features like AI transcription and TTS. Once loaded, you can view your content offline, and changes will sync when you reconnect.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-20">
                  <AccordionTrigger>Can I access my sets on multiple devices?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes — sign in with the same account on any device and all your sets and progress sync automatically.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-21">
                  <AccordionTrigger>How do I delete my account?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Account Settings from the menu and tap "Delete Account." This permanently deletes all your data and cannot be undone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-22">
                  <AccordionTrigger>Audio recording isn't working</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Make sure Verbatim has microphone permission in your browser or device settings. On iOS, check Settings → Safari → Microphone. Try refreshing the page after granting permission. Audio Recall works best in Chrome, Edge, or the Verbatim mobile app.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-23">
                  <AccordionTrigger>My progress isn't saving</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Progress saves automatically over a network connection. If syncing seems stuck, try refreshing the page. If the problem continues, sign out and back in.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-24">
                  <AccordionTrigger>The app is running slowly</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Try clearing your browser cache and refreshing. Very large sets (over 10,000 words) can impact performance — consider splitting them into smaller sets for a smoother experience.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-25">
                  <AccordionTrigger>I found a bug or have feedback</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We'd love to hear from you! Email us at <a href="mailto:CoralFowler@gmail.com" className="text-primary hover:underline">CoralFowler@gmail.com</a> with details about the issue or your suggestions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help.
            </p>
            <p className="text-sm">
              Email me at <a href="mailto:CoralFowler@gmail.com" className="text-primary hover:underline font-medium">CoralFowler@gmail.com</a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
