// נתוני דמו: "נוגה – קליניקה לקוסמטיקה וטיפוח" (עסק פיקטיבי).
// משמש גם את ה-Worker (איפוס לילי) וגם את סקריפט ה-CI (scripts/seed-sql.mjs).
// הפונקציה מחזירה רשימת פקודות SQL עם פרמטרים, בלי תלות בסביבה.

// תמונות הדמו: צילומים אמיתיים מ-Pexels (חינם לשימוש מסחרי, בלי חובת קרדיט: https://www.pexels.com/license/).
// מקושרים ישירות מהמאגר ומוקטנים שם (w=1600). אם קישור יפסיק לעבוד, האתר מציג במקומו איור דמו.
// השמות בהערות הם שמות התמונות ב-Pexels, למקרה שצריך להחליף.
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

export const DEMO_IMAGES = {
  facial: pexels(4207234), // Photo of Woman Having Facial Care
  facial2: pexels(3738349), // Woman Having Facial Care
  laser: pexels(5619448), // Master doing laser epilation procedure with apparatus
  laserDevice: pexels(16032298), // Device for Laser Hair Removal
  lashes: pexels(3762664), // Mascara Applicator
  manicure: pexels(939836), // Pink Manicure
  manicure2: pexels(16363470), // Hands with Professional Manicure done
  nailSalon: pexels(29877720), // Professional Nail Care with Pink Gloves in Salon
  makeup: pexels(20593111), // Beautician Applying Makeup
  serums: pexels(8102135), // White and Black Unlabeled Serum Bottles
  blackBottle: pexels(7797851), // Flay Lay Photo Of Black Bottle
  room: pexels(16571735), // Treatment Room in a Private Clinic
};
const I = DEMO_IMAGES;

