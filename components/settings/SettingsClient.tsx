'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Briefcase,
  MapPin,
  Clock,
  Save,
  Edit3,
  X,
  ExternalLink,
  StickyNote,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setSession } from '@/lib/auth'
import { useSession } from '@/hooks/useSession'
import { AVATARS } from '@/lib/avatars'
import Link from 'next/link'

// ── Profile storage ───────────────────────────────────────────────────────────
interface ProfileData {
  name: string
  email: string
  role: string
  avatarId: string
  city: string
  state: string
  dob: string
  yearsExperience: string
  barCouncilId: string
  specialisation: string
}

const PROFILE_KEY = 'nyayasetu_profile'

function loadProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveProfile(p: ProfileData) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)) } catch {/* */}
}

// ── Court Diary / Notes ───────────────────────────────────────────────────────
interface DiaryNote {
  id: string
  date: string          // YYYY-MM-DD
  text: string
  caseNumber?: string
  done: boolean
}

const DIARY_KEY = 'nyayasetu_diary_notes'

function loadNotes(): DiaryNote[] {
  try {
    const raw = localStorage.getItem(DIARY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotes(notes: DiaryNote[]) {
  try { localStorage.setItem(DIARY_KEY, JSON.stringify(notes)) } catch {/* */}
}

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, accent = false }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border overflow-hidden',
        accent
          ? 'border-gold/30 bg-gradient-to-br from-midnight-850 via-midnight-900 to-midnight-850'
          : 'border-white/10 bg-midnight-850'
      )}
    >
      <div className={cn(
        'flex items-center gap-3 px-6 py-4 border-b',
        accent ? 'border-gold/20' : 'border-white/8'
      )}>
        <div className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border',
          accent ? 'border-gold/40 bg-gold/10 text-gold' : 'border-white/10 bg-midnight-800 text-teal-light'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

