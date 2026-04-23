"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Privacy Policy" showBack />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center pt-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 23, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                Verbatim ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our memorization application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <p className="text-muted-foreground">
                When you create an account, we collect your email address and authentication credentials. This information is necessary to provide you with access to your personalized memorization sets and progress tracking.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Content You Create</h3>
              <p className="text-muted-foreground">
                We store the text content you input for memorization, along with associated metadata such as titles, tags, chunking preferences, and progress data. This content remains private to your account.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
              <p className="text-muted-foreground">
                We collect information about how you interact with the application, including:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Progress through memorization steps</li>
                <li>Test scores and completion rates</li>
                <li>Session timestamps and activity logs</li>
                <li>Device and browser information</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Audio Recordings</h3>
              <p className="text-muted-foreground">
                If you use the audio recall feature, temporary audio recordings are stored for transcription purposes. These recordings are associated with your account and can be deleted at any time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the collected information to:</p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Provide and maintain the Verbatim service</li>
                <li>Authenticate your account and manage user sessions</li>
                <li>Store and sync your memorization content across devices</li>
                <li>Track your progress and provide personalized recommendations</li>
                <li>Process audio transcriptions through secure third-party services</li>
                <li>Improve our application based on usage patterns</li>
                <li>Communicate important updates or changes to the service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using industry-standard encryption protocols. We use Supabase as our database and authentication provider, which implements enterprise-grade security measures including:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure password hashing</li>
                <li>Regular security audits</li>
                <li>Automated backups</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                While we implement robust security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to protecting your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground">
                We use the following third-party services:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>OpenAI Whisper API:</strong> Audio transcription (audio data is processed securely and not stored by OpenAI)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                These services have their own privacy policies governing the use of your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Export your memorization content</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, please contact us through your account settings or via email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Verbatim is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> privacy@verbatim.app<br />
                <strong>Company:</strong> Squared Thought
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
