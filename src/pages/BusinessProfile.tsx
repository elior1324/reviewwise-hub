import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import ReviewSummary from "@/components/ReviewSummary";
import CourseCard from "@/components/CourseCard";
import BusinessHero from "@/components/BusinessHero";
import AddReviewForm from "@/components/AddReviewForm";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import GoogleReviewsSection, { type GoogleReview, type GoogleProfileData } from "@/components/GoogleReviewsSection";
import WhatsAppReviewsSection, { type WhatsAppReview } from "@/components/WhatsAppReviewsSection";
import FacebookReviewsSection, { type FacebookReview } from "@/components/FacebookReviewsSection";
import ReviewSourceBreakdown, { type SourceFilterValue } from "@/components/ReviewSourceBreakdown";
import BusinessTrustStatusBadge, { type BusinessTrustStatus } from "@/components/BusinessTrustStatusBadge";
import TransparencyScore from "@/components/TransparencyScore";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MessageSquare, Award, Copy, CheckCheck, ExternalLink, Handshake, Tag, Link2, Info, BarChart3, CheckCircle2, Clock, Star, ArrowUpDown, TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, ShoppingBag } from "lucide-react";
import { PrestigeBadge, computeEligibleBadges, buildBadgeEmbedCode, BADGE_CONFIG } from "@/components/PrestigeBadge";
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

  // WhatsApp + Facebook review state
  const [whatsappReviews, setWhatsappReviews] = useState<WhatsAppReview[]>([]);
  const [facebookReviews, setFacebookReviews] = useState<FacebookReview[]>([]);
  const [facebookPageUrl,  setFacebookPageUrl]  = useState<string | null>(null);
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);

  // Trust platform state
  const [trustStatus, setTrustStatus]               = useState<BusinessTrustStatus>("normal");
  const [trustStatusReason, setTrustStatusReason]   = useState<string | null>(null);
  const [transparencyScore, setTransparencyScore]   = useState<number | null>(null);
  const [responseRate, setResponseRate]             = useState<number | null>(null);
  const [avgResponseHours, setAvgResponseHours]     = useState<number | null>(null);
  const [verifiedReviewRatio, setVerifiedReviewRatio] = useState<number | null>(null);
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

  useEffect(() => {
    if (!slug) return;

    const fetchAll = async () => {
      setLoading(true);

      // ── 1. Fetch business ────────────────────────────────────────────────────
      // businesses table columns: id, owner_id, business_name, website, email,
      //   phone, category, description, slug, verified, created_at
      // NOTE: rating, review_count, logo_url, social_links do NOT exist in this table.
      //   Rating and reviewCount are computed below from the reviews we fetch.
      const { data: bizData } = await supabase
        .from("businesses")
        .select("id, slug, name, website, email, phone, category, description, verified, logo_url, social_links, created_at, founder_name, collaboration_active, collaboration_method, collaboration_coupon, trust_status, trust_status_reason, transparency_score, response_rate, avg_response_hours, verified_review_ratio, ai_summary, sentiment_score, trending_score, ai_flags, affiliate_mode, personal_affiliate_url, personal_affiliate_urls")
        .eq("slug", slug)
        .maybeSingle();

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
      setAffiliateMode(((bizData as any).affiliate_mode as "reviewhub_model" | "personal_affiliate" | "none") || "none");
      {
        const rawUrls  = (bizData as any).personal_affiliate_urls as string[] | null;
        const singular = (bizData as any).personal_affiliate_url  as string | null;
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
        .select("id, name, description, price, affiliate_url, category")
        .eq("business_id", bizData.id);

      if (courseData) {
        setCourses(courseData.map((c: any) => ({
          id: c.id,
          businessSlug: bizData.slug,
          name: c.name || "",
          price: Number(c.price) || 0,
          description: c.description || "",
          affiliateUrl: c.affiliate_url || "",
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
      const { data: reviewDataFinal } = await supabase
        .from("reviews")
        .select("*, is_purchase_verified, review_source, is_flagged_spam, courses(name), business_responses(text, created_at)")
        .eq("business_id", bizData.id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      // ── AI Summary metadata ──────────────────────────────────────────────────
      const { data: summaryMeta } = await supabase
        .from("ai_summary_meta")
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

        // ── Compute rating & reviewCount for business (since table lacks them) ──
        const totalReviews = reviewDataFinal.length;
        const avgRating = totalReviews > 0
          ? reviewDataFinal.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
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
          logo: undefined,                         // logo_url doesn't exist in DB
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          socialLinks: undefined,                  // social_links doesn't exist in DB
        };
        setBusiness(mappedBiz);

        setReviews(reviewDataFinal.map((r: any) => ({
          id: r.id,
          // ✅ reviewer_name is stored on reviews table directly (no profiles join needed)
          reviewerName: r.anonymous ? "אנונימי" : (r.reviewer_name || "משתמש"),
          rating: r.rating || 0,
          text: r.review_text || "",              // ✅ review_text (NOT .text)
          courseName: r.courses?.course_name || "", // ✅ course_name (NOT courses.name)
          courseId: r.course_id || "",
          businessSlug: bizData.slug,
          date: new Date(r.created_at).toLocaleDateString("he-IL"),
          purchaseDate: r.created_at,
          // is_purchase_verified is the canonical flag (set by the purchase-proof trigger).
          // Fall back to verified_purchase for backwards-compatibility.
          verified: r.is_purchase_verified || r.verified_purchase || false,
          anonymous: r.anonymous || false,
          updatedAt: r.updated_at && r.updated_at !== r.created_at
            ? new Date(r.updated_at).toLocaleDateString("he-IL")
            : undefined,
          flagged: false,                          // flagged doesn't exist in reviews table
          flagReason: undefined,                   // flag_reason doesn't exist in reviews table
          likeCount: 0,                            // like_count doesn't exist in reviews table
          isEarlyBird: earlyBirdIds.has(r.id),
          isExpert: r.user_id ? (expertCounts[r.user_id] || 0) >= 3 : false,
          userId: r.user_id || undefined,
          // ✅ review_responses (NOT business_responses), response_text (NOT .text)
          ownerResponse: r.review_responses?.[0] ? {
            text: r.review_responses[0].response_text || "",
            date: new Date(r.review_responses[0].created_at).toLocaleDateString("he-IL"),
          } : undefined,
          // ── Trust platform fields ─────────────────────────────────────────
          reviewSource: r.review_source ?? (
            r.is_purchase_verified || r.verified_purchase
              ? "verified_purchase"
              : "community"
          ),
          isSpamFlagged: r.is_flagged_spam ?? false,
          activeCaseStatus: null, // fetched separately if needed
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
          website: bizData.website || undefined,
          email: bizData.email || undefined,
          phone: bizData.phone || undefined,
          founderName: (bizData as any).founder_name || undefined,
          socialLinks: (bizData as any).social_links || undefined,
          createdAt: bizData.created_at || undefined,
        };
        setBusiness(mappedBiz);
      }

      // ── 4. Fetch Google external profile + reviews ───────────────────────────
      const { data: extProfile } = await supabase
        .from("business_external_profiles")
        .select("external_id,external_url,external_name,external_rating,external_review_count,last_synced_at,sync_status")
        .eq("business_id", bizData.id)
        .eq("status", "confirmed")
        .maybeSingle();

      if (extProfile) {
        setGoogleProfile(extProfile as GoogleProfileData);

        const { data: gReviews } = await supabase
          .from("imported_google_reviews")
          .select("id,author_name,author_photo_url,rating,text,published_at,source_url")
          .eq("business_id", bizData.id)
          .eq("display_allowed", true)
          .eq("is_deleted_at_source", false)
          .order("published_at", { ascending: false })
          .limit(10);

        if (gReviews) setGoogleReviews(gReviews as GoogleReview[]);
      }

      // ── 5. Fetch WhatsApp reviews (approved, non-flagged) ────────────────────
      const { data: waReviews } = await supabase
        .from("whatsapp_reviews")
        .select("id, author_name, rating, text, received_at, source_url")
        .eq("business_id", bizData.id)
        .eq("is_approved", true)
        .eq("is_flagged", false)
        .order("received_at", { ascending: false });

      if (waReviews) setWhatsappReviews(waReviews as WhatsAppReview[]);

      // ── 6. Fetch Facebook reviews ────────────────────────────────────────────
      const { data: fbReviews } = await supabase
        .from("facebook_reviews")
        .select("id, author_name, author_profile_url, author_photo_url, rating, text, published_at, source_url")
        .eq("business_id", bizData.id)
        .order("published_at", { ascending: false });

      if (fbReviews && fbReviews.length > 0) {
        setFacebookReviews(fbReviews as FacebookReview[]);
        // Try to find a page URL from the first review that has one
        const pageLink = fbReviews.find((r: any) => r.source_url)?.source_url ?? null;
        setFacebookPageUrl(pageLink);
      }

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
    else if (sourceFilter !== "all")          base = []; // google/whatsapp/facebook — handled separately

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

  // ── Visibility flags for source-based section rendering ───────────────────
  const showNativeSection  = sourceFilter === "all" || sourceFilter === "verified_purchase" || sourceFilter === "community";
  const showGoogleSection  = (sourceFilter === "all" || sourceFilter === "google")   && !!googleProfile;
  const showWASection      = (sourceFilter === "all" || sourceFilter === "whatsapp") && whatsappReviews.length > 0;
  const showFBSection      = (sourceFilter === "all" || sourceFilter === "facebook") && facebookReviews.length > 0;

  // ── Smart empty-state logic ───────────────────────────────────────────────
  const hasAnyContent = reviews.length > 0 || googleReviews.length > 0 || whatsappReviews.length > 0 || facebookReviews.length > 0;
  const hasOnlyExternal = reviews.length === 0 && (googleReviews.length > 0 || whatsappReviews.length > 0 || facebookReviews.length > 0);
  const hasWAButNoVerified = (whatsappReviews.length > 0 || facebookReviews.length > 0) && totalVerified === 0;

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
        <BusinessHero business={business} verifiedReviewCount={totalVerified} />

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

        {/* Audit record strip — institutional framing */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-border/40 bg-card/40 rounded-xl px-4 py-3 mb-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-primary shrink-0" />
            <span>
              <strong className="text-foreground">רשומת אמון — כלכלה דיגיטלית</strong> — נתונים מאומתים מהוכחות רכישה ממשיות
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} className="text-muted-foreground shrink-0" />
            <span>
              {totalVerified} ביקורות מאומתות · {totalOpen} משובי קהילה
            </span>
          </div>
          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-muted-foreground/60">ציון האמון מחושב מביקורות מאומתות בלבד</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TRUST HUB (Feature 5) — full trust-center panel
            Shows: verification stats, contact info, moderation status chip,
            response rate, and trust tier.  Collapsed by default on mobile.
        ══════════════════════════════════════════════════════════════════ */}
        <TrustHub
          business={business}
          trustStatus={trustStatus}
          trustStatusReason={trustStatusReason}
          totalVerified={totalVerified}
          totalOpen={totalOpen}
          isOwner={isOwner}
        />

        {/* ── Transparency Score (Feature 9) ───────────────────────────────── */}
        <TransparencyScore
          transparencyScore={transparencyScore}
          verifiedReviewRatio={verifiedReviewRatio}
          responseRate={responseRate}
          avgResponseHours={avgResponseHours}
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

        {/* ── Affiliate Purchase Section ───────────────────────────────────── */}
        {affiliateMode !== "none" && (
          <AffiliatePurchaseSection
            mode={affiliateMode}
            slug={slug!}
            businessName={business.name}
            personalUrls={personalAffiliateUrls}
            dbBusinessId={dbBusinessId}
          />
        )}

        {/* ── Collaboration: Synchronized Purchase Conditions ──────────────── */}
        {collabActive && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 rounded-xl border border-primary/30 bg-gradient-to-l from-primary/8 via-background to-background overflow-hidden"
          >
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon + text */}
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Handshake size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-display font-bold text-base text-foreground">
                      תנאי רכישה מסונכרנים
                    </p>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">
                      מאומת
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    גישה דרך ReviewHub מאפשרת תנאי רכישה מסונכרנים ומבטיחה שהרכישה תעבור תהליך אימות לביקורת מאומתת עתידית.
                    {(collabMethod === "coupon" || collabMethod === "both") && !couponRevealed && (
                      <button
                        onClick={() => setCouponRevealed(true)}
                        className="text-primary hover:underline mr-1 text-sm"
                      >
                        הצגת קוד קופון
                      </button>
                    )}
                  </p>

                  {/* Coupon reveal */}
                  {(collabMethod === "coupon" || collabMethod === "both") && couponRevealed && collabCoupon && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                      <Tag size={13} className="text-primary" />
                      <code className="font-mono font-bold text-primary text-base tracking-widest">
                        {collabCoupon}
                      </code>
                      <button
                        onClick={handleCopyCoupon}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="העתקת קוד"
                      >
                        {collabCopied ? <CheckCheck size={14} className="text-primary" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* CTA button */}
                {(collabMethod === "link" || collabMethod === "both") && (
                  <Button
                    onClick={handleCollabAccess}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
                  >
                    <Link2 size={15} /> המשיכו לרכישה מאומתת
                  </Button>
                )}
              </div>

              {/* Disclosure */}
              <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                <Info size={11} className="mt-0.5 shrink-0" />
                <span>
                  לשקיפות מלאה: רכישות דרך קישור זה עוברות דרך תשתית האימות של ReviewHub ומסייעות לאמת ביקורות עתידיות. ReviewHub עשויה לקבל אות תפעולי מרכישה זו. פעולה זו אינה משפיעה על ציון האמון האובייקטיבי של הספק.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Prestige Badges ─────────────────────────────────────────────── */}
        <EarnedBadgesSection
          slug={business.slug}
          name={business.name}
          rating={business.rating}
          verifiedCount={totalVerified}
          type={business.type}
          category={business.category}
        />

        {/* Courses */}
        {courses.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl mb-4">קורסים ({courses.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CourseCard {...course} />
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
          />
        )}

        {/* Testimonial Videos/Images */}
        {dbBusinessId && <TestimonialCarousel businessId={dbBusinessId} />}

        {/* Add Review */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-1">תרמו לאמינות הכלכלה הדיגיטלית</h2>
          <p className="text-sm text-muted-foreground mb-4">
            ביקורת מאומתת רכישה נספרת בציון האמון ומוצגת ראשונה. משוב קהילה מוצג בנפרד ואינו נספר בחישוב.
          </p>
          <AddReviewForm
            businessSlug={business.slug}
            businessName={business.name}
            businessId={dbBusinessId || undefined}
            isVerifiedPurchaser={false}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            REVIEW SOURCE BREAKDOWN — dual-purpose: stats + filter
            Clicking a source chip filters the sections below.
        ══════════════════════════════════════════════════════════════════ */}
        <ReviewSourceBreakdown
          verifiedCount={totalVerified}
          communityCount={totalOpen}
          googleCount={googleReviews.length}
          whatsappCount={whatsappReviews.length}
          facebookCount={facebookReviews.length}
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
                <div className="space-y-4">
                  {verifiedFiltered.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ReviewCard {...review} reviewTier="verified" />
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
                <div className="space-y-4">
                  {openFiltered.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ReviewCard {...review} reviewTier="open" />
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
                      ביקורות מ-Google, WhatsApp או Facebook זמינות למטה.
                      ביקורות מאומתות רכישה עדיין לא התקבלו.
                    </p>
                  </>
                )}

                {/* Case 3: WhatsApp/FB but no verified purchase */}
                {hasWAButNoVerified && sourceFilter === "verified_purchase" && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                      <ShieldCheck size={22} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-foreground">משוב לקוחות זמין</p>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      משוב WhatsApp ו-Facebook זמין. ביקורות מאומתות רכישה יוצגו
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
              reviews={googleReviews}
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
            <WhatsAppReviewsSection reviews={whatsappReviews} />
          </div>
        )}

        {/* ── Tier 3b: Facebook Reviews ────────────────────────────────────────
            Imported from Facebook. Treated as T3 (same as Google).
        ─────────────────────────────────────────────────────────────────── */}
        {showFBSection && (
          <div className={showNativeSection || showGoogleSection || showWASection ? "mt-6 border-t border-border/30 pt-6" : "mt-4"}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 rounded-full px-1.5 py-0.5 font-semibold">
                T3 · מקור חיצוני
              </span>
              <span className="text-xs text-muted-foreground">ביקורות Facebook אינן חלק מציון האמון של ReviewHub</span>
            </div>
            <FacebookReviewsSection
              reviews={facebookReviews}
              pageUrl={facebookPageUrl}
              pageName={facebookPageName}
            />
          </div>
        )}

        {/* ── Empty state when filter shows a source with no data ─────────────── */}
        {!showNativeSection && !showGoogleSection && !showWASection && !showFBSection && (
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

      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfile;

// ── TrustHub ──────────────────────────────────────────────────────────────────
// Full trust-center panel rendered on every business profile page.
// Provides: verification statistics, business contact info, moderation
// status (when relevant), and a trust-tier legend — the canonical single
// source of truth for how trustworthy a business is on ReviewHub.

interface TrustHubProps {
  business: Business;
  trustStatus: BusinessTrustStatus;
  trustStatusReason: string | null;
  totalVerified: number;
  totalOpen: number;
  isOwner: boolean;
}

function TrustHub({
  business,
  trustStatus,
  trustStatusReason,
  totalVerified,
  totalOpen,
  isOwner,
}: TrustHubProps) {
  const [expanded, setExpanded] = useState(false);

  const totalReviews = totalVerified + totalOpen;
  const verifiedPct = totalReviews > 0
    ? Math.round((totalVerified / totalReviews) * 100)
    : 0;

  // Derive tier label + colour from rating + verified count
  const tier: { label: string; color: string; bg: string } = (() => {
    const { rating, verifiedReviewCount } = business;
    const vc = verifiedReviewCount ?? totalVerified;
    if (rating >= 4.5 && vc >= 10) return { label: "Elite",         color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" };
    if (rating >= 4.0 && vc >= 5)  return { label: "Highly Trusted", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    if (rating >= 3.5 && vc >= 3)  return { label: "Trusted",        color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" };
    if (vc > 0)                    return { label: "Emerging",       color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    return                               { label: "Unrated",         color: "text-muted-foreground", bg: "bg-muted/30 border-border/40" };
  })();

  const hasContact = !!(business.website || business.email || business.phone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8 rounded-xl border border-border/40 bg-card/50 overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-primary shrink-0" />
          <span className="font-display font-semibold text-sm text-foreground">
            מרכז האמון
          </span>
          {/* Inline trust tier chip */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
            {tier.label}
          </span>
          {/* Moderation status chip — shown always when non-normal */}
          <BusinessTrustStatusBadge status={trustStatus} variant="badge" />
        </div>
        <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
          {expanded ? "הסתר" : "הצג פרטים"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* ── Stats strip — always visible ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 border-t border-border/30">
        {[
          { label: "ביקורות מאומתות", value: String(totalVerified), icon: <CheckCircle2 size={13} className="text-primary" /> },
          { label: "משובי קהילה",     value: String(totalOpen),    icon: <MessageSquare size={13} className="text-muted-foreground" /> },
          { label: "אחוז אימות",       value: `${verifiedPct}%`,     icon: <BarChart3 size={13} className="text-primary" /> },
          { label: "דירוג ממוצע",      value: business.rating > 0 ? business.rating.toFixed(1) : "—", icon: <Star size={13} className="text-amber-500" /> },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center justify-center gap-1 bg-card/40 py-3 px-2">
            <div className="flex items-center gap-1">
              {stat.icon}
              <span className="font-display font-bold text-base text-foreground">{stat.value}</span>
            </div>
            <span className="text-[10px] text-muted-foreground text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Expanded content ───────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="trusthub-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4 border-t border-border/30">

              {/* Business Info */}
              {hasContact && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    פרטי התקשרות
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={11} />
                        {business.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {business.email && (
                      <a
                        href={`mailto:${business.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <MessageSquare size={11} />
                        {business.email}
                      </a>
                    )}
                    {business.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={11} />
                        {business.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Verification explanation */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  כיצד מחושב ציון האמון?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ציון האמון של ReviewHub מחושב אך ורק על סמך <strong className="text-foreground">ביקורות מאומתות רכישה</strong> — ביקורות שנכתבו לאחר הגשת הוכחת רכישה ממשית.
                  משובי קהילה (ללא הוכחת רכישה) מוצגים בנפרד ואינם נכללים בחישוב.
                  ככל שאחוז האימות גבוה יותר, כך הציון אמין יותר.
                </p>
              </div>

              {/* Moderation status — extended detail when non-normal */}
              {trustStatus !== "normal" && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    סטטוס מודרציה
                  </p>
                  <BusinessTrustStatusBadge
                    status={trustStatus}
                    reason={trustStatusReason ?? undefined}
                    variant="banner"
                    isOwner={isOwner}
                  />
                </div>
              )}

              {/* Owner response rate */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  מדיניות תגובות בעל העסק
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  בעל העסק רשאי להגיב לכל ביקורת. תגובות מוצגות מתחת לביקורת המקורית
                  ומסומנות "תגובת בעל העסק" כדי לשמור על שקיפות מלאה.
                </p>
              </div>

              {/* Report abuse link */}
              <div className="pt-1 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground/60 leading-snug">
                  מצאתם ביקורת חשודה?{" "}
                  <a href="mailto:trust@reviewhub.co.il" className="text-primary hover:underline">
                    דווחו לצוות האמון
                  </a>{" "}
                  — כל דוח נבחן ידנית תוך 48 שעות.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── EarnedBadgesSection ────────────────────────────────────────────────────────
// Shown on the profile page when the business qualifies for ≥1 prestige badge.
// Renders live badge previews + copy-paste embed code per badge.

interface EarnedBadgesSectionProps {
  slug: string;
  name: string;
  rating: number;
  verifiedCount: number;
  type: string;
  category: string;
}

function BadgeEmbedPanel({ slug, type, grade, rating }: {
  slug: string;
  type: import("@/components/PrestigeBadge").PrestigeBadgeType;
  grade: string;
  rating: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = BADGE_CONFIG[type];
  const snippet = buildBadgeEmbedCode(type, slug, grade);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-4 flex flex-col gap-3">
      {/* Badge preview */}
      <div className="flex items-center justify-center py-3">
        <PrestigeBadge type={type} slug={slug} name="" grade={grade} rating={rating} size="md" noLink />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{cfg.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.sublabel}</p>
      </div>

      {/* Embed toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[11px] font-medium text-primary/70 hover:text-primary transition-colors text-center"
      >
        {open ? "הסתר קוד הטמעה" : "קוד הטמעה לאתר שלכם"}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/40 bg-muted/30">
                <span className="text-[9px] font-mono text-muted-foreground/60">embed.html</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <CheckCheck size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copied ? "הועתק!" : "העתק"}
                </button>
              </div>
              <pre className="p-3 text-[9px] leading-relaxed overflow-x-auto text-primary/80 bg-muted/20 whitespace-pre-wrap">
                <code>{snippet}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EarnedBadgesSection({ slug, name, rating, verifiedCount, type, category }: EarnedBadgesSectionProps) {
  const eligibleBadges = useMemo(
    () => computeEligibleBadges({ rating, verifiedCount, type, category }),
    [rating, verifiedCount, type, category],
  );

  if (eligibleBadges.length === 0) return null;

  // Compute grade string for embed code
  const grade = (() => {
    if (rating >= 4.7 && verifiedCount >= 10) return "A+";
    if (rating >= 4.3 && verifiedCount >= 5)  return "A";
    if (rating >= 3.8 && verifiedCount >= 3)  return "B";
    if (rating >= 3.2)                         return "C";
    if (rating >= 2.5)                         return "D";
    return verifiedCount > 0 ? "F" : "—";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <h2 className="font-display font-semibold text-base text-foreground">
            תגי פרסטיז׳ שהוענקו לרשומה זו
          </h2>
        </div>
        <Link
          to="/partners/prestige-badges"
          className="text-[11px] text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
        >
          מה זה? <ExternalLink size={10} />
        </Link>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        תגי פרסטיז׳ מוענקים אוטומטית לפי ציון האמון. הציגו אותם באתר שלכם — כל לחיצה על התג מחזירה ללקוח לפרופיל זה לאימות עצמאי.
      </p>

      <div className={`grid gap-4 ${eligibleBadges.length === 1 ? "grid-cols-1 max-w-xs" : eligibleBadges.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-xl" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {eligibleBadges.map(badgeType => (
          <BadgeEmbedPanel
            key={badgeType}
            slug={slug}
            type={badgeType}
            grade={grade}
            rating={rating}
          />
        ))}
      </div>
    </motion.div>
  );
}

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
  Icon:  React.FC<{ size?: number; className?: string }>;
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

// ── AffiliatePurchaseSection ──────────────────────────────────────────────────
// Shown on the business profile page when the business has an active affiliate
// program.  Gives visitors a clear, transparent purchase path:
//   reviewhub_model    → one-click button → /go/:slug → auto 5% discount
//   personal_affiliate → button(s) → direct external URLs
// All routing still passes through /go/:slug so click tracking is consistent.

interface AffiliatePurchaseSectionProps {
  mode:          "reviewhub_model" | "personal_affiliate" | "none";
  slug:          string;
  businessName:  string;
  personalUrls:  string[];
  dbBusinessId:  string | null;
}

function AffiliatePurchaseSection({ mode, slug, businessName, personalUrls, dbBusinessId }: AffiliatePurchaseSectionProps) {
  if (mode === "none") return null;

  const validUrls = personalUrls.filter(u => u.trim());

  const handleGoLink = async () => {
    // Record click then open the /go/ redirect page
    if (dbBusinessId) {
      await supabase.from("referral_clicks").insert({
        business_id: dbBusinessId,
        business_slug: slug,
        referrer: document.referrer || null,
      }).catch(() => {/* non-blocking */});
    }
    window.open(`/go/${slug}`, "_blank", "noopener,noreferrer");
  };

  if (mode === "reviewhub_model") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-8 rounded-xl border border-primary/30 bg-gradient-to-l from-primary/[0.07] via-background to-background overflow-hidden"
      >
        <div className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-display font-bold text-base text-foreground">
                  קנו עם הנחה דרך ReviewHub
                </p>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">
                  5% הנחה אוטומטית
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                הגעתם לפרופיל זה דרך ReviewHub? כשתרכשו דרך הכפתור הזה, קוד{" "}
                <code className="font-mono font-bold text-primary">RH5</code> יופעל
                אוטומטית בקופה — 5% הנחה על המחיר המלא.
              </p>
            </div>
            <Button
              onClick={handleGoLink}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
            >
              <ShoppingBag size={15} />
              לרכישה עם הנחה
            </Button>
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>
              גילוי נאות: רכישות דרך קישור זה עוברות דרך תשתית המעקב של ReviewHub. ReviewHub גובה 5% עמלת פלטפורם לאחר אישור הרכישה. פעולה זו אינה משפיעה על ציון האמון האובייקטיבי של הספק.
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // personal_affiliate — one or multiple URLs
  if (validUrls.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="mb-8 rounded-xl border border-border/50 bg-card/60 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Link2 size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-foreground">
              {validUrls.length === 1 ? "קישור רכישה" : "קישורי רכישה"}
            </p>
            <p className="text-sm text-muted-foreground">
              {validUrls.length === 1
                ? `${businessName} משתמש במערכת שותפים עצמאית`
                : `${businessName} מציע ${validUrls.length} קישורי רכישה`
              }
            </p>
          </div>
        </div>

        {validUrls.length === 1 ? (
          // Single URL — prominent button
          <Button
            onClick={handleGoLink}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto"
          >
            <ExternalLink size={15} />
            לרכישה
          </Button>
        ) : (
          // Multiple URLs — labeled card per link
          <div className="space-y-2">
            {validUrls.map((url, index) => {
              let hostname = url;
              try { hostname = new URL(url).hostname.replace("www.", ""); } catch { /* keep raw */ }
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2.5"
                >
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    {index === 0 ? (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                        ראשי
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{hostname}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{url.length > 55 ? url.slice(0, 55) + "…" : url}</p>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-2.5 py-1.5 rounded-lg"
                    onClick={async () => {
                      if (dbBusinessId) {
                        await supabase.from("referral_clicks").insert({
                          business_id: dbBusinessId, business_slug: slug,
                          referrer: document.referrer || null,
                        }).catch(() => {});
                      }
                    }}
                  >
                    <ExternalLink size={11} />
                    לרכישה
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
          <Info size={11} className="mt-0.5 shrink-0" />
          <span>
            גילוי נאות: הספק משתמש במערכת שותפים עצמאית. ReviewHub אינה גובה עמלה על הפניות אלו ואינה אחראית לתנאי העסקה. הרכישה מתבצעת ישירות אצל הספק.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

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
