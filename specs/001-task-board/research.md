# Research

- Decision: Next.js + NestJS в npm workspaces. Rationale: заданный стек и отдельная проверяемая граница API. Alternative: Next Route Handlers проще, но не соответствует выбранному NestJS.
- Decision: pg provider и SQL migrations. Rationale: одна таблица, явные запросы, атомарный контроль версии. Alternative: ORM увеличивает настройку без нужной здесь пользы. [Nest database docs](https://docs.nestjs.com/techniques/database), [pg queries](https://node-postgres.com/features/queries).
- Decision: same-origin Next rewrites. Rationale: один браузерный origin, приватный адрес API. [Next documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites).
- Decision: MUI AppRouterCacheProvider. Rationale: корректная интеграция Emotion со streaming SSR. [MUI documentation](https://mui.com/material-ui/integrations/nextjs/).
- Decision: dnd-kit mouse sensor + явное меню. Rationale: надёжное перемещение мышью без захвата touch-scroll, доступное управление меню для клавиатуры и телефона. Alternative: HTML drag API хуже соответствует touch и доступности.
- Decision: Montserrat OFL локально, Benzin не копировать без лицензии. Палитра и знак исследованы на [официальном сайте](https://www.apreeteam.com/).
- Все вопросы, блокирующие реализацию, разрешены подтверждённым объёмом. Продуктовые допущения указаны в spec.md.
