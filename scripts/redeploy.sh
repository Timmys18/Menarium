#!/usr/bin/env bash
set -euo pipefail

log() {
  echo
  echo "==> $1"
}

run_step() {
  local step_name="$1"
  shift
  log "$step_name"
  if ! "$@"; then
    echo
    echo "ОШИБКА на шаге: $step_name"
    echo "Посмотри текст ошибки выше. После исправления повтори команду снова."
    exit 1
  fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
  echo "ОШИБКА: я не нашёл `package.json` в папке проекта."
  echo "Убедись, что ты запускаешь `bash scripts/redeploy.sh` из репозитория."
  exit 1
fi

run_step "Проверяем, что есть Git" git --version

local_changes="$(git status --porcelain || true)"
if [ -n "$local_changes" ]; then
  echo
  echo "На сервере есть локальные изменения (мешают git pull)."
  echo "Самый простой вариант (удалит локальные правки на сервере):"
  echo "  git reset --hard"
  echo "  git clean -fd"
  echo
  echo "После этого запусти ещё раз:"
  echo "  bash scripts/redeploy.sh"
  exit 1
fi

run_step "Получаем свежий код (git pull)" git pull

run_step "Устанавливаем зависимости" npm install

run_step "Применяем миграции (prisma migrate deploy)" npx prisma migrate deploy

run_step "Собираем production-версию (npm run build)" npm run build

log "Перезапускаем приложение через PM2"
if pm2 status menarium >/dev/null 2>&1; then
  pm2 restart menarium
else
  # Если pm2 не видит приложение, пробуем запустить по ecosystem.config.js
  pm2 start ecosystem.config.js --name menarium
fi

pm2 save >/dev/null 2>&1 || true

echo
echo "Готово: сайт обновлён."
