// התראת מייל על הודעה חדשה דרך Resend (אופציונלי).
// פעיל רק אם הוגדרו RESEND_API_KEY ו-NOTIFY_EMAIL, ולא באתר דמו. כישלון לא מכשיל את הטופס.
import { isDemo } from './config.js';

export function mailEnabled(env) {
  return !!(env.RESEND_API_KEY && env.NOTIFY_EMAIL) && !isDemo(env);
}

export async function notifyNewMessage(env, msg, siteName, origin) {
  if (!mailEnabled(env)) return;
  const text = [
    `הודעה חדשה מהאתר ${siteName}`,
    '',
    `שם: ${msg.name}`,
    msg.phone ? `טלפון: ${msg.phone}` : '',
    msg.email ? `מייל: ${msg.email}` : '',
    '',
    msg.body,
    '',
    `לתיבת ההודעות: ${origin}/admin/#messages`,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.MAIL_FROM || 'Folio1 <onboarding@resend.dev>',
        to: env.NOTIFY_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
        subject: `הודעה חדשה מהאתר: ${msg.name}`.slice(0, 150),
        text,
        ...(msg.email ? { reply_to: msg.email } : {}),
      }),
    });
    if (!res.ok) console.error('resend failed', res.status, await res.text());
  } catch (err) {
    console.error('resend error', err);
  }
}
