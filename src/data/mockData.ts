// Centralized mock data for ReviewHub

import dmaLogo from "@/assets/logos/dma-logo.png";
import codemastersLogo from "@/assets/logos/codemasters-logo.png";
import designtlvLogo from "@/assets/logos/designtlv-logo.png";
import datahubLogo from "@/assets/logos/datahub-logo.png";
import hebrewtechLogo from "@/assets/logos/hebrewtech-logo.png";
import growthLogo from "@/assets/logos/growth-logo.png";

export type BusinessType = "freelancer" | "course-provider";

export interface Course {
  id: string;
  businessSlug: string;
  name: string;
  price: number;
  description: string;
  affiliateUrl: string;
  category: string;
  courseType?: string; // קורס, סדנה, הרצאה, לימודים, תעודת הכשרה
  rating: number;
  reviewCount: number;
  verifiedPurchases: number;
}

export interface SocialLinks {
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface Business {
  slug: string;
  name: string;
  type: BusinessType;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  description: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: SocialLinks;
}

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  courseName: string;
  courseId: string;
  businessSlug: string;
  date: string;
  purchaseDate: string;
  verified: boolean;
  anonymous: boolean;
  updatedAt?: string;
  flagged?: boolean;
  flagReason?: string;
  ownerResponse?: {
    text: string;
    date: string;
  };
}

export interface AffiliateClick {
  courseId: string;
  date: string;
  converted: boolean;
  revenue?: number;
}

// ─── Freelancer Categories ──────────────────────────────
export const FREELANCER_CATEGORIES = [
  "שיווק וסושיאל",
  "עיצוב אתרים",
  "עריכת וידאו",
  "כתיבה שיווקית",
  "קידום אורגני (SEO)",
  "פיתוח אתרים",
  "עיצוב גרפי",
  "צילום מקצועי",
  "ניהול קמפיינים",
  "אסטרטגיה דיגיטלית",
  "מנהל סושיאל",
  "יועץ עסקי",
  "יועץ משכנתאות",
  "רואה חשבון",
  "עורך דין",
  "מאמן ספורט",
];

// ─── Plural forms for "All X" button ────────────────────
export const CATEGORY_PLURAL: Record<string, string> = {
  "מנהל סושיאל": "מנהלי סושיאל",
  "יועץ עסקי": "היועצים העסקיים",
  "יועץ משכנתאות": "יועצי המשכנתאות",
  "רואה חשבון": "רואי החשבון",
  "עורך דין": "עורכי הדין",
  "שיווק וסושיאל": "השיווק וסושיאל",
  "עיצוב אתרים": "מעצבי האתרים",
  "עריכת וידאו": "עורכי הוידאו",
  "כתיבה שיווקית": "הכותבים השיווקיים",
  "קידום אורגני (SEO)": "מקדמי ה-SEO",
  "פיתוח אתרים": "מפתחי האתרים",
  "עיצוב גרפי": "המעצבים הגרפיים",
  "צילום מקצועי": "הצלמים המקצועיים",
  "ניהול קמפיינים": "מנהלי הקמפיינים",
  "אסטרטגיה דיגיטלית": "האסטרטגים הדיגיטליים",
  "מאמן ספורט": "מאמני הספורט",
};

// ─── Sub-specialties per category ───────────────────────
export const FREELANCER_SUBCATEGORIES: Record<string, string[]> = {
  "מנהל סושיאל": [
    "מנהל סושיאל לעסקים קטנים",
    "מנהל סושיאל למותגי אופנה",
    "מנהל סושיאל למסעדות ופוד",
    "מנהל סושיאל ל-E-commerce",
    "מנהל סושיאל לסטארטאפים",
  ],
  "יועץ עסקי": [
    "יועץ עסקי לסטארטאפים",
    "יועץ עסקי לעסקים קטנים ובינוניים",
    "יועץ עסקי למסחר אלקטרוני",
    "יועץ עסקי לגיוס משקיעים",
    "יועץ עסקי לאסטרטגיית צמיחה",
  ],
  "יועץ משכנתאות": [
    "יועץ משכנתאות לרוכשי דירה ראשונה",
    "יועץ משכנתאות למחזרי משכנתא",
    "יועץ משכנתאות למשקיעי נדל״ן",
    "יועץ משכנתאות לזוגות צעירים",
    "יועץ משכנתאות לתושבים חוזרים",
  ],
  "רואה חשבון": [
    "רואה חשבון מתמחה בתיקי נוסטרו",
    "רואה חשבון שמבין בשוק ההון",
    "רואה חשבון שמבין בנדל״ן",
    "רואה חשבון שמבין בעוסק פטור",
    "רואה חשבון שעובד רק עם חברות בע״מ",
  ],
  "עורך דין": [
    "עורך דין מקרקעין ונדל״ן",
    "עורך דין דיני עבודה",
    "עורך דין מסחרי וחוזים",
    "עורך דין היי-טק וקניין רוחני",
    "עורך דין משפחה וגירושין",
  ],
  "שיווק וסושיאל": [
    "שיווק ברשתות חברתיות",
    "שיווק משפיענים",
    "שיווק תוכן",
    "שיווק באמצעות וידאו",
    "שיווק לעסקים מקומיים",
  ],
  "עיצוב אתרים": [
    "עיצוב דפי נחיתה",
    "עיצוב אתרי מסחר",
    "עיצוב אתרי תדמית",
    "עיצוב UI/UX למובייל",
    "עיצוב מערכות SaaS",
  ],
  "עריכת וידאו": [
    "עריכת וידאו לרשתות חברתיות",
    "עריכת סרטוני תדמית",
    "עריכת וידאו ל-YouTube",
    "עריכת סרטוני מוצר",
    "אנימציה ומושן גרפיקס",
  ],
  "כתיבה שיווקית": [
    "כתיבת דפי נחיתה",
    "כתיבת מודעות ממומנות",
    "כתיבת תוכן לבלוגים",
    "כתיבת סקריפטים לוידאו",
    "כתיבת ניוזלטרים",
  ],
  "קידום אורגני (SEO)": [
    "SEO טכני",
    "SEO מקומי (Local SEO)",
    "SEO לאתרי מסחר",
    "בניית קישורים (Link Building)",
    "אסטרטגיית תוכן ל-SEO",
  ],
  "פיתוח אתרים": [
    "פיתוח React / Next.js",
    "פיתוח WordPress",
    "פיתוח Shopify",
    "פיתוח Full-Stack",
    "פיתוח אפליקציות ווב",
  ],
  "עיצוב גרפי": [
    "עיצוב לוגו ומיתוג",
    "עיצוב חומרי שיווק",
    "עיצוב אריזות",
    "עיצוב לדפוס",
    "עיצוב לדיגיטל",
  ],
  "צילום מקצועי": [
    "צילום מוצרים",
    "צילום תדמית",
    "צילום אירועים עסקיים",
    "צילום אוכל",
    "צילום ראשי צוות",
  ],
  "ניהול קמפיינים": [
    "קמפיינים ב-Google Ads",
    "קמפיינים ב-Facebook / Instagram",
    "קמפיינים ב-LinkedIn",
    "קמפיינים ב-TikTok",
    "קמפיינים רב-ערוציים",
  ],
  "אסטרטגיה דיגיטלית": [
    "אסטרטגיית צמיחה דיגיטלית",
    "אסטרטגיית תוכן",
    "אסטרטגיית משפכי מכירות",
    "אסטרטגיה למסחר אלקטרוני",
    "אסטרטגיה לסטארטאפים",
  ],
  "מאמן ספורט": [
    "מאמן חדר כושר",
    "מאמן פילאטיס מכשירים",
    "מאמן כושר קרבי",
    "מאמן קרוספיט",
    "מאמן ריצה",
    "כולם",
    "אחר",
  ],
};

