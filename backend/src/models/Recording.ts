import db from '../database';
import { Recording } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RecordingModel {
  static create(data: Omit<Recording, 'id' | 'startedAt'>): Recording {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO recordings (
        id, channel_id, url, platform, title, status, quality, format,
        file_path, file_size, duration, error, started_at, completed_at, uploaded_to_cloud
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.channelId || null,
      data.url,
      data.platform,
      data.title,
      data.status,
      data.quality,
      data.format,
      data.filePath || null,
      data.fileSize || null,
      data.duration || null,
      data.error || null,
      now,
      data.completedAt || null,
      data.uploadedToCloud ? 1 : 0
    );
    
    return this.findById(id)!;
  }

  static findAll(limit?: number): Recording[] {
    let query = 'SELECT * FROM recordings ORDER BY started_at DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = db.prepare(query);
    const rows = stmt.all() as any[];
    return rows.map(this.mapRow);
  }

  static findById(id: string): Recording | undefined {
    const stmt = db.prepare('SELECT * FROM recordings WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRow(row) : undefined;
  }

  static findByStatus(status: Recording['status']): Recording[] {
    const stmt = db.prepare('SELECT * FROM recordings WHERE status = ? ORDER BY started_at DESC');
    const rows = stmt.all(status) as any[];
    return rows.map(this.mapRow);
  }

  static update(id: string, data: Partial<Recording>): Recording | undefined {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.filePath !== undefined) {
      updates.push('file_path = ?');
      values.push(data.filePath);
    }
    if (data.fileSize !== undefined) {
      updates.push('file_size = ?');
      values.push(data.fileSize);
    }
    if (data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(data.duration);
    }
    if (data.error !== undefined) {
      updates.push('error = ?');
      values.push(data.error);
    }
    if (data.completedAt !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completedAt);
    }
    if (data.uploadedToCloud !== undefined) {
      updates.push('uploaded_to_cloud = ?');
      values.push(data.uploadedToCloud ? 1 : 0);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE recordings SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM recordings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM recordings');
    const result = stmt.get() as any;
    return result.count;
  }

  static countByStatus(status: Recording['status']): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM recordings WHERE status = ?');
    const result = stmt.get(status) as any;
    return result.count;
  }

  private static mapRow(row: any): Recording {
    return {
      id: row.id,
      channelId: row.channel_id,
      url: row.url,
      platform: row.platform,
      title: row.title,
      status: row.status,
      quality: row.quality,
      format: row.format,
      filePath: row.file_path,
      fileSize: row.file_size,
      duration: row.duration,
      error: row.error,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      uploadedToCloud: row.uploaded_to_cloud === 1,
    };
  }
}

