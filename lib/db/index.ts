import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

// ── Lazy singleton ────────────────────────────────────────────────────────────
// We defer SQLite initialization to the first actual DB call so that the module
// can be safely imported during Next.js static analysis at build time (when the
// DB file does not exist on Vercel's build container).
let _db: BetterSQLite3Database<typeof schema> | null = null

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db

  const dbPath = path.join(process.cwd(), 'nyayatrace.db')
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // ── Column migrations (safe to re-run — ADD COLUMN fails silently if column exists) ─
  const columnMigrations: string[] = [
    "ALTER TABLE cases ADD COLUMN advocate TEXT DEFAULT 'Aditi Sharma'",
  ]
  for (const stmt of columnMigrations) {
    try { sqlite.exec(stmt) } catch { /* column already exists */ }
  }

  // ── FTS5 sync triggers (safe to re-run — CREATE TRIGGER IF NOT EXISTS) ──────
  // Must be set up at runtime because the migrate script splits on ';'
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

  _db = drizzle(sqlite, { schema })
  return _db
}

// Export a Proxy so existing callers can continue to use `db.select(...)` etc.
// without any changes — the real connection is opened only when first accessed.
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof BetterSQLite3Database<typeof schema>]
  },
})
