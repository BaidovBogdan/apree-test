# Apree Workspace

Рабочее пространство команды: общая канбан-доска, задачи и приоритеты. TypeScript, Next.js / React, Material UI, NestJS и PostgreSQL.

## Запуск в Docker

Нужен Docker Desktop с Linux containers. Из корня проекта:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Откройте http://localhost:3000. Compose дождётся PostgreSQL, применит миграции, запустит API и web. База сохраняется в named volume после обычного перезапуска. Переменная WEB_PORT меняет порт web, например WEB_PORT=3002. API доступен только внутри Docker-сети; БД опубликована на 127.0.0.1:55432 для локальной разработки.

В Bash вместо Copy-Item используйте cp. Порт 3000 и 55432 должны быть свободны.

```powershell
docker compose ps
docker compose logs api web
docker compose down
```

Последняя команда сохраняет данные. Не добавляйте `-v`, если данные нужны.

## Локальная разработка

Нужен Node.js 24 LTS, npm и Docker:

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d db
npm run db:migrate
npm run dev
```

Интерфейс: http://localhost:3000, API readiness: http://127.0.0.1:3001/api/health. Перед локальным dev остановите контейнер web, если он занимает тот же порт. `npm run dev` следит за контрактами, сервером и интерфейсом; Ctrl+C завершает запущенные процессы. При первом старте PostgreSQL дождитесь healthy в `docker compose ps`.

Для примеров задач выполните `npm run db:seed` после миграций. Это отдельная необязательная команда с синтетическими данными; обычный старт открывает пустую доску. Повтор seed не перезаписывает существующие записи.

## Проверки

```powershell
npm run typecheck
npm test
npm run build
```

API-проверки требуют локальный PostgreSQL из compose. Каждый запуск создаёт уникальную schema, применяет миграции дважды и удаляет только эту schema. Приложение и его данные не очищаются. В CI поднимается отдельный PostgreSQL service. Браузерные проверки описаны в [verification](docs/verification.md); это выполненные проверки, а не постоянный E2E suite.

## Возможности

- Создание, полный просмотр, редактирование и подтверждаемое удаление.
- «Новая», «В работе», «Готово»; три приоритета.
- Плавный перенос мышью и доступное меню смены статуса.
- Поиск по названию/описанию и фильтр приоритета; при отсутствии результатов колонки плавно скрываются.
- Мобильные вкладки, loading/error/empty, повтор загрузки и сохранение черновика при ошибке.
- Контроль версии защищает от потери изменений при работе в нескольких вкладках.

## Устройство и решения

```text
apps/web           Next.js / React / MUI
apps/api           NestJS / parameterized SQL
packages/contracts Общие runtime-схемы Zod и TypeScript types
database/migrations SQL + checksum ledger
scripts            Миграции, локальный seed и dev launcher
```

[System Design](docs/architecture/system-design.md) · [Дизайн-система](docs/design/design-system.md) · [Спецификация](specs/001-task-board/spec.md) · [ADR](docs/adr/0002-task-board-architecture.md) · [Команды](docs/commands.md) · [Результаты и время](docs/delivery.md).

Решения: одна таблица и явный SQL вместо ORM; same-origin proxy вместо открытого CORS; сервер подтверждает изменение до перестановки карточки; общий контракт проверяется с обеих сторон. Улучшение удобства — поиск и фильтр приоритета.

## Границы

Одна общая доска без авторизации: использовать в локальной или иной доверенной изолированной среде. Для внешнего размещения нужны аутентификация, права на доску, HTTPS и резервное копирование. Доска загружает до 1000 последних задач и явно сообщает о превышении; поиск работает по загруженным задачам. Нет realtime, offline editing, ручного порядка внутри колонки, вложений и аккаунтов. Порядок — новые задачи сверху. Удаление физическое.

Montserrat поставляется локально с OFL. Знак Apree получен с официального сайта; права на бренд остаются у компании. Benzin не включён без лицензии. Шаблон разработки — личный AI Project Template, commit 43ff891236e163408604fd5bbd9c0014f9069356; исходный Spec Kit и лицензии сохранены. Публичный репозиторий приложения — [BaidovBogdan/apree-test](https://github.com/BaidovBogdan/apree-test). История шаблона в него не переносится.

## Использование AI

AI помог исследовать публичный бренд, подготовить требования/архитектуру, написать UI/API, проверки и документацию. Проверка результата: наблюдаемый red → green для контрактов и HTTP-сценариев, реальный PostgreSQL, TypeScript strict, production build, браузерные сценарии и независимые ревью дизайна, архитектуры и кода. Точный охват и остаточные ограничения фиксируются в docs/verification.md и docs/delivery.md.
