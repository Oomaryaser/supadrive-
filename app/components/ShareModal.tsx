'use client'
import { useState, useEffect } from 'react'

export default function ShareModal({ open, url, onClose }: { open: boolean, url: string, onClose: ()=>void }) {
  const [mode, setMode] = useState<'view'|'edit'>('view')
  const [copied, setCopied] = useState(false)

  useEffect(()=>{ setMode('view'); setCopied(false) }, [url])

  if (!open) return null

  const link = mode === 'view' ? url : `${url}?mode=edit`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true) } catch { setCopied(false) }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
      <div className="card p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold">رابط المشاركة</h3>
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

