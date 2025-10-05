import db from '../database';
import { Settings } from '../types';

export class SettingsModel {
  static get(): Settings {
    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: string }[];
    
    const settings: any = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    
    // Return with defaults
    return {
      authEnabled: settings.authEnabled ?? false,
      recordingsPath: settings.recordingsPath ?? '/app/recordings',
      s3Enabled: settings.s3Enabled ?? false,
      s3Bucket: settings.s3Bucket,
      s3Region: settings.s3Region ?? 'us-east-1',
      defaultQuality: settings.defaultQuality ?? 'best',
      defaultFormat: settings.defaultFormat ?? 'mp4',
      monitorInterval: settings.monitorInterval ?? 60,
      autoCleanupEnabled: settings.autoCleanupEnabled ?? false,
      autoCleanupDays: settings.autoCleanupDays ?? 30,
    };
  }

  static set(key: string, value: any): void {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?
    `);
    const jsonValue = JSON.stringify(value);
    stmt.run(key, jsonValue, jsonValue);
  }

  static update(settings: Partial<Settings>): Settings {
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        this.set(key, value);
      }
    });
    return this.get();
  }
}

