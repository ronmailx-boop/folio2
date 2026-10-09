// מדפיס SQL של נתוני הדמו (כולל משתמש הדמו אם הוגדר DEMO_PASSWORD).
// שימוש: DEMO_PASSWORD=... node scripts/seed-sql.mjs > seed.sql
import { readFileSync } from 'node:fs';
import { seedStatements } from '../src/seed.js';
import { hashPassword } from '../src/crypto.js';
import { toSql } from './sql.mjs';

const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
const email = process.env.DEMO_EMAIL || toml.match(/DEMO_EMAIL\s*=\s*"([^"]+)"/)?.[1] || 'demo@folio1.app';
const password = process.env.DEMO_PASSWORD || '';

let demoUser;
if (password) {
  const { hash, salt } = await hashPassword(password);
  demoUser = { email, hash, salt };
}
process.stdout.write(toSql(seedStatements({ demoUser })));
