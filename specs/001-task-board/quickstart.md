# Quickstart validation

Из корня: npm ci → copy .env.example .env → docker compose up -d db → npm run db:migrate → npm run dev.

Открыть http://localhost:3000. Создать задачу, проверить поля, поменять приоритет и статус через меню; перетащить мышью; перезагрузить страницу; удалить с подтверждением. На 390 px пройти те же действия через вкладки и меню. Попробовать пробельное название и отменить удаление.

npm test — контракты и интеграции с отдельной PostgreSQL schema. npm run typecheck и npm run build — статические проверки и production-сборка. Тестам нужен запущенный локальный PostgreSQL из compose; сценарии не запускаются против production URL.

Полностью контейнерный запуск: docker compose up --build -d. Подробные команды и ограничения — README.md и docs/commands.md.