// ── Label + Input helper ──────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ value, onChange, placeholder, type = 'text', readOnly = false }: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  readOnly?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-lg border border-white/10 bg-midnight-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all',
        readOnly ? 'opacity-60 cursor-default' : 'focus:border-teal/50 focus:ring-1 focus:ring-teal/20'
      )}
    />
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function SettingsClient() {
  const shouldReduceMotion = useReducedMotion()

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    role: '',
    avatarId: 'scales',
    city: '',
    state: '',
    dob: '',
    yearsExperience: '',
    barCouncilId: '',
    specialisation: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  const session = useSession()

  useEffect(() => {
    const stored = loadProfile()
    setProfile({
      name: stored?.name || session?.name || '',
      email: stored?.email || session?.email || '',
      role: stored?.role || session?.role || '',
      avatarId: stored?.avatarId || 'scales',
      city: stored?.city || '',
      state: stored?.state || '',
      dob: stored?.dob || '',
      yearsExperience: stored?.yearsExperience || '',
      barCouncilId: stored?.barCouncilId || '',
      specialisation: stored?.specialisation || '',
    })
  }, [session])

  function handleSaveProfile() {
    saveProfile(profile)
    if (session) {
      setSession({
        ...session,
        name: profile.name,
        role: profile.role,
        avatarId: profile.avatarId,
      })
    }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2200)
  }

  // ── Calendar / Diary state ─────────────────────────────────────────────────
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(toISO(today))
  const [notes, setNotes] = useState<DiaryNote[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteCaseNum, setNewNoteCaseNum] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editCaseNum, setEditCaseNum] = useState('')
  const noteInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNotes(loadNotes()) }, [])

  const notesForDate = notes.filter((n) => n.date === selectedDate)

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
  }
  function jumpToToday() {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDate(toISO(today))
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }
  function getFirstDayOfWeek(year: number, month: number) {
    // 0=Sun, adjust so Mon=0
    const d = new Date(year, month, 1).getDay()
    return (d + 6) % 7
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDayOffset = getFirstDayOfWeek(calYear, calMonth)
  const todayISO = toISO(today)

  const noteDatesSet = new Set(notes.map((n) => n.date))

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  function addNote() {
    if (!newNoteText.trim()) return
    const note: DiaryNote = {
      id: Date.now().toString(),
      date: selectedDate,
      text: newNoteText.trim(),
      caseNumber: newNoteCaseNum.trim() || undefined,
      done: false,
    }
    const updated = [...notes, note]
    setNotes(updated)
    saveNotes(updated)
    setNewNoteText('')
    setNewNoteCaseNum('')
  }

  function toggleDone(id: string) {
    const updated = notes.map((n) => n.id === id ? { ...n, done: !n.done } : n)
    setNotes(updated)
    saveNotes(updated)
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id)
    setNotes(updated)
    saveNotes(updated)
  }

  function startEdit(note: DiaryNote) {
    setEditingId(note.id)
    setEditText(note.text)
    setEditCaseNum(note.caseNumber || '')
  }

  function saveEdit(id: string) {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, text: editText, caseNumber: editCaseNum.trim() || undefined } : n
    )
    setNotes(updated)
    saveNotes(updated)
    setEditingId(null)
  }

  const calKey = `${calYear}-${calMonth}`

  const currentAvatar = AVATARS.find((a) => a.id === profile.avatarId) || AVATARS[0]

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">Chamber</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Settings &amp; Profile</h1>
          <p className="text-sm text-slate-400 mt-0.5 font-light">
            Manage your profile and court diary notes
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local Storage</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — PROFILE IDENTITY
          ═══════════════════════════════════════════════════════════════ */}
      <Section title="Profile Identity" icon={User} accent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Avatar Column */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              key={profile.avatarId}
              initial={shouldReduceMotion ? {} : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'backOut' }}
              className="w-24 h-24 rounded-2xl border-2 border-gold/40 bg-midnight-900 shadow-xl shadow-black/40 overflow-hidden"
            >
              {currentAvatar.render()}
            </motion.div>
            <p className="text-xs text-gold-champagne font-medium">{currentAvatar.label}</p>
            <div className="grid grid-cols-3 gap-2 w-full">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, avatarId: av.id }))}
                  className={cn(
                    'relative w-full aspect-square rounded-xl border-2 transition-all overflow-hidden',
                    profile.avatarId === av.id
                      ? 'border-gold shadow-lg shadow-gold/20 scale-105'
                      : 'border-white/10 hover:border-gold/40 hover:scale-105'
                  )}
                  title={av.label}
                >
                  {av.render()}
                  {profile.avatarId === av.id && (
                    <div className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-gold flex items-center justify-center">
                      <Check className="h-2 w-2 text-midnight-950" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fields Column */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <StyledInput
                value={profile.name}
                onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
                placeholder="Aditi Sharma"
              />
            </Field>
            <Field label="Email">
              <StyledInput
                value={profile.email}
                readOnly
                placeholder="aditi@nyayasetu.in"
              />
            </Field>
            <Field label="Designation / Role">
              <StyledInput
                value={profile.role}
                onChange={(v) => setProfile((p) => ({ ...p, role: v }))}
                placeholder="Senior Advocate"
              />
            </Field>
            <Field label="Specialisation">
              <StyledInput
                value={profile.specialisation}
                onChange={(v) => setProfile((p) => ({ ...p, specialisation: v }))}
                placeholder="Criminal Law, Bail Matters…"
              />
            </Field>
            <Field label="City">
              <StyledInput
                value={profile.city}
                onChange={(v) => setProfile((p) => ({ ...p, city: v }))}
                placeholder="Mumbai"
              />
            </Field>
            <Field label="State">
              <StyledInput
                value={profile.state}
                onChange={(v) => setProfile((p) => ({ ...p, state: v }))}
                placeholder="Maharashtra"
              />
            </Field>
            <Field label="Date of Birth">
              <StyledInput
                type="date"
                value={profile.dob}
                onChange={(v) => setProfile((p) => ({ ...p, dob: v }))}
              />
            </Field>
            <Field label="Years of Experience">
              <StyledInput
                type="number"
                value={profile.yearsExperience}
                onChange={(v) => setProfile((p) => ({ ...p, yearsExperience: v }))}
                placeholder="e.g. 8"
              />
            </Field>
            <Field label="Bar Council Enrolment No.">
              <StyledInput
                value={profile.barCouncilId}
                onChange={(v) => setProfile((p) => ({ ...p, barCouncilId: v }))}
                placeholder="MH/1234/2016"
              />
            </Field>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/8">
          <AnimatePresence>
            {profileSaved && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"
              >
                <Check className="h-3.5 w-3.5" /> Profile saved
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSaveProfile}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-muted via-gold to-gold-light px-5 py-2.5 text-xs font-semibold text-midnight-950 shadow-md hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Save className="h-3.5 w-3.5" />
            Save Profile
          </button>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — COURT DIARY
          ═══════════════════════════════════════════════════════════════ */}
      <Section title="Court Diary &amp; Task Notes" icon={StickyNote}>
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">

          {/* ── Calendar ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-0">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={calKey}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-semibold text-slate-100"
                  >
                    {MONTH_NAMES[calMonth]} {calYear}
                  </motion.div>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="text-[10px] text-teal-light hover:text-teal transition-colors mt-0.5"
                >
                  Today
                </button>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 py-1 w-10">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={calKey}
                initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-7 gap-0.5"
              >
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-10 h-10" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const iso = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const isToday = iso === todayISO
                  const isSelected = iso === selectedDate
                  const hasNote = noteDatesSet.has(iso)

                  return (
                    <motion.button
                      key={iso}
                      type="button"
                      whileHover={shouldReduceMotion ? {} : { scale: 1.12 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        'relative w-10 h-10 rounded-xl text-xs font-medium transition-colors flex items-center justify-center',
                        isSelected
                          ? 'bg-teal text-white shadow-md shadow-teal/30'
                          : isToday
                          ? 'border border-gold/60 text-gold-light bg-gold/10'
                          : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
                      )}
                    >
                      {day}
                      {hasNote && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-teal-light" />
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Selected date stat */}
            <div className="mt-4 pt-3 border-t border-white/8 flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-teal shrink-0" />
              <span>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* ── Notes Panel ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Add note */}
            <div className="rounded-xl border border-white/10 bg-midnight-900/60 p-4 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Note
              </p>
              <div className="flex flex-col gap-2">
                <input
                  ref={noteInputRef}
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Note or task for this date…"
                  className="w-full rounded-lg border border-white/10 bg-midnight-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-all"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteCaseNum}
                    onChange={(e) => setNewNoteCaseNum(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder="Case no. (optional, e.g. 102/2024)"
                    className="flex-1 rounded-lg border border-white/10 bg-midnight-800 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={!newNoteText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Notes list */}
            <div className="flex-1 space-y-2 min-h-[160px]">
              <AnimatePresence>
                {notesForDate.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500"
                  >
                    <StickyNote className="h-7 w-7 opacity-30" />
                    <p className="text-xs">No notes for this date. Add one above.</p>
                  </motion.div>
                ) : (
                  notesForDate.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'group rounded-xl border p-3.5 transition-all',
                        note.done
                          ? 'border-white/5 bg-midnight-900/40 opacity-60'
                          : 'border-white/10 bg-midnight-900/80 hover:border-teal/30'
                      )}
                    >
                      {editingId === note.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(note.id)}
                            className="w-full rounded-lg border border-teal/40 bg-midnight-800 px-3 py-1.5 text-sm text-slate-100 outline-none"
                          />
                          <div className="flex gap-2">
                            <input
                              value={editCaseNum}
                              onChange={(e) => setEditCaseNum(e.target.value)}
                              placeholder="Case number (optional)"
                              className="flex-1 rounded-lg border border-white/10 bg-midnight-800 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal/40"
                            />
                            <button
                              type="button"
                              onClick={() => saveEdit(note.id)}
                              className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-light"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          {/* Done checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleDone(note.id)}
                            className={cn(
                              'mt-0.5 shrink-0 h-4 w-4 rounded border transition-all flex items-center justify-center',
                              note.done
                                ? 'border-teal bg-teal'
                                : 'border-white/20 hover:border-teal/60'
                            )}
                          >
                            {note.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm text-slate-100 leading-snug break-words',
                              note.done && 'line-through text-slate-400'
                            )}>
                              {note.text}
                            </p>
                            {note.caseNumber && (
                              <Link
                                href={`/cases`}
                                className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-teal-light hover:text-teal transition-colors group/link"
                                title={`Open case ${note.caseNumber}`}
                              >
                                <Scale className="h-3 w-3" />
                                <span>Case {note.caseNumber}</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </Link>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(note)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-100 hover:bg-white/5"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNote(note.id)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Stats */}
            {notesForDate.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                <span>{notesForDate.filter((n) => n.done).length}/{notesForDate.length} tasks done</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 rounded-full bg-midnight-700 overflow-hidden"
                    style={{ width: 60 }}
                  >
                    <motion.div
                      animate={{ width: `${notesForDate.length ? (notesForDate.filter((n) => n.done).length / notesForDate.length) * 100 : 0}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-teal rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — ACCOUNT INFO STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Role', value: profile.role || '—', icon: Briefcase },
          { label: 'Experience', value: profile.yearsExperience ? `${profile.yearsExperience} yrs` : '—', icon: Clock },
          { label: 'Location', value: [profile.city, profile.state].filter(Boolean).join(', ') || '—', icon: MapPin },
          { label: 'Specialisation', value: profile.specialisation || '—', icon: Scale },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-white/8 bg-midnight-850 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-teal-light" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{item.label}</span>
              </div>
              <p className="text-sm font-medium text-slate-200 truncate">{item.value}</p>
            </div>
          )
        })}
      </motion.div>

    </div>
  )
}
