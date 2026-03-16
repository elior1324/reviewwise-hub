/**
 * ReviewHub — 5/5 Affiliate Trust Model utilities
 *
 * Commercial model:
 *   Total Trust Charge  = 10% of list price
 *   Split:
 *     Learner Discount  = 5%  (instant at checkout)
 *     Platform Trust Fee= 5%  (ReviewHub operational fee)
 *
 * Example (₪1,000 course):
 *   Learner pays       ₪950  (−5%)
 *   Creator receives   ₪900  (−5% fee taken by ReviewHub from creator net)
 *   ReviewHub earns    ₪50
 */

/** Percentage each party benefits/pays (0–1) */
export const LEARNER_DISCOUNT_RATE  = 0.05;
export const PLATFORM_FEE_RATE      = 0.05;
export const TOTAL_TRUST_CHARGE     = LEARNER_DISCOUNT_RATE + PLATFORM_FEE_RATE;

/** Cookie TTL for 30-day attribution window */
export const AFFILIATE_COOKIE_DAYS  = 30;
export const AFFILIATE_COOKIE_NAME  = "rh_ref";
export const AFFILIATE_COUPON_CODE  = "RH5";
export const AFFILIATE_REF_PARAM    = "reviewhub";

/**
 * Compute pricing breakdown for a given list price.
 * All values are in the same currency unit as `listPrice`.
 */
export function computeVerifiedPricing(listPrice: number) {
  const learnerDiscount   = Math.round(listPrice * LEARNER_DISCOUNT_RATE);
  const platformFee       = Math.round(listPrice * PLATFORM_FEE_RATE);
  const verifiedPrice     = listPrice - learnerDiscount;
  const creatorNet        = listPrice - learnerDiscount - platformFee;

  return {
    listPrice,
    learnerDiscount,
    platformFee,
    verifiedPrice,       // what the learner actually pays
    creatorNet,          // what the creator receives
    learnerDiscountPct:  LEARNER_DISCOUNT_RATE * 100,
    platformFeePct:      PLATFORM_FEE_RATE * 100,
    totalTrustChargePct: TOTAL_TRUST_CHARGE * 100,
  };
}

/**
 * Build the verified purchase URL by appending ReviewHub tracking params.
 * Uses Option A: URL parameter method.
 *
 * ?ref=reviewhub&coupon=RH5
 */
export function buildVerifiedPurchaseUrl(affiliateUrl: string): string {
  if (!affiliateUrl) return "";
  try {
    const url = new URL(affiliateUrl);
    url.searchParams.set("ref",    AFFILIATE_REF_PARAM);
    url.searchParams.set("coupon", AFFILIATE_COUPON_CODE);
    return url.toString();
  } catch {
    // Fallback: append manually
    const sep = affiliateUrl.includes("?") ? "&" : "?";
    return `${affiliateUrl}${sep}ref=${AFFILIATE_REF_PARAM}&coupon=${AFFILIATE_COUPON_CODE}`;
  }
}

/**
 * Set a 30-day affiliate attribution cookie.
 * Called on every course affiliate link click.
 */
export function setAffiliateCookie(courseId: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + AFFILIATE_COOKIE_DAYS);
  const value = JSON.stringify({
    courseId,
    timestamp: Date.now(),
    expires:   expires.toISOString(),
  });
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Read the current affiliate attribution cookie.
 * Returns null if no active cookie exists or it has expired.
 */
export function getAffiliateCookie(): { courseId: string; timestamp: number } | null {
  const match = document.cookie
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${AFFILIATE_COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const raw   = decodeURIComponent(match.split("=").slice(1).join("="));
    const data  = JSON.parse(raw) as { courseId: string; timestamp: number; expires: string };
    if (new Date(data.expires) < new Date()) return null;
    return { courseId: data.courseId, timestamp: data.timestamp };
  } catch {
    return null;
  }
}

/**
 * Clear the affiliate cookie (e.g. after a confirmed conversion).
 */
export function clearAffiliateCookie(): void {
  document.cookie = `${AFFILIATE_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Format a Hebrew price display with ₪ symbol.
 */
export function formatPrice(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

// ── Reward Discount Model ──────────────────────────────────────────────────────
//
//  At every 600-point milestone, users unlock one reward:
//    discount = min(REWARD_DISCOUNT_CAP_ILS, purchaseAmount × REWARD_DISCOUNT_RATE)
//
//  Eligibility rules (ALL must hold):
//    1. Purchase made through the ReviewHub platform (affiliate tracking active)
//    2. Business participates in affiliate program (mode ≠ 'none')
//    3. Purchase amount ≥ REWARD_MIN_PURCHASE_ILS
//    4. User has at least one unredeemed reward available
//
//  Points are NEVER reset after redemption — every 600 additional points = +1 reward.

/** Discount rate applied to the purchase price (10%) */
export const REWARD_DISCOUNT_RATE     = 0.10;

/** Hard cap on the reward discount in ILS */
export const REWARD_DISCOUNT_CAP_ILS  = 400;

/** Minimum purchase amount (ILS) required to apply the reward */
export const REWARD_MIN_PURCHASE_ILS  = 1_500;

/**
 * Compute the reward discount amount for a given purchase price.
 *
 *   discount = min(400₪, purchaseAmount × 10%)
 *
 * Returns 0 if `purchaseAmount` is below the minimum threshold.
 * The caller must also verify the user has rewardsAvailable > 0 and
 * that the business is eligible (`isBusinessEligibleForReward`).
 */
export function computeRewardDiscount(purchaseAmount: number): number {
  if (purchaseAmount < REWARD_MIN_PURCHASE_ILS) return 0;
  return Math.min(
    REWARD_DISCOUNT_CAP_ILS,
    Math.round(purchaseAmount * REWARD_DISCOUNT_RATE),
  );
}

/**
 * Returns true when a business may have reward discounts applied to its
 * purchases.  Both the ReviewHub affiliate model and a custom personal
 * affiliate link qualify.  'none' means no affiliate tracking → ineligible.
 */
export function isBusinessEligibleForReward(affiliateMode: string): boolean {
  return affiliateMode === "reviewhub_model" || affiliateMode === "personal_affiliate";
}
