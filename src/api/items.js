// שירותים וגלריה: הוספה, עריכה, מחיקה, סדר והסתרה.
import { limits } from '../config.js';
import { listServices, listGallery, bumpCacheVersion } from '../db.js';
import { readJson } from '../auth.js';
import { deleteMedia, MEDIA_KEY_RE } from '../media.js';
import { json, jsonError, isValidImageKey } from '../util.js';

const validImage = (k) => k === '' || k === null || isValidImageKey(k, MEDIA_KEY_RE);

function str(v, max, label, { required = false, multiline = false } = {}) {
  let s = String(v ?? '').replace(/\r\n/g, '\n');
  if (!multiline) s = s.replace(/\n+/g, ' ');
  s = s.trim();
  if (required && !s) throw new FieldError(`נא למלא ${label}.`);
  if (s.length > max) throw new FieldError(`${label} ארוך מדי (עד ${max} תווים).`);
  return s;
}

class FieldError extends Error {}

function parseId(seg) {
  const id = Number(seg);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** תבנית משותפת לשתי הטבלאות. */
function crud({ table, list, max, maxLabel, fromBody }) {
  return async (request, env, seg) => {
    const method = request.method;
    try {
      if (seg.length === 0 && method === 'GET') return json({ ok: true, items: await list(env) });

      if (seg.length === 0 && method === 'POST') {
        const limit = limits(env)[max];
        const { n } = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
        if (n >= limit) return jsonError(`הגעתם למספר המרבי של ${maxLabel} (${limit}).`, 409);
        const data = fromBody(await readJson(request), true);
        const cols = Object.keys(data);
        const row = await env.DB.prepare(
          `INSERT INTO ${table} (${cols.join(', ')}, sort_order)
           VALUES (${cols.map(() => '?').join(', ')}, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM ${table}))
           RETURNING *`,
        )
          .bind(...Object.values(data))
          .first();
        await bumpCacheVersion(env);
        return json({ ok: true, item: row }, 201);
      }

      if (seg.length === 1 && seg[0] === 'reorder' && method === 'POST') {
        const { ids } = await readJson(request);
        if (!Array.isArray(ids) || ids.length > 1000 || !ids.every((x) => Number.isInteger(x))) return jsonError('בקשה לא תקינה.');
        await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(i, id)));
        await bumpCacheVersion(env);
        return json({ ok: true });
      }

      const id = parseId(seg[0]);
      if (seg.length !== 1 || !id) return null;
      const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
      if (!existing) return jsonError('הפריט לא נמצא (אולי כבר נמחק).', 404);

      if (method === 'PUT') {
        const data = fromBody(await readJson(request), false);
        const cols = Object.keys(data);
        if (!cols.length) return json({ ok: true, item: existing });
        const row = await env.DB.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ? RETURNING *`)
          .bind(...Object.values(data), id)
          .first();
        if ('image_key' in data && existing.image_key && existing.image_key !== data.image_key) await deleteMedia(env, existing.image_key);
        await bumpCacheVersion(env);
        return json({ ok: true, item: row });
      }

      if (method === 'DELETE') {
        await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
        await deleteMedia(env, existing.image_key);
        await bumpCacheVersion(env);
        return json({ ok: true });
      }
      return null;
    } catch (err) {
      if (err instanceof FieldError) return jsonError(err.message);
      throw err;
    }
  };
}

export const servicesApi = crud({
  table: 'services',
  list: (env) => listServices(env),
  max: 'maxServices',
  maxLabel: 'שירותים',
  fromBody(b, isNew) {
    const d = {};
    if (isNew || 'title' in b) d.title = str(b.title, 120, 'כותרת', { required: true });
    if (isNew || 'description' in b) d.description = str(b.description, 2000, 'תיאור', { multiline: true });
    if (isNew || 'price_text' in b) d.price_text = str(b.price_text, 60, 'מחיר');
    if (isNew || 'image_key' in b) {
      const k = b.image_key ? String(b.image_key) : null;
      if (!validImage(k)) throw new FieldError('תמונה לא תקינה.');
      d.image_key = k;
    }
    if ('is_visible' in b) d.is_visible = b.is_visible ? 1 : 0;
    return d;
  },
});

export const galleryApi = crud({
  table: 'gallery',
  list: (env) => listGallery(env),
  max: 'maxGallery',
  maxLabel: 'תמונות בגלריה',
  fromBody(b, isNew) {
    const d = {};
    if (isNew) {
      const k = String(b.image_key ?? '');
      if (!k || !validImage(k)) throw new FieldError('חסרה תמונה.');
      d.image_key = k;
    }
    if (isNew || 'alt_text' in b) d.alt_text = str(b.alt_text, 200, 'תיאור התמונה');
    if (isNew || 'caption' in b) d.caption = str(b.caption, 200, 'כיתוב');
    if ('is_visible' in b) d.is_visible = b.is_visible ? 1 : 0;
    return d;
  },
});
