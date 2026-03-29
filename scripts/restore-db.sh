#!/usr/bin/env bash
# Восстановление БД из дампа pg_dump -Fc. ОСТОРОЖНО: перезаписывает объекты в текущей БД.
# Рекомендуется: остановить приложение (pm2 stop menarium), затем восстановить, затем pm2 start.
# Использование: bash scripts/restore-db.sh /path/to/menarium-YYYYMMDD-HHMMSS.dump
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_DIR"

if [ $# -lt 1 ] || [ ! -f "$1" ]; then
  echo "Использование: bash scripts/restore-db.sh <файл.dump>"
  echo "Пример: bash scripts/restore-db.sh backups/pg-dumps/menarium-20260328-030000.dump"
  exit 1
fi

if [[ "$1" = /* ]]; then
  DUMP_FILE="$1"
else
  DUMP_FILE="$PROJECT_DIR/$1"
fi

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
elif [ -f ".env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.production"
  set +a
else
  echo "ОШИБКА: нет .env или .env.production с DATABASE_URL"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ОШИБКА: DATABASE_URL не задан"
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "ОШИБКА: не найден pg_restore. Установите: sudo apt-get install -y postgresql-client"
  exit 1
fi

if [ "${FORCE:-}" != "1" ]; then
  echo "ВНИМАНИЕ: будет выполнен pg_restore с --clean --if-exists в БД из DATABASE_URL."
  echo "Файл: $DUMP_FILE"
  echo "Убедитесь, что остановили приложение (pm2 stop menarium), если нужна консистентность."
  echo "Для продолжения введите YES и нажмите Enter:"
  read -r line
  if [ "$line" != "YES" ]; then
    echo "Отменено."
    exit 1
  fi
fi

echo "==> Восстановление..."
pg_restore \
  -d "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  "$DUMP_FILE"

echo "==> Готово. Запустите приложение: pm2 start menarium"
