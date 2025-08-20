import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabaseServer'

// Example server endpoint to generate a longer-lived signed URL (requires auth)
export async function POST(req: NextRequest) {
  const supabase = createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const { path, expiresIn = 3600 } = body
  const { data, error } = await supabase.storage.from('drive').createSignedUrl(path, expiresIn)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ url: data.signedUrl })
}
