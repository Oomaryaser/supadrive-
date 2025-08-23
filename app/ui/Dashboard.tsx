'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import NavBar from '../components/NavBar'
import FileCard, { type Item } from '../components/FileCard'
import MoveToCollectionModal from '../components/MoveToCollectionModal'
import ShareModal from '../components/ShareModal'
import { Trash2, AlertCircle, Share2 } from 'lucide-react'

const BUCKET = 'drive'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

type Collection = { 
  id: string
  name: string
  created_at?: string
}

type ShareResp = {
  slug: string
}

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const supabase = useMemo(() => createClient(), [])

  // ===== Auth handling =====
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const isUUID = (v: any) =>
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

  useEffect(() => {
    (async () => {
      // لو وصلت userId من props وكانت UUID نستخدمها، خلافه نجلب من جلسة Supabase
      if (isUUID(userId)) {
        setAuthUserId(userId)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUserId(user?.id ?? null)
    })()
  }, [supabase, userId])

  const requireAuth = () => {
    if (!authUserId) {
      showError('يلزم تسجيل الدخول لإجراء هذه العملية.')
      return false
    }
    return true
  }

  // ===== State management =====
  const [segments, setSegments] = useState<string[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [moveOpen, setMoveOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  
  const pathPrefix = `public/${segments.join('/')}`.replace(/\/$/, '')

  // ===== Helpers =====
  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `حجم الملف ${file.name} كبير جداً. الحد الأقصى هو 100 ميجابايت`
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
      return `نوع الملف ${file.name} غير مسموح`
    }
    if (file.name.includes('/') || file.name.includes('\\')) {
      return `اسم الملف ${file.name} يحتوي على أحرف غير مسموحة`
    }
    return null
  }

  const ensurePublicUrl = useCallback(async (item: Item): Promise<Item> => {
    if (item.type === 'folder') return item
    try {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.path)
      return { ...item, publicUrl: data.publicUrl }
    } catch (error) {
      console.error('خطأ في الحصول على رابط الملف:', error)
      return item
    }
  }, [supabase])

  const list = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const prefix = pathPrefix ? pathPrefix + '/' : 'public/'
      const { data, error } = await supabase
        .storage.from(BUCKET)
        .list(prefix, { 
          limit: 1000, 
          sortBy: { column: 'name', order: 'asc' } 
        })

      if (error) {
        showError('خطأ في تحميل الملفات: ' + error.message)
        return
      }

      const mapped: Item[] = (data || []).map((d: any) => ({
        id: d.id || d.name,
        type: d.metadata ? 'file' : 'folder',
        name: d.name,
        size: d.metadata?.size,
        mimetype: d.metadata?.mimetype,
        updated_at: d.updated_at,
        path: (prefix + d.name).replace(/\/$/, '')
      }))

      const withUrls = await Promise.all(mapped.map(ensurePublicUrl))
      setItems(withUrls)
    } catch (error) {
      showError('خطأ غير متوقع في تحميل الملفات')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [pathPrefix, supabase, ensurePublicUrl])

  useEffect(() => {
    list()
  }, [list])

  const onOpen = (item: Item) => {
    if (item.type === 'folder') {
      setSegments(prev => [...prev, item.name])
    } else if (item.publicUrl) {
      window.open(item.publicUrl, '_blank')
    }
  }

  const onUploadClick = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = ALLOWED_FILE_TYPES.join(',')
    
    input.onchange = async () => {
      if (!input.files?.length) return
      
      const files = Array.from(input.files)
      let hasErrors = false
      
      for (const file of files) {
        const validationError = validateFile(file)
        if (validationError) {
          showError(validationError)
          hasErrors = true
          break
        }
      }
      if (hasErrors) return
      
      setLoading(true)
      try {
        for (const file of files) {
          const target = (pathPrefix ? pathPrefix + '/' : 'public/') + file.name
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(target, file, { upsert: true })
          if (error) {
            showError(`خطأ في رفع الملف ${file.name}: ${error.message}`)
            break
          }
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        }
      } finally {
        setLoading(false)
        setUploadProgress({})
        list()
      }
    }
    input.click()
  }

  const onNewFolderClick = async () => {
    const name = prompt('اسم المجلد الجديد؟')?.trim()
    if (!name) return
    if (name.includes('/') || name.includes('\\')) {
      showError('اسم المجلد يحتوي على أحرف غير مسموحة')
      return
    }
    if (items.some(item => item.name === name)) {
      showError('يوجد مجلد بهذا الاسم بالفعل')
      return
    }
    try {
      const target = (pathPrefix ? pathPrefix + '/' : 'public/') + name + '/'
      const blob = new Blob([''], { type: 'text/plain' })
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(target + '.gitkeep', blob, { upsert: true })
      if (error) {
        showError('خطأ في إنشاء المجلد: ' + error.message)
      } else {
        list()
      }
    } catch (error) {
      showError('خطأ غير متوقع في إنشاء المجلد')
      console.error(error)
    }
  }

  // ===== Breadcrumb =====
  const goBack = () => setSegments(prev => prev.slice(0, -1))
  const navigateToSegment = (index: number) => {
    setSegments(prev => prev.slice(0, index + 1))
  }

  // ===== Collections =====
  const fetchCollections = async () => {
    try {
      if (!authUserId) { setCollections([]); return }
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
      if (error) {
        showError('خطأ في تحميل المجموعات: ' + error.message)
        return
      }
      setCollections((data || []) as Collection[])
    } catch (error) {
      showError('خطأ غير متوقع في تحميل المجموعات')
      console.error(error)
    }
  }

  const createCollection = async (name: string) => {
    if (!name.trim()) {
      showError('يجب إدخال اسم المجموعة')
      return
    }
    if (!requireAuth()) return
    try {
      const { error } = await supabase
        .from('collections')
        .insert({ name: name.trim(), user_id: authUserId })
      if (error) {
        showError('خطأ في إنشاء المجموعة: ' + error.message)
      } else {
        fetchCollections()
      }
    } catch (error) {
      showError('خطأ غير متوقع في إنشاء المجموعة')
      console.error(error)
    }
  }

  const moveSelectedToCollection = async (collectionId: string) => {
    const selectedItems = items.filter(item => selected[item.path] && item.type === 'file')
    if (selectedItems.length === 0) {
      showError('لم يتم تحديد ملفات')
      return
    }
    if (!requireAuth()) return
    try {
      const payload = selectedItems.map(item => ({
        collection_id: collectionId,
        path: item.path,
        name: item.name,
        mimetype: item.mimetype,
        size: item.size,
        user_id: authUserId
      }))
      const { error } = await supabase.from('collection_items').insert(payload)
      if (error) {
        showError('خطأ في إضافة الملفات للمجموعة: ' + error.message)
      } else {
        setSelected({})
        alert('تمت الإضافة إلى المجموعة بنجاح')
      }
    } catch (error) {
      showError('خطأ غير متوقع في إضافة الملفات للمجموعة')
      console.error(error)
    }
  }

  const listAllFiles = useCallback(async (prefix: string): Promise<Item[]> => {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })
    if (error) {
      console.error('خطأ في تحميل محتويات المجلد:', error)
      showError('خطأ في تحميل محتويات المجلد')
      return []
    }
    const files: Item[] = []
    for (const d of data || []) {
      const fullPath = `${prefix}${d.name}`.replace(/\/$/, '')
      if (d.metadata) {
        files.push({
          id: d.id || d.name,
          type: 'file',
          name: d.name,
          size: d.metadata.size,
          mimetype: d.metadata.mimetype,
          updated_at: d.updated_at,
          path: fullPath
        })
      } else {
        const sub = await listAllFiles(fullPath + '/')
        files.push(...sub)
      }
    }
    return files
  }, [supabase, showError])

  const shareSelected = async (override?: Item[]): Promise<void> => {
    const selectedItems = override ?? items.filter(item => selected[item.path])
    if (selectedItems.length === 0) {
      showError('اختر ملفاً أو مجلداً واحداً على الأقل')
      return
    }
    if (!requireAuth()) return
    try {
      let files: Item[] = []
      for (const item of selectedItems) {
        if (item.type === 'file') {
          files.push(item)
        } else {
          const sub = await listAllFiles(item.path + '/')
          files.push(...sub)
        }
      }
      if (files.length === 0) {
        showError('المجلدات المختارة فارغة')
        return
      }

      // Create collection
      const { data: coll, error: cErr } = await supabase
        .from('collections')
        .insert({
          name: `مشاركة - ${new Date().toLocaleDateString('ar')}`,
          user_id: authUserId
        })
        .select('id')
        .single()
      if (cErr || !coll?.id) {
        showError('خطأ في إنشاء مجموعة المشاركة' + (cErr ? ': ' + cErr.message : ''))
        return
      }
      const collId = (coll as any).id as string

      // Add items to collection
      const payload = files.map(item => ({
        collection_id: collId,
        path: item.path,
        name: item.name,
        mimetype: item.mimetype,
        size: item.size,
        user_id: authUserId
      }))
      const { error: iErr } = await supabase.from('collection_items').insert(payload)
      if (iErr) {
        showError('خطأ في إضافة الملفات للمشاركة: ' + iErr.message)
        return
      }

      // Create public share
      const { data: share, error: sErr } = await supabase
        .rpc('create_share_for_collection', { p_collection_id: collId })
        .single<ShareResp>()
      if (sErr || !share?.slug) {
        showError('خطأ في إنشاء رابط المشاركة' + (sErr ? ': ' + sErr.message : ''))
        return
      }

      const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const url = `${base}/s/${share.slug}`
      setShareUrl(url)
      setShareOpen(true)
      setSelected({})
    } catch (error) {
      showError('خطأ غير متوقع في إنشاء المشاركة')
      console.error(error)
    }
  }

  const deleteSelected = async () => {
    const selectedPaths = items
      .filter(item => selected[item.path])
      .map(item => item.path)
    if (selectedPaths.length === 0) {
      showError('لم يتم تحديد ملفات للحذف')
      return
    }
    if (!confirm(`هل تريد حذف ${selectedPaths.length} عنصر؟`)) return
    try {
      const { error } = await supabase.storage.from(BUCKET).remove(selectedPaths)
      if (error) {
        showError('خطأ في حذف الملفات: ' + error.message)
      } else {
        setSelected({})
        list()
      }
    } catch (error) {
      showError('خطأ غير متوقع في حذف الملفات')
      console.error(error)
    }
  }

  // ===== Selection =====
  const selectAll = () => {
    const allSelected = items.every(item => selected[item.path])
    if (allSelected) {
      setSelected({})
    } else {
      const newSelected: Record<string, boolean> = {}
      items.forEach(item => { newSelected[item.path] = true })
      setSelected(newSelected)
    }
  }

  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  )
  const selectedCount = Object.values(selected).filter(Boolean).length

  useEffect(() => {
    fetchCollections()
  }, [authUserId]) // حمّل مجموعات المستخدم عند توفره

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavBar
        view={view}
        setView={setView}
        onUploadClick={onUploadClick}
        onNewFolderClick={onNewFolderClick}
        onCreateCollection={() => {
          if (!authUserId) return showError('يلزم تسجيل الدخول')
          setMoveOpen(true)
          fetchCollections()
        }}
        onShareSelected={() => {
          if (!authUserId) return showError('يلزم تسجيل الدخول')
          shareSelected()
        }}
        onSearch={setQuery}
      />

      <main className="container mx-auto p-4 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Breadcrumb */}
        {segments.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setSegments([])}
              className="text-blue-400 hover:text-blue-300"
            >
              الرئيسية
            </button>
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => navigateToSegment(index)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 text-sm">
          تصفح مجلد <code className="bg-blue-500/30 px-2 py-1 rounded">public/</code> بدون تسجيل دخول.
          لإنشاء <b>مجموعة</b> أو <b>رابط مشاركة</b> يجب تسجيل الدخول أولاً.
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-danger flex items-center gap-2"
              onClick={deleteSelected}
              disabled={selectedCount === 0}
            >
              <Trash2 className="w-4 h-4" />
              حذف المحدد ({selectedCount})
            </button>
            
            {items.length > 0 && (
              <button 
                className="btn btn-secondary"
                onClick={selectAll}
              >
                {Object.values(selected).every(Boolean) ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
            )}
          </div>

          {segments.length > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={goBack}
            >
              ← رجوع
            </button>
          )}
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 rounded-full h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3">جاري التحميل...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 opacity-70">
            {query ? 'لا توجد نتائج للبحث' : 'لا توجد عناصر هنا'}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filtered.map(item => (
              <FileCard
                key={item.path}
                item={item}
                selected={!!selected[item.path]}
                toggle={() => setSelected(s => ({ ...s, [item.path]: !s[item.path] }))}
                onOpen={onOpen}
                onShare={(it) => shareSelected([it])}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 text-sm font-medium">
              <div className="col-span-6">الاسم</div>
              <div className="col-span-2">الحجم</div>
              <div className="col-span-3">تاريخ التعديل</div>
              <div className="col-span-1 text-center">تحديد</div>
            </div>
            <div className="divide-y divide-gray-700">
              {filtered.map(item => (
                <div
                  key={item.path}
                  className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="col-span-6 flex items-center justify-between">
                    <button
                      className="text-left flex-1 cursor-pointer hover:text-blue-400"
                      onClick={() => onOpen(item)}
                    >
                      {item.name}
                    </button>
                    <button
                      className="opacity-80 ml-2"
                      onClick={() => shareSelected([item])}
                      title="مشاركة"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-2 text-sm opacity-70">
                    {item.type === 'file' && item.size ?
                      `${Math.round(item.size / 1024)} كيلوبايت` :
                      item.type === 'folder' ? 'مجلد' : '-'
                    }
                  </div>
                  <div className="col-span-3 text-sm opacity-70">
                    {item.updated_at?.slice(0, 19).replace('T', ' ') || '-'}
                  </div>
                  <div className="col-span-1 text-center">
                    <input 
                      type="checkbox" 
                      checked={!!selected[item.path]} 
                      onChange={() => setSelected(s => ({ ...s, [item.path]: !s[item.path] }))}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <MoveToCollectionModal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        collections={collections}
        onCreate={createCollection}
        onConfirm={moveSelectedToCollection}
      />
      <ShareModal
        open={shareOpen}
        url={shareUrl}
        onClose={() => setShareOpen(false)}
      />
    </div>
  )
}
