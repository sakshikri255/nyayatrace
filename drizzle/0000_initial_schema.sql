-- Initial schema: create all base tables

CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'unspecified',
  case_type TEXT NOT NULL,
  court TEXT,
  judge TEXT,
  remand_date TEXT,
  statutory_period_days INTEGER DEFAULT 60,
  chargesheet_filed INTEGER DEFAULT 0,
  chargesheet_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS cases_case_number_idx ON cases (case_number);
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases (status);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  upload_date TEXT DEFAULT (datetime('now')),
  file_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS documents_case_id_idx ON documents (case_id);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  extracted_text TEXT,
  quality TEXT NOT NULL DEFAULT 'good',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS pages_document_id_idx ON pages (document_id);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL,
  description TEXT NOT NULL,
  extracted_value TEXT,
  comparison_value TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS findings_case_id_idx ON findings (case_id);
CREATE INDEX IF NOT EXISTS findings_review_status_idx ON findings (review_status);

CREATE TABLE IF NOT EXISTS finding_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  page_number INTEGER,
  passage TEXT,
  role TEXT NOT NULL DEFAULT 'primary',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS finding_sources_finding_id_idx ON finding_sources (finding_id);

CREATE TABLE IF NOT EXISTS finding_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  note TEXT,
  performed_by TEXT,
  performed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS finding_reviews_finding_id_idx ON finding_reviews (finding_id);

CREATE TABLE IF NOT EXISTS hearings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  hearing_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  judge TEXT,
  court TEXT,
  source_document TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS hearings_case_id_idx ON hearings (case_id);
CREATE INDEX IF NOT EXISTS hearings_date_idx ON hearings (hearing_date);

CREATE TABLE IF NOT EXISTS judicial_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  order_date TEXT NOT NULL,
  order_type TEXT NOT NULL,
  summary TEXT,
  issued_by TEXT,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS judicial_orders_case_id_idx ON judicial_orders (case_id);

CREATE TABLE IF NOT EXISTS bail_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  condition_text TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  order_id INTEGER REFERENCES judicial_orders(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS bail_conditions_case_id_idx ON bail_conditions (case_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  performed_by TEXT,
  performed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS audit_events_case_id_idx ON audit_events (case_id);
