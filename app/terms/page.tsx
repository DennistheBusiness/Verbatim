"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Terms of Service" showBack />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center pt-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 23, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Verbatim ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. This Service is operated by Squared Thought.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Description of Service</h2>
              <p className="text-muted-foreground">
                Verbatim is a memorization application that helps users memorize text content through a structured three-step system: Familiarize, Encode, and Test. The Service includes:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Text input and organization tools</li>
                <li>Progressive memory encoding with the first letter method</li>
                <li>Multiple testing modes (typing, first letter recall, audio recall)</li>
                <li>Progress tracking and analytics</li>
                <li>Cloud synchronization across devices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">User Accounts</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Creation</h3>
              <p className="text-muted-foreground">
                To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Account Security</h3>
              <p className="text-muted-foreground">
                You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Account Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to terminate or suspend your account at any time for any reason, including if you violate these Terms of Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">User Content</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Your Content</h3>
              <p className="text-muted-foreground">
                You retain all rights to the content you create and upload to Verbatim ("User Content"). By uploading User Content, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Content Responsibility</h3>
              <p className="text-muted-foreground">
                You are solely responsible for your User Content. You represent and warrant that:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>You own or have the necessary rights to the content you upload</li>
                <li>Your content does not violate any third-party rights</li>
                <li>Your content does not contain illegal, harmful, or offensive material</li>
                <li>Your content does not violate any applicable laws or regulations</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Prohibited Content</h3>
              <p className="text-muted-foreground">
                You may not upload content that:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Infringes on intellectual property rights</li>
                <li>Contains malware or harmful code</li>
                <li>Promotes illegal activities</li>
                <li>Contains hate speech, harassment, or discriminatory content</li>
                <li>Violates privacy rights of others</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Remove or modify any copyright or proprietary notices</li>
                <li>Resell or commercially exploit the Service without authorization</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
              <p className="text-muted-foreground">
                The Service and its original content (excluding User Content), features, and functionality are owned by Squared Thought and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground mt-3">
                Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground">
                The Service may use third-party services for functionality such as authentication, data storage, and audio transcription. Your use of these services is subject to their respective terms and conditions. We are not responsible for the practices or content of third-party services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Disclaimers</h2>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
              </p>
              <ul className="text-muted-foreground list-disc pl-6 space-y-1">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from using the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We are not responsible for the accuracy or effectiveness of the memorization content you create or the results you achieve using the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SQUARED THOUGHT, ITS AFFILIATES, OR THEIR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Squared Thought and its affiliates from any claims, damages, losses, liabilities, and expenses (including attorney's fees) arising out of your use of the Service, your User Content, or your violation of these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved in the appropriate courts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> legal@verbatim.app<br />
                <strong>Company:</strong> Squared Thought
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
