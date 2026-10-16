import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTask, Task, UpdateTask } from '@apree/contracts';
import { Database } from './database';

type TaskRow = Omit<Task, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date };
const columns = 'id, title, description, priority, status, version, created_at AS "createdAt", updated_at AS "updatedAt"';
const limit = 1000;

function serialize(row: TaskRow): Task {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

@Injectable()
export class TasksService {
  constructor(private readonly database: Database) {}

  async list() {
    const result = await this.database.pool.query<TaskRow>(`SELECT ${columns} FROM tasks ORDER BY created_at DESC, id DESC LIMIT $1`, [limit + 1]);
    return { items: result.rows.slice(0, limit).map(serialize), limitReached: result.rows.length > limit };
  }

  async find(id: string) {
    const result = await this.database.pool.query<TaskRow>(`SELECT ${columns} FROM tasks WHERE id = $1`, [id]);
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Задача не найдена');
    return serialize(row);
  }

  async create(data: CreateTask) {
    const result = await this.database.pool.query<TaskRow>(
      `INSERT INTO tasks (id, title, description, priority, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING ${columns}`,
      [data.id, data.title, data.description, data.priority, data.status],
    );
    const row = result.rows[0];
    if (!row) throw new ConflictException('Задача с этим идентификатором уже существует');
    return serialize(row);
  }

  async update(id: string, data: UpdateTask) {
    const result = await this.database.pool.query<TaskRow>(
      `UPDATE tasks SET title = COALESCE($3, title), description = COALESCE($4, description), priority = COALESCE($5, priority), status = COALESCE($6, status), version = version + 1, updated_at = clock_timestamp() WHERE id = $1 AND version = $2 RETURNING ${columns}`,
      [id, data.version, data.title, data.description, data.priority, data.status],
    );
    const row = result.rows[0];
    if (!row) return this.throwMissingOrConflict(id);
    return serialize(row);
  }

  async remove(id: string, version: number) {
    const result = await this.database.pool.query('DELETE FROM tasks WHERE id = $1 AND version = $2', [id, version]);
    if (result.rowCount === 0) await this.throwMissingOrConflict(id);
  }

  private async throwMissingOrConflict(id: string): Promise<never> {
    await this.find(id);
    throw new ConflictException('Задача уже изменена. Загрузите актуальную версию');
  }
}
