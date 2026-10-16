'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { IconButton, Menu, MenuItem, Divider, Tooltip } from '@mui/material';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import { statuses, type Status, type Task } from '@apree/contracts';
import { dateFormat, statusLabels } from '../lib/labels';
import { PriorityChip } from './priority-chip';

type Props = {
  task: Task;
  busy: boolean;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, status: Status) => void;
};

function CardContent({ task, menu, handle, onOpen }: { task: Task; menu: React.ReactNode; handle?: React.ReactNode; onOpen?: () => void }) {
  return <>
    <div className="card-top"><PriorityChip priority={task.priority} />{menu}</div>
    {onOpen ? <button className="card-title" onClick={onOpen}>{task.title}</button> : <div className="card-title">{task.title}</div>}
    {task.description && <p className="card-description">{task.description}</p>}
    <div className="card-bottom"><time dateTime={task.createdAt}>Создана {dateFormat.format(new Date(task.createdAt))}</time>{handle}</div>
  </>;
}

export function TaskCardPreview({ task }: { task: Task }) {
  return <article className="task-card drag-preview" aria-hidden="true"><CardContent task={task} menu={<span className="card-menu-placeholder"><MoreHorizRounded fontSize="small" /></span>} handle={<span className="card-menu-placeholder"><DragIndicatorRounded fontSize="small" /></span>} /></article>;
}

export function TaskCard({ task, busy, onOpen, onEdit, onDelete, onMove }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: task.id, disabled: busy });
  const select = (action: () => void) => { setAnchor(null); action(); };
  return <article ref={setNodeRef} className={`task-card ${isDragging ? 'dragging' : ''}`} aria-busy={busy}>
    <CardContent task={task} onOpen={() => onOpen(task)} menu={<IconButton size="small" aria-label={`Действия: ${task.title}`} disabled={busy} onClick={(event) => setAnchor(event.currentTarget)}><MoreHorizRounded fontSize="small" /></IconButton>} handle={<Tooltip title="Перетащить задачу" disableHoverListener={busy}><span><IconButton {...attributes} {...listeners} tabIndex={-1} ref={setActivatorNodeRef} className="drag-handle" aria-label={`Перетащить: ${task.title}`} disabled={busy} size="small"><DragIndicatorRounded fontSize="small" /></IconButton></span></Tooltip>} />
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      <MenuItem onClick={() => select(() => onOpen(task))}>Открыть задачу</MenuItem>
      <MenuItem onClick={() => select(() => onEdit(task))} disabled={busy}>Редактировать</MenuItem>
      <Divider />
      {statuses.map((status) => <MenuItem key={status} disabled={busy || task.status === status} onClick={() => select(() => onMove(task, status))}><span className={`status-dot ${status}`} />{statusLabels[status]}{task.status === status && <CheckRounded sx={{ fontSize: 16, ml: 'auto' }} />}</MenuItem>)}
      <Divider /><MenuItem sx={{ color: 'error.main' }} disabled={busy} onClick={() => select(() => onDelete(task))}>Удалить задачу</MenuItem>
    </Menu>
  </article>;
}
