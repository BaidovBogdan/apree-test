import type { Priority, Status } from '@apree/contracts';

export const statusLabels: Record<Status, string> = { new: 'Новая', in_progress: 'В работе', done: 'Готово' };
export const statusDescriptions: Record<Status, string> = { new: 'Идеи и входящие', in_progress: 'Сейчас в фокусе', done: 'Завершённые задачи' };
export const priorityLabels: Record<Priority, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
export const priorityColors: Record<Priority, string> = { low: '#8FC9EA', medium: '#F0C477', high: '#FF73CF' };
export const dateFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