// ─── Course Types ───────────────────────────────────────
export const COURSE_TYPES = [
  "קורס",
  "סדנה",
  "הרצאה",
  "לימודים",
  "תעודת הכשרה",
  "בוטקמפ",
  "מנטורינג",
  "הכשרה מקצועית",
];

// ─── Course Provider Categories ─────────────────────────
export const COURSE_CATEGORIES = [
  "שיווק דיגיטלי",
  "תכנות ופיתוח",
  "עיצוב UI/UX",
  "מדעי נתונים",
  "עסקים ויזמות",
  "צילום ווידאו",
];

// ─── Businesses ─────────────────────────────────────────
export const BUSINESSES: Business[] = [
  // ── Freelancers / בעלי מקצוע עצמאים ──
  { slug: "maya-social", name: "מאיה כהן — ניהול סושיאל", type: "freelancer", category: "שיווק וסושיאל", subcategory: "שיווק ברשתות חברתיות", rating: 4.9, reviewCount: 87, description: "מנהלת שיווק ברשתות חברתיות עם 8 שנות ניסיון. מתמחה בבניית אסטרטגיית תוכן, ניהול קהילות וקמפיינים ב-Instagram, TikTok ו-Facebook.", website: "https://mayasocial.co.il", email: "maya@mayasocial.co.il", phone: "050-1234567" },
  { slug: "oren-webdesign", name: "אורן לוי — עיצוב אתרים", type: "freelancer", category: "עיצוב אתרים", subcategory: "עיצוב אתרי תדמית", rating: 4.8, reviewCount: 63, description: "מעצב אתרים ו-UI/UX פרילנסר. מתמחה בעיצוב חוויית משתמש, דפי נחיתה, אתרי תדמית ואתרי מסחר. עובד עם Figma, Webflow ו-WordPress.", website: "https://orenlevy.design", email: "oren@orenlevy.design", phone: "052-9876543" },
  { slug: "noa-video", name: "נועה שמש — עריכת וידאו", type: "freelancer", category: "עריכת וידאו", subcategory: "עריכת וידאו לרשתות חברתיות", rating: 4.7, reviewCount: 52, description: "עורכת וידאו מקצועית לרשתות חברתיות, סרטוני תדמית, ריליס ו-YouTube. עבודה עם Premiere Pro, After Effects ו-DaVinci Resolve.", website: "https://noavideo.co.il", email: "noa@noavideo.co.il", phone: "054-5551234" },
  { slug: "yoni-copywriting", name: "יוני אברהם — קופירייטינג", type: "freelancer", category: "כתיבה שיווקית", subcategory: "כתיבת דפי נחיתה", rating: 4.6, reviewCount: 41, description: "קופירייטר ומומחה כתיבה שיווקית. כתיבת מודעות, דפי נחיתה, סקריפטים לוידאו, ניוזלטרים ותוכן לאתרים. ניסיון עם מאות מותגים.", website: "https://yonicopy.co.il", email: "yoni@yonicopy.co.il", phone: "053-4445566" },
  { slug: "tal-seo", name: "טל ברק — קידום אורגני", type: "freelancer", category: "קידום אורגני (SEO)", subcategory: "SEO טכני", rating: 4.8, reviewCount: 73, description: "מומחה SEO עם ניסיון של 10 שנים. קידום אורגני בגוגל, בניית אסטרטגיית תוכן, מחקר מילות מפתח וטכני SEO.", website: "https://talseo.co.il", email: "tal@talseo.co.il", phone: "050-7778899" },
  { slug: "lior-dev", name: "ליאור מזרחי — פיתוח אתרים", type: "freelancer", category: "פיתוח אתרים", subcategory: "פיתוח Full-Stack", rating: 4.5, reviewCount: 38, description: "מפתח Full-Stack פרילנסר. בניית אתרים, אפליקציות ווב, מערכות ניהול תוכן ואינטגרציות. React, Node.js, WordPress.", website: "https://liordev.co.il", email: "lior@liordev.co.il", phone: "052-1112233" },
  { slug: "dana-graphics", name: "דנה רוזנברג — עיצוב גרפי", type: "freelancer", category: "עיצוב גרפי", subcategory: "עיצוב לוגו ומיתוג", rating: 4.9, reviewCount: 95, description: "מעצבת גרפית עם ניסיון של 12 שנה. מיתוג, לוגואים, עיצוב חומרי שיווק, עיצוב אריזות ועיצוב לדפוס ודיגיטל.", website: "https://danagraphics.co.il", email: "dana@danagraphics.co.il", phone: "054-3334455" },
  { slug: "avi-photo", name: "אבי כץ — צילום מקצועי", type: "freelancer", category: "צילום מקצועי", subcategory: "צילום מוצרים", rating: 4.7, reviewCount: 58, description: "צלם מקצועי לעסקים. צילום מוצרים, צילום תדמית, צילום אירועים עסקיים, ראשי צוות ותמונות לרשתות חברתיות.", website: "https://aviphoto.co.il", email: "avi@aviphoto.co.il", phone: "050-6667788" },
  { slug: "shira-campaigns", name: "שירה גולן — ניהול קמפיינים", type: "freelancer", category: "ניהול קמפיינים", subcategory: "קמפיינים ב-Google Ads", rating: 4.6, reviewCount: 44, description: "מנהלת קמפיינים דיגיטליים ב-Google Ads, Facebook Ads ו-LinkedIn. מתמחה ב-PPC, remarketing ואופטימיזציית המרות.", website: "https://shiracampaigns.co.il", email: "shira@shiracampaigns.co.il", phone: "053-8889900" },
  { slug: "eran-strategy", name: "ערן דביר — אסטרטגיה דיגיטלית", type: "freelancer", category: "אסטרטגיה דיגיטלית", subcategory: "אסטרטגיית צמיחה דיגיטלית", rating: 4.8, reviewCount: 36, description: "יועץ אסטרטגי לשיווק דיגיטלי. בניית תוכניות שיווק, אפיון קהלי יעד, בניית משפכי מכירות ואסטרטגיית צמיחה לעסקים.", website: "https://eranstrategy.co.il", email: "eran@eranstrategy.co.il", phone: "052-2223344" },

  // ── מנהלי סושיאל ──
  { slug: "liat-social-smb", name: "ליאת אורן — מנהלת סושיאל לעסקים", type: "freelancer", category: "מנהל סושיאל", subcategory: "מנהל סושיאל לעסקים קטנים", rating: 4.8, reviewCount: 64, description: "ניהול רשתות חברתיות לעסקים קטנים ובינוניים. אסטרטגיית תוכן, לוח שנה שיווקי, יצירת תוכן וניהול קהילות.", website: "https://liatsocial.co.il", email: "liat@liatsocial.co.il", phone: "050-2223344" },
  { slug: "gal-social-fashion", name: "גל שמעון — סושיאל מותגי אופנה", type: "freelancer", category: "מנהל סושיאל", subcategory: "מנהל סושיאל למותגי אופנה", rating: 4.7, reviewCount: 42, description: "מנהלת סושיאל המתמחה במותגי אופנה ולייפסטייל. שיתופי פעולה עם משפיעניות, צילום אופנה וקמפיינים ויראליים.", website: "https://galsocial.co.il", email: "gal@galsocial.co.il", phone: "052-5556677" },
  { slug: "ron-social-food", name: "רון אביב — סושיאל מסעדות", type: "freelancer", category: "מנהל סושיאל", subcategory: "מנהל סושיאל למסעדות ופוד", rating: 4.9, reviewCount: 53, description: "ניהול סושיאל למסעדות, קפיטריות ועסקי אוכל. צילום מנות, ריליס, TikTok ואינסטגרם עם דגש על פוד קונטנט.", website: "https://ronfood.co.il", email: "ron@ronfood.co.il", phone: "054-7778899" },

  // ── יועצים עסקיים ──
  { slug: "avi-biz-startups", name: "אבי רוזנפלד — יועץ לסטארטאפים", type: "freelancer", category: "יועץ עסקי", subcategory: "יועץ עסקי לסטארטאפים", rating: 4.8, reviewCount: 39, description: "יועץ עסקי לסטארטאפים בתחילת הדרך. ליווי בבניית מודל עסקי, pitch deck, ואסטרטגיית כניסה לשוק.", website: "https://avibiz.co.il", email: "avi@avibiz.co.il", phone: "050-3334455" },
  { slug: "michal-biz-smb", name: "מיכל דוד — יועצת לעסקים קטנים", type: "freelancer", category: "יועץ עסקי", subcategory: "יועץ עסקי לעסקים קטנים ובינוניים", rating: 4.7, reviewCount: 55, description: "ייעוץ עסקי לבעלי עסקים קטנים ובינוניים. תכנית עסקית, ייעול תהליכים, ניהול פיננסי ואסטרטגיית מכירות.", website: "https://michalbiz.co.il", email: "michal@michalbiz.co.il", phone: "053-4445566" },
  { slug: "noam-biz-ecomm", name: "נועם לוי — יועץ מסחר אלקטרוני", type: "freelancer", category: "יועץ עסקי", subcategory: "יועץ עסקי למסחר אלקטרוני", rating: 4.6, reviewCount: 31, description: "ייעוץ אסטרטגי לחנויות אונליין ו-E-commerce. הקמת חנות, אופטימיזציה, שיפור המרות ופתרונות לוגיסטיים.", website: "https://noamecomm.co.il", email: "noam@noamecomm.co.il", phone: "052-6667788" },

  // ── יועצי משכנתאות ──
  { slug: "ori-mortgage-first", name: "אורי כהן — משכנתא לרוכשים ראשונים", type: "freelancer", category: "יועץ משכנתאות", subcategory: "יועץ משכנתאות לרוכשי דירה ראשונה", rating: 4.9, reviewCount: 72, description: "ליווי רוכשי דירה ראשונה בתהליך המשכנתא. השוואת הצעות, מו״מ מול הבנקים, וחיסכון של אלפי שקלים.", website: "https://orimortgage.co.il", email: "ori@orimortgage.co.il", phone: "050-8889900" },
  { slug: "hadas-mortgage-refi", name: "הדס ברק — מחזור משכנתא", type: "freelancer", category: "יועץ משכנתאות", subcategory: "יועץ משכנתאות למחזרי משכנתא", rating: 4.8, reviewCount: 48, description: "מתמחה במחזור משכנתאות קיימות. ניתוח תיק משכנתא, הורדת ריבית ומיחזור חכם שחוסך עשרות אלפי שקלים.", website: "https://hadasmortgage.co.il", email: "hadas@hadasmortgage.co.il", phone: "054-1112233" },
  { slug: "yossi-mortgage-invest", name: "יוסי שלום — משכנתא למשקיעים", type: "freelancer", category: "יועץ משכנתאות", subcategory: "יועץ משכנתאות למשקיעי נדל״ן", rating: 4.7, reviewCount: 35, description: "ייעוץ משכנתאות למשקיעי נדל״ן. מימון דירות להשקעה, מינוף, תכנון פיננסי ארוך טווח ואופטימיזציית מס.", website: "https://yossimortgage.co.il", email: "yossi@yossimortgage.co.il", phone: "052-3334455" },

  // ── רואי חשבון ──
  { slug: "rina-cpa-nostro", name: "רינה אדלר — רו״ח תיקי נוסטרו", type: "freelancer", category: "רואה חשבון", subcategory: "רואה חשבון מתמחה בתיקי נוסטרו", rating: 4.8, reviewCount: 61, description: "רואת חשבון מוסמכת המתמחה בניהול תיקי נוסטרו. דיווח שנתי, תכנון מס ואופטימיזציה מיסויית לעצמאים ושכירים.", website: "https://rinacpa.co.il", email: "rina@rinacpa.co.il", phone: "03-5551234" },
  { slug: "eyal-cpa-stocks", name: "אייל כהן — רו״ח שוק ההון", type: "freelancer", category: "רואה חשבון", subcategory: "רואה חשבון שמבין בשוק ההון", rating: 4.7, reviewCount: 47, description: "רואה חשבון מומחה בשוק ההון. מיסוי מניות, אופציות, קריפטו, מסחר בינלאומי ודיווחי FATCA. חיסכון מיסים משמעותי.", website: "https://eyalcpa.co.il", email: "eyal@eyalcpa.co.il", phone: "03-6667788" },
  { slug: "sara-cpa-realestate", name: "שרה גולד — רו״ח נדל״ן", type: "freelancer", category: "רואה חשבון", subcategory: "רואה חשבון שמבין בנדל״ן", rating: 4.9, reviewCount: 56, description: "רואת חשבון המתמחה בנדל״ן. מיסוי מקרקעין, מס שבח, מס רכישה, תכנון עסקאות ומבני החזקה אופטימליים.", website: "https://saracpa.co.il", email: "sara@saracpa.co.il", phone: "03-7778899" },
  { slug: "moshe-cpa-exempt", name: "משה ברנר — רו״ח עוסק פטור", type: "freelancer", category: "רואה חשבון", subcategory: "רואה חשבון שמבין בעוסק פטור", rating: 4.6, reviewCount: 83, description: "רואה חשבון שמתמחה בליווי עוסקים פטורים ועוסקים מורשים חדשים. פתיחת תיק, דיווחים, ניהול הוצאות ומעבר בין סטטוסים.", website: "https://moshecpa.co.il", email: "moshe@moshecpa.co.il", phone: "03-8889900" },
  { slug: "dina-cpa-ltd", name: "דינה רם — רו״ח חברות בע״מ", type: "freelancer", category: "רואה חשבון", subcategory: "רואה חשבון שעובד רק עם חברות בע״מ", rating: 4.8, reviewCount: 38, description: "רואת חשבון המתמחה בחברות בע״מ. דוחות כספיים, ביקורת, מיסוי חברות, חלוקת דיבידנדים ותכנון מס.", website: "https://dinacpa.co.il", email: "dina@dinacpa.co.il", phone: "03-1234567" },

  // ── עורכי דין ──
  { slug: "amit-law-realestate", name: "עו״ד עמית כהן — מקרקעין", type: "freelancer", category: "עורך דין", subcategory: "עורך דין מקרקעין ונדל״ן", rating: 4.8, reviewCount: 67, description: "עורך דין מומחה בנדל״ן ומקרקעין. ליווי עסקאות רכישה ומכירה, טאבו, רישום זכויות, הסכמי שכירות ותב״עות.", website: "https://amitlaw.co.il", email: "amit@amitlaw.co.il", phone: "03-2345678" },
  { slug: "neta-law-labor", name: "עו״ד נטע ברון — דיני עבודה", type: "freelancer", category: "עורך דין", subcategory: "עורך דין דיני עבודה", rating: 4.7, reviewCount: 44, description: "עורכת דין בדיני עבודה. ייצוג עובדים ומעסיקים, תביעות פיצויים, הסכמי עבודה, פיטורין וזכויות עובדים.", website: "https://netalaw.co.il", email: "neta@netalaw.co.il", phone: "03-3456789" },
  { slug: "ido-law-commercial", name: "עו״ד עידו אלון — מסחרי", type: "freelancer", category: "עורך דין", subcategory: "עורך דין מסחרי וחוזים", rating: 4.6, reviewCount: 39, description: "עורך דין מסחרי. ניסוח הסכמים, הסכמי שותפות, תנאי שימוש, הסכמי SaaS, ליווי עסקאות ויישוב סכסוכים מסחריים.", website: "https://idolaw.co.il", email: "ido@idolaw.co.il", phone: "03-4567890" },
  { slug: "maya-law-tech", name: "עו״ד מאיה שפיר — היי-טק", type: "freelancer", category: "עורך דין", subcategory: "עורך דין היי-טק וקניין רוחני", rating: 4.9, reviewCount: 51, description: "עורכת דין להיי-טק וקניין רוחני. ליווי סטארטאפים, הסכמי השקעה, פטנטים, סימני מסחר והגנת קניין רוחני.", website: "https://mayalaw.co.il", email: "maya@mayalaw.co.il", phone: "03-5678901" },
  { slug: "yaron-law-family", name: "עו״ד ירון דביר — משפחה", type: "freelancer", category: "עורך דין", subcategory: "עורך דין משפחה וגירושין", rating: 4.7, reviewCount: 58, description: "עורך דין למשפחה וגירושין. הסכמי גירושין, משמורת ילדים, מזונות, חלוקת רכוש וגישור משפחתי.", website: "https://yaronlaw.co.il", email: "yaron@yaronlaw.co.il", phone: "03-6789012" },

  // ── Course Providers / מוכרי קורסים ──
  { slug: "digital-marketing-academy", name: "אקדמיית שיווק דיגיטלי", type: "course-provider", category: "שיווק דיגיטלי", rating: 4.8, reviewCount: 124, description: "הפלטפורמה המובילה בישראל לחינוך שיווק דיגיטלי. קורסים מקיפים ב-SEO, רשתות חברתיות, Google Ads ואסטרטגיית תוכן.", logo: dmaLogo, website: "https://dma.co.il", email: "info@dma.co.il", phone: "03-1234567", socialLinks: { youtube: "https://youtube.com/@dma", instagram: "https://instagram.com/dma.co.il", tiktok: "https://tiktok.com/@dma", linkedin: "https://linkedin.com/company/dma-il", facebook: "https://facebook.com/dma.co.il" } },
  { slug: "code-masters-il", name: "Code Masters IL", type: "course-provider", category: "תכנות ופיתוח", rating: 4.6, reviewCount: 89, description: "בוטקמפ פיתוח Full-Stack עם פרויקטים מעשיים ותעסוקה מובטחת.", logo: codemastersLogo, website: "https://codemasters.co.il", email: "hello@codemasters.co.il", phone: "03-9876543", socialLinks: { youtube: "https://youtube.com/@codemasters", instagram: "https://instagram.com/codemasters.il", linkedin: "https://linkedin.com/company/codemasters-il" } },
  { slug: "design-school-tlv", name: "בית הספר לעיצוב ת״א", type: "course-provider", category: "עיצוב UI/UX", rating: 4.9, reviewCount: 67, description: "קורסי UI/UX מאנשי מקצוע מהתעשייה. פורטפוליו מוכן לעבודה.", logo: designtlvLogo, website: "https://designtlv.co.il", email: "info@designtlv.co.il", phone: "03-5551234", socialLinks: { instagram: "https://instagram.com/designtlv", tiktok: "https://tiktok.com/@designtlv", facebook: "https://facebook.com/designtlv" } },
  { slug: "data-science-hub", name: "מרכז מדעי הנתונים", type: "course-provider", category: "מדעי נתונים", rating: 4.7, reviewCount: 156, description: "מיסודות Python ועד למידת מכונה מתקדמת. הכנה למקצועות העתיד.", logo: datahubLogo, website: "https://datahub.co.il", email: "learn@datahub.co.il", phone: "03-4445566", socialLinks: { youtube: "https://youtube.com/@datahub", linkedin: "https://linkedin.com/company/datahub-il", twitter: "https://x.com/datahubil" } },
  { slug: "hebrew-tech", name: "Hebrew Tech", type: "course-provider", category: "תכנות ופיתוח", rating: 4.5, reviewCount: 42, description: "חינוך טכנולוגי בעברית. קורסים נגישים לכולם.", logo: hebrewtechLogo, website: "https://hebrewtech.co.il", email: "info@hebrewtech.co.il", phone: "03-7778899", socialLinks: { youtube: "https://youtube.com/@hebrewtech", facebook: "https://facebook.com/hebrewtech" } },
  { slug: "growth-academy", name: "אקדמיית צמיחה", type: "course-provider", category: "עסקים ויזמות", rating: 4.4, reviewCount: 31, description: "Growth hacking ואסטרטגיית סטארטאפ. מהרעיון לביצוע.", logo: growthLogo, website: "https://growth.co.il", email: "team@growth.co.il", phone: "03-1112233", socialLinks: { instagram: "https://instagram.com/growthacademy", linkedin: "https://linkedin.com/company/growth-academy-il", tiktok: "https://tiktok.com/@growthacademy" } },
];

