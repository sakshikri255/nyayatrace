'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, AlertCircle, Copy, Check, UserPlus, X, ArrowRight } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { DEMO_USERS, setSession, type UserRecord } from '@/lib/auth'

/* ── Password strength rules for Sign Up ── */
const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab)

  // Track if user is already authenticated
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null)

  useEffect(() => {
    // Check if currently authenticated without auto-bouncing so the user can see login/signup
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          return res.json() as Promise<{ user?: UserRecord }>
        }
        return null
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => {
        /* Not logged in, stay on auth page */
      })
  }, [])

  // Sync tab with URL search parameter if it changes
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'signup') {
      setTab('signup')
    } else if (tabParam === 'login') {
      setTab('login')
    }
  }, [searchParams])

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Sign up form state
  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)

  // Shared state
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Password rules validation for signup
  const pwResults = PW_RULES.map((r) => ({ ...r, passed: r.test(signupPassword) }))
  const pwStrong = pwResults.every((r) => r.passed)

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = (await res.json()) as { user?: UserRecord; error?: string }

      if (!res.ok) {
        setError(json.error ?? 'Invalid email or password. Use one of the demo accounts.')
        setLoading(false)
        return
      }

      if (json.user) {
        setSession(json.user)
      }

      const rawNext = searchParams.get('next')
      const next = rawNext && rawNext !== '/' && rawNext !== '/login' ? rawNext : '/overview'
      router.replace(next)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!pwStrong) {
      setError('Password does not meet all security requirements.')
      return
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        }),
      })
      const json = (await res.json()) as { user?: UserRecord; error?: string }

      if (!res.ok) {
        setError(json.error ?? 'Signup failed. Please try again.')
        setLoading(false)
        return
      }

      if (json.user) {
        setSession(json.user)
      }

      router.replace('/overview')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setTab('login')
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
          {/* ══ LEFT PANEL: Auth form (Login & Sign Up) ══ */}
          <div className="auth-form-panel">
            {/* Logo */}
            <div className="mb-6">
              <NyayaTraceLogo size="lg" variant="auth" />
            </div>

            {/* If currently signed in, show subtle banner allowing direct navigation to Overview */}
            {currentUser && (
              <div className="mb-5 flex items-center justify-between rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 truncate pr-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate">
                    Active session: <strong>{currentUser.name}</strong> ({currentUser.role})
                  </span>
                </div>
                <Link
                  href="/overview"
                  className="shrink-0 flex items-center gap-1 font-semibold text-crimson hover:underline"
                >
                  Overview <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* ── Tab Switcher: Log In / Sign Up ── */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/80 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setTab('login')
                  setError('')
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn size={13} className={tab === 'login' ? 'text-crimson' : 'text-slate-400'} />
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup')
                  setError('')
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus size={13} className={tab === 'signup' ? 'text-crimson' : 'text-slate-400'} />
                Sign Up
              </button>
            </div>

            {/* Heading & Subheading */}
            <div className="mb-5">
              <h1 className="auth-heading">
                {tab === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="auth-subheading">
                {tab === 'login'
                  ? 'Sign in to access your NyayaTrace legal workspace'
                  : 'Start managing your legal cases with precision and clarity'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Form Content ── */}
            {tab === 'login' ? (
              /* ── LOG IN FORM ── */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
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

                {/* Submit button */}
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
                  {loading ? 'Signing in…' : 'Sign in to Overview'}
                </button>
              </form>
            ) : (
              /* ── SIGN UP FORM ── */
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">Full name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditi Sharma"
                    className="auth-input"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="auth-input"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">Password</label>
                  <div className="relative">
                    <input
                      type={showSignupPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showSignupPw ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  {signupPassword.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      {pwResults.map((r) => (
                        <li key={r.label} className="flex items-center gap-1.5 text-[11px]">
                          {r.passed ? (
                            <Check size={11} className="text-emerald-500 shrink-0" />
                          ) : (
                            <X size={11} className="text-slate-300 shrink-0" />
                          )}
                          <span className={r.passed ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            {r.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1.5">
                  <label className="auth-label">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showSignupConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`auth-input pr-10 ${
                        signupConfirm.length > 0 && signupConfirm !== signupPassword
                          ? '!border-red-300 focus:!border-red-400 focus:!ring-red-200'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {signupConfirm.length > 0 && signupConfirm !== signupPassword && (
                    <p className="text-xs text-crimson mt-0.5">Passwords do not match.</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-btn-primary mt-1"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  {loading ? 'Creating account…' : 'Create Account & Open Overview'}
                </button>
              </form>
            )}

            {/* Bottom toggle prompt */}
            <p className="mt-6 text-sm text-slate-500">
              {tab === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signup')
                      setError('')
                    }}
                    className="auth-link font-medium hover:underline cursor-pointer"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login')
                      setError('')
                    }}
                    className="auth-link font-medium hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            {/* Legal footer */}
            <div className="mt-auto pt-7 flex items-center gap-2">
              <div className="auth-divider-line" />
              <span className="auth-tagline">Justice. Precision. Clarity.</span>
              <div className="auth-divider-line" />
            </div>
          </div>

          {/* ══ RIGHT PANEL: Demo accounts & Quick Access ══ */}
          <div className="auth-demo-panel">
            <div className="flex items-center justify-between mb-1">
              <span className="auth-demo-badge">Demo Workspace</span>
              <span className="auth-one-click-pill">1-Click Fill</span>
            </div>
            <h2 className="auth-demo-heading">Quick Test Accounts</h2>
            <p className="auth-demo-sub">Click any profile below to autofill credentials and test:</p>

            <div className="flex flex-col gap-3 mt-5">
              {DEMO_USERS.map((u) => {
                const isSelected = tab === 'login' && email === u.email
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
                      <span
                        className={`font-medium transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-crimson' : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Use profile →'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Informational tip */}
            <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-0.5">Instant Access</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Click any profile above to instantly load credentials, then click <strong>Sign in</strong> to open the full overview dashboard.
              </p>
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