export const DEMO_SETTINGS = {
  'business.name': 'נוגה – קליניקה לקוסמטיקה',
  'business.tagline': 'טיפולי פנים, לייזר ויופי, באווירה אישית ושקטה',
  'brand.primary_color': '#d6457a',
  'contact.phone': '050-000-0000',
  'contact.whatsapp': '050-000-0000',
  'contact.email': 'hello@example.com',
  'contact.address': 'רחוב הדוגמה 8, רמת גן',
  'contact.hours': 'ראשון–חמישי: 09:00–20:00\nשישי: 08:30–14:00\nשבת: סגור\nבתיאום מראש בלבד',
  'contact.map_url': 'https://www.google.com/maps/search/?api=1&query=%D7%A8%D7%9E%D7%AA+%D7%92%D7%9F',
  'social.facebook': 'https://www.facebook.com/',
  'social.instagram': 'https://www.instagram.com/',

  'home.hero.badge': 'תורים פנויים השבוע',
  'home.hero.title': 'העור שלך.',
  'home.hero.title_accent': 'בידיים הכי טובות.',
  'home.hero.subtitle':
    'קליניקת נוגה מתמחה בטיפולי פנים, הסרת שיער בלייזר, עיצוב גבות וריסים, ציפורניים ואיפור. כל טיפול מתחיל באבחון אישי ומותאם בדיוק לעור שלך.',
  'home.hero.cta_text': 'לקביעת תור',
  'home.hero.cta_link': '/contact',
  'home.feature1.stat': '12+',
  'home.feature1.title': 'שנות ניסיון',
  'home.feature1.text': 'קוסמטיקאית מוסמכת עם השתלמויות מתקדמות בארץ ובחו"ל.',
  'home.feature2.stat': '1:1',
  'home.feature2.title': 'יחס אישי',
  'home.feature2.text': 'לקוחה אחת בכל פעם, בחדר טיפולים פרטי ושקט.',
  'home.feature3.stat': '100%',
  'home.feature3.title': 'היגיינה מוקפדת',
  'home.feature3.text': 'ציוד חד-פעמי או מעוקר לכל טיפול, ותכשירים מקצועיים בלבד.',
  'home.services.title': 'הטיפולים שלנו',
  'home.gallery.title': 'מהקליניקה',
  'home.cta.title': 'מגיע לך רגע לעצמך.',
  'home.cta.text': 'קבעי תור לאבחון עור ראשון. נבנה יחד תוכנית טיפולים שמתאימה בדיוק לך.',
  'home.cta.button': 'לקביעת תור',
  'seo.home.title': 'נוגה – קליניקה לקוסמטיקה ברמת גן | טיפולי פנים, לייזר ויופי',
  'seo.home.description': 'טיפולי פנים, הסרת שיער בלייזר, עיצוב גבות וריסים, מניקור ואיפור כלות. קליניקה פרטית ברמת גן, קביעת תור בוואטסאפ.',

  'about.title': 'נעים להכיר, אני נוגה',
  'about.text':
    'הקמתי את הקליניקה מתוך אמונה שטיפוח הוא לא מותרות, אלא רגע של שקט ושל אהבה עצמית.\n\nאני קוסמטיקאית מוסמכת כבר יותר מ-12 שנה, ובכל שנה אני ממשיכה ללמוד שיטות וטכנולוגיות חדשות. כל טיפול אצלי מתחיל בשיחה ובאבחון עור, כי אין שני עורות זהים.\n\nהקליניקה פרטית ושקטה, עם לקוחה אחת בכל פעם. כאן לא ממהרים.',
  'about.image': pexels(16571735),
  'about.image_alt': 'חדר טיפולים מעוצב בקליניקה',
  'seo.about.title': 'אודות | נוגה – קליניקה לקוסמטיקה',
  'seo.about.description': 'הכירו את נוגה, קוסמטיקאית מוסמכת עם ניסיון של יותר מ-12 שנה.',

  'services.title': 'הטיפולים שלנו',
  'services.intro': 'כל טיפול מותאם אישית אחרי אבחון עור. המחירים הם נקודת פתיחה, ואת המחיר המדויק נקבע יחד בפגישה הראשונה.',
  'seo.services.title': 'טיפולים ומחירים | נוגה – קליניקה לקוסמטיקה',
  'seo.services.description': 'טיפולי פנים, לייזר, גבות וריסים, מניקור ג\'ל, איפור כלות וטיפולי אנטי-אייג\'ינג.',

  'gallery.title': 'מהקליניקה',
  'gallery.intro': 'הצצה לטיפולים, לתכשירים ולאווירה. לחצי על תמונה כדי לראות אותה בגדול.',
  'seo.gallery.title': 'גלריה | נוגה – קליניקה לקוסמטיקה',
  'seo.gallery.description': 'תמונות מהקליניקה: טיפולי פנים, לייזר, ציפורניים ואיפור.',

  'contact.title': 'קביעת תור',
  'contact.intro': 'השאירי פרטים ונחזור אלייך לתיאום. אפשר גם לשלוח הודעה בוואטסאפ.',
  'contact.success': 'תודה! קיבלנו את הפנייה ונחזור אלייך עוד היום לתיאום תור.',
  'seo.contact.title': 'קביעת תור | נוגה – קליניקה לקוסמטיקה',
  'seo.contact.description': 'קביעת תור לקליניקת נוגה ברמת גן: טלפון, וואטסאפ או טופס.',

  'accessibility.title': 'הצהרת נגישות',
  'accessibility.text':
    'אנו רואים חשיבות רבה במתן שירות שוויוני לכלל הלקוחות, ופועלים להנגשת האתר לאנשים עם מוגבלות.\n\nהאתר נבנה בהתאם להנחיות WCAG 2.1 ברמה AA ככל הניתן: מבנה כותרות תקין, ניווט מלא במקלדת, טקסט חלופי לתמונות, ניגודיות צבעים מספקת וכיבוד הגדרת "הפחתת תנועה" של המכשיר.\n\nאם נתקלתם בבעיית נגישות, נשמח לשמוע ולתקן. רכזת הנגישות: נוגה ישראלי, טלפון 050-000-0000, מייל hello@example.com.\n\nתאריך עדכון ההצהרה: ינואר 2026.',
  'seo.accessibility.title': 'הצהרת נגישות | נוגה – קליניקה לקוסמטיקה',
  'seo.accessibility.description': 'הצהרת הנגישות של אתר קליניקת נוגה.',

  'footer.text': 'קליניקה פרטית לקוסמטיקה וטיפוח ברמת גן.',
};

