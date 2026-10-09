// אימות: התחברות, סשנים, CSRF ו-middleware ללוח הניהול.
import { hashPassword, verifyPassword, randomHex, sha256Hex } from './crypto.js';
import { ipKey, peek, hit, clear } from './ratelimit.js';
import { config, isDemo } from './config.js';
import { json, jsonError, now } from './util.js';

export const COOKIE = '__Host-folio1_session';
const SESSION_DAYS = 14;
const SESSION_SEC = SESSION_DAYS * 86400;

export function normEmail(e) {
  return String(e ?? '').trim().toLowerCase();
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

function sessionCookie(token, maxAge) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/** הגנת CSRF: בקשות כתיבה חייבות להגיע מאותו מקור. */
export function checkOrigin(request, url) {
  const origin = request.headers.get('origin');
  return origin === url.origin;
}

export function isJson(request) {
  return (request.headers.get('content-type') || '').toLowerCase().startsWith('application/json');
}

export async function readJson(request, maxBytes = 200_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('too large');
  return JSON.parse(text || '{}');
}

/** מחזיר { user, sessionId } או null. */
export async function getSession(request, env) {
  const token = readCookie(request, COOKIE);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(tokenHash, now())
    .first();
  if (!row) return null;
  return { sessionId: row.session_id, user: { id: row.id, email: row.email } };
}

export function isDemoUser(env, user) {
  return isDemo(env) && normEmail(user?.email) === normEmail(env.DEMO_EMAIL || 'demo@folio1.app');
}

// מלח קבוע לחישוב "דמה" כשהמשתמש לא קיים, כדי שזמן התגובה לא יסגיר אם המייל רשום.
const DUMMY_SALT = '00112233445566778899aabbccddeeff';

export async function login(request, env) {
  let body;
  try {
    body = await readJson(request, 10_000);
  } catch {
    return jsonError('בקשה לא תקינה.');
  }
  const email = normEmail(body.email);
  const password = String(body.password ?? '');
  if (!email || !password) return jsonError('נא למלא מייל וסיסמה.');

  const { loginAttempts, loginWindowMinutes } = config.limits;
  const windowSec = loginWindowMinutes * 60;
  const ipK = `login:ip:${await ipKey(request, env)}`;
  const emailK = `login:email:${(await sha256Hex(email)).slice(0, 32)}`;
  const [byIp, byEmail] = await Promise.all([peek(env, ipK, windowSec), peek(env, emailK, windowSec)]);
  if (byIp.count >= loginAttempts || byEmail.count >= loginAttempts) {
    const minutes = Math.max(1, Math.ceil(Math.max(byIp.retryAfter, byEmail.retryAfter) / 60));
    return jsonError(`יותר מדי ניסיונות התחברות. נסו שוב בעוד ${minutes} דקות.`, 429);
  }

  const user = await env.DB.prepare('SELECT id, email, password_hash, password_salt FROM users WHERE email = ?').bind(email).first();
  let ok = false;
  if (user) ok = await verifyPassword(password, user.password_hash, user.password_salt);
  else await hashPassword(password, DUMMY_SALT);

  if (!ok) {
    await Promise.all([hit(env, ipK, windowSec), hit(env, emailK, windowSec)]);
    return jsonError('המייל או הסיסמה שגויים.', 401);
  }

  await clear(env, emailK);
  const token = randomHex(32);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()),
    env.DB.prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)').bind(user.id, await sha256Hex(token), now() + SESSION_SEC),
  ]);
  return json({ ok: true, user: { email: user.email } }, 200, { 'set-cookie': sessionCookie(token, SESSION_SEC) });
}

export async function logout(request, env) {
  const s = await getSession(request, env);
  if (s) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(s.sessionId).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

export async function changePassword(request, env, session) {
  if (isDemoUser(env, session.user)) return jsonError('באתר הדמו אי אפשר להחליף את הסיסמה של משתמש הדמו.', 403);
  const body = await readJson(request, 10_000);
  const current = String(body.current ?? '');
  const next = String(body.next ?? '');
  if (next.length < 10) return jsonError('הסיסמה החדשה צריכה להכיל לפחות 10 תווים.');
  if (next.length > 200) return jsonError('הסיסמה ארוכה מדי.');
  const user = await env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?').bind(session.user.id).first();
  if (!user || !(await verifyPassword(current, user.password_hash, user.password_salt))) {
    return jsonError('הסיסמה הנוכחית שגויה.', 400, { errors: { current: 'הסיסמה הנוכחית שגויה.' } });
  }
  const { hash, salt } = await hashPassword(next);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').bind(hash, salt, session.user.id),
    // מנתק את כל שאר המכשירים
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(session.user.id, session.sessionId),
  ]);
  return json({ ok: true });
}
