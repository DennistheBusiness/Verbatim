'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type MigrationStatus = 'idle' | 'checking' | 'migrating' | 'success' | 'error' | 'no-data'

interface LocalSet {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  chunkMode: 'paragraph' | 'sentence'
  chunks: Array<{
    id: string
    orderIndex: number
    text: string
  }>
  progress: any
  sessionState: any
  recommendedStep: string
  tags: string[]
}

export default function MigratePage() {
  const [status, setStatus] = useState<MigrationStatus>('idle')
  const [localSets, setLocalSets] = useState<LocalSet[]>([])
  const [progress, setProgress] = useState(0)
  const [migratedCount, setMigratedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const checkLocalData = () => {
    setStatus('checking')
    try {
      const stored = localStorage.getItem('memorization-sets')
      if (!stored) {
        setStatus('no-data')
        return
      }

      const parsed = JSON.parse(stored) as LocalSet[]
      if (parsed.length === 0) {
        setStatus('no-data')
        return
      }

      setLocalSets(parsed)
      setStatus('idle')
      toast.success(`Found ${parsed.length} memorization set${parsed.length === 1 ? '' : 's'} to migrate`)
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to read localStorage data')
      toast.error('Failed to read local data')
    }
  }

  const startMigration = async () => {
    if (localSets.length === 0) return

    setStatus('migrating')
    setProgress(0)
    setMigratedCount(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      let completed = 0

      for (const set of localSets) {
        try {
          // Insert memorization set
          const { error: setError } = await supabase
            .from('memorization_sets')
            .insert({
              id: set.id,
              user_id: user.id,
              title: set.title,
              content: set.content,
              chunk_mode: set.chunkMode,
              progress: set.progress,
              session_state: set.sessionState,
              recommended_step: set.recommendedStep,
              created_at: set.createdAt,
              updated_at: set.updatedAt,
            })

          if (setError) {
            console.error(`Error migrating set ${set.title}:`, setError)
            continue
          }

          // Insert chunks
          if (set.chunks && set.chunks.length > 0) {
            const { error: chunksError } = await supabase
              .from('chunks')
              .insert(
                set.chunks.map(chunk => ({
                  id: chunk.id,
                  set_id: set.id,
                  order_index: chunk.orderIndex,
                  text: chunk.text,
                }))
              )

            if (chunksError) {
              console.error(`Error migrating chunks for ${set.title}:`, chunksError)
            }
          }

          // Insert tags
          if (set.tags && set.tags.length > 0) {
            for (const tagName of set.tags) {
              // Check if tag exists
              const { data: existingTag } = await supabase
                .from('tags')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', tagName)
                .single()

              let tagId: string

              if (existingTag) {
                tagId = existingTag.id
              } else {
                const { data: newTag, error: tagError } = await supabase
                  .from('tags')
                  .insert({ user_id: user.id, name: tagName })
                  .select('id')
                  .single()

                if (tagError) {
                  console.error(`Error creating tag ${tagName}:`, tagError)
                  continue
                }
                tagId = newTag.id
              }

              // Create set_tag relationship
              await supabase
                .from('set_tags')
                .insert({ set_id: set.id, tag_id: tagId })
            }
          }

          completed++
          setMigratedCount(completed)
          setProgress((completed / localSets.length) * 100)
        } catch (err) {
          console.error(`Error migrating set:`, err)
        }
      }

      setStatus('success')
      toast.success(`Successfully migrated ${completed} memorization set${completed === 1 ? '' : 's'}!`)

      // Clear localStorage after successful migration
      localStorage.removeItem('memorization-sets')
      localStorage.removeItem('hasSeenOnboarding')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Migration failed')
      toast.error('Migration failed')
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Migrate to Cloud Storage</h1>
          <p className="text-muted-foreground mt-2">
            Transfer your memorization sets from local storage to your cloud account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Migration Tool</CardTitle>
            <CardDescription>
              This tool will migrate all your locally stored memorization sets to your Supabase account.
              Your local data will be kept until migration completes successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'idle' && localSets.length === 0 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click the button below to check if you have any local data to migrate.
                  </AlertDescription>
                </Alert>
                <Button onClick={checkLocalData} size="lg" className="w-full">
                  Check for Local Data
                </Button>
              </div>
            )}

            {status === 'checking' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {status === 'no-data' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  No local data found. You&apos;re ready to start using cloud storage!
                </AlertDescription>
              </Alert>
            )}

            {status === 'idle' && localSets.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found <strong>{localSets.length}</strong> memorization set{localSets.length === 1 ? '' : 's'} ready to migrate.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="font-medium">Sets to migrate:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {localSets.slice(0, 5).map(set => (
                      <li key={set.id}>{set.title}</li>
                    ))}
                    {localSets.length > 5 && (
                      <li>... and {localSets.length - 5} more</li>
                    )}
                  </ul>
                </div>

                <Button onClick={startMigration} size="lg" className="w-full">
                  Start Migration
                </Button>
              </div>
            )}

            {status === 'migrating' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Migrating your data...</p>
                  <p className="text-sm text-muted-foreground">
                    {migratedCount} of {localSets.length} sets migrated
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
                <Alert>
                  <AlertDescription>
                    Please don&apos;t close this page until migration is complete.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <Alert className="border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Migration completed successfully! Migrated <strong>{migratedCount}</strong> memorization set{migratedCount === 1 ? '' : 's'}.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/')} size="lg" className="w-full">
                  Go to Library
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage || 'An error occurred during migration'}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button onClick={checkLocalData} variant="outline" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={() => router.push('/')} variant="secondary" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What happens during migration?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• All your memorization sets will be transferred to your cloud account</p>
            <p>• Your progress, session history, and tags will be preserved</p>
            <p>• Local data will be cleared only after successful migration</p>
            <p>• You&apos;ll be able to access your data from any device once migrated</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
