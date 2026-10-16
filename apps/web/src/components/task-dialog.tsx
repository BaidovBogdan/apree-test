'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, useMediaQuery, useTheme } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { createTaskSchema, priorities, statuses, type CreateTask, type Priority, type Status, type Task } from '@apree/contracts';
import { errorMessage } from '../lib/api';
import { dateFormat, priorityLabels, statusLabels } from '../lib/labels';
import { PriorityChip } from './priority-chip';

type Props = {
  task?: Task;
  initialStatus: Status;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: (data: CreateTask, task?: Task) => Promise<void>;
  onDelete: (task: Task) => void;
};

export function TaskDialog({ task, mode, initialStatus, onClose, onSave, onDelete }: Props) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [editing, setEditing] = useState(mode !== 'view');
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<Status>(task?.status ?? initialStatus);
  const [id] = useState(() => task?.id ?? crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const saving = useRef(false);
  const dirty = editing && (title !== (task?.title ?? '') || description !== (task?.description ?? '') || priority !== (task?.priority ?? 'medium') || status !== (task?.status ?? initialStatus));
  const parsed = createTaskSchema.safeParse({ id, title, description, priority, status });
  const titleError = submitted && (!title.trim() || title.trim().length > 160);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function close() {
    if (saving.current) return;
    if (dirty) setDiscardOpen(true);
    else onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!parsed.success || saving.current) return;
    saving.current = true;
    setPending(true);
    setError('');
    try {
      await onSave(parsed.data, task);
      onClose();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return <>
    <Dialog open onClose={close} fullWidth maxWidth="sm" fullScreen={fullScreen} aria-labelledby="task-dialog-title" slotProps={{ paper: { component: editing ? 'form' : 'section', onSubmit: editing ? submit : undefined } }}>
      <DialogTitle id="task-dialog-title" className="dialog-heading">{editing ? task ? 'Редактировать задачу' : 'Новая задача' : 'Задача'}<IconButton aria-label="Закрыть" onClick={close} disabled={pending}><CloseRounded /></IconButton></DialogTitle>
      <DialogContent>
        {editing ? <div className="task-fields">
          <TextField autoFocus label="Название" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth required disabled={pending} error={Boolean(titleError)} helperText={titleError ? 'Введите название от 1 до 160 символов.' : `${title.length}/160`} slotProps={{ htmlInput: { maxLength: 160 } }} />
          <TextField label="Описание" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth multiline minRows={4} maxRows={10} disabled={pending} helperText={`${description.length}/5000`} slotProps={{ htmlInput: { maxLength: 5000 } }} />
          <div className="field-row"><TextField select label="Приоритет" value={priority} onChange={(event) => setPriority(event.target.value as Priority)} fullWidth disabled={pending}>{priorities.map((value) => <MenuItem key={value} value={value}>{priorityLabels[value]}</MenuItem>)}</TextField>
          <TextField select label="Статус" value={status} onChange={(event) => setStatus(event.target.value as Status)} fullWidth disabled={pending}>{statuses.map((value) => <MenuItem key={value} value={value}>{statusLabels[value]}</MenuItem>)}</TextField></div>
        </div> : task && <div className="task-detail"><div className="detail-meta"><PriorityChip priority={task.priority} /><span className="detail-status"><span className={`status-dot ${task.status}`} />{statusLabels[task.status]}</span></div><h2>{task.title}</h2><p className={task.description ? '' : 'muted'}>{task.description || 'Описание пока не добавлено.'}</p><div className="detail-date">Создана {dateFormat.format(new Date(task.createdAt))} · Обновлена {dateFormat.format(new Date(task.updatedAt))}</div></div>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>{editing ? <><Button color="inherit" onClick={close} disabled={pending}>Отмена</Button><Button type="submit" variant="contained" disabled={pending || (task !== undefined && !dirty)}>{pending ? 'Сохраняем…' : task ? 'Сохранить' : 'Создать задачу'}</Button></> : task && <><Button color="error" onClick={() => onDelete(task)}>Удалить</Button><span className="flex-spacer" /><Button startIcon={<EditOutlined />} variant="outlined" onClick={() => setEditing(true)}>Редактировать</Button></>}</DialogActions>
    </Dialog>
    <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)} maxWidth="xs" fullWidth aria-labelledby="discard-title"><DialogTitle id="discard-title">Закрыть без сохранения?</DialogTitle><DialogContent>Введённые изменения будут потеряны.</DialogContent><DialogActions><Button color="inherit" onClick={() => setDiscardOpen(false)}>Продолжить</Button><Button color="error" onClick={onClose}>Не сохранять</Button></DialogActions></Dialog>
  </>;
}
