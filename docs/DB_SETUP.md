# База данных (PostgreSQL / Yandex Cloud)

Подробно: **[PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)** — таблица переменных и `DATABASE_URL`.

Кратко: в консоли Yandex Managed PostgreSQL возьмите хост, порт, пользователя, пароль и имя БД. Соберите строку в формате Prisma, для облака обычно нужен `sslmode=require` (порт смотрите в консоли, часто `6432`).

Пример формата см. в `.env.production.example`.
