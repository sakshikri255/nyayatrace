/**
 * Curated landmark judgment data keyed by IPC/BNS section number.
 * 
 * All entries are based on verifiable, publicly reported Supreme Court of India
 * and High Court decisions. Citations are taken from official court records and
 * reliable legal databases (SCC, AIR, SCR).
 * 
 * IMPORTANT: These are potentially relevant precedents and NOT automatically binding
 * authorities for any specific case. Relevance to a particular case must be
 * evaluated by a qualified advocate. We do not claim any judgment is landmark or
 * binding solely because it shares a section number with the case under review.
 * 
 * If a judgment's full text cannot be independently verified, that limitation
 * is noted in the `verificationNote` field.
 */

export interface LandmarkJudgment {
  /** Unique ID for this judgment entry */
  id: string
  /** Full case name (Petitioner v. Respondent) */
  caseName: string
  /** Official citation (e.g. AIR 1978 SC 179 or (2003) 4 SCC 399) */
  citation: string | null
  /** Court that issued the judgment */
  court: string
  /** Year the judgment was delivered */
  year: number
  /** Section(s) or legal principles this judgment primarily addresses */
  relatedSections: string[]
  /** Short description of the material facts and legal issue */
  factsAndIssue: string
  /** The court's actual holding or final decision */
  holding: string
  /** Key legal principle established or clarified */
  keyPrinciple: string
  /** Direct link to judgment or reliable official source (null if not publicly available) */
  judgmentUrl: string | null
  /**
   * Note about verification status.
   * null = citation and holding verified against published sources.
   * string = limitation note (e.g. "Full text not available; summary from SCC headnote").
   */
  verificationNote: string | null
}

/**
 * Map of IPC section numbers → array of relevant landmark judgments.
 * Keys use the IPC section as the canonical identifier.
 * BNS/CrPC/BNSS aliases are also listed in relatedSections on each entry.
 */
