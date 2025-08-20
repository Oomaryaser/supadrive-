import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from('collections').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { name, title, subtitle, banner_image_url, bottom_image_url, cta_label, cta_url } = body || {}
  const { data, error } = await supabase
    .from('collections')
    .insert({ name, title, subtitle, banner_image_url, bottom_image_url, cta_label, cta_url })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
