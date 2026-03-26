# Menarium API Contracts (v1 readiness)

Этот документ фиксирует текущий контракт API для web и будущего mobile-клиента без ломающих изменений.

## Базовые правила

- Версия API: `v1` (константа `API_VERSION` в `src/lib/api-response.ts`).
- Все ошибки API возвращаются только в JSON-формате:
  - `{ "error": "Текст ошибки" }`
- Для list-endpoints основное поле всегда `items`.
- Для action/detail-endpoints основной успешный формат:
  - `{ "ok": true, "data": ... }`
- Backward compatibility сохранена через legacy-поля в тех роутингах, где frontend уже зависит от них.

## Сущности

- `Item` — объявление
- `SwapRequest` — заявка/сделка обмена
- `Notification` — уведомление
- `Message` — сообщения по обмену
- `ItemMessage` — сообщения по чату объявления

## Единый list-контракт

Основной контракт:

```json
{
  "items": [],
  "hasMore": true,
  "limit": 20,
  "offset": 0
}
```

### Пагинация

- Query параметры: `limit`, `offset`
- `limit`: по умолчанию `20`, максимум `50`
- `offset`: по умолчанию `0`

## Legacy compatibility поля

Сохранены для web-совместимости:

- `GET /api/exchange` -> `swaps`
- `GET /api/notifications` -> `notifications`
- `GET /api/items/chat/[threadId]/messages` -> `messages`
- `GET /api/exchange/[swapId]/messages` -> `messages`
- `GET /api/exchange/my` -> `incoming`, `outgoing`

`items` остаётся основным полем для list-контракта.

## Action/detail контракт

Базовый успешный формат:

```json
{
  "ok": true,
  "data": {}
}
```

Для совместимости часть endpoint-ов дублирует старые поля рядом с `ok/data`.

## Auth error контракт

Для защищённых endpoint-ов при отсутствии авторизации:

```json
{
  "error": "Необходимо войти в систему."
}
```

HTTP status: `401`.

Важно: API не делает HTML redirect в login-страницу, возвращает JSON.

## Mobile-ready status (текущее покрытие)

Готовы по базовой структуре контрактов и ошибкам:

- `/api/items`
- `/api/items/swipe`
- `/api/notifications`
- `/api/exchange`
- `/api/exchange/my`
- `/api/items/chat/[threadId]/messages`
- `/api/exchange/[swapId]/messages`
- `/api/auth/register`

## Versioning readiness

Сделано минимально и безопасно:

- Введена константа `API_VERSION = "v1"` в `src/lib/api-response.ts`.
- Вынесены общие helper-функции ответа:
  - `getPaging`
  - `listResponse`
  - `actionResponse`
  - `errorResponse`

Это позволяет позже безопасно завести `/api/v1/*` без массового рефакторинга текущих маршрутов.
