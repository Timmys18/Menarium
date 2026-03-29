# Menarium

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Сгенерируйте Prisma Client:

```bash
npx prisma generate
```

3. Укажите `DATABASE_URL` в `.env` (см. `.env.example`). База по проекту — **PostgreSQL**.

4. Примените миграции:

```bash
npx prisma migrate dev
```

5. Запуск dev-сервера:

```bash
npm run dev
```

Приложение: `http://localhost:3000`.

### Переменные окружения (локально)

Создайте `.env` по образцу `.env.example`: как минимум `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

## Production

Единая инструкция: **[docs/PRODUCTION_DEPLOY.md](docs/PRODUCTION_DEPLOY.md)** — деплой, env, проверки, откат.

## Smoke-тесты (Playwright)

```bash
npm run test:smoke
```

Тесты открывают главную (`/`) и каталог (`/catalog`).
