'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, User, Quote, AlertCircle, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ChatMessage, ChatCitation } from '@/app/api/cases/[id]/chat/route'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: ChatCitation[]
  error?: boolean
}

interface Props {
  caseId: number
  caseTitle: string
  open: boolean
  onClose: () => void
}

export function CaseChatDrawer({ caseId, caseTitle, open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ESC to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // Build history for API
    const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      if (res.status === 503) {
        setAiUnavailable(true)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'AI is not configured for this instance. Please set GEMINI_API_KEY or OPENAI_API_KEY.',
            error: true,
          },
        ])
        return
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json() as { reply: string; citations: ChatCitation[] }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, citations: data.citations },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, caseId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] flex flex-col bg-white border-l border-slate-200 shadow-2xl"
            role="dialog"
            aria-label="Ask AI about this case"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-teal" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ask AI</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{caseTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI chat"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* AI unavailable warning */}
            {aiUnavailable && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
                <WifiOff size={13} />
                AI not configured — answers will not be available.
              </div>
            )}

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <Bot size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Ask anything about this case</p>
                  <p className="text-xs text-slate-400 max-w-[240px]">
                    AI answers are grounded in the case documents only. Every claim will be cited.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                      {msg.error ? (
                        <AlertCircle size={14} className="text-red-400" />
                      ) : (
                        <Bot size={14} className="text-teal" />
                      )}
                    </div>
                  )}
                  <div className={cn('max-w-[80%]')}>
                    <div
                      className={cn(
                        'rounded-xl px-3 py-2 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-teal text-white rounded-tr-sm'
                          : msg.error
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      )}
                    >
                      {msg.content}
                    </div>
                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.citations.map((cit, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2"
                          >
                            <Quote size={11} className="text-teal shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-slate-600">
                                {cit.documentName} · p.{cit.pageNumber}
                              </p>
                              <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-2">
                                &ldquo;{cit.quote}&rdquo;
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
                      <User size={13} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-teal" />
                  </div>
                  <div className="bg-slate-100 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-slate-200 px-3 py-3 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this case… (Enter to send, Shift+Enter for newline)"
                  disabled={loading}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal text-white transition-colors hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 text-center">
                Answers grounded in case documents only · Not legal advice
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
