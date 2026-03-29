#!/usr/bin/env bash
# Ежедневный дамп PostgreSQL (custom format). Запуск на сервере из корня репозитория.
# Требуется: postgresql-client (pg_dump), DATABASE_URL в .env или .env.production
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_DIR"

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

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ОШИБКА: не найден pg_dump. Установите клиент PostgreSQL, например:"
  echo "  sudo apt-get update && sudo apt-get install -y postgresql-client"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/pg-dumps}"
RETAIN_COUNT="${BACKUP_RETAIN_COUNT:-7}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/menarium-${STAMP}.dump"
TMP="${OUT}.tmp.$$"

echo "==> Дамп во временный файл, затем $OUT"

set +e
pg_dump "$DATABASE_URL" \
  -Fc \
  --no-owner \
  --no-acl \
  -f "$TMP"
DUMP_STATUS=$?
set -e

if [ "$DUMP_STATUS" -ne 0 ]; then
  echo "ОШИБКА: pg_dump завершился с кодом $DUMP_STATUS" >&2
  rm -f "$TMP"
  exit 1
fi

if [ ! -s "$TMP" ]; then
  echo "ОШИБКА: дамп пустой (0 байт), файл удалён" >&2
  rm -f "$TMP"
  exit 1
fi

mv "$TMP" "$OUT"

echo "==> Размер: $(du -h "$OUT" | cut -f1)"

# Оставляем последние RETAIN_COUNT файлов *.dump, остальное удаляем
shopt -s nullglob
mapfile -t all < <(ls -t "$BACKUP_DIR"/menarium-*.dump 2>/dev/null || true)
count="${#all[@]}"
if (( count > RETAIN_COUNT )); then
  for (( i = RETAIN_COUNT; i < count; i++ )); do
    echo "==> Удаляем старый дамп: ${all[i]}"
    rm -f "${all[i]}"
  done
fi

echo "==> Готово. В каталоге не больше $RETAIN_COUNT последних дампов."
