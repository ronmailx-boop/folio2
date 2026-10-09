# הקמת לקוח חדש מתבנית Folio1

צ'קליסט שאפשר לעבור מהנייד. סמנו כל שורה כשהיא נעשתה.

### פעם אחת בלבד (בריפו folio1)
- [ ] ב-`folio1`: **Settings** ← **General** ← סמנו **Template repository**.

### ריפו ללקוח
- [ ] בריפו `folio1` לחצו **Use this template** ← **Create a new repository**.
- [ ] שם: למשל `client-dana-studio`. בחרו **Private**.

### התאמת הקוד (עריכה ישירה ב-GitHub: פותחים קובץ ← עיפרון ← Commit)
- [ ] `wrangler.toml`:
  - [ ] `name` = שם ייחודי, למשל `dana-studio`. (זה גם החלק הראשון בכתובת `workers.dev`.)
  - [ ] `database_name` = למשל `dana-studio-db`.
  - [ ] `bucket_name` = למשל `dana-studio-media` (אותיות קטנות, ספרות ומקפים בלבד).
  - [ ] `routes`: להחליף `folio1.vplusstudio.app` בדומיין של הלקוח, או למחוק את השורה עד שהדומיין מוכן ב-Cloudflare (אחרת הפריסה נכשלת).
  - [ ] `DEMO_MODE = "false"` (חשוב! אחרת פרטי הכניסה מוצגים בדף הכניסה והאתר מתאפס כל לילה).
  - [ ] `SHOW_CREDIT`: להשאיר `"true"`, או `"false"` אם סוכם עם הלקוח על הסרת הקרדיט.
- [ ] `site.config.json`:
  - [ ] `siteName` = שם העסק.
  - [ ] `defaultPrimaryColor` ו-`secondaryColor` = צבעי המותג (הלקוח יכול לשנות את הצבע הראשי גם מהלוח).
  - [ ] (לא חובה) להוסיף או להסיר שדות טקסט.

### Secrets ו-Variables בריפו של הלקוח
**Settings** ← **Secrets and variables** ← **Actions**:
- [ ] `CLOUDFLARE_API_TOKEN` ו-`CLOUDFLARE_ACCOUNT_ID` (של החשבון שבו האתר ירוץ: שלכם או של הלקוח).
- [ ] `ADMIN_EMAIL` = **המייל של הלקוח**. `ADMIN_PASSWORD` = סיסמה זמנית חזקה (לפחות 10 תווים).
- [ ] (לא חובה) `RESEND_API_KEY`, `NOTIFY_EMAIL` (המייל של הלקוח), `MAIL_FROM`.
- [ ] (לא חובה) `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`.
- [ ] Variable: `CUSTOM_DOMAIN` = הדומיין של הלקוח (אם כבר מנוהל ב-Cloudflare).

### הקמה
- [ ] **Actions** ← **Setup** ← סמנו "למלא תוכן לדוגמה" אם רוצים שהלקוח יתחיל מתוכן מלא שיחליף ← **Run workflow**.
- [ ] בסיכום הריצה: כתובת האתר ולוח הניהול.
- [ ] להיכנס ללוח ולוודא: שם העסק, טלפון, וואטסאפ, מייל, כתובת, צבע ולוגו (**הגדרות**).
- [ ] לעדכן את **הצהרת הנגישות** (שם רכז הנגישות ופרטי קשר אמיתיים).
- [ ] למחוק את התוכן לדוגמה שלא רלוונטי (שירותים, תמונות).

### דומיין
- [ ] הדומיין של הלקוח ב-Cloudflare (Add a site ← החלפת Nameservers אצל הרשם).
- [ ] משתנה `CUSTOM_DOMAIN` ← להריץ שוב **Setup**.
- [ ] לבדוק שהאתר נפתח ב-https בדומיין.

### מסירה ללקוח
- [ ] לשלוח ללקוח: כתובת הלוח (`https://<דומיין>/admin/`), המייל והסיסמה הזמנית.
- [ ] לבקש מהלקוח להחליף סיסמה מיד: **חשבון** ← **החלפת סיסמה**.
- [ ] להסביר: "שכחתי סיסמה" = פונים אליכם, ואתם מריצים **Reset admin password** (ראו README).
- [ ] לוודא שפרטי הכניסה של הלקוח **אינם** פרטי הדמו (`demo@folio1.app`).
