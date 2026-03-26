# Menarium: запуск сайта в интернет (очень простой путь)

Цель: открыть сайт по адресу `https://menarium.ru`.

## ШАГ 1 — создать сервер

1. Открой Yandex Cloud.
2. Нажми **Создать ВМ** (сервер).
3. Выбери:
   - Ubuntu 22.04
   - 2 vCPU
   - 4 GB RAM
4. Нажми **Создать**.
5. Скопируй внешний IP сервера (например `51.250.xx.xx`).

## ШАГ 2 — подключиться к серверу

На своем компьютере открой терминал и выполни:

```bash
ssh root@ТВОЙ_IP
```

`ТВОЙ_IP` замени на IP из шага 1.

## ШАГ 3 — загрузить проект на сервер

На сервере выполни:

```bash
git clone https://github.com/REPLACE_WITH_YOUR_REPO/menarium.git
cd menarium
```

## ШАГ 4 — заполнить production env

1. На сервере создай `.env.production` из шаблона:

```bash
cp .env.production.example .env.production
```

2. Открой файл:

```bash
nano .env.production
```

3. Вставь:
   - `DATABASE_URL` (из инструкции в `docs/DB_SETUP.md`)
   - `NEXTAUTH_SECRET` (длинная случайная строка)
   - `NEXTAUTH_URL=https://menarium.ru`

4. Сохрани файл (`Ctrl+O`, Enter, `Ctrl+X`).

## ШАГ 5 — запустить авто-скрипт

Выполни:

```bash
chmod +x scripts/deploy-vm.sh
bash scripts/deploy-vm.sh
```

После этого приложение уже запущено на сервере.

## ШАГ 6 — включить сайт через Nginx

Выполни по порядку:

```bash
cp deploy/nginx/menarium.conf /etc/nginx/sites-available/menarium
ln -sf /etc/nginx/sites-available/menarium /etc/nginx/sites-enabled/menarium
nginx -t
systemctl restart nginx
```

## ШАГ 7 — включить HTTPS

Выполни:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d menarium.ru -d www.menarium.ru
certbot renew --dry-run
```

## ШАГ 8 — подключить домен в REG.RU

Открой DNS-зону домена `menarium.ru` и добавь:

- A запись:
  - имя: `@`
  - значение: внешний IP твоего сервера
- CNAME запись:
  - имя: `www`
  - значение: `menarium.ru`

## Финальная проверка

Если всё сделано правильно:

- открывается `https://menarium.ru`
- открывается каталог
- работает регистрация

Дополнительно:

```bash
pm2 status
curl -I https://menarium.ru
```
