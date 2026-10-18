'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, AlertCircle, Copy, Check } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { loginUser, DEMO_USERS, getSession } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // If already logged in, skip to the app
  useEffect(() => {
    if (getSession()) router.replace('/cases')
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // small artificial delay so it feels like a real auth call
    setTimeout(() => {
      const user = loginUser(email, password)
      if (!user) {
        setError('Invalid email or password. Use one of the demo accounts below.')
        setLoading(false)
        return
      }
      const next = searchParams.get('next') || '/cases'
      router.replace(next)
    }, 600)
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background Image with warm judicial ambient overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/auth-bg.jpg"
          alt="NyayaTrace Legal Chambers"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Balanced dark overlay so the library, books, and glowing scales of justice remain clearly visible */}
        <div className="absolute inset-0 bg-slate-950/60 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/70" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/15 bg-charcoal/85 backdrop-blur-xl shadow-2xl shadow-black/80 px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <NyayaTraceLogo size="lg" variant="light" />
          </div>

          <h1 className="text-xl font-bold text-offwhite text-center mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted text-center mb-8">
            Sign in to your NyayaTrace workspace
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border-dark bg-navy px-4 py-2.5 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-teal-light hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border-dark bg-navy px-4 py-2.5 pr-11 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-offwhite transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-light disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-teal-light hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials card */}
        <div className="mt-5 rounded-xl border border-border-dark bg-charcoal/60 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Demo accounts — click to fill
          </p>
          <div className="flex flex-col gap-3">
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => fillDemo(u.email, u.password)}
                className="flex items-center justify-between rounded-lg border border-border-dark bg-navy/60 px-4 py-3 text-left hover:border-teal/40 hover:bg-navy transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-offwhite group-hover:text-teal-light transition-colors">
                    {u.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {u.email} · <span className="font-mono">Demo@1234</span>
                  </p>
                  <p className="text-[11px] text-muted/60 mt-0.5">{u.role}</p>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(u.email, u.id)
                  }}
                  className="ml-3 text-muted hover:text-teal-light transition-colors"
                  title="Copy email"
                >
                  {copied === u.id ? <Check size={14} className="text-teal-light" /> : <Copy size={14} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
