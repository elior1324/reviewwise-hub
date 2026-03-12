import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";

// ---------------------------------------------------------------------------
// 1. TypeScript Interfaces
// ---------------------------------------------------------------------------

export type BillingCycle = "monthly" | "annually";

export interface PricingFeature {
  name: string;
  isIncluded: boolean;
  tooltip?: string;
}

export interface PricingTier {
  id: string;
  /** Short English identifier — used for aria-labels */
  name: string;
  /** Hebrew display name shown in the card */
  nameHe: string;
  description: string;
  /** Monthly price in ILS (integer, e.g. 189) — use 0 for free plans */
  priceMonthly: number;
  /** Annual lump-sum price in ILS */
  priceAnnually: number;
  isPopular: boolean;
  buttonLabel: string;
  features: PricingFeature[];
}

export interface PricingComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Exactly 3 tiers for the 3-column layout */
  plans: [PricingTier, PricingTier, PricingTier];
  billingCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  /** Called when the user clicks a plan CTA button */
  onPlanSelect: (planId: string, cycle: BillingCycle) => void;
  /** Section heading — defaults to Hebrew */
  heading?: string;
  /** Section sub-heading — defaults to Hebrew */
  subheading?: string;
}

// ---------------------------------------------------------------------------
// 2. Utility components
// ---------------------------------------------------------------------------

const FeatureItem: React.FC<{ feature: PricingFeature }> = ({ feature }) => {
  const Icon = feature.isIncluded ? Check : X;
  const iconColor = feature.isIncluded
    ? "text-primary"
    : "text-muted-foreground";
  return (
    <li className="flex items-start gap-3 py-2">
      <Icon
        className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-sm",
          feature.isIncluded ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {feature.name}
      </span>
    </li>
  );
};

// ---------------------------------------------------------------------------
// 3. Main component
// ---------------------------------------------------------------------------

