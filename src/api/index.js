// ניתוב ה-API. כל מה שתחת /api/admin/ עובר דרך middleware שבודק סשן תקף.
import { login, logout, getSession, checkOrigin, isJson, changePassword, isDemoUser } from '../auth.js';
import { isDemo, config } from '../config.js';
import { json, jsonError } from '../util.js';
import { bootstrap, saveSettings } from './settings.js';
import { getSettings } from '../db.js';
import { servicesApi, galleryApi } from './items.js';
import { upload } from './upload.js';
import { messagesApi } from './messages.js';
import { contactApi } from '../contact.js';

export async function handleApi(request, env, ctx, url) {
  const { pathname } = url;
  const method = request.method;
  const isWrite = method !== 'GET' && method !== 'HEAD';

  // CSRF: כל בקשת כתיבה חייבת להגיע מהאתר עצמו
  if (isWrite && !checkOrigin(request, url)) return jsonError('הבקשה נחסמה: מקור לא מורשה.', 403);

  // ---- נקודות קצה ציבוריות ----
  if (pathname === '/api/public-info' && method === 'GET') {
    const demo = isDemo(env);
    return json({
      ok: true,
      demo,
      demoEmail: demo ? env.DEMO_EMAIL || 'demo@folio1.app' : undefined,
      // פרטי הדמו פומביים בכוונה (רק כש-DEMO_MODE=true)
      demoPassword: demo ? env.DEMO_PASSWORD || '' : undefined,
      siteName: (await getSettings(env))['business.name'] || config.siteName,
    });
  }
  if (pathname === '/api/login' && method === 'POST') {
    if (!isJson(request)) return jsonError('נדרש JSON.', 415);
    return login(request, env);
  }
  if (pathname === '/api/logout' && method === 'POST') return logout(request, env);
  if (pathname === '/api/contact' && method === 'POST') {
    if (!isJson(request)) return jsonError('נדרש JSON.', 415);
    return contactApi(request, env, ctx);
  }

  // ---- לוח הניהול: middleware ----
  if (pathname.startsWith('/api/admin/')) {
    const session = await getSession(request, env);
    if (!session) return jsonError('נדרשת התחברות.', 401);
    const isUpload = pathname === '/api/admin/upload';
    if (isWrite && !isUpload && !isJson(request)) return jsonError('נדרש JSON.', 415);
    try {
      const res = await adminRoute(request, env, ctx, url, session);
      if (res) return res;
    } catch (err) {
      if (err instanceof SyntaxError) return jsonError('בקשה לא תקינה.');
      throw err;
    }
  }
  return jsonError('לא נמצא.', 404);
}

async function adminRoute(request, env, ctx, url, session) {
  const path = url.pathname.slice('/api/admin'.length);
  const method = request.method;
  const seg = path.split('/').filter(Boolean);

  if (path === '/me' && method === 'GET') return json({ ok: true, user: session.user, demoUser: isDemoUser(env, session.user) });
  if (path === '/bootstrap' && method === 'GET') return bootstrap(env, url, session);
  if (path === '/settings' && method === 'PUT') return saveSettings(request, env);
  if (path === '/upload' && method === 'POST') return upload(request, env);
  if (path === '/password' && method === 'POST') return changePassword(request, env, session);
  if (seg[0] === 'services') return servicesApi(request, env, seg.slice(1));
  if (seg[0] === 'gallery') return galleryApi(request, env, seg.slice(1));
  if (seg[0] === 'messages') return messagesApi(request, env, seg.slice(1));
  return null;
}
