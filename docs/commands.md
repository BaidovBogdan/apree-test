# Команды проекта

Все команды выполняются из корня. Runtime: Node.js 24 LTS / npm, Docker Linux containers, PostgreSQL 17. Окружение из .env.example копируется в игнорируемый .env; API_ORIGIN используется Next при старте dev / сборке, DATABASE_URL — сервером и migration runner.

| Действие | Команда |
| --- | --- |
| Установка | npm ci |
| Полный запуск | docker compose up --build -d |
| Только БД | docker compose up -d db |
| Миграции | npm run db:migrate |
| Необязательные локальные примеры | npm run db:seed |
| Разработка | npm run dev |
| Контракты | npm run test:contracts |
| API и PostgreSQL | npm run test:api |
| Ожидание пробуждения API | npm run test:web |
| Все проверки логики | npm test |
| Типы | npm run typecheck |
| Production build | npm run build |
| Браузер | npx --yes --package @playwright/cli playwright-cli -s=apree-app open http://127.0.0.1:3000 |
| Статус контейнеров | docker compose ps |
| Остановка с сохранением данных | docker compose down |

Lint/formatter не подключены: отдельный фреймворк не нужен для ограниченного объёма; строгая проверка типов, фактическое исполнение и независимое ревью выполняются. GitHub Actions запускает typecheck/test/build при push и pull request; результаты доступны во вкладке Actions репозитория.
