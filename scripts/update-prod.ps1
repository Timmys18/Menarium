param(
  [string]$ServerIp,
  [string]$ServerUser = "root",
  [string]$ServerProjectDir = "/var/www/menarium"
)

$ErrorActionPreference = "Stop"

function Write-User($msg) {
  Write-Host $msg
}

function Fail($msg) {
  Write-Host $msg -ForegroundColor Red
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$cwd = (Resolve-Path ".").Path

if ($cwd -ne $repoRoot.Path) {
  Fail "Запусти этот файл из корня проекта (где `package.json`). Сейчас ты в: $cwd"
}

if ([string]::IsNullOrWhiteSpace($ServerIp)) {
  $ServerIp = Read-Host "Введи IP сервера (например 51.250.xx.xx)"
}

if ([string]::IsNullOrWhiteSpace($ServerProjectDir)) {
  $ServerProjectDir = "/var/www/menarium"
}

$sshTarget = "$ServerUser@$ServerIp"

Write-User "Шаг 1: отправляем код в GitHub (publish)..."
& powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1

Write-User "Шаг 2: подключаемся к серверу и обновляем сайт (redeploy)..."

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Fail "На Windows не найден `ssh`. Установи/включи OpenSSH (это стандартная опция Windows)."
}

$remoteCmd = "cd `"$ServerProjectDir`" && bash scripts/redeploy.sh"

try {
  & ssh $sshTarget $remoteCmd
} catch {
  Fail "Не получилось обновить сайт на сервере. Текст ошибки выше. Проверь доступ по SSH и правильность `ServerProjectDir`."
}

Write-User "Готово: обновление сайта завершено."
