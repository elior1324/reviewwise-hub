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
  shortDescription?: string;
  url?: string;
  affiliateUrl: string;
  affiliatePercentage?: number | null;
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
  /** All categories (comma-separated in DB, parsed to array) */
  categories?: string[];
  subcategory?: string;
  rating: number;
  reviewCount: number;
  /** Count of purchase-verified (Tier-1) reviews only — feeds TrustScore */
  verifiedReviewCount?: number;
  description: string;
  logo?: string;
  coverUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: SocialLinks;
  /** SaaS / digital-product fields */
  pricingModel?: PricingModel;
  founderName?: string;
  /** Ratio of verified reviews — 0–1 NUMERIC(5,4) from DB trigger */
  verifiedRatio?: number;
  /** Trust tier computed from verifiedRatio + verifiedReviewCount */
  trustTier?: "elite" | "highly_trusted" | "trusted" | "emerging" | "unrated";
  /** ISO timestamp — when the business joined the platform */
  createdAt?: string;
  /** Meeting/delivery format */
  deliveryFormat?: "digital" | "frontal" | "hybrid";
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
  // ── Trust platform fields ───────────────────────────────────────────
  /** How the review was verified (drives provenance badge) */
  reviewSource?: "verified_purchase" | "crm_verified" | "email_verified" | "community";
  /** Review type — determines TrustScore weight */
  reviewType?: ReviewType;
  /** Active moderation case status, if any */
  activeCaseStatus?: string | null;
  /** Whether the spam filter has flagged this review */
  isSpamFlagged?: boolean;
}

/** Review type — determines TrustScore weight */
export type ReviewType = "verified_purchase" | "community";

/** Discovery feed identifiers */
export type DiscoveryFeedType =
  | "trending"
  | "rising"
  | "editor_picks"
  | "recently_verified"
  | "fast_growing_creators";

/** v2.0 TrustScore component breakdown */
export interface TrustScoreV2 {
  courseId: string;
  score: number;                      // 0–100
  tier: "elite" | "highly_trusted" | "trusted" | "emerging" | "unrated";
  qualityScore: number;               // max 20
  volumeScore: number;                // max 25 (log-weighted)
  recencyScore: number;               // max 25 (decay-weighted last 90d)
  consistencyScore: number;           // max 30
  verifiedRatioMultiplier: number;    // 0.5–1.0
  fraudPenaltyMultiplier: number;     // 0.0–1.0
  lastCalculatedAt: string;
}

/** Labels for trust tiers */
export const TRUST_TIER_LABELS: Record<string, string> = {
  elite:          "Elite",
  highly_trusted: "Highly Trusted",
  trusted:        "Trusted",
  emerging:       "Emerging",
  unrated:        "Unrated",
};

/** Weight per review type for display purposes */
export const REVIEW_TYPE_WEIGHTS: Record<ReviewType, number> = {
  verified_purchase: 1.0,
  community:         0.4,
};

export interface AffiliateClick {
  courseId: string;
  date: string;
  converted: boolean;
  revenue?: number;
}

/**
 * 5/5 Affiliate Trust Model — transaction record.
 * Displayed in the creator's Verified Sales dashboard.
 */
export interface AffiliateTransaction {
  id: string;
  courseId: string;
  courseName: string;
  transactionId: string;
  buyerEmail?: string;       // hashed for privacy in display
  listPrice: number;         // original market price
  learnerDiscount: number;   // 5% of listPrice
  platformFee: number;       // 5% of listPrice (ReviewHub revenue)
  verifiedPrice: number;     // listPrice - learnerDiscount (what buyer paid)
  creatorNet: number;        // verifiedPrice - platformFee (creator receives)
  paidAt: string;            // ISO timestamp
  verifiedAt?: string;       // when purchase was verified by ReviewHub
  reviewSubmitted: boolean;  // whether a verified review followed
}

/**
 * Webhook payload shape received from creator payment systems.
 * Documented in the API spec for creator integrations.
 */
export interface PurchaseWebhookPayload {
  event:         "purchase_completed";
  course_id:     string;
  creator_id:    string;
  buyer_email:   string;
  list_price:    number;
  paid_price:    number;
  transaction_id: string;
}

/** 5/5 model rate constants — exported for display/calculation in UI */
export const VERIFIED_DEAL = {
  LEARNER_DISCOUNT_PCT:   5,      // % instant discount for learner
  PLATFORM_FEE_PCT:       5,      // % operational fee for ReviewHub
  TOTAL_TRUST_CHARGE_PCT: 10,     // total from list price
  COUPON_CODE:            "RH5",
  REF_PARAM:              "reviewhub",
  COOKIE_DAYS:            30,
} as const;

// ─── Digital Professional Categories ────────────────────
// Professionals who operate in the digital economy.
// Must NOT overlap with SAAS_CATEGORIES (used for type detection).
export const FREELANCER_CATEGORIES = [
  "מנהלי סושיאל",
  "עורכי וידאו",
  "יוצרי תוכן",
  "מעצבים גרפיים",
  "מעצבי UI/UX",
  "מעצבי אתרים",
  "מפתחי אתרים",
  "יועצי שיווק",
  "מומחי SEO",
  "כותבים שיווקיים",
  "מומחי אוטומציה",
  "יועצי AI",
  "אסטרטגים דיגיטליים",
  "מפתחי No-Code",
  "מפתחי אפליקציות",
  "בוני משפכי מכירה",
  "מומחי פרסום ממומן",
  "קאוצ׳רים ומאמנים",
  "סוכני טיסות לחו״ל",
  "מאמני כושר",
  "תזונאים ודיאטנים",
  "סטייליסטים",
  "צלמי אופנה",
];

