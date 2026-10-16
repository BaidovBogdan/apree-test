import { createTaskSchema, taskListSchema, taskSchema, type CreateTask, type Task, type UpdateTask } from '@apree/contracts';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...options, signal, cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('Нет связи с сервером. Проверьте подключение и попробуйте снова.', 0);
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Проверьте заполненные поля.',
      404: 'Задача уже удалена. Обновите доску.',
      413: 'Слишком много данных. Сократите текст и попробуйте снова.',
      409: 'Задача уже изменена. Доска обновлена; ваши правки остались в форме. Закройте её и откройте актуальную задачу.',
      503: 'Хранилище временно недоступно. Попробуйте снова.',
    };
    throw new ApiError(messages[response.status] ?? 'Не удалось выполнить действие. Попробуйте снова.', response.status);
  }
  if (response.status === 204) return undefined;
  try {
    return await response.json() as unknown;
  } catch {
    throw new ApiError('Сервер вернул некорректный ответ. Обновите доску.', 502);
  }
}

export const api = {
  async list(signal: AbortSignal) {
    return taskListSchema.parse(await request('/tasks', { signal }));
  },
  async create(data: CreateTask) {
    return taskSchema.parse(await request('/tasks', { method: 'POST', body: JSON.stringify(createTaskSchema.parse(data)) }));
  },
  async update(task: Task, data: Omit<UpdateTask, 'version'>) {
    return taskSchema.parse(await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ ...data, version: task.version }) }));
  },
  async remove(task: Task) {
    await request(`/tasks/${task.id}`, { method: 'DELETE', body: JSON.stringify({ version: task.version }) });
  },
};

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Не удалось получить данные. Обновите доску и попробуйте снова.';
}
