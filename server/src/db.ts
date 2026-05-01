import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Initialize table and unique index
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER,
    info TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_name_lower ON customers(LOWER(name));
`);

export default db;
