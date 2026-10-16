'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragCancelEvent, DragEndEvent, DragStartEvent, DropAnimationFunction } from '@dnd-kit/core';
import { statuses, type Status, type Task } from '@apree/contracts';

const dropDuration = 180;
type Drop = { animation?: Animation; fallback?: ReturnType<typeof setTimeout> };

export function useBoardDrag(items: Task[], move: (task: Task, status: Status) => void, reducedMotion: boolean) {
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

  function settle(id: string) {
    const drop: Drop = {};
    currentDrop.current = drop;
    setLandingId(id);
    setActiveTask(null);
    drop.fallback = setTimeout(() => finish(drop), (reducedMotion ? 0 : dropDuration * 2) + 200);
  }

  function end(event: DragEndEvent) {
    const task = items.find((item) => item.id === event.active.id);
    const target = event.over?.id;
    settle(String(event.active.id));
    if (task && typeof target === 'string' && statuses.includes(target as Status)) move(task, target as Status);
  }

  function cancel(event: DragCancelEvent) {
    settle(String(event.active.id));
  }

  const dropAnimation = useCallback<DropAnimationFunction>(async ({ active, dragOverlay, draggableNodes }) => {
    const drop = currentDrop.current;
    if (!drop) return;
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!mounted.current || currentDrop.current !== drop || !dragOverlay.node.isConnected) return;
      const origin = dragOverlay.node.getBoundingClientRect();
      let translate = '0px 0px';
      for (let pass = 0; pass < 2; pass++) {
        const targetRect = draggableNodes.get(active.id)?.node.current?.getBoundingClientRect();
        const destination = targetRect && targetRect.width > 0 && targetRect.height > 0
          ? `${targetRect.left - origin.left}px ${targetRect.top - origin.top}px`
          : null;
        if (pass > 0 && destination === translate) break;
        drop.animation = dragOverlay.node.animate([
          { translate, opacity: 1 },
          { translate: destination ?? translate, opacity: destination ? 1 : 0 },
        ], {
          duration: reducedMotion ? 0 : dropDuration,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'forwards',
        });
        await drop.animation.finished.catch(() => undefined);
        if (!mounted.current || currentDrop.current !== drop || !destination) break;
        translate = destination;
      }
    } catch {
      return;
    } finally {
      finish(drop);
    }
  }, [reducedMotion, finish]);

  return { activeTask, landingId, start, end, cancel, dropAnimation };
}
