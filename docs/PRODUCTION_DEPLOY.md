# Production: деплой Menarium

Единая точка правды по production. Остальные файлы в `docs/` про деплой/обновление — только отсылки сюда.

## Где что лежит

| Что | Типично |
|-----|---------|
| Код на сервере | `/home/ubuntu/Menarium` (или каталог, куда клонировали репозиторий) |
| Процесс | **pm2**, имя приложения **`menarium`** |
| Конфиг pm2 | `ecosystem.config.js` в корне репозитория |
| Пример Nginx | `deploy/nginx/menarium.conf` |
| База | **PostgreSQL** (например Yandex Managed PostgreSQL) |

## Переменные окружения

Шаблон: **`.env.production.example`**. На сервере создайте **`.env.production`** с реальными значениями (файл не коммитить).

Обязательно для работы приложения и миграций:

| Переменная | Назначение |
|------------|------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL, для Yandex часто нужен `?sslmode=require` (порт кластера смотрите в консоли, часто `6432`) |
| `NEXTAUTH_URL` | Публичный URL сайта, например `https://menarium.ru` |
| `NEXTAUTH_SECRET` | Длинная случайная строка |

Опционально (Google OAuth):

| Переменная | Назначение |
|------------|------------|
| `GOOGLE_CLIENT_ID` | Если оба заданы — включается вход через Google |
| `GOOGLE_CLIENT_SECRET` | |

Опционально (Object Storage — если используете):

| Переменная | Назначение |
|------------|------------|
| `STORAGE_*` | Как в `.env.production.example` |

**Практика на сервере:** Prisma CLI по умолчанию читает **`.env`**. Если используете только `.env.production`, скрипт деплоя подхватывает его для миграций; либо один раз выполните `cp .env.production .env` и дальше правьте секреты в одном месте — так проще не сломать `migrate deploy`.

## Обычный релиз (после `git push` в `main`)

На сервере из **корня репозитория** (где `package.json`):

```bash
bash scripts/deploy-production.sh
```

Что делает скрипт по шагам:

1. Проверяет, что нет незакоммиченных локальных изменений (иначе `git pull` опасен).
2. `git pull`
3. Подгружает `.env` или `.env.production` для команд в терминале.
4. `npm ci`
5. `npx prisma migrate deploy`
6. `npm run build`
7. `pm2 restart menarium` (или первый запуск через `ecosystem.config.js`, если процесса ещё нет)

Если на сервере были локальные правки и нужно выкинуть их и подтянуть только репозиторий (осторожно — теряются несохранённые изменения на сервере):

```bash
git status
git reset --hard
git clean -fd
bash scripts/deploy-production.sh
```

### Одной строкой (если уже в каталоге проекта)

```bash
bash scripts/deploy-production.sh
```

С Windows можно после пуша вызвать `scripts/update-prod.ps1` — он отправляет код в GitHub и по SSH запускает тот же сценарий на сервере (путь к проекту на сервере задайте параметром, см. скрипт).

## Первичная установка (новая VM, первый запуск)

Кратко:

1. Ubuntu, Node.js 20+, `pm2` глобально, `nginx` (если проксируете с ВМ).
2. `git clone` репозитория в выбранный каталог, например `/home/ubuntu/Menarium`.
3. `cp .env.production.example .env.production`, заполнить секреты и `DATABASE_URL`.
4. Первый раз можно использовать `bash scripts/deploy-vm.sh` (ставит зависимости, миграции, сборку, pm2) — см. комментарии внутри скрипта. Дальше обновления только через `deploy-production.sh`.
5. Nginx: скопировать `deploy/nginx/menarium.conf`, проверить `nginx -t`, SSL (например certbot) — см. комментарии в примере конфига.

Детали кластера PostgreSQL в Yandex — в консоли облака (хост, порт, SSL). Строка `DATABASE_URL` — как в `.env.production.example`.

## Как проверить статус

```bash
pm2 status
pm2 logs menarium --lines 80
curl -sS https://menarium.ru/api/health
```

(Замените домен на свой.)

## Откат при проблеме

Код:

1. Перейти на известный хороший коммит: `git log --oneline`, затем `git checkout <hash>` **или** `git reset --hard <hash>` (если уверены).
2. Снова: `bash scripts/deploy-production.sh` (те же шаги: зависимости, миграции, сборка, restart).

Если откатываете коммит с **уже применёнными** миграциями БД, только передеплой кода может быть недостаточно — смотрите состояние `_prisma_migrations` и при необходимости восстановление БД из бэкапа Yandex.

## Резервные копии PostgreSQL (pg_dump на диск)

Помимо бэкапов в консоли облака можно держать **локальные дампы** на сервере.

**На сервере:** установите клиент PostgreSQL, если ещё нет:

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

**Ручной запуск** из корня репозитория:

```bash
bash scripts/backup-db.sh
```

- Пишет `backups/pg-dumps/menarium-YYYYMMDD-HHMMSS.dump` (формат **custom**, `pg_dump -Fc`).
- Хранит по умолчанию **7** последних файлов (`BACKUP_RETAIN_COUNT=14` — если нужно больше/меньше).
- Другой каталог: `BACKUP_DIR=/var/backups/menarium bash scripts/backup-db.sh`.

**Cron (пример — каждый день в 03:15):**

```bash
crontab -e
```

Строка (путь к проекту поправьте под себя):

```
15 3 * * * cd /home/ubuntu/Menarium && /usr/bin/bash scripts/backup-db.sh >> /var/log/menarium-backup.log 2>&1
```

Копирование дампов в Object Storage можно подключить отдельно (например, `aws s3 cp` или `yc storage`) — в репозитории не зашито, чтобы не плодить секреты.

### Восстановление из дампа

1. Остановите приложение: `pm2 stop menarium`.
2. Убедитесь, что `DATABASE_URL` в `.env` / `.env.production` указывает на **ту БД**, куда нужно залить дамп.
3. Запустите:

```bash
bash scripts/restore-db.sh backups/pg-dumps/menarium-YYYYMMDD-HHMMSS.dump
```

Скрипт спросит подтверждение (`YES`). Без вопросов (только если понимаете риск): `FORCE=1 bash scripts/restore-db.sh путь/к/файлу.dump`.

4. Запустите приложение: `pm2 start menarium`.

`pg_restore` использует `--clean --if-exists`: объекты в базе с теми же именами будут пересозданы. Для managed PostgreSQL это обычно уместно вместе с `--no-owner --no-acl`.

## Чеклист после настройки

См. `docs/production-checklist.md` (короткий список проверок; детали — в этом файле).
