import { useMemo } from "react";

/**
 * Seasons run in 6-month blocks:
 *   Season 1: Jan-Jun
 *   Season 2: Jul-Dec
 */
export function useSeasonInfo() {
  return useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed
    const year = now.getFullYear();

    // Determine current season index (0 or 1)
    const seasonIndex = Math.floor(month / 6);
    const seasonNumber = seasonIndex + 1;

    // Season start/end months (0-indexed)
    const startMonth = seasonIndex * 6; // 0 or 6
    const endMonth = startMonth + 5; // 5 or 11

    const seasonStart = new Date(year, startMonth, 1);
    const seasonEnd = new Date(year, endMonth + 1, 0, 23, 59, 59, 999); // last day of end month

    const seasonLabel = `עונה ${seasonNumber} – ${year}`;

    // months included as YYYY-MM strings
    const seasonMonths: string[] = [];
    for (let m = startMonth; m <= endMonth; m++) {
      seasonMonths.push(`${year}-${String(m + 1).padStart(2, "0")}`);
    }

    // Time remaining
    const msLeft = Math.max(0, seasonEnd.getTime() - now.getTime());
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const totalMs = seasonEnd.getTime() - seasonStart.getTime();
    const progressPercent = Math.min(100, ((totalMs - msLeft) / totalMs) * 100);

    return {
      seasonNumber,
      seasonLabel,
      seasonMonths,
      seasonStart,
      seasonEnd,
      daysLeft,
      hoursLeft,
      progressPercent,
    };
  }, []);
}
