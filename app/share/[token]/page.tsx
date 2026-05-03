import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SharePreviewClient } from './share-preview-client'

interface PageProps {
  params: Promise<{ token: string }>
}

interface CreatorMeta {
  name: string | null
  groupName: string | null
}

let hasLoggedShareRpcHealth = false

async function logShareRpcHealthOnce() {
  if (hasLoggedShareRpcHealth || process.env.NODE_ENV !== 'development') return
  hasLoggedShareRpcHealth = true

  try {
    const supabase = await createClient()
    // Generated Supabase function types may lag local SQL migrations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('get_shared_creator_meta', {
      p_share_token: '__healthcheck__',
    })

    if (error?.code === 'PGRST202') {
      console.warn('[share] RPC missing: get_shared_creator_meta')
      return
    }

    console.log('[share] RPC is available: get_shared_creator_meta')
  } catch {
    console.warn('[share] RPC missing: get_shared_creator_meta')
  }
}

async function getSharedSet(token: string) {
  // Uses server client (anon/session) — works because of the public RLS policy
  // that allows SELECT on memorization_sets WHERE share_token IS NOT NULL.
  // Run supabase-migration-sharing-policy.sql to enable this.
  const supabase = await createClient()

  // share_token exists in DB, but generated TS types may lag behind local migrations.
  // Keep runtime query while avoiding compile-time key narrowing errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setsQuery: any = supabase
    .from('memorization_sets')
    .select('id, user_id, title, content, chunk_mode')

  const { data: set, error: setError } = await setsQuery
    .eq('share_token', token)
    .single()

  if (setError) {
    console.error('[share] set query error:', setError.code, setError.message)
    return null
  }
  if (!set) return null

  return set
}

async function getCreatorMeta(shareToken: string, userId: string): Promise<CreatorMeta> {
  try {
    // Uses a narrow SECURITY DEFINER RPC that only returns creator full_name
    // for a valid share token.
    const supabase = await createClient()
    // Generated Supabase function types may lag local SQL migrations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_shared_creator_meta', {
      p_share_token: shareToken,
    })

    if (error) {
      if (error.code === 'PGRST202') {
        console.warn('[share] creator RPC unavailable in schema cache; falling back to direct profile query')

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()

        if (!fallbackError) {
          return {
            name: fallbackData?.full_name?.trim() || null,
            groupName: null,
          }
        }

        console.error('[share] creator fallback profile query error:', fallbackError.code, fallbackError.message)
      } else {
        console.error('[share] creator RPC query error:', error.code, error.message)
      }

      return {
        name: null,
        groupName: null,
      }
    }

    const rpcRows = Array.isArray(data) ? data as Array<{ full_name?: string | null }> : []
    const fullName = rpcRows[0]?.full_name?.trim() || null

    return {
      name: fullName,
      groupName: null,
    }
  } catch (error) {
    console.error('[share] creator profile fetch exception:', error)
    return {
      name: null,
      groupName: null,
    }
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
  await logShareRpcHealthOnce()

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
  const creatorMeta = await getCreatorMeta(token, set.user_id)

  const wordCount = set.content.trim().split(/\s+/).filter((w: string) => w.length > 0).length
  const sharedContentChunk = set.content.trim()

  return (
    <SharePreviewClient
      token={token}
      title={set.title}
      content={set.content}
      chunkCount={1}
      wordCount={wordCount}
      previewChunks={[sharedContentChunk]}
      hiddenCount={0}
      creatorName={creatorMeta.name}
      groupName={creatorMeta.groupName}
      isLoggedIn={!!user}
      userId={user?.id ?? null}
    />
  )
}
