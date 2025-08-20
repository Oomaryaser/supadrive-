'use client'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ path, onJump }: { path: string[], onJump: (i: number) => void }) {
  return (
    <nav className="text-sm text-gray-300">
      <div className="flex items-center gap-1">
        {['الرئيسية', ...path].map((seg, i) => (
          <div className="flex items-center gap-1" key={i}>
            {i>0 && <ChevronRight className="w-3 h-3 opacity-60" />}
            <button onClick={() => onJump(i-1)} className="hover:underline px-1 py-0.5 rounded hover:bg-gray-800/60">
              {seg || '—'}
            </button>
          </div>
        ))}
      </div>
    </nav>
  )
}