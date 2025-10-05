import db from '../database';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export class UserModel {
  static async create(username: string, password: string): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, username, passwordHash, now);
    
    return this.findById(id)!;
  }

  static findById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRow(row) : undefined;
  }

  static findByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    return row ? this.mapRow(row) : undefined;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    stmt.run(passwordHash, id);
  }

  private static mapRow(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }
}

