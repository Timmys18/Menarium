# Проверка локальной PostgreSQL после клонирования репозитория.
# Убедитесь, что в .env и .env.local задан DATABASE_URL на localhost (см. .env.example).
# Запуск из корня проекта: powershell -ExecutionPolicy Bypass -File .\scripts\verify-local-db.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==> prisma migrate deploy"
npx prisma migrate deploy
Write-Host "==> prisma generate"
npx prisma generate
Write-Host "Готово. Запуск приложения: npm run dev"
