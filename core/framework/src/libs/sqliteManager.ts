import { Database } from 'bun:sqlite';
import path from 'node:path';
import { createFileManager } from './fileManager';

export type PerformanceDiagnostic = {
  id?: number;
  timestamp: string;
  type: string; // e.g., 'route', 'ssr', 'api', etc.
  label: string; // e.g., route path or operation
  duration_ms: number;
  meta?: Record<string, unknown>;
};

const ZEHPRA_DIR = path.join(process.cwd(), '.zephra');
const DB_PATH = path.join(ZEHPRA_DIR, 'zephra-internal.sqlite');
const fileManager = createFileManager(ZEHPRA_DIR);

class SQLiteManager {
  private db: Database;

  constructor(filename = DB_PATH) {
    // Ensure .zephra directory exists before DB creation
    fileManager.ensureDir().then(() => {
      this.db = new Database(filename);
      this.init();
    });
    // Fallback for sync DB creation (should be fine if dir already exists)
    this.db = new Database(filename);
    this.init();
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS performance_diagnostics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        meta TEXT
      )
    `);
  }

  insertPerformanceDiagnostic(diag: Omit<PerformanceDiagnostic, 'id'>) {
    this.db.run(
      'INSERT INTO performance_diagnostics (timestamp, type, label, duration_ms, meta) VALUES (?, ?, ?, ?, ?)',
      [
        diag.timestamp,
        diag.type,
        diag.label,
        diag.duration_ms,
        diag.meta ? JSON.stringify(diag.meta) : null
      ]
    );
  }

  getRecentDiagnostics(limit = 50): PerformanceDiagnostic[] {
    return this.db
      .query('SELECT * FROM performance_diagnostics ORDER BY id DESC LIMIT ?')
      .all(limit)
      .map((row: unknown) => {
        const r = row as PerformanceDiagnostic & { meta?: string };
        return {
          ...r,
          meta: r.meta ? JSON.parse(r.meta as string) : undefined,
        };
      });
  }

  deleteDiagnostic(id: number) {
    this.db.run('DELETE FROM performance_diagnostics WHERE id = ?', [id]);
  }

  clearDiagnostics() {
    this.db.run('DELETE FROM performance_diagnostics', []);
  }
}

export const sqliteManager = new SQLiteManager(); 