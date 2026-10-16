# HTTP contract

Base: /api. JSON, no-store. Полная исполняемая схема — packages/contracts/src/index.ts.

| Method | Path | Input | Result |
| --- | --- | --- | --- |
| GET | /tasks | — | 200 {items: Task[], limitReached: boolean} |
| GET | /tasks/:id | UUID | 200 Task / 404 |
| POST | /tasks | {id,title,description,priority,status} | 201 Task / 409 ID exists |
| PATCH | /tasks/:id | {version,title?,description?,priority?,status?}, минимум одно поле | 200 Task / 404 / 409 stale |
| DELETE | /tasks/:id | {version} | 204 / 404 / 409 stale |
| GET | /health | — | 200 {status:'ok'} / 503 |

Bad input 400, body >32 KB — 413. DB unavailable 503. Unexpected failure 500. Error: {statusCode:number,message:string}. Строки ограничены, NUL, null и неизвестные поля запрещены. Версия обязательна для изменения/удаления. UI не делает автоматический retry изменений. GET список ограничен 1000, limitReached указывает, что есть дополнительные записи; pagination за границей первой версии.
