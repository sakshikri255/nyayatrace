import { sql } from 'drizzle-orm'
import {
  integer,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// ─── 1. cases ───────────────────────────────────────────────────────────────

export const cases = sqliteTable(
  'cases',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseNumber: text('case_number').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['active', 'closed', 'pending', 'stayed', 'unspecified'],
    }).notNull().default('unspecified'),
    caseType: text('case_type', {
      enum: ['criminal', 'civil', 'bail', 'parole', 'unspecified'],
    }).notNull(),
    court: text('court'),
    jurisdiction: text('jurisdiction'),
    judge: text('judge'),
    remandDate: text('remand_date'),
    statutoryPeriodDays: integer('statutory_period_days', { mode: 'number' }).default(60),
    chargesheetFiled: integer('chargesheet_filed', { mode: 'number' }).default(0),
    chargesheetDate: text('chargesheet_date'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseNumberIdx: index('cases_case_number_idx').on(t.caseNumber),
    statusIdx: index('cases_status_idx').on(t.status),
  })
)

// ─── 2. documents ────────────────────────────────────────────────────────────

export const documents = sqliteTable(
  'documents',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    originalName: text('original_name').notNull(),
    fileType: text('file_type', {
      enum: ['pdf', 'image', 'scan'],
    }).notNull(),
    pageCount: integer('page_count', { mode: 'number' }).default(0),
    processingStatus: text('processing_status', {
      enum: ['pending', 'processing', 'complete', 'failed'],
    }).notNull().default('pending'),
    processingError: text('processing_error'),
    processedAt: text('processed_at'),
    uploadDate: text('upload_date').default(sql`(datetime('now'))`),
    filePath: text('file_path'),
    fileSize: integer('file_size').notNull().default(0),
    fileHash: text('file_hash'),
    language: text('language').default('eng'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('documents_case_id_idx').on(t.caseId),
    caseHashIdx: uniqueIndex('documents_case_hash_idx').on(t.caseId, t.fileHash),
  })
)

// ─── 3. pages ────────────────────────────────────────────────────────────────

export const pages = sqliteTable(
  'pages',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    documentId: integer('document_id', { mode: 'number' })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number', { mode: 'number' }).notNull(),
    extractedText: text('extracted_text'),
    quality: text('quality', {
      enum: ['good', 'poor', 'unreadable'],
    }).notNull().default('good'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    documentIdIdx: index('pages_document_id_idx').on(t.documentId),
  })
)

export const analysisRuns = sqliteTable(
  'analysis_runs',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    version: integer('version', { mode: 'number' }).notNull(),
    status: text('status', { enum: ['running', 'complete', 'failed'] }).notNull(),
    engine: text('engine').notNull(),
    result: text('result'),
    error: text('error'),
    reviewNotes: text('review_notes').notNull().default(''),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('analysis_runs_case_id_idx').on(t.caseId),
    caseVersionIdx: uniqueIndex('analysis_runs_case_version_idx').on(t.caseId, t.version),
  })
)

// ─── 4. findings ─────────────────────────────────────────────────────────────

export const findings = sqliteTable(
  'findings',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    analysisRunId: integer('analysis_run_id', { mode: 'number' }).references(
      () => analysisRuns.id,
      { onDelete: 'set null' }
    ),
    findingType: text('finding_type', {
      enum: [
        'date_discrepancy',
        'name_variation',
        'location_mismatch',
        'missing_info',
        'note',
      ],
    }).notNull(),
    description: text('description').notNull(),
    extractedValue: text('extracted_value'),
    comparisonValue: text('comparison_value'),
    severity: text('severity', {
      enum: ['high', 'medium', 'low'],
    }).notNull().default('medium'),
    reviewStatus: text('review_status', {
      enum: ['needs_review', 'verified', 'not_a_discrepancy'],
    }).notNull().default('needs_review'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: text('reviewed_at'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('findings_case_id_idx').on(t.caseId),
    reviewStatusIdx: index('findings_review_status_idx').on(t.reviewStatus),
    analysisRunIdx: index('findings_analysis_run_idx').on(t.analysisRunId),
  })
)

// ─── 5. finding_sources ───────────────────────────────────────────────────────

