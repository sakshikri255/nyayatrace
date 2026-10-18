'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { DEMO_USERS } from '@/lib/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Check if the email exists in our demo set
    const exists = DEMO_USERS.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (!exists) {
        setError('No account found with that email address.')
        return
      }
      setSubmitted(true)
    }, 700)
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-12">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, #0d3d38 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border-dark bg-charcoal shadow-2xl shadow-black/40 px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <NyayaTraceLogo size="lg" variant="light" />
          </div>

          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-teal/10">
                <CheckCircle2 size={28} className="text-teal-light" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-offwhite mb-2">
                  Check your inbox
                </h1>
                <p className="text-sm text-muted leading-relaxed">
                  If an account exists for{' '}
                  <span className="text-offwhite font-medium">{email}</span>, you&apos;ll
                  receive a password reset link shortly.
                </p>
              </div>
              <p className="text-xs text-muted/70 italic">
                (This is a demo — no email is actually sent.)
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-2 text-sm text-teal-light hover:underline"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1 className="text-xl font-bold text-offwhite text-center mb-1">
                Reset your password
              </h1>
              <p className="text-sm text-muted text-center mb-8 leading-relaxed">
                Enter the email linked to your account and we&apos;ll send a reset
                link.
              </p>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6 text-sm text-red-400">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border-dark bg-navy pl-10 pr-4 py-2.5 text-sm text-offwhite placeholder:text-muted/50 outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-light disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-teal-light transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
