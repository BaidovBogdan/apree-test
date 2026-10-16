import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';

export class Database implements OnApplicationShutdown {
  constructor(readonly pool: Pool) {
    pool.on('error', () => Logger.error('Idle database connection failed', 'Database'));
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

export function createPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
  });
}
