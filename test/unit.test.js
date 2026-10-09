// בדיקות יחידה בסיסיות (node --test). רצות ב-deploy.yml לפני כל פריסה.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, paragraphs, safeUrl, waNumber, mediaUrl, isHexColor } from '../src/util.js';
import { hashPassword, verifyPassword, PBKDF2_ITERATIONS } from '../src/crypto.js';
import { seedStatements, DEMO_SERVICES, DEMO_GALLERY } from '../src/seed.js';
import { cleanField } from '../src/api/settings.js';
import { validateContact } from '../src/contact.js';
import { sniffImage, MEDIA_KEY_RE } from '../src/media.js';
import { toSql } from '../scripts/sql.mjs';

test('esc מנקה תווי HTML', () => {
  assert.equal(esc('<script>"x"&\'y\''), '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;');
  assert.equal(esc(null), '');
});

test('paragraphs מפצל לפסקאות ומנקה', () => {
  assert.equal(paragraphs('א\nב\n\n<ג>'), '<p>א<br>ב</p>\n<p>&lt;ג&gt;</p>');
  assert.equal(paragraphs('  '), '');
});

test('safeUrl חוסם javascript:', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('//evil.com'), '');
  assert.equal(safeUrl('/contact'), '/contact');
  assert.equal(safeUrl('https://x.co'), 'https://x.co');
});

test('waNumber ממיר מספר ישראלי', () => {
  assert.equal(waNumber('050-000-0000'), '972500000000');
  assert.equal(waNumber('+972 50 123 4567'), '972501234567');
  assert.equal(waNumber(''), '');
});

test('mediaUrl ו-isHexColor', () => {
  assert.equal(mediaUrl('demo/a.svg'), '/demo/a.svg');
  assert.equal(mediaUrl('u/abc.webp'), '/media/u/abc.webp');
  assert.ok(isHexColor('#7367f0'));
  assert.ok(!isHexColor('red'));
});

test('PBKDF2: גיבוב ואימות סיסמה', async () => {
  assert.ok(PBKDF2_ITERATIONS <= 100000, 'Workers מגביל ל-100,000 איטרציות');
  const { hash, salt } = await hashPassword('סיסמה-ארוכה-123');
  assert.equal(hash.length, 64);
  assert.ok(await verifyPassword('סיסמה-ארוכה-123', hash, salt));
  assert.ok(!(await verifyPassword('wrong', hash, salt)));
});

test('seed: 6 שירותים, 9 תמונות, SQL תקין', () => {
  assert.equal(DEMO_SERVICES.length, 6);
  assert.equal(DEMO_GALLERY.length, 9);
  const sql = toSql(seedStatements({ demoUser: { email: 'demo@x.co', hash: 'h', salt: 's' } }));
  assert.match(sql, /INSERT INTO services/);
  assert.match(sql, /'demo@x\.co'/);
  assert.ok(!/\?/.test(sql.replace(/'[^']*'/g, '')), 'לא נשארו placeholders');
});

test('toSql מנקה גרשים', () => {
  assert.equal(toSql([{ sql: 'SELECT ?', params: ["it's"] }]), "SELECT 'it''s';\n");
});

test('cleanField לפי סוג', () => {
  assert.deepEqual(cleanField({ type: 'color', label: 'צבע' }, '#AABBCC'), ['#aabbcc', null]);
  assert.equal(cleanField({ type: 'color', label: 'צבע' }, 'red')[0], null);
  assert.equal(cleanField({ type: 'url', label: 'קישור' }, 'javascript:x')[0], null);
  assert.deepEqual(cleanField({ type: 'line', label: 'שורה' }, ' א\nב '), ['א ב', null]);
  assert.deepEqual(cleanField({ type: 'paragraph', label: 'פסקה' }, 'א\nב'), ['א\nב', null]);
  assert.equal(cleanField({ type: 'image', label: 'תמונה' }, '../etc/passwd')[0], null);
});

test('validateContact', () => {
  assert.deepEqual(Object.keys(validateContact({}).errors).sort(), ['body', 'name', 'phone']);
  assert.deepEqual(validateContact({ name: 'דנה', phone: '050-1234567', body: 'היי' }).errors, {});
  assert.ok(validateContact({ name: 'דנה', email: 'bad', body: 'x' }).errors.email);
});

test('sniffImage ו-MEDIA_KEY_RE', () => {
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer), 'jpg');
  assert.equal(sniffImage(new TextEncoder().encode('RIFF1234WEBPVP8 ').buffer), 'webp');
  assert.equal(sniffImage(new TextEncoder().encode('<svg></svg>').buffer), null);
  assert.ok(MEDIA_KEY_RE.test('u/0123456789abcdef0123456789abcdef.webp'));
  assert.ok(!MEDIA_KEY_RE.test('u/../secret'));
});

test('isValidImageKey: העלאות, דמו וקישורים ממאגרים מותרים בלבד', async () => {
  const { isValidImageKey } = await import('../src/util.js');
  const ok = (k) => isValidImageKey(k, MEDIA_KEY_RE);
  assert.ok(ok('u/0123456789abcdef0123456789abcdef.webp'));
  assert.ok(ok('demo/about.svg'));
  assert.ok(ok('https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&w=1600'));
  assert.ok(ok('https://images.unsplash.com/photo-123-abc?w=1600&q=80'));
  assert.ok(!ok('https://evil.com/x.jpg'));
  assert.ok(!ok('https://images.pexels.com.evil.com/x.jpg'));
  assert.ok(!ok('http://images.pexels.com/x.jpg'));
  assert.ok(!ok('https://images.pexels.com/x"onerror="alert(1)'));
});
