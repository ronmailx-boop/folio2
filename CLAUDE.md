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

﻿## Publishing this Android app to Google Play (universal instructions)


### Owner account type (read first)
- The owner (Ron) publishes with a Google Play **organization** developer account (brand: Vplus Studio). Account-type-dependent rules:
  - The closed-test requirement (at least 12 testers opted in continuously for 14 days before applying for production access) applies ONLY to **personal** developer accounts created after Nov 13, 2023. Organization accounts have NO testing requirement before production. Source: https://support.google.com/googleplay/android-developer/answer/14151465
  - Exception: if a specific app was originally created under a personal account and later transferred to the organization account, the testing requirement can stay attached to that app. Check that app's Play Console Dashboard for "Apply for production" before assuming it is exempt.
  - The Android-device verification via the Play Console mobile app is also a personal-account-only requirement.
- Do NOT tell the owner to recruit 12 testers or wait 14 days for production access. Internal testing below is optional QA, not a Google requirement for his account type.


### Goal and division of work
- Goal: a GitHub Actions workflow builds a signed AAB and uses fastlane `supply` (`upload_to_play_store`) to upload the AAB, store listing text and images to the **Internal testing** track as a **draft** release. The owner (Ron) reviews it in Play Console and presses publish/promote manually. NEVER try to publish to production or promote tracks automatically.
- The owner works only from the Claude Code Android app (cloud GitHub sessions, no PC). Do all file work in the repo, commit to a branch, and open a PR or push as the owner prefers. You cannot read or set GitHub secrets. Tell the owner exactly which secrets to add and where; never ask for secret values in chat.
- No skill needs to be installed. Everything uses standard tools on the GitHub runner (Ruby, fastlane, Java, Android SDK/Gradle or Node).


### Step 0: Discover, do not assume
Before writing anything, inspect the repo and fill these values. Ask the owner only for what cannot be found:
- `PACKAGE_NAME` (applicationId): look in `app/build.gradle(.kts)`, `android/app/build.gradle`, `capacitor.config.*` (appId), or `twa-manifest.json` (packageId). It must match the Play Console app exactly. Package names are unique and permanent once the app is created.
- `APP_KIND`: native Gradle project, Capacitor/Cordova, or a PWA wrapped as TWA (Bubblewrap / PWABuilder). The owner's apps are mostly PWAs, so an Android wrapper is usually needed. If there is no Android project yet, create one (Bubblewrap `init`/`build` or Capacitor `add android`) and commit it.
- `ANDROID_DIR` (folder containing `gradlew`) and the expected AAB output path (usually `<ANDROID_DIR>/app/build/outputs/bundle/release/app-release.aab`).
- `APP_NAME`, supported locales (default `he-IL` and `en-US`), and whether `fastlane/` already exists.
Write the discovered values at the top of `fastlane/README-publish.md` so later sessions do not re-discover them.


### One-time manual steps per app (the owner does these, you remind him)
1. Create the app in Play Console (name, package name, default language, app or game, free or paid, accept the Developer Program Policies / US export laws declarations and the Play App Signing Terms of Service). Package name is fixed forever after app creation.
2. Build the first AAB (run the workflow with `upload=false`, download the artifact) and upload it manually once to Internal testing. fastlane cannot create the app or do the first upload: Google requires the app to exist with at least one manually uploaded build before the API works.
3. Complete the required Play Console forms: privacy policy URL, app access, ads declaration, content rating, target audience, data safety, and app category. The API does not do these.
4. Add testers (an email list) to the Internal testing track (up to 100 testers on Internal).
Testing requirement note: the closed-test rule (12 testers opted in continuously for 14 days, then "Apply for production", review ~7 days) applies only to PERSONAL developer accounts created after Nov 13, 2023. The owner's account is an ORGANIZATION account, so it does NOT apply; he can publish to production without a closed test (https://support.google.com/googleplay/android-developer/answer/14151465). Only exception: an app that started under a personal account and was transferred - check that app's Dashboard.


