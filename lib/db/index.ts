import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const dbPath = path.join(process.cwd(), 'nyayatrace.db')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// ── FTS5 sync triggers (safe to re-run — CREATE TRIGGER IF NOT EXISTS) ──────
// These must be set up at runtime because the migrate script splits on ';'
// which breaks BEGIN...END trigger bodies.
try {
  sqlite.exec(`CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
    INSERT INTO pages_fts(rowid, extracted_text) VALUES (new.id, new.extracted_text);
  END`)
  sqlite.exec(`CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
    INSERT INTO pages_fts(pages_fts, rowid, extracted_text) VALUES('delete', old.id, old.extracted_text);
    INSERT INTO pages_fts(rowid, extracted_text) VALUES (new.id, new.extracted_text);
  END`)
  sqlite.exec(`CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
    INSERT INTO pages_fts(pages_fts, rowid, extracted_text) VALUES('delete', old.id, old.extracted_text);
  END`)
} catch {
  // pages_fts table may not exist yet (migration hasn't run) — ignore silently
}

export const db = drizzle(sqlite, { schema })
