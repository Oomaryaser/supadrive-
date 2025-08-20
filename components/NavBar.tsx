'use client'
import { UploadCloud, FolderPlus, Home, LayoutGrid, List, LogIn, LogOut, SortAsc, SortDesc } from 'lucide-react'

export default function NavBar({
  userEmail,
  onUploadClick,
  onNewFolderClick,
  onHomeClick,
  view,
  setView,
  query,
  setQuery,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  anySelected,
  onClearSelected,
  onZipSelected,
}: {
  userEmail: string | null
  onUploadClick: () => void
  onNewFolderClick: () => void
  onHomeClick: () => void
  view: 'grid'|'list'
  setView: (v: 'grid'|'list') => void
  query: string
  setQuery: (v: string) => void
  sortKey: 'name'|'date'|'size'
  setSortKey: (k: 'name'|'date'|'size') => void
  sortDir: 'asc'|'desc'
  setSortDir: (d: 'asc'|'desc') => void
  anySelected: boolean
  onClearSelected: () => void
  onZipSelected: () => void
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-800 bg-[rgba(11,13,16,.7)] backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center gap-3 justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="btn" onClick={onHomeClick}><Home className="w-5 h-5" /></button>
          <strong>Supadrive</strong>
          <span className="badge">{userEmail ? userEmail : 'Public'}</span>
        </div>

        <div className="flex-1 min-w-[200px] max-w-xl">
          <input
            className="input"
            placeholder="بحث..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <button
              className={`btn ${view === 'grid' ? 'btn-primary' : ''}`}
              title="عرض شبكي"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={`btn ${view === 'list' ? 'btn-primary' : ''}`}
              title="عرض جدولي"
              onClick={() => setView('list')}
            >
              <List className="w-4 h-4" />
            </button>

            <select className="input !py-1 !px-2 w-28" value={sortKey} onChange={e=>setSortKey(e.target.value as any)}>
              <option value="name">الاسم</option>
              <option value="date">التاريخ</option>
              <option value="size">الحجم</option>
            </select>
            <button className="btn" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>
              {sortDir==='asc' ? <SortAsc className="w-4 h-4"/> : <SortDesc className="w-4 h-4"/>}
            </button>
          </div>

          {anySelected && (
            <div className="flex items-center gap-2">
              <button className="btn btn-primary" onClick={onZipSelected}>ZIP</button>
              <button className="btn" onClick={onClearSelected}>إلغاء</button>
            </div>
          )}

          <button className="btn" onClick={onNewFolderClick}><FolderPlus className="w-4 h-4" /> <span className="hidden sm:inline">مجلد</span></button>
          <button className="btn btn-primary" onClick={onUploadClick}><UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">رفع</span></button>

          {userEmail ? (
            <a className="btn" href="/logout"><LogOut className="w-4 h-4" /></a>
          ) : (
            <a className="btn" href="/login"><LogIn className="w-4 h-4" /></a>
          )}
        </div>
      </div>
    </header>
  )
}