// מדפיס SQL ליצירת משתמש מנהל (או לאיפוס הסיסמה שלו).
// קורא ADMIN_EMAIL ו-ADMIN_PASSWORD ממשתני סביבה (GitHub Secrets). לא מדפיס את הסיסמה.
// שימוש: node scripts/admin-user-sql.mjs [--reset] > admin.sql
import { hashPassword } from '../src/crypto.js';
import { toSql } from './sql.mjs';

const reset = process.argv.includes('--reset');
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('ADMIN_EMAIL חסר או לא תקין.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('ADMIN_PASSWORD חסר או קצר מ-10 תווים.');
  process.exit(1);
}

const { hash, salt } = await hashPassword(password);
const stmts = [
  {
    sql: reset
      ? 'INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, password_salt = excluded.password_salt'
      : 'INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING',
    params: [email, hash, salt],
  },
];
if (reset) {
  // ניתוק כל הסשנים הפתוחים של המשתמש, וניקוי חסימות התחברות
  stmts.push({ sql: 'DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)', params: [email] });
  stmts.push({ sql: "DELETE FROM rate_limits WHERE key LIKE 'login:%'", params: [] });
}
process.stdout.write(toSql(stmts));
