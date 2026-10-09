// תיבת ההודעות בלוח הניהול.
import { readJson } from '../auth.js';
import { json, jsonError } from '../util.js';

export async function messagesApi(request, env, seg) {
  const method = request.method;
  if (seg.length === 0 && method === 'GET') {
    const [{ results }, unread] = await Promise.all([
      env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC, id DESC LIMIT 500').all(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0').first(),
    ]);
    return json({ ok: true, items: results, unread: unread.n });
  }
  const id = Number(seg[0]);
  if (seg.length !== 1 || !Number.isInteger(id) || id <= 0) return null;
  if (method === 'PUT') {
    const b = await readJson(request);
    const row = await env.DB.prepare('UPDATE messages SET is_read = ? WHERE id = ? RETURNING *').bind(b.is_read ? 1 : 0, id).first();
    if (!row) return jsonError('ההודעה לא נמצאה.', 404);
    return json({ ok: true, item: row });
  }
  if (method === 'DELETE') {
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }
  return null;
}
