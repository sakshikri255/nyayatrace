CREATE TABLE analysis_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  engine TEXT NOT NULL,
  result TEXT,
  error TEXT,
  review_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX analysis_runs_case_id_idx ON analysis_runs (case_id);
CREATE UNIQUE INDEX analysis_runs_case_version_idx ON analysis_runs (case_id, version);
ALTER TABLE findings ADD COLUMN analysis_run_id INTEGER REFERENCES analysis_runs(id) ON DELETE SET NULL;
CREATE INDEX findings_analysis_run_idx ON findings (analysis_run_id);