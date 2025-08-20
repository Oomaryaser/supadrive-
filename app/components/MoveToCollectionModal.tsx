'use client'
import { useState } from 'react'

type Collection = {
  id: string
  name: string
}

export default function MoveToCollectionModal({
  open, onClose, collections, onCreate, onConfirm
}: {
  open: boolean
  onClose: ()=>void
  collections: Collection[]
  onCreate: (name: string)=>Promise<void>
  onConfirm: (collectionId: string)=>Promise<void>
}) {
  const [newName, setNewName] = useState('')
  const [selected, setSelected] = useState<string>('')

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
      <div className="card p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold">نقل/إضافة إلى مجموعة</h3>

        <div className="space-y-2 max-h-60 overflow-auto">
          {collections.length === 0 ? (
            <div className="opacity-70 text-sm">لا توجد مجموعات بعد.</div>
          ) : collections.map(c => (
            <label key={c.id} className={`block p-2 rounded hover:bg-gray-800/40 cursor-pointer ${selected===c.id?'bg-gray-800/60':''}`}>
              <input type="radio" name="collection" className="mr-2" checked={selected===c.id} onChange={()=>setSelected(c.id)} />
              {c.name}
            </label>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-3 space-y-2">
          <div className="text-sm opacity-80">أو أنشئ مجموعة جديدة:</div>
          <div className="flex items-center gap-2">
            <input className="input" placeholder="اسم المجموعة" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button className="btn" onClick={async ()=>{ if(!newName.trim()) return; await onCreate(newName.trim()); setNewName(''); }}>إنشاء</button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" disabled={!selected} onClick={async ()=>{ await onConfirm(selected); onClose(); }}>تأكيد</button>
        </div>
      </div>
    </div>
  )
}
