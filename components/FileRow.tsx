'use client'
import { Download, File, Folder, Pencil, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'

export type Item = {
  id: string
  type: 'file'|'folder'
  name: string
  size?: number
  mimetype?: string
  updated_at?: string
  path: string
}

export default function FileRow({
  item, onOpen, onDelete, onRename, onDownload, onShare
}: {
  item: Item,
  onOpen: () => void
  onDelete: () => void
  onRename: (it: Item, name: string) => void
  onDownload: () => void
  onShare: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(item.name)

  return (
    <div className="grid grid-cols-12 items-center flex-1 px-3 py-2 rounded-lg hover:bg-gray-800/40">
      <div className="col-span-6 flex items-center gap-2">
        {item.type === 'folder' ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
        {editing ? (
          <form onSubmit={(e)=>{e.preventDefault(); onRename(item, val); setEditing(false)}}>
            <input className="input" value={val} onChange={e=>setVal(e.target.value)} />
          </form>
        ) : (
          <button onClick={onOpen} className="text-left hover:underline truncate max-w-full">{item.name}</button>
        )}
      </div>
      <div className="col-span-2">{item.type === 'file' && item.size ? (Math.round(item.size/1024)+' KB') : ''}</div>
      <div className="col-span-2">{item.updated_at?.slice(0,19).replace('T',' ')}</div>
      <div className="col-span-2 flex justify-end gap-2">
        {item.type==='file' && <button className="btn" onClick={onDownload}><Download className="w-4 h-4"/></button>}
        <button className="btn" onClick={()=>setEditing(v=>!v)}><Pencil className="w-4 h-4"/></button>
        <button className="btn" onClick={onShare}><Share2 className="w-4 h-4"/></button>
        <button className="btn" onClick={onDelete}><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  )
}