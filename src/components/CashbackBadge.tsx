/**
 * LegacyIncentivesBadge (Deprecated)
 *
 * Legacy incentives were removed in the B2B pivot.
 * This component remains as a safe no-op to avoid stale imports.
 */

type CashbackBadgeProps = {
  amount?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  animated?: boolean;
  label?: string;
  className?: string;
};

export const CashbackBadge = (_props: CashbackBadgeProps) => null;

export const calcCashback = (_priceIls: number, _cashbackRate: number = 0): number => 0;

export default CashbackBadge;
