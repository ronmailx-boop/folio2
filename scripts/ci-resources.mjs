// מוצא (או יוצר) את מסד ה-D1 ואת ה-bucket ב-R2, ומזריק את המזהים ל-wrangler.toml בזמן ריצה ב-CI.
// שימוש:
//   node scripts/ci-resources.mjs --create   (setup.yml: יוצר משאבים חסרים)
//   node scripts/ci-resources.mjs            (deploy.yml: אם אין משאבים, מדפיס הודעה ומסמן found=false)
// משתנה סביבה אופציונלי: CUSTOM_DOMAIN (למשל folio1.vplusstudio.app) גובר על שורת ה-routes ב-wrangler.toml.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const create = process.argv.includes('--create');
const tomlPath = new URL('../wrangler.toml', import.meta.url);
let toml = readFileSync(tomlPath, 'utf8');

const dbName = toml.match(/database_name\s*=\s*"([^"]+)"/)?.[1];
const bucket = toml.match(/bucket_name\s*=\s*"([^"]+)"/)?.[1];
if (!dbName || !bucket) fail('לא נמצאו database_name או bucket_name ב-wrangler.toml');

function wrangler(args, { allowFail = false } = {}) {
  try {
    return execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (allowFail) return null;
    console.error(err.stdout || '', err.stderr || '');
    fail(`הפקודה wrangler ${args.join(' ')} נכשלה`);
  }
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

function findDb() {
  const out = wrangler(['d1', 'list', '--json']);
  const list = JSON.parse(out.slice(out.indexOf('[')));
  return list.find((d) => d.name === dbName)?.uuid;
}

// ---- D1 ----
let dbId = findDb();
if (!dbId && create) {
  console.log(`יוצר מסד D1: ${dbName}`);
  wrangler(['d1', 'create', dbName]);
  dbId = findDb();
}
if (!dbId) {
  console.log(`::warning::מסד ה-D1 "${dbName}" לא קיים עדיין. הריצו קודם את ה-workflow "Setup" (setup.yml).`);
  output('found', 'false');
  process.exit(0);
}
console.log(`D1: ${dbName} (${dbId})`);

// ---- R2 ----
const hasBucket = wrangler(['r2', 'bucket', 'info', bucket], { allowFail: true }) !== null;
if (!hasBucket) {
  if (!create) {
    console.log(`::warning::ה-bucket "${bucket}" לא קיים. הריצו את setup.yml.`);
    output('found', 'false');
    process.exit(0);
  }
  console.log(`יוצר R2 bucket: ${bucket}`);
  wrangler(['r2', 'bucket', 'create', bucket]);
}
console.log(`R2: ${bucket}`);

// ---- הזרקה ל-wrangler.toml (רק בסביבת ה-CI, לא נשמר בריפו) ----
toml = toml.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${dbId}"`);
const domain = (process.env.CUSTOM_DOMAIN || '').trim();
if (domain) {
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) fail(`CUSTOM_DOMAIN לא תקין: ${domain}`);
  const route = `routes = [ { pattern = "${domain}", custom_domain = true } ]`;
  toml = /^routes\s*=.*$/m.test(toml) ? toml.replace(/^routes\s*=.*$/m, route) : toml.replace(/^(workers_dev\s*=.*)$/m, `$1\n${route}`);
  console.log(`Custom Domain: ${domain}`);
}
writeFileSync(tomlPath, toml);
output('found', 'true');
output('database_id', dbId);