// ─── Courses ─────────────────────────────────────────
export const COURSES: Course[] = [
  { id: "course-1", businessSlug: "digital-marketing-academy", name: "שיווק דיגיטלי מאסטרקלאס", price: 2490, description: "קורס מקיף בשיווק דיגיטלי הכולל SEO, Google Ads, רשתות חברתיות ואנליטיקס.", affiliateUrl: "https://dma.co.il/masterclass", category: "שיווק דיגיטלי", courseType: "קורס", rating: 4.8, reviewCount: 58, verifiedPurchases: 312 },
  { id: "course-2", businessSlug: "digital-marketing-academy", name: "יסודות SEO", price: 990, description: "למדו לדרג אתרים בגוגל מאפס. קורס מעשי עם תרגילים.", affiliateUrl: "https://dma.co.il/seo", category: "שיווק דיגיטלי", courseType: "קורס", rating: 4.5, reviewCount: 34, verifiedPurchases: 189 },
  { id: "course-3", businessSlug: "digital-marketing-academy", name: "הסמכת Google Ads", price: 1790, description: "הכנה מלאה להסמכת Google Ads עם פרויקטים אמיתיים.", affiliateUrl: "https://dma.co.il/google-ads", category: "שיווק דיגיטלי", courseType: "תעודת הכשרה", rating: 4.7, reviewCount: 22, verifiedPurchases: 145 },
  { id: "course-4", businessSlug: "digital-marketing-academy", name: "סדנת אנליטיקס מתקדם", price: 1490, description: "ניתוח נתונים מתקדם עם Google Analytics 4 ו-Data Studio.", affiliateUrl: "https://dma.co.il/analytics", category: "שיווק דיגיטלי", courseType: "סדנה", rating: 4.3, reviewCount: 10, verifiedPurchases: 78 },
  { id: "course-5", businessSlug: "code-masters-il", name: "בוטקמפ Full-Stack", price: 14900, description: "12 שבועות אינטנסיביים של React, Node.js, PostgreSQL ועוד.", affiliateUrl: "https://codemasters.co.il/fullstack", category: "תכנות ופיתוח", courseType: "בוטקמפ", rating: 4.6, reviewCount: 62, verifiedPurchases: 234 },
  { id: "course-6", businessSlug: "code-masters-il", name: "React מתקדם", price: 3490, description: "Hooks, Context, Redux, Next.js ודפוסי עיצוב מתקדמים.", affiliateUrl: "https://codemasters.co.il/react", category: "תכנות ופיתוח", courseType: "קורס", rating: 4.7, reviewCount: 27, verifiedPurchases: 156 },
  { id: "course-7", businessSlug: "design-school-tlv", name: "יסודות עיצוב UI/UX", price: 3990, description: "מחקר משתמשים, Wireframing, Figma ופרויקט גמר.", affiliateUrl: "https://designtlv.co.il/uiux", category: "עיצוב UI/UX", courseType: "לימודים", rating: 4.9, reviewCount: 45, verifiedPurchases: 201 },
  { id: "course-8", businessSlug: "data-science-hub", name: "Python למדעי נתונים", price: 2990, description: "מ-Python בסיסי ועד Pandas, NumPy ו-Matplotlib.", affiliateUrl: "https://datahub.co.il/python", category: "מדעי נתונים", courseType: "קורס", rating: 4.7, reviewCount: 89, verifiedPurchases: 445 },
  { id: "course-9", businessSlug: "data-science-hub", name: "למידת מכונה מתקדמת", price: 4990, description: "TensorFlow, PyTorch, NLP ו-Computer Vision.", affiliateUrl: "https://datahub.co.il/ml", category: "מדעי נתונים", courseType: "הכשרה מקצועית", rating: 4.8, reviewCount: 67, verifiedPurchases: 289 },
  { id: "course-10", businessSlug: "growth-academy", name: "הרצאת Growth Hacking", price: 1990, description: "אסטרטגיות צמיחה מהירה לסטארטאפים.", affiliateUrl: "https://growth.co.il/hacking", category: "עסקים ויזמות", courseType: "הרצאה", rating: 4.4, reviewCount: 31, verifiedPurchases: 112 },
];

