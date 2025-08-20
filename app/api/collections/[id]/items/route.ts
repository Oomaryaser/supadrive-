import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await req.json()
  const items = body?.items || []
  const payload = items.map((i:any)=>({ collection_id: params.id, ...i }))
  const { error } = await supabase.from('collection_items').insert(payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
