# Folio2 – אתר דמו: נוגה, קליניקה לקוסמטיקה

אתר הדמו השני של תבנית **Folio** (התבנית המקורית: [folio1](https://github.com/ronmailx-boop/folio1)). כתובת: https://folio2.vplusstudio.app · לוח ניהול: https://folio2.vplusstudio.app/admin/


**Folio1** היא ערכת אתר תדמית בעברית (RTL, מותאמת לנייד) עם **לוח ניהול** שבעל העסק מפעיל לבד, בלי קוד.
הכול רץ על Cloudflare: Worker אחד, מסד נתונים D1, תמונות ב-R2. ההקמה והפריסה רצות ב-GitHub Actions, כך שאפשר לעשות הכול **מהטלפון**.

- אתר: דף הבית, אודות, שירותים, גלריה, צור קשר, הצהרת נגישות, ו-404 מעוצב.
- לוח ניהול ב-`/admin/`: טקסטים, גלריה, שירותים, הודעות מהטופס, הגדרות העסק (כולל צבע ראשי ולוגו), והחלפת סיסמה.
- SEO: כותרת ותיאור לכל דף, Open Graph, `sitemap.xml` ו-`robots.txt` שנוצרים אוטומטית.

---

## הקמה מהנייד, צעד אחר צעד

אפשר לעשות את כל השלבים מדפדפן בטלפון (Chrome). מומלץ לבקש "גרסת מחשב" כשהאתר של GitHub או Cloudflare מציג תפריטים חסרים.

### שלב 1: יצירת API Token ב-Cloudflare

1. היכנסו ל-<https://dash.cloudflare.com/profile/api-tokens>.
2. **Create Token** ← בחרו בתבנית **Edit Cloudflare Workers** ← **Use template**.
3. תחת **Permissions** לחצו **+ Add more** והוסיפו: `Account` ← `D1` ← `Edit`.
   (התבנית כבר כוללת Workers Scripts, Workers R2 Storage, Workers Routes ו-Account Settings.)
4. תחת **Account Resources** בחרו את החשבון שלכם.
5. תחת **Zone Resources**: אם יש לכם דומיין ב-Cloudflare (למשל `vplusstudio.app`), בחרו אותו. אם לא, בחרו All zones.
6. **Continue to summary** ← **Create Token**. העתיקו את הטוקן (הוא מוצג פעם אחת בלבד).

**ההרשאות המינימליות** (אם בונים טוקן מאפס במקום תבנית):

| סוג | הרשאה | רמה | למה |
|---|---|---|---|
| Account | Workers Scripts | Edit | פריסת ה-Worker וסודות |
| Account | D1 | Edit | יצירת מסד נתונים ומיגרציות |
| Account | Workers R2 Storage | Edit | יצירת ה-bucket לתמונות |
| Account | Account Settings | Read | wrangler קורא פרטי חשבון |
| Zone | Workers Routes | Edit | חיבור Custom Domain (רק אם יש דומיין) |
| Zone | DNS | Edit | יצירת רשומת ה-DNS של הדומיין (רק אם יש דומיין) |
| Zone | Zone | Read | איתור הדומיין (רק אם יש דומיין) |

את **Account ID** מוצאים בדשבורד של Cloudflare: בעמוד הראשי של החשבון, בתפריט של שלוש הנקודות ליד שם החשבון ← **Copy account ID**, או בצד ימין של עמוד Workers & Pages.

### שלב 2: הוספת Secrets ב-GitHub

בריפו: **Settings** ← **Secrets and variables** ← **Actions** ← **New repository secret**. הוסיפו:

| שם | חובה | מה זה |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ | הטוקן משלב 1 |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | מזהה החשבון ב-Cloudflare |
| `ADMIN_EMAIL` | ✅ | המייל שלכם לכניסה ללוח |
| `ADMIN_PASSWORD` | ✅ | סיסמה של לפחות 10 תווים |
| `DEMO_PASSWORD` | רק בדמו | סיסמת משתמש הדמו (פומבית, מוצגת בדף הכניסה). אם לא מוגדרת, נוצרת אחת אוטומטית |
| `RESEND_API_KEY` | לא | התראות מייל על הודעות חדשות ([resend.com](https://resend.com)) |
| `NOTIFY_EMAIL` | לא | לאן לשלוח התראות (אפשר כמה, מופרדים בפסיק) |
| `MAIL_FROM` | לא | השולח, למשל `Folio1 <noreply@vplusstudio.app>` (דומיין שאומת ב-Resend) |
| `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET` | לא | הגנת ספאם של Cloudflare Turnstile בטופס |

בלשונית **Variables** (באותו מסך) אפשר להוסיף:

| שם | מה זה |
|---|---|
| `CUSTOM_DOMAIN` | לא חובה: גובר על הדומיין שמוגדר ב-`routes` ב-`wrangler.toml` |

### שלב 3: הרצת ההקמה

1. בריפו: לשונית **Actions** ← בצד: **Setup** ← **Run workflow** ← **Run workflow**.
2. אחרי 2–3 דקות, פתחו את הריצה. בתחתית יש **סיכום** עם כתובת האתר ולוח הניהול.

מעכשיו, **כל שינוי שנכנס ל-`main` נפרס אוטומטית** (workflow בשם **Deploy**). מותר להריץ שוב את Setup בכל רגע; הוא לא מוחק תוכן (חוץ מבאתר דמו, שבו הוא טוען מחדש את נתוני הדמו).

### דומיין

- הדומיין מוגדר בשורת `routes` ב-`wrangler.toml` (כרגע `folio2.vplusstudio.app`). כל פריסה מחברת אותו, ו-Cloudflare יוצר לבד את רשומת ה-DNS ואת תעודת ה-SSL (עד כמה דקות). הדומיין הראשי חייב להיות באותו חשבון Cloudflare.
- **אם הדומיין עדיין לא ב-Cloudflare:** מחקו את שורת `routes` כדי שהפריסה לא תיכשל. האתר יעבוד בכתובת `https://<name>.<השם-שלכם>.workers.dev`. כשהדומיין יעבור ל-Cloudflare (Add a site ← החלפת Nameservers אצל רשם הדומיין), החזירו את השורה.
- אם זו הפעם הראשונה שלכם עם Workers, ייתכן ש-Cloudflare יבקש לבחור תת-דומיין ל-`workers.dev`: בדשבורד ← Workers & Pages ← בחרו שם, והריצו שוב את Setup.

---

## כניסה ללוח הניהול

- כתובת: `https://<האתר>/admin/`
- מייל וסיסמה: `ADMIN_EMAIL` ו-`ADMIN_PASSWORD` מה-Secrets.
- באתר דמו (`DEMO_MODE = "true"`) דף הכניסה מציג גם את פרטי משתמש הדמו `demo@folio2.app`.

## איפוס סיסמה (אם שכחתם)

אין איפוס במייל. במקום זה:

1. ב-GitHub: **Settings** ← **Secrets and variables** ← **Actions** ← עדכנו את `ADMIN_PASSWORD` לסיסמה חדשה.
2. **Actions** ← **Reset admin password** ← **Run workflow**. אפשר להזין מייל אחר, למשל של הלקוח; אם משאירים ריק, נעשה שימוש ב-`ADMIN_EMAIL`.
3. הסיסמה מתעדכנת, כל המכשירים המחוברים מנותקים, וחסימות התחברות מתנקות.

---

## מצב דמו

`DEMO_MODE = "true"` ב-`wrangler.toml` (רק באתר הדמו של Folio1):

- נתוני דמו: "נוגה – קליניקה לקוסמטיקה", 6 טיפולים, 9 תמונות גלריה (צילומים מ-Pexels), טקסטים מלאים.
- דף הכניסה ללוח מציג את פרטי הדמו, וכשנכנסים מוצג חלון "איך מתחילים?".
- הגבלות: עד 20 תמונות, 15 שירותים, העלאה עד 1MB, בלי שליחת מיילים, ואי אפשר להחליף את הסיסמה של משתמש הדמו.
- **איפוס אוטומטי כל לילה** ב-01:00 UTC (Cron Trigger של ה-Worker): מחיקת כל ההעלאות וטעינה מחדש של הנתונים. אפשר גם לאפס ידנית: **Actions** ← **Demo reset**.

## סימן המים

"נבנה על ידי VPlus Studio" מוצג בתחתית. הלקוח לא יכול לכבות אותו מהלוח. רק הבעלים: `SHOW_CREDIT = "false"` ב-`wrangler.toml`, ואז push (הפריסה מנקה את הקאש).

---

## פיתוח מקומי (למי שיש מחשב)

```bash
npm install
cp .dev.vars.example .dev.vars   # סיסמת דמו מקומית
npm run dev                      # מיגרציות + seed מקומי + wrangler dev
npm run check                    # בדיקת site.config.json ובדיקות יחידה
```

ליצירת מנהל מקומי:

```bash
ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=long-password-1 node scripts/admin-user-sql.mjs > .wrangler/admin.sql
npx wrangler d1 execute DB --local --file .wrangler/admin.sql
```

## מבנה הריפו

```
site.config.json     שדות הטקסט, ההגדרות והדפים (הלוח בונה מהם את הטפסים)
wrangler.toml        הגדרות Cloudflare
migrations/          סכמת D1
src/                 ה-Worker: ניתוב, רינדור דפים, API, אימות, תמונות, טופס, דמו
public/              קבצים סטטיים: CSS, JS, לוח הניהול, איורי הדמו
scripts/             סקריפטים ל-CI: משאבים, משתמש מנהל, seed
.github/workflows/   setup, deploy, reset-admin-password, demo-reset
```

הוספת שדה טקסט חדש: הוסיפו אותו ל-`fields` ב-`site.config.json` (מפתח, תווית, סוג, דף), והשתמשו במפתח בתבנית ב-`src/render/pages.js`. בלוח הוא יופיע לבד.

ללקוח חדש ראו [NEW_CLIENT.md](NEW_CLIENT.md).
