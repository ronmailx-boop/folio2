// הגבלת קצב פשוטה על D1: חלון זמן קבוע לכל מפתח.
import { sha256Hex } from './crypto.js';
import { now } from './util.js';

/** גיבוב של כתובת ה-IP: לא שומרים כתובות IP גלויות. */
export async function ipKey(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  return (await sha256Hex(`${ip}|${env.HASH_SALT || 'folio1'}`)).slice(0, 32);
}

/** מספר הפעולות בחלון הנוכחי (בלי להוסיף). */
export async function peek(env, key, windowSec) {
  const row = await env.DB.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();
  if (!row || row.window_start <= now() - windowSec) return { count: 0, retryAfter: 0 };
  return { count: row.count, retryAfter: row.window_start + windowSec - now() };
}

/** מוסיף פעולה אחת ומחזיר את הספירה בחלון הנוכחי. */
export async function hit(env, key, windowSec) {
  const t = now();
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN window_start <= ?2 - ?3 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ?2 - ?3 THEN ?2 ELSE window_start END
     RETURNING count, window_start`,
  )
    .bind(key, t, windowSec)
    .first();
  return { count: row.count, retryAfter: row.window_start + windowSec - t };
}

export async function clear(env, key) {
  await env.DB.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
}

/** ניקוי רשומות ישנות (נקרא מה-cron). */
export async function purgeOld(env, olderThanSec = 86400) {
  await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now() - olderThanSec).run();
}
