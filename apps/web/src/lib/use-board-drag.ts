'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragCancelEvent, DragEndEvent, DragStartEvent, DropAnimationFunction } from '@dnd-kit/core';
import { statuses, type Status, type Task } from '@apree/contracts';

const dropDuration = 280;
type Drop = { pending: Promise<void>; animation?: Animation; fallback?: ReturnType<typeof setTimeout> };

export function useBoardDrag(items: Task[], move: (task: Task, status: Status) => Promise<void>, reducedMotion: boolean) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [landingId, setLandingId] = useState<string | null>(null);
  const currentDrop = useRef<Drop | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (currentDrop.current) {
        clearTimeout(currentDrop.current.fallback);
        currentDrop.current.animation?.cancel();
        currentDrop.current = null;
      }
    };
  }, []);

  function start(event: DragStartEvent) {
    setActiveTask(items.find((task) => task.id === event.active.id) ?? null);
  }

  const finish = useCallback((drop: Drop) => {
    clearTimeout(drop.fallback);
    if (drop.animation?.playState === 'running') drop.animation.cancel();
    if (currentDrop.current !== drop) return;
    currentDrop.current = null;
    if (mounted.current) setLandingId(null);
  }, []);

  function settle(id: string, pending: Promise<void>) {
    const drop: Drop = { pending: pending.catch(() => undefined) };
    currentDrop.current = drop;
    setLandingId(id);
    setActiveTask(null);
    void drop.pending.then(() => {
      if (currentDrop.current !== drop) return;
      drop.fallback = setTimeout(() => finish(drop), (reducedMotion ? 0 : dropDuration) + 200);
    });
  }

  function end(event: DragEndEvent) {
    const task = items.find((item) => item.id === event.active.id);
    const target = event.over?.id;
    const pending = task && typeof target === 'string' && statuses.includes(target as Status)
      ? move(task, target as Status)
      : Promise.resolve();
    settle(String(event.active.id), pending);
  }

  function cancel(event: DragCancelEvent) {
    settle(String(event.active.id), Promise.resolve());
  }

  const dropAnimation = useCallback<DropAnimationFunction>(async ({ active, dragOverlay, draggableNodes }) => {
    const drop = currentDrop.current;
    if (!drop) return;
    try {
      await drop.pending;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!mounted.current || currentDrop.current !== drop || !dragOverlay.node.isConnected) return;
      const target = draggableNodes.get(active.id)?.node.current;
      const targetRect = target?.getBoundingClientRect();
      const overlayRect = dragOverlay.node.getBoundingClientRect();
      const keyframes = targetRect && targetRect.width > 0 && targetRect.height > 0
        ? [{ translate: '0px 0px', opacity: 1 }, { translate: `${targetRect.left - overlayRect.left}px ${targetRect.top - overlayRect.top}px`, opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0 }];
      drop.animation = dragOverlay.node.animate(keyframes, {
        duration: reducedMotion ? 0 : dropDuration,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'forwards',
      });
      await drop.animation.finished.catch(() => undefined);
    } catch {
      return;
    } finally {
      finish(drop);
    }
  }, [reducedMotion, finish]);

  return { activeTask, landingId, start, end, cancel, dropAnimation };
}
