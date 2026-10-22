'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, AlertCircle, Copy, Check } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { DEMO_USERS, getSession } from '@/lib/auth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (getSession()) {
      const rawNext = searchParams.get('next')
      const target = rawNext && rawNext !== '/' && rawNext !== '/login' ? rawNext : '/overview'
      router.replace(target)
    }
  }, [router, searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Invalid email or password. Use one of the demo accounts below.')
        setLoading(false)
        return
      }
      const rawNext = searchParams.get('next')
      const next = rawNext && rawNext !== '/' && rawNext !== '/login' ? rawNext : '/overview'
      router.replace(next)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
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
    <div className="auth-root">
      {/* ── Warm off-white background ── */}
      <div className="auth-bg" aria-hidden="true" />

      {/* ── Lady Justice — fixed to the RIGHT side of the screen ── */}
      <div className="auth-statue" aria-hidden="true">
        <Image
          src="/images/lady-justice.jpg"
          alt=""
          fill
          priority
          sizes="70vw"
          className="object-cover object-top"
        />
        {/* Fade from the warm bg colour on the left edge of the statue */}
        <div className="auth-statue-fade" />
      </div>

      {/* ── Main content ── */}
      <div className="auth-content-wrap">
        {/* ── Unified card ── */}
        <div className="auth-card">

          {/* ══ LEFT PANEL: Login form ══ */}
          <div className="auth-form-panel">
            {/* Logo */}
            <div className="mb-7">
              <NyayaTraceLogo size="lg" variant="auth" />
            </div>

            <div className="mb-6">
              <h1 className="auth-heading">Welcome back</h1>
              <p className="auth-subheading">Sign in to your NyayaTrace legal workspace</p>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="auth-label">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="auth-label">Password</label>
                  <Link href="/reset-password" className="auth-link text-xs">
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
                    className="auth-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary mt-1"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <LogIn size={15} />
                )}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Sign up */}
            <p className="mt-7 text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="auth-link font-medium">
                Create one
              </Link>
            </p>

            {/* Legal footer */}
            <div className="mt-auto pt-8 flex items-center gap-2">
              <div className="auth-divider-line" />
              <span className="auth-tagline">Justice. Precision. Clarity.</span>
              <div className="auth-divider-line" />
            </div>
          </div>

          {/* ══ RIGHT PANEL: Demo accounts ══ */}
          <div className="auth-demo-panel">
            <div className="flex items-center justify-between mb-1">
              <span className="auth-demo-badge">Demo Workspace</span>
              <span className="auth-one-click-pill">1-Click Fill</span>
            </div>
            <h2 className="auth-demo-heading">Quick Test Accounts</h2>
            <p className="auth-demo-sub">Click any profile below to autofill credentials:</p>

            <div className="flex flex-col gap-3 mt-5">
              {DEMO_USERS.map((u) => {
                const isSelected = email === u.email
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => fillDemo(u.email, u.password)}
                    className={`auth-demo-card group text-left${isSelected ? ' auth-demo-card--selected' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-crimson transition-colors">
                            {u.name}
                          </span>
                          <span className="auth-role-pill">{u.role}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{u.email}</p>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(u.email, u.id)
                        }}
                        className="p-1 text-slate-400 hover:text-crimson transition-colors"
                        title="Copy email"
                      >
                        {copied === u.id ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Password:{' '}
                        <code className="text-slate-600 font-mono">Demo@1234</code>
                      </span>
                      <span className={`font-medium transition-transform group-hover:translate-x-0.5 ${isSelected ? 'text-crimson' : 'text-slate-400'}`}>
                        {isSelected ? 'Selected ✓' : 'Use profile →'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Decorative seal */}
            <div className="auth-seal mt-auto pt-6 flex items-center gap-3">
              <div className="auth-seal-icon">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="19" y="8" width="2" height="24" rx="1" fill="#C5A880" />
                  <rect x="12" y="30" width="16" height="2.5" rx="1.25" fill="#C5A880" />
                  <rect x="6" y="11.5" width="28" height="2" rx="1" fill="#C5A880" />
                  <line x1="9" y1="13.5" x2="9" y2="20" stroke="#E5C378" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="31" y1="13.5" x2="31" y2="20" stroke="#E5C378" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 20 Q9 26 13 20" stroke="#E5C378" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M27 22 Q31 28 35 22" stroke="#E5C378" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <circle cx="20" cy="9" r="2" fill="#C5A880" />
                </svg>
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                Trusted by legal professionals<br />
                <span className="text-slate-500 font-medium">Secure · Private · Reliable</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F3]" />}>
      <LoginContent />
    </Suspense>
  )
}
