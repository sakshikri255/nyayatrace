import { differenceInDays, addDays, parseISO, format, isValid } from 'date-fns'

export interface StatutoryBailCalculation {
  isCalculable: boolean
  remandDate: string | null
  statutoryPeriodDays: number
  deadlineDate: string | null
  daysInCustody: number
  daysRemaining: number
  progressPercent: number
  status: 'not_configured' | 'accrued' | 'urgent' | 'counting' | 'filed_on_time' | 'filed_delayed'
  statusLabel: string
  chargesheetFiled: boolean
  chargesheetDate: string | null
  statutorySection: string
  effectiveLaw: 'crpc' | 'bnss'
  legalGround: string
  summary: string
}

/** BNSS effective date — 1 July 2024 */
const BNSS_CUTOFF = '2024-07-01'

function resolveEffectiveLaw(
  applicableLaw: 'crpc' | 'bnss' | 'auto' | null | undefined,
  remandDate: string | null | undefined,
): 'crpc' | 'bnss' {
  if (applicableLaw === 'crpc') return 'crpc'
  if (applicableLaw === 'bnss') return 'bnss'
  // auto — infer from remand date
  if (remandDate) {
    return remandDate >= BNSS_CUTOFF ? 'bnss' : 'crpc'
  }
  // fallback to showing both if no date context
  return 'bnss'
}

function sectionLabel(law: 'crpc' | 'bnss'): string {
  return law === 'bnss' ? 'Sec 187 BNSS' : 'Sec 167(2) CrPC'
}

