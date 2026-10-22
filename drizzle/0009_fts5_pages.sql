-- Migration 0009: FTS5 full-text search for pages
-- Note: This migration is applied via the FTS5 setup in lib/db/fts5Setup.ts
-- The triggers are applied separately to avoid semicolons inside BEGIN...END blocks
CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(extracted_text, content=pages, content_rowid=id);
INSERT OR IGNORE INTO pages_fts(rowid, extracted_text) SELECT id, extracted_text FROM pages WHERE extracted_text IS NOT NULL;
