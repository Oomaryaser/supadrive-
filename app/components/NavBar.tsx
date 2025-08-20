'use client'
import { UploadCloud, FolderPlus, Share2, Search, Grid, List, FolderPlusIcon } from 'lucide-react'

export default function NavBar({
  view, setView, onUploadClick, onNewFolderClick, onShareSelected, onCreateCollection, onSearch
}: {
  view: 'grid'|'list',
  setView: (v:'grid'|'list')=>void,
  onUploadClick: () => void,
  onNewFolderClick: () => void,
  onShareSelected: () => void,
  onCreateCollection: () => void,
  onSearch: (q: string)=>void
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-800 bg-[rgba(11,13,16,.7)] backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <strong>Supadrive Pro</strong>
          <div className="hidden md:flex items-center gap-2">
            <button className={`btn ${view==='grid'?'btn-primary':''}`} onClick={()=>setView('grid')}><Grid className="w-4 h-4" />شبكة</button>
            <button className={`btn ${view==='list'?'btn-primary':''}`} onClick={()=>setView('list')}><List className="w-4 h-4" />قائمة</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <input className="input" placeholder="بحث..." onChange={(e)=>onSearch(e.target.value)} />
          </div>
          <button className="btn" onClick={onNewFolderClick}><FolderPlus className="w-4 h-4" /> مجلد</button>
          <button className="btn" onClick={onCreateCollection}><FolderPlusIcon className="w-4 h-4" /> مجموعة</button>
          <button className="btn btn-primary" onClick={onUploadClick}><UploadCloud className="w-4 h-4" /> رفع</button>
          <button className="btn" onClick={onShareSelected}><Share2 className="w-4 h-4" /> مشاركة المحدد</button>
        </div>
      </div>
    </header>
  )
}
