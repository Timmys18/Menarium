/**
 * In-memory rate limit utilities.
 */
type RateResult = { ok: true } | { ok: false; retryAfterSec?: number; message: string };

const MESSAGE_MIN_INTERVAL_MS = 3000;
const MESSAGE_MAX_PER_24H = 50;
const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

const messageLastSent = new Map<string, number>();
const messageTimestamps24h = new Map<string, number[]>();
const actionLastByKey = new Map<string, number>();

function prune24h(map: Map<string, number[]>, uid: string) {
  const list = map.get(uid) ?? [];
  const cutoff = Date.now() - WINDOW_24H_MS;
  const kept = list.filter((t) => t > cutoff);
  if (kept.length === 0) map.delete(uid);
  else map.set(uid, kept);
  return kept;
}

export function checkActionRateLimit(
  userId: string,
  actionKey: string,
  minIntervalMs = 2500,
): RateResult {
  const key = `${userId}:${actionKey}`;
  const now = Date.now();
  const last = actionLastByKey.get(key);
  if (last != null && now - last < minIntervalMs) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((minIntervalMs - (now - last)) / 1000),
      message: '\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435',
    };
  }
  return { ok: true };
}

export function recordActionRequest(userId: string, actionKey: string): void {
  actionLastByKey.set(`${userId}:${actionKey}`, Date.now());
}

export function checkMessageRateLimit(userId: string): RateResult {
  const now = Date.now();
  const last = messageLastSent.get(userId);
  if (last != null && now - last < MESSAGE_MIN_INTERVAL_MS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((MESSAGE_MIN_INTERVAL_MS - (now - last)) / 1000),
      message: '\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u0447\u0430\u0441\u0442\u044b\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u044f. \u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434.',
    };
  }
  const in24h = prune24h(messageTimestamps24h, userId);
  if (in24h.length >= MESSAGE_MAX_PER_24H) {
    return {
      ok: false,
      message: '\u041f\u0440\u0435\u0432\u044b\u0448\u0435\u043d \u043b\u0438\u043c\u0438\u0442 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439 \u0437\u0430 \u0441\u0443\u0442\u043a\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0437\u0430\u0432\u0442\u0440\u0430.',
    };
  }
  return { ok: true };
}

export function recordMessageSent(userId: string): void {
  const now = Date.now();
  messageLastSent.set(userId, now);
  const list = messageTimestamps24h.get(userId) ?? [];
  list.push(now);
  messageTimestamps24h.set(userId, list);
}