import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { collection_id } = body || {}
  if (!collection_id) return NextResponse.json({ error: 'collection_id required' }, { status: 400 })
  const { data, error } = await supabase
    .rpc('create_share_for_collection', { p_collection_id: collection_id })
    .single<{ slug: string }>()
  if (error || !data?.slug) {
    return NextResponse.json({ error: error?.message || 'slug missing' }, { status: 500 })
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || ''
  const url = `${origin}/s/${data.slug}`
  return NextResponse.json({ slug: data.slug, url })
}
