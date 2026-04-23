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
                    Click the "+" button on the library page or the "New Memorization" button. Enter a title, paste or type your content, choose how you want it chunked (paragraph, sentence, line, or custom), and click "Create Memorization Set."
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>What type of content works best?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Verbatim works best with structured content like speeches, scripts, poems, presentations, or any text you need to memorize word-for-word. The system is particularly effective for content between 100-5000 words.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How does the chunking work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Chunking breaks your content into manageable pieces. Choose "Paragraph" for natural text breaks, "Sentence" for shorter segments, "Line" for poetry or formatted text, or "Custom" to use "/" as a separator for your own boundaries.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* The 3-Step System */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">The 3-Step System</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-4">
                  <AccordionTrigger>What is the Familiarize step?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Step 1: Familiarize is about reading and understanding your content. You can read the full text or use Flashcard Mode to review chunk-by-chunk. Bookmark important chunks you want to revisit later. The goal is to become comfortable with the material before encoding.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>How does the first letter method work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The first letter method is the core of Step 2: Encode. It works in 3 progressive levels:
                    <br /><br />
                    <strong>Level 1:</strong> See the first letter of each word<br />
                    <strong>Level 2:</strong> See first letters with less visual help<br />
                    <strong>Level 3:</strong> Recall from memory alone
                    <br /><br />
                    This gradual reduction of cues trains your brain to build strong memory pathways. It's like training wheels that slowly come off as you gain confidence.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>What are the different test modes?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Step 3: Test offers three ways to prove your recall:
                    <br /><br />
                    <strong>First Letter Test:</strong> Type the full text with only first letters visible<br />
                    <strong>Full Recall Test:</strong> Type the entire text from memory<br />
                    <strong>Audio Recall:</strong> Record yourself speaking the text, get instant transcription and grading
                    <br /><br />
                    You only need to complete one test type to mark the step as complete, but trying all three can strengthen your mastery.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Do I have to complete all three steps in order?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    While we recommend following the order (Familiarize → Encode → Test) for best results, you can access any step at any time from the progress hub. The recommended path is shown with a highlighted border to guide you.
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
                  <AccordionTrigger>How do I use Flashcard Mode?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    In the Familiarize step, click "Start Flashcards" to enter swipe mode. Navigate with arrow keys, swipe gestures, or navigation buttons. Click the bookmark icon to mark important chunks. Use the "Marked X" button to filter and view only your bookmarked chunks.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger>What does the Audio Recall feature do?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Audio Recall lets you test your memory by speaking the text aloud. Click "Begin Recording," recite your memorized content, then click "Stop Recording." Verbatim uses AI transcription to compare your recording with the original text and provides instant feedback on accuracy.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger>How does progress tracking work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Progress is tracked across all three steps. Your overall completion percentage is shown in the progress hub. Each step contributes 33.33% to your total: Familiarize (complete when marked done), Encode (complete when all 3 levels finished), and Test (complete when ANY test is taken).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger>Can I edit my memorization sets?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! Click the "Edit" button in the memo detail view or from the library card. You can update the title, content, tags, and chunking method. Note that changing the chunking method or content will reset your encoding progress.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger>What are tags and how do I use them?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tags help you organize your memorization sets. Add tags like "Work," "School," or "Personal" when creating or editing a set. Filter your library by tags to quickly find related content.
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
                <AccordionItem value="item-13">
                  <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. Your memorization sets are private to your account and stored securely with encryption. We use industry-standard security practices. See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for full details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-14">
                  <AccordionTrigger>Does Verbatim work offline?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Verbatim requires an internet connection to sync your data and use features like audio transcription. However, once loaded, you can view your content offline. Changes will sync when you're back online.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-15">
                  <AccordionTrigger>Can I access my sets on multiple devices?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! Sign in with the same account on any device to access all your memorization sets and progress. Everything syncs automatically across devices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-16">
                  <AccordionTrigger>How do I delete my account?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Account Settings from the menu and look for the "Delete Account" option. This will permanently delete all your data. This action cannot be undone.
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
                <AccordionItem value="item-17">
                  <AccordionTrigger>Audio recording isn't working</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Make sure you've granted microphone permissions in your browser. Check your browser's site settings and ensure Verbatim has access to your microphone. Try refreshing the page if permissions were just granted.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-18">
                  <AccordionTrigger>My progress isn't saving</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ensure you have a stable internet connection. Progress saves automatically, but network issues can prevent syncing. Try refreshing the page. If the problem persists, sign out and sign back in.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-19">
                  <AccordionTrigger>The app is running slowly</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Try clearing your browser cache and refreshing the page. If you have very large memorization sets (over 10,000 words), performance may be impacted. Consider breaking them into smaller sets.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-20">
                  <AccordionTrigger>I found a bug or have feedback</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We'd love to hear from you! Contact us at support@verbatim.app with details about the issue or your suggestions for improvement.
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
              Email us at <a href="mailto:support@verbatim.app" className="text-primary hover:underline font-medium">support@verbatim.app</a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
