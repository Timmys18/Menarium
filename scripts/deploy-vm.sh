#!/usr/bin/env bash
set -euo pipefail

echo "==> Шаг 1/7: Обновляем систему"
apt-get update -y
apt-get install -y curl git nginx

echo "==> Шаг 2/7: Проверяем Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js не найден. Устанавливаем Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "Node.js уже установлен: $(node -v)"
fi

echo "==> Шаг 3/7: Устанавливаем PM2"
npm install -g pm2

echo "==> Шаг 4/7: Устанавливаем зависимости проекта"
npm install

if [[ ! -f ".env.production" ]]; then
  echo "ОШИБКА: не найден файл .env.production"
  echo "Сначала заполните .env.production по инструкции в docs/DEPLOY_STEP_BY_STEP.md"
  exit 1
fi

echo "==> Загружаем переменные из .env.production"
set -a
source .env.production
set +a

echo "==> Шаг 5/7: Применяем миграции базы"
npx prisma migrate deploy

echo "==> Шаг 6/7: Собираем production-версию"
npm run build

echo "==> Шаг 7/7: Запускаем приложение через PM2"
pm2 delete menarium >/dev/null 2>&1 || true
pm2 start ecosystem.config.js
pm2 save

echo
echo "Готово. Приложение запущено."
echo "Проверь статус командой: pm2 status"
