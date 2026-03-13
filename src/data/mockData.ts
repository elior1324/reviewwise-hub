// Centralized types, categories, and utilities for ReviewHub
// All fake data has been removed — data comes from the database.

export type BusinessType = "freelancer" | "course-provider" | "saas";

/**
 * Pricing model for SaaS / digital products.
 * Used to render the pricing chip on BusinessCard and BusinessHero.
 */
export type PricingModel = "free" | "freemium" | "subscription" | "one-time" | "enterprise";

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
  /** Count of purchase-verified (Tier-1) reviews only — feeds TrustScore */
  verifiedReviewCount?: number;
  description: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: SocialLinks;
  /** SaaS / digital-product fields */
  pricingModel?: PricingModel;
  founderName?: string;
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
  isEarlyBird?: boolean;
  isExpert?: boolean;
  likeCount?: number;
  userId?: string;           // ← ADDED: mapped from r.user_id in BusinessProfile
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

// ─── Course Categories ──────────────────────────────────
export const COURSE_CATEGORIES = [
  "פיתוח תוכנה",
  "שיווק דיגיטלי",
  "עיצוב UI/UX",
  "דאטה ו-AI",
  "עסקים ויזמות",
  "פיננסים",
  "צילום ווידאו",
  "בריאות וספורט",
  "שפות",
  "מוזיקה ואומנות",
];

// ─── SaaS & AI Tool Categories ──────────────────────────
// Top-level categories for the "SaaS & AI Tools" registry tab.
// These must NOT overlap with FREELANCER_CATEGORIES so the type-detection
// logic in SearchPage / Index can correctly identify "saas" entities.
export const SAAS_CATEGORIES = [
  "כלי AI",
  "כלי שיווק",
  "אוטומציה",
  "כלי פיתוח",
  "No-code",
  "פרודקטיביטי",
  "תוכנה עסקית",
  "כלי סטארטאפ",
];

// Sub-specialties shown when the user picks a SaaS top-level category
export const SAAS_SUBCATEGORIES: Record<string, string[]> = {
  "כלי AI": [
    "AI לכתיבה ותוכן",
    "AI לתמונה ועיצוב",
    "AI לוידאו",
    "AI לקוד",
    "AI לנתונים ו-BI",
    "AI לאוטומציית מכירות",
  ],
  "כלי שיווק": [
    "אוטומציית מיילים",
    "ניתוח נתוני פרסום",
    "כלי SEO",
    "ניהול סושיאל",
    "A/B Testing",
  ],
  "אוטומציה": [
    "אוטומציה עסקית",
    "אוטומציה לפיתוח",
    "Workflow & Integration",
    "RPA",
  ],
  "כלי פיתוח": [
    "IDE & Editors",
    "CI/CD & DevOps",
    "ניטור ולוגים",
    "API & Backend tools",
    "Testing",
  ],
  "No-code": [
    "בוני אתרים",
    "אוטומציה ללא קוד",
    "מסדי נתונים ויזואליים",
    "App builders",
  ],
  "פרודקטיביטי": [
    "ניהול פרויקטים",
    "תקשורת צוות",
    "ניהול זמן ומשימות",
    "כלי פגישות",
  ],
  "תוכנה עסקית": [
    "CRM",
    "פיננסים וחשבונאות",
    "HR ומשאבי אנוש",
    "BI ואנליטיקה",
  ],
  "כלי סטארטאפ": [
    "כלי fundraising",
    "מדדים ומוצר",
    "Pitch & Investor tools",
    "Legal & Compliance",
  ],
};

/** Human-readable pricing model labels for display */
export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  free:         "חינמי לחלוטין",
  freemium:     "Freemium",
  subscription: "מנוי חודשי / שנתי",
  "one-time":   "תשלום חד-פעמי",
  enterprise:   "Enterprise",
};

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
};

// ─── Utility functions ──────────────────────────────────
export function getTimeSincePurchase(purchaseDate: string): string {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const diffMs = now.getTime() - purchase.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "נרכש היום";
  if (diffDays === 1) return "נרכש אתמול";
  if (diffDays < 7) return `נרכש לפני ${diffDays} ימים`;
  if (diffDays < 30) return `נרכש לפני ${Math.floor(diffDays / 7)} שבועות`;
  if (diffDays < 365) return `נרכש לפני ${Math.floor(diffDays / 30)} חודשים`;
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "נרכש לפני שנה" : `נרכש לפני ${years} שנים`;
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return undefined; // data comes from DB
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

// Legacy stubs — kept for backwards compatibility, return empty
export const BUSINESSES: Business[] = [];
export const COURSES: Course[] = [];
export const REVIEWS: Review[] = [];

export function getCoursesByBusiness(slug: string): Course[] { return []; }
export function getReviewsByBusiness(slug: string): Review[] { return []; }
export function getReviewsByCourse(courseId: string): Review[] { return []; }
export function getCourseById(id: string): Course | undefined { return undefined; }
export function getFreelancers(): Business[] { return []; }
export function getCourseProviders(): Business[] { return []; }
