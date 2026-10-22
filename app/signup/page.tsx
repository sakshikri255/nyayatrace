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

    if (!pwStrong) {
      setError('Password does not meet all requirements.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

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
      router.replace('/cases')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
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
            Create your account
          </h1>
          <p className="text-sm text-muted text-center mb-8">
            Join NyayaTrace — your legal case workspace
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Full name
              </label>
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aditi Sharma"
                className="w-full rounded-lg border border-border-dark bg-navy px-4 py-2.5 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
              />
            </div>

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
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
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

              {/* Strength checklist — shown once the user starts typing */}
              {password.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {pwResults.map((r) => (
                    <li key={r.label} className="flex items-center gap-1.5 text-xs">
                      {r.passed ? (
                        <Check size={12} className="text-teal-light shrink-0" />
                      ) : (
                        <X size={12} className="text-red-400 shrink-0" />
                      )}
                      <span className={r.passed ? 'text-teal-light' : 'text-muted'}>
                        {r.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border bg-navy px-4 py-2.5 pr-11 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:ring-1 transition-colors ${
                    confirm.length > 0 && confirm !== password
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-border-dark focus:border-teal focus:ring-teal/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-offwhite transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-red-400 mt-0.5">Passwords do not match.</p>
              )}
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
                <UserPlus size={16} />
              )}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-light hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
