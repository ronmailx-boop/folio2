// טופס צור קשר: ולידציה, ספאם, הגבלת קצב, שמירה ב-D1 והתראה.
import { config } from './config.js';
import { getSettings } from './db.js';
import { ipKey, hit } from './ratelimit.js';
import { notifyNewMessage } from './mail.js';
import { renderPage } from './site.js';
import { json, jsonError } from './util.js';
import { readJson } from './auth.js';

const LIMITS = { name: 100, phone: 40, email: 200, body: 3000 };

export function validateContact(d) {
  const v = {};
  for (const k of Object.keys(LIMITS)) v[k] = String(d[k] ?? '').replace(/\r\n/g, '\n').trim();
  v.name = v.name.replace(/\s+/g, ' ');
  const errors = {};
  if (!v.name) errors.name = 'נא למלא שם.';
  if (!v.body) errors.body = 'נא לכתוב הודעה.';
  if (!v.phone && !v.email) errors.phone = 'נא למלא טלפון או מייל, כדי שנוכל לחזור אליך.';
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'כתובת המייל לא תקינה.';
  if (v.phone && (!/^[\d+\-\s()]+$/.test(v.phone) || v.phone.replace(/\D/g, '').length < 9)) errors.phone = 'מספר הטלפון לא תקין.';
  for (const [k, max] of Object.entries(LIMITS)) if (v[k].length > max) errors[k] = `הטקסט ארוך מדי (עד ${max} תווים).`;
  return { values: v, errors };
}

async function verifyTurnstile(env, token, request) {
  if (!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET)) return true;
  if (!token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const out = await res.json();
    return !!out.success;
  } catch {
    return false;
  }
}

/** לב הטיפול. מחזיר { status, ok, errors?, error?, values } */
async function processContact(request, env, ctx, data) {
  // honeypot: בוט שמילא את השדה הנסתר מקבל "הצלחה" ולא נשמר כלום
  if (String(data.website ?? '').trim()) return { status: 200, ok: true, values: {} };

  const { values, errors } = validateContact(data);
  if (Object.keys(errors).length) return { status: 400, ok: false, errors, error: 'יש לתקן את השדות המסומנים.', values };

  if (!(await verifyTurnstile(env, data.turnstile || data['cf-turnstile-response'], request))) {
    return { status: 400, ok: false, error: 'האימות נגד ספאם נכשל. נסו שוב.', values };
  }

  const rl = await hit(env, `contact:${await ipKey(request, env)}`, 3600);
  if (rl.count > config.limits.contactPerHour) {
    return { status: 429, ok: false, error: 'שלחתם כמה הודעות ברצף. נסו שוב מאוחר יותר, או התקשרו אלינו.', values };
  }

  // תמיד שומרים ב-D1 קודם, כך שהודעה לא הולכת לאיבוד גם אם המייל נכשל
  await env.DB.prepare('INSERT INTO messages (name, phone, email, body) VALUES (?, ?, ?, ?)')
    .bind(values.name, values.phone, values.email, values.body)
    .run();

  const settings = await getSettings(env);
  const origin = new URL(request.url).origin;
  ctx.waitUntil(notifyNewMessage(env, values, settings['business.name'] || config.siteName, origin));
  return { status: 200, ok: true, values: {} };
}

/** POST /api/contact (JSON, מה-fetch בדף). */
export async function contactApi(request, env, ctx) {
  let data;
  try {
    data = await readJson(request, 20_000);
  } catch {
    return jsonError('בקשה לא תקינה.');
  }
  const r = await processContact(request, env, ctx, data);
  return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error, errors: r.errors }, r.status);
}

/** POST /contact (טופס HTML רגיל, כשאין JS). */
export async function contactForm(request, env, ctx, url) {
  let data = {};
  try {
    const fd = await request.formData();
    data = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  } catch {
    /* טופס ריק */
  }
  const r = await processContact(request, env, ctx, data);
  return renderPage(env, url, 'contact', {
    status: r.status,
    form: r.ok ? { sent: true } : { values: r.values, errors: r.errors, formError: r.error },
  });
}
