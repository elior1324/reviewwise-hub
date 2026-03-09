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

  // Premium
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
  premium: 2,
};

function hasAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

export function useFeatureGating(tier: SubscriptionTier): FeatureAccess {
  return useMemo(() => {
    const isPro = hasAtLeast(tier, "pro");
    const isPremium = hasAtLeast(tier, "premium");

    return {
      // Basic — always available
      publicProfile: true,
      reviewLimit: isPro ? Infinity : 10,
      basicBadge: true,
      replyToReviews: true,

      // Pro and above
      unlimitedReviews: isPro,
      socialLinks: isPro,
      analyticsDashboard: isPro,
      embedWidgets: isPro,
      autoReviewRequests: isPro,
      affiliateSystem: isPro,
      prioritySupport: isPro,
      weeklyAiSummaries: isPro,

      // Premium only
      unlimitedBusinesses: isPremium,
      dailyAiReports: isPremium,
      crmIntegration: isPremium,
      leadsManagement: isPremium,
      webhooks: isPremium,
      googleAdsStars: isPremium,
      fullApiAccess: isPremium,
      personalSuccessManager: isPremium,
    };
  }, [tier]);
}

export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "free": return "סטארטר";
    case "pro": return "מקצועי";
    case "premium": return "פרימיום";
  }
}

export function getRequiredTierForFeature(feature: keyof FeatureAccess): SubscriptionTier {
  const premiumFeatures: (keyof FeatureAccess)[] = [
    "unlimitedBusinesses", "dailyAiReports", "crmIntegration",
    "leadsManagement", "webhooks", "googleAdsStars",
    "fullApiAccess", "personalSuccessManager",
  ];
  const proFeatures: (keyof FeatureAccess)[] = [
    "unlimitedReviews", "socialLinks", "analyticsDashboard",
    "embedWidgets", "autoReviewRequests", "affiliateSystem",
    "prioritySupport", "weeklyAiSummaries",
  ];

  if (premiumFeatures.includes(feature)) return "premium";
  if (proFeatures.includes(feature)) return "pro";
  return "free";
}
