'use client'
import { File, Folder, CheckSquare, Square } from 'lucide-react'

export type Item = {
  id: string
  type: 'file'|'folder'
  name: string
  size?: number
  mimetype?: string
  updated_at?: string
  path: string
  publicUrl?: string
}

export default function FileCard({
  item, selected, toggle, onOpen
}: {
  item: Item, selected: boolean, toggle: ()=>void, onOpen: (it: Item)=>void
}) {
  const isImg = !!item.mimetype?.startsWith('image/')
  const isVid = !!item.mimetype?.startsWith('video/')
  return (
    <div className={`p-2 rounded-lg hover:bg-gray-800/40 border border-transparent hover:border-gray-700`}>
      <div className="thumb cursor-pointer" onClick={()=>onOpen(item)}>
        {item.type==='folder' ? (
          <Folder className="w-10 h-10 opacity-70" />
        ) : isImg ? (
          <img src={item.publicUrl} alt={item.name} />
        ) : isVid ? (
          <video src={item.publicUrl} muted />
        ) : (
          <File className="w-10 h-10 opacity-70" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <button className="text-left text-sm truncate hover:underline" title={item.name} onClick={()=>onOpen(item)}>{item.name}</button>
        <button className="opacity-80" onClick={toggle} title="تحديد">
          {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
      </div>
      <div className="text-xs opacity-60 mt-1">{item.type==='file' && item.size ? Math.round(item.size/1024)+' KB' : ''}</div>
    </div>
  )
}
