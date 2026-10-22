import Database from 'better-sqlite3';
const db = new Database('./nyayatrace.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

try {
  const users = db.prepare('SELECT id, email, role, password_hash FROM users').all();
  console.log('Users count:', users.length);
  users.forEach(u => console.log(' -', u.email, u.role, 'hash_len:', u.password_hash?.length));
} catch(e) {
  console.log('users table error:', e.message);
}

try {
  const sessions = db.prepare('SELECT COUNT(*) as cnt FROM sessions').get();
  console.log('Sessions count:', sessions.cnt);
} catch(e) {
  console.log('sessions table error:', e.message);
}
