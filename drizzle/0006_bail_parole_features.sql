-- ── Migration 0006: Bail & Parole Features ─────────────────────────────────
-- Adds: applicable_law, parole fields, condition_compliance_events, surety_bonds

-- 1. New columns on cases table
ALTER TABLE cases ADD COLUMN applicable_law TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE cases ADD COLUMN parole_grant_date TEXT;
ALTER TABLE cases ADD COLUMN parole_end_date TEXT;
ALTER TABLE cases ADD COLUMN parole_reporting_frequency TEXT;

-- 2. Condition compliance events
CREATE TABLE IF NOT EXISTS condition_compliance_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_id INTEGER NOT NULL REFERENCES bail_conditions(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('complied', 'violated')),
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS compliance_events_condition_id_idx
  ON condition_compliance_events(condition_id);

-- 3. Surety bonds
CREATE TABLE IF NOT EXISTS surety_bonds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_id INTEGER NOT NULL REFERENCES bail_conditions(id) ON DELETE CASCADE,
  surety_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  bond_amount TEXT NOT NULL,
  document_reference TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(verification_status IN ('pending', 'verified', 'rejected')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS surety_bonds_condition_id_idx
  ON surety_bonds(condition_id);
