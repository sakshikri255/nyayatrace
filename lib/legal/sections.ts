export interface LegalSectionMapping {
  ipcSection: string
  bnsSection: string
  offense: string
  category: 'offense' | 'procedure' | 'evidence'
  punishment: string
  bailable: 'Bailable' | 'Non-Bailable'
  cognizable: 'Cognizable' | 'Non-Cognizable'
  triableBy: string
  keyElements: string
}

export const LEGAL_SECTIONS_DB: LegalSectionMapping[] = [
  // ── Violent Offenses ──
  {
    ipcSection: '302',
    bnsSection: '103(1)',
    offense: 'Murder',
    category: 'offense',
    punishment: 'Death or Imprisonment for life, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Intention of causing death, or bodily injury sufficient in ordinary course of nature to cause death.',
  },
  {
    ipcSection: '304',
    bnsSection: '105',
    offense: 'Culpable Homicide not amounting to Murder',
    category: 'offense',
    punishment: 'Imprisonment for life or up to 10 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Done with knowledge or intention to cause bodily injury likely to cause death, without premeditation.',
  },
  {
    ipcSection: '304B',
    bnsSection: '80',
    offense: 'Dowry Death',
    category: 'offense',
    punishment: 'Imprisonment for not less than 7 years up to life',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Death of woman within 7 years of marriage under abnormal circumstances accompanied by cruelty for dowry.',
  },
  {
    ipcSection: '307',
    bnsSection: '109',
    offense: 'Attempt to Murder',
    category: 'offense',
    punishment: 'Imprisonment up to 10 years (or life if hurt caused), and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Act done with intention or knowledge that if death ensued, accused would be guilty of murder.',
  },
  {
    ipcSection: '323',
    bnsSection: '115(2)',
    offense: 'Voluntarily Causing Hurt',
    category: 'offense',
    punishment: 'Imprisonment up to 1 year, or fine up to ₹1,000, or both',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Causing bodily pain, disease, or infirmity willingly.',
  },
  {
    ipcSection: '326',
    bnsSection: '118(1)',
    offense: 'Voluntarily Causing Grievous Hurt by Dangerous Weapons',
    category: 'offense',
    punishment: 'Imprisonment for life or up to 10 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Grievous hurt inflicted using shooting, stabbing, cutting instruments, fire, or corrosive substance.',
  },

  // ── Sexual & Women Offenses ──
  {
    ipcSection: '376',
    bnsSection: '64',
    offense: 'Rape / Sexual Assault',
    category: 'offense',
    punishment: 'Rigorous imprisonment not less than 10 years up to life, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Sexual acts committed without consent, against will, or obtained under false pretenses/fear.',
  },
  {
    ipcSection: '498A',
    bnsSection: '85',
    offense: 'Cruelty by Husband or Relatives of Husband',
    category: 'offense',
    punishment: 'Imprisonment up to 3 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Wilful conduct driving woman to suicide, danger to life, or harassment for unlawful property demand.',
  },
  {
    ipcSection: '354',
    bnsSection: '74',
    offense: 'Assault or Criminal Force to Woman with Intent to Outrage Modesty',
    category: 'offense',
    punishment: 'Imprisonment not less than 1 year up to 5 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Assaulting or using criminal force knowing it is likely to outrage modesty.',
  },

  // ── Property & Financial Crimes ──
  {
    ipcSection: '420',
    bnsSection: '318(4)',
    offense: 'Cheating and Dishonestly Inducing Delivery of Property',
    category: 'offense',
    punishment: 'Imprisonment up to 7 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Deceiving any person and fraudulently inducing delivery of property or alteration of valuable security.',
  },
  {
    ipcSection: '406',
    bnsSection: '316(2)',
    offense: 'Criminal Breach of Trust',
    category: 'offense',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Dishonest misappropriation or conversion to own use of entrusted property.',
  },
  {
    ipcSection: '468',
    bnsSection: '338',
    offense: 'Forgery for Purpose of Cheating',
    category: 'offense',
    punishment: 'Imprisonment up to 7 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Making a false document or electronic record with intent that it shall be used for purpose of cheating.',
  },
  {
    ipcSection: '379',
    bnsSection: '303(2)',
    offense: 'Theft',
    category: 'offense',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Moving movable property out of possession of any person without consent with dishonest intention.',
  },
  {
    ipcSection: '392',
    bnsSection: '309(4)',
    offense: 'Robbery',
    category: 'offense',
    punishment: 'Rigorous imprisonment up to 10 years, and fine (up to 14 yrs on highway at night)',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Theft accompanied by causing or attempting to cause death, hurt, or wrongful restraint.',
  },

  // ── Inchoate & Group Liability ──
  {
    ipcSection: '34',
    bnsSection: '3(5)',
    offense: 'Acts Done by Several Persons in Furtherance of Common Intention',
    category: 'offense',
    punishment: 'Same liability as if done by each alone',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Same as substantive offense',
    keyElements: 'Joint criminal liability when a criminal act is done by several persons in furtherance of common intention.',
  },
  {
    ipcSection: '120B',
    bnsSection: '61(2)',
    offense: 'Criminal Conspiracy',
    category: 'offense',
    punishment: 'Punished in same manner as abetment of that offense',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session or Magistrate',
    keyElements: 'Agreement between two or more persons to commit an illegal act or an act by illegal means.',
  },
  {
    ipcSection: '149',
    bnsSection: '190',
    offense: 'Every Member of Unlawful Assembly Guilty of Offense in Prosecution of Common Object',
    category: 'offense',
    punishment: 'Same as the offense committed',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session or Magistrate',
    keyElements: 'Offense committed by member of unlawful assembly in prosecution of common object.',
  },

  // ── Procedural / CrPC ↔ BNSS ──
  {
    ipcSection: 'CrPC 167(2)',
    bnsSection: 'BNSS 187',
    offense: 'Statutory / Default Bail on Non-Filing of Chargesheet within 60/90 Days',
    category: 'procedure',
    punishment: 'Mandatory release on bail upon furnishing surety',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate',
    keyElements: 'Indefeasible right to bail upon expiry of 60 days (offenses < 10 yrs) or 90 days (offenses >= 10 yrs) if investigation incomplete.',
  },
  {
    ipcSection: 'CrPC 437 / 439',
    bnsSection: 'BNSS 480 / 483',
    offense: 'Regular Bail before Magistrate / Sessions & High Court',
    category: 'procedure',
    punishment: 'Judicial discretion based on triple test (flight risk, witness tampering, evidence destruction)',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Sessions / High Court',
    keyElements: 'Powers to release accused on bail in non-bailable offenses with suitable conditions.',
  },
  {
    ipcSection: 'CrPC 438',
    bnsSection: 'BNSS 482',
    offense: 'Anticipatory Bail (Direction for Grant of Bail to Person Apprehending Arrest)',
    category: 'procedure',
    punishment: 'Protection from custodial arrest on condition of cooperation',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session / High Court',
    keyElements: 'Granted before arrest to prevent humiliation, false implication, or harassment.',
  },
  {
    ipcSection: 'CrPC 161',
    bnsSection: 'BNSS 180',
    offense: 'Examination of Witnesses by Police during Investigation',
    category: 'procedure',
    punishment: 'Statement recorded in writing; not signed by maker',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Investigating Officer',
    keyElements: 'Police officer oral examination of any person acquainted with the facts; contradiction tool under Sec 145 Evidence Act.',
  },
  {
    ipcSection: 'CrPC 164',
    bnsSection: 'BNSS 183',
    offense: 'Recording of Confessions and Statements by Judicial Magistrate',
    category: 'procedure',
    punishment: 'Evidentiary value as judicial confession or statement on oath',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Judicial Magistrate',
    keyElements: 'Recorded after warning accused that they are not bound to confess; audio-video electronic recording under BNSS.',
  },
]

