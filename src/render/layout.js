// מסגרת HTML משותפת לכל הדפים הציבוריים: head, תפריט, תחתית, וואטסאפ וסימן מים.
import { config } from '../config.js';
import { esc, mediaUrl, safeUrl, waNumber, isTrue, paragraphs } from '../util.js';
import { ICONS } from './icons.js';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800;900&display=swap';

/**
 * @param {object} ctx  { env, url, settings, cacheVersion }
 * @param {object} page { id, title, description, body, image, status }
 */
export function layout(ctx, page) {
  const { settings: s, url, env } = ctx;
  const name = s['business.name'] || config.siteName;
  const title = page.title || name;
  const description = page.description || s['business.tagline'] || '';
  const canonical = url.origin + url.pathname;
  const logo = s['brand.logo'];
  const ogImage = page.image || logo;
  const turnstile = page.turnstile ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : '';

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="${esc(name)}">
<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ''}
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage.startsWith('https://') ? ogImage : url.origin + mediaUrl(ogImage))}">` : ''}
<meta name="theme-color" content="#0d0a18">
${page.noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_URL}">
<link rel="stylesheet" href="/css/site.css">
<link rel="stylesheet" href="/theme.css?v=${esc(ctx.cacheVersion)}">
<script src="/js/site.js" defer></script>
${turnstile}
</head>
<body class="page-${esc(page.id)}">
<a class="skip-link" href="#main">דלג לתוכן הראשי</a>
${header(ctx, page.id, name, logo)}
<main id="main" tabindex="-1">
${page.body}
</main>
${footer(ctx, name)}
${whatsapp(s)}
</body>
</html>`;
}

function header(ctx, current, name, logo) {
  const links = config.pages
    .filter((p) => p.path && p.inNav !== false)
    .map((p) => {
      const active = p.id === current ? ' aria-current="page"' : '';
      return `<li><a href="${p.path}"${active}>${esc(p.label)}</a></li>`;
    })
    .join('');
  const brand = logo
    ? `<img src="${esc(mediaUrl(logo))}" alt="" width="40" height="40" class="brand-logo"><span>${esc(name)}</span>`
    : `<span class="brand-mark" aria-hidden="true">${esc(name.trim().charAt(0))}</span><span>${esc(name)}</span>`;
  return `<header class="site-header">
<div class="container header-inner">
<a class="brand" href="/" aria-label="${esc(name)} – דף הבית">${brand}</a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">תפריט</span><span class="bars" aria-hidden="true"></span></button>
<nav id="site-nav" class="site-nav" aria-label="תפריט ראשי"><ul>${links}</ul></nav>
<a class="btn btn-primary header-cta" href="/contact">דברו איתנו</a>
</div>
</header>`;
}

function footer(ctx, name) {
  const { settings: s, env } = ctx;
  const phone = s['contact.phone'];
  const email = s['contact.email'];
  const social = [
    ['social.facebook', 'פייסבוק', ICONS.facebook],
    ['social.instagram', 'אינסטגרם', ICONS.instagram],
    ['social.tiktok', 'טיקטוק', ICONS.tiktok],
    ['social.linkedin', 'לינקדאין', ICONS.linkedin],
  ]
    .map(([k, label, icon]) => {
      const href = safeUrl(s[k]);
      return href ? `<li><a href="${esc(href)}" rel="noopener" target="_blank" aria-label="${label} (נפתח בחלון חדש)">${icon}</a></li>` : '';
    })
    .join('');
  const showCredit = env.SHOW_CREDIT === undefined || isTrue(env.SHOW_CREDIT);
  const year = new Date().getFullYear();
  const hours = s['contact.hours'];
  return `<footer class="site-footer">
<div class="container footer-grid">
<div>
<p class="footer-name">${esc(name)}</p>
${paragraphs(s['footer.text'])}
${social ? `<ul class="social">${social}</ul>` : ''}
</div>
<div>
<p class="footer-title">יצירת קשר</p>
<ul class="footer-contact">
${phone ? `<li>${ICONS.phone}<a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a></li>` : ''}
${email ? `<li>${ICONS.mail}<a href="mailto:${esc(email)}">${esc(email)}</a></li>` : ''}
${s['contact.address'] ? `<li>${ICONS.pin}<span>${esc(s['contact.address'])}</span></li>` : ''}
</ul>
</div>
${hours ? `<div class="footer-hours"><p class="footer-title">שעות פעילות</p>${paragraphs(hours)}</div>` : ''}
</div>
<div class="container footer-bottom">
<p>© ${year} ${esc(name)} · <a href="/accessibility">הצהרת נגישות</a> · <a href="/admin/" rel="nofollow">כניסת מנהל</a></p>
${showCredit ? `<p class="credit"><a href="${esc(config.creditUrl)}" rel="noopener" target="_blank">${esc(config.creditText)}</a></p>` : ''}
</div>
</footer>`;
}

function whatsapp(s) {
  const num = waNumber(s['contact.whatsapp']);
  if (!num) return '';
  return `<a class="wa-float" href="https://wa.me/${num}" target="_blank" rel="noopener" aria-label="שליחת הודעה בוואטסאפ (נפתח בחלון חדש)">${ICONS.whatsapp}</a>`;
}
