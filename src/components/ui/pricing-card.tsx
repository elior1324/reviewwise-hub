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

export const REVIEWHUB_PLANS: [PricingTier, PricingTier, PricingTier] = [
  {
    id: "free",
    name: "Starter",
    nameHe: "סטארטר",
    description: "התחלה מושלמת לעסקים שרוצים לנהל ביקורות.",
    priceMonthly: 0,
    priceAnnually: 0,
    isPopular: false,
    buttonLabel: "הישארו בסטארטר",
    features: [
      { name: "עד 10 ביקורות בחודש", isIncluded: true },
      { name: "לוח בקרה בסיסי", isIncluded: true },
      { name: "פרופיל עסקי ציבורי", isIncluded: true },
      { name: "תגובה לביקורות", isIncluded: true },
      { name: "תמיכה קהילתית", isIncluded: true },
      { name: "ביקורות ללא הגבלה", isIncluded: false },
      { name: "ווידג'ט ביקורות לאתר", isIncluded: false },
      { name: "בקשות ביקורת אוטומטיות", isIncluded: false },
      { name: "מערכת אפיליאט", isIncluded: false },
      { name: "תמיכה בעדיפות גבוהה", isIncluded: false },
      { name: "דוחות AI", isIncluded: false },
      { name: "אינטגרציית CRM", isIncluded: false },
      { name: "גישת API מלאה", isIncluded: false },
    ],
  },
  {
    id: "pro",
    name: "Business Growth",
    nameHe: "צמיחה עסקית",
    description: "כל מה שצריך כדי לצמוח ולמשוך לקוחות חדשים.",
    priceMonthly: 189,
    priceAnnually: 1814, // ≈ ₪151/month after 20% discount
    isPopular: true,
    buttonLabel: "שדרגו למקצועי",
    features: [
      { name: "עד 10 ביקורות בחודש", isIncluded: true },
      { name: "לוח בקרה בסיסי", isIncluded: true },
      { name: "פרופיל עסקי ציבורי", isIncluded: true },
      { name: "תגובה לביקורות", isIncluded: true },
      { name: "תמיכה קהילתית", isIncluded: true },
      { name: "ביקורות ללא הגבלה", isIncluded: true },
      { name: "ווידג'ט ביקורות לאתר", isIncluded: true },
      { name: "בקשות ביקורת אוטומטיות", isIncluded: true },
      { name: "מערכת אפיליאט", isIncluded: true },
      { name: "תמיכה בעדיפות גבוהה", isIncluded: true },
      { name: "דוחות AI", isIncluded: false },
      { name: "אינטגרציית CRM", isIncluded: false },
      { name: "גישת API מלאה", isIncluded: false },
    ],
  },
  {
    id: "premium",
    name: "Enterprise",
    nameHe: "ארגוני ואוטומציה",
    description: "הפתרון המלא — AI, אוטומציות ו-CRM לארגונים.",
    priceMonthly: 479,
    priceAnnually: 4598, // ≈ ₪383/month after 20% discount
    isPopular: false,
    buttonLabel: "עברו לפרימיום",
    features: [
      { name: "עד 10 ביקורות בחודש", isIncluded: true },
      { name: "לוח בקרה בסיסי", isIncluded: true },
      { name: "פרופיל עסקי ציבורי", isIncluded: true },
      { name: "תגובה לביקורות", isIncluded: true },
      { name: "תמיכה קהילתית", isIncluded: true },
      { name: "ביקורות ללא הגבלה", isIncluded: true },
      { name: "ווידג'ט ביקורות לאתר", isIncluded: true },
      { name: "בקשות ביקורת אוטומטיות", isIncluded: true },
      { name: "מערכת אפיליאט", isIncluded: true },
      { name: "תמיכה בעדיפות גבוהה", isIncluded: true },
      { name: "דוחות AI", isIncluded: true },
      { name: "אינטגרציית CRM", isIncluded: true },
      { name: "גישת API מלאה", isIncluded: true },
    ],
  },
];

export default PricingComponent;
