# Menarium Runbook (Production, Yandex Cloud + REG.RU)

## 1) Базовая подготовка VM (РФ)

- Создать VM в Yandex Cloud (рекомендуется Ubuntu 22.04 LTS).
- Установить Node.js 20+ и pm2:
  - `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
  - `sudo apt-get install -y nodejs nginx`
  - `sudo npm i -g pm2`
- Развернуть проект на VM в каталог, например `/var/www/menarium`.

## 2) ENV и миграции

- Скопировать `.env.production` как основу и заполнить реальными значениями.
- Для прод-старта использовать только production env:
  - `cp .env.production .env`
- Применить миграции:
  - `npm run migrate:prod`

## 3) Сборка и запуск

- `npm ci`
- `npm run build`
- `npm run start:pm2`
- `pm2 save`
- `pm2 startup` (выполнить команду, которую вернет pm2)

## 4) Nginx reverse proxy

- Скопировать `deploy/nginx/menarium.conf` в `/etc/nginx/sites-available/menarium`.
- Активировать:
  - `sudo ln -s /etc/nginx/sites-available/menarium /etc/nginx/sites-enabled/menarium`
  - `sudo nginx -t`
  - `sudo systemctl reload nginx`

## 5) SSL (Let's Encrypt)

- Установить certbot:
  - `sudo apt-get install -y certbot python3-certbot-nginx`
- Выпустить сертификат:
  - `sudo certbot --nginx -d menarium.ru -d www.menarium.ru`
- Проверить автообновление:
  - `sudo certbot renew --dry-run`

Важно: после включения HTTPS `NEXTAUTH_URL` должен быть `https://menarium.ru`.

## 6) DNS (REG.RU)

- A-запись: `menarium.ru` -> публичный IPv4 VM.
- CNAME: `www` -> `menarium.ru`.
- Публичный IP берется из карточки VM в Yandex Cloud.

## 7) Backups и retention

- Включить автоматические бэкапы для Yandex Managed PostgreSQL.
- Рекомендуемая политика хранения:
  - ежедневные бэкапы 7 дней;
  - недельные бэкапы 4 недели.

## 8) Мониторинг

- Базовый health endpoint: `GET /api/health`.
- Проверка процессов:
  - `pm2 status`
  - `pm2 logs menarium`
- Системные метрики:
  - `top` / `htop`
  - `df -h`

## 9) Быстрый rollback

- Откат к предыдущей версии кода.
- `npm ci && npm run build`
- `pm2 restart menarium`
- При проблемах с миграциями восстановить БД из последнего backup.
