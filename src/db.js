// גישה ל-D1: הגדרות, שירותים, גלריה וגרסת הקאש.
import { DEFAULTS } from './config.js';

export async function getSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const s = { ...DEFAULTS };
  for (const row of results) if (row.value !== null && row.value !== '') s[row.key] = row.value;
  return s;
}

export async function setSettings(env, values) {
  const stmts = Object.entries(values).map(([k, v]) =>
    env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(k, v),
  );
  if (stmts.length) await env.DB.batch(stmts);
}

export async function listServices(env, { visibleOnly = false, limit = 1000 } = {}) {
  const where = visibleOnly ? 'WHERE is_visible = 1' : '';
  const { results } = await env.DB.prepare(`SELECT * FROM services ${where} ORDER BY sort_order, id LIMIT ?`).bind(limit).all();
  return results;
}

export async function listGallery(env, { visibleOnly = false, limit = 1000 } = {}) {
  const where = visibleOnly ? 'WHERE is_visible = 1' : '';
  const { results } = await env.DB.prepare(`SELECT * FROM gallery ${where} ORDER BY sort_order, id LIMIT ?`).bind(limit).all();
  return results;
}

// ---- גרסת קאש ----
// כל דף מרונדר נשמר ב-Cache API תחת מפתח שכולל את מספר הגרסה.
// כל שמירה בלוח מעלה את הגרסה, ולכן כל הדפים "מתנקים" מיד בכל מרכזי הנתונים.

export async function getCacheVersion(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = '_cache_version'").first();
  return row?.value || '0';
}

export async function bumpCacheVersion(env) {
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('_cache_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  )
    .bind(String(Date.now()))
    .run();
}
