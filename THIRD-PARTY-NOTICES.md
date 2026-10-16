# Сторонние компоненты

## GitHub Spec Kit

- Источник: https://github.com/github/spec-kit
- Release: `v1.1.3`
- Commit release: `0282d03eb6fc3091b3deaa3a855d4030dc40cd6c`
- Установленный пакет: `specify-cli==1.1.3` из PyPI
- Лицензия: MIT, полная копия в `LICENSES/spec-kit-MIT.txt`
- Генерация: `specify init outputs/ai-project-template --integration codex --script py --ignore-agent-tools --non-interactive`

Официальные `.agents/skills/speckit-*`, скрипты, базовые шаблоны и workflow в `.specify/` созданы этим CLI. Python-режим устанавливает также платформенный PowerShell fallback. Манифесты `.specify/integrations/*.manifest.json` содержат контрольные суммы управляемых файлов.

Для `.agents/` и `.specify/` в `.gitattributes` отключена нормализация перевода строк: байтовые контрольные суммы управляемых файлов сохраняются при клонировании на другой платформе.

Наша адаптация: `.specify/memory/constitution.md` заполнена правилами процесса. Корневые инструкции, русскоязычная документация, дополнительные шаблоны, пример BDD и общие настройки репозитория добавлены отдельно. Официальные skills, скрипты и базовые шаблоны не редактировались.

Генератор заменяет обозначения команд в исходных скриптах и шаблонах на формат Codex `$speckit-*`; это штатное преобразование CLI, не ручная правка стороннего кода.

Лицензия компонента не меняет видимость GitHub-репозитория. Здесь нет окружения Python, установленного CLI, его зависимостей или авторизации GitHub/Codex.
