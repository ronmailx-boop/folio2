// Folio1 – נקודת כניסה וניתוב.
// קבצים סטטיים (public/) מוגשים ישירות על ידי Cloudflare ולא מגיעים לכאן.
import { servePage, isPagePath, notFound, themeCss, robotsTxt, sitemapXml } from './site.js';
import { serveMedia } from './media.js';
import { handleApi } from './api/index.js';
import { contactForm } from './contact.js';
import { scheduled as demoScheduled } from './demo.js';
import { purgeOld } from './ratelimit.js';
import { SECURITY_HEADERS, jsonError } from './util.js';

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      console.error('unhandled', err?.stack || err);
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return jsonError('אירעה שגיאה בשרת. נסו שוב בעוד רגע.', 500);
      return new Response('אירעה שגיאה זמנית. נסו לרענן את הדף.', {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS },
      });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([demoScheduled(event, env), purgeOld(env)]));
  },
};

async function route(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (pathname.startsWith('/api/')) {
    const res = await handleApi(request, env, ctx, url);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  }

  if (method === 'GET' || method === 'HEAD') {
    if (isPagePath(pathname)) return servePage(request, env, ctx, url);
    if (pathname === '/theme.css') return themeCss(env);
    if (pathname === '/robots.txt') return robotsTxt(url);
    if (pathname === '/sitemap.xml') return sitemapXml(url);
    if (pathname.startsWith('/media/')) {
      const res = await serveMedia(env, pathname.slice('/media/'.length), request);
      if (res) return res;
    }
  }
  if (method === 'POST' && (pathname === '/contact' || pathname === '/contact/')) return contactForm(request, env, ctx, url);
  return notFound(env, url);
}
