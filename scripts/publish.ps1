param()
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

if (!(Test-Path (Join-Path $repoRoot "package.json"))) {
  Fail "Не вижу `package.json` в корне проекта. Проверь, что запускаешь из правильной папки."
}

if (!(Test-Path (Join-Path $repoRoot "prisma" ))) {
  Write-User "Внимание: папку `prisma` не нашел. Скрипт продолжит, но возможно git/прод не сработают."
}

Write-User "Проверяем Git..."

$insideGit = $false
try {
  & git rev-parse --is-inside-work-tree *> $null
  $insideGit = $true
} catch {
  $insideGit = $false
}

if (-not $insideGit) {
  Fail "В этой папке нет Git-репозитория (.git). Нужен GitHub-репозиторий и доступ к нему, чтобы можно было отправить код."
}

Write-User "Проверяем, есть ли изменения..."
$status = & git status --porcelain

if (-not $status) {
  Write-User "Нечего коммитить — изменений нет. Код в GitHub уже актуальный."
  exit 0
}

Write-User "Отправляем изменения в GitHub..."
& git add .

try {
  & git commit -m "update"
} catch {
  Fail "Коммит не получился. Текст ошибки выше. Обычно это связано с настройками Git (имя/почта) или конфликтами."
}

try {
  & git push
} catch {
  Fail "git push не прошёл. Текст ошибки выше. Проверь доступ к GitHub (логин/пароль/ключ)."
}

Write-User "Готово: код отправлен в GitHub."