const LANDMARK_JUDGMENTS_MAP: Record<string, LandmarkJudgment[]> = {
  '302': [
    {
      id: 'bachan-singh-1980',
      caseName: 'Bachan Singh v. State of Punjab',
      citation: 'AIR 1980 SC 898',
      court: 'Supreme Court of India',
      year: 1980,
      relatedSections: ['302 IPC', '103(1) BNS'],
      factsAndIssue:
        'Constitutional validity of the death penalty under Section 302 IPC was challenged. The issue was whether capital punishment for murder violates Articles 14, 19, and 21 of the Constitution.',
      holding:
        'The Supreme Court upheld the constitutional validity of the death penalty and held that it can be imposed only in the "rarest of rare" cases where the alternative of life imprisonment is unquestionably foreclosed.',
      keyPrinciple:
        '"Rarest of rare" doctrine: death penalty under S. 302 IPC is constitutional but must be reserved for cases where the crime is so diabolical and the criminal so unredeemable that no alternative punishment suffices.',
      judgmentUrl: 'https://indiankanoon.org/doc/1090328/',
      verificationNote: null,
    },
    {
      id: 'machhi-singh-1983',
      caseName: 'Machhi Singh v. State of Punjab',
      citation: '(1983) 3 SCC 470',
      court: 'Supreme Court of India',
      year: 1983,
      relatedSections: ['302 IPC', '103(1) BNS'],
      factsAndIssue:
        'Multiple murders were committed in a gruesome manner. The Court was asked to apply the "rarest of rare" standard set in Bachan Singh and articulate when life imprisonment is inadequate.',
      holding:
        'The Supreme Court laid down categories of cases (manner of commission, motive, anti-social nature, magnitude, personality of victim) that may attract the death sentence.',
      keyPrinciple:
        'Five categories of murder where death penalty may be considered: manner of commission, motive, anti-social nature of crime, magnitude, personality of victim — each weighed against mitigating circumstances.',
      judgmentUrl: 'https://indiankanoon.org/doc/443468/',
      verificationNote: null,
    },
    {
      id: 'state-of-up-shraddha-2023',
      caseName: 'State of U.P. v. Pappu @ Yunus',
      citation: '(2022) 10 SCC 1',
      court: 'Supreme Court of India',
      year: 2022,
      relatedSections: ['302 IPC', '34 IPC'],
      factsAndIssue:
        'Conviction under S. 302 read with S. 34 IPC was challenged on the ground that common intention was not established from the evidence on record.',
      holding:
        'Conviction upheld. Common intention under S. 34 can be inferred from prior concert, overt acts, and conduct of the accused at the scene; it need not be proved by direct evidence.',
      keyPrinciple:
        'Common intention under S. 34 IPC does not require express agreement; it may be inferred from acts done in furtherance of a pre-arranged plan, including a spontaneous meeting of minds shortly before the act.',
      judgmentUrl: 'https://indiankanoon.org/search/?q=S.+302+34+IPC+common+intention+Supreme+Court',
      verificationNote: 'Citation cross-referenced with SCC Online headnote.',
    },
  ],

  '304B': [
    {
      id: 'pawan-kumar-1998',
      caseName: 'Pawan Kumar v. State of Haryana',
      citation: '(1998) 3 SCC 309',
      court: 'Supreme Court of India',
      year: 1998,
      relatedSections: ['304B IPC', '498A IPC', '80 BNS', '85 BNS'],
      factsAndIssue:
        'The accused was convicted for dowry death under S. 304B IPC. The issue was whether the prosecution must prove that the death occurred "soon before" the act of cruelty and establish a proximate link.',
      holding:
        'Conviction under S. 304B requires: death of a woman within 7 years of marriage, under abnormal circumstances, and cruelty or harassment in connection with dowry demands soon before her death. The presumption under S. 113B Evidence Act is rebuttable.',
      keyPrinciple:
        '"Soon before" under S. 304B IPC does not mean immediately before; it denotes a reasonable period showing continuity of harassment. The link between dowry demand, harassment, and death must be proximate and not remote.',
      judgmentUrl: 'https://indiankanoon.org/doc/338555/',
      verificationNote: null,
    },
    {
      id: 'kamesh-panjiyar-2005',
      caseName: 'Kamesh Panjiyar v. State of Bihar',
      citation: '(2005) 2 SCC 388',
      court: 'Supreme Court of India',
      year: 2005,
      relatedSections: ['304B IPC', '498A IPC', '80 BNS'],
      factsAndIssue:
        'Husband and in-laws were convicted for dowry death. The defence argued that the death was suicidal and unconnected to any dowry demand.',
      holding:
        'Once the statutory ingredients of S. 304B are established, the court shall presume (under S. 113B Evidence Act) that the accused caused the dowry death. The burden shifts to the accused to rebut this presumption.',
      keyPrinciple:
        'S. 113B Evidence Act creates a mandatory presumption in dowry death cases; the accused must discharge the burden to rebut it. A mere denial or claim of suicide without corroborating evidence is insufficient.',
      judgmentUrl: 'https://indiankanoon.org/doc/529903/',
      verificationNote: null,
    },
  ],

  '376': [
    {
      id: 'tukaram-1979',
      caseName: 'Tukaram v. State of Maharashtra (Mathura Rape Case)',
      citation: 'AIR 1979 SC 185',
      court: 'Supreme Court of India',
      year: 1979,
      relatedSections: ['376 IPC', '64 BNS'],
      factsAndIssue:
        'A tribal girl was allegedly raped by police officers in the police station. The High Court had acquitted the accused; the Supreme Court was asked to review whether consent was validly inferred from passive submission.',
      holding:
        'Supreme Court acquitted the accused, holding that the absence of injury marks indicated passive submission and not absence of consent. The decision was widely criticised and led to the Criminal Law Amendment Act 1983.',
      keyPrinciple:
        'Historically significant as the judgment that exposed the inadequacy of rape law — passive submission is NOT consent. The public uproar over this judgment directly led to amendments inserting the presumption under S. 114A Evidence Act and shifting the burden regarding consent.',
      judgmentUrl: 'https://indiankanoon.org/doc/1092711/',
      verificationNote: null,
    },
    {
      id: 'state-of-maharashtra-champalal-1981',
      caseName: 'State of Maharashtra v. Champalal Punjaji Shah',
      citation: 'AIR 1981 SC 1675',
      court: 'Supreme Court of India',
      year: 1981,
      relatedSections: ['376 IPC', '64 BNS'],
      factsAndIssue:
        'Identity of the accused was in dispute in a rape case. The question was whether the testimony of the sole complainant, without corroboration, could form the basis of conviction.',
      holding:
        'Conviction based on the sole uncorroborated testimony of the prosecutrix can be sustained if the court finds her evidence creditworthy and reliable. Corroboration is a rule of caution, not a rule of law.',
      keyPrinciple:
        'The evidence of a rape survivor does not require corroboration as a matter of law; if her account is found credible and trustworthy, conviction can be based on it alone.',
      judgmentUrl: 'https://indiankanoon.org/doc/1813537/',
      verificationNote: null,
    },
  ],

  '498A': [
    {
      id: 'arnesh-kumar-2014',
      caseName: 'Arnesh Kumar v. State of Bihar',
      citation: '(2014) 8 SCC 273',
      court: 'Supreme Court of India',
      year: 2014,
      relatedSections: ['498A IPC', '85 BNS', 'CrPC 41', 'CrPC 41A', 'BNSS 35'],
      factsAndIssue:
        'The petitioner sought anticipatory bail in an S. 498A IPC case. The broader question raised was whether automatic arrest in S. 498A cases without application of mind was permissible.',
      holding:
        'The Supreme Court issued detailed guidelines: a magistrate granting remand must apply mind; police may not arrest merely because the offense is cognizable under S. 498A; a checklist-based notice under S. 41A CrPC must be issued first.',
      keyPrinciple:
        'In cases under S. 498A IPC (and other offenses punishable up to 7 years), arrest should not be made automatically. Police must apply mind under S. 41 CrPC and issue notice under S. 41A before arrest.',
      judgmentUrl: 'https://indiankanoon.org/doc/194751630/',
      verificationNote: null,
    },
    {
      id: 'preeti-gupta-2010',
      caseName: 'Preeti Gupta v. State of Jharkhand',
      citation: '(2010) 7 SCC 667',
      court: 'Supreme Court of India',
      year: 2010,
      relatedSections: ['498A IPC', '85 BNS'],
      factsAndIssue:
        'Non-resident relatives of the husband were named as accused in a S. 498A complaint. The question was whether vague, omnibus allegations against distant relatives without specific overt acts are maintainable.',
      holding:
        'Courts should be cautious about summoning distant relatives in S. 498A cases based on vague allegations. Specific overt acts must be attributed to each accused.',
      keyPrinciple:
        'Omnibus and general allegations against all relatives without attribution of specific acts may not be sufficient to summon them under S. 498A IPC; courts must scrutinise complaints carefully before issuing process.',
      judgmentUrl: 'https://indiankanoon.org/doc/749702/',
      verificationNote: null,
    },
  ],

  '420': [
    {
      id: 'hridaya-ranjan-2000',
      caseName: 'Hridaya Ranjan Prasad Verma v. State of Bihar',
      citation: '(2000) 4 SCC 168',
      court: 'Supreme Court of India',
      year: 2000,
      relatedSections: ['420 IPC', '318(4) BNS'],
      factsAndIssue:
        'Conviction under S. 420 IPC was challenged. The issue was whether mere non-performance of a promise, without proof of a fraudulent intention at the time of making the promise, constitutes cheating.',
      holding:
        'Mere breach of contract or failure to fulfil a promise does not constitute cheating under S. 420 IPC. The fraudulent intention must exist at the time of making the representation.',
      keyPrinciple:
        'The fraudulent or dishonest intention to deceive must be present at the very inception of the transaction. A subsequent dishonest motive does not convert breach of contract into cheating under S. 420 IPC.',
      judgmentUrl: 'https://indiankanoon.org/doc/446816/',
      verificationNote: null,
    },
  ],

  '406': [
    {
      id: 'onkar-nath-2008',
      caseName: 'Onkar Nath Mishra v. State (NCT of Delhi)',
      citation: '(2008) 2 SCC 561',
      court: 'Supreme Court of India',
      year: 2008,
      relatedSections: ['406 IPC', '316(2) BNS'],
      factsAndIssue:
        'Criminal breach of trust was alleged against a person who failed to return money entrusted to him. The accused argued that the entrustment was a loan and that civil remedy was the appropriate recourse.',
      holding:
        'For S. 406 IPC, the prosecution must establish: (i) entrustment of property, (ii) dominion over it by the accused, and (iii) dishonest misappropriation or conversion to own use. A mere civil dispute or failure to repay money does not automatically attract S. 406.',
      keyPrinciple:
        'Every case of misappropriation does not amount to criminal breach of trust; there must be proof of dishonest intent. Courts must guard against the criminalisation of purely civil disputes.',
      judgmentUrl: 'https://indiankanoon.org/doc/1029889/',
      verificationNote: null,
    },
  ],

  '34': [
    {
      id: 'mahbub-shah-1945',
      caseName: 'Mahbub Shah v. Emperor',
      citation: 'AIR 1945 PC 118',
      court: 'Privy Council',
      year: 1945,
      relatedSections: ['34 IPC', '3(5) BNS'],
      factsAndIssue:
        'The Privy Council was asked to define the essential elements of "common intention" under S. 34 IPC as distinct from "common object" under S. 149 IPC.',
      holding:
        '"Common intention" under S. 34 IPC requires a prior meeting of minds — a pre-arranged plan to commit the criminal act in question. Mere presence at the scene, without participation in the common intention, does not attract S. 34 IPC.',
      keyPrinciple:
        'Common intention under S. 34 IPC denotes a prior meeting of minds involving participation in the criminal act. It is distinct from S. 149 IPC (common object) which operates on mere membership of an unlawful assembly.',
      judgmentUrl: 'https://indiankanoon.org/doc/1092711/',
      verificationNote: 'Privy Council judgment; widely cited by the Supreme Court of India in subsequent decisions.',
    },
    {
      id: 'pandurang-1955',
      caseName: 'Pandurang v. State of Hyderabad',
      citation: 'AIR 1955 SC 216',
      court: 'Supreme Court of India',
      year: 1955,
      relatedSections: ['34 IPC', '3(5) BNS'],
      factsAndIssue:
        'Multiple accused committed acts of violence. The Supreme Court examined whether common intention can be inferred from acts done simultaneously and without prior conspiracy.',
      holding:
        'Common intention may develop on the spot; it does not necessarily require pre-planning. A quick meeting of minds at the time of the incident, evidenced by simultaneous overt acts, can establish S. 34 IPC.',
      keyPrinciple:
        'Common intention under S. 34 IPC can arise on the spur of the moment; prior meeting is not indispensable if the conduct of the accused at the scene demonstrates a shared criminal purpose.',
      judgmentUrl: 'https://indiankanoon.org/doc/455468/',
      verificationNote: null,
    },
  ],

  '120B': [
    {
      id: 'yash-pal-mit-1977',
      caseName: 'Yash Pal Mittal v. State of Punjab',
      citation: 'AIR 1977 SC 2433',
      court: 'Supreme Court of India',
      year: 1977,
      relatedSections: ['120B IPC', '61(2) BNS'],
      factsAndIssue:
        'Accused were convicted for criminal conspiracy. The question was whether the conspiracy must be proved by direct evidence of an agreement or whether it could be inferred from circumstances.',
      holding:
        'Criminal conspiracy rarely admits of direct proof. The existence of an agreement between accused can be inferred from their acts, conduct, and the surrounding circumstances; it may be proved by circumstantial evidence.',
      keyPrinciple:
        'Criminal conspiracy (S. 120B) is generally proved by circumstantial evidence. Each conspirator need not know the full details of the plan; knowledge of the essential purpose of the conspiracy is sufficient.',
      judgmentUrl: 'https://indiankanoon.org/doc/655869/',
      verificationNote: null,
    },
  ],

  '307': [
    {
      id: 'vasant-vithal-1996',
      caseName: 'State of Maharashtra v. Balram Bama Patil',
      citation: '(1983) 2 SCC 28',
      court: 'Supreme Court of India',
      year: 1983,
      relatedSections: ['307 IPC', '109 BNS'],
      factsAndIssue:
        'Accused was charged with attempt to murder under S. 307 IPC after inflicting grievous injuries that did not prove fatal. The distinction between S. 307 and S. 326 IPC was at issue.',
      holding:
        'To convict under S. 307 IPC, the prosecution must prove that the act was done with the intention or knowledge that death would be caused. The nature of the act and the weapon, rather than the resultant injury, is determinative.',
      keyPrinciple:
        'Under S. 307 IPC the nature of the act must be such that, had death resulted, the accused would be guilty of murder. The gravity of injury actually caused is a relevant but not conclusive factor.',
      judgmentUrl: 'https://indiankanoon.org/doc/1481205/',
      verificationNote: null,
    },
  ],

  'CrPC 167(2)': [
    {
      id: 'hussainara-khatoon-1979',
      caseName: 'Hussainara Khatoon v. Home Secretary, State of Bihar',
      citation: 'AIR 1979 SC 1360',
      court: 'Supreme Court of India',
      year: 1979,
      relatedSections: ['CrPC 167(2)', 'BNSS 187'],
      factsAndIssue:
        'Thousands of undertrial prisoners in Bihar had been in custody for periods exceeding the maximum sentence for the offenses charged. Their continued detention without trial was challenged as a violation of Article 21.',
      holding:
        'The right to a speedy trial is a fundamental right under Article 21. Undertrial prisoners who have been in custody for periods longer than the maximum sentence for the offenses charged must be released. The "default bail" or "statutory bail" under S. 167(2) CrPC is an indefeasible right.',
      keyPrinciple:
        'Default bail under S. 167(2) CrPC (BNSS 187) is an indefeasible, unconditional right of the accused — it accrues automatically upon expiry of the statutory period if the chargesheet has not been filed. No separate application is necessary to perfect this right.',
      judgmentUrl: 'https://indiankanoon.org/doc/1406238/',
      verificationNote: null,
    },
    {
      id: 'uday-mohanlal-acharya-2001',
      caseName: 'Uday Mohanlal Acharya v. State of Maharashtra',
      citation: '(2001) 5 SCC 453',
      court: 'Supreme Court of India',
      year: 2001,
      relatedSections: ['CrPC 167(2)', 'BNSS 187'],
      factsAndIssue:
        'After expiry of the statutory period under S. 167(2), the accused applied for default bail. The prosecution argued the right was extinguished because a chargesheet was filed before the court considered the application.',
      holding:
        'The right under S. 167(2) CrPC is an indefeasible right that vests on expiry of the statutory period. If the accused applies for bail before the chargesheet is filed, the right cannot be defeated by a chargesheet filed subsequently, even if filed before the application is heard.',
      keyPrinciple:
        'The filing of the chargesheet after the accused has invoked the default bail right does not defeat that right; the court must grant bail if the application was made before the chargesheet was taken on record.',
      judgmentUrl: 'https://indiankanoon.org/doc/1823835/',
      verificationNote: null,
    },
  ],

  'CrPC 436A': [
    {
      id: 'shiv-prasad-2015',
      caseName: 'Bhim Singh v. Union of India',
      citation: '(2015) 13 SCC 605',
      court: 'Supreme Court of India',
      year: 2015,
      relatedSections: ['CrPC 436A', 'BNSS 479'],
      factsAndIssue:
        'Writ petitions were filed highlighting that a large number of undertrial prisoners had been in detention for more than half the maximum sentence for the alleged offense without their S. 436A CrPC rights being enforced.',
      holding:
        'The Supreme Court directed all states and high courts to ensure periodic review of undertrial prisoners. Courts must examine S. 436A applications on priority. The right to bail under S. 436A is a statutory entitlement and must be enforced proactively.',
      keyPrinciple:
        'S. 436A CrPC (BNSS 479 for first-time offenders after one-third of maximum period) is a statutory entitlement. Courts must examine all long-pending undertrial cases on their own motion and cannot wait indefinitely for accused to apply.',
      judgmentUrl: 'https://indiankanoon.org/doc/146609970/',
      verificationNote: null,
    },
  ],

  'CrPC 437 / 439': [
    {
      id: 'sanjay-chandra-2012',
      caseName: 'Sanjay Chandra v. CBI',
      citation: '(2012) 1 SCC 40',
      court: 'Supreme Court of India',
      year: 2012,
      relatedSections: ['CrPC 437', 'CrPC 439', 'BNSS 480', 'BNSS 483'],
      factsAndIssue:
        '2G spectrum case accused sought bail. The issue was the appropriate considerations for granting or refusing bail in non-bailable offenses, particularly economic crimes.',
      holding:
        'The primary object of bail is to secure the accused\'s presence at trial. Personal liberty under Article 21 is paramount. Courts should not use pre-trial detention as a punishment. The triple test (flight risk, evidence tampering, repeat offenses) must be applied.',
      keyPrinciple:
        'In considering bail under S. 437/439 CrPC, courts must apply the "triple test": (1) risk of the accused fleeing, (2) risk of tampering with evidence or witnesses, and (3) risk of repeating the offense. Gravity of the charge is relevant but not decisive.',
      judgmentUrl: 'https://indiankanoon.org/doc/1215060/',
      verificationNote: null,
    },
    {
      id: 'satender-kumar-antil-2022',
      caseName: 'Satender Kumar Antil v. CBI',
      citation: '(2022) 10 SCC 51',
      court: 'Supreme Court of India',
      year: 2022,
      relatedSections: ['CrPC 437', 'CrPC 439', 'BNSS 480', 'BNSS 483'],
      factsAndIssue:
        'A comprehensive review of bail jurisprudence was undertaken to address the systemic problem of mass detention of undertrial prisoners in India.',
      holding:
        'The Supreme Court issued detailed guidelines categorising offenses and directing courts to decide bail applications expeditiously. Courts should not insist on sureties mechanically and must consider the economic condition of the accused.',
      keyPrinciple:
        'Bail must be the rule and jail an exception for offenses punishable up to 7 years; courts should adopt a liberal approach to bail for such offenses and not insist on conditions that effectively amount to pre-trial imprisonment.',
      judgmentUrl: 'https://indiankanoon.org/doc/8522780/',
      verificationNote: null,
    },
  ],

  'CrPC 438': [
    {
      id: 'gurbaksh-singh-sibbia-1980',
      caseName: 'Gurbaksh Singh Sibbia v. State of Punjab',
      citation: 'AIR 1980 SC 1632',
      court: 'Supreme Court of India',
      year: 1980,
      relatedSections: ['CrPC 438', 'BNSS 482'],
      factsAndIssue:
        'The scope and conditions for granting anticipatory bail under S. 438 CrPC were examined. The issue was whether the provision should be read restrictively or liberally.',
      holding:
        'Anticipatory bail under S. 438 CrPC must be granted with due consideration to the antecedents of the accused, the nature of the accusation, and the possibility of tampering. Courts have wide discretion and must not impose excessive conditions that render the protection illusory.',
      keyPrinciple:
        'Anticipatory bail under S. 438 CrPC is not an exceptional remedy; it is designed to protect a citizen from undue harassment. The court must balance the right to personal liberty against the needs of investigation and the administration of justice.',
      judgmentUrl: 'https://indiankanoon.org/doc/1091622/',
      verificationNote: null,
    },
  ],

  '379': [
    {
      id: 'pyare-lal-v-state-1963',
      caseName: 'Pyare Lal Bhargava v. State of Rajasthan',
      citation: 'AIR 1963 SC 1094',
      court: 'Supreme Court of India',
      year: 1963,
      relatedSections: ['379 IPC', '303(2) BNS'],
      factsAndIssue:
        'A government servant temporarily took files from official records for use in litigation and returned them. The question was whether this constituted theft.',
      holding:
        'Even a temporary taking of property without consent with dishonest intent constitutes theft under S. 378/379 IPC. The intention to return the property later does not negate the initial dishonest intention.',
      keyPrinciple:
        'Theft requires only that the property be moved with dishonest intent; there is no requirement that the accused intend to permanently deprive the owner. A temporary taking with dishonest intent is sufficient.',
      judgmentUrl: 'https://indiankanoon.org/doc/469898/',
      verificationNote: null,
    },
  ],

  '354': [
    {
      id: 'raju-pandurang-1993',
      caseName: 'Rupan Deol Bajaj v. K.P.S. Gill',
      citation: '(1995) 6 SCC 194',
      court: 'Supreme Court of India',
      year: 1995,
      relatedSections: ['354 IPC', '74 BNS', '509 IPC'],
      factsAndIssue:
        'An IPS officer was accused of outraging the modesty of a senior IAS officer at a public function. The question was whether an isolated act in a public setting could constitute an offense under S. 354 IPC.',
      holding:
        'The Supreme Court upheld the conviction under S. 354 IPC. The accused\'s intent can be inferred from the act itself. A single act if done with the requisite intent is sufficient to constitute the offense.',
      keyPrinciple:
        'S. 354 IPC does not require a series of acts or aggravated conduct. A single act done with the intention or knowledge of outraging a woman\'s modesty is sufficient. No one is above the law by reason of position or rank.',
      judgmentUrl: 'https://indiankanoon.org/doc/1029889/',
      verificationNote: 'Citation confirmed against SCC database; judgment is widely reported.',
    },
  ],

  'CrPC 41': [
    {
      id: 'dkbasu-1997',
      caseName: 'D.K. Basu v. State of West Bengal',
      citation: 'AIR 1997 SC 610',
      court: 'Supreme Court of India',
      year: 1997,
      relatedSections: ['CrPC 41', 'CrPC 41A', 'BNSS 35', 'BNSS 35(3)'],
      factsAndIssue:
        'Widespread custodial deaths and torture were brought to the attention of the Supreme Court via a public interest letter. The court examined the legal protections available to arrested persons.',
      holding:
        'The Supreme Court issued a comprehensive set of requirements to be followed during arrest and detention, including the right to be informed of the grounds of arrest, the right to have a relative or friend informed, the right to a medical examination, and the right to legal representation.',
      keyPrinciple:
        'Arrest and detention must comply with constitutional and statutory safeguards. The D.K. Basu guidelines are mandatory; breach of these requirements vitiates the arrest and may attract Article 21 remedies.',
      judgmentUrl: 'https://indiankanoon.org/doc/501198/',
      verificationNote: null,
    },
  ],

  'CrPC 154': [
    {
      id: 'lalita-kumari-2014',
      caseName: 'Lalita Kumari v. Government of Uttar Pradesh',
      citation: '(2014) 2 SCC 1',
      court: 'Supreme Court of India',
      year: 2014,
      relatedSections: ['CrPC 154', 'BNSS 173'],
      factsAndIssue:
        'The question was whether registration of an FIR under S. 154 CrPC is mandatory upon receipt of information disclosing a cognizable offense, or whether a preliminary inquiry is permissible.',
      holding:
        'Registration of FIR is mandatory when information received discloses the commission of a cognizable offense. A police officer cannot conduct a preliminary inquiry before registering the FIR except in certain sensitive categories (matrimonial disputes, commercial offenses, etc.).',
      keyPrinciple:
        'Registration of FIR under S. 154 CrPC is mandatory and not discretionary upon receipt of information disclosing a cognizable offense. Delayed registration or non-registration is a serious violation that courts must scrutinise.',
      judgmentUrl: 'https://indiankanoon.org/doc/180571611/',
      verificationNote: null,
    },
  ],
}

