// העלאת תמונה (גוף הבקשה הוא הקובץ עצמו, אחרי דחיסה בדפדפן).
import { limits } from '../config.js';
import { storeUpload, UploadError } from '../media.js';
import { json, jsonError } from '../util.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function upload(request, env) {
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED.includes(type)) return jsonError('סוג הקובץ לא נתמך. אפשר להעלות JPEG, PNG או WebP.', 415);
  const max = limits(env).maxUploadBytes;
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > max) return jsonError(`התמונה גדולה מדי. הגודל המרבי הוא ${(max / 1048576).toFixed(1)}MB.`, 413);
  try {
    const key = await storeUpload(env, await request.arrayBuffer(), max);
    return json({ ok: true, key, url: '/media/' + key }, 201);
  } catch (err) {
    if (err instanceof UploadError) return jsonError(err.message, 400);
    throw err;
  }
}
