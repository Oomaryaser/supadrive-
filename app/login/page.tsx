'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    })
    if (error) {
      if (error.message.toLowerCase().includes('user not found')) {
        router.push(`/register?email=${encodeURIComponent(email)}`)
      } else {
        alert(error.message)
      }
    } else {
      setSent(true)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    if (error) alert(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="card p-10 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        {sent ? (
          <form onSubmit={handleVerify} className="space-y-3">
            <input
              className="input"
              type="text"
              placeholder="رمز التحقق"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              دخول
            </button>
          </form>
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
              إرسال الرمز
            </button>
          </form>
        )}
        <p className="text-sm opacity-80">
          لا تملك حساباً؟ <Link className="link" href="/register">سجّل الآن</Link>
        </p>
      </div>
    </div>
  )
}

