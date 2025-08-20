'use client'
import { useState, useEffect, useMemo, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function ShareModal({ open, url, onClose }: { open: boolean, url: string, onClose: ()=>void }) {
  const [mode, setMode] = useState<'view'|'edit'>('view')
  const [copied, setCopied] = useState(false)
  const [share, setShare] = useState<any>(null)
  const [title, setTitle] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const slug = useMemo(() => {
    try {
      return new URL(url).pathname.split('/').pop() || ''
    } catch {
      return ''
    }
  }, [url])

  useEffect(()=>{ setMode('view'); setCopied(false) }, [url])

  useEffect(() => {
    if (!open || !slug) return
    const load = async () => {
      const { data } = await supabase.from('shares').select('*').eq('slug', slug).single()
      setShare(data)
      setTitle(data?.title || '')
    }
    load()
  }, [open, slug, supabase])

  const updateShare = async (fields: any) => {
    if (!share) return
    const { data, error } = await supabase.from('shares').update(fields).eq('id', share.id).select().single()
    if (!error && data) setShare(data)
  }

  const saveTitle = async () => {
    await updateShare({ title })
  }

  const uploadImage = async (file: File, field: 'banner_image_url' | 'bottom_image_url') => {
    if (!slug) return
    const target = `public/${slug}-${field}-${file.name}`
    await supabase.storage.from('drive').upload(target, file, { upsert: true })
    const { data } = supabase.storage.from('drive').getPublicUrl(target)
    await updateShare({ [field]: data.publicUrl })
  }

  const onBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file, 'banner_image_url')
  }

  const onBottomChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file, 'bottom_image_url')
  }

  if (!open) return null

  const link = mode === 'view' ? url : `${url}?mode=edit`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true) } catch { setCopied(false) }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
      <div className="card p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold">رابط المشاركة</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">العنوان الرئيسي</label>
            <input className="input w-full" value={title} onChange={e=>setTitle(e.target.value)} />
            <button className="btn mt-2" onClick={saveTitle}>حفظ</button>
          </div>
          <div>
            <label className="block mb-1 text-sm">الصورة الإعلانية</label>
            <input type="file" accept="image/*" onChange={onBannerChange} />
          </div>
          <div>
            <label className="block mb-1 text-sm">صورة أسفل الصفحة</label>
            <input type="file" accept="image/*" onChange={onBottomChange} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="perm" checked={mode==='view'} onChange={()=>setMode('view')} /> معاينة فقط
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="perm" checked={mode==='edit'} onChange={()=>setMode('edit')} /> تعديل ومعاينة
          </label>
        </div>
        <div className="space-y-2">
          <input className="input w-full" readOnly value={link} />
          <button className="btn" onClick={copy}>{copied? 'تم النسخ' : 'نسخ الرابط'}</button>
        </div>
        <div className="flex justify-end pt-2">
          <button className="btn" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  )
}

