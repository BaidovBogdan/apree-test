# Data Model

| Task field | Storage | Constraint |
| --- | --- | --- |
| id | uuid PK | UUID v4 от клиента, уникальный |
| title | varchar(160) | trim, длина 1–160 |
| description | text | строка 0–5000, default empty |
| priority | text | low / medium / high |
| status | text | new / in_progress / done |
| version | integer | >0, default 1, increment on PATCH |
| created_at | timestamptz | server timestamp |
| updated_at | timestamptz | server timestamp |

JSON использует createdAt/updatedAt, ISO UTC. Все статусы могут переходить друг в друга. При создании допустим статус целевой колонки. Нет soft delete: подтверждённое удаление физическое. Миграции имеют отдельный ledger schema_migrations(name, checksum, applied_at). Связей между сущностями нет.