// ─── Reviews ─────────────────────────────────────────
export const REVIEWS: Review[] = [
  {
    id: "rev-1", reviewerName: "שרה ל.", rating: 5,
    text: "קורס מדהים! החניכה הייתה יוצאת מן הכלל ומצאתי עבודה תוך חודשיים. המרצה מקצועי ברמה גבוהה והתוכן עדכני ורלוונטי לשוק.",
    courseName: "שיווק דיגיטלי מאסטרקלאס", courseId: "course-1", businessSlug: "digital-marketing-academy",
    date: "28 פבר׳ 2026", purchaseDate: "2025-06-15", verified: true, anonymous: false,
    ownerResponse: { text: "תודה רבה שרה! שמחים לשמוע על ההצלחה שלך. בהצלחה בקריירה החדשה!", date: "1 מרץ 2026" }
  },
  {
    id: "rev-2", reviewerName: "אנונימי", rating: 4,
    text: "תוכן מעולה ותרגילים מעשיים. יכול היה להיות יותר תוכן מתקדם בנושא SEO טכני.",
    courseName: "יסודות SEO", courseId: "course-2", businessSlug: "digital-marketing-academy",
    date: "25 פבר׳ 2026", purchaseDate: "2025-09-01", verified: true, anonymous: true
  },
  {
    id: "rev-3", reviewerName: "משה ר.", rating: 5,
    text: "ההשקעה הטובה ביותר שעשיתי. המרצה מקצועי ברמה גבוהה והפרויקטים המעשיים היו מצוינים.",
    courseName: "הסמכת Google Ads", courseId: "course-3", businessSlug: "digital-marketing-academy",
    date: "20 פבר׳ 2026", purchaseDate: "2025-07-20", verified: true, anonymous: false,
    ownerResponse: { text: "תודה משה! מעריכים את המשוב.", date: "22 פבר׳ 2026" }
  },
  {
    id: "rev-4", reviewerName: "יעל ד.", rating: 3,
    text: "תוכן טוב אבל הקצב מהיר מדי למתחילים. מומלץ עם ידע מקדים בניתוח נתונים.",
    courseName: "סדנת אנליטיקס מתקדם", courseId: "course-4", businessSlug: "digital-marketing-academy",
    date: "15 פבר׳ 2026", purchaseDate: "2025-11-10", verified: true, anonymous: false
  },
  {
    id: "rev-5", reviewerName: "דוד כ.", rating: 5,
    text: "הקורס שינה לי את הקריירה. עברתי מ-QA לפיתוח Full-Stack תוך 4 חודשים. התמיכה של הצוות פנומנלית.",
    courseName: "בוטקמפ Full-Stack", courseId: "course-5", businessSlug: "code-masters-il",
    date: "22 פבר׳ 2026", purchaseDate: "2025-04-01", verified: true, anonymous: false,
    ownerResponse: { text: "מדהים דוד! סיפורי ההצלחה שלכם מניעים אותנו.", date: "23 פבר׳ 2026" }
  },
  {
    id: "rev-6", reviewerName: "נועה מ.", rating: 5,
    text: "הקורס הכי מעשי שלקחתי. יצאתי עם פורטפוליו מוכן ו-3 הצעות עבודה.",
    courseName: "יסודות עיצוב UI/UX", courseId: "course-7", businessSlug: "design-school-tlv",
    date: "18 פבר׳ 2026", purchaseDate: "2025-05-10", verified: true, anonymous: false
  },
  {
    id: "rev-7", reviewerName: "אבי ש.", rating: 4,
    text: "תוכן מצוין ומרצה מעולה. הייתי רוצה יותר תרגילים מעשיים עם דאטה אמיתי.",
    courseName: "Python למדעי נתונים", courseId: "course-8", businessSlug: "data-science-hub",
    date: "10 פבר׳ 2026", purchaseDate: "2025-08-15", verified: true, anonymous: false
  },
  {
    id: "rev-8", reviewerName: "אנונימי", rating: 2,
    text: "הקורס בסיסי מדי למי שיש לו ניסיון. לא הוסיף לי ערך משמעותי.",
    courseName: "הרצאת Growth Hacking", courseId: "course-10", businessSlug: "growth-academy",
    date: "5 פבר׳ 2026", purchaseDate: "2025-12-01", verified: true, anonymous: true,
    flagged: true, flagReason: "תוכן קצר מדי - ייתכן שאינו ביקורת אמיתית"
  },
  {
    id: "rev-9", reviewerName: "ליאור ב.", rating: 5,
    text: "למידת מכונה מתקדמת הייתה בדיוק מה שחיפשתי. הפרויקטים עם TensorFlow היו מאתגרים ומעשירים.",
    courseName: "למידת מכונה מתקדמת", courseId: "course-9", businessSlug: "data-science-hub",
    date: "1 פבר׳ 2026", purchaseDate: "2025-03-20", verified: true, anonymous: false,
    updatedAt: "15 פבר׳ 2026"
  },
  {
    id: "rev-10", reviewerName: "מיכל ג.", rating: 4,
    text: "קורס React מעולה. ה-Hooks וה-Context API הוסברו בצורה מצוינת. חסר קצת על Next.js.",
    courseName: "React מתקדם", courseId: "course-6", businessSlug: "code-masters-il",
    date: "28 ינו׳ 2026", purchaseDate: "2025-07-01", verified: true, anonymous: false
  },
  // ── Freelancer Reviews ──
  {
    id: "rev-11", reviewerName: "רון ת.", rating: 5,
    text: "מאיה ניהלה לנו את הרשתות החברתיות במשך 6 חודשים. התוצאות היו מדהימות — עלייה של 300% בעוקבים ועלייה של 150% במכירות דרך אינסטגרם.",
    courseName: "ניהול סושיאל", courseId: "freelancer-maya", businessSlug: "maya-social",
    date: "5 מרץ 2026", purchaseDate: "2025-09-01", verified: true, anonymous: false,
    ownerResponse: { text: "תודה רון! שמחתי מאוד לעבוד עם הצוות שלכם. תמיד כאן!", date: "6 מרץ 2026" }
  },
  {
    id: "rev-12", reviewerName: "הילה ק.", rating: 5,
    text: "אורן עיצב לנו אתר חדש וזה פשוט מושלם. הקשבה מלאה לצרכים, עיצוב מודרני ומקצועי, וחוויית משתמש מצוינת. ממליצה בחום!",
    courseName: "עיצוב אתר", courseId: "freelancer-oren", businessSlug: "oren-webdesign",
    date: "2 מרץ 2026", purchaseDate: "2025-10-15", verified: true, anonymous: false
  },
  {
    id: "rev-13", reviewerName: "עמית ד.", rating: 4,
    text: "נועה ערכה לנו סרטון תדמית מקצועי ביותר. העבודה הייתה מהירה ואיכותית. הייתי שמח לעוד רביזיה אחת בלי תוספת תשלום.",
    courseName: "עריכת וידאו", courseId: "freelancer-noa", businessSlug: "noa-video",
    date: "28 פבר׳ 2026", purchaseDate: "2025-11-20", verified: true, anonymous: false
  },
  {
    id: "rev-14", reviewerName: "שני פ.", rating: 5,
    text: "יוני כתב לנו טקסטים לדף נחיתה והמרות קפצו ב-40%! מקצוען אמיתי שמבין שיווק ופסיכולוגיית מכירות.",
    courseName: "קופירייטינג", courseId: "freelancer-yoni", businessSlug: "yoni-copywriting",
    date: "25 פבר׳ 2026", purchaseDate: "2025-08-05", verified: true, anonymous: false
  },
  // ── Professional Reviews ──
  {
    id: "rev-15", reviewerName: "דני מ.", rating: 5,
    text: "רינה ניהלה לי את התיק נוסטרו כבר 3 שנים. מקצועיות ברמה הכי גבוהה, חוסכת לי אלפי שקלים בשנה.",
    courseName: "ייעוץ חשבונאי", courseId: "freelancer-rina", businessSlug: "rina-cpa-nostro",
    date: "3 מרץ 2026", purchaseDate: "2023-01-15", verified: true, anonymous: false
  },
  {
    id: "rev-16", reviewerName: "תמר א.", rating: 5,
    text: "עו״ד עמית ליווה אותנו ברכישת דירה. מקצועי, זמין ומדויק. חסך לנו כאבי ראש רבים.",
    courseName: "ליווי עסקת נדל״ן", courseId: "freelancer-amit", businessSlug: "amit-law-realestate",
    date: "1 מרץ 2026", purchaseDate: "2025-08-01", verified: true, anonymous: false
  },
  {
    id: "rev-17", reviewerName: "יואב ש.", rating: 5,
    text: "אורי חסך לנו 180,000 ₪ על המשכנתא! מקצוען אמיתי שמבין לעומק את השוק ויודע לנהל מו״מ מול הבנקים.",
    courseName: "ייעוץ משכנתא", courseId: "freelancer-ori", businessSlug: "ori-mortgage-first",
    date: "27 פבר׳ 2026", purchaseDate: "2025-06-01", verified: true, anonymous: false,
    ownerResponse: { text: "תודה יואב! שמח שהצלחנו לחסוך לכם סכום כזה משמעותי. בהצלחה בדירה החדשה!", date: "28 פבר׳ 2026" }
  },
];

