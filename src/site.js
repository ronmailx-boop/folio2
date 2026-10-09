// צד ציבורי: רינדור דפים מ-D1, קאש, sitemap, robots ו-theme.css.
import { config } from './config.js';
import { getSettings, listServices, listGallery, getCacheVersion } from './db.js';
import { layout } from './render/layout.js';
import * as pages from './render/pages.js';
import { esc, isHexColor, SECURITY_HEADERS, EXTERNAL_IMAGE_HOSTS } from './util.js';

const PAGE_ROUTES = {
  '/': 'home',
  '/about': 'about',
  '/services': 'services',
  '/gallery': 'gallery',
  '/contact': 'contact',
  '/accessibility': 'accessibility',
};

export function publicCsp(env) {
  const ts = env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? ' https://challenges.cloudflare.com' : '';
  return [
    "default-src 'self'",
    `script-src 'self'${ts}`,
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    `img-src 'self' data: ${EXTERNAL_IMAGE_HOSTS.join(' ')}`,
    "connect-src 'self'",
    `frame-src${ts || " 'none'"}`,
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function htmlResponse(html, status = 200, env, extra = {}) {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': publicCsp(env),
      ...SECURITY_HEADERS,
      ...extra,
    },
  });
}

export function isPagePath(pathname) {
  return Object.hasOwn(PAGE_ROUTES, normalize(pathname));
}

export function normalize(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/** מרנדר דף ציבורי. form משמש רק לדף צור קשר (שגיאות/הצלחה אחרי POST רגיל). */
export async function renderPage(env, url, id, { form, status = 200 } = {}) {
  const [settings, cacheVersion] = await Promise.all([getSettings(env), getCacheVersion(env)]);
  const ctx = { env, url, settings, cacheVersion };
  let page;
  switch (id) {
    case 'home': {
      const [services, gallery] = await Promise.all([
        listServices(env, { visibleOnly: true, limit: 6 }),
        listGallery(env, { visibleOnly: true, limit: 9 }),
      ]);
      page = pages.homePage(settings, services, gallery);
      break;
    }
    case 'about':
      page = pages.aboutPage(settings);
      break;
    case 'services':
      page = pages.servicesPage(settings, await listServices(env, { visibleOnly: true }));
      break;
    case 'gallery':
      page = pages.galleryPage(settings, await listGallery(env, { visibleOnly: true }));
      break;
    case 'contact': {
      const siteKey = env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY : '';
      page = pages.contactPage(settings, form, siteKey);
      break;
    }
    case 'accessibility':
      page = pages.accessibilityPage(settings);
      break;
    default:
      page = pages.notFoundPage(settings);
      status = 404;
  }
  return htmlResponse(layout(ctx, page), status, env);
}

/**
 * GET לדף ציבורי עם Cache API.
 * מפתח הקאש כולל את גרסת הקאש מ-D1 (כל שמירה בלוח "מנקה" את כל הדפים)
 * ואת מזהה הפריסה (כל פריסה חדשה, למשל שינוי SHOW_CREDIT, מנקה גם היא).
 * הערה: ב-*.workers.dev ה-Cache API לא פעיל, והדף פשוט מרונדר בכל בקשה.
 */
export async function servePage(request, env, ctx, url) {
  const path = normalize(url.pathname);
  const id = PAGE_ROUTES[path];
  if (path !== url.pathname) return Response.redirect(url.origin + path + url.search, 301);

  const version = await getCacheVersion(env);
  const deployId = env.CF_VERSION_METADATA?.id || 'dev';
  const cacheKey = new Request(`${url.origin}/__page/${deployId}/v${version}${path}`, { method: 'GET' });
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return withNoBrowserCache(hit, 'HIT');

  const res = await renderPage(env, url, id);
  if (res.status === 200) {
    const toCache = new Response(res.clone().body, res);
    toCache.headers.set('cache-control', 'public, max-age=86400');
    ctx.waitUntil(cache.put(cacheKey, toCache));
  }
  return withNoBrowserCache(res, 'MISS');
}

function withNoBrowserCache(res, state) {
  const r = new Response(res.body, res);
  // הדפדפן תמיד בודק מחדש, כדי ששינוי בלוח ייראה מיד
  r.headers.set('cache-control', 'no-cache');
  r.headers.set('x-folio-cache', state);
  return r;
}

export async function notFound(env, url) {
  return renderPage(env, url, '404');
}

export async function themeCss(env) {
  const s = await getSettings(env);
  const primary = isHexColor(s['brand.primary_color']) ? s['brand.primary_color'] : config.defaultPrimaryColor;
  const secondary = isHexColor(config.secondaryColor) ? config.secondaryColor : '#7c4ddb';
  return new Response(`:root{--primary:${primary};--secondary:${secondary}}\n`, {
    headers: {
      'content-type': 'text/css; charset=utf-8',
      // הכתובת כוללת ?v=<גרסה>, ולכן אפשר לשמור לזמן ארוך
      'cache-control': 'public, max-age=31536000, immutable',
      ...SECURITY_HEADERS,
    },
  });
}

export function robotsTxt(url) {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

export function sitemapXml(url) {
  const urls = config.pages
    .filter((p) => p.path)
    .map((p) => `  <url><loc>${esc(url.origin + p.path)}</loc><changefreq>weekly</changefreq><priority>${p.path === '/' ? '1.0' : '0.7'}</priority></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
