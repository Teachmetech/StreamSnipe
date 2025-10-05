import db from '../database';
import { Channel } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ChannelModel {
  static create(data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>): Channel {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO channels (id, url, platform, name, auto_record, quality, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.url,
      data.platform,
      data.name,
      data.autoRecord ? 1 : 0,
      data.quality,
      data.enabled ? 1 : 0,
      now,
      now
    );
    
    return this.findById(id)!;
  }

  static findAll(): Channel[] {
    const stmt = db.prepare('SELECT * FROM channels ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(this.mapRow);
  }

  static findById(id: string): Channel | undefined {
    const stmt = db.prepare('SELECT * FROM channels WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRow(row) : undefined;
  }

  static update(id: string, data: Partial<Channel>): Channel | undefined {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.url !== undefined) {
      updates.push('url = ?');
      values.push(data.url);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.autoRecord !== undefined) {
      updates.push('auto_record = ?');
      values.push(data.autoRecord ? 1 : 0);
    }
    if (data.quality !== undefined) {
      updates.push('quality = ?');
      values.push(data.quality);
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(data.enabled ? 1 : 0);
    }
    if (data.isLive !== undefined) {
      updates.push('is_live = ?');
      values.push(data.isLive ? 1 : 0);
    }
    if (data.lastChecked !== undefined) {
      updates.push('last_checked = ?');
      values.push(data.lastChecked);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM channels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static findEnabled(): Channel[] {
    const stmt = db.prepare('SELECT * FROM channels WHERE enabled = 1');
    const rows = stmt.all() as any[];
    return rows.map(this.mapRow);
  }

  private static mapRow(row: any): Channel {
    return {
      id: row.id,
      url: row.url,
      platform: row.platform,
      name: row.name,
      autoRecord: row.auto_record === 1,
      quality: row.quality,
      enabled: row.enabled === 1,
      lastChecked: row.last_checked,
      isLive: row.is_live === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

