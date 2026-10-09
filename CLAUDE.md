# CLAUDE.md – Folio1

הערות המשכיות לסשנים הבאים. **עדכן בסוף כל שלב.**

## כללי עבודה של Ron
- **תמיד למזג ל-main.** אחרי שינוי: לפתוח PR ולמזג אותו בעצמך (בלי לחכות לאישור נוסף), כשהבדיקות עוברות.

## מצב נוכחי
**folio2 = אתר הדמו השני של תבנית Folio** (התבנית המקורית והמתועדת: הריפו `ronmailx-boop/folio1`, סטודיו צילום).
- העסק הפיקטיבי: **"נוגה – קליניקה לקוסמטיקה"** (טיפולי פנים, לייזר, גבות וריסים, ציפורניים, איפור). צבע ראשי ורוד `#d6457a`.
- הקוד זהה ל-folio1, מלבד: `wrangler.toml` (שם `folio2`, D1 `folio2-db`, R2 `folio2-media`, דומיין `folio2.vplusstudio.app`, `DEMO_EMAIL = "demo@folio2.app"`), `site.config.json` (שם וצבעים), `src/seed.js` (כל התוכן והתמונות), וכפתור "ברירת מחדל" של הצבע בלוח שקורא את ברירת המחדל מ-`site.config.json`.
- הקמה: כמו folio1 – 4 Secrets בריפו (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) ואז Actions ← Setup.
- אחרי שהאתר באוויר: להוסיף אותו ל-`assets/demos.json` בריפו `ronmailx-boop/vplus-studio` (דף https://vplusstudio.app/demos).
- ב-API Token חייבת להיות הרשאת Account ← D1 ← Edit (התבנית "Edit Cloudflare Workers" לא כוללת אותה). R2 כבר הופעל בחשבון.

## עיצוב
כיוון "מינימל לבן" (ב' מתוך 3 ב-https://claude.ai/artifact/YWMsBd8Z2XL5a78bnHMhWR), שונה בכוונה מהלילה הכהה של folio1: רקע לבן, דיו `#1a1418`, Rubik 300–800, כותרות ענק עבות, פינות חדות וקווים דקים. צבע ההדגשה `--accent` נגזר בגוון כהה מהצבע הראשי (`color-mix(... 80%, #000)`), כך שהוא קריא על לבן ושטקסט לבן עליו קריא. דף הבית: שורת מטא (`business.tagline` + תגית זמינות), כותרת בשני צבעים, פס תמונות (גדולה ושתיים לצידה), נתונים עם קו עליון עבה, שירותים כרשימה ממוספרת (`serviceList` ב-`src/render/pages.js`; בדף השירותים עם תמונה קטנה), גלריה וגוש CTA שחור ברוחב מלא. כפתור הכותרת לוקח את הטקסט מ-`home.cta.button`. גם לוח הניהול באותו סגנון (`public/admin/admin.css`), ותצוגת הצבע בלוח מחשבת את ההדגשה באותה נוסחה. אין `style=""` בתבניות (CSP).

## ארכיטקטורה (סגורה)
- Worker אחד (`src/index.js`) + D1 (`DB`) + R2 (`MEDIA`) + Static Assets (`public/`, binding `ASSETS`).
- JS רגיל, ES modules, בלי build. התלות היחידה: `wrangler` (devDependency).
- דפים ציבוריים מרונדרים בשרת (`src/site.js`, `src/render/*`) ונשמרים ב-Cache API.
- לוח הניהול: SPA סטטי ב-`public/admin/` (`admin.js` + `lib.js`), מדבר עם `/api/admin/*`.

## החלטות שהתקבלו
- **ניקוי קאש:** מפתח הקאש = `/__page/<CF_VERSION_METADATA.id>/v<_cache_version><path>`. כל שמירה בלוח מעלה את `_cache_version` בטבלת settings (עובד בכל מרכזי הנתונים, לא רק במקומי), וכל פריסה משנה את מזהה הגרסה. עולה שאילתת D1 אחת לכל בקשה. ב-`*.workers.dev` ה-Cache API לא פעיל, אז שם כל בקשה מרונדרת (בסדר).
- **צבע ראשי:** `/theme.css?v=<גרסה>` דינמי מה-Worker, כדי לא להזדקק ל-inline style (CSP בלי `unsafe-inline`).
- **PBKDF2:** 100,000 איטרציות, המקסימום ש-Workers מאפשר (מעל זה WebCrypto ב-workerd זורק שגיאה).
- **סשן:** עוגייה `__Host-folio1_session`, טוקן 32 בתים, נשמר כ-SHA-256 ב-D1, 14 יום. בהחלפת סיסמה שאר הסשנים נמחקים.
- **CSRF:** בדיקת `Origin` לכל בקשת כתיבה ל-`/api/*` + חובת `application/json` (חוץ מ-`/api/admin/upload`, שמקבל רק `image/*`, ולכן גם הוא דורש preflight).
- **הגבלת קצב:** טבלת `rate_limits` עם חלון קבוע. התחברות: 5 כישלונות ל-15 דק' לכל IP ולכל מייל (הניסיון השישי מקבל 429). טופס: 5 לשעה לכל IP. ה-IP נשמר מגובב עם `HASH_SALT` (סוד שנוצר ב-setup).
- **תמונות מקושרות:** מפתח תמונה יכול להיות גם קישור `https://images.pexels.com/...` או `https://images.unsplash.com/...` (`EXTERNAL_IMAGE_RE` ב-`src/util.js`, ושני המארחים ב-`img-src` של ה-CSP ב-`src/site.js` וב-`public/_headers`). תמונות הדמו הן צילומים מ-Pexels (`DEMO_IMAGES` ב-`src/seed.js`, עם שם כל תמונה בהערה). אם קישור נכשל, `public/js/site.js` מחליף אותו ב-`/demo/about.svg`. מהקונטיינר של Claude אין גישה ל-Pexels או Unsplash, ולכן התמונות נבחרו לפי שמן בחיפוש ולא נבדקו ויזואלית.
- **תמונות:** דחיסה בדפדפן (WebP, 1600px, 0.82, נפילה ל-JPEG, הקטנה חוזרת אם עדיין גדול). בשרת: בדיקת magic bytes, מפתח `u/<32hex>.<ext>`. תמונות דמו הן קבצים סטטיים `public/demo/*.svg` עם מפתח `demo/...` (לא ב-R2, לא נמחקות).
- **משאבים ב-CI:** `scripts/ci-resources.mjs` מאתר/יוצר D1 ו-R2 לפי השמות ב-`wrangler.toml` ומחליף את `database_id` בזמן ריצה בלבד (לא נשמר בריפו). לא השתמשתי בהקצאה האוטומטית של wrangler כי מיגרציות `--remote` צריכות מזהה ידוע, והשיטה המפורשת צפויה יותר.
- **דומיין:** `routes = [ { pattern = "folio2.vplusstudio.app", custom_domain = true } ]` ב-`wrangler.toml`, כך שכל פריסה מחברת אותו. משתנה GitHub `CUSTOM_DOMAIN` גובר עליו. ללקוח חדש: להחליף או למחוק את השורה עד שהדומיין מוכן, אחרת הפריסה נכשלת. הטוקן מתבנית "Edit Cloudflare Workers" (עם Zone Workers Routes על הדומיין) הספיק.
- **סיסמת דמו:** סוד `DEMO_PASSWORD` (פומבי בכוונה, מוצג ב-`/api/public-info` רק כש-`DEMO_MODE=true`). אם חסר, setup מייצר אחד.
- **איפוס דמו:** Cron Trigger ב-Worker (`0 1 * * *`) + workflow ידני `demo-reset.yml`. ה-handler לא עושה כלום כש-`DEMO_MODE` אינו `true`.
- **seed:** `src/seed.js` מחזיר `{sql, params}[]`. ה-Worker מריץ ב-`DB.batch`, וה-CI הופך ל-SQL עם `scripts/sql.mjs`.
- **site.config.json:** מיובא עם `with { type: 'json' }` (עובד גם ב-esbuild של wrangler וגם ב-Node, לבדיקות).
- **Resend:** ברירת מחדל `onboarding@resend.dev`, שולח רק לבעל חשבון ה-Resend. ללקוחות צריך `MAIL_FROM` מדומיין מאומת.

## בעיות פתוחות / רעיונות
- העלאה שלא נשמרה (למשל בחרו לוגו ולא לחצו "שמירה") משאירה אובייקט יתום ב-R2. באתר דמו האיפוס הלילי מנקה. אפשר להוסיף ניקוי יתומים ב-cron (השוואת מפתחות R2 מול settings/services/gallery).
- `setup.yml` מייצר `HASH_SALT` חדש בכל ריצה (מאפס בפועל את מוני הגבלת הקצב; לא מזיק).
- אין עדיין בדיקות אינטגרציה אוטומטיות ב-CI (נבדק ידנית עם curl ו-Playwright, ראו בהמשך).
- הנעילה לפי מייל מאפשרת לתוקף לחסום זמנית את המנהל (15 דק'). מקובל לפי הדרישות.

## פקודות שימושיות
```bash
npm run dev            # מיגרציות + seed מקומי + wrangler dev (צריך .dev.vars עם DEMO_PASSWORD)
npm run check          # בדיקת site.config.json + node --test
npx wrangler dev --test-scheduled   # ואז curl localhost:8787/__scheduled להרצת איפוס הדמו
npx wrangler deploy --dry-run --outdir /tmp/out
node scripts/gen-demo-svg.mjs public/demo   # יצירת איורי הדמו מחדש
```

## בדיקות קבלה (נבדקו מקומית)
RTL בלי גלילה אופקית ב-360/390px · שינוי כותרת בלוח מופיע מיד באתר · PNG של 12.4MB צומצם ל-515KB, הועלה והוצג · מחיקת תמונה מחזירה 404 מ-`/media/` · CRUD והסתרה של שירותים · טופס שומר הודעה עם תג "חדש" גם בלי מייל · 401 בלי סשן · ניסיון התחברות שישי מקבל 429 · שינוי צבע משנה את `--primary` · `SHOW_CREDIT=false` מסתיר את הקרדיט · איפוס הדמו מחזיר נתונים ומנתק את משתמש הדמו · sitemap, robots ו-404 · אין סודות בריפו (`.dev.vars` ב-gitignore).
