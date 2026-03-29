# Production Checklist

Порядок настройки и деплоя: **[PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)**.

## Build and runtime

- [ ] `npm ci` выполнен без ошибок
- [ ] `npm run build` выполнен без ошибок
- [ ] `npm run start` локально запускается
- [ ] `pm2 start ecosystem.config.js` успешно запускает приложение
- [ ] `pm2 save` и `pm2 startup` настроены

## Environment

- [ ] На сервере заполнен `.env.production` по шаблону `.env.production.example` (и при необходимости `.env` для Prisma CLI)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` указывает на production PostgreSQL в РФ
- [ ] `NEXTAUTH_URL=https://menarium.ru`
- [ ] `NEXTAUTH_SECRET` задан и не пустой

## Database

- [ ] `npm run migrate:prod` выполнен успешно
- [ ] Проверен доступ к БД из приложения
- [ ] Включены автоматические backup в Yandex Managed PostgreSQL
- [ ] (Опционально) Настроен cron для `scripts/backup-db.sh` — см. `docs/PRODUCTION_DEPLOY.md`

## Domain and HTTPS

- [ ] В REG.RU настроен A record: `menarium.ru -> VM IP`
- [ ] В REG.RU настроен CNAME: `www -> menarium.ru`
- [ ] Nginx конфиг применен и валиден (`nginx -t`)
- [ ] Выпущен SSL через certbot
- [ ] `https://menarium.ru` открывается корректно

## API and app smoke

- [ ] `GET /api/health` возвращает `ok: true`
- [ ] Авторизация работает
- [ ] Каталог работает
- [ ] Обмены работают
- [ ] Чаты работают
- [ ] Уведомления работают

## Legal

- [ ] Страница `/privacy` доступна
- [ ] Страница `/terms` доступна
- [ ] Ссылки на правовые страницы доступны в footer
