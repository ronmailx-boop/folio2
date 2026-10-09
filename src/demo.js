// מצב דמו: איפוס לילי של הנתונים וההעלאות.
import { isDemo } from './config.js';
import { seedStatements } from './seed.js';
import { hashPassword } from './crypto.js';
import { deleteAllUploads } from './media.js';
import { normEmail } from './auth.js';

export async function resetDemo(env) {
  await deleteAllUploads(env);
  let demoUser;
  if (env.DEMO_PASSWORD) {
    const { hash, salt } = await hashPassword(env.DEMO_PASSWORD);
    demoUser = { email: normEmail(env.DEMO_EMAIL || 'demo@folio1.app'), hash, salt };
  }
  const stmts = seedStatements({ demoUser }).map(({ sql, params }) => env.DB.prepare(sql).bind(...params));
  await env.DB.batch(stmts);
}

export async function scheduled(event, env) {
  if (!isDemo(env)) return;
  await resetDemo(env);
  console.log('demo reset done');
}
