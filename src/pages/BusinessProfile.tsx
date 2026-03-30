import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewSummary from "@/components/ReviewSummary";
import ServiceCard from "@/components/ServiceCard";
import BusinessHero from "@/components/BusinessHero";
import ReviewFormSection from "@/components/ReviewFormSection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import GoogleReviewsSection, { type GoogleReview, type GoogleProfileData } from "@/components/GoogleReviewsSection";
import WhatsAppReviewsSection, { type WhatsAppReview } from "@/components/WhatsAppReviewsSection";
import ReviewSourceBreakdown, { type SourceFilterValue } from "@/components/ReviewSourceBreakdown";
import BusinessTrustStatusBadge, { type BusinessTrustStatus } from "@/components/BusinessTrustStatusBadge";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MessageSquare, Copy, CheckCheck, ExternalLink, Handshake, Tag, Link2, Info, BarChart3, CheckCircle2, Clock, Star, ArrowUpDown, TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, PenLine } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { generateReviewSummary, FREELANCER_CATEGORIES, SAAS_CATEGORIES, type Business, type Course, type Review } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BusinessProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [business, setBusiness] = useState<Business | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dbBusinessId, setDbBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collabActive, setCollabActive] = useState(false);
  const [collabMethod, setCollabMethod] = useState<string | null>(null);
  const [collabCoupon, setCollabCoupon] = useState<string | null>(null);
  const [couponRevealed, setCouponRevealed] = useState(false);
  const [collabCopied, setCollabCopied] = useState(false);

  // Google Reviews state
  const [googleProfile, setGoogleProfile]   = useState<GoogleProfileData | null>(null);
  const [googleReviews, setGoogleReviews]   = useState<GoogleReview[]>([]);
  const [isOwner, setIsOwner]               = useState(false);

  // WhatsApp review state
  const [whatsappReviews, setWhatsappReviews]   = useState<WhatsAppReview[]>([]);

  // Trust platform state
  const [trustStatus, setTrustStatus]               = useState<BusinessTrustStatus>("normal");
  const [trustStatusReason, setTrustStatusReason]   = useState<string | null>(null);
  const [aiSummaryMeta, setAiSummaryMeta]           = useState<{
    reviewCount: number; periodLabel: string; generatedAt: string;
  } | null>(null);

  // AI Intelligence signals (from daily-ai-scan pipeline)
  const [aiSummary, setAiSummary]           = useState<string | null>(null);
  const [aiSentimentScore, setAiSentimentScore] = useState<number | null>(null);
  const [aiTrendingScore, setAiTrendingScore]   = useState<number | null>(null);
  const [aiFlags, setAiFlags]               = useState<string[]>([]);

  // Affiliate program
  const [affiliateMode,         setAffiliateMode]         = useState<"reviewhub_model" | "personal_affiliate" | "none">("none");
  const [personalAffiliateUrls, setPersonalAffiliateUrls] = useState<string[]>([]);

  // Transparency score pillars (fetched from businesses table)
  const [, setTransparencyScore]    = useState<number | null>(null);
  const [, setResponseRate]         = useState<number | null>(null);
  const [, setAvgResponseHours]     = useState<number | null>(null);
  const [, setVerifiedReviewRatio]  = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchAll = async () => {
      setLoading(true);

      // ── 1. Fetch business ────────────────────────────────────────────────────
      // businesses table columns: id, owner_id, business_name, website, email,
      //   phone, category, description, slug, verified, created_at
      // NOTE: rating, review_count, logo_url, social_links do NOT exist in this table.
      //   Rating and reviewCount are computed below from the reviews we fetch.
      const { data: bizRaw } = await supabase.from("businesses")
        .select("id, slug, name, website, email, phone, category, description, verified, logo_url, cover_url, social_links, created_at, founder_name, collaboration_active, collaboration_method, collaboration_coupon, trust_status, trust_status_reason, transparency_score, response_rate, avg_response_hours, verified_review_ratio, ai_summary, sentiment_score, trending_score, ai_flags, affiliate_mode, personal_affiliate_url, personal_affiliate_urls")
        .eq("slug", slug)
        .maybeSingle();

      const bizData = bizRaw;

      if (!bizData) {
        setLoading(false);
        return;
      }

      setDbBusinessId(bizData.id);

      // Trust status
      setTrustStatus((bizData.trust_status as BusinessTrustStatus) || "normal");
      setTrustStatusReason(bizData.trust_status_reason || null);

      // Transparency score pillars
      setTransparencyScore(bizData.transparency_score ?? null);
      setResponseRate(bizData.response_rate ?? null);
      setAvgResponseHours(bizData.avg_response_hours ?? null);
      setVerifiedReviewRatio(bizData.verified_review_ratio ?? null);

      // AI Intelligence signals
      setAiSummary(bizData.ai_summary ?? null);
      setAiSentimentScore(bizData.sentiment_score ?? null);
      setAiTrendingScore(bizData.trending_score ?? null);
      setAiFlags(Array.isArray(bizData.ai_flags) ? bizData.ai_flags : []);

      // Affiliate program
      setAffiliateMode((bizData.affiliate_mode as "reviewhub_model" | "personal_affiliate" | "none") || "none");
      {
        const rawUrls  = bizData.personal_affiliate_urls as string[] | null;
        const singular = bizData.personal_affiliate_url  as string | null;
        const urls: string[] = Array.isArray(rawUrls) && rawUrls.length > 0
          ? rawUrls
          : singular ? [singular] : [];
        setPersonalAffiliateUrls(urls);
      }

      // Collaboration program state
      setCollabActive(bizData.collaboration_active || false);
      setCollabMethod(bizData.collaboration_method || null);
      setCollabCoupon(bizData.collaboration_coupon || null);

      // ── 2. Fetch courses ─────────────────────────────────────────────────────
      // courses columns: id, business_id, course_name, description, price,
      //   affiliate_url, course_category, created_at
      // NOTE: courses.name, rating, review_count, verified_purchases do NOT exist.
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, description, short_description, price, url, affiliate_url, affiliate_percentage, is_active, category")
        .eq("business_id", bizData.id)
        .eq("is_active", true);

      if (courseData) {
        setCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: bizData.slug,
          name: c.name || "",
          price: Number(c.price) || 0,
          description: c.description || "",
          shortDescription: c.short_description || "",
          url: c.url || "",
          affiliateUrl: c.affiliate_url || "",
          affiliatePercentage: c.affiliate_percentage != null ? Number(c.affiliate_percentage) : null,
          category: c.category || "",
          rating: 0,
          reviewCount: 0,
          verifiedPurchases: 0,
        })));
      }

      // ── 3. Fetch reviews ─────────────────────────────────────────────────────
      // reviews columns: id, user_id, course_id, rating, review_text,
      //   purchase_date, verified_purchase, anonymous, reviewer_name,
      //   created_at, updated_at
      // NOTE: reviews.text, verified, flagged, flag_reason, like_count do NOT exist.
      //
      // courses join: use course_name (NOT courses.name)
      //
      // Owner responses: table is review_responses (NOT business_responses)
      //   columns: id, review_id, business_id, response_text, created_at
      //   joined via review_id FK (PostgREST: review_responses(response_text, created_at))
      // reviews has business_id directly
      // Use reviews table directly for join support (courses, review_responses).
      // The public_reviews view does not support PostgREST joins.
      const { data: reviewDataFinal } = await supabase
        .from("reviews")
        .select("*, courses(name), review_responses(response_text, created_at)")
        .eq("business_id", bizData.id)
        .order("created_at", { ascending: false });

      // ── AI Summary metadata ──────────────────────────────────────────────────
      const { data: summaryMeta } = await supabase.from("ai_summary_meta")
        .select("review_count, period_start, period_end, generated_at")
        .eq("business_id", bizData.id)
        .eq("is_current", true)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryMeta) {
        const periodStart = summaryMeta.period_start
          ? new Date(summaryMeta.period_start)
          : null;
        const periodEnd = summaryMeta.period_end
          ? new Date(summaryMeta.period_end)
          : null;
        let periodLabel = "";
        if (periodStart && periodEnd) {
          const diffMonths = Math.round(
            (periodEnd.getTime() - periodStart.getTime()) / (30 * 86400000)
          );
          periodLabel = diffMonths >= 12
            ? `${Math.round(diffMonths / 12)} שנה אחרונה`
            : `${diffMonths} חודשים אחרונים`;
        }
        setAiSummaryMeta({
          reviewCount: summaryMeta.review_count ?? 0,
          periodLabel,
          generatedAt: summaryMeta.generated_at,
        });
      }

      if (reviewDataFinal) {
        // ── Expert Badge logic (UNCHANGED) ─────────────────────────────────────
        const expertCounts: Record<string, number> = {};
        reviewDataFinal.forEach((r: any) => {
          if (r.rating >= 4 && r.user_id) {
            expertCounts[r.user_id] = (expertCounts[r.user_id] || 0) + 1;
          }
        });

        // ── Early Bird logic (UNCHANGED) ────────────────────────────────────────
        const sortedByDate = [...reviewDataFinal].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const earlyBirdIds = new Set(sortedByDate.slice(0, 5).map((r: any) => r.id));

        // ── Fetch WhatsApp reviews early so they count in the average ────────
        const { data: waReviews } = await supabase.from("whatsapp_reviews")
          .select("id, author_name, rating, text, received_at, source_url")
          .eq("business_id", bizData.id)
          .eq("is_approved", true)
          .eq("is_flagged", false)
          .order("received_at", { ascending: false });

        if (waReviews) setWhatsappReviews(waReviews as WhatsAppReview[]);

        // ── Compute rating & reviewCount — includes native + approved WhatsApp ──
        const waRatings = (waReviews || []).filter((r: any) => r.rating != null).map((r: any) => r.rating as number);
        const allRatings = [
          ...reviewDataFinal.map((r: any) => r.rating || 0),
          ...waRatings,
        ];
        const totalReviews = allRatings.length;
        const avgRating = totalReviews > 0
          ? allRatings.reduce((sum, r) => sum + r, 0) / totalReviews
          : 0;

        // Now we can set business with real computed values
        const mappedBiz: Business = {
          slug: bizData.slug,
          name: bizData.name || "",
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : SAAS_CATEGORIES.includes(bizData.category) ? "saas" : "course-provider",
          category: bizData.category || "",
          rating: Math.round(avgRating * 10) / 10, // computed from reviews
          reviewCount: totalReviews,               // computed from reviews
          description: bizData.description || "",
          logo: bizData.logo_url || undefined,
          coverUrl: bizData.cover_url || undefined,
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          socialLinks: bizData.social_links as Record<string, string> | undefined,
        };
        setBusiness(mappedBiz);

        setReviews(reviewDataFinal.map((r: any) => ({
          id: r.id,
          reviewerName: r.anonymous ? "אנונימי" : "משתמש",
          rating: r.rating || 0,
          text: r.text || "",
          courseName: r.courses?.name || "",
          courseId: r.course_id || "",
          businessSlug: bizData.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          verified: r.verified_purchase || r.is_verified_purchase || r.is_purchase_verified || false,
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at && r.updated_at !== r.created_at
            ? new Date(r.updated_at).toLocaleDateString("he-IL")
            : undefined,
          flagged: r.flagged || false,
          flagReason: r.flag_reason || undefined,
          likeCount: r.like_count || 0,
          isEarlyBird: earlyBirdIds.has(r.id),
          isExpert: r.user_id ? (expertCounts[r.user_id] || 0) >= 3 : false,
          userId: r.user_id || undefined,
          ownerResponse: r.review_responses?.[0] ? {
            text: r.review_responses[0].response_text || "",
            date: new Date(r.review_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
          reviewSource: r.verified ? "verified_purchase" : "community",
          isSpamFlagged: r.flagged ?? false,
          activeCaseStatus: null,
        })));
      } else {
        const mappedBiz: Business = {
          slug: bizData.slug,
          name: bizData.name || "",
          type: FREELANCER_CATEGORIES.includes(bizData.category) ? "freelancer" : SAAS_CATEGORIES.includes(bizData.category) ? "saas" : "course-provider",
          category: bizData.category || "",
          rating: 0,
          reviewCount: 0,
          description: bizData.description || "",
          logo: bizData.logo_url || undefined,
          coverUrl: bizData.cover_url || undefined,
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          founderName: bizData.founder_name || undefined,
          socialLinks: bizData.social_links as Record<string, string> | undefined,
          createdAt: bizData.created_at || undefined,
        };
        setBusiness(mappedBiz);
      }

      // ── 4. Fetch Google external profile + reviews ───────────────────────────
      const { data: extProfile } = await supabase.from("business_external_profiles")
        .select("external_id,external_url,external_name,external_rating,external_review_count,last_synced_at,sync_status")
        .eq("business_id", bizData.id)
        .eq("status", "confirmed")
        .maybeSingle();

      if (extProfile) {
        setGoogleProfile(extProfile as GoogleProfileData);

        const { data: gReviews } = await supabase.from("imported_google_reviews")
          .select("id,author_name,author_photo_url,rating,text,published_at,source_url")
          .eq("business_id", bizData.id)
          .eq("display_allowed", true)
          .eq("is_deleted_at_source", false)
          .order("published_at", { ascending: false })
          .limit(10);

        if (gReviews) setGoogleReviews(gReviews as GoogleReview[]);
      }

      // WhatsApp reviews already fetched above (before rating computation)

      setLoading(false);
    };

    fetchAll();
  }, [slug]);

  // Detect ownership for the manual sync button
  useEffect(() => {
    if (!user || !dbBusinessId) { setIsOwner(false); return; }
    supabase.from("businesses").select("id").eq("id", dbBusinessId).eq("owner_id", user.id).maybeSingle()
      .then(({ data }) => setIsOwner(!!data));
  }, [user, dbBusinessId]);

  // ── Base rating-filter + source-filter applied to native reviews ───────────
  const ratingFiltered = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;

  // Source filter for native ReviewHub reviews
  const nativeReviewsToShow = useMemo(() => {
    let base = ratingFiltered;
    if (sourceFilter === "verified_purchase") base = base.filter(r => r.verified);
    else if (sourceFilter === "community")    base = base.filter(r => !r.verified);
    else if (sourceFilter !== "all")          base = []; // google/whatsapp — handled separately

    return [...base].sort((a, b) => {
      const aMs = new Date(a.purchaseDate || a.date).getTime();
      const bMs = new Date(b.purchaseDate || b.date).getTime();
      switch (sortOrder) {
        case "oldest":  return aMs - bMs;
        case "highest": return b.rating - a.rating;
        case "lowest":  return a.rating - b.rating;
        default:        return bMs - aMs; // newest
      }
    });
  }, [ratingFiltered, sourceFilter, sortOrder]);

  // Keep filteredReviews as alias used by legacy summary/badge logic below
  const filteredReviews = nativeReviewsToShow;
  const summary = generateReviewSummary(reviews);

  // Compute top 3 positive traits from review texts
  const topTraits = useMemo(() => {
    const TRAITS = [
      { label: "מקצועיות", keywords: ["מקצועי", "מקצועיות", "מומחה", "expert"] },
      { label: "שירות מעולה", keywords: ["שירות", "עזרה", "תמיכה", "מענה"] },
      { label: "ידע מעמיק", keywords: ["ידע", "ניסיון", "בקיא", "מיומן"] },
      { label: "זמינות גבוהה", keywords: ["זמין", "זמינות", "מהיר", "מהירות"] },
      { label: "יחס אישי", keywords: ["אישי", "יחס", "קשב", "מקשיב"] },
      { label: "תוצאות מוכחות", keywords: ["תוצאות", "הצלחה", "שיפור", "השפיע"] },
      { label: "אמינות", keywords: ["אמין", "אמינות", "ישר", "הגון"] },
      { label: "תמורה למחיר", keywords: ["מחיר", "תמורה", "שווה", "כדאי", "משתלם"] },
      { label: "תקשורת ברורה", keywords: ["תקשורת", "הסבר", "ברור", "הנחייה"] },
      { label: "יצירתיות", keywords: ["יצירתי", "חדשני", "פתרון", "רעיון"] },
      { label: "סבלנות", keywords: ["סבלנות", "סבלני", "הבנה", "הקשבה"] },
    ];
    const allText = reviews.map(r => (r.text || "")).join(" ").toLowerCase();
    const scored = TRAITS
      .map(t => ({ label: t.label, score: t.keywords.filter(kw => allText.includes(kw)).length }))
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3).map(t => t.label);
    // Fallback if not enough matches
    const defaults = ["מקצועיות", "שירות מעולה", "אמינות"];
    while (top.length < 3 && reviews.length > 0) top.push(defaults[top.length]);
    return top;
  }, [reviews]);

  // Track referral click and redirect
  const handleCollabAccess = async () => {
    if (!dbBusinessId || !slug) return;
    // Record click
    await supabase.from("referral_clicks").insert({
      business_id: dbBusinessId,
      business_slug: slug,
      referrer: document.referrer || null,
    });
    // Navigate to /go/:slug for the redirect page
    window.open(`/go/${slug}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyCoupon = () => {
    if (collabCoupon) {
      navigator.clipboard.writeText(collabCoupon);
      setCollabCopied(true);
      setTimeout(() => setCollabCopied(false), 2500);
    }
  };

  // ── Hybrid review tiers ────────────────────────────────────────────────────
  // Tier 1: purchase-verified reviews → count toward trust score, shown first
  // Tier 2: open community reviews    → no purchase proof, NOT in trust score
  const verifiedFiltered = nativeReviewsToShow.filter(r => r.verified);
  const openFiltered     = nativeReviewsToShow.filter(r => !r.verified);
  const totalVerified    = reviews.filter(r => r.verified).length;
  const totalOpen        = reviews.filter(r => !r.verified).length;

  // ── Apply rating filter to WhatsApp & Google reviews ─────────────────────
  const filteredWhatsappReviews = filterRating
    ? whatsappReviews.filter(r => r.rating === filterRating)
    : whatsappReviews;
  const filteredGoogleReviews = filterRating
    ? googleReviews.filter(r => r.rating === filterRating)
    : googleReviews;

  // ── Visibility flags for source-based section rendering ───────────────────
  const showNativeSection  = sourceFilter === "all" || sourceFilter === "verified_purchase" || sourceFilter === "community";
  const showGoogleSection  = (sourceFilter === "all" || sourceFilter === "google")        && !!googleProfile;
  const showWASection      = (sourceFilter === "all" || sourceFilter === "whatsapp")      && whatsappReviews.length > 0;

  // ── Smart empty-state logic ───────────────────────────────────────────────
  const hasAnyContent = reviews.length > 0 || googleReviews.length > 0 || whatsappReviews.length > 0;
  const hasOnlyExternal = reviews.length === 0 && (googleReviews.length > 0 || whatsappReviews.length > 0);
  const hasWAButNoVerified = whatsappReviews.length > 0 && totalVerified === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise-overlay">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">טוען...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background noise-overlay flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={36} className="text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              ישות זו אינה במאגר הכלכלה הדיגיטלית
            </h1>
            <p className="text-muted-foreground mb-4 text-base leading-relaxed">
              <strong className="text-foreground">{slug}</strong> טרם נרשמה לתשתית האמון של ReviewHub — או שהכתובת שגויה.
            </p>
            <div className="flex items-start gap-3 text-right bg-card/60 border border-border/40 rounded-xl p-4 mb-8 text-sm text-muted-foreground">
              <MessageSquare size={16} className="text-primary shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">היעדר רשומה הוא מידע בפני עצמו.</strong>{" "}
                כלי, מומחה או ספק חינוך שאינו מאומת ב-ReviewHub — ציון האמון שלו לא אומת מול נתוני רכישה ממשיים.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto" onClick={() => navigate("/search")}>
                חפשו בספריית האמון
              </Button>
              <Button variant="outline" className="border-border/50 gap-2 w-full sm:w-auto" onClick={() => navigate("/")}>
                עמוד הבית
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              מכירים את העסק ורוצים לראותו במאגר?{" "}
              <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">בקשו אימות</a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── JSON-LD structured data for Google Review Stars ───────────────────────
  // Use only VERIFIED reviews for the aggregate rating — consistent with the
  // institutional model where trust score is derived from verified data only.
  const verifiedReviews = reviews.filter(r => r.verified);
  const verifiedAvgRating = verifiedReviews.length > 0
    ? verifiedReviews.reduce((sum, r) => sum + r.rating, 0) / verifiedReviews.length
    : 0;

  const jsonLd = business && verifiedReviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": business.type === "freelancer" ? "LocalBusiness" : "EducationalOrganization",
    "name": business.name,
    "description": business.description,
    ...(business.website ? { "url": business.website } : {}),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": verifiedAvgRating.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": verifiedReviews.length.toString(),
    },
  } : null;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      {jsonLd && (
        <script
          type="application/ld+json"
          // SECURITY: JSON.stringify does NOT escape "</script>" sequences.
          // A business name/description/url containing "</script>" would let
          // an attacker break out of the <script> tag and inject arbitrary HTML.
          // Unicode-escape the three characters that are dangerous inside a
          // raw <script> block: <  >  & — this is the same approach React uses
          // internally and that Next.js applies to JSON-LD blocks.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g,  '\\u003c')
              .replace(/>/g,  '\\u003e')
              .replace(/&/g,  '\\u0026'),
          }}
        />
      )}
      <Navbar />
      <div className="container py-10">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            → חזרה
          </Button>
        </div>
        <BusinessHero
          business={business}
          verifiedReviewCount={totalVerified}
          affiliateMode={affiliateMode}
          affiliateSlug={slug}
          personalAffiliateUrls={personalAffiliateUrls}
          couponCode={collabCoupon}
        />

        {/* ── Business Trust Status Banner (Feature 4) ─────────────────────
            Rendered immediately below the hero — only visible when status is
            under_review / warning / restricted. Normal returns null.           */}
        <BusinessTrustStatusBadge
          status={trustStatus}
          reason={trustStatusReason ?? undefined}
          variant="banner"
          isOwner={isOwner}
          className="mb-4"
        />


        {/* ── AI Intelligence Insights ──────────────────────────────────────
            Shown only when the daily-ai-scan pipeline has data for this profile.
            Renders: AI summary, trending signal, sentiment indicator, anomaly flags. */}
        {(aiSummary || aiSentimentScore !== null || aiTrendingScore !== null || aiFlags.length > 0) && (
          <AiInsightsSection
            summary={aiSummary}
            sentimentScore={aiSentimentScore}
            trendingScore={aiTrendingScore}
            flags={aiFlags}
          />
        )}


        {/* Courses */}
        {courses.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl mb-4">שירותים ומוצרים ({courses.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ServiceCard
                    id={course.id}
                    name={course.name}
                    shortDescription={course.shortDescription}
                    description={course.description}
                    price={course.price}
                    url={course.url}
                    affiliateUrl={course.affiliateUrl}
                    affiliatePercentage={course.affiliatePercentage}
                    category={course.category}
                    rating={course.rating}
                    reviewCount={course.reviewCount}
                    businessSlug={course.businessSlug}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary — with full transparency metadata */}
        {summary && (
          <ReviewSummary
            summary={summary}
            reviewCount={aiSummaryMeta?.reviewCount ?? reviews.length}
            periodLabel={aiSummaryMeta?.periodLabel ?? "הביקורות הקיימות"}
            generatedAt={aiSummaryMeta?.generatedAt}
            modelVersion="GPT-4o"
            topTraits={topTraits}
          />
        )}

        {/* Testimonial Videos/Images */}
        {dbBusinessId && <TestimonialCarousel businessId={dbBusinessId} />}

        {/* ══════════════════════════════════════════════════════════════════
            REVIEW SOURCE BREAKDOWN — dual-purpose: stats + filter
            Clicking a source chip filters the sections below.
        ══════════════════════════════════════════════════════════════════ */}
        <ReviewSourceBreakdown
          verifiedCount={totalVerified}
          communityCount={totalOpen}
          googleCount={googleReviews.length}
          whatsappCount={whatsappReviews.length}
          activeFilter={sourceFilter}
          onFilterChange={setSourceFilter}
        />

        {/* ── Filter bar: rating + sort ────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap justify-between">
          {/* Rating filter — only shown for native review sources */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">דירוג:</span>
            <Button
              variant={filterRating === null ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setFilterRating(null)}
            >
              הכל
            </Button>
            {[5, 4, 3, 2, 1].map(r => (
              <Button
                key={r}
                variant={filterRating === r ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterRating(filterRating === r ? null : r)}
              >
                {r}★
              </Button>
            ))}
          </div>

          {/* Sort order — applies to native reviews */}
          {showNativeSection && (
            <div className="flex items-center gap-2">
              <ArrowUpDown size={12} className="text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                className="text-xs bg-card border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                dir="rtl"
              >
                <option value="newest">חדשות קודם</option>
                <option value="oldest">ישנות קודם</option>
                <option value="highest">דירוג גבוה</option>
                <option value="lowest">דירוג נמוך</option>
              </select>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            REVIEW SECTIONS — visibility controlled by sourceFilter
        ══════════════════════════════════════════════════════════════════ */}

        {/* ── Native ReviewHub reviews ─────────────────────────────────────── */}
        {showNativeSection && (
          <div className="space-y-6">

            {/* Trust score notice */}
            {totalVerified > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
                <ShieldCheck size={13} className="text-primary shrink-0" />
                <span>
                  ציון האמון מחושב מ-<strong className="text-foreground">{totalVerified} ביקורות מאומתות רכישה</strong> בלבד
                  {totalOpen > 0 && ` · ${totalOpen} משובי קהילה מוצגים בנפרד ואינם נספרים`}
                </span>
              </div>
            )}

            {/* Platform transparency disclosure */}
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground/70 border border-border/30 rounded-lg px-3 py-2.5 bg-muted/20">
              <Info size={11} className="shrink-0 mt-0.5" />
              <span>
                חלק מהכותבים עשויים להיות בעלי עסקים הרשומים בפלטפורמה. ReviewHub מאפשרת לבעלי עסקים לדרג עסקים אחרים בתחומים שאינם מתחרים. ביקורת מסוג זה כפופה לאותן דרישות אימות ומדיניות ציות.
              </span>
            </div>

            {/* ── Tier 1: Verified Purchase reviews ───────────────────────── */}
            {verifiedFiltered.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={15} className="text-green-600 dark:text-green-400" aria-hidden="true" />
                  <h3 className="font-display font-semibold text-sm text-foreground">ביקורות מאומתות — הוכחת רכישה</h3>
                  <span className="text-xs text-muted-foreground">({verifiedFiltered.length})</span>
                  <span className="text-[9px] bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-full px-1.5 py-0.5 font-semibold">
                    T1 · נספר בציון
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {verifiedFiltered.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ReviewCard {...review} reviewTier="verified" compact />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tier 4: Open Community reviews ──────────────────────────── */}
            {openFiltered.length > 0 && (
              <div className={verifiedFiltered.length > 0 ? "border-t border-border/30 pt-6" : ""}>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-muted-foreground" aria-hidden="true" />
                  <h3 className="font-display font-semibold text-sm text-foreground">משוב קהילה</h3>
                  <span className="text-xs text-muted-foreground">({openFiltered.length})</span>
                  <span className="text-[9px] bg-muted/60 text-muted-foreground border border-border/40 rounded-full px-1.5 py-0.5 font-semibold">
                    T4 · לא נספר
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  משובים אלו לא עברו אימות רכישה ואינם נספרים בציון האמון הדיגיטלי.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {openFiltered.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ReviewCard {...review} reviewTier="open" compact />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Smart empty states ───────────────────────────────────────── */}
            {nativeReviewsToShow.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                {/* Case 1: No content anywhere */}
                {!hasAnyContent && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-2xl">⭐</div>
                    <p className="font-semibold text-foreground">ממתין לביקורות ראשונות</p>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      עדיין לא התקבלו ביקורות לעסק זה. היו הראשונים לשתף חוויה אמיתית.
                    </p>
                  </>
                )}

                {/* Case 2: Only external reviews, no native */}
                {hasOnlyExternal && sourceFilter === "all" && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center">
                      <ExternalLink size={22} className="text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">ביקורות חיצוניות זמינות</p>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      ביקורות מ-Google או WhatsApp זמינות למטה.
                      ביקורות מאומתות רכישה עדיין לא התקבלו.
                    </p>
                  </>
                )}

                {/* Case 3: WhatsApp but no verified purchase */}
                {hasWAButNoVerified && sourceFilter === "verified_purchase" && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                      <ShieldCheck size={22} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-foreground">משוב לקוחות זמין</p>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      משוב WhatsApp זמין. ביקורות מאומתות רכישה יוצגו
                      ברגע שלקוחות יגישו הוכחת רכישה.
                    </p>
                  </>
                )}

                {/* Case 4: Active filter with no results */}
                {(sourceFilter !== "all" || filterRating !== null) &&
                  hasAnyContent &&
                  !hasOnlyExternal &&
                  !(hasWAButNoVerified && sourceFilter === "verified_purchase") && (
                  <p className="text-muted-foreground">אין ביקורות עם הסינון הנבחר.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tier 3a: External Google Reviews ────────────────────────────────
            Always shown below native reviews; hidden when another source filter
            is active (unless Google is selected).
        ─────────────────────────────────────────────────────────────────── */}
        {showGoogleSection && (
          <div className="mt-8 border-t border-border/30 pt-8">
            {/* Tier label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/20 rounded-full px-1.5 py-0.5 font-semibold">
                T3 · מקור חיצוני
              </span>
              <span className="text-xs text-muted-foreground">ביקורות Google אינן חלק מציון האמון של ReviewHub</span>
            </div>
            <GoogleReviewsSection
              businessId={dbBusinessId!}
              businessSlug={slug!}
              profile={googleProfile!}
              reviews={filteredGoogleReviews}
              isOwner={isOwner}
            />
          </div>
        )}

        {/* ── Tier 2: WhatsApp Customer Feedback ──────────────────────────────
            Approved by business owner. T2 in hierarchy.
        ─────────────────────────────────────────────────────────────────── */}
        {showWASection && (
          <div className={showNativeSection || showGoogleSection ? "mt-6 border-t border-border/30 pt-6" : "mt-4"}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-full px-1.5 py-0.5 font-semibold">
                T2 · אושר על ידי בעל העסק
              </span>
            </div>
            <WhatsAppReviewsSection reviews={filteredWhatsappReviews} />
          </div>
        )}

        {/* ── Empty state when filter shows a source with no data ─────────────── */}
        {!showNativeSection && !showGoogleSection && !showWASection && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare size={22} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">אין ביקורות ממקור זה</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              עדיין אין ביקורות מהמקור שנבחר. לחצו "הכל" לצפייה בכל הביקורות.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSourceFilter("all")}>
              הצג הכל
            </Button>
          </div>
        )}

        {/* Review Form — shown after all reviews so visitors see reviews first */}
        <ReviewFormSection
          businessSlug={business.slug}
          businessName={business.name}
          businessId={dbBusinessId || undefined}
        />

      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfile;


// ── AiInsightsSection ─────────────────────────────────────────────────────────
// Displays the AI intelligence layer signals for a business profile:
//   – 3-sentence AI-written summary (from daily-ai-scan → generate-profile-summary)
//   – Trending signal badge (growing / stable / declining)
//   – Sentiment score bar
//   – Anomaly flag warnings (if any open flags exist)

interface AiInsightsSectionProps {
  summary:        string | null;
  sentimentScore: number | null;
  trendingScore:  number | null;
  flags:          string[];
}

function trendingInfo(score: number | null): {
  label: string;
  Icon:  React.FC<{ size?: number | string; className?: string }>;
  color: string;
  bg:    string;
} {
  if (score === null) return { label: "אין נתונים", Icon: Minus, color: "text-muted-foreground", bg: "bg-muted/30" };
  if (score >= 3)     return { label: "צמיחה מהירה מאוד", Icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" };
  if (score >= 2)     return { label: "צמיחה חזקה",        Icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" };
  if (score >= 1.3)   return { label: "צמיחה מתונה",       Icon: TrendingUp,   color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" };
  if (score >= 0.7)   return { label: "יציב",               Icon: Minus,        color: "text-muted-foreground", bg: "bg-muted/20 border-border/40" };
  return                    { label: "ירידה בנפח",          Icon: TrendingDown, color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" };
}

const FLAG_LABELS: Record<string, string> = {
  rating_spike:        "קפיצה חריגה בדירוגים",
  review_flood:        "גל ביקורות חשוד",
  coordinated_timing:  "תזמון מתואם",
  sentiment_mismatch:  "אי-התאמת סנטימנט",
  velocity_anomaly:    "אנומליית קצב",
};


function AiInsightsSection({ summary, sentimentScore, trendingScore, flags }: AiInsightsSectionProps) {
  const trending = trendingInfo(trendingScore);
  const TrendIcon = trending.Icon;
  const sentimentPct = sentimentScore !== null ? Math.round(sentimentScore * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8 rounded-xl border border-border/40 bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Brain size={14} className="text-primary" />
        </div>
        <span className="font-display font-semibold text-sm text-foreground">
          תובנות AI
        </span>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide mr-auto">
          מחושב אוטומטית
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Anomaly flags — shown at top in a warning band */}
        {flags.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                דגלי בטיחות פתוחים
              </p>
              <div className="flex flex-wrap gap-1.5">
                {flags.map(f => (
                  <span
                    key={f}
                    className="text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-full"
                  >
                    {FLAG_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metric row: trending + sentiment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Trending badge */}
          {trendingScore !== null && (
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${trending.bg}`}>
              <TrendIcon size={18} className={trending.color} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  מגמה
                </p>
                <p className={`text-sm font-semibold ${trending.color}`}>
                  {trending.label}
                </p>
              </div>
            </div>
          )}

          {/* Sentiment score */}
          {sentimentPct !== null && (
            <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                סנטימנט חיובי
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sentimentPct >= 70 ? "bg-emerald-500" :
                      sentimentPct >= 45 ? "bg-blue-500" : "bg-orange-400"
                    }`}
                    style={{ width: `${sentimentPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums w-10 text-left">
                  {sentimentPct}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AI-written summary */}
        {summary && (
          <div className="rounded-lg bg-muted/20 border border-border/30 px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              ניתוח AI — מבוסס ביקורות
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {summary}
            </p>
          </div>
        )}

      </div>
    </motion.div>
  );
}