export function detectLegalSections(text: string): LegalSectionMapping[] {
  if (!text) return []
  const matches: LegalSectionMapping[] = []
  const seen = new Set<string>()

  for (const item of LEGAL_SECTIONS_DB) {
    const cleanIpc = item.ipcSection.replace(/^CrPC\s*/, '')
    const cleanBns = item.bnsSection.replace(/^BNSS\s*/, '').replace(/\(.*\)/, '')

    // Regex checks for Section XXX or Sec. XXX or u/s XXX or 302 IPC / BNS
    const regexIpc = new RegExp(`(?:section|sec\\.?|u\\/s|\\b)\\s*${cleanIpc}\\b(?:[\\s,]+(?:ipc|i\\.p\\.c|crpc))?`, 'i')
    const regexBns = new RegExp(`(?:section|sec\\.?|u\\/s|\\b)\\s*${cleanBns}\\b(?:[\\s,]+(?:bns|b\\.n\\.s|bnss))?`, 'i')
    const regexOffense = new RegExp(`\\b${item.offense.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')

    if (regexIpc.test(text) || regexBns.test(text) || (item.offense.length > 5 && regexOffense.test(text))) {
      if (!seen.has(item.ipcSection)) {
        seen.add(item.ipcSection)
        matches.push(item)
      }
    }
  }

  return matches
}

export function searchLegalSections(query: string): LegalSectionMapping[] {
  if (!query || !query.trim()) return LEGAL_SECTIONS_DB.slice(0, 8)
  const q = query.toLowerCase().trim()

  return LEGAL_SECTIONS_DB.filter(
    (item) =>
      item.ipcSection.toLowerCase().includes(q) ||
      item.bnsSection.toLowerCase().includes(q) ||
      item.offense.toLowerCase().includes(q) ||
      item.bailable.toLowerCase().includes(q) ||
      item.keyElements.toLowerCase().includes(q)
  )
}
