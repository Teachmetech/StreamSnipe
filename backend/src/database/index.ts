import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.dirname(config.database.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: BetterSqlite3.Database = new Database(config.database.path);
db.pragma('journal_mode = WAL');

export default db;