// ─── Affiliate Clicks (Mock) ─────────────────────────
export const AFFILIATE_CLICKS: AffiliateClick[] = [
  { courseId: "course-1", date: "2026-02-28", converted: true, revenue: 249 },
  { courseId: "course-1", date: "2026-02-27", converted: false },
  { courseId: "course-5", date: "2026-02-26", converted: true, revenue: 1490 },
  { courseId: "course-7", date: "2026-02-25", converted: true, revenue: 399 },
  { courseId: "course-8", date: "2026-02-24", converted: false },
  { courseId: "course-1", date: "2026-02-23", converted: true, revenue: 249 },
  { courseId: "course-9", date: "2026-02-22", converted: false },
  { courseId: "course-5", date: "2026-02-21", converted: true, revenue: 1490 },
];

// ─── Helpers ─────────────────────────────────────────
export function getTimeSincePurchase(purchaseDate: string): string {
  const now = new Date("2026-03-07");
  const purchase = new Date(purchaseDate);
  const months = Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return "נרכש לאחרונה";
  if (months === 1) return "נרכש לפני חודש";
  if (months < 12) return `נרכש לפני ${months} חודשים`;
  const years = Math.floor(months / 12);
  return years === 1 ? "נרכש לפני שנה" : `נרכש לפני ${years} שנים`;
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return BUSINESSES.find(b => b.slug === slug);
}

