import type { Status, Task } from '@apree/contracts';

type PendingMove = { task: Task; status: Status };
type Options = {
  save: (task: Task, status: Status) => Promise<Task>;
  onStart: () => void;
  onChange: (statuses: ReadonlyMap<string, Status>) => void;
  onSaved: (task: Task) => void;
  onComplete: (task: Task) => void;
  onError: (error: unknown, task: Task) => void;
  onIdle: () => void;
};

export function createStatusMoves(options: Options) {
  const pending = new Map<string, PendingMove>();
  const publish = () => options.onChange(new Map([...pending].map(([id, move]) => [id, move.status])));

  async function save(move: PendingMove) {
    try {
      while (move.task.status !== move.status) {
        move.task = await options.save(move.task, move.status);
        options.onSaved(move.task);
      }
      pending.delete(move.task.id);
      publish();
      options.onComplete(move.task);
    } catch (error) {
      pending.delete(move.task.id);
      publish();
      options.onError(error, move.task);
    } finally {
      if (pending.size === 0) options.onIdle();
    }
  }

  return {
    isPending: (id: string) => pending.has(id),
    move(task: Task, status: Status) {
      const existing = pending.get(task.id);
      if (existing) {
        existing.status = status;
        publish();
        return;
      }
      if (task.status === status) return;
      const entry = { task, status };
      pending.set(task.id, entry);
      options.onStart();
      publish();
      void save(entry);
    },
  };
}
