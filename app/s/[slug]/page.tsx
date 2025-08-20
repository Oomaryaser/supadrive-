'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Download, Trash2, Upload } from 'lucide-react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

type Item = { id: string, name: string, mimetype: string | null, size: number | null, path: string, publicUrl?: string }
type Share = {
  id: string,
  slug: string,
  collection_id: string,
  title: string | null,
  subtitle: string | null,
  banner_image_url: string | null,
  bottom_image_url: string | null,
  cta_label: string | null,
  cta_url: string | null
}
type DisplayItem = { id: string, name: string, type: 'folder' } | (Item & { type: 'file' })

const BUCKET = 'drive'

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>()
  const search = useSearchParams()
  const canEdit = search.get('mode') === 'edit'
  const supabase = useMemo(()=>createClient(), [])
  const [share, setShare] = useState<Share|null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [segments, setSegments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: s } = await supabase.from('shares').select('*').eq('slug', slug).single()
      setShare(s as any)
      if (!s) { setLoading(false); return }
      const { data: its } = await supabase
        .from('collection_items')
        .select('id,name,mimetype,size,path')
        .eq('collection_id', (s as any).collection_id)
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

  const currentPath = segments.join('/')
  const displayItems = useMemo((): DisplayItem[] => {
    const prefix = currentPath ? currentPath + '/' : ''
    const folders = new Set<string>()
    const files: DisplayItem[] = []
    for (const it of items) {
      const rel = it.path.replace(/^public\//, '')
      if (!rel.startsWith(prefix)) continue
      const rest = rel.slice(prefix.length)
      const idx = rest.indexOf('/')
      if (idx === -1) {
        files.push({ ...it, type: 'file' })
      } else {
        folders.add(rest.slice(0, idx))
      }
    }
    const folderItems: DisplayItem[] = Array.from(folders).map(name => ({ id: name, name, type: 'folder' }))
    return [...folderItems, ...files]
  }, [items, currentPath])

  const onOpen = (item: DisplayItem) => {
    if (item.type === 'folder') {
      setSegments(prev => [...prev, item.name])
    } else if (item.publicUrl) {
      window.open(item.publicUrl, '_blank')
    }
  }

  const downloadItem = async (item: DisplayItem) => {
    if (item.type === 'file' && item.publicUrl) {
      const res = await fetch(item.publicUrl)
      const blob = await res.blob()
      saveAs(blob, item.name)
    } else if (item.type === 'folder') {
      const prefix = (currentPath ? currentPath + '/' : '') + item.name + '/'
      const folderFiles = items.filter(f => f.path.replace(/^public\//, '').startsWith(prefix))
      const zip = new JSZip()
      for (const f of folderFiles) {
        if (!f.publicUrl) continue
        const res = await fetch(f.publicUrl)
        const blob = await res.blob()
        const rel = f.path.replace(/^public\//, '').slice(prefix.length)
        zip.file(rel, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, item.name + '.zip')
    }
  }

  const deleteItem = async (item: DisplayItem) => {
    if (!canEdit) return
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    if (item.type === 'file') {
      await supabase.storage.from(BUCKET).remove([item.path])
      await supabase.from('collection_items').delete().eq('id', item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } else {
      const prefix = 'public/' + (currentPath ? currentPath + '/' : '') + item.name
      const targets = items.filter(i => i.path.startsWith(prefix))
      await supabase.storage.from(BUCKET).remove(targets.map(t => t.path))
      await supabase.from('collection_items').delete().in('id', targets.map(t => t.id))
      setItems(prev => prev.filter(i => !i.path.startsWith(prefix)))
    }
  }

  const uploadFiles = () => {
    if (!canEdit || !share) return
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async () => {
      if (!input.files?.length) return
      const files = Array.from(input.files)
      for (const file of files) {
        const target = 'public/' + (currentPath ? currentPath + '/' : '') + file.name
        await supabase.storage.from(BUCKET).upload(target, file, { upsert: true })
        const { data: inserted } = await supabase
          .from('collection_items')
          .insert({
            collection_id: (share as any).collection_id,
            path: target,
            name: file.name,
            mimetype: file.type,
            size: file.size
          })
          .select('id')
          .single()
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(target)
        setItems(prev => [...prev, { id: inserted?.id || '', name: file.name, mimetype: file.type, size: file.size, path: target, publicUrl: data.publicUrl }])
      }
    }
    input.click()
  }

  if (loading) return <div className="container mx-auto p-6">...جاري التحميل</div>
  if (!share) return <div className="container mx-auto p-6">الرابط غير موجود أو انتهت صلاحيته.</div>

  return (
    <div>
      <section className="share-hero">
        <div className="container mx-auto p-6 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <div className="text-sm opacity-70">مشاركة</div>
            <h1 className="text-3xl md:text-4xl font-bold">{share.title || ''}</h1>
            {share.subtitle && <p className="opacity-80">{share.subtitle}</p>}
            {canEdit ? (
              <div className="text-sm text-green-400">لديك صلاحية التعديل</div>
            ) : (
              <div className="text-sm opacity-70">معاينة فقط</div>
            )}
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
        {segments.length > 0 && (
          <div className="mb-4 text-sm">
            <button onClick={() => setSegments(prev => prev.slice(0, -1))} className="underline">رجوع</button>
          </div>
        )}
        {canEdit && (
          <div className="mb-4">
            <button onClick={uploadFiles} className="btn"><Upload className="w-4 h-4 inline mr-1"/>رفع ملفات</button>
          </div>
        )}
        <div className="grid-auto">
          {displayItems.map(it => (
            <div key={it.id} onClick={() => onOpen(it)} className="p-2 rounded-lg hover:bg-gray-800/40 border border-transparent hover:border-gray-700 cursor-pointer">
              <div className="thumb">
                {it.type === 'folder' ? (
                  <div className="grid place-items-center">
                    <div className="text-5xl">📁</div>
                  </div>
                ) : it.mimetype?.startsWith('image/') ? (
                  <img src={it.publicUrl} alt={it.name} />
                ) : it.mimetype?.startsWith('video/') ? (
                  <video src={it.publicUrl} muted />
                ) : (
                  <div className="grid place-items-center">
                    <div className="text-5xl">📄</div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-sm truncate" title={it.name}>{it.name}</div>
                <div className="flex items-center gap-1">
                  <button onClick={e=>{e.stopPropagation(); downloadItem(it)}} className="btn" title="تحميل"><Download className="w-4 h-4"/></button>
                  {canEdit && <button onClick={e=>{e.stopPropagation(); deleteItem(it)}} className="btn" title="حذف"><Trash2 className="w-4 h-4"/></button>}
                </div>
              </div>
              {it.type === 'file' && (
                <div className="text-xs opacity-60">{it.size ? Math.round((it.size || 0) / 1024) + ' KB' : ''}</div>
              )}
            </div>
          ))}
        </div>
      </main>
      {share.bottom_image_url && (
        <div className="container mx-auto p-6">
          <img src={share.bottom_image_url} alt="bottom" className="w-full object-cover rounded-xl" />
        </div>
      )}
    </div>
  )
}
