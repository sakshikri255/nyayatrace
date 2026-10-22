/**
 * Shared avatar definitions used by both Settings and Sidebar.
 */

export interface AvatarDef {
  id: string
  label: string
  render: () => React.ReactElement
}

export const AVATARS: AvatarDef[] = [
  {
    id: 'scales',
    label: 'Scales of Justice',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(13,148,136,0.15)" stroke="rgba(13,148,136,0.5)" strokeWidth="1" />
        <line x1="20" y1="8" x2="20" y2="32" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="10" x2="28" y2="10" stroke="#C5A880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="10" x2="9" y2="18" stroke="#C5A880" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="28" y1="10" x2="31" y2="18" stroke="#C5A880" strokeWidth="1.2" strokeLinecap="round"/>
        <ellipse cx="10" cy="19" rx="4" ry="2" fill="rgba(197,168,128,0.3)" stroke="#C5A880" strokeWidth="1"/>
        <ellipse cx="30" cy="19" rx="4" ry="2" fill="rgba(197,168,128,0.3)" stroke="#C5A880" strokeWidth="1"/>
        <rect x="17" y="30" width="6" height="2" rx="1" fill="#C5A880"/>
      </svg>
    ),
  },
  {
    id: 'gavel',
    label: 'Gavel',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(197,168,128,0.12)" stroke="rgba(197,168,128,0.4)" strokeWidth="1" />
        <rect x="10" y="16" width="14" height="8" rx="2" fill="rgba(197,168,128,0.3)" stroke="#C5A880" strokeWidth="1.2" transform="rotate(-45 17 20)"/>
        <rect x="22" y="22" width="10" height="5" rx="2" fill="rgba(13,148,136,0.3)" stroke="#0D9488" strokeWidth="1.2" transform="rotate(-45 27 24.5)"/>
        <line x1="8" y1="32" x2="18" y2="32" stroke="#C5A880" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'book',
    label: 'Law Book',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(20,184,166,0.1)" stroke="rgba(20,184,166,0.4)" strokeWidth="1" />
        <rect x="11" y="10" width="18" height="22" rx="2" fill="rgba(13,148,136,0.2)" stroke="#0D9488" strokeWidth="1.2"/>
        <line x1="11" y1="14" x2="29" y2="14" stroke="#0D9488" strokeWidth="0.8"/>
        <line x1="14" y1="18" x2="26" y2="18" stroke="rgba(197,168,128,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="14" y1="21" x2="26" y2="21" stroke="rgba(197,168,128,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="14" y1="24" x2="22" y2="24" stroke="rgba(197,168,128,0.7)" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'pillars',
    label: 'Court Pillars',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(197,168,128,0.1)" stroke="rgba(197,168,128,0.35)" strokeWidth="1" />
        <rect x="9" y="29" width="22" height="2" rx="0.5" fill="#C5A880"/>
        <rect x="9" y="11" width="22" height="2" rx="0.5" fill="#C5A880"/>
        <rect x="11" y="13" width="3" height="16" rx="1" fill="rgba(197,168,128,0.5)" stroke="#C5A880" strokeWidth="0.8"/>
        <rect x="18.5" y="13" width="3" height="16" rx="1" fill="rgba(197,168,128,0.5)" stroke="#C5A880" strokeWidth="0.8"/>
        <rect x="26" y="13" width="3" height="16" rx="1" fill="rgba(197,168,128,0.5)" stroke="#C5A880" strokeWidth="0.8"/>
      </svg>
    ),
  },
  {
    id: 'torch',
    label: 'Torch of Truth',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(229,195,120,0.1)" stroke="rgba(229,195,120,0.4)" strokeWidth="1" />
        <path d="M20 9 C17 13 15 16 16 19 C17 22 20 22 20 22 C20 22 23 22 24 19 C25 16 23 13 20 9Z" fill="rgba(229,195,120,0.3)" stroke="#E5C378" strokeWidth="1.2"/>
        <path d="M18 9 C16 12 17 15 19 16" stroke="#C5A880" strokeWidth="0.8" strokeLinecap="round"/>
        <rect x="18" y="22" width="4" height="10" rx="1" fill="rgba(197,168,128,0.4)" stroke="#C5A880" strokeWidth="1"/>
        <rect x="16" y="30" width="8" height="2" rx="1" fill="#C5A880"/>
      </svg>
    ),
  },
  {
    id: 'lotus',
    label: 'Lotus (High Court)',
    render: () => (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
        <circle cx="20" cy="20" r="19" fill="rgba(20,184,166,0.08)" stroke="rgba(20,184,166,0.35)" strokeWidth="1" />
        <path d="M20 28 C20 28 12 22 12 16 C12 12 16 10 20 14 C24 10 28 12 28 16 C28 22 20 28 20 28Z" fill="rgba(13,148,136,0.2)" stroke="#0D9488" strokeWidth="1.2"/>
        <path d="M20 28 C20 28 14 20 11 16 C9 13 11 9 15 12" fill="rgba(197,168,128,0.15)" stroke="#C5A880" strokeWidth="0.9"/>
        <path d="M20 28 C20 28 26 20 29 16 C31 13 29 9 25 12" fill="rgba(197,168,128,0.15)" stroke="#C5A880" strokeWidth="0.9"/>
        <circle cx="20" cy="22" r="2" fill="rgba(229,195,120,0.4)" stroke="#E5C378" strokeWidth="0.8"/>
      </svg>
    ),
  },
]

export function getAvatar(id?: string) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]
}
