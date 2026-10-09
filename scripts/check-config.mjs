// בדיקת תקינות של site.config.json (רצה ב-CI לפני פריסה).
import config from '../site.config.json' with { type: 'json' };

const TYPES = new Set(['line', 'paragraph', 'image', 'color', 'url', 'tel', 'email']);
const pages = new Set(config.pages.map((p) => p.id));
const seen = new Set();
const errors = [];
for (const f of [...config.fields, ...config.settingsFields]) {
  if (!f.key || !/^[a-z0-9_.]+$/.test(f.key)) errors.push(`מפתח לא תקין: ${f.key}`);
  if (f.key?.startsWith('_')) errors.push(`מפתח לא יכול להתחיל ב-_: ${f.key}`);
  if (seen.has(f.key)) errors.push(`מפתח כפול: ${f.key}`);
  seen.add(f.key);
  if (!TYPES.has(f.type)) errors.push(`סוג לא מוכר "${f.type}" בשדה ${f.key}`);
  if (!f.label) errors.push(`חסרה תווית לשדה ${f.key}`);
}
for (const f of config.fields) if (!pages.has(f.page)) errors.push(`השדה ${f.key} מפנה לדף לא קיים: ${f.page}`);
if (!/^#[0-9a-f]{6}$/i.test(config.defaultPrimaryColor)) errors.push('defaultPrimaryColor לא תקין');

if (errors.length) {
  for (const e of errors) console.error(`::error::site.config.json: ${e}`);
  process.exit(1);
}
console.log(`site.config.json תקין (${seen.size} שדות, ${pages.size} דפים).`);