// ─── Digital Education Categories ───────────────────────
// Online courses, mentorship, workshops — focused on the digital economy.
export const COURSE_CATEGORIES = [
  "שיווק דיגיטלי",
  "פיתוח תוכנה",
  "AI ומידע",
  "עיצוב UI/UX",
  "יזמות עסקית",
  "פרילנסינג ועצמאות",
  "פיננסים ו-Fintech",
  "צילום ווידאו דיגיטלי",
  "כתיבה ותוכן",
  "מכירות ו-Growth",
];

// ─── Course Format Filter ────────────────────────────────
export const COURSE_FORMATS = [
  "הכל",
  "דיגיטלי / אונליין",
  "פרונטלי",
  "היברידי",
] as const;
export type CourseFormat = typeof COURSE_FORMATS[number];

// ─── Delivery Format (meeting type) ─────────────────────
export const DELIVERY_FORMATS = ["הכל", "דיגיטלי", "פרונטלי", "היברידי"] as const;
export type DeliveryFormat = typeof DELIVERY_FORMATS[number];
export const DELIVERY_FORMAT_DB_MAP: Record<Exclude<DeliveryFormat, "הכל">, string> = {
  "דיגיטלי": "digital",
  "פרונטלי": "frontal",
  "היברידי": "hybrid",
};

// ─── SaaS & Digital Tools Categories ────────────────────
// Must NOT overlap with FREELANCER_CATEGORIES.
export const SAAS_CATEGORIES = [
  "כלי AI",
  "כלי שיווק",
  "אוטומציה",
  "כלי פיתוח",
  "No-code",
  "פרודקטיביטי",
  "תוכנה עסקית",
  "כלי יוצרים",
  "אנליטיקה",
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
  "כלי יוצרים": [
    "עריכת וידאו ותוכן",
    "ניהול ערוצים ופרסום",
    "כלי Podcast",
    "מוניטיזציה לקריאייטורים",
  ],
  "אנליטיקה": [
    "אנליטיקס ו-BI",
    "Product Analytics",
    "Marketing Attribution",
    "Data Visualization",
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
  "מנהלי סושיאל":        "מנהלי הסושיאל",
  "עורכי וידאו":          "עורכי הוידאו",
  "יוצרי תוכן":           "יוצרי התוכן",
  "מעצבים גרפיים":        "המעצבים הגרפיים",
  "מעצבי UI/UX":          "מעצבי ה-UI/UX",
  "מעצבי אתרים":          "מעצבי האתרים",
  "מפתחי אתרים":          "מפתחי האתרים",
  "יועצי שיווק":          "יועצי השיווק",
  "מומחי SEO":            "מומחי ה-SEO",
  "כותבים שיווקיים":      "הכותבים השיווקיים",
  "מומחי אוטומציה":       "מומחי האוטומציה",
  "יועצי AI":             "יועצי ה-AI",
  "אסטרטגים דיגיטליים":  "האסטרטגים הדיגיטליים",
  "מפתחי No-Code":        "מפתחי ה-No-Code",
  "מפתחי אפליקציות":      "מפתחי האפליקציות",
  "בוני משפכי מכירה":     "בוני משפכי המכירה",
  "מומחי פרסום ממומן":    "מומחי הפרסום הממומן",
  "קאוצ׳רים ומאמנים":     "הקאוצ׳רים והמאמנים",
  "סוכני טיסות לחו״ל":    "סוכני הטיסות לחו״ל",
  "מאמני כושר":            "מאמני הכושר",
  "תזונאים ודיאטנים":      "התזונאים והדיאטנים",
  "סטייליסטים":             "הסטייליסטים",
  "צלמי אופנה":             "צלמי האופנה",
};

// ─── Sub-specialties per digital professional category ──
export const FREELANCER_SUBCATEGORIES: Record<string, string[]> = {
  "מנהלי סושיאל": [
    "ניהול סושיאל לעסקים קטנים",
    "ניהול סושיאל למותגים",
    "ניהול סושיאל ל-E-commerce",
    "ניהול סושיאל לסטארטאפים",
  ],
  "מומחי אוטומציה": [
    "אוטומציה עסקית",
    "Make / Zapier / n8n",
    "אוטומציית CRM",
    "AI Agents & Workflows",
  ],
  "יועצי AI": [
    "הטמעת AI בעסקים",
    "בניית AI Agents",
    "אופטימיזציית Prompts",
    "ייעוץ GPT / LLM",
  ],
  "מומחי פרסום ממומן": [
    "Meta Ads",
    "Google Ads",
    "TikTok Ads",
    "LinkedIn Ads",
  ],
  "מפתחי No-Code": [
    "Webflow",
    "Bubble",
    "Glide / Softr",
    "Airtable / AppSheet",
  ],
  "קאוצ׳רים ומאמנים": [
    "קאוצ׳ינג עסקי",
    "קאוצ׳ינג אישי",
    "אימון מכירות",
    "אימון קריירה",
  ],
  "סוכני טיסות לחו״ל": [
    "טיסות עסקיות",
    "חבילות נופש",
    "טיסות שכר",
    "טיסות סדירות",
  ],
  "מאמני כושר": [
    "אימון אישי",
    "אימון קבוצתי",
    "אימון אונליין",
    "שיקום ופיזיותרפיה",
  ],
  "תזונאים ודיאטנים": [
    "תזונה קלינית",
    "תזונת ספורט",
    "דיאטה והרזיה",
    "תזונה טבעונית / צמחונית",
  ],
  "סטייליסטים": [
    "סטיילינג אישי",
    "סטיילינג לאירועים",
    "ייעוץ ארון בגדים",
    "סטיילינג למותגים",
  ],
  "צלמי אופנה": [
    "צילום לוקבוק",
    "צילום קמפיין",
    "צילום תדמית",
    "צילום E-commerce",
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
