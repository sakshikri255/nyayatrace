'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, UserPlus, AlertCircle, Check, X } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'

/* ── Password strength rules ─────────────────────────────────── */
const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function SignUpPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pwResults = PW_RULES.map((r) => ({ ...r, passed: r.test(password) }))
  const pwStrong = pwResults.every((r) => r.passed)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!pwStrong) { setError('Password does not meet all requirements.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Signup failed. Please try again.')
        setLoading(false)
        return
      }
      router.replace('/overview')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
       {/* ── Warm off-white background ── */}
      <div className="auth-bg" aria-hidden="true" />

      {/* ── Lady Justice — fixed to the RIGHT side of the screen ── */}
      <div className="auth-statue" aria-hidden="true">
        <Image
          src="/images/lady-justice-statue.jpg"
          alt=""
          fill
          priority
          sizes="70vw"
          className="object-cover object-top"
        />
        {/* Fade from the warm bg colour on the left edge of the statue */}
        <div className="auth-statue-fade" />
      </div>

      {/* ── Content ── */}
      <div className="auth-content-wrap">
        {/* Signup card — single column, centred */}
        <div className="auth-card-single">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <NyayaTraceLogo size="lg" variant="auth" />
          </div>

          <h1 className="auth-heading text-center">Create your account</h1>
          <p className="auth-subheading text-center mb-8">
            Join NyayaTrace — your legal case workspace
          </p>

          {/* Error */}
          {error && (
            <div className="auth-error mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="auth-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength checklist */}
              {password.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  {pwResults.map((r) => (
                    <li key={r.label} className="flex items-center gap-2 text-xs">
                      {r.passed ? (
                        <Check size={11} className="text-emerald-500 shrink-0" />
                      ) : (
                        <X size={11} className="text-slate-300 shrink-0" />
                      )}
                      <span className={r.passed ? 'text-emerald-600' : 'text-slate-400'}>
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
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`auth-input pr-11 ${
                    confirm.length > 0 && confirm !== password
                      ? '!border-red-300 focus:!border-red-400 focus:!ring-red-200'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-[#7A6240] mt-0.5">Passwords do not match.</p>
              )}
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
                <UserPlus size={15} />
              )}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Sign in */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="auth-link font-medium">
              Sign in
            </Link>
          </p>

          {/* Tagline */}
          <div className="mt-7 flex items-center gap-2">
            <div className="auth-divider-line" />
            <span className="auth-tagline">Justice. Precision. Clarity.</span>
            <div className="auth-divider-line" />
          </div>
        </div>
      </div>
    </div>
  )
}
