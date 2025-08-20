'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

type Item = { id: string, name: string, mimetype: string|null, size: number|null, path: string, publicUrl?: string }
type Share = { id: string, slug: string, title: string|null, subtitle: string|null, banner_image_url: string|null, cta_label: string|null, cta_url: string|null }

const BUCKET = 'drive'

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>()
  const supabase = useMemo(()=>createClient(), [])
  const [share, setShare] = useState<Share|null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: s } = await supabase.from('shares').select('*').eq('slug', slug).single()
      setShare(s as any)
      if (!s) { setLoading(false); return }
      const { data: its } = await supabase
        .from('collection_items')
        .select('id,name,mimetype,size,path,collections!inner(id,shares!inner(slug))')
        .eq('collections.shares.slug', slug)
      const items = (its||[]).map((r:any)=>({ id: r.id, name: r.name, mimetype: r.mimetype, size: r.size, path: r.path }))
      // public urls
      const withUrl = items.map((i:any)=> {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(i.path)
        return { ...i, publicUrl: data.publicUrl }
      })
      setItems(withUrl as any)
      setLoading(false)
    }
    load()
  }, [slug, supabase])

  if (loading) return <div className="container mx-auto p-6">...جاري التحميل</div>
  if (!share) return <div className="container mx-auto p-6">الرابط غير موجود أو انتهت صلاحيته.</div>

  return (
    <div>
      <section className="share-hero">
        <div className="container mx-auto p-6 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <div className="text-sm opacity-70">مشاركة</div>
            <h1 className="text-3xl md:text-4xl font-bold">{share.title || 'الملفات المشتركة'}</h1>
            {share.subtitle && <p className="opacity-80">{share.subtitle}</p>}
            {share.cta_label && share.cta_url && (
              <a href={share.cta_url} target="_blank" className="btn btn-primary inline-block">{share.cta_label}</a>
            )}
          </div>
          <div className="md:col-span-5">
            {share.banner_image_url ? (
              <img src={share.banner_image_url} alt="banner" className="rounded-xl w-full object-cover" />
            ) : (
              <div className="thumb rounded-xl">لا توجد صورة إعلانية</div>
            )}
          </div>
        </div>
      </section>

      <main className="container mx-auto p-6">
        <div className="grid-auto">
          {items.map(it => (
            <a key={it.id} href={it.publicUrl} target="_blank" className="p-2 rounded-lg hover:bg-gray-800/40 border border-transparent hover:border-gray-700">
              <div className="thumb">
                {it.mimetype?.startsWith('image/') ? (
                  <img src={it.publicUrl} alt={it.name} />
                ) : it.mimetype?.startsWith('video/') ? (
                  <video src={it.publicUrl} muted />
                ) : (
                  <div className="grid place-items-center">
                    <div className="text-5xl">📄</div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm truncate" title={it.name}>{it.name}</div>
              <div className="text-xs opacity-60">{it.size ? Math.round((it.size||0)/1024)+' KB' : ''}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
