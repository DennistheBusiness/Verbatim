import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SharePreviewClient } from './share-preview-client'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getSharedSet(token: string) {
  // Uses server client (anon/session) — works because of the public RLS policy
  // that allows SELECT on memorization_sets WHERE share_token IS NOT NULL.
  // Run supabase-migration-sharing-policy.sql to enable this.
  const supabase = await createClient()

  const { data: set, error: setError } = await supabase
    .from('memorization_sets')
    .select('id, user_id, title, content, chunk_mode')
    .eq('share_token', token)
    .single()

  if (setError) {
    console.error('[share] set query error:', setError.code, setError.message)
    return null
  }
  if (!set) return null

  const { data: chunks, error: chunksError } = await supabase
    .from('chunks')
    .select('id, order_index, text')
    .eq('set_id', set.id)
    .order('order_index', { ascending: true })

  if (chunksError) console.error('[share] chunks query error:', chunksError.message)

  return { ...set, chunks: chunks ?? [] }
}

async function getCreatorName(userId: string): Promise<string | null> {
  try {
    // Service client needed here since profiles RLS restricts cross-user reads.
    // Fails gracefully — creator name is optional UI.
    const { createServiceClient } = await import('@/lib/supabase/service')
    const serviceClient = createServiceClient()
    const { data } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()
    return data?.full_name?.split(' ')[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const set = await getSharedSet(token)
  if (!set) return { title: 'Shared Set — Verbatim' }
  return {
    title: `${set.title} — Verbatim`,
    description: set.content.slice(0, 160),
    openGraph: {
      title: set.title,
      description: `${set.content.slice(0, 120)}…`,
      siteName: 'Verbatim',
    },
  }
}

export default async function SharePreviewPage({ params }: PageProps) {
  const { token } = await params
  const set = await getSharedSet(token)

  if (!set) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-3xl">🔗</div>
          <h1 className="text-xl font-semibold">Link no longer active</h1>
          <p className="text-muted-foreground text-sm">This share link has been revoked or never existed.</p>
          <Link href="/" className="text-primary text-sm hover:underline">Go to Verbatim</Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const creatorName = await getCreatorName(set.user_id)

  const sortedChunks = [...set.chunks].sort((a: any, b: any) => a.order_index - b.order_index)
  const wordCount = set.content.trim().split(/\s+/).filter((w: string) => w.length > 0).length

  return (
    <SharePreviewClient
      token={token}
      title={set.title}
      content={set.content}
      chunkCount={sortedChunks.length}
      wordCount={wordCount}
      previewChunks={sortedChunks.slice(0, 2).map((c: any) => c.text)}
      hiddenCount={Math.max(0, sortedChunks.length - 2)}
      creatorName={creatorName}
      isLoggedIn={!!user}
      userId={user?.id ?? null}
    />
  )
}
