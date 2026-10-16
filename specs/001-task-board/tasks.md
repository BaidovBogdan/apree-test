# Tasks: Apree Workspace

## Phase 1: Setup

- [x] T001 Настроить npm workspaces и конфигурации TypeScript в package.json, apps/*/tsconfig.json.
- [x] T002 Зафиксировать визуальные ориентиры бренда и источники в docs/design/design-system.md.

## Phase 2: Foundation

- [x] T003 Написать и увидеть провал проверок границ в packages/contracts/test/contracts.test.cjs, затем реализовать packages/contracts/src/index.ts.
- [x] T004 Добавить database/migrations/001_tasks.sql, scripts/migrate.mjs, compose.yaml.
- [x] T005 Настроить bootstrap, pool и обработку ошибок в apps/api/src/.

## Phase 3: US1 — CRUD

- [x] T006 [US1] Написать apps/api/test/tasks.test.ts, подтвердить красную проверку отсутствующего поведения API.
- [x] T007 [US1] Реализовать apps/api/src/tasks.service.ts и tasks.controller.ts; проверить CRUD, валидацию, конфликты и SQL injection.
- [x] T008 [US1] Создать тему, API client и диалоги в apps/web/src/.

## Phase 4: US2 — Перемещение

- [x] T009 [US2] Реализовать доску, карточки, перенос и меню в apps/web/src/components/.
- [x] T010 [US2] Проверить конкурентные PATCH/DELETE в apps/api/test/tasks.test.ts и перенос в браузере.

## Phase 5: US3 — Состояния и поиск

- [x] T011 [US3] Добавить поиск, фильтр, skeleton, error, empty и мобильные вкладки в apps/web/src/components/board.tsx.
- [x] T012 [US3] Проверить 360/390/1440 px, keyboard, потерю сети и формы; записать docs/verification.md.

## Phase 6: Delivery

- [x] T013 Добавить Dockerfile, .github/workflows/ci.yml, README.md, docs/commands.md и docs/delivery.md.
- [x] T014 Выполнить typecheck, tests, build, запуск compose и проверить инструкции.
- [x] T015 Провести три независимых read-only ревью, устранить дефекты, сверить спецификацию и docs/definition-of-done.md.

## Dependencies / Strategy

T001–T005 → US1 → US2 → US3 → Delivery. Сначала рабочий CRUD, затем перенос и удобство. Независимые критерии историй описаны в spec.md. Возможные параллельные проверки после заморозки снимка: дизайн, архитектура и код; изменение снимка только после всех трёх отчётов. Реализация одним автором, отдельные агенты — только ревьюеры.