export const findingSources = sqliteTable(
  'finding_sources',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    findingId: integer('finding_id', { mode: 'number' })
      .notNull()
      .references(() => findings.id, { onDelete: 'cascade' }),
    documentId: integer('document_id', { mode: 'number' })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    pageId: integer('page_id', { mode: 'number' }).references(() => pages.id, {
      onDelete: 'set null',
    }),
    pageNumber: integer('page_number', { mode: 'number' }),
    passage: text('passage'),
    role: text('role', { enum: ['primary', 'comparison'] }).notNull().default('primary'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    findingIdIdx: index('finding_sources_finding_id_idx').on(t.findingId),
  })
)

// ─── 6. finding_reviews ───────────────────────────────────────────────────────

export const findingReviews = sqliteTable(
  'finding_reviews',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    findingId: integer('finding_id', { mode: 'number' })
      .notNull()
      .references(() => findings.id, { onDelete: 'cascade' }),
    action: text('action', {
      enum: ['verified', 'needs_review', 'not_a_discrepancy'],
    }).notNull(),
    note: text('note'),
    performedBy: text('performed_by'),
    performedAt: text('performed_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    findingIdIdx: index('finding_reviews_finding_id_idx').on(t.findingId),
  })
)

// ─── 7. hearings ─────────────────────────────────────────────────────────────

export const hearings = sqliteTable(
  'hearings',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    hearingDate: text('hearing_date').notNull(),
    eventType: text('event_type', {
      enum: [
        'bail_hearing',
        'charge_framing',
        'arguments',
        'judgment',
        'order',
        'adjournment',
      ],
    }).notNull(),
    description: text('description'),
    outcome: text('outcome'),
    judge: text('judge'),
    court: text('court'),
    sourceDocument: text('source_document'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('hearings_case_id_idx').on(t.caseId),
    dateIdx: index('hearings_date_idx').on(t.hearingDate),
  })
)

// ─── 8. judicial_orders ───────────────────────────────────────────────────────

export const judicialOrders = sqliteTable(
  'judicial_orders',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    orderDate: text('order_date').notNull(),
    orderType: text('order_type', {
      enum: ['bail_order', 'stay_order', 'framing_charges', 'sentence', 'other'],
    }).notNull(),
    summary: text('summary'),
    issuedBy: text('issued_by'),
    documentId: integer('document_id', { mode: 'number' }).references(
      () => documents.id,
      { onDelete: 'set null' }
    ),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('judicial_orders_case_id_idx').on(t.caseId),
  })
)

// ─── 9. bail_conditions ───────────────────────────────────────────────────────

export const bailConditions = sqliteTable(
  'bail_conditions',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    conditionText: text('condition_text').notNull(),
    conditionType: text('condition_type', {
      enum: ['surety', 'reporting', 'travel', 'activity', 'other'],
    }).notNull(),
    status: text('status', {
      enum: ['active', 'revoked', 'completed'],
    }).notNull().default('active'),
    orderId: integer('order_id', { mode: 'number' }).references(
      () => judicialOrders.id,
      { onDelete: 'set null' }
    ),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('bail_conditions_case_id_idx').on(t.caseId),
  })
)

// ─── 10. audit_events ─────────────────────────────────────────────────────────

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' }).references(() => cases.id, {
      onDelete: 'set null',
    }),
    eventType: text('event_type').notNull(),
    description: text('description'),
    performedBy: text('performed_by'),
    performedAt: text('performed_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('audit_events_case_id_idx').on(t.caseId),
  })
)

// ─── 11. document_annotations ──────────────────────────────────────────────────

export const documentAnnotations = sqliteTable(
  'document_annotations',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    caseId: integer('case_id', { mode: 'number' })
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    documentId: integer('document_id', { mode: 'number' })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number', { mode: 'number' }).notNull(),
    selectedText: text('selected_text'),
    note: text('note').notNull(),
    tag: text('tag', {
      enum: ['alibi', 'medical', 'panchnama', 'fir_lapse', 'eyewitness', 'procedural_lapse', 'general'],
    }).notNull().default('general'),
    color: text('color', {
      enum: ['amber', 'emerald', 'teal', 'rose', 'blue'],
    }).notNull().default('amber'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
  },
  (t) => ({
    caseIdIdx: index('document_annotations_case_id_idx').on(t.caseId),
    documentIdIdx: index('document_annotations_document_id_idx').on(t.documentId),
  })
)