export const DEMO_SERVICES = [
  ['טיפולי פנים', 'ניקוי עמוק, פילינג עדין, מסכה ועיסוי מרגיע, מותאם לסוג העור שלך.', I.facial, 'החל מ-₪280'],
  ['הסרת שיער בלייזר', 'טכנולוגיית דיודה מתקדמת, מתאימה לרוב סוגי העור, בטיפול נעים ומהיר.', I.laser, 'החל מ-₪150 לאזור'],
  ['עיצוב גבות וריסים', 'עיצוב גבות לפי מבנה הפנים, הרמת ריסים וצביעה למבט פתוח וטבעי.', I.lashes, 'החל מ-₪90'],
  ['מניקור ופדיקור', 'לק ג\'ל, בניית ציפורניים וטיפול כף רגל, בציוד מעוקר.', I.manicure, 'החל מ-₪120'],
  ['איפור כלות וערב', 'איפור עמיד ומחמיא ליום החתונה או לאירוע, כולל ניסיון מקדים.', I.makeup, 'החל מ-₪450'],
  ['אנטי-אייג\'ינג', 'טיפולי מיצוק והבהרה עם סרומים מקצועיים, לעור רענן וזוהר.', I.facial2, 'החל מ-₪380'],
];

// שלוש הראשונות מוצגות בפס שמתחת לכותרת בדף הבית
export const DEMO_GALLERY = [
  [I.facial2, 'אישה בטיפול פנים בקליניקה', 'טיפול פנים'],
  [I.serums, 'בקבוקי סרום לבנים ושחורים ללא תוויות', 'התכשירים שלנו'],
  [I.manicure2, 'ידיים עם מניקור מקצועי מנצנץ על רקע ורוד', 'מניקור ג\'ל'],
  [I.laserDevice, 'מכשיר להסרת שיער בלייזר', 'לייזר דיודה'],
  [I.makeup, 'קוסמטיקאית מאפרת לקוחה', 'איפור ערב'],
  [I.manicure, 'יד עם מניקור ורוד מנצנץ', 'ציפורניים'],
  [I.blackBottle, 'בקבוק תכשיר שחור בצילום מלמעלה', 'טיפוח'],
  [I.nailSalon, 'טיפול ציפורניים מקצועי עם כפפות ורודות', 'ציוד מעוקר'],
  [I.room, 'חדר טיפולים מעוצב בקליניקה', 'חדר הטיפולים'],
];

export const DEMO_MESSAGES = [
  ['מיכל אברהם', '050-000-0001', 'michal@example.com', 'היי, אשמח לקבוע טיפול פנים לשבוע הבא. יש משהו פנוי ביום שלישי?', 0],
  ['שירה כהן', '050-000-0002', '', 'מתחתנת בעוד חודשיים ומחפשת איפור כלה עם ניסיון מקדים. אפשר פרטים?', 1],
];

/**
 * בונה את פקודות האיפוס והזריעה.
 * @param {{ demoUser?: { email: string, hash: string, salt: string } }} opts
 * @returns {{ sql: string, params: any[] }[]}
 */
export function seedStatements({ demoUser } = {}) {
  const out = [];
  const q = (sql, ...params) => out.push({ sql, params });

  q("DELETE FROM settings WHERE key NOT LIKE '\\_%' ESCAPE '\\'");
  q('DELETE FROM services');
  q('DELETE FROM gallery');
  q('DELETE FROM messages');
  q('DELETE FROM rate_limits');
  q("DELETE FROM sqlite_sequence WHERE name IN ('services','gallery','messages')");

  for (const [k, v] of Object.entries(DEMO_SETTINGS)) q('INSERT INTO settings (key, value) VALUES (?, ?)', k, v);
  DEMO_SERVICES.forEach(([title, description, image, price], i) =>
    q('INSERT INTO services (title, description, image_key, price_text, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, 1)', title, description, image, price, i),
  );
  DEMO_GALLERY.forEach(([image, alt, caption], i) =>
    q('INSERT INTO gallery (image_key, alt_text, caption, sort_order, is_visible) VALUES (?, ?, ?, ?, 1)', image, alt, caption, i),
  );
  DEMO_MESSAGES.forEach(([name, phone, email, body, read], i) =>
    q('INSERT INTO messages (name, phone, email, body, is_read, created_at) VALUES (?, ?, ?, ?, ?, unixepoch() - ?)', name, phone, email, body, read, (i + 1) * 3600 * 5),
  );

  if (demoUser) {
    q(
      'INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, password_salt = excluded.password_salt',
      demoUser.email,
      demoUser.hash,
      demoUser.salt,
    );
    q('DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)', demoUser.email);
  }
  q("INSERT INTO settings (key, value) VALUES ('_cache_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", String(Date.now()));
  return out;
}

/** מחזיר את כל מפתחות התמונות של הדמו (קבצים סטטיים, לא R2). */
export function isDemoAsset(key) {
  return typeof key === 'string' && key.startsWith('demo/');
}