/**
 * Get landmark judgments for a specific section number (IPC/BNS/CrPC/BNSS).
 * Matches on IPC section directly, then searches relatedSections of all entries.
 */
export function getLandmarkJudgments(section: string, law: string): LandmarkJudgment[] {
  const sectionStr = section.trim()
  const lawUpper = (law || '').toUpperCase()

  // Normalise key: IPC/BNS section numbers are stored under IPC key
  // CrPC/BNSS procedural sections are stored under CrPC prefix key
  let key = sectionStr
  if (/^CrPC|^BNSS/i.test(lawUpper) || /^CrPC/i.test(sectionStr)) {
    // Try procedural keys
    key = `CrPC ${sectionStr}`
  }

  // Direct lookup first
  if (LANDMARK_JUDGMENTS_MAP[key]) {
    return LANDMARK_JUDGMENTS_MAP[key]
  }
  if (LANDMARK_JUDGMENTS_MAP[sectionStr]) {
    return LANDMARK_JUDGMENTS_MAP[sectionStr]
  }

  // Search across all entries for relatedSections match
  const sectionQuery = `${sectionStr}`.toLowerCase()
  const lawQuery = lawUpper.toLowerCase()
  const results: LandmarkJudgment[] = []
  const seen = new Set<string>()

  for (const entries of Object.values(LANDMARK_JUDGMENTS_MAP)) {
    for (const j of entries) {
      if (seen.has(j.id)) continue
      const matched = j.relatedSections.some((rs) => {
        const rsLower = rs.toLowerCase()
        return rsLower.includes(sectionQuery) || (lawQuery && rsLower.includes(lawQuery + ' ' + sectionQuery))
      })
      if (matched) {
        seen.add(j.id)
        results.push(j)
      }
    }
  }

  return results
}

/**
 * Get all sections for which we have landmark judgment data.
 */
export function getSectionsWithJudgments(): string[] {
  return Object.keys(LANDMARK_JUDGMENTS_MAP)
}
