// טקסטים והגדרות: נטען לפי site.config.json ונשמר בטבלת settings.
import { config, FIELD_BY_KEY, isDemo, limits } from '../config.js';
import { getSettings, setSettings, bumpCacheVersion } from '../db.js';
import { readJson, isDemoUser } from '../auth.js';
import { deleteMedia, MEDIA_KEY_RE } from '../media.js';
import { json, jsonError, isHexColor, safeUrl, isValidImageKey } from '../util.js';

export async function bootstrap(env, url, session) {
  const [settings, counts] = await Promise.all([
    getSettings(env),
    env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM messages WHERE is_read = 0) AS unread,
              (SELECT COUNT(*) FROM services) AS services,
              (SELECT COUNT(*) FROM gallery) AS gallery`,
    ).first(),
  ]);
  const values = {};
  for (const key of FIELD_BY_KEY.keys()) values[key] = settings[key] ?? '';
  return json({
    ok: true,
    user: session.user,
    demo: isDemo(env),
    demoUser: isDemoUser(env, session.user),
    siteUrl: url.origin,
    pages: config.pages,
    fields: config.fields,
    settingsFields: config.settingsFields,
    values,
    limits: limits(env),
    counts,
  });
}

const MAX_LEN = { line: 300, url: 500, tel: 40, email: 200, color: 7, image: 200, paragraph: 10000 };

/** בודק ומנקה ערך לפי סוג השדה. מחזיר [value, error]. */
export function cleanField(field, raw) {
  let v = String(raw ?? '');
  if (field.type !== 'paragraph') v = v.replace(/[\r\n]+/g, ' ');
  v = v.replace(/\r\n/g, '\n').trim();
  const max = MAX_LEN[field.type] ?? 300;
  if (v.length > max) return [null, `"${field.label}" ארוך מדי (עד ${max} תווים).`];
  if (!v) return ['', null];
  switch (field.type) {
    case 'color':
      return isHexColor(v) ? [v.toLowerCase(), null] : [null, `"${field.label}": צבע לא תקין.`];
    case 'url':
      return safeUrl(v) ? [v, null] : [null, `"${field.label}": קישור צריך להתחיל ב-https:// או ב-/`];
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? [v, null] : [null, `"${field.label}": כתובת מייל לא תקינה.`];
    case 'tel':
      return /^[\d+\-\s()]{6,40}$/.test(v) ? [v, null] : [null, `"${field.label}": מספר טלפון לא תקין.`];
    case 'image':
      return isValidImageKey(v, MEDIA_KEY_RE) ? [v, null] : [null, `"${field.label}": תמונה לא תקינה.`];
    default:
      return [v, null];
  }
}

export async function saveSettings(request, env) {
  const body = await readJson(request);
  const input = body && typeof body.values === 'object' ? body.values : null;
  if (!input) return jsonError('בקשה לא תקינה.');
  const clean = {};
  const errors = {};
  for (const [key, raw] of Object.entries(input)) {
    const field = FIELD_BY_KEY.get(key);
    if (!field) continue; // מתעלמים משדות שלא מוגדרים ב-site.config.json
    const [v, err] = cleanField(field, raw);
    if (err) errors[key] = err;
    else clean[key] = v;
  }
  if (Object.keys(errors).length) return jsonError(Object.values(errors)[0], 400, { errors });
  if (!Object.keys(clean).length) return json({ ok: true, saved: 0 });

  // תמונה שהוחלפה: מוחקים את הישנה מ-R2
  const imageKeys = Object.keys(clean).filter((k) => FIELD_BY_KEY.get(k).type === 'image');
  const before = imageKeys.length ? await getSettings(env) : {};
  await setSettings(env, clean);
  for (const k of imageKeys) if (before[k] && before[k] !== clean[k]) await deleteMedia(env, before[k]);
  await bumpCacheVersion(env);
  return json({ ok: true, saved: Object.keys(clean).length });
}