export function calculateStatutoryBail(caseData: {
  remandDate?: string | null
  statutoryPeriodDays?: number | null
  chargesheetFiled?: number | null
  chargesheetDate?: string | null
  applicableLaw?: 'crpc' | 'bnss' | 'auto' | null
}): StatutoryBailCalculation {
  const statutoryPeriod = caseData.statutoryPeriodDays === 90 ? 90 : 60
  const chargesheetFiled = Boolean(caseData.chargesheetFiled)
  const chargesheetDate = caseData.chargesheetDate ?? null
  const effectiveLaw = resolveEffectiveLaw(caseData.applicableLaw, caseData.remandDate)
  const section = sectionLabel(effectiveLaw)

  if (!caseData.remandDate) {
    return {
      isCalculable: false,
      remandDate: null,
      statutoryPeriodDays: statutoryPeriod,
      deadlineDate: null,
      daysInCustody: 0,
      daysRemaining: statutoryPeriod,
      progressPercent: 0,
      status: 'not_configured',
      statusLabel: 'Remand Date Not Set',
      chargesheetFiled,
      chargesheetDate,
      statutorySection: section,
      effectiveLaw,
      legalGround: 'Set date of first remand to compute statutory default bail window.',
      summary: 'Remand date not recorded for this case.',
    }
  }

  const remand = parseISO(caseData.remandDate)
  if (!isValid(remand)) {
    return {
      isCalculable: false,
      remandDate: caseData.remandDate,
      statutoryPeriodDays: statutoryPeriod,
      deadlineDate: null,
      daysInCustody: 0,
      daysRemaining: statutoryPeriod,
      progressPercent: 0,
      status: 'not_configured',
      statusLabel: 'Invalid Remand Date',
      chargesheetFiled,
      chargesheetDate,
      statutorySection: section,
      effectiveLaw,
      legalGround: 'Invalid date format provided for remand.',
      summary: 'Unable to calculate statutory period due to invalid date format.',
    }
  }

  const deadline = addDays(remand, statutoryPeriod)
  const deadlineStr = format(deadline, 'yyyy-MM-dd')
  const today = new Date()

  if (chargesheetFiled && chargesheetDate) {
    const csDate = parseISO(chargesheetDate)
    const daysTaken = isValid(csDate) ? differenceInDays(csDate, remand) : differenceInDays(today, remand)
    const delayed = isValid(csDate) && differenceInDays(csDate, deadline) > 0

    if (delayed) {
      const delayDays = differenceInDays(csDate, deadline)
      return {
        isCalculable: true,
        remandDate: caseData.remandDate,
        statutoryPeriodDays: statutoryPeriod,
        deadlineDate: deadlineStr,
        daysInCustody: daysTaken,
        daysRemaining: 0,
        progressPercent: 100,
        status: 'filed_delayed',
        statusLabel: `Chargesheet Delayed by ${delayDays}d`,
        chargesheetFiled: true,
        chargesheetDate,
        statutorySection: section,
        effectiveLaw,
        legalGround: `The investigation agency exceeded the statutory ${statutoryPeriod}-day limit by ${delayDays} days before filing the chargesheet. Accused held an accrued right to default bail under ${section}.`,
        summary: `Chargesheet was filed after ${daysTaken} days (${delayDays} days beyond statutory deadline).`,
      }
    }

    return {
      isCalculable: true,
      remandDate: caseData.remandDate,
      statutoryPeriodDays: statutoryPeriod,
      deadlineDate: deadlineStr,
      daysInCustody: daysTaken,
      daysRemaining: 0,
      progressPercent: Math.min(100, Math.round((daysTaken / statutoryPeriod) * 100)),
      status: 'filed_on_time',
      statusLabel: 'Chargesheet Filed Within Period',
      chargesheetFiled: true,
      chargesheetDate,
      statutorySection: section,
      effectiveLaw,
      legalGround: `Chargesheet was submitted on ${chargesheetDate} within the prescribed ${statutoryPeriod}-day period under ${section}. Regular bail grounds apply.`,
      summary: `Investigation completed and chargesheet filed on time (${daysTaken} days from remand).`,
    }
  }

  // Chargesheet NOT filed yet
  const daysElapsed = differenceInDays(today, remand)
  const daysRemaining = differenceInDays(deadline, today)
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / statutoryPeriod) * 100)))

  if (daysRemaining <= 0) {
    const overdueDays = Math.abs(daysRemaining)
    return {
      isCalculable: true,
      remandDate: caseData.remandDate,
      statutoryPeriodDays: statutoryPeriod,
      deadlineDate: deadlineStr,
      daysInCustody: daysElapsed,
      daysRemaining: 0,
      progressPercent: 100,
      status: 'accrued',
      statusLabel: 'Default Bail Accrued!',
      chargesheetFiled: false,
      chargesheetDate: null,
      statutorySection: section,
      effectiveLaw,
      legalGround: `Indefeasible statutory right to Default Bail has accrued under ${section}. Overdue by ${overdueDays} days without a chargesheet.`,
      summary: `Investigation period expired (${daysElapsed}/${statutoryPeriod} days). Immediate application for default bail recommended.`,
    }
  }

  if (daysRemaining <= 10) {
    return {
      isCalculable: true,
      remandDate: caseData.remandDate,
      statutoryPeriodDays: statutoryPeriod,
      deadlineDate: deadlineStr,
      daysInCustody: daysElapsed,
      daysRemaining,
      progressPercent,
      status: 'urgent',
      statusLabel: `${daysRemaining} Days to Statutory Bail`,
      chargesheetFiled: false,
      chargesheetDate: null,
      statutorySection: section,
      effectiveLaw,
      legalGround: `Approaching mandatory ${statutoryPeriod}-day threshold under ${section}. If chargesheet is not filed within ${daysRemaining} days, default bail right accrues immediately.`,
      summary: `Custody at ${daysElapsed}/${statutoryPeriod} days. Default bail window opening in ${daysRemaining} days.`,
    }
  }

  return {
    isCalculable: true,
    remandDate: caseData.remandDate,
    statutoryPeriodDays: statutoryPeriod,
    deadlineDate: deadlineStr,
    daysInCustody: daysElapsed,
    daysRemaining,
    progressPercent,
    status: 'counting',
    statusLabel: `${daysRemaining} Days Remaining`,
    chargesheetFiled: false,
    chargesheetDate: null,
    statutorySection: section,
    effectiveLaw,
    legalGround: `Statutory clock running under ${section} (${daysElapsed} days in custody).`,
    summary: `${daysElapsed} of ${statutoryPeriod} days elapsed. Deadline on ${deadlineStr}.`,
  }
}
