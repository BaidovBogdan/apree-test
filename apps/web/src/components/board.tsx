'use client';

import { useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Skeleton, Snackbar, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import { priorities, statuses, type CreateTask, type Priority, type Status, type Task, type UpdateTask } from '@apree/contracts';
import { api, ApiError, errorMessage } from '../lib/api';
import { createStatusMoves } from '../lib/status-moves';
import { priorityLabels, statusDescriptions, statusLabels } from '../lib/labels';
import { TaskCard, TaskCardPreview } from './task-card';
import { TaskDialog } from './task-dialog';
import { useBoardDrag } from '../lib/use-board-drag';

type TaskList = { items: Task[]; limitReached: boolean };
type Action = { kind: 'create'; data: CreateTask } | { kind: 'update'; task: Task; data: Omit<UpdateTask, 'version'> } | { kind: 'delete'; task: Task };
type OpenDialog = { mode: 'create'; status: Status } | { mode: 'view' | 'edit'; task: Task; status: Status };

function AnimatedSection({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) {
  const present = useIsPresent();
  return <motion.div className="board-transition" inert={!present} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}>{children}</motion.div>;
}

function Column({ status, children, count, total, active, onAdd, busy }: { status: Status; children: React.ReactNode; count: number; total: number; active: boolean; onAdd: () => void; busy: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return <section ref={setNodeRef} aria-label={`Колонка ${statusLabels[status]}`} className={`board-column ${active ? 'mobile-active' : ''} ${isOver ? 'drop-target' : ''}`}>
    <header className="column-heading"><div><div className="column-title"><span className={`status-dot ${status}`} /><Typography component="h2" variant="h2">{statusLabels[status]}</Typography><span className="column-count">{count === total ? total : `${count}/${total}`}</span></div><p>{statusDescriptions[status]}</p></div><Tooltip title={`Добавить в «${statusLabels[status]}»`} disableHoverListener={busy}><span><IconButton aria-label={`Добавить в ${statusLabels[status]}`} onClick={onAdd} disabled={busy}><AddRounded fontSize="small" /></IconButton></span></Tooltip></header>
    <div className="column-cards">{children}</div>
    <Button className="column-add" color="inherit" startIcon={<AddRounded />} onClick={onAdd} disabled={busy}>Добавить задачу</Button>
  </section>;
}

export function Board() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<Status>('new');
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const guard = useRef(false);
  const mounted = useRef(true);
  const navigation = useRef<{ taskId?: string }>({});
  const rollback = useRef<{ taskId: string; navigation: object } | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<ReadonlyMap<string, Status>>(new Map());
  const [moves] = useState(() => createStatusMoves({
    save: (task, status) => api.update(task, { status }),
    onStart: () => { void client.cancelQueries({ queryKey: ['tasks'] }); },
    onChange: (statuses) => { if (mounted.current) setPendingStatuses(statuses); },
    onSaved: (saved) => {
      client.setQueryData<TaskList>(['tasks'], (old) => old && ({ ...old, items: old.items.map((task) => task.id === saved.id && task.version <= saved.version ? saved : task) }));
    },
    onComplete: (task) => { if (mounted.current) setNotice({ text: `Задача перемещена в «${statusLabels[task.status]}»`, error: false }); },
    onError: (error, task) => {
      if (!mounted.current) return;
      const message = error instanceof ApiError && error.status === 409 ? 'Задача изменилась в другой сессии. Доска обновлена.' : errorMessage(error);
      setNotice({ text: `Не удалось сохранить перенос. Показан последний сохранённый статус. ${message}`, error: true });
      if (navigation.current.taskId === task.id) {
        rollback.current = { taskId: task.id, navigation: navigation.current };
        setActiveStatus(task.status);
      }
    },
    onIdle: () => { void client.invalidateQueries({ queryKey: ['tasks'] }); },
  }));
  const savingMoves = pendingStatuses.size > 0;
  const query = useQuery({ queryKey: ['tasks'], queryFn: ({ signal }) => api.list(signal), enabled: !savingMoves, retry: process.env.NEXT_PUBLIC_API_WAKEUP === 'true' ? false : 1 });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const failed = rollback.current;
    if (!failed || savingMoves || query.isFetching) return;
    rollback.current = null;
    if (navigation.current !== failed.navigation) return;
    const task = query.data?.items.find((item) => item.id === failed.taskId);
    if (task) setActiveStatus(task.status);
  }, [query.data, query.isFetching, savingMoves]);
  useEffect(() => {
    if (!savingMoves) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [savingMoves]);
  const reducedMotion = Boolean(useReducedMotion());
  const desktop = useMediaQuery('(min-width:900px)');
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }));
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      if (action.kind === 'create') return api.create(action.data);
      if (action.kind === 'update') return api.update(action.task, action.data);
      return api.remove(action.task);
    },
    onMutate: async () => { await client.cancelQueries({ queryKey: ['tasks'] }); },
    onSuccess: (result, action) => {
      client.setQueryData<TaskList>(['tasks'], (old) => {
        if (!old) return old;
        let items = old.items;
        if (action.kind === 'delete') items = items.filter((task) => task.id !== action.task.id);
        else if (result) {
          items = [result, ...items.filter((task) => task.id !== result.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
        }
        return { items: items.slice(0, 1000), limitReached: old.limitReached || items.length > 1000 };
      });
    },
    onSettled: () => { void client.invalidateQueries({ queryKey: ['tasks'] }); },
  });
  const items = (query.data?.items ?? []).map((task) => pendingStatuses.has(task.id) ? { ...task, status: pendingStatuses.get(task.id)! } : task);
  const drag = useBoardDrag(items, move, reducedMotion);
  const busy = mutation.isPending || drag.landingId !== null;
  const motionLocked = drag.activeTask !== null || drag.landingId !== null;
  const normalizedSearch = search.trim().toLocaleLowerCase('ru');
  const filtered = items.filter((task) => (priority === 'all' || task.priority === priority) && (!normalizedSearch || `${task.title}\n${task.description}`.toLocaleLowerCase('ru').includes(normalizedSearch)));
  const filtering = Boolean(normalizedSearch) || priority !== 'all';
  const noResults = items.length > 0 && filtered.length === 0;
  const groups: Record<Status, Task[]> = { new: [], in_progress: [], done: [] };
  const totals: Record<Status, number> = { new: 0, in_progress: 0, done: 0 };
  for (const task of items) totals[task.status]++;
  for (const task of filtered) groups[task.status].push(task);

  async function perform(action: Action) {
    if (guard.current) throw new Error('Дождитесь завершения предыдущего действия.');
    if (action.kind !== 'create' && moves.isPending(action.task.id)) throw new ApiError('Статус задачи ещё сохраняется. Попробуйте через мгновение.', 409);
    guard.current = true;
    try { return await mutation.mutateAsync(action); }
    finally { guard.current = false; }
  }

  function move(task: Task, status: Status) {
    if (task.status === status || guard.current) return;
    navigation.current = { taskId: task.id };
    setActiveStatus(status);
    moves.move(task, status);
  }

  function openDelete(task: Task) {
    if (moves.isPending(task.id)) return;
    setDeleteError('');
    setDeleteTask(task);
  }

  async function remove() {
    if (!deleteTask || guard.current) return;
    try {
      await perform({ kind: 'delete', task: deleteTask });
      setDeleteTask(null);
      setDialog(null);
      setNotice({ text: 'Задача удалена', error: false });
    } catch (error) { setDeleteError(errorMessage(error)); }
  }

  function resetFilters() { setSearch(''); setPriority('all'); }

  return <>
    <header className="app-header"><div className="header-inner"><div className="brand"><img src="/brand/mark.svg" alt="" width="38" height="36" /><img src="/brand/word.svg" alt="Apree Team" width="58" height="32" /><span className="brand-divider" /><span className="workspace-label">Workspace</span></div><span className="shared-label"><GroupOutlined sx={{ fontSize: 17 }} />Общая доска</span></div></header>
    <main className={`workspace${motionLocked ? ' drag-settling' : ''}`}>
      <section className="board-intro"><div><div className="workspace-context"><span className="context-icon"><ViewKanbanOutlined sx={{ fontSize: 15 }} /></span>Рабочее пространство</div><Typography variant="h1" component="h1">Доска задач<span className="heading-period">.</span></Typography><p className="intro-copy">От первой идеи до готового результата.</p></div><Button variant="contained" startIcon={<AddRounded />} className="create-button" disabled={busy} onClick={() => setDialog({ mode: 'create', status: activeStatus })}>Новая задача</Button></section>
      <div className="board-toolbar"><div className="toolbar-filters"><TextField disabled={motionLocked} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по задачам" size="small" className="search-input" slotProps={{ htmlInput: { 'aria-label': 'Поиск по задачам', maxLength: 5000 }, input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>, endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label="Очистить поиск" onClick={() => setSearch('')}><CloseRounded sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : undefined } }} />
      <TextField disabled={motionLocked} select size="small" label="Приоритет" value={priority} onChange={(event) => setPriority(event.target.value as Priority | 'all')} className="priority-filter"><MenuItem value="all">Все приоритеты</MenuItem>{priorities.map((value) => <MenuItem key={value} value={value}>{priorityLabels[value]}</MenuItem>)}</TextField>{filtering && <Button color="inherit" size="small" disabled={motionLocked} onClick={resetFilters}>Сбросить</Button>}</div>
      <div className="board-summary"><span>{filtering ? `Найдено ${filtered.length} из ${items.length}` : `Всего задач: ${items.length}`}</span><Tooltip title="Обновить доску" disableHoverListener={query.isFetching || busy}><span><IconButton aria-label="Обновить доску" onClick={() => void query.refetch()} disabled={query.isFetching || busy || savingMoves}>{query.isFetching ? <CircularProgress size={17} color="inherit" /> : <RefreshRounded sx={{ fontSize: 20 }} />}</IconButton></span></Tooltip></div></div>
      {query.isError && <Alert severity="error" className="board-alert" action={<Button color="inherit" size="small" disabled={query.isFetching || savingMoves} onClick={() => void query.refetch()}>Повторить</Button>}>{query.data ? 'Не удалось обновить доску. Показаны последние загруженные задачи.' : errorMessage(query.error)}</Alert>}
      {query.data?.limitReached && <Alert severity="warning" className="board-alert">Показаны последние 1000 задач. Более ранние задачи не загружены.</Alert>}
      {query.isPending ? <div className="board-grid" aria-label="Загрузка задач" aria-busy="true">{statuses.map((status) => <div key={status} className={`board-column skeleton-column ${status === activeStatus ? 'mobile-active' : ''}`}><Skeleton width="55%" height={40} />{[0, 1].map((n) => <Skeleton key={n} variant="rounded" height={150} sx={{ mt: 2 }} />)}</div>)}</div> : query.data && <>
        {items.length === 0 && <div className="welcome-empty"><span className="empty-icon"><ViewKanbanOutlined /></span><div><h2>Большие дела начинаются с первой задачи</h2><p>Добавьте то, над чем команда будет работать дальше.</p></div><Button color="primary" endIcon={<ArrowForwardRounded />} onClick={() => setDialog({ mode: 'create', status: 'new' })}>Создать задачу</Button></div>}
        <LayoutGroup id="task-board"><AnimatePresence initial={false} mode="wait">
        {noResults ? <AnimatedSection key="no-results" reducedMotion={reducedMotion}><div className="filter-empty"><SearchRounded /><h2>Задачи не найдены</h2><p>Попробуйте другой запрос или сбросьте фильтры.</p><Button onClick={resetFilters}>Сбросить фильтры</Button></div></AnimatedSection> : <AnimatedSection key="board" reducedMotion={reducedMotion}>
        <Tabs value={activeStatus} onChange={(_event, value: Status) => { navigation.current = {}; setActiveStatus(value); }} variant="fullWidth" className="mobile-tabs" aria-label="Статус задач">{statuses.map((status) => <Tab key={status} value={status} label={`${statusLabels[status]} ${groups[status].length}`} />)}</Tabs>
        <DndContext sensors={sensors} onDragStart={drag.start} onDragEnd={drag.end} onDragCancel={drag.cancel} accessibility={{ screenReaderInstructions: { draggable: 'Используйте меню задачи для перемещения между колонками.' } }}><div className="board-grid">{statuses.map((status) => <Column key={status} status={status} count={groups[status].length} total={totals[status]} active={status === activeStatus} busy={busy} onAdd={() => setDialog({ mode: 'create', status })}>
          {groups[status].length > 0 ? groups[status].map((task) => {
            const manualMove = drag.activeTask?.id === task.id || drag.landingId === task.id;
            return <motion.div key={task.id} layout={reducedMotion || manualMove ? false : 'position'} layoutId={reducedMotion || manualMove || !desktop ? undefined : task.id} className="task-motion" style={{ visibility: drag.landingId === task.id ? 'hidden' : undefined }} transition={{ layout: { duration: reducedMotion ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] } }}><TaskCard task={task} busy={busy} saving={pendingStatuses.has(task.id)} onOpen={(selected) => setDialog({ mode: 'view', task: selected, status: selected.status })} onEdit={(selected) => setDialog({ mode: 'edit', task: selected, status: selected.status })} onDelete={openDelete} onMove={(selected, target) => void move(selected, target)} /></motion.div>;
          }) : <div className="column-empty">{status === 'done' ? <CheckCircleOutlineRounded /> : <span className={`empty-status ${status}`} />}<span>{filtering ? 'Нет подходящих задач' : status === 'new' ? 'Место для новых идей' : status === 'in_progress' ? 'Пока ничего в работе' : 'Здесь будут ваши результаты'}</span></div>}
        </Column>)}</div><DragOverlay dropAnimation={drag.dropAnimation} zIndex={1200} className="task-drag-overlay">{drag.activeTask ? <TaskCardPreview task={drag.activeTask} /> : null}</DragOverlay></DndContext>
        </AnimatedSection>}
        </AnimatePresence></LayoutGroup>
      </>}
      <footer className="board-footer"><span>Apree Workspace</span><span>Идеи. Действия. Результат.</span></footer>
    </main>
    {dialog && <TaskDialog key={dialog.mode === 'create' ? `create-${dialog.status}` : `${dialog.task.id}-${dialog.mode}`} mode={dialog.mode} task={dialog.mode === 'create' ? undefined : dialog.task} initialStatus={dialog.status} onClose={() => setDialog(null)} onDelete={openDelete} onSave={async (data, task) => {
      if (task) await perform({ kind: 'update', task, data: { title: data.title, description: data.description, priority: data.priority, status: data.status } });
      else await perform({ kind: 'create', data });
      navigation.current = {};
      setActiveStatus(data.status);
      setNotice({ text: task ? 'Изменения сохранены' : 'Задача создана', error: false });
    }} />}
    <Dialog open={Boolean(deleteTask)} onClose={() => { if (!busy) setDeleteTask(null); }} fullWidth maxWidth="xs" aria-labelledby="delete-title"><DialogTitle id="delete-title">Удалить задачу?</DialogTitle><DialogContent><p className="delete-task-name">{deleteTask?.title}</p><Typography variant="body2" color="text.secondary">Восстановить задачу после удаления не получится.</Typography>{deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}</DialogContent><DialogActions><Button color="inherit" disabled={busy} onClick={() => setDeleteTask(null)}>Отмена</Button><Button color="error" variant="contained" disabled={busy} onClick={() => void remove()}>{busy ? 'Удаляем…' : 'Удалить'}</Button></DialogActions></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={notice?.error ? null : 4000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={notice?.error ? 'error' : 'success'} onClose={() => setNotice(null)} variant="filled" sx={{ maxWidth: 560 }}>{notice?.text}</Alert></Snackbar>
    <div className="sr-only" role="status" aria-live="polite">{notice?.text ?? ''}</div>
  </>;
}
