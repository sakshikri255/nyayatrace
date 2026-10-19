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
  compoundable: boolean
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
    compoundable: false,
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
    compoundable: false,
  },
  {
    ipcSection: '304A',
    bnsSection: '106',
    offense: 'Causing Death by Negligence',
    category: 'offense',
    punishment: 'Imprisonment up to 2 years, or fine, or both',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Causing death by rash or negligent act not amounting to culpable homicide.',
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: true,
  },
  {
    ipcSection: '324',
    bnsSection: '117(2)',
    offense: 'Voluntarily Causing Hurt by Dangerous Weapons',
    category: 'offense',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Hurt caused with instrument of shooting, stabbing, cutting, or by fire, heated substance, poison or corrosive.',
    compoundable: true,
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
    compoundable: false,
  },
  {
    ipcSection: '341',
    bnsSection: '126(2)',
    offense: 'Wrongful Restraint',
    category: 'offense',
    punishment: 'Simple imprisonment up to 1 month, or fine up to ₹500, or both',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Voluntarily obstructing any person so as to prevent them from proceeding in any direction.',
    compoundable: true,
  },
  {
    ipcSection: '342',
    bnsSection: '127(2)',
    offense: 'Wrongful Confinement',
    category: 'offense',
    punishment: 'Imprisonment up to 1 year, or fine up to ₹1,000, or both',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Wrongfully confining any person, restraining them from all sides.',
    compoundable: true,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: true,
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
    compoundable: false,
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
    compoundable: true,
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
    compoundable: false,
  },
  {
    ipcSection: '384',
    bnsSection: '308(2)',
    offense: 'Extortion',
    category: 'offense',
    punishment: 'Imprisonment up to 3 years, or fine, or both',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Magistrate 1st Class',
    keyElements: 'Putting any person in fear of injury to dishonestly induce delivery of property or valuable security.',
    compoundable: false,
  },
  {
    ipcSection: '506',
    bnsSection: '351(2)',
    offense: 'Criminal Intimidation',
    category: 'offense',
    punishment: 'Imprisonment up to 2 years, or fine, or both (up to 7 years if threat of death/grievous hurt)',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Threatening injury to person, reputation, or property to cause alarm or compel an act.',
    compoundable: true,
  },
  {
    ipcSection: '447',
    bnsSection: '329(4)',
    offense: 'Criminal Trespass',
    category: 'offense',
    punishment: 'Imprisonment up to 3 months, or fine up to ₹500, or both',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Entering into or upon property in possession of another with intent to commit offense or intimidate.',
    compoundable: true,
  },
  {
    ipcSection: '448',
    bnsSection: '329(3)',
    offense: 'House Trespass',
    category: 'offense',
    punishment: 'Imprisonment up to 1 year, or fine up to ₹1,000, or both',
    bailable: 'Bailable',
    cognizable: 'Non-Cognizable',
    triableBy: 'Any Magistrate',
    keyElements: 'Criminal trespass committed by entering into or remaining in any building, tent, or vessel used as a dwelling.',
    compoundable: true,
  },
  {
    ipcSection: '436',
    bnsSection: '324(1)',
    offense: 'Mischief by Fire',
    category: 'offense',
    punishment: 'Imprisonment for life or up to 10 years, and fine',
    bailable: 'Non-Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Court of Session',
    keyElements: 'Committing mischief by fire or explosive substance so as to destroy a building used as human dwelling.',
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
  },
  {
    ipcSection: 'CrPC 436A',
    bnsSection: 'BNSS 479',
    offense: 'Undertrial Prisoner Relief (UTP) — Half/One-Third Period',
    category: 'procedure',
    punishment: 'Release on personal bond with or without sureties',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'High Court / Sessions / Magistrate',
    keyElements: 'CrPC 436A: release after half of maximum sentence. BNSS 479: first-time offenders released after one-third of maximum sentence.',
    compoundable: false,
  },
  {
    ipcSection: 'CrPC 41',
    bnsSection: 'BNSS 35',
    offense: 'Arrest by Police Officer Without Warrant',
    category: 'procedure',
    punishment: 'Procedural safeguard — reasons to be recorded',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Police Officer',
    keyElements: 'Arrest only if necessary; reasons must be recorded. Application of mind required. Notice under Sec 41A mandatory for cognizable offenses < 7 yrs.',
    compoundable: false,
  },
  {
    ipcSection: 'CrPC 41A',
    bnsSection: 'BNSS 35(3)',
    offense: 'Notice of Appearance before Police Officer',
    category: 'procedure',
    punishment: 'Non-compliance = arrest becomes justified',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Police Officer',
    keyElements: 'Police to issue notice in lieu of arrest for cognizable offenses punishable up to 7 years; accused to appear and cooperate.',
    compoundable: false,
  },
  {
    ipcSection: 'CrPC 154',
    bnsSection: 'BNSS 173',
    offense: 'Information in Cognizable Cases (FIR)',
    category: 'procedure',
    punishment: 'Procedural provision — no independent punishment',
    bailable: 'Bailable',
    cognizable: 'Cognizable',
    triableBy: 'Police Station',
    keyElements: 'First Information Report (FIR): information given to officer in charge of a police station about a cognizable offense.',
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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
    compoundable: false,
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

/**
 * Get the corresponding section in the other law.
 * e.g. getCorrespondingSection('302', 'ipc') → BNS 103(1) mapping
 *      getCorrespondingSection('103', 'bns') → IPC 302 mapping
 */
export function getCorrespondingSection(sectionNumber: string, fromLaw: 'ipc' | 'bns' | 'crpc' | 'bnss'): LegalSectionMapping | null {
  const q = sectionNumber.toLowerCase().trim()
  if (fromLaw === 'ipc' || fromLaw === 'crpc') {
    return LEGAL_SECTIONS_DB.find((item) => item.ipcSection.toLowerCase().includes(q)) ?? null
  }
  return LEGAL_SECTIONS_DB.find((item) => item.bnsSection.toLowerCase().includes(q)) ?? null
}

/**
 * Classify a list of section matches to determine overall bail status.
 * Returns 'non-bailable' if any matched section is Non-Bailable, else 'bailable'.
 */
export function classifyBailability(sections: LegalSectionMapping[]): 'bailable' | 'non-bailable' | 'unknown' {
  if (!sections.length) return 'unknown'
  const hasNonBailable = sections.some((s) => s.bailable === 'Non-Bailable')
  return hasNonBailable ? 'non-bailable' : 'bailable'
}