export function getCoursesByBusiness(slug: string): Course[] {
  return COURSES.filter(c => c.businessSlug === slug);
}

export function getReviewsByBusiness(slug: string): Review[] {
  return REVIEWS.filter(r => r.businessSlug === slug);
}

export function getReviewsByCourse(courseId: string): Review[] {
  return REVIEWS.filter(r => r.courseId === courseId);
}

export function getCourseById(id: string): Course | undefined {
  return COURSES.find(c => c.id === id);
}

export function getFreelancers(): Business[] {
  return BUSINESSES.filter(b => b.type === "freelancer");
}

export function getCourseProviders(): Business[] {
  return BUSINESSES.filter(b => b.type === "course-provider");
}

export function generateReviewSummary(reviews: Review[]): string {
  if (reviews.length === 0) return "";
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const positiveKeywords: string[] = [];
  const allText = reviews.map(r => r.text).join(" ");
  if (allText.includes("מעשי") || allText.includes("תרגיל")) positiveKeywords.push("תרגילים מעשיים");
  if (allText.includes("מרצה") || allText.includes("מקצועי")) positiveKeywords.push("מרצים מקצועיים");
  if (allText.includes("עבודה") || allText.includes("קריירה")) positiveKeywords.push("הכנה לשוק העבודה");
  if (allText.includes("תמיכה") || allText.includes("חניכה")) positiveKeywords.push("תמיכה אישית");
  if (allText.includes("עדכני") || allText.includes("רלוונטי")) positiveKeywords.push("תוכן עדכני");

  const praise = positiveKeywords.length > 0
    ? `סטודנטים מדגישים: ${positiveKeywords.join(", ")}.`
    : "הביקורות חיוביות באופן כללי.";

  return `📊 **סיכום AI** | דירוג ממוצע: ${avgRating.toFixed(1)} ⭐ מתוך ${reviews.length} ביקורות.\n\n${praise}`;
}
