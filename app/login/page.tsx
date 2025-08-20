'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  // معالجة التوكن بعد فتح رابط الـ Magic Link
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')

    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token
      }).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
        window.location.href = '/' // توجيه للصفحة الرئيسية
      })
    }
  }, [supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) alert(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="card p-10 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <p className="text-sm opacity-80">
          أدخل بريدك وستصلك وصلة سريعة (Magic Link)
        </p>
        {sent ? (
          <div className="p-4 rounded bg-green-800/40">
            تم إرسال الرابط. افحص بريدك.
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3">
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              إرسال
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
