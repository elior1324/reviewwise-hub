import { FREELANCER_CATEGORIES, COURSE_CATEGORIES, SAAS_CATEGORIES } from "@/data/mockData";

type CategoryType = "freelancer" | "course" | "saas";

const STATIC_CATEGORIES: Record<CategoryType, string[]> = {
  freelancer: FREELANCER_CATEGORIES,
  course:     COURSE_CATEGORIES,
  saas:       SAAS_CATEGORIES,
};

/**
 * Returns the category list for a given business type.
 * Uses static arrays from mockData.ts (source of truth for categories).
 * Returns a stable object with the same shape as a useQuery result for
 * backwards compatibility with existing consumers.
 */
export function useCategories(type: CategoryType) {
  const data = STATIC_CATEGORIES[type] ?? [];
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
  } as const;
}
