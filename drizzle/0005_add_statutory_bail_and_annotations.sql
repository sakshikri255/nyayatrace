ALTER TABLE cases ADD COLUMN remand_date TEXT;
ALTER TABLE cases ADD COLUMN statutory_period_days INTEGER DEFAULT 60;
ALTER TABLE cases ADD COLUMN chargesheet_filed INTEGER DEFAULT 0;
ALTER TABLE cases ADD COLUMN chargesheet_date TEXT;

ALTER TABLE documents ADD COLUMN language TEXT DEFAULT 'eng';

CREATE TABLE IF NOT EXISTS document_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  selected_text TEXT,
  note TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'general',
  color TEXT NOT NULL DEFAULT 'amber',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS document_annotations_case_id_idx ON document_annotations(case_id);
CREATE INDEX IF NOT EXISTS document_annotations_document_id_idx ON document_annotations(document_id);
