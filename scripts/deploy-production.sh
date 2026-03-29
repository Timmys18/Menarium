#!/usr/bin/env bash
# Production release: pull → npm ci (с devDependencies для сборки) → migrate → build → pm2 restart.
# Запускать из корня репозитория на сервере: bash scripts/deploy-production.sh
set -euo pipefail

log() {
  echo
  echo "==> $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
  echo "ОШИБКА: не найден package.json. Запускайте скрипт из клонированного репозитория."
  exit 1
fi

if [ ! -f "package-lock.json" ]; then
  echo "ОШИБКА: нет package-lock.json. На production нужен lockfile; выполните npm install локально и закоммитьте lock."
  exit 1
fi

local_changes="$(git status --porcelain || true)"
if [ -n "$local_changes" ]; then
  echo "На сервере есть локальные изменения — git pull может сломаться."
  echo "Если правки на сервере не нужны:"
  echo "  git reset --hard"
  echo "  git clean -fd"
  echo "Затем снова: bash scripts/deploy-production.sh"
  exit 1
fi

log "Получаем код (git pull)"
git pull

# Для prisma migrate deploy нужен DATABASE_URL в окружении
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
  echo "ОШИБКА: нет ни .env, ни .env.production. Создайте файл по .env.production.example"
  exit 1
fi

log "Зависимости (npm ci --include=dev — нужны tailwind/postcss/typescript для next build)"
npm ci --include=dev

log "Миграции (npx prisma migrate deploy)"
npx prisma migrate deploy

log "Сборка (npm run build)"
npm run build

log "Перезапуск PM2"
if pm2 status menarium >/dev/null 2>&1; then
  pm2 restart menarium
else
  pm2 start ecosystem.config.js --name menarium
fi

pm2 save >/dev/null 2>&1 || true

echo
echo "Готово: релиз применён."
