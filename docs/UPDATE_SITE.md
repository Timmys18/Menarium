# Обновление сайта в production

Актуальная инструкция: **[PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)** (раздел «Обычный релиз»).

На сервере из корня проекта:

```bash
bash scripts/deploy-production.sh
```

С Windows после `git push`: можно использовать `scripts/update-prod.ps1` (публикация в GitHub и SSH на сервер; путь к проекту на сервере задайте параметром `-ServerProjectDir`, по умолчанию `/home/ubuntu/Menarium`).
