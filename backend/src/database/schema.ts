import db from './index';

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      name TEXT NOT NULL,
      auto_record INTEGER DEFAULT 0,
      quality TEXT DEFAULT 'best',
      enabled INTEGER DEFAULT 1,
      last_checked TEXT,
      is_live INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Recordings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      quality TEXT NOT NULL,
      format TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      duration INTEGER,
      error TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      uploaded_to_cloud INTEGER DEFAULT 0,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);
    CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
    CREATE INDEX IF NOT EXISTS idx_recordings_started_at ON recordings(started_at DESC);
  `);

  console.log('Database initialized successfully');
}

