'use client'
import { File, Folder, Download, Pencil, Share2, Trash2, CheckSquare, Square } from 'lucide-react'
import { useEffect, useState } from 'react'

export type Item = {
  id: string
  type: 'file'|'folder'
  name: string
  size?: number
  mimetype?: string
  updated_at?: string
  path: string
}

export default function FileCard({
  item,
  selected,
  onToggleSelect,
  onOpen,
  getUrl,
  onRename,
  onDelete,
  onShare,
  onDownload,
}: {
  item: Item
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  getUrl: (path: string) => Promise<string>
  onRename: (name: string) => void
  onDelete: () => void
  onShare: () => void
  onDownload: () => void
}) {
  const [thumb, setThumb] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(item.name)

  useEffect(() => {
    let active = true
    const ext = (item.name.split('.').pop() || '').toLowerCase()
    const isImage = ['png','jpg','jpeg','gif','webp','bmp','avif'].includes(ext)
    const isPdf = ext === 'pdf'
    if (item.type==='file' && (isImage || isPdf)) {
      getUrl(item.path).then((u) => { if (active) setThumb(u) })
    } else {
      setThumb(null)
    }
    return () => { active = false }
  }, [item, getUrl])

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-[var(--card)] border border-transparent hover:border-gray-700 transition`}>
      <button onClick={onToggleSelect} className="absolute top-2 right-2 z-10 btn !px-2 !py-1">
        {selected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
      </button>

      <div className="aspect-square bg-gray-900/40 grid place-items-center cursor-pointer" onClick={onOpen}>
        {thumb ? (
          <img src={thumb} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          item.type==='folder' ? <Folder className="w-10 h-10 opacity-70"/> : <File className="w-10 h-10 opacity-70"/>
        )}
      </div>

      <div className="p-2 space-y-1">
        {editing ? (
          <form onSubmit={(e)=>{e.preventDefault(); onRename(val); setEditing(false)}}>
            <input className="input" value={val} onChange={e=>setVal(e.target.value)} />
          </form>
        ) : (
          <div className="text-sm truncate" title={item.name}>{item.name}</div>
        )}
        <div className="text-xs opacity-60 flex items-center gap-2">
          {item.type==='file' && item.size ? `${Math.round(item.size/1024)} KB` : '—'}
          <span>•</span>
          <span>{item.updated_at?.slice(0,10) || ''}</span>
        </div>
        <div className="flex items-center gap-1 pt-1">
          {item.type==='file' && <button className="btn" onClick={onDownload}><Download className="w-4 h-4"/></button>}
          <button className="btn" onClick={()=>setEditing(v=>!v)}><Pencil className="w-4 h-4"/></button>
          <button className="btn" onClick={onShare}><Share2 className="w-4 h-4"/></button>
          <button className="btn" onClick={onDelete}><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  )
}