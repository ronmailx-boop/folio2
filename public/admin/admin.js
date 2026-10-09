// Folio1 – לוח הניהול (אפליקציית עמוד אחד, JS רגיל).
import { h, clear, icon, api, ApiError, setUnauthorizedHandler, toast, confirmDialog, openDialog, drafts, pref, mediaUrl, compressImage, uploadImage, formatBytes, formatDate } from './lib.js';

const app = document.getElementById('app');
let boot = null; // נתוני /api/admin/bootstrap
let dirty = false; // יש שינויים שלא נשמרו בטופס הנוכחי
let content; // אזור התוכן
let titleEl;
let navEl;
let scrim;

const NAV = [
  ['overview', 'סקירה', 'home'],
  ['texts', 'טקסטים', 'text'],
  ['gallery', 'גלריה', 'image'],
  ['services', 'שירותים', 'list'],
  ['messages', 'הודעות', 'mail'],
  ['settings', 'הגדרות', 'cog'],
  ['account', 'חשבון', 'user'],
];

window.addEventListener('beforeunload', (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

setUnauthorizedHandler(() => showLogin());
start();

async function start() {
  try {
    boot = await api('GET', '/api/admin/bootstrap');
  } catch (e) {
    if (e.status === 401) return; // מסך ההתחברות כבר מוצג
    clear(app, h('div', { class: 'boot' }, h('p', { text: e.message }), h('button', { class: 'btn', type: 'button', text: 'נסו שוב', onClick: start })));
    return;
  }
  renderShell();
  window.addEventListener('hashchange', route);
  route();
  if (boot.demo && !pref('welcomed')) {
    pref('welcomed', '1');
    showDemoGuide();
  }
}

// =====================================================================
// התחברות
// =====================================================================

async function showLogin(message) {
  boot = null;
  dirty = false;
  window.removeEventListener('hashchange', route);
  const info = await api('GET', '/api/public-info').catch(() => ({}));
  const email = h('input', { type: 'email', id: 'l-email', autocomplete: 'username', required: true, dir: 'ltr' });
  const password = h('input', { type: 'password', id: 'l-pass', autocomplete: 'current-password', required: true, dir: 'ltr' });
  const err = h('div', { class: 'alert-box alert-error', role: 'alert', hidden: !message, text: message || '' });
  const btn = h('button', { class: 'btn btn-block', type: 'submit', text: 'כניסה' });

  let banner = null;
  if (info.demo) {
    banner = h(
      'div',
      { class: 'demo-banner' },
      h('strong', { text: 'זהו אתר דמו. ' }),
      'אפשר להיכנס ולנסות הכול:',
      h('br'),
      'מייל: ',
      h('code', { text: info.demoEmail }),
      h('br'),
      'סיסמה: ',
      info.demoPassword ? h('code', { text: info.demoPassword }) : h('em', { text: '(לא הוגדרה)' }),
      h('br'),
      info.demoPassword
        ? h('button', {
            class: 'btn btn-ghost btn-sm',
            type: 'button',
            text: 'מלא את פרטי הדמו',
            onClick: () => {
              email.value = info.demoEmail;
              password.value = info.demoPassword;
              btn.focus();
            },
          })
        : null,
      h('p', { class: 'small muted', text: 'כל השינויים מתאפסים אוטומטית כל לילה.' }),
    );
  }

  const form = h(
    'form',
    {
      novalidate: true,
      onSubmit: async (e) => {
        e.preventDefault();
        err.hidden = true;
        if (!email.value.trim() || !password.value) {
          err.textContent = 'נא למלא מייל וסיסמה.';
          err.hidden = false;
          return;
        }
        btn.disabled = true;
        btn.textContent = 'מתחבר...';
        try {
          await api('POST', '/api/login', { email: email.value, password: password.value });
          await start();
        } catch (ex) {
          err.textContent = ex.message;
          err.hidden = false;
          btn.disabled = false;
          btn.textContent = 'כניסה';
        }
      },
    },
    err,
    h('div', { class: 'field' }, h('label', { for: 'l-email', text: 'מייל' }), email),
    h('div', { class: 'field' }, h('label', { for: 'l-pass', text: 'סיסמה' }), password),
    btn,
  );

  clear(
    app,
    h(
      'main',
      { class: 'login-wrap' },
      h('div', { class: 'login-card' }, h('div', { class: 'login-mark', 'aria-hidden': 'true', text: ((info.siteName || 'F').trim().charAt(0)) }), h('h1', { text: 'כניסה ללוח הניהול' }), banner, form, h('p', { class: 'small muted' }, h('a', { href: '/', text: 'חזרה לאתר' }))),
    ),
  );
  email.focus();
}

// =====================================================================
// מבנה הלוח
// =====================================================================

function renderShell() {
  titleEl = h('div', { class: 'title' });
  scrim = h('div', { class: 'scrim', hidden: true, onClick: closeNav });
  const menuBtn = h('button', { class: 'btn btn-ghost btn-icon menu-btn', type: 'button', 'aria-label': 'פתיחת התפריט', 'aria-controls': 'sidenav', onClick: openNav }, icon('menu'));
  const navList = h(
    'ul',
    { class: 'nav-list' },
    NAV.map(([id, label, ic]) =>
      h('li', {}, h('a', { href: `#${id}`, dataset: { nav: id } }, icon(ic), h('span', { text: label }), id === 'messages' ? h('span', { class: 'badge', id: 'unread-badge', hidden: true }) : null)),
    ),
  );
  navEl = h(
    'nav',
    { class: 'sidenav', id: 'sidenav', 'aria-label': 'תפריט הלוח' },
    h('div', { class: 'side-brand' }, h('span', { class: 'mark', 'aria-hidden': 'true', text: (boot.values['business.name'] || 'F').trim().charAt(0) }), h('span', { text: boot.values['business.name'] || 'לוח ניהול' })),
    navList,
    h('div', { class: 'side-foot' }, h('a', { href: '/', target: '_blank', rel: 'noopener', text: 'צפה באתר ↗' }), h('a', { href: '#account', text: boot.user.email })),
  );
  content = h('main', { class: 'content', id: 'content', tabindex: '-1' });
  clear(
    app,
    h(
      'div',
      { class: 'shell' },
      navEl,
      scrim,
      h(
        'div',
        { class: 'main-col' },
        h('header', { class: 'topbar' }, menuBtn, titleEl, h('a', { class: 'btn btn-ghost btn-sm', href: '/', target: '_blank', rel: 'noopener' }, icon('external'), h('span', { text: 'צפה באתר' }))),
        content,
      ),
    ),
  );
  setUnread(boot.counts.unread);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navEl.classList.contains('open')) closeNav();
  });
}

function openNav() {
  navEl.classList.add('open');
  scrim.hidden = false;
  navEl.querySelector('a').focus();
}
function closeNav() {
  navEl.classList.remove('open');
  scrim.hidden = true;
}

function setUnread(n) {
  boot.counts.unread = n;
  const b = document.getElementById('unread-badge');
  if (!b) return;
  b.textContent = String(n);
  b.hidden = !n;
  b.setAttribute('aria-label', `${n} הודעות חדשות`);
}

async function route() {
  if (!boot) return;
  if (dirty && !(await confirmDialog('יש שינויים שלא נשמרו. הם שמורים כטיוטה במכשיר ואפשר יהיה לשחזר אותם. לעבור בכל זאת?', { ok: 'לעבור', cancel: 'להישאר' }))) {
    history.replaceState(null, '', route.last || '#overview');
    return;
  }
  dirty = false;
  const hash = location.hash.slice(1) || 'overview';
  route.last = '#' + hash;
  const [view, arg] = hash.split('/');
  const item = NAV.find(([id]) => id === view) || NAV[0];
  navEl.querySelectorAll('a[data-nav]').forEach((a) => (a.dataset.nav === item[0] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  titleEl.textContent = item[1];
  document.title = `${item[1]} – לוח ניהול`;
  closeNav();
  clear(content, h('div', { class: 'loading' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), ' טוען...'));
  const views = { overview, texts, gallery, services, messages, settings, account };
  try {
    await views[item[0]](arg);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return;
    clear(content, h('div', { class: 'alert-box alert-error', role: 'alert', text: e.message || 'משהו השתבש.' }), h('button', { class: 'btn', type: 'button', text: 'נסו שוב', onClick: route }));
  }
  content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// =====================================================================
// סקירה
// =====================================================================

async function overview() {
  const c = boot.counts;
  const stat = (n, label, href, alert) => h('a', { class: `stat${alert ? ' alert' : ''}`, href }, h('strong', { text: String(n) }), h('span', { text: label }));
  clear(
    content,
    h('div', { class: 'page-head' }, h('h1', { text: `שלום${boot.values['business.name'] ? ', ' + boot.values['business.name'] : ''}` })),
    boot.demo
      ? h(
          'div',
          { class: 'tip' },
          h('strong', { text: 'זה אתר דמו. ' }),
          'נסו לשנות את הכותרת בלוח הניהול ולראות את האתר מתעדכן. ',
          h('button', { class: 'btn btn-sm', type: 'button', text: 'איך מתחילים?', onClick: showDemoGuide }),
        )
      : null,
    h('div', { class: 'stats' }, stat(c.unread, 'הודעות חדשות', '#messages', c.unread > 0), stat(c.services, 'שירותים', '#services'), stat(c.gallery, 'תמונות', '#gallery')),
    h(
      'div',
      { class: 'card' },
      h('h2', { text: 'קיצורי דרך' }),
      h(
        'div',
        { class: 'btn-row' },
        h('a', { class: 'btn', href: '#gallery' }, icon('plus'), 'הוסף תמונה'),
        h('a', { class: 'btn', href: '#services/new' }, icon('plus'), 'הוסף שירות'),
        h('a', { class: 'btn btn-ghost', href: '#texts/home' }, icon('edit'), 'ערוך טקסטים'),
        h('a', { class: 'btn btn-ghost', href: '/', target: '_blank', rel: 'noopener' }, icon('external'), 'צפה באתר'),
      ),
    ),
  );
}

function showDemoGuide() {
  const go = h('button', {
    class: 'btn',
    type: 'button',
    text: 'בואו ננסה',
    onClick: () => {
      dlg.close();
      location.hash = '#texts/home';
    },
  });
  const close = h('button', { class: 'btn btn-ghost', type: 'button', text: 'סגירה', onClick: () => dlg.close() });
  const dlg = openDialog(
    'איך מתחילים?',
    h(
      'div',
      {},
      h('p', { text: 'ככה תראו את הלוח בפעולה, בפחות מדקה:' }),
      h(
        'ol',
        { class: 'steps' },
        h('li', { text: 'פתחו את "טקסטים" ובחרו "דף הבית".' }),
        h('li', { text: 'שנו את "כותרת ראשית" למשהו משלכם.' }),
        h('li', { text: 'לחצו "שמירה".' }),
        h('li', { text: 'לחצו "צפה באתר" וראו שהכותרת התעדכנה מיד.' }),
        h('li', { text: 'אפשר גם להעלות תמונה מהטלפון לגלריה, או לשנות את הצבע הראשי ב"הגדרות".' }),
      ),
      h('p', { class: 'small muted', text: 'זה אתר דמו: הכול מתאפס אוטומטית כל לילה, אז אי אפשר לקלקל כלום.' }),
    ),
    [go, close],
  );
  go.focus();
}

// =====================================================================
// טפסים שנוצרים מ-site.config.json
// =====================================================================

/**
 * בונה טופס משדות. מחזיר אלמנט.
 * fields: [{ key, label, type, group }], values: { key: value }
 */
function fieldsForm({ fields, draftKey, extraTop = null }) {
  const controls = new Map(); // key -> { get, set, wrap, err }
  const initial = {};
  for (const f of fields) initial[f.key] = boot.values[f.key] ?? '';

  const savedNote = h('span', { class: 'saved-note', role: 'status', hidden: true });
  const formErr = h('div', { class: 'alert-box alert-error', role: 'alert', hidden: true });
  const saveBtn = h('button', { class: 'btn', type: 'submit', text: 'שמירה' });

  const collect = () => Object.fromEntries([...controls].map(([k, c]) => [k, c.get()]));
  const changed = () => {
    const v = collect();
    return Object.keys(v).some((k) => v[k] !== initial[k]);
  };
  const onInput = () => {
    savedNote.hidden = true;
    dirty = changed();
    if (dirty) drafts.set(draftKey, { at: Date.now(), values: collect() });
    else drafts.clear(draftKey);
  };

  const main = [];
  const seo = [];
  for (const f of fields) {
    const ctl = fieldControl(f, initial[f.key], onInput);
    controls.set(f.key, ctl);
    (f.group === 'seo' ? seo : main).push(ctl.wrap);
  }

  // טיוטה שלא נשמרה
  let draftBox = null;
  const draft = drafts.get(draftKey);
  if (draft && Object.entries(draft.values || {}).some(([k, v]) => controls.has(k) && v !== initial[k])) {
    draftBox = h(
      'div',
      { class: 'alert-box alert-warn', role: 'status' },
      h('p', { text: `נמצאה טיוטה שלא נשמרה (${formatDate(Math.floor(draft.at / 1000))}).` }),
      h(
        'div',
        { class: 'btn-row' },
        h('button', {
          class: 'btn btn-sm',
          type: 'button',
          text: 'שחזר טיוטה',
          onClick: () => {
            for (const [k, v] of Object.entries(draft.values)) controls.get(k)?.set(v);
            draftBox.remove();
            onInput();
            toast('הטיוטה שוחזרה. אל תשכחו ללחוץ "שמירה".');
          },
        }),
        h('button', {
          class: 'btn btn-ghost btn-sm',
          type: 'button',
          text: 'התעלם',
          onClick: () => {
            drafts.clear(draftKey);
            draftBox.remove();
          },
        }),
      ),
    );
  }

  const form = h(
    'form',
    {
      novalidate: true,
      onSubmit: async (e) => {
        e.preventDefault();
        formErr.hidden = true;
        controls.forEach((c) => c.setError(''));
        const values = collect();
        saveBtn.disabled = true;
        saveBtn.textContent = 'שומר...';
        try {
          await api('PUT', '/api/admin/settings', { values });
          Object.assign(boot.values, values);
          Object.assign(initial, values);
          drafts.clear(draftKey);
          dirty = false;
          savedNote.textContent = '✓ נשמר. האתר עודכן.';
          savedNote.hidden = false;
          toast('נשמר בהצלחה ✓', 'ok');
        } catch (ex) {
          if (ex.data?.errors) for (const [k, m] of Object.entries(ex.data.errors)) controls.get(k)?.setError(m);
          formErr.textContent = ex.data?.network ? 'אין חיבור לאינטרנט. השינויים נשמרו כטיוטה במכשיר. נסו לשמור שוב כשהחיבור יחזור.' : ex.message;
          formErr.hidden = false;
          formErr.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'שמירה';
        }
      },
    },
    draftBox,
    extraTop,
    formErr,
    h('div', { class: 'card' }, main),
    seo.length ? h('fieldset', { class: 'card' }, h('legend', { text: 'איך הדף יופיע בגוגל' }), h('p', { class: 'hint', text: 'לא חובה. אם משאירים ריק, משתמשים בשם העסק.' }), seo) : null,
    h('div', { class: 'save-bar' }, saveBtn, savedNote),
  );
  return form;
}

let uid = 0;

/** פקד יחיד לפי סוג השדה. */
function fieldControl(f, value, onInput) {
  const id = `fld-${++uid}`;
  const err = h('p', { class: 'err', id: `${id}-err`, hidden: true });
  const wrap = h('div', { class: 'field' });
  let get;
  let set;

  if (f.type === 'image') {
    const ctl = imageControl({ value, label: f.label, onChange: onInput });
    get = ctl.get;
    set = ctl.set;
    wrap.append(h('span', { class: 'label', text: f.label }), ctl.el);
  } else if (f.type === 'color') {
    const color = h('input', { type: 'color', id, value: value || f.default || '#7367f0', 'aria-label': `${f.label} – בורר` });
    const text = h('input', { type: 'text', value: value || f.default || '#7367f0', 'aria-label': `${f.label} – קוד צבע`, maxlength: 7, dir: 'ltr', inputmode: 'text' });
    const btnSample = h('span', { class: 'sample-btn', text: 'כפתור לדוגמה' });
    const band = h('span', { class: 'sample-band', text: 'כותרת מודגשת' });
    const paint = (c) => {
      if (!/^#[0-9a-f]{6}$/i.test(c)) return;
      // כמו באתר: צבע ההדגשה הוא הגוון הבהיר של הצבע הראשי, על רקע כהה
      const accent = `color-mix(in srgb, ${c} 55%, #fff)`;
      btnSample.style.background = accent;
      band.style.color = accent;
    };
    color.addEventListener('input', () => {
      text.value = color.value;
      paint(color.value);
      onInput();
    });
    text.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(text.value)) {
        color.value = text.value;
        paint(text.value);
      }
      onInput();
    });
    paint(color.value);
    get = () => text.value.trim().toLowerCase();
    set = (v) => {
      text.value = v;
      if (/^#[0-9a-f]{6}$/i.test(v)) color.value = v;
      paint(v);
    };
    wrap.append(
      h('label', { for: id, text: f.label }),
      h('div', { class: 'color-row' }, color, text, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'ברירת מחדל', onClick: () => (set(f.default || '#7367f0'), onInput()) })),
      h('div', { class: 'color-preview', 'aria-hidden': 'true' }, btnSample, band),
    );
  } else {
    const multiline = f.type === 'paragraph';
    const inputType = { url: 'url', tel: 'tel', email: 'email' }[f.type] || 'text';
    const input = multiline
      ? h('textarea', { id, rows: 4, onInput })
      : h('input', { id, type: inputType, onInput, dir: ['url', 'email', 'tel'].includes(f.type) ? 'ltr' : undefined, inputmode: f.type === 'tel' ? 'tel' : undefined });
    input.value = value;
    get = () => input.value;
    set = (v) => (input.value = v);
    wrap.append(h('label', { for: id, text: f.label }), input);
    if (f.type === 'url') wrap.append(h('p', { class: 'hint', text: 'קישור מלא שמתחיל ב-\u2066https://\u2069, או נתיב באתר כמו \u2066/contact\u2069' }));
  }
  wrap.append(err);
  return {
    wrap,
    get,
    set,
    setError(msg) {
      err.textContent = msg;
      err.hidden = !msg;
      wrap.classList.toggle('error', !!msg);
    },
  };
}

/** בחירת תמונה: דחיסה בדפדפן, העלאה ל-R2, תצוגה מקדימה. */
function imageControl({ value, label, onChange }) {
  let current = value || '';
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/*', hidden: true });
  const preview = h('div');
  const status = h('p', { class: 'hint', role: 'status' });
  const pick = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onClick: () => file.click() });
  const remove = h('button', { class: 'btn btn-danger btn-sm', type: 'button', text: 'הסר' });

  const paint = () => {
    clear(preview, current ? h('img', { class: 'thumb', src: mediaUrl(current), alt: `תצוגה מקדימה: ${label}` }) : h('div', { class: 'thumb-empty', text: 'אין תמונה' }));
    pick.textContent = current ? 'החלפת תמונה' : 'בחירת תמונה';
    remove.hidden = !current;
  };
  remove.addEventListener('click', () => {
    current = '';
    paint();
    onChange();
  });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (!f) return;
    pick.disabled = true;
    status.textContent = 'מכווץ ומעלה את התמונה...';
    try {
      current = await uploadImage(f, boot.limits.maxUploadBytes);
      paint();
      status.textContent = 'התמונה הועלתה. לחצו "שמירה" כדי לעדכן את האתר.';
      onChange();
    } catch (e) {
      status.textContent = '';
      toast(e.message, 'error');
    } finally {
      pick.disabled = false;
    }
  });
  paint();
  return {
    el: h('div', {}, h('div', { class: 'image-field' }, preview, h('div', { class: 'btn-row' }, pick, remove)), file, status),
    get: () => current,
    set: (v) => {
      current = v || '';
      paint();
    },
  };
}

// =====================================================================
// טקסטים
// =====================================================================

async function texts(pageId) {
  const pages = boot.pages.filter((p) => boot.fields.some((f) => f.page === p.id));
  const page = pages.find((p) => p.id === pageId) || pages[0];
  const chips = h(
    'div',
    { class: 'chips', role: 'group', 'aria-label': 'בחירת דף' },
    pages.map((p) => h('a', { class: 'chip', href: `#texts/${p.id}`, 'aria-pressed': String(p.id === page.id), role: 'button', text: p.label })),
  );
  const fields = boot.fields.filter((f) => f.page === page.id);
  clear(
    content,
    h(
      'div',
      { class: 'page-head' },
      h('h1', { text: 'עריכת טקסטים' }),
      page.path ? h('a', { class: 'btn btn-ghost btn-sm', href: page.path, target: '_blank', rel: 'noopener' }, icon('external'), `צפה בדף "${page.label}"`) : null,
    ),
    h('p', { class: 'muted', text: 'בחרו דף, שנו את הטקסטים ולחצו "שמירה". האתר מתעדכן מיד.' }),
    chips,
    fieldsForm({ fields, draftKey: `texts:${page.id}` }),
  );
}

// =====================================================================
// הגדרות
// =====================================================================

async function settings() {
  clear(
    content,
    h('div', { class: 'page-head' }, h('h1', { text: 'הגדרות העסק' })),
    h('p', { class: 'muted', text: 'פרטי העסק מופיעים בתחתית האתר, בדף צור קשר ובכפתור הוואטסאפ. שדה ריק פשוט לא יוצג.' }),
    fieldsForm({ fields: boot.settingsFields, draftKey: 'settings' }),
  );
}

// =====================================================================
// גלריה
// =====================================================================

async function gallery() {
  let items = (await api('GET', '/api/admin/gallery')).items;
  const max = boot.limits.maxGallery;
  const countEl = h('span', { class: 'muted' });
  const list = h('ul', { class: 'items', 'aria-label': 'תמונות בגלריה' });
  const progress = h('ul', { class: 'progress-list', 'aria-live': 'polite' });
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/*', multiple: true, hidden: true, id: 'gal-file' });
  const pickBtn = h('button', { class: 'btn', type: 'button', onClick: () => file.click() }, icon('plus'), 'בחירת תמונות');
  const zone = h(
    'div',
    { class: 'upload-zone' },
    h('p', { text: 'בחרו תמונה אחת או כמה. התמונות מוקטנות אוטומטית לפני ההעלאה.' }),
    pickBtn,
    h('p', { class: 'hint', text: 'במחשב אפשר גם לגרור תמונות לכאן.' }),
    file,
    progress,
  );

  const updateCount = () => {
    countEl.textContent = `${items.length} מתוך ${max} תמונות`;
    boot.counts.gallery = items.length;
    pickBtn.disabled = items.length >= max;
  };

  async function handleFiles(files) {
    files = [...files];
    if (!files.length) return;
    const room = max - items.length;
    if (room <= 0) return toast(`הגעתם למספר המרבי של תמונות (${max}).`, 'error');
    if (files.length > room) {
      toast(`אפשר להוסיף עוד ${room} תמונות בלבד. מעלים את הראשונות.`, 'error');
      files = files.slice(0, room);
    }
    clear(progress);
    pickBtn.disabled = true;
    let added = 0;
    for (const f of files) {
      const li = h('li', { text: `⏳ ${f.name}: מכווץ...` });
      progress.append(li);
      try {
        const { blob } = await compressImage(f, { maxBytes: boot.limits.maxUploadBytes });
        li.textContent = `⏳ ${f.name}: מעלה (${formatBytes(f.size)} ← ${formatBytes(blob.size)})...`;
        const up = await api('POST', '/api/admin/upload', blob, { raw: true, contentType: blob.type });
        const { item } = await api('POST', '/api/admin/gallery', { image_key: up.key, alt_text: '', caption: '' });
        items.push(item);
        added++;
        li.textContent = `✓ ${f.name}: הועלתה (${formatBytes(f.size)} ← ${formatBytes(blob.size)})`;
      } catch (e) {
        li.textContent = `✗ ${f.name}: ${e.message}`;
      }
    }
    renderList();
    updateCount();
    if (added) toast(`${added} תמונות נוספו. מומלץ להוסיף לכל תמונה תיאור קצר.`, 'ok');
  }

  file.addEventListener('change', () => {
    const files = file.files;
    handleFiles(files).finally(() => (file.value = ''));
  });
  zone.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    zone.classList.add('over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    zone.classList.remove('over');
    handleFiles(e.dataTransfer.files);
  });

  async function saveOrder() {
    try {
      await api('POST', '/api/admin/gallery/reorder', { ids: items.map((i) => i.id) });
      toast('הסדר נשמר ✓', 'ok');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const move = (idx, to) => {
    if (to < 0 || to >= items.length) return;
    const [it] = items.splice(idx, 1);
    items.splice(to, 0, it);
    renderList(it.id);
    saveOrder();
  };

  function renderList(focusId) {
    if (!items.length) {
      clear(list, h('li', { class: 'empty-state', text: 'עדיין אין תמונות. לחצו "בחירת תמונות" כדי להעלות את הראשונה.' }));
      return;
    }
    clear(
      list,
      items.map((it, idx) => galleryItem(it, idx)),
    );
    if (focusId) list.querySelector(`[data-id="${focusId}"] .mv`)?.focus();
  }

  function galleryItem(it, idx) {
    const alt = h('input', { type: 'text', value: it.alt_text, maxlength: 200, id: `alt-${it.id}` });
    const cap = h('input', { type: 'text', value: it.caption, maxlength: 200, id: `cap-${it.id}` });
    const altHint = h('p', { class: 'hint', text: 'מומלץ: תארו במילים מה רואים בתמונה (חשוב לנגישות ולגוגל).', hidden: !!it.alt_text });
    const save = h('button', { class: 'btn btn-sm', type: 'button', text: 'שמירה', hidden: true });
    const onEdit = () => (save.hidden = alt.value === it.alt_text && cap.value === it.caption);
    alt.addEventListener('input', onEdit);
    cap.addEventListener('input', onEdit);
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        const { item } = await api('PUT', `/api/admin/gallery/${it.id}`, { alt_text: alt.value, caption: cap.value });
        Object.assign(it, item);
        save.hidden = true;
        altHint.hidden = !!it.alt_text;
        toast('נשמר ✓', 'ok');
      } catch (e) {
        toast(e.message, 'error');
      } finally {
        save.disabled = false;
      }
    });
    const visBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, icon(it.is_visible ? 'eyeOff' : 'eye'), it.is_visible ? 'הסתר' : 'הצג');
    visBtn.addEventListener('click', async () => {
      try {
        const { item } = await api('PUT', `/api/admin/gallery/${it.id}`, { is_visible: !it.is_visible });
        Object.assign(it, item);
        renderList();
        toast(it.is_visible ? 'התמונה מוצגת באתר' : 'התמונה הוסתרה מהאתר', 'ok');
      } catch (e) {
        toast(e.message, 'error');
      }
    });
    const del = h('button', { class: 'btn btn-danger btn-sm', type: 'button' }, icon('trash'), 'מחיקה');
    del.addEventListener('click', async () => {
      if (!(await confirmDialog('למחוק את התמונה? אי אפשר לבטל את הפעולה.', { ok: 'כן, למחוק', danger: true }))) return;
      try {
        await api('DELETE', `/api/admin/gallery/${it.id}`);
        items = items.filter((x) => x.id !== it.id);
        renderList();
        updateCount();
        toast('התמונה נמחקה', 'ok');
      } catch (e) {
        toast(e.message, 'error');
      }
    });

    const li = h(
      'li',
      { class: `item gallery-item${it.is_visible ? '' : ' is-hidden'}`, dataset: { id: it.id } },
      h('img', { class: 'thumb', src: mediaUrl(it.image_key), alt: it.alt_text || 'תמונה ללא תיאור', loading: 'lazy' }),
      h(
        'div',
        { class: 'item-body' },
        it.is_visible ? null : h('p', {}, h('span', { class: 'tag tag-hidden', text: 'מוסתרת מהאתר' })),
        h('div', { class: 'field' }, h('label', { for: alt.id, text: 'תיאור התמונה' }), alt, altHint),
        h('div', { class: 'field' }, h('label', { for: cap.id, text: 'כיתוב (לא חובה)' }), cap),
        save,
      ),
      h(
        'div',
        { class: 'item-actions' },
        h('button', { class: 'btn btn-ghost btn-sm btn-icon mv', type: 'button', 'aria-label': 'הזז למעלה', disabled: idx === 0, onClick: () => move(idx, idx - 1) }, icon('up')),
        h('button', { class: 'btn btn-ghost btn-sm btn-icon', type: 'button', 'aria-label': 'הזז למטה', disabled: idx === items.length - 1, onClick: () => move(idx, idx + 1) }, icon('down')),
        visBtn,
        del,
      ),
    );
    enableDrag(li, it.id, (fromId, toId) => {
      const from = items.findIndex((x) => x.id === fromId);
      const to = items.findIndex((x) => x.id === toId);
      if (from > -1 && to > -1 && from !== to) move(from, to);
    });
    return li;
  }

  clear(
    content,
    h('div', { class: 'page-head' }, h('h1', { text: 'גלריה' }), countEl),
    zone,
    h('p', { class: 'hint', text: 'כדי לשנות סדר: כפתורי החצים, או גרירה במחשב.' }),
    list,
  );
  renderList();
  updateCount();
}

/** גרירה לשינוי סדר (במחשב בלבד; במובייל יש כפתורי חצים). */
function enableDrag(li, id, onDrop) {
  if (!matchMedia('(pointer: fine)').matches) return;
  li.draggable = true;
  li.addEventListener('dragstart', (e) => {
    if (e.target.closest('input, textarea, button')) return;
    e.dataTransfer.setData('text/x-folio-id', String(id));
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', () => li.classList.remove('dragging'));
  li.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('text/x-folio-id')) return;
    e.preventDefault();
    li.classList.add('drop-target');
  });
  li.addEventListener('dragleave', () => li.classList.remove('drop-target'));
  li.addEventListener('drop', (e) => {
    const from = Number(e.dataTransfer.getData('text/x-folio-id'));
    li.classList.remove('drop-target');
    if (!from) return;
    e.preventDefault();
    onDrop(from, id);
  });
}

// =====================================================================
// שירותים
// =====================================================================

async function services(arg) {
  if (arg) return serviceEditor(arg);
  let items = (await api('GET', '/api/admin/services')).items;
  const max = boot.limits.maxServices;
  const list = h('ul', { class: 'items', 'aria-label': 'רשימת שירותים' });
  boot.counts.services = items.length;

  const move = async (idx, to) => {
    if (to < 0 || to >= items.length) return;
    const [it] = items.splice(idx, 1);
    items.splice(to, 0, it);
    render(it.id);
    try {
      await api('POST', '/api/admin/services/reorder', { ids: items.map((i) => i.id) });
      toast('הסדר נשמר ✓', 'ok');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  function render(focusId) {
    if (!items.length) {
      clear(list, h('li', { class: 'empty-state', text: 'עדיין אין שירותים. לחצו "הוסף שירות" כדי להתחיל.' }));
      return;
    }
    clear(
      list,
      items.map((it, idx) => {
        const vis = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, icon(it.is_visible ? 'eyeOff' : 'eye'), it.is_visible ? 'הסתר' : 'הצג');
        vis.addEventListener('click', async () => {
          try {
            const { item } = await api('PUT', `/api/admin/services/${it.id}`, { is_visible: !it.is_visible });
            Object.assign(it, item);
            render();
            toast(it.is_visible ? 'השירות מוצג באתר' : 'השירות הוסתר מהאתר', 'ok');
          } catch (e) {
            toast(e.message, 'error');
          }
        });
        const del = h('button', { class: 'btn btn-danger btn-sm', type: 'button' }, icon('trash'), 'מחיקה');
        del.addEventListener('click', async () => {
          if (!(await confirmDialog(`למחוק את השירות "${it.title}"? אי אפשר לבטל את הפעולה.`, { ok: 'כן, למחוק', danger: true }))) return;
          try {
            await api('DELETE', `/api/admin/services/${it.id}`);
            items = items.filter((x) => x.id !== it.id);
            boot.counts.services = items.length;
            render();
            toast('השירות נמחק', 'ok');
          } catch (e) {
            toast(e.message, 'error');
          }
        });
        const li = h(
          'li',
          { class: `item${it.is_visible ? '' : ' is-hidden'}`, dataset: { id: it.id } },
          it.image_key ? h('img', { class: 'thumb', src: mediaUrl(it.image_key), alt: '', loading: 'lazy' }) : h('div', { class: 'thumb thumb-empty', text: 'אין תמונה' }),
          h(
            'div',
            { class: 'item-body' },
            h('p', { class: 'item-title', text: it.title }),
            it.price_text ? h('p', { class: 'small muted', text: it.price_text }) : null,
            it.is_visible ? null : h('span', { class: 'tag tag-hidden', text: 'מוסתר מהאתר' }),
          ),
          h(
            'div',
            { class: 'item-actions' },
            h('a', { class: 'btn btn-sm', href: `#services/${it.id}` }, icon('edit'), 'עריכה'),
            h('button', { class: 'btn btn-ghost btn-sm btn-icon mv', type: 'button', 'aria-label': `הזז את "${it.title}" למעלה`, disabled: idx === 0, onClick: () => move(idx, idx - 1) }, icon('up')),
            h('button', { class: 'btn btn-ghost btn-sm btn-icon', type: 'button', 'aria-label': `הזז את "${it.title}" למטה`, disabled: idx === items.length - 1, onClick: () => move(idx, idx + 1) }, icon('down')),
            vis,
            del,
          ),
        );
        enableDrag(li, it.id, (fromId, toId) => {
          const from = items.findIndex((x) => x.id === fromId);
          const to = items.findIndex((x) => x.id === toId);
          if (from > -1 && to > -1 && from !== to) move(from, to);
        });
        return li;
      }),
    );
    if (focusId) list.querySelector(`[data-id="${focusId}"] .mv`)?.focus();
  }

  clear(
    content,
    h(
      'div',
      { class: 'page-head' },
      h('h1', { text: 'שירותים' }),
      items.length < max ? h('a', { class: 'btn', href: '#services/new' }, icon('plus'), 'הוסף שירות') : h('span', { class: 'muted', text: `הגעתם למקסימום (${max})` }),
    ),
    list,
  );
  render();
}

async function serviceEditor(arg) {
  const isNew = arg === 'new';
  let svc = { title: '', description: '', price_text: '', image_key: '', is_visible: 1 };
  if (!isNew) {
    const { items } = await api('GET', '/api/admin/services');
    const found = items.find((x) => String(x.id) === arg);
    if (!found) {
      clear(content, h('div', { class: 'alert-box alert-error', text: 'השירות לא נמצא (אולי נמחק).' }), h('a', { class: 'btn', href: '#services', text: 'חזרה לשירותים' }));
      return;
    }
    svc = found;
  }
  const draftKey = `service:${arg}`;
  const title = h('input', { type: 'text', id: 'svc-title', maxlength: 120, value: svc.title, required: true });
  const desc = h('textarea', { id: 'svc-desc', maxlength: 2000, rows: 5 });
  desc.value = svc.description;
  const price = h('input', { type: 'text', id: 'svc-price', maxlength: 60, value: svc.price_text, placeholder: 'למשל: החל מ-₪350' });
  const visible = h('input', { type: 'checkbox', id: 'svc-vis', checked: !!svc.is_visible });
  const titleErr = h('p', { class: 'err', hidden: true });
  const formErr = h('div', { class: 'alert-box alert-error', role: 'alert', hidden: true });
  const collect = () => ({ title: title.value, description: desc.value, price_text: price.value, image_key: img.get() || null, is_visible: visible.checked });
  const onInput = () => {
    dirty = true;
    drafts.set(draftKey, { at: Date.now(), values: collect() });
  };
  const img = imageControl({ value: svc.image_key, label: 'תמונת השירות', onChange: onInput });
  [title, desc, price].forEach((el) => el.addEventListener('input', onInput));
  visible.addEventListener('change', onInput);

  let draftBox = null;
  const draft = drafts.get(draftKey);
  if (draft) {
    draftBox = h(
      'div',
      { class: 'alert-box alert-warn' },
      h('p', { text: 'נמצאה טיוטה שלא נשמרה.' }),
      h(
        'div',
        { class: 'btn-row' },
        h('button', {
          class: 'btn btn-sm',
          type: 'button',
          text: 'שחזר טיוטה',
          onClick: () => {
            const v = draft.values;
            title.value = v.title || '';
            desc.value = v.description || '';
            price.value = v.price_text || '';
            img.set(v.image_key || '');
            visible.checked = !!v.is_visible;
            draftBox.remove();
            dirty = true;
          },
        }),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'התעלם', onClick: () => (drafts.clear(draftKey), draftBox.remove()) }),
      ),
    );
  }

  const saveBtn = h('button', { class: 'btn', type: 'submit', text: isNew ? 'הוספת השירות' : 'שמירה' });
  const form = h(
    'form',
    {
      novalidate: true,
      onSubmit: async (e) => {
        e.preventDefault();
        formErr.hidden = true;
        titleErr.hidden = !!title.value.trim();
        titleErr.textContent = 'נא למלא כותרת.';
        if (!title.value.trim()) return title.focus();
        saveBtn.disabled = true;
        try {
          if (isNew) await api('POST', '/api/admin/services', collect());
          else await api('PUT', `/api/admin/services/${svc.id}`, collect());
          drafts.clear(draftKey);
          dirty = false;
          toast(isNew ? 'השירות נוסף ✓' : 'השירות נשמר ✓', 'ok');
          location.hash = '#services';
        } catch (ex) {
          formErr.textContent = ex.data?.network ? 'אין חיבור לאינטרנט. השינויים נשמרו כטיוטה במכשיר.' : ex.message;
          formErr.hidden = false;
        } finally {
          saveBtn.disabled = false;
        }
      },
    },
    draftBox,
    formErr,
    h(
      'div',
      { class: 'card' },
      h('div', { class: 'field' }, h('label', { for: 'svc-title', text: 'כותרת *' }), title, titleErr),
      h('div', { class: 'field' }, h('label', { for: 'svc-desc', text: 'תיאור' }), desc),
      h('div', { class: 'field' }, h('label', { for: 'svc-price', text: 'מחיר (לא חובה, טקסט חופשי)' }), price, h('p', { class: 'hint', text: 'המחיר מוצג בלבד. אין רכישה באתר.' })),
      h('div', { class: 'field' }, h('span', { class: 'label', text: 'תמונה' }), img.el),
      h('div', { class: 'field' }, h('label', { class: 'btn-row' }, visible, h('span', { text: 'להציג את השירות באתר' }))),
    ),
    h('div', { class: 'save-bar' }, saveBtn, h('a', { class: 'btn btn-ghost', href: '#services', text: 'ביטול' })),
  );
  clear(content, h('div', { class: 'page-head' }, h('h1', { text: isNew ? 'שירות חדש' : 'עריכת שירות' })), form);
  title.focus();
}

// =====================================================================
// הודעות
// =====================================================================

async function messages() {
  const data = await api('GET', '/api/admin/messages');
  let items = data.items;
  setUnread(data.unread);
  const list = h('ul', { class: 'items', 'aria-label': 'הודעות' });

  const recount = () => setUnread(items.filter((m) => !m.is_read).length);

  function render() {
    if (!items.length) {
      clear(list, h('li', { class: 'empty-state', text: 'אין הודעות עדיין. הודעות מטופס "צור קשר" באתר יופיעו כאן.' }));
      return;
    }
    clear(
      list,
      items.map((m) => {
        const toggle = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: m.is_read ? 'סמן כלא נקראה' : 'סמן כנקראה' });
        toggle.addEventListener('click', async () => {
          try {
            const { item } = await api('PUT', `/api/admin/messages/${m.id}`, { is_read: !m.is_read });
            Object.assign(m, item);
            recount();
            render();
          } catch (e) {
            toast(e.message, 'error');
          }
        });
        const del = h('button', { class: 'btn btn-danger btn-sm', type: 'button' }, icon('trash'), 'מחיקה');
        del.addEventListener('click', async () => {
          if (!(await confirmDialog(`למחוק את ההודעה מ-${m.name}?`, { ok: 'כן, למחוק', danger: true }))) return;
          try {
            await api('DELETE', `/api/admin/messages/${m.id}`);
            items = items.filter((x) => x.id !== m.id);
            recount();
            render();
            toast('ההודעה נמחקה', 'ok');
          } catch (e) {
            toast(e.message, 'error');
          }
        });
        const phoneDigits = (m.phone || '').replace(/[^\d+]/g, '');
        let wa = phoneDigits.replace(/\D/g, '');
        if (wa.startsWith('0')) wa = '972' + wa.slice(1);
        return h(
          'li',
          { class: `msg${m.is_read ? '' : ' unread'}` },
          h('div', { class: 'msg-head' }, h('strong', { text: m.name }), m.is_read ? null : h('span', { class: 'tag tag-new', text: 'חדש' }), h('span', { class: 'small muted', text: formatDate(m.created_at) })),
          h(
            'div',
            { class: 'msg-contact' },
            m.phone ? h('a', { href: `tel:${phoneDigits}`, dir: 'ltr', text: m.phone }) : null,
            m.phone && wa.length >= 9 ? h('a', { href: `https://wa.me/${wa}`, target: '_blank', rel: 'noopener', text: 'וואטסאפ' }) : null,
            m.email ? h('a', { href: `mailto:${m.email}`, dir: 'ltr', text: m.email }) : null,
          ),
          h('p', { class: 'msg-body', text: m.body }),
          h('div', { class: 'btn-row' }, toggle, del),
        );
      }),
    );
  }

  clear(content, h('div', { class: 'page-head' }, h('h1', { text: 'הודעות' }), h('span', { class: 'muted', text: `${items.length} הודעות` })), list);
  render();
}

// =====================================================================
// חשבון
// =====================================================================

async function account() {
  const logoutBtn = h('button', {
    class: 'btn btn-ghost',
    type: 'button',
    text: 'התנתקות',
    onClick: async () => {
      await api('POST', '/api/logout').catch(() => {});
      showLogin('התנתקתם בהצלחה.');
    },
  });

  let pwCard;
  if (boot.demoUser) {
    pwCard = h('div', { class: 'card' }, h('h2', { text: 'החלפת סיסמה' }), h('p', { class: 'muted', text: 'באתר הדמו אי אפשר להחליף את הסיסמה או המייל של משתמש הדמו.' }));
  } else {
    const cur = h('input', { type: 'password', id: 'pw-cur', autocomplete: 'current-password', dir: 'ltr' });
    const next = h('input', { type: 'password', id: 'pw-new', autocomplete: 'new-password', dir: 'ltr', minlength: 10 });
    const again = h('input', { type: 'password', id: 'pw-again', autocomplete: 'new-password', dir: 'ltr' });
    const msg = h('div', { class: 'alert-box', role: 'alert', hidden: true });
    const btn = h('button', { class: 'btn', type: 'submit', text: 'החלפת סיסמה' });
    const show = (text, ok) => {
      msg.textContent = text;
      msg.className = `alert-box ${ok ? 'alert-ok' : 'alert-error'}`;
      msg.hidden = false;
    };
    pwCard = h(
      'form',
      {
        class: 'card',
        novalidate: true,
        onSubmit: async (e) => {
          e.preventDefault();
          if (!cur.value) return show('נא למלא את הסיסמה הנוכחית.');
          if (next.value.length < 10) return show('הסיסמה החדשה צריכה להכיל לפחות 10 תווים.');
          if (next.value !== again.value) return show('הסיסמאות החדשות לא זהות.');
          btn.disabled = true;
          try {
            await api('POST', '/api/admin/password', { current: cur.value, next: next.value });
            cur.value = next.value = again.value = '';
            show('הסיסמה הוחלפה. מכשירים אחרים נותקו.', true);
          } catch (ex) {
            show(ex.message);
          } finally {
            btn.disabled = false;
          }
        },
      },
      h('h2', { text: 'החלפת סיסמה' }),
      msg,
      h('div', { class: 'field' }, h('label', { for: 'pw-cur', text: 'סיסמה נוכחית' }), cur),
      h('div', { class: 'field' }, h('label', { for: 'pw-new', text: 'סיסמה חדשה (לפחות 10 תווים)' }), next),
      h('div', { class: 'field' }, h('label', { for: 'pw-again', text: 'סיסמה חדשה שוב' }), again),
      btn,
    );
  }

  clear(
    content,
    h('div', { class: 'page-head' }, h('h1', { text: 'החשבון שלי' })),
    h('div', { class: 'card' }, h('p', {}, 'מחוברים בתור: ', h('strong', { dir: 'ltr', text: boot.user.email })), logoutBtn),
    pwCard,
  );
}
