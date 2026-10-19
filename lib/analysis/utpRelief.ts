/**
 * UTP Relief Calculator — Section 479 BNSS / Section 436A CrPC
 *
 * BNSS Sec 479: First-time offender released on personal bond after
 *   serving ONE-THIRD of the maximum imprisonment period.
 * CrPC Sec 436A: Any undertrial who has served ONE-HALF of maximum
 *   imprisonment must be released on personal bond.
 */

export type UTPStatus = 'eligible' | 'approaching' | 'not_yet' | 'not_configured'

export interface UTPReliefResult {
  isEligible: boolean
  thresholdDays: number | null
  daysServed: number | null
  daysRemaining: number | null
  progressPercent: number
  status: UTPStatus
  statusLabel: string
  section: string
  legalGround: string
  summary: string
}

export interface UTPReliefInput {
  remandDate?: string | null
  maxPunishmentYears?: number | null
  applicableLaw?: 'crpc' | 'bnss' | 'auto' | null
  chargesheetFiled?: number | null
}

function resolveApplicableLaw(applicableLaw: string | null | undefined, remandDate: string | null | undefined): 'bnss' | 'crpc' {
  if (applicableLaw === 'bnss') return 'bnss'
  if (applicableLaw === 'crpc') return 'crpc'
  // Auto: BNSS if remand date >= 1 Jul 2024
  if (remandDate) {
    const d = new Date(remandDate)
    const bnssStart = new Date('2024-07-01')
    return d >= bnssStart ? 'bnss' : 'crpc'
  }
  return 'bnss' // Default to newer law if unknown
}

export function calculateUTPRelief(input: UTPReliefInput): UTPReliefResult {
  const notConfigured: UTPReliefResult = {
    isEligible: false,
    thresholdDays: null,
    daysServed: null,
    daysRemaining: null,
    progressPercent: 0,
    status: 'not_configured',
    statusLabel: 'Not Configured',
    section: '—',
    legalGround: 'Set the remand date and maximum punishment years to compute UTP relief eligibility.',
    summary: 'UTP relief data incomplete.',
  }

  if (!input.remandDate || !input.maxPunishmentYears || input.maxPunishmentYears <= 0) {
    return notConfigured
  }

  const law = resolveApplicableLaw(input.applicableLaw, input.remandDate)

  const section = law === 'bnss' ? 'Sec 479 BNSS' : 'Sec 436A CrPC'
  const fraction = law === 'bnss' ? 1 / 3 : 1 / 2
  const fractionLabel = law === 'bnss' ? 'one-third' : 'one-half'

  const maxImprisonmentDays = input.maxPunishmentYears * 365
  const thresholdDays = Math.floor(maxImprisonmentDays * fraction)

  const remand = new Date(input.remandDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysServed = Math.max(0, Math.floor((today.getTime() - remand.getTime()) / (1000 * 60 * 60 * 24)))

  const daysRemaining = Math.max(0, thresholdDays - daysServed)
  const progressPercent = Math.min(100, Math.round((daysServed / thresholdDays) * 100))
  const isEligible = daysServed >= thresholdDays

  const legalGround = law === 'bnss'
    ? `Under Section 479 BNSS, a first-time offender undertrial is entitled to release on personal bond after serving ${fractionLabel} of the maximum period of imprisonment specified for the offense(s) charged.`
    : `Under Section 436A CrPC, any undertrial who has undergone detention for a period extending up to ${fractionLabel} of the maximum period of imprisonment specified for the offense charged shall be released on personal bond.`

  let status: UTPStatus
  let statusLabel: string
  let summary: string

  if (isEligible) {
    status = 'eligible'
    statusLabel = 'Relief Eligible'
    summary = `${daysServed} days served ≥ ${thresholdDays}-day threshold (${fractionLabel} of max ${input.maxPunishmentYears}yr). Entitled to release under ${section}.`
  } else if (daysRemaining <= 30) {
    status = 'approaching'
    statusLabel = `${daysRemaining}d to Eligibility`
    summary = `Threshold approaching: ${daysRemaining} days until ${section} relief becomes applicable.`
  } else {
    status = 'not_yet'
    statusLabel = `${daysRemaining}d Remaining`
    summary = `${daysServed} of ${thresholdDays} days served. ${daysRemaining} days until eligibility under ${section}.`
  }

  return {
    isEligible,
    thresholdDays,
    daysServed,
    daysRemaining,
    progressPercent,
    status,
    statusLabel,
    section,
    legalGround,
    summary,
  }
}