export const PricingComponent: React.FC<PricingComponentProps> = ({
  plans,
  billingCycle,
  onCycleChange,
  onPlanSelect,
  heading = "בחרו את התוכנית המתאימה לעסק שלכם",
  subheading = "מביקורות ראשונות ועד אוטומציה מלאה — יש לנו תוכנית שמתאימה בדיוק לשלב שבו העסק שלכם נמצא.",
  className,
  ...props
}) => {
  const ANNUAL_DISCOUNT_PCT = 20;

  // ── Billing cycle toggle ──────────────────────────────────────────────────
  const CycleToggle = (
    <div className="flex justify-center mb-10 mt-2" dir="rtl">
      <ToggleGroup
        type="single"
        value={billingCycle}
        onValueChange={(value) => {
          if (value === "monthly" || value === "annually") {
            onCycleChange(value);
          }
        }}
        aria-label="בחרו מחזור חיוב"
        className="border rounded-lg p-1 bg-muted/50"
      >
        <ToggleGroupItem
          value="monthly"
          aria-label="חיוב חודשי"
          className="px-6 py-1.5 text-sm font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:ring-1 data-[state=on]:ring-ring/20 rounded-md transition-colors"
        >
          חודשי
        </ToggleGroupItem>
        <ToggleGroupItem
          value="annually"
          aria-label="חיוב שנתי"
          className="px-6 py-1.5 text-sm font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:border data-[state=on]:ring-1 data-[state=on]:ring-ring/20 rounded-md transition-colors relative"
        >
          שנתי
          <span className="absolute -top-3 left-0 text-xs font-semibold text-primary/80 bg-primary/10 px-1.5 rounded-full whitespace-nowrap">
            חסכו {ANNUAL_DISCOUNT_PCT}%
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  // ── Pricing cards ─────────────────────────────────────────────────────────
  const PricingCards = (
    <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
      {plans.map((plan) => {
        const currentPrice =
          billingCycle === "monthly" ? plan.priceMonthly : plan.priceAnnually;
        const isFree = plan.priceMonthly === 0;
        const priceSuffix =
          billingCycle === "monthly" ? "/ חודש" : "/ שנה";

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col transition-all duration-300 shadow-md hover:shadow-lg",
              plan.isPopular &&
                "ring-2 ring-primary shadow-xl shadow-primary/20 md:scale-[1.02] hover:scale-[1.04]"
            )}
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold">
                  {plan.nameHe}
                </CardTitle>
                {plan.isPopular && (
                  <span className="text-xs font-semibold px-3 py-1 bg-primary text-primary-foreground rounded-full whitespace-nowrap">
                    הפופולרי ביותר
                  </span>
                )}
              </div>
              <CardDescription className="text-sm mt-1">
                {plan.description}
              </CardDescription>

              {/* Price display */}
              <div className="mt-4">
                {isFree ? (
                  <p className="text-4xl font-extrabold text-foreground">
                    חינם
                  </p>
                ) : (
                  <>
                    <p className="text-4xl font-extrabold text-foreground">
                      ₪{currentPrice.toLocaleString("he-IL")}
                      <span className="text-base font-normal text-muted-foreground me-1">
                        {" "}
                        {priceSuffix}
                      </span>
                    </p>
                    {billingCycle === "annually" && (
                      <p className="text-xs text-muted-foreground line-through opacity-70 mt-1">
                        ₪{plan.priceMonthly.toLocaleString("he-IL")} / חודש
                      </p>
                    )}
                    {billingCycle === "annually" && (
                      <p className="text-xs text-primary font-medium mt-0.5">
                        חיוב שנתי — חסכו{" "}
                        ₪
                        {(
                          plan.priceMonthly * 12 -
                          plan.priceAnnually
                        ).toLocaleString("he-IL")}{" "}
                        בשנה
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-grow p-6 pt-0">
              <h4 className="text-sm font-semibold mb-2 mt-4 text-foreground/80">
                תכונות עיקריות:
              </h4>
              <ul className="list-none space-y-0">
                {plan.features.slice(0, 6).map((feature) => (
                  <FeatureItem key={feature.name} feature={feature} />
                ))}
                {plan.features.length > 6 && (
                  <li className="text-sm text-muted-foreground mt-2">
                    + {plan.features.length - 6} תכונות נוספות
                  </li>
                )}
              </ul>
            </CardContent>

            <CardFooter className="p-6 pt-0">
              <Button
                onClick={() => onPlanSelect(plan.id, billingCycle)}
                className={cn(
                  "w-full transition-all duration-200",
                  plan.isPopular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted text-foreground hover:bg-muted/80 border border-input"
                )}
                size="lg"
                aria-label={`בחרו בתוכנית ${plan.nameHe}`}
              >
                {plan.buttonLabel}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );

  // ── Feature comparison table (desktop/tablet only) ─────────────────────────
  const allFeatureNames = Array.from(
    new Set(plans.flatMap((p) => p.features.map((f) => f.name)))
  );

  const ComparisonTable = (
    <div className="mt-16 hidden md:block border rounded-lg overflow-x-auto shadow-sm">
      <table
        className="min-w-full divide-y divide-border/80"
        dir="rtl"
      >
        <thead>
          <tr className="bg-muted/30">
            <th
              scope="col"
              className="px-6 py-4 text-right text-sm font-semibold text-foreground/80 w-[220px] whitespace-nowrap"
            >
              תכונה
            </th>
            {plans.map((plan) => (
              <th
                key={`th-${plan.id}`}
                scope="col"
                className={cn(
                  "px-6 py-4 text-center text-sm font-semibold text-foreground/80 whitespace-nowrap",
                  plan.isPopular && "bg-primary/10"
                )}
              >
                {plan.nameHe}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80 bg-background/90">
          {allFeatureNames.map((featureName, index) => (
            <tr
              key={featureName}
              className={cn(
                "transition-colors hover:bg-accent/20",
                index % 2 === 0 ? "bg-background" : "bg-muted/10"
              )}
            >
              <td className="px-6 py-3 text-right text-sm font-medium text-foreground/90 whitespace-nowrap">
                {featureName}
              </td>
              {plans.map((plan) => {
                const feature = plan.features.find(
                  (f) => f.name === featureName
                );
                const isIncluded = feature?.isIncluded ?? false;
                const Icon = isIncluded ? Check : X;
                const iconColor = isIncluded
                  ? "text-primary"
                  : "text-muted-foreground/70";
                return (
                  <td
                    key={`${plan.id}-${featureName}`}
                    className={cn(
                      "px-6 py-3 text-center",
                      plan.isPopular && "bg-primary/5"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5 mx-auto", iconColor)}
                      aria-hidden="true"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Final render ──────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "w-full py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        className
      )}
      dir="rtl"
      {...props}
    >
      <header className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          {subheading}
        </p>
      </header>

      {CycleToggle}

      <section aria-labelledby="pricing-plans-heading">
        <h3 id="pricing-plans-heading" className="sr-only">
          תוכניות מחיר
        </h3>
        {PricingCards}
      </section>

      <section aria-label="השוואת תכונות מפורטת" className="mt-16">
        <h3 className="text-2xl font-bold mb-6 hidden md:block text-center text-foreground">
          השוואת תכונות מפורטת
        </h3>
        {ComparisonTable}
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. ReviewHub plan data
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Feature name constants — must be identical across all plans so the
// comparison table `find()` can match them correctly.
// ---------------------------------------------------------------------------
const F = {
  limit10:      "עד 10 ביקורות בחודש",       // ✓ Starter only → ✗ others (no limit)
  profile:      "פרופיל עסקי בסיסי",
  reply:        "תגובה ידנית לביקורות",
  badge:        "תג אמינות בסיסי",
  unlimited:    "ביקורות ללא הגבלה",
  autoRequests: "בקשות ביקורת אוטומטיות",
  widget:       "ווידג'ט ביקורות להטמעה באתר",
  analytics:    "דאשבורד אנליטיקס בזמן אמת",
  social:       "רשתות חברתיות בפרופיל",
  affiliate:    "מערכת אפיליאט",
  aiWeekly:     "סיכומי AI שבועיים",
  support4h:    "תמיכה בעדיפות גבוהה תוך 4 שעות",
  aiDaily:      "דוחות AI יומיים מותאמים אישית",
  crm:          "חיבור CRM — HubSpot, Salesforce, Monday",
  webhooks:     "Webhooks — Zapier, Make, n8n",
  api:          "גישת API מלאה",
  csm:          "מנהל הצלחה אישי ייעודי",
  multiBiz:     "ניהול מספר עסקים ללא הגבלה",
  googleAds:    "כוכבי ביקורות ב-Google Ads ⭐",
} as const;

export const REVIEWHUB_PLANS: [PricingTier, PricingTier, PricingTier] = [
  // ── STARTER — Loss aversion: first 6 features show 4 ✓ then 2 ✗ gaps ────
  {
    id: "free",
    name: "Starter",
    nameHe: "בסיסי",
    // Loss aversion framing: "limited" not "perfect start"
    description: "לעסקים שמתחילים לאסוף הוכחה חברתית — אבל מוגבל.",
    priceMonthly: 0,
    priceAnnually: 0,
    isPopular: false,
    buttonLabel: "התחילו בחינם",   // low-commitment CTA
    features: [
      // ── Card display (first 6) ──
      { name: F.limit10,      isIncluded: true  }, // specificity: "10", not "limited"
      { name: F.profile,      isIncluded: true  },
      { name: F.reply,        isIncluded: true  },
      { name: F.badge,        isIncluded: true  },
      { name: F.unlimited,    isIncluded: false }, // loss aversion ✗
      { name: F.autoRequests, isIncluded: false }, // loss aversion ✗
      // ── Comparison table only (hidden in card) ──
      { name: F.widget,       isIncluded: false },
      { name: F.analytics,    isIncluded: false },
      { name: F.social,       isIncluded: false },
      { name: F.affiliate,    isIncluded: false },
      { name: F.aiWeekly,     isIncluded: false },
      { name: F.support4h,    isIncluded: false },
      { name: F.aiDaily,      isIncluded: false },
      { name: F.crm,          isIncluded: false },
      { name: F.webhooks,     isIncluded: false },
      { name: F.api,          isIncluded: false },
      { name: F.csm,          isIncluded: false },
      { name: F.multiBiz,     isIncluded: false },
      { name: F.googleAds,    isIncluded: false },
    ],
  },

  // ── PRO — Decoy effect: obvious best value, social proof badge ───────────
  {
    id: "pro",
    name: "Business Growth",
    nameHe: "צמיחה עסקית",
    // Future pacing + social proof: reader visualises automated growth
    description: "הכל כדי להפוך ביקורות למנוע צמיחה אמיתי. הנבחר ע״י מאות עסקים.",
    priceMonthly: 189,
    priceAnnually: 1814, // ≈ ₪151/month after 20% discount
    isPopular: true,     // anchors "most popular" badge → decoy effect
    buttonLabel: "התחילו לצמוח היום",  // urgency + action
    features: [
      // ── Card display (first 6) — all ✓, benefit-ordered ──
      { name: F.unlimited,    isIncluded: true  },
      { name: F.autoRequests, isIncluded: true  },
      { name: F.widget,       isIncluded: true  },
      { name: F.analytics,    isIncluded: true  },
      { name: F.affiliate,    isIncluded: true  },
      { name: F.support4h,    isIncluded: true  },
      // ── Also included (shown as "+ N more features") ──
      { name: F.profile,      isIncluded: true  },
      { name: F.reply,        isIncluded: true  },
      { name: F.badge,        isIncluded: true  },
      { name: F.social,       isIncluded: true  },
      { name: F.aiWeekly,     isIncluded: true  },
      // ── Comparison table: Pro doesn't have the 10-review cap ──
      { name: F.limit10,      isIncluded: false }, // ✗ = no restriction — good!
      // ── Enterprise-only (shown as ✗ in comparison table) ──
      { name: F.aiDaily,      isIncluded: false },
      { name: F.crm,          isIncluded: false },
      { name: F.webhooks,     isIncluded: false },
      { name: F.api,          isIncluded: false },
      { name: F.csm,          isIncluded: false },
      { name: F.multiBiz,     isIncluded: false },
      { name: F.googleAds,    isIncluded: false },
    ],
  },

  // ── ENTERPRISE — Anchoring: highest price seen first sets reference point ───
  {
    id: "enterprise",
    name: "Enterprise",
    nameHe: "ארגוני ואוטומציה",
    // NLP future pacing: "שליטה מלאה" triggers control-oriented identity
    description: "השליטה המלאה — AI, אוטומציות ו-CRM לעסקים שרוצים לשלוט בכל פרט.",
    priceMonthly: 479,
    priceAnnually: 4598, // ≈ ₪383/month after 20% discount
    isPopular: false,
    buttonLabel: "קחו שליטה מלאה",  // identity-based CTA
    features: [
      // ── Card display (first 6) — enterprise differentiators first ──
      { name: F.aiDaily,      isIncluded: true  },
      { name: F.crm,          isIncluded: true  },
      { name: F.webhooks,     isIncluded: true  },
      { name: F.multiBiz,     isIncluded: true  },
      { name: F.googleAds,    isIncluded: true  },
      { name: F.csm,          isIncluded: true  },
      // ── Everything from Pro (shown as "+ N more features") ──
      { name: F.unlimited,    isIncluded: true  },
      { name: F.autoRequests, isIncluded: true  },
      { name: F.widget,       isIncluded: true  },
      { name: F.analytics,    isIncluded: true  },
      { name: F.affiliate,    isIncluded: true  },
      { name: F.support4h,    isIncluded: true  },
      { name: F.profile,      isIncluded: true  },
      { name: F.reply,        isIncluded: true  },
      { name: F.badge,        isIncluded: true  },
      { name: F.social,       isIncluded: true  },
      { name: F.aiWeekly,     isIncluded: true  },
      { name: F.api,          isIncluded: true  },
      // ── No 10-review limit ──
      { name: F.limit10,      isIncluded: false },
    ],
  },
];

export default PricingComponent;
