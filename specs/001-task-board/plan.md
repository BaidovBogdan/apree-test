# Implementation Plan: Apree Workspace

**Branch**: local checkout | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

## Summary

Одна доска, Next.js UI и отдельный NestJS API с PostgreSQL. Общие Zod-контракты исключают расхождение валидации. Данные изменяются с проверкой версии; серверное состояние хранится в React Query. Архитектура — [System Design](../../docs/architecture/system-design.md), визуальный контракт — [дизайн-система](../../docs/design/design-system.md).

## Technical Context

**Language/Version**: TypeScript strict, Node.js 24 LTS.
**Primary Dependencies**: Next.js 16, React 19, Material UI 7, NestJS 12, node-postgres, Zod 4, TanStack Query 5, dnd-kit core 6.
**Storage**: PostgreSQL 17, SQL migrations, persistent Docker volume.
**Testing**: node:test с реальным PostgreSQL для API, unit contracts; браузерные проверки Playwright CLI.
**Target Platform**: современные desktop/mobile браузеры, локальная Windows-разработка; Docker для полного запуска.
**Project Type**: web application, npm workspaces.
**Performance Goals**: одна выборка на загрузку, один атомарный SQL на изменение, нет N+1; измерить локальную latency.
**Constraints**: шесть часов, без аккаунтов и realtime; публичные исходники и бесплатная демоверсия отдельно разрешены пользователем.
**Scale/Scope**: 1000 задач, 20 активных пользователей — проектная оценка.

## Constitution Check

До и после проектирования: согласование получено; спецификация проверяема; только необходимые зависимости; BDD сценарии связаны с API/browser проверками; для конфликтов и валидации сначала наблюдать красные тесты; после реализации независимые read-only ревью. Пользователь отдельно поручил публикацию исходников в GitHub и бесплатную демоверсию Netlify + Render + Neon.

## Project Structure

```text
apps/api/src/       bootstrap, tasks module, database provider, error filter
apps/api/test/      integration scenarios against PostgreSQL
apps/web/src/       app shell, theme, board, task dialogs, API client
packages/contracts/src/ shared Zod schemas and types
database/migrations/    ordered SQL migrations
scripts/                migrations, optional seed, local process launcher
specs/001-task-board/   spec, plan, research, model, contracts, tasks, quickstart
docs/                   system design, design system, ADR, research, delivery
```

## Implementation Phases

1. Workspace, shared contracts and failing validation tests.
2. PostgreSQL migration + API integration tests, then implementation.
3. Brand theme and working board/dialogs, drag and menu movement.
4. Failure/empty/mobile flows, search/filter.
5. Typecheck, build, API/browser checks, three reviews, fixes, convergence.

## Complexity Tracking

Нарушений конституции нет. ORM, Redis, очереди и WebSocket не нужны для согласованной задачи. Отдельный backend обусловлен заданным стеком, общий контракт — реальной границей UI/API.
