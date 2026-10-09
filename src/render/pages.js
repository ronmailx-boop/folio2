// תבניות הדפים הציבוריים. כל תוכן מהלקוח עובר esc() / paragraphs().
import { config } from '../config.js';
import { esc, paragraphs, mediaUrl, safeUrl, waNumber } from '../util.js';
import { ICONS } from './icons.js';

function seo(s, id, fallbackTitle) {
  const name = s['business.name'] || config.siteName;
  return {
    title: s[`seo.${id}.title`] || (fallbackTitle ? `${fallbackTitle} | ${name}` : name),
    description: s[`seo.${id}.description`] || '',
  };
}

function img(key, alt, { width = 800, height = 600, cls = '', eager = false } = {}) {
  if (!key) return '';
  return `<img src="${esc(mediaUrl(key))}" alt="${esc(alt)}" width="${width}" height="${height}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function serviceCard(svc, { headingLevel = 3, big = false } = {}) {
  const h = `h${headingLevel}`;
  const media = svc.image_key ? `<div class="card-media">${img(svc.image_key, '', { width: 800, height: 600 })}</div>` : '';
  const price = svc.price_text ? `<p class="price">${esc(svc.price_text)}</p>` : '';
  if (big) {
    return `<article class="card svc svc-big">
${media}
<div class="svc-foot">
<div><${h}>${esc(svc.title)}</${h}><div class="desc">${paragraphs(svc.description)}</div></div>
${price}
</div>
</article>`;
  }
  return `<article class="card svc">
${media}
<${h}>${esc(svc.title)}</${h}>
<div class="desc">${paragraphs(svc.description)}</div>
${price}
</article>`;
}

/** שירותים בפריסת "בנטו": הראשון גדול (אם יש לו תמונה), השאר כרטיסים רגילים. */
function bento(services, headingLevel = 3) {
  return `<div class="bento">${services
    .map((x, i) => serviceCard(x, { headingLevel, big: i === 0 && !!x.image_key && services.length > 2 }))
    .join('')}</div>`;
}

function galleryGrid(items) {
  if (!items.length) return '<p class="empty">עדיין אין תמונות בגלריה.</p>';
  return `<ul class="gallery-grid" data-lightbox>
${items
  .map(
    (g) => `<li><figure>
<a href="${esc(mediaUrl(g.image_key))}" class="gallery-link" data-caption="${esc(g.caption)}">${img(g.image_key, g.alt_text, { width: 800, height: 600 })}</a>
${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}
</figure></li>`,
  )
  .join('\n')}
</ul>`;
}

function pageHead(title, intro) {
  return `<section class="page-hero"><div class="container">
<h1>${esc(title)}</h1>
${intro ? `<div class="lead">${paragraphs(intro)}</div>` : ''}
</div></section>`;
}

// ---------------- דפים ----------------

export function homePage(s, services, gallery) {
  const stats = [1, 2, 3]
    .map((n, i) => {
      const title = s[`home.feature${n}.title`];
      if (!title) return '';
      const stat = s[`home.feature${n}.stat`];
      const top = stat
        ? `<span class="stat-num"><bdi>${esc(stat)}</bdi></span>`
        : `<span class="stat-icon" aria-hidden="true">${[ICONS.star, ICONS.layers, ICONS.heart][i]}</span>`;
      return `<li class="stat">${top}<h3>${esc(title)}</h3>${paragraphs(s[`home.feature${n}.text`])}</li>`;
    })
    .join('');
  const cta = safeUrl(s['home.hero.cta_link']) || '/contact';
  // שלוש התמונות הראשונות בפס שמתחת לכותרת, והשאר בגלריה (אם יש מספיק)
  const strip = gallery.slice(0, 3);
  const grid = gallery.length > 3 ? gallery.slice(3, 9) : gallery;
  const wa = waNumber(s['contact.whatsapp']);
  const accent = s['home.hero.title_accent'];
  const body = `
<section class="hero">
<div class="container">
${s['home.hero.badge'] ? `<p class="badge"><span class="badge-dot" aria-hidden="true"></span>${esc(s['home.hero.badge'])}</p>` : ''}
<h1>${esc(s['home.hero.title'])}${accent ? `<br><span class="accent">${esc(accent)}</span>` : ''}</h1>
<div class="hero-row">
${s['home.hero.subtitle'] ? `<div class="hero-sub">${paragraphs(s['home.hero.subtitle'])}</div>` : '<div></div>'}
<div class="hero-actions">
${s['home.hero.cta_text'] ? `<a class="btn btn-light btn-lg" href="${esc(cta)}">${esc(s['home.hero.cta_text'])}</a>` : ''}
${gallery.length ? '<a class="btn btn-ghost btn-lg" href="/gallery">לגלריה</a>' : ''}
</div>
</div>
</div>
</section>
${
  strip.length === 3
    ? `<div class="container"><ul class="hero-strip" aria-label="מהעבודות שלנו">${strip
        .map((g, i) => `<li>${img(g.image_key, g.alt_text, { width: 800, height: 600, eager: i === 0 })}</li>`)
        .join('')}</ul></div>`
    : ''
}
${stats ? `<section class="stats" aria-label="היתרונות שלנו"><div class="container"><ul class="stats-list">${stats}</ul></div></section>` : ''}
${
  services.length
    ? `<section class="section"><div class="container">
<div class="section-head"><h2>${esc(s['home.services.title'])}</h2><a href="/services" class="more">לכל השירותים <span aria-hidden="true">←</span></a></div>
${bento(services)}
</div></section>`
    : ''
}
${
  grid.length
    ? `<section class="section section-tight"><div class="container">
<div class="section-head"><h2>${esc(s['home.gallery.title'])}</h2><a href="/gallery" class="more">לגלריה המלאה <span aria-hidden="true">←</span></a></div>
${galleryGrid(grid)}
</div></section>`
    : ''
}
${
  s['home.cta.title']
    ? `<section class="cta-wrap"><div class="container"><div class="cta-block">
<div>
<h2>${esc(s['home.cta.title'])}</h2>
${paragraphs(s['home.cta.text'])}
</div>
<div class="cta-actions">
<a class="btn btn-dark btn-lg" href="/contact">${esc(s['home.cta.button'])}</a>
${wa ? `<a class="btn btn-outline-dark btn-lg" href="https://wa.me/${wa}" target="_blank" rel="noopener">וואטסאפ${s['contact.whatsapp'] ? ` ${esc(s['contact.whatsapp'])}` : ''}</a>` : ''}
</div>
</div></div></section>`
    : ''
}`;
  return { id: 'home', ...seo(s, 'home'), body, image: strip[0]?.image_key };
}

export function aboutPage(s) {
  const image = s['about.image'];
  const body = `${pageHead(s['about.title'])}
<section class="section"><div class="container about-grid${image ? '' : ' no-image'}">
<div class="prose">${paragraphs(s['about.text'])}</div>
${image ? `<div class="about-media">${img(image, s['about.image_alt'] || '', { eager: true })}</div>` : ''}
</div></section>`;
  return { id: 'about', ...seo(s, 'about', s['about.title']), body, image };
}

export function servicesPage(s, services) {
  const body = `${pageHead(s['services.title'], s['services.intro'])}
<section class="section"><div class="container">
${services.length ? bento(services, 2) : '<p class="empty">בקרוב יעלו כאן השירותים שלנו.</p>'}
</div></section>`;
  return { id: 'services', ...seo(s, 'services', s['services.title']), body };
}

export function galleryPage(s, gallery) {
  const body = `${pageHead(s['gallery.title'], s['gallery.intro'])}
<section class="section"><div class="container">${galleryGrid(gallery)}</div></section>`;
  return { id: 'gallery', ...seo(s, 'gallery', s['gallery.title']), body, image: gallery[0]?.image_key };
}

const FIELD_LABELS = { name: 'שם מלא', phone: 'טלפון', email: 'מייל', body: 'הודעה' };

/**
 * @param {object} form { values, errors, sent, formError }
 */
export function contactPage(s, form = {}, turnstileSiteKey = '') {
  const v = form.values || {};
  const e = form.errors || {};
  const phone = s['contact.phone'];
  const email = s['contact.email'];
  const wa = waNumber(s['contact.whatsapp']);
  const map = safeUrl(s['contact.map_url']);

  const field = (name, type, { required = false, autocomplete = '', textarea = false, inputmode = '' } = {}) => {
    const id = `f-${name}`;
    const err = e[name];
    const describedBy = err ? ` aria-describedby="${id}-err" aria-invalid="true"` : '';
    const attrs = `id="${id}" name="${name}"${required ? ' required' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''}${describedBy}`;
    const control = textarea
      ? `<textarea ${attrs} rows="5" maxlength="3000">${esc(v[name])}</textarea>`
      : `<input type="${type}" ${attrs} value="${esc(v[name])}" maxlength="${name === 'email' ? 200 : 100}">`;
    return `<div class="field${err ? ' has-error' : ''}">
<label for="${id}">${FIELD_LABELS[name]}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
${control}
<p class="field-error" id="${id}-err" data-error-for="${name}"${err ? '' : ' hidden'}>${esc(err || '')}</p>
</div>`;
  };

  const success = `<div class="form-success" role="status" tabindex="-1" data-form-success${form.sent ? '' : ' hidden'}>${paragraphs(s['contact.success'])}</div>`;

  const formHtml = `<form class="contact-form" method="post" action="/contact" novalidate data-contact-form${form.sent ? ' hidden' : ''}>
<p class="form-note">שדות המסומנים ב-<span aria-hidden="true">*</span><span class="sr-only">כוכבית</span> הם חובה. יש למלא טלפון או מייל.</p>
<div class="form-error" role="alert" data-form-error${form.formError ? '' : ' hidden'}>${esc(form.formError || '')}</div>
${field('name', 'text', { required: true, autocomplete: 'name' })}
<div class="field-row">
${field('phone', 'tel', { autocomplete: 'tel', inputmode: 'tel' })}
${field('email', 'email', { autocomplete: 'email' })}
</div>
${field('body', '', { required: true, textarea: true })}
<div class="hp" aria-hidden="true"><label for="f-website">אתר</label><input type="text" id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
${turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(turnstileSiteKey)}" data-language="he"></div>` : ''}
<button type="submit" class="btn btn-primary btn-lg">שליחה</button>
</form>`;

  const body = `${pageHead(s['contact.title'], s['contact.intro'])}
<section class="section"><div class="container contact-grid">
<div class="card contact-card">${success}${formHtml}</div>
<aside class="contact-info" aria-label="פרטי קשר">
<h2>פרטי התקשרות</h2>
<ul class="info-list">
${phone ? `<li>${ICONS.phone}<a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a></li>` : ''}
${wa ? `<li>${ICONS.whatsapp.replace('width="30" height="30"', 'width="18" height="18"')}<a href="https://wa.me/${wa}" target="_blank" rel="noopener">שליחת הודעה בוואטסאפ</a></li>` : ''}
${email ? `<li>${ICONS.mail}<a href="mailto:${esc(email)}">${esc(email)}</a></li>` : ''}
${s['contact.address'] ? `<li>${ICONS.pin}<span>${esc(s['contact.address'])}</span></li>` : ''}
${map ? `<li>${ICONS.map}<a href="${esc(map)}" target="_blank" rel="noopener">פתיחה במפה (נפתח בחלון חדש)</a></li>` : ''}
</ul>
${s['contact.hours'] ? `<h2>שעות פעילות</h2><div class="hours">${paragraphs(s['contact.hours'])}</div>` : ''}
</aside>
</div></section>`;
  return { id: 'contact', ...seo(s, 'contact', s['contact.title']), body, turnstile: !!turnstileSiteKey };
}

export function accessibilityPage(s) {
  const body = `${pageHead(s['accessibility.title'])}
<section class="section"><div class="container prose">${paragraphs(s['accessibility.text'])}</div></section>`;
  return { id: 'accessibility', ...seo(s, 'accessibility', s['accessibility.title']), body };
}

export function notFoundPage(s) {
  const name = s['business.name'] || config.siteName;
  const body = `<section class="not-found"><div class="container">
<p class="nf-code" aria-hidden="true">404</p>
<h1>הדף לא נמצא</h1>
<p>ייתכן שהקישור שגוי או שהדף הוסר.</p>
<p><a class="btn btn-primary btn-lg" href="/">חזרה לדף הבית</a></p>
</div></section>`;
  return { id: '404', title: `הדף לא נמצא | ${name}`, description: '', body, noindex: true };
}
