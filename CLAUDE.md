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

﻿## Publishing generated videos to this YouTube channel from GitHub (universal instructions)


### Goal and division of work
- Goal: a GitHub Actions workflow uploads generated videos (committed to the repo, or produced during the run) to the owner's YouTube channel through the official YouTube Data API v3 (`videos.insert`), with title/description/tags/privacy from a small sidecar file per video. Videos default to **unlisted** (link-only); the owner (Ron) reviews them in YouTube Studio and sets them public manually. NEVER upload as public unless the sidecar or the owner says so.
- The owner works only from the Claude Code Android app (cloud GitHub sessions, no PC). Do all file work in the repo, commit to a branch, and open a PR or push as he prefers. You cannot read or set GitHub secrets. Tell the owner exactly which secrets to add and where; never ask for secret values in chat.
- No skill needs to be installed. The upload runs on the GitHub runner, either with the `yutu` GitHub Action or with a small Python script based on Google's official sample (both below). Never use Composio's YouTube upload tool: its `YOUTUBE_UPLOAD_VIDEO` has a reported bug where the file bytes never reach YouTube and the video is deleted within seconds (https://github.com/ComposioHQ/composio/issues/2954 and https://github.com/ComposioHQ/composio/issues/3547).


### Step 0: Discover, do not assume
Before writing anything, inspect the repo and fill these values. Ask the owner only for what cannot be found:
- Which Google account owns the target YouTube channel. The OAuth login below must use THAT account, which is not necessarily his default Gmail. If the channel is a Brand Account, sign in with the account that manages it and pick the brand channel during consent.
- `VIDEO_DIR` (folder where finished videos land, default `videos/`), the video formats (`.mp4` / `.mov` / `.webm`), and typical file size.
- Where videos come from: committed to git, tracked with Git LFS, downloaded from his video-generation site during the run, or generated inside the workflow. If a generator produces them, prefer generating or downloading in the workflow instead of committing large files.
- Default metadata: `categoryId` (22 = People & Blogs), default privacy (start with `unlisted`), and `madeForKids`. His growing-up videos show children: ask the owner whether they count as made for kids (COPPA); a wrong answer can get the channel penalized.
Write the discovered values at the top of `scripts/README-youtube.md` so later sessions do not re-discover them.


### One-time manual setup by the owner (about 20 minutes, all in a browser, works on his phone)
1. Google Cloud Console (console.cloud.google.com): create a project (any name, e.g. `vplus-youtube-upload`).
2. APIs & Services > Library: enable **YouTube Data API v3**.
3. APIs & Services > OAuth consent screen: user type External, fill in app name and support email, add the scope `https://www.googleapis.com/auth/youtube.upload`. Then set publishing status to **In production** (Publishing status > Publish app). With status "Testing" the refresh token expires after 7 days and uploads break weekly (https://developers.google.com/identity/protocols/oauth2#expiration, "Refresh token expiration"). Do NOT submit the app for verification; an "unverified app" warning during consent is fine for his own channel.
4. APIs & Services > Credentials > Create Credentials > OAuth client ID: application type "Web application", and add the authorized redirect URI `https://developers.google.com/oauthplayground`. Keep the client ID and client secret.
5. Get the refresh token once: open https://developers.google.com/oauthplayground, click the gear icon, check "Use your own OAuth credentials", paste the client ID and secret. In Step 1 type the scope `https://www.googleapis.com/auth/youtube.upload`, click "Authorize APIs", sign in with the Google account that owns the channel, and on the warning screen choose Advanced > continue. In Step 2 click "Exchange authorization code for tokens" and copy the **refresh token**.
6. Add the repo secrets below (GitHub repo > Settings > Secrets and variables > Actions).
Phone note: some Google Cloud Console pages are cramped on a phone. Landscape orientation or the browser's "Desktop site" toggle helps.


### GitHub repo secrets (owner adds, per repo)
- `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`: from the OAuth client in step 4.
- `YOUTUBE_REFRESH_TOKEN`: from step 5.
- Only if using the yutu-action variant instead of the Python script: `YOUTUBE_CREDENTIAL` (the downloaded `client_secret.json`, base64-encoded) and `YOUTUBE_TOKEN` (a JSON holding the playground tokens, base64-encoded). See the variant section for the exact file shapes.
Never print secrets in logs. Never commit `client_secret*.json`, `*.token.json` or `.env`; add them to `.gitignore`. The refresh token gives permanent upload access to the channel: treat it like a password. If it ever leaks, revoke it at https://myaccount.google.com/permissions and create a new one.


### Sidecar metadata format
For each video `videos/<name>.mp4` put an optional `videos/<name>.json` next to it:
```json
{
  "title": "Adam growing up, 2015-2026",
  "description": "Made with Vplus Studio",
  "tags": ["growing up", "birthday"],
  "categoryId": "22",
  "privacyStatus": "unlisted",
  "madeForKids": false,
  "publishAt": "2026-11-20T16:00:00Z"
}
```
All fields are optional. Defaults: `title` = the file name, `description` = empty, `tags` = none, `categoryId` = "22", `privacyStatus` = "unlisted" (the owner publishes manually; set "public" to publish immediately, or "private" to keep it hidden), `madeForKids` = false. `publishAt` schedules the video: it requires `privacyStatus: "private"` and a future RFC 3339 timestamp, and YouTube publishes automatically at that time.


### Files to create
`scripts/upload_video.py` (adapted from Google's official sample https://github.com/youtube/api-samples/blob/master/python/upload_video.py):
```python
#!/usr/bin/env python3
"""Upload one video to YouTube using a stored OAuth refresh token.
Required env vars: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
Usage: python scripts/upload_video.py --file videos/clip.mp4 [--meta videos/clip.json]
"""
import argparse, json, os, sys, time
import httplib2
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload


SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]
RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError)
MAX_RETRIES = 10


def get_youtube():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["YOUTUBE_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YOUTUBE_CLIENT_ID"],
        client_secret=os.environ["YOUTUBE_CLIENT_SECRET"],
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def resumable_upload(request):
    response, error, retry = None, None, 0
    while response is None:
        try:
            print("Uploading file...")
            _, response = request.next_chunk()
            if response is not None and "id" in response:
                print(f"Video id '{response['id']}' was successfully uploaded.")
                return response["id"]
        except HttpError as e:
            if e.resp.status in RETRIABLE_STATUS_CODES:
                error = f"Retriable HTTP error {e.resp.status}: {e.content}"
            else:
                raise
        except RETRIABLE_EXCEPTIONS as e:
            error = f"Retriable error: {e}"
        if error:
            print(error)
            retry += 1
            if retry > MAX_RETRIES:
                sys.exit("No longer attempting to retry.")
            time.sleep(2 ** retry)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--file", required=True)
    p.add_argument("--meta", default=None)
    a = p.parse_args()
    meta = {}
    if a.meta and os.path.exists(a.meta):
        meta = json.load(open(a.meta))
    status = {
        "privacyStatus": meta.get("privacyStatus", "unlisted"),
        "selfDeclaredMadeForKids": bool(meta.get("madeForKids", False)),
    }
    if meta.get("publishAt"):
        status["publishAt"] = meta["publishAt"]
        status["privacyStatus"] = "private"  # publishAt requires private
    body = {
        "snippet": {
            "title": meta.get("title") or os.path.splitext(os.path.basename(a.file))[0],
            "description": meta.get("description", ""),
            "tags": meta.get("tags", []),
            "categoryId": str(meta.get("categoryId", "22")),
        },
        "status": status,
    }
    youtube = get_youtube()
    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=MediaFileUpload(a.file, chunksize=-1, resumable=True),
    )
    video_id = resumable_upload(request)
    print(f"https://www.youtube.com/watch?v={video_id}")


if __name__ == "__main__":
    main()
```


`.github/workflows/youtube-upload.yml`:
```yaml
name: Upload videos to YouTube
on:
  workflow_dispatch:
    inputs:
      file:
        description: "Repo path to one video (empty = every un-uploaded video in videos/)"
        default: ""
  push:
    paths: ["videos/**"]
permissions:
  contents: write   # the workflow commits an .uploaded marker per video
jobs:
  upload:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }   # harmless if LFS is unused; required if videos use Git LFS
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install google-api-python-client google-auth httplib2
      - name: Upload new videos
        env:
          YOUTUBE_CLIENT_ID: ${{ secrets.YOUTUBE_CLIENT_ID }}
          YOUTUBE_CLIENT_SECRET: ${{ secrets.YOUTUBE_CLIENT_SECRET }}
          YOUTUBE_REFRESH_TOKEN: ${{ secrets.YOUTUBE_REFRESH_TOKEN }}
        run: |
          set -euo pipefail
          shopt -s nullglob
          only="${{ inputs.file }}"
          for f in videos/*.mp4 videos/*.mov videos/*.webm; do
            if [ -n "$only" ] && [ "$f" != "$only" ]; then continue; fi
            marker="$f.uploaded"
            if [ -f "$marker" ]; then echo "skip $f (already uploaded)"; continue; fi
            meta="${f%.*}.json"; [ -f "$meta" ] || meta=""
            python scripts/upload_video.py --file "$f" ${meta:+--meta "$meta"} | tee upload.log
            url=$(grep -o 'https://www.youtube.com/watch?v=[A-Za-z0-9_-]*' upload.log | tail -1)
            echo "$url" > "$marker"
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add "$marker"
            git commit -m "Mark $f uploaded ($url)"
            git push
          done
```


Alternative for a single file, no Python: the `yutu` GitHub Action (https://github.com/eat-pray-ai/youtube-uploader, CLI repo https://github.com/eat-pray-ai/yutu):
```yaml
      - name: Upload video
        uses: eat-pray-ai/youtube-uploader@main
        with:
          credential: ${{ secrets.YOUTUBE_CREDENTIAL }}  # base64 of client_secret.json
          token: ${{ secrets.YOUTUBE_TOKEN }}            # base64 of youtube.token.json
          file: "./videos/clip.mp4"
          title: "Adam growing up"
          desc: "Made with Vplus Studio"
          tags: "growing up,birthday"
          rest-flags: "-p unlisted -g 22"   # -p privacy, -g categoryId, -y playlistId, -u thumbnail, -k forKids
```
- `client_secret.json` is downloaded in setup step 4 and base64-encoded (`base64 -w0 client_secret.json`).
- `youtube.token.json` shape: `{"access_token": "...", "token_type": "Bearer", "refresh_token": "...", "expiry": "2020-01-01T00:00:00Z"}` built from the OAuth playground tokens (an expired `expiry` just forces a refresh), then base64-encoded the same way.
- Pin the yutu version with `version:` (for example `v0.9.5`) if a newer release ever misbehaves; empty means latest.


### Run it
1. Commit a video plus its optional sidecar to `videos/` and push, or run the workflow manually with a `file` input.
2. Check the run log for the `https://www.youtube.com/watch?v=...` line, then YouTube Studio > Content for the video (private by default).
3. In your reply to the owner give the Actions run link and the video link, and say what remains manual (review and set Public in Studio, or schedule via `publishAt`). Do not claim it is public.


### Quota, privacy and the audit
- Default quota: 100 `videos.insert` calls per day, plus 10,000 units per day for the other endpoints; usage resets at midnight Pacific Time and shows on the Quotas page of the Google Cloud project (https://developers.google.com/youtube/v3/determine_quota_cost). Plenty for his volume. More quota requires passing YouTube's audit: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits.
- Privacy: `videos.insert` defaults to public, so the workflow and sidecar always set a privacy value explicitly, defaulting to unlisted. Note: uploads from unaudited API projects used to be forced to private; Google's current reference says they are NOT restricted anymore (https://developers.google.com/youtube/v3/docs/videos/insert, checked 2026-11-06). Either way this workflow defaults to unlisted so no video goes public without the owner; if uploads ever come out locked to private, the restriction is back: publish from YouTube Studio or request the audit above.
- `madeForKids` must be truthful (COPPA). Made-for-kids videos lose comments, notifications and some other features; a wrong setting can get the channel penalized.


### Known pitfalls and fixes
- `invalid_grant` when refreshing: the refresh token expired or was revoked. Causes: consent screen still in "Testing" (7-day expiry), the Google password changed, or access revoked at myaccount.google.com/permissions. Fix: redo setup step 5, update `YOUTUBE_REFRESH_TOKEN`, and make sure the app is In production.
- "Google hasn't verified this app" warning during consent: expected for an unverified personal app; choose Advanced > continue. Removing the warning requires Google verification, not needed for his own channel.
- Push rejected because a file exceeds 100 MiB (25 MiB via web upload): GitHub's limits (https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github). Fixes: track videos with Git LFS (`git lfs track "videos/*.mp4"`; the workflow already checks out with `lfs: true`), attach them to a GitHub Release and download them in the run, or generate/download them inside the workflow instead of committing them.
- `quotaExceeded` / `uploadLimitExceeded`: daily cap hit (100 uploads/day, resets midnight PT) or the channel's own upload limit. Wait, or request more quota through the audit form.
- Upload stalls or `HttpError 500/502/503/504`: the script retries with exponential backoff; for large files also keep `timeout-minutes` generous.
- `publishAt` rejected: it requires `privacyStatus: "private"` and a future RFC 3339 timestamp.
- Metadata not applied: the sidecar must sit next to the video with the same base name (`videos/foo.mp4` + `videos/foo.json`).
- Secrets: a missing secret fails the step on authentication with an empty value. Tell the owner the exact secret name to add; do not ask him to paste it in chat.
- Never use Composio for the upload (silent-deletion bug, see above). Only the yutu action or the Python script.


### Definition of done
Workflow green, the video visible in YouTube Studio with the right title, description, tags and privacy, and the owner told what remains manual (review, set public, or schedule via `publishAt`).