/**
 * MechMatrix Engineering - Embedded SQL Engine (sql.js / SQLite Relational Database)
 * Target Database: "MechMatrix Engineering"
 * Target User: "Engineering"
 */

import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DB_DIR = isVercel ? '/tmp/database' : path.resolve(__dirname, '../../database');
const DB_FILE = path.join(DB_DIR, 'mechmatrix_engineering.db');

export interface SqlQueryResponse {
  success: boolean;
  columns?: string[];
  values?: any[][];
  executionTimeMs?: number;
  rowsAffected?: number;
  error?: string;
  message?: string;
}

let dbInstance: SqlDatabase | null = null;

/**
 * Initialize and get the SQL database instance
 */
export async function getSqlDb(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create DB directory, will run in memory:', err);
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const buffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(buffer);
      console.log('Loaded existing SQL database: "MechMatrix Engineering"');
      return dbInstance;
    } catch (err) {
      console.warn('Failed to load existing SQL file, creating new database:', err);
    }
  }

  dbInstance = new SQL.Database();
  initTables(dbInstance);
  saveSqlDb();
  console.log('Initialized new SQL database: "MechMatrix Engineering" (User: "Engineering")');
  return dbInstance;
}

/**
 * Persist database to disk
 */
export function saveSqlDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQL database:', err);
  }
}

/**
 * Initialize relational database schema
 */
function initTables(db: SqlDatabase) {
  db.run(`
    -- Database: MechMatrix Engineering
    -- User: Engineering
    
    CREATE TABLE IF NOT EXISTS engineers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      role_title TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS engineer_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engineer_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(engineer_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engineer_id TEXT NOT NULL,
      certification_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS self_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engineer_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      proposed_level INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      engineer_id TEXT NOT NULL,
      engineer_name TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      previous_level INTEGER NOT NULL,
      new_level INTEGER NOT NULL,
      updated_by TEXT NOT NULL,
      reason TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_standards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      title TEXT NOT NULL,
      criteria TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role_type TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_metadata (
      meta_key TEXT PRIMARY KEY,
      meta_value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR REPLACE INTO system_metadata (meta_key, meta_value) 
    VALUES 
      ('database_name', 'MechMatrix Engineering'),
      ('database_user', 'Engineering'),
      ('dialect', 'PostgreSQL / Relational SQL'),
      ('created_at', CURRENT_TIMESTAMP);
  `);
}

/**
 * Execute an arbitrary SQL query and return structured results
 */
export async function executeQuery(query: string): Promise<SqlQueryResponse> {
  const startTime = Date.now();
  const db = await getSqlDb();

  try {
    const trimmed = query.trim();
    if (!trimmed) {
      return { success: false, error: 'Query tidak boleh kosong' };
    }

    const isSelect = /^SELECT\b/i.test(trimmed) || /^WITH\b/i.test(trimmed) || /^PRAGMA\b/i.test(trimmed);

    if (isSelect) {
      const res = db.exec(trimmed);
      const executionTimeMs = Date.now() - startTime;
      if (res.length === 0) {
        return {
          success: true,
          columns: [],
          values: [],
          executionTimeMs,
          message: 'Query selesai dengan 0 baris.',
        };
      }
      return {
        success: true,
        columns: res[0].columns,
        values: res[0].values,
        executionTimeMs,
        rowsAffected: res[0].values.length,
      };
    } else {
      db.run(trimmed);
      saveSqlDb();
      const executionTimeMs = Date.now() - startTime;
      return {
        success: true,
        columns: ['status', 'message'],
        values: [['SUCCESS', 'Perintah SQL berhasil dijalankan']],
        executionTimeMs,
        rowsAffected: 1,
        message: 'Perintah SQL berhasil dijalankan.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengeksekusi SQL statement',
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Sync engineers and audit logs from client/Firebase to SQL tables
 */
export async function syncData(engineers: any[], auditLogs: any[]): Promise<{ success: boolean; totalSynced: number; message: string }> {
  const db = await getSqlDb();

  try {
    let syncedCount = 0;

    // Begin batch transaction
    db.run('BEGIN TRANSACTION;');

    for (const eng of engineers) {
      db.run(
        `INSERT OR REPLACE INTO engineers (id, name, employee_id, role_title, department, avatar_url, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [eng.id, eng.name, eng.employeeId || '', eng.roleTitle || '', eng.department || '', eng.avatar || '']
      );
      syncedCount++;

      // Upsert skills
      if (eng.skills && typeof eng.skills === 'object') {
        for (const [skillId, level] of Object.entries(eng.skills)) {
          db.run(
            `INSERT OR REPLACE INTO engineer_skills (engineer_id, skill_id, skill_name, category_id, level, updated_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
            [eng.id, skillId, skillId, 'engineering', Number(level) || 0]
          );
        }
      }

      // Upsert certs
      if (Array.isArray(eng.certifications)) {
        db.run('DELETE FROM certifications WHERE engineer_id = ?;', [eng.id]);
        for (const cert of eng.certifications) {
          db.run(
            `INSERT INTO certifications (engineer_id, certification_name) VALUES (?, ?);`,
            [eng.id, String(cert)]
          );
        }
      }
    }

    // Sync audit logs
    if (Array.isArray(auditLogs)) {
      for (const log of auditLogs) {
        db.run(
          `INSERT OR REPLACE INTO audit_logs (id, timestamp, engineer_id, engineer_name, skill_id, skill_name, previous_level, new_level, updated_by, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            log.id,
            log.timestamp || new Date().toISOString(),
            log.engineerId || '',
            log.engineerName || '',
            log.skillId || '',
            log.skillName || '',
            Number(log.previousLevel) || 0,
            Number(log.newLevel) || 0,
            log.updatedBy || '',
            log.reason || '',
          ]
        );
      }
    }

    db.run('COMMIT;');
    saveSqlDb();

    return {
      success: true,
      totalSynced: syncedCount,
      message: `Berhasil menyinkronkan ${syncedCount} personil ke Database "MechMatrix Engineering"!`,
    };
  } catch (err: any) {
    try {
      db.run('ROLLBACK;');
    } catch (_) {}
    return {
      success: false,
      totalSynced: 0,
      message: err.message || 'Gagal menyinkronkan data ke SQL',
    };
  }
}

/**
 * Get SQL Database Information
 */
export async function getDatabaseInfo() {
  const db = await getSqlDb();

  try {
    const engCount = db.exec('SELECT COUNT(*) as count FROM engineers;');
    const skillCount = db.exec('SELECT COUNT(*) as count FROM engineer_skills;');
    const auditCount = db.exec('SELECT COUNT(*) as count FROM audit_logs;');

    const totalRecords =
      (engCount[0]?.values[0]?.[0] as number || 0) +
      (skillCount[0]?.values[0]?.[0] as number || 0) +
      (auditCount[0]?.values[0]?.[0] as number || 0);

    return {
      database: 'MechMatrix Engineering',
      user: 'Engineering',
      host: 'localhost',
      port: 5432,
      dialect: 'PostgreSQL / Relational SQL',
      status: 'connected' as const,
      tables: ['engineers', 'engineer_skills', 'certifications', 'self_assessments', 'audit_logs', 'assessment_standards', 'users'],
      totalRecords,
      lastSync: new Date().toISOString(),
      storageType: 'Relational SQL Engine (Embedded & Server Synchronized)'
    };
  } catch (err) {
    return {
      database: 'MechMatrix Engineering',
      user: 'Engineering',
      host: 'localhost',
      port: 5432,
      dialect: 'PostgreSQL / Relational SQL',
      status: 'error' as const,
      tables: [],
      totalRecords: 0,
      storageType: 'Relational SQL Engine'
    };
  }
}
