import { useMemo } from "react";
import { SubscriptionTier } from "@/contexts/AuthContext";

export interface FeatureAccess {
  // Basic (free)
  publicProfile: boolean;
  reviewLimit: number; // 10 for free, Infinity for paid
  basicBadge: boolean;
  replyToReviews: boolean;

  // Pro
  unlimitedReviews: boolean;
  socialLinks: boolean;
  analyticsDashboard: boolean;
  embedWidgets: boolean;
  autoReviewRequests: boolean;
  affiliateSystem: boolean;
  prioritySupport: boolean;
  weeklyAiSummaries: boolean;

  // Enterprise
  unlimitedBusinesses: boolean;
  dailyAiReports: boolean;
  crmIntegration: boolean;
  leadsManagement: boolean;
  webhooks: boolean;
  googleAdsStars: boolean;
  fullApiAccess: boolean;
  personalSuccessManager: boolean;
}

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

function hasAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

export function useFeatureGating(_tier: SubscriptionTier): FeatureAccess {
  return useMemo(() => {
    // All features are free — no tier gating
    return {
      publicProfile: true,
      reviewLimit: Infinity,
      basicBadge: true,
      replyToReviews: true,
      unlimitedReviews: true,
      socialLinks: true,
      analyticsDashboard: true,
      embedWidgets: true,
      autoReviewRequests: true,
      affiliateSystem: true,
      prioritySupport: true,
      weeklyAiSummaries: true,
      unlimitedBusinesses: true,
      dailyAiReports: true,
      crmIntegration: true,
      leadsManagement: true,
      webhooks: true,
      googleAdsStars: true,
      fullApiAccess: true,
      personalSuccessManager: true,
    };
  }, []);
}

export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "free":
      return "סטארטר";
    case "pro":
      return "מקצועי";
    case "enterprise":
      return "אנטרפרייז";
  }
}

export function getRequiredTierForFeature(feature: keyof FeatureAccess): SubscriptionTier {
  const enterpriseFeatures: (keyof FeatureAccess)[] = [
    "unlimitedBusinesses",
    "dailyAiReports",
    "crmIntegration",
    "leadsManagement",
    "webhooks",
    "googleAdsStars",
    "fullApiAccess",
    "personalSuccessManager",
  ];

  const proFeatures: (keyof FeatureAccess)[] = [
    "unlimitedReviews",
    "socialLinks",
    "analyticsDashboard",
    // embedWidgets is FREE — not in this list
    "autoReviewRequests",
    "affiliateSystem",
    "prioritySupport",
    "weeklyAiSummaries",
  ];

  if (enterpriseFeatures.includes(feature)) return "enterprise";
  if (proFeatures.includes(feature)) return "pro";
  return "free";
}
