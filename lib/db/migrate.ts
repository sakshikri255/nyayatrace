import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const databasePath = path.join(process.cwd(), 'nyayatrace.db')
const migrationsPath = path.join(process.cwd(), 'drizzle')
const sqlite = new Database(databasePath)

sqlite.pragma('foreign_keys = ON')
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS nyayatrace_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

const applied = sqlite.prepare('SELECT name FROM nyayatrace_migrations')
  .all()
  .map((row) => (row as { name: string }).name)
const recordMigration = sqlite.prepare(
  'INSERT INTO nyayatrace_migrations (name) VALUES (?)'
)

for (const name of fs.readdirSync(migrationsPath).filter((file) => file.endsWith('.sql')).sort()) {
  if (applied.includes(name)) continue

  const migration = fs.readFileSync(path.join(migrationsPath, name), 'utf8')
  sqlite.transaction(() => {
    sqlite.exec(migration)
    recordMigration.run(name)
  })()
  console.log(`Applied ${name}`)
}

sqlite.close()