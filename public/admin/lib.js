// כלי עזר ללוח הניהול: בניית DOM בטוחה, קריאות API, הודעות, אישורים, טיוטות ודחיסת תמונות.
// אין שימוש ב-innerHTML: כל טקסט נכנס דרך textContent.

/** יוצר אלמנט. props: class, text, on<Event>, dataset, וכל מאפיין אחר. */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'multiple' || k === 'required') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** אייקון SVG פשוט (נתיבים קבועים מהקוד, לא מהמשתמש). */
const ICON_PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  text: 'M4 6h16M4 12h16M4 18h10',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  mail: 'M2 5h20v14H2zM22 6l-10 7L2 6',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.2A10 10 0 0 1 12 4c7 0 11 8 11 8a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 1 12s4 8 11 8a10 10 0 0 0 5.4-1.6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  plus: 'M12 5v14M5 12h14',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
};
export function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', name === 'grip' ? '3' : '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', ICON_PATHS[name] || '');
  svg.append(p);
  return svg;
}

// ---------------- API ----------------

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function api(method, path, body, { raw = false, contentType } = {}) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    if (raw) {
      opts.body = body;
      opts.headers['content-type'] = contentType;
    } else {
      opts.body = JSON.stringify(body);
      opts.headers['content-type'] = 'application/json';
    }
  }
  let res;
  try {
    res = await fetch(path, opts);
  } catch {
    throw new ApiError('אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.', 0, { network: true });
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path.startsWith('/api/admin/')) {
    onUnauthorized();
    throw new ApiError(data.error || 'נדרשת התחברות מחדש.', 401, data);
  }
  if (!res.ok || data.ok === false) throw new ApiError(data.error || 'משהו השתבש. נסו שוב.', res.status, data);
  return data;
}

// ---------------- הודעות ----------------

export function toast(message, type = '') {
  const box = document.getElementById('toasts');
  const t = h('div', { class: `toast ${type}`, text: message });
  box.append(t);
  setTimeout(() => t.remove(), type === 'error' ? 6000 : 3000);
}

/** חלון אישור. מחזיר Promise<boolean>. */
export function confirmDialog(message, { ok = 'אישור', cancel = 'ביטול', danger = false, title = 'רגע לפני' } = {}) {
  return new Promise((resolve) => {
    const okBtn = h('button', { class: `btn ${danger ? 'btn-danger-solid' : ''}`, type: 'button', text: ok });
    const cancelBtn = h('button', { class: 'btn btn-ghost', type: 'button', text: cancel });
    const dlg = h('dialog', { 'aria-labelledby': 'dlg-title' }, h('div', { class: 'dlg-body' }, h('h2', { id: 'dlg-title', text: title }), h('p', { text: message })), h('div', { class: 'dlg-foot' }, okBtn, cancelBtn));
    let result = false;
    okBtn.addEventListener('click', () => {
      result = true;
      dlg.close();
    });
    cancelBtn.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => {
      dlg.remove();
      resolve(result);
    });
    document.body.append(dlg);
    dlg.showModal();
    cancelBtn.focus();
  });
}

/** חלון עם תוכן חופשי. מחזיר את ה-dialog (נסגר עם dlg.close()). */
export function openDialog(title, body, footer = []) {
  const dlg = h('dialog', { 'aria-label': title }, h('div', { class: 'dlg-body' }, h('h2', { text: title }), body), footer.length ? h('div', { class: 'dlg-foot' }, footer) : null);
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

// ---------------- טיוטות ----------------
// שמירה אוטומטית של טיוטה במכשיר, כדי שלא יאבד כלום אם החיבור נפל.

const DRAFT_PREFIX = 'folio1-draft:';
export const drafts = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_PREFIX + key) || 'null');
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(value));
    } catch {
      /* אחסון לא זמין */
    }
  },
  clear(key) {
    try {
      localStorage.removeItem(DRAFT_PREFIX + key);
    } catch {
      /* אחסון לא זמין */
    }
  },
};

export function pref(key, value) {
  try {
    if (value === undefined) return localStorage.getItem('folio1:' + key);
    localStorage.setItem('folio1:' + key, value);
  } catch {
    return null;
  }
}

// ---------------- תמונות ----------------

export function mediaUrl(key) {
  if (!key) return '';
  if (key.startsWith('https://')) return key;
  return key.startsWith('demo/') ? '/' + key : '/media/' + key;
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* נופלים לשיטה הישנה */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * דחיסה והקטנה בדפדפן: WebP, צלע ארוכה עד 1600px, איכות 0.82.
 * אם הדפדפן לא יודע לייצר WebP, נופלים ל-JPEG. אם עדיין גדול מדי, מקטינים עוד.
 */
export async function compressImage(file, { maxSide = 1600, quality = 0.82, maxBytes = 2 * 1024 * 1024 } = {}) {
  if (file.type && !file.type.startsWith('image/')) throw new Error(`"${file.name}" אינו קובץ תמונה.`);
  let bmp;
  try {
    bmp = await loadBitmap(file);
  } catch {
    throw new Error(`לא הצלחנו לקרוא את "${file.name}". נסו תמונה בפורמט JPEG או PNG.`);
  }
  const w0 = bmp.width;
  const h0 = bmp.height;
  let side = maxSide;
  let q = quality;
  for (let attempt = 0; attempt < 5; attempt++) {
    const scale = Math.min(1, side / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const hgt = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = hgt;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, hgt);
    let blob = await canvasToBlob(canvas, 'image/webp', q);
    if (!blob || blob.type !== 'image/webp') {
      // JPEG לא תומך בשקיפות: רקע לבן
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = hgt;
      const x2 = c2.getContext('2d');
      x2.fillStyle = '#fff';
      x2.fillRect(0, 0, w, hgt);
      x2.drawImage(canvas, 0, 0);
      blob = await canvasToBlob(c2, 'image/jpeg', q);
    }
    if (blob && blob.size <= maxBytes) {
      if (bmp.close) bmp.close();
      return { blob, width: w, height: hgt, originalSize: file.size };
    }
    side = Math.round(side * 0.8);
    q = Math.max(0.6, q - 0.08);
  }
  throw new Error(`לא הצלחנו להקטין את "${file.name}" מספיק. נסו תמונה אחרת.`);
}

/** דוחס ומעלה תמונה. מחזיר את מפתח ה-R2. */
export async function uploadImage(file, maxBytes) {
  const { blob } = await compressImage(file, { maxBytes });
  const res = await api('POST', '/api/admin/upload', blob, { raw: true, contentType: blob.type });
  return res.key;
}

export function formatBytes(n) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`;
}

export function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts * 1000));
  } catch {
    return new Date(ts * 1000).toLocaleString();
  }
}