### One-time setup per developer account (shared by all apps)
1. Google Cloud Console: create or pick a project, enable the **Google Play Android Developer API** (fastlane's docs call it "Google Play Developer API"), create a **service account**, and create a JSON key for it (Actions > Manage keys > Add key > Create new key > JSON). No IAM roles are needed on the service account itself.
2. Play Console > Users and permissions > Invite new users: paste the service account email, and grant these permissions (exact names in Play Console):
   - "Release apps to testing tracks" (create, edit and roll out releases on internal/closed/open tracks)
   - "Manage store presence" (store listing text and graphics)
   - "View app information and download bulk reports (read-only)" (account level; the app-level equivalent is "View app information (read-only)")
   Grant them as account permissions to cover all current and future apps. Do NOT grant "Release to production, exclude devices, and use Play App Signing" - the owner publishes manually.
3. Accept all pending agreements in Play Console (see TOS_NOT_ACCEPTED below).
4. Permissions are not instant: usually minutes, occasionally up to ~24 hours (sometimes more). On a 403 right after granting, wait and retry before changing anything.
5. Optional connection test, run anywhere with Ruby: `fastlane run validate_play_store_json_key json_key:/path/to/key.json`.
Do not ask for the JSON in chat. The owner pastes the entire file contents into the repo secret.


### GitHub repo secrets (owner adds, per repo)
- `PLAY_SERVICE_ACCOUNT_JSON`: full JSON key text.
- `ANDROID_KEYSTORE_BASE64`: upload keystore, base64 (`base64 -w0 upload.jks`; create it with `keytool -genkeypair` on any machine or in a one-off Actions run, and have the owner store it safely; losing it requires a Play "upload key reset"). Keep a private backup of the keystore outside GitHub.
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- Use Play App Signing (required for new apps; its Terms of Service are accepted when creating the app). The keystore here is only the upload key.
Never print secrets in logs. Never commit keystores, JSON keys or `.env`. Add them to `.gitignore`.


### Files to create
`Gemfile`:
```
source "https://rubygems.org"
gem "fastlane"
```
`fastlane/Appfile`:
```
package_name(ENV["PACKAGE_NAME"] || "REPLACE_WITH_PACKAGE_NAME")
```
`fastlane/Fastfile`:
```ruby
default_platform(:android)


platform :android do
  desc "Upload AAB + store listing to Internal testing as a DRAFT"
  lane :internal do
    upload_to_play_store(
      package_name: ENV["PACKAGE_NAME"],
      json_key_data: ENV["PLAY_SERVICE_ACCOUNT_JSON"],
      track: "internal",
      release_status: "draft",          # always draft: the owner presses publish
      aab: ENV["AAB_PATH"],
      skip_upload_apk: true,
      metadata_path: "fastlane/metadata/android",
      skip_upload_metadata: ENV["SKIP_METADATA"] == "true",
      skip_upload_images: ENV["SKIP_IMAGES"] == "true",
      skip_upload_screenshots: ENV["SKIP_IMAGES"] == "true",
      skip_upload_changelogs: false,
      timeout: 600                       # default is 300s; large AABs can still exceed it
    )
  end


  desc "Listing/images only, no new build"
  lane :listing do
    upload_to_play_store(
      package_name: ENV["PACKAGE_NAME"],
      json_key_data: ENV["PLAY_SERVICE_ACCOUNT_JSON"],
      track: "internal",
      skip_upload_aab: true,
      skip_upload_apk: true,
      skip_upload_changelogs: true,
      metadata_path: "fastlane/metadata/android",
      timeout: 600
    )
  end
end
```
`.github/workflows/play-internal.yml` (adapt the build step to `APP_KIND`):
```yaml
name: Play internal upload
on:
  workflow_dispatch:
    inputs:
      upload:
        description: "Upload to Play (false = only build the AAB artifact)"
        default: "true"
      listing_only:
        description: "Only upload listing and images"
        default: "false"
jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    env:
      PACKAGE_NAME: REPLACE_WITH_PACKAGE_NAME
      ANDROID_DIR: android          # folder with gradlew
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "17" }
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: "3.2", bundler-cache: true }
      # If APP_KIND is Capacitor/PWA wrapper, add actions/setup-node and the web build + `npx cap sync android` here.
      - name: Restore keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > "$RUNNER_TEMP/upload.jks"
      - name: Build signed AAB
        working-directory: ${{ env.ANDROID_DIR }}
        env:
          KEYSTORE_PATH: ${{ runner.temp }}/upload.jks
          KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: ./gradlew bundleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: aab
          path: ${{ env.ANDROID_DIR }}/app/build/outputs/bundle/release/*.aab
      - name: Upload to Play (Internal, draft)
        if: ${{ inputs.upload == 'true' }}
        env:
          PLAY_SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          AAB_PATH: ${{ env.ANDROID_DIR }}/app/build/outputs/bundle/release/app-release.aab
        run: |
          if [ "${{ inputs.listing_only }}" = "true" ]; then bundle exec fastlane android listing
          else bundle exec fastlane android internal; fi
```
The Gradle `signingConfigs.release` must read `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` from environment variables. Add that if missing. `versionCode` must increase on every upload (and stay below 2100000000): derive it from `GITHUB_RUN_NUMBER` (offset above any previously uploaded code) or bump it in the repo. `targetSdk` must meet Google Play's current target API level requirement; check it when the build is rejected.


### Store listing metadata layout
```
fastlane/metadata/android/
  he-IL/
    title.txt               (max 30 chars)
    short_description.txt   (max 80 chars)
    full_description.txt    (max 4000 chars)
    changelogs/<versionCode>.txt   (max 500 chars per language; or default.txt)
    images/
      icon.png              (512x512, 32-bit PNG with alpha, max 1024 KB)
      featureGraphic.png    (1024x500, JPEG or 24-bit PNG, no alpha)
      phoneScreenshots/1.png ... 8.png   (min 2, up to 8 per device type; JPEG or 24-bit PNG, no alpha; each side 320-3840 px; long side at most 2x the short side)
  en-US/
    (same structure)
```
- Locale folder names must match Play's codes exactly: `he-IL`, `en-US` (both are supported by supply). The language must also be added in Play Console (Grow users > Store presence > Store listings > translations) before it can be uploaded, otherwise supply errors on an unknown language.
- Write the Hebrew text natively, no machine-sounding translation, plain text, no markdown. Keep the app name consistent across locales.
- Generate screenshots from the real app (headless Chromium/Playwright against the PWA at a phone viewport such as 1080x1920 is fine) and commit them. Do not invent features in descriptions. Ask the owner to approve the descriptions before the first upload.


### Run it
1. Owner: GitHub app/web > Actions > "Play internal upload" > Run workflow. First time use `upload=false`.
2. After the manual first upload exists in Play Console, run with `upload=true`. Check Play Console > Test and release > Testing > Internal testing for the new draft release, review, then press "Send for review/Publish" manually.
3. In your reply to the owner, give the Actions run link and say what changed. Do not claim it is published; it is a draft awaiting him.


### Known pitfalls and fixes
- **Timeout on large AAB** (`Net::ReadTimeout`, `execution expired`): keep `timeout: 600` (or higher) in `upload_to_play_store` (the parameter default is 300 seconds). Re-run; also try `ENV["SUPPLY_UPLOAD_MAX_RETRIES"]="3"` (retries failed Google API calls; supported since September 2023 fastlane releases).
- **TOS_NOT_ACCEPTED** (or "Please accept the latest agreement"): the developer account owner must open Play Console and accept the pending Developer Distribution Agreement / terms. Not fixable from code. Then re-run.
- **Credential errors**: "Google Api Error: forbidden / The caller does not have permission": the service account was not invited in Play Console Users and permissions, lacks the permissions above, or the grant has not propagated yet (wait and retry; it can take up to ~24 hours). "Invalid JSON key"/parse errors: the secret was pasted truncated or wrapped; re-paste the whole file. "Google Play Android Developer API has not been used": enable the API in the Google Cloud project of the service account. Test the key anytime with `fastlane run validate_play_store_json_key json_key:...`.
- **"Package not found" / "Application not found"**: package name mismatch, app not created in Play Console, or the first AAB was not uploaded manually yet (the API cannot make the first upload).
- **"Only releases with status draft may be created on draft app"**: the app has never been published. Keep `release_status: "draft"` (already the default here).
- **"Version code N has already been used"**: raise `versionCode`.
- **Signature errors** ("signed with the wrong key"): the keystore secret is not the upload key registered in Play. Use the original keystore, or ask Google for an upload key reset.
- **Ruby on the runner**: always use `ruby/setup-ruby@v1` with `bundler-cache: true` and run `bundle exec fastlane`. Never use the system Ruby or `gem install` without Bundler. If bundler complains about the lockfile platform, run `bundle lock --add-platform x86_64-linux` and commit `Gemfile.lock`.
- **Image rejected**: wrong size, alpha channel on screenshots or feature graphic (only the icon may have alpha), or fewer than 2 phone screenshots. Fix the files and re-run the `listing` lane.
- **Changelog rejected** ("The release notes for language 'xx-XX' are too long. Limit is 500 characters."): trim the changelog file for every locale; the limit applies per language and one over-limit locale fails the whole upload.
- **Secrets**: if a secret is missing the step fails with an empty value. Tell the owner the exact secret name to add; do not ask him to paste it in chat.


### Definition of done
Workflow green, draft release visible in Internal testing with the right versionCode, listing and images present for each locale, and the owner told what remains manual.