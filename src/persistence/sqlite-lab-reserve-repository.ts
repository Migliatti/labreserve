import { DatabaseSync } from 'node:sqlite';
import type { Resource, ResourceCategory, ResourceStatus } from '../domain/resource.js';

function resourceFromRow(row: Record<string, unknown>): Resource {
  const { id, name, category, status } = row;
  if (
    typeof id !== 'string'
    || typeof name !== 'string'
    || (category !== 'LABORATORY' && category !== 'EQUIPMENT')
    || (status !== 'OPERATIONAL' && status !== 'UNAVAILABLE')
  ) {
    throw new Error('Linha de recurso SQLite inválida.');
  }
  return { id, name, category: category as ResourceCategory, status: status as ResourceStatus };
}

export class SqliteLabReserveRepository {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    this.database = new DatabaseSync(path);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL
      ) STRICT;
    `);
    this.database.prepare(`
      INSERT OR IGNORE INTO resources (id, name, category, status)
      VALUES (?, ?, ?, ?)
    `).run('lab-chemistry', 'Laboratório de Química', 'LABORATORY', 'OPERATIONAL');
    this.database.prepare(`
      INSERT OR IGNORE INTO resources (id, name, category, status)
      VALUES (?, ?, ?, ?)
    `).run('equipment-microscope', 'Microscópio', 'EQUIPMENT', 'OPERATIONAL');
  }

  listResources(): Resource[] {
    return this.database.prepare(`
      SELECT id, name, category, status FROM resources
      ORDER BY CASE category WHEN 'LABORATORY' THEN 0 ELSE 1 END, name
    `).all().map(resourceFromRow);
  }

  close(): void {
    this.database.close();
  }
}
