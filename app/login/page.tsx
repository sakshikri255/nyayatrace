'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, AlertCircle, Copy, Check } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { loginUser, DEMO_USERS, getSession } from '@/lib/auth'

function LoginContent() {
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
    <div className="relative min-h-screen md:h-screen md:overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
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

      <div className="relative z-10 w-full max-w-4xl">
        {/* Unified Glassmorphic Card */}
        <div className="rounded-2xl border border-white/15 bg-charcoal/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Sign in form */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <div className="mb-6">
                <NyayaTraceLogo size="lg" variant="light" />
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-offwhite tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted mt-1">
                  Sign in to your NyayaTrace legal workspace
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 mb-4 text-xs text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    className="w-full rounded-lg border border-border-dark bg-navy/80 px-3.5 py-2.5 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
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
                      className="w-full rounded-lg border border-border-dark bg-navy/80 px-3.5 py-2.5 pr-10 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-offwhite transition-colors"
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
                  className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-light disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal/20"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </div>

            {/* Sign up link */}
            <p className="mt-6 text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-teal-light hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Right Column: Demo Accounts & Fast Access */}
          <div className="border-t md:border-t-0 md:border-l border-white/10 bg-navy/40 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-light">
                  Demo Workspace
                </span>
                <span className="text-[11px] text-muted/70 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  1-Click Fill
                </span>
              </div>
              <h2 className="text-lg font-semibold text-offwhite">
                Quick Test Accounts
              </h2>
              <p className="text-xs text-muted mt-1 mb-5">
                Click any profile below to autofill credentials:
              </p>

              <div className="flex flex-col gap-3">
                {DEMO_USERS.map((u) => {
                  const isSelected = email === u.email
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => fillDemo(u.email, u.password)}
                      className={`group text-left rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-teal bg-teal/10 shadow-md shadow-teal/10'
                          : 'border-white/10 bg-navy/60 hover:border-teal/50 hover:bg-navy/90'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-offwhite group-hover:text-teal-light transition-colors">
                              {u.name}
                            </span>
                            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1 font-mono">
                            {u.email}
                          </p>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(u.email, u.id)
                          }}
                          className="text-muted hover:text-teal-light transition-colors p-1"
                          title="Copy email"
                        >
                          {copied === u.id ? (
                            <Check size={14} className="text-teal-light" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted/70 pt-2 border-t border-white/5">
                        <span>
                          Password: <code className="text-offwhite/90 font-mono">Demo@1234</code>
                        </span>
                        <span className="text-teal-light group-hover:translate-x-0.5 transition-transform font-medium">
                          {isSelected ? 'Selected ✓' : 'Use profile →'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/5 text-xs text-muted/60 flex items-center justify-between">
              <span>Secure local sandbox</span>
              <span>Local SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  )
}
