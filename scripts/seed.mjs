import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const url = new URL(process.env.DATABASE_URL);
if (!['127.0.0.1', 'localhost', 'db'].includes(url.hostname) || !/apree|test/.test(url.pathname)) throw new Error('Seed is allowed only for a local apree/test database');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
const tasks = [
  ['00000000-0000-4000-8000-000000000101', 'Собрать идеи для следующего релиза', 'Зафиксировать предложения команды и определить, что принесёт больше пользы в ближайшем цикле.', 'high', 'new'],
  ['00000000-0000-4000-8000-000000000102', 'Обновить базу знаний команды', 'Собрать актуальные инструкции и убрать устаревшие материалы из общего пространства.', 'medium', 'new'],
  ['00000000-0000-4000-8000-000000000103', 'Подготовить контент-план на неделю', 'Согласовать темы, форматы и последовательность публикаций.', 'medium', 'new'],
  ['00000000-0000-4000-8000-000000000104', 'Настроить отчёт по источникам трафика', 'Объединить ключевые показатели в одном отчёте. Проверить корректность данных и подписей.', 'high', 'in_progress'],
  ['00000000-0000-4000-8000-000000000105', 'Упростить процесс онбординга', 'Обновить список первых шагов, чтобы новый участник мог быстрее включиться в работу.', 'low', 'in_progress'],
  ['00000000-0000-4000-8000-000000000106', 'Согласовать приоритеты команды', 'Определены основные направления работы на ближайший цикл.', 'medium', 'done'],
];
const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const data of tasks) await client.query('INSERT INTO tasks (id,title,description,priority,status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', data);
  await client.query('COMMIT');
  process.stdout.write('Local sample tasks are ready. Existing tasks were preserved.\n');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
