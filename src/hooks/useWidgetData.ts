/**
 * useWidgetData.ts
 *
 * Fetches all data needed to render a TrustWidget for a given business slug.
 *
 * Strategy:
 *   1. Hit the `widget-data` edge function for the aggregate business info
 *      (name, rating, reviewCount, verified).  This endpoint is public and
 *      performs a tier check (Pro / Premium only).
 *   2. Fetch up to 12 recent reviews directly from the `reviews` table for the
 *      matching business so the carousel / sidebar have real data to show.
 *
 * Returns a single { data, loading, error } object.  `data` is shaped as the
 * TrustWidgetProps interface so you can spread it straight onto <TrustWidget>.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TrustWidgetProps, WidgetReview } from "@/components/TrustWidget/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetApiResponse {
  name: string;
  slug: string;
  rating: number;
  review_count: number;
  verified: boolean;
  profile_url: string;
  error?: string;
}

interface UseWidgetDataResult {
  data: Omit<TrustWidgetProps, "variant"> | null;
  loading: boolean;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_REVIEWS = 12;
const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-data`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWidgetData(slug: string | null | undefined): UseWidgetDataResult {
  const [data, setData] = useState<Omit<TrustWidgetProps, "variant"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        // ── 1. Aggregate business info ────────────────────────────────────────
        const res = await fetch(`${EDGE_FN_URL}?slug=${encodeURIComponent(slug!)}`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        const json: WidgetApiResponse = await res.json();

        if (!res.ok || json.error) {
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }

        // ── 2. Recent reviews from the reviews table ──────────────────────────
        const { data: bizRow } = await supabase
          .from("businesses")
          .select("id")
          .eq("slug", slug!)
          .single();

        let reviews: WidgetReview[] = [];

        if (bizRow?.id) {
          const { data: rows } = await supabase
            .from("reviews")
            .select(
              "id, rating, content, reviewer_name, is_anonymous, course_id, created_at, is_verified_purchase"
            )
            .eq("business_id", bizRow.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(MAX_REVIEWS);

          if (rows) {
            // Optionally enrich with course name in one query
            const courseIds = [...new Set(rows.map(r => r.course_id).filter(Boolean))];
            let courseNames: Record<string, string> = {};

            if (courseIds.length > 0) {
              const { data: courses } = await supabase
                .from("courses")
                .select("id, title")
                .in("id", courseIds as string[]);

              if (courses) {
                courseNames = Object.fromEntries(courses.map(c => [c.id, c.title]));
              }
            }

            reviews = rows.map(r => ({
              id: r.id,
              rating: Number(r.rating),
              text: r.content ?? "",
              reviewerName: r.reviewer_name ?? "משתמש",
              anonymous: r.is_anonymous ?? false,
              verified: r.is_verified_purchase ?? false,
              courseName: r.course_id ? (courseNames[r.course_id] ?? undefined) : undefined,
              date: r.created_at
                ? new Date(r.created_at).toLocaleDateString("he-IL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "",
            }));
          }
        }

        if (!cancelled) {
          setData({
            businessName: json.name,
            slug: json.slug,
            rating: json.rating,
            reviewCount: json.review_count,
            reviews,
            profileUrl: json.profile_url,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "שגיאה בטעינת נתוני הווידג׳ט");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { data, loading, error };
}
