// Centralized types, categories, and utilities for ReviewHub
// All fake data has been removed — data comes from the database.

export type BusinessType = "freelancer" | "course-provider";

export interface Course {
  id: string;
  businessSlug: string;
  name: string;
  price: number;
  description: string;
  affiliateUrl: string;
  category: string;
  courseType?: string;
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
  userId?: string; // נוסף לסנכרון מול ה-View
  updatedAt?: string;
  flagged?: boolean;
  flagReason?: string;
  isEarlyBird?: boolean;
  isExpert?: boolean;
  likeCount?: number;
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
  "מנהל סושיאל": ["מנהל סושיאל לעסקים קטנים", "מנהל סושיאל למותגי אופנה", "מנהל סושיאל למסעדות ופוד", "מנהל סושיאל ל-E-commerce", "מנהל סושיאל לסטארטאפים"],
  "יועץ עסקי": ["יועץ עסקי לסטארטאפים", "יועץ עסקי לעסקים קטנים ובינוניים", "יועץ עסקי למסחר אלקטרוני", "יועץ עסקי לגיוס משקיעים", "יועץ עסקי לאסטרטגיית צמיחה"],
  "יועץ משכנתאות": ["יועץ משכנתאות לרוכשי דירה ראשונה", "יועץ משכנתאות למחזרי משכנתא", "יועץ משכנתאות למשקיעי נדל״ן", "יועץ משכנתאות לזוגות צעירים", "יועץ משכנתאות לתושבים חוזרים"],
  "רואה חשבון": ["רואה חשבון מתמחה בתיקי נוסטרו", "רואה חשבון שמבין בשוק ההון", "רואה חשבון שמבין בנדל״ן", "רואה חשבון שמבין בעוסק פפור", "רואה חשבון שעובד רק עם חברות בע״מ"],
  "עורך דין": ["עורך דין מקרקעין ונדל״ן", "עורך דין דיני עבודה", "עורך דין מסחרי וחוזים", "עורך דין היי-טק וקניין רוחני", "עורך דין משפחה וגירושין"],
  "שיווק וסושיאל": ["שיווק ברשתות חברתיות", "שיווק משפיענים", "שיווק תוכן", "שיווק באמצעות וידאו", "שיווק לעסקים מקומיים"],
  "עיצוב אתרים": ["עיצוב דפי נחיתה", "עיצוב אתרי מסחר", "עיצוב אתרי תדמית", "עיצוב UI/UX למובייל", "עיצוב מערכות SaaS"],
  "עריכת וידאו": ["עריכת וידאו לרשתות חברתיות", "עריכת סרטוני תדמית", "עריכת וידאו ל-YouTube", "עריכת סרטוני מוצר", "אנימציה ומושן גרפיקס"],
  "כתיבה שיווקית": ["כתיבת דפי נחיתה", "כתיבת מודעות ממומנות", "כתיבת תוכן לבלוגים", "כתיבת סקריפטים לוידאו", "כתיבת ניוזלטרים"],
  "קידום אורגני (SEO)": ["SEO טכני", "SEO מקומי (Local SEO)", "SEO לאתרי מסחר", "בניית קישורים (Link Building)", "אסטרטגיית תוכן ל-SEO"],
  "פיתוח אתרים": ["פיתוח React / Next.js", "פיתוח WordPress", "פיתוח Shopify", "פיתוח Full-Stack", "פיתוח אפליקציות ווב"],
  "עיצוב גרפי": ["עיצוב לוגו ומיתוג", "עיצוב חומרי שיווק", "עיצוב אריזות", "עיצוב לדפוס", "עיצוב לדיגיטל"],
  "צילום מקצועי": ["צילום מוצרים", "צילום תדמית", "צילום אירועים עסקיים", "צילום אוכל", "צילום ראשי צוות"],
  "ניהול קמפיינים": ["קמפיינים ב-Google Ads", "קמפיינים ב-Facebook / Instagram", "קמפיינים ב-LinkedIn", "קמפיינים ב-TikTok", "קמפיינים רב-ערוציים"],
  "אסטרטגיה דיגיטלית": ["אסטרטגיית צמיחה דיגיטלית", "אסטרטגיית תוכן", "אסטרטגיית משפכי מכירות", "אסטרטגיה למסחר אלקטרוני", "אסטרטגיה לסטארטאפים"],
  "מאמן ספורט": ["מאמן חדר כושר", "מאמן פילאטיס מכשירים", "מאמן כושר קרבי", "מאמן קרוספיט", "מאמן ריצה", "אחר"],
};

// ─── Course Types ───────────────────────────────────────
export const COURSE_TYPES = ["קורס", "סדנה", "הרצאה", "לימודים", "תעודת הכשרה", "בוטקמפ", "מנטורינג", "הכשרה מקצועית"];

// ─── Course Provider Categories ─────────────────────────
export const COURSE_CATEGORIES = ["שיווק דיגיטלי", "תכנות ופיתוח", "עיצוב UI/UX", "מדעי נתונים", "עסקים ויזמות", "צילום ווידאו"];

// ─── Empty arrays (data now comes from DB) ──────────────
export const BUSINESSES: Business[] = [];
export const COURSES: Course[] = [];
export const REVIEWS: Review[] = [];
export const AFFILIATE_CLICKS: AffiliateClick[] = [];

// ─── Helpers ─────────────────────────────────────────
export function getTimeSincePurchase(purchaseDate: string): string {
  if (!purchaseDate) return "";
  const now = new Date();
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
