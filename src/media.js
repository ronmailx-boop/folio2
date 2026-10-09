// העלאה והגשה של תמונות מ-R2.
import { randomHex } from './crypto.js';

export const MEDIA_KEY_RE = /^u\/[a-f0-9]{32}\.(webp|jpg|png)$/;

const TYPES = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
};

/** מזהה סוג קובץ לפי ה-"magic bytes" ולא לפי מה שהדפדפן טוען. */
export function sniffImage(bytes) {
  const b = new Uint8Array(bytes.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  const ascii = (s, e) => String.fromCharCode(...b.slice(s, e));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  return null;
}

export async function serveMedia(env, key, request) {
  if (!MEDIA_KEY_RE.test(key)) return null;
  const obj = await env.MEDIA.get(key);
  if (!obj) return null;
  const ext = key.split('.').pop();
  const headers = new Headers();
  headers.set('content-type', TYPES[ext]);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', obj.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-security-policy', "default-src 'none'");
  if (request.headers.get('if-none-match') === obj.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}

/** שומר קובץ ב-R2 תחת מפתח אקראי. מחזיר את המפתח, או זורק שגיאה בעברית. */
export async function storeUpload(env, bytes, maxBytes) {
  if (!bytes || bytes.byteLength === 0) throw new UploadError('הקובץ ריק.');
  if (bytes.byteLength > maxBytes) {
    throw new UploadError(`התמונה גדולה מדי (${(bytes.byteLength / 1048576).toFixed(1)}MB). הגודל המרבי הוא ${(maxBytes / 1048576).toFixed(1)}MB.`);
  }
  const ext = sniffImage(bytes);
  if (!ext) throw new UploadError('סוג הקובץ לא נתמך. אפשר להעלות JPEG, PNG או WebP.');
  const key = `u/${randomHex(16)}.${ext}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: TYPES[ext] } });
  return key;
}

/** מוחק אובייקט מ-R2 אם זה מפתח של העלאה (תמונות דמו הן קבצים סטטיים). */
export async function deleteMedia(env, key) {
  if (key && MEDIA_KEY_RE.test(key)) await env.MEDIA.delete(key);
}

/** מוחק את כל ההעלאות (איפוס דמו). */
export async function deleteAllUploads(env) {
  let cursor;
  do {
    const list = await env.MEDIA.list({ prefix: 'u/', cursor, limit: 1000 });
    const keys = list.objects.map((o) => o.key);
    if (keys.length) await env.MEDIA.delete(keys);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}

export class UploadError extends Error {}
