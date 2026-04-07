import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ShieldCheck, Sparkles, Link2, TrendingUp, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SocialLinksEditor, { type SocialLinksData } from "@/components/SocialLinksEditor";
import PrivacyConsentCheckbox from "@/components/PrivacyConsentCheckbox";
import FormPrivacyNotice from "@/components/FormPrivacyNotice";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import AffiliateOptInCard, { type AffiliateMode } from "@/components/AffiliateOptInCard";
import { type PricingModel, PRICING_MODEL_LABELS } from "@/data/mockData";

const OTHER_VALUE = "__other__";

// ── Field length limits ────────────────────────────────────────────────────────
const BUSINESS_NAME_MAX   = 100;
const DESCRIPTION_MAX     = 2000;
const CUSTOM_CATEGORY_MAX = 100;
const FOUNDER_NAME_MAX    = 100;

type BusinessType = "freelancer" | "course-provider" | "saas";

// Map form business type → useCategories key
const TYPE_TO_CATEGORY_KEY: Record<BusinessType, "freelancer" | "course" | "saas"> = {
  "freelancer":      "freelancer",
  "course-provider": "course",
  "saas":            "saas",
};

const BusinessRegister = () => {
  const { toast } = useToast();
  const { user, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const { data: freelancerCats = [] } = useCategories("freelancer");
  const { data: courseCats = [] }     = useCategories("course");
  const { data: saasCats = [] }       = useCategories("saas");

  const [form, setForm] = useState({
    businessName: "",
    website: "",
    email: "",
    phone: "",
    category: "",
    customCategory: "",
    businessType: "freelancer" as BusinessType,
    description: "",
    founderName: "",
    pricingModel: "" as PricingModel | "",
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({});
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [affiliateMode,          setAffiliateMode]          = useState<AffiliateMode>("none");
  const [personalAffiliateUrls,  setPersonalAffiliateUrls]  = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  // Guard: redirect if user already has a registered business
  useEffect(() => {
    if (!user) return;
    supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate("/business/dashboard");
        }
      });
  }, [user, navigate]);

  // Derive category list from selected business type
  const allCatsForType: string[] = (() => {
    if (form.businessType === "freelancer")      return freelancerCats;
    if (form.businessType === "course-provider") return courseCats;
    return saasCats;
  })();
  const filteredCategories = allCatsForType.filter(c => c !== "אחר");

  const canEditSocials = subscriptionTier === "pro" || subscriptionTier === "enterprise";
  const isSaas = form.businessType === "saas";

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const updateSocial = (key: keyof SocialLinksData, value: string) => setSocialLinks(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryParts = form.category ? form.category.split(",").map(s => s.trim()).filter(Boolean) : [];
    if (!form.businessName || !form.email || (categoryParts.length === 0 && !form.customCategory)) {
      toast({ title: "אנא מלאו את כל השדות הנדרשים", variant: "destructive" });
      return;
    }
    if (!privacyConsent) {
      toast({ title: "יש לאשר את מדיניות הפרטיות ותנאי השימוש", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "יש להתחבר כדי לרשום עסק", variant: "destructive" });
      navigate("/business/login", { state: { from: "/register" } });
      return;
    }

    setSubmitting(true);

    // ── URL validation ─────────────────────────────────────────────────────────
    const websiteInput = canEditSocials ? (socialLinks.website || form.website) : form.website;
    if (websiteInput && !sanitizeUrl(websiteInput)) {
      toast({ title: "כתובת האתר אינה תקינה", description: "יש להזין כתובת http:// או https:// בלבד", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // ── Sanitize freeform text fields ──────────────────────────────────────────
    const cleanBusinessName   = sanitizeText(form.businessName,  BUSINESS_NAME_MAX);
    const cleanDescription    = sanitizeText(form.description,   DESCRIPTION_MAX);
    const cleanCustomCategory = sanitizeText(form.customCategory, CUSTOM_CATEGORY_MAX);
    const cleanFounderName    = sanitizeText(form.founderName,   FOUNDER_NAME_MAX);

    const catParts = form.category ? form.category.split(",").map(s => s.trim()).filter(Boolean) : [];
    const hasOtherCat = catParts.includes(OTHER_VALUE);
    const cleanCats = catParts.filter(c => c !== OTHER_VALUE);
    if (hasOtherCat && cleanCustomCategory.trim()) cleanCats.push("אחר");
    // category is NOT NULL in the schema. Fall back to "אחר" if no valid
    // category was selected so the insert never fails on the constraint.
    const finalCategory = cleanCats.join(",") || "אחר";
    const hasCustomCategory = hasOtherCat && cleanCustomCategory.trim().length > 0;

    const slug = cleanBusinessName
      .toLowerCase()
      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Date.now().toString(36);

    // Build social_links JSON only if user has paid tier
    const socialLinksJson = canEditSocials
      ? Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v && v.trim()))
      : {};

    try {
      const insertPayload: Record<string, unknown> = {
        name: cleanBusinessName,
        slug,
        category: finalCategory,
        owner_id: user.id,
        email: form.email,
        phone: form.phone || null,
        website: sanitizeUrl(canEditSocials ? (socialLinks.website || form.website) : form.website) || null,
        description: cleanDescription || null,
        social_links: socialLinksJson,
        founder_name: cleanFounderName || null,
        // Affiliate program — three-mode field
        affiliate_mode: affiliateMode,
        // Singular URL — only column that exists in the schema
        personal_affiliate_url: affiliateMode === "personal_affiliate"
          ? (personalAffiliateUrls.find(u => u.trim()) ?? null)
          : null,
        affiliate_enrolled:        affiliateMode === "reviewhub_model",
        affiliate_enrolled_at:     affiliateMode === "reviewhub_model" ? new Date().toISOString() : null,
        affiliate_program_status:  affiliateMode === "reviewhub_model" ? "enrolled" :
                                   affiliateMode === "personal_affiliate" ? "enrolled" : "declined",
      };

      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .insert(insertPayload as any)
        .select("id")
        .single();

      if (bizError) throw bizError;

      // If custom category, call evaluate-category edge function
      if (hasCustomCategory && biz) {
        const evalType = TYPE_TO_CATEGORY_KEY[form.businessType];
        const { data: evalData, error: evalError } = await supabase.functions.invoke("evaluate-category", {
          body: {
            suggested_name: cleanCustomCategory.trim(),
            type: evalType,
            business_id: biz.id,
          },
        });

        if (!evalError && evalData) {
          if (evalData.status === "already_exists" || evalData.status === "approved" || evalData.status === "mapped_to_existing") {
            await supabase.from("businesses").update({ category: evalData.category }).eq("id", biz.id);
          }
        }
      }

      // Success — show different toast based on affiliate mode chosen
      if (affiliateMode === "reviewhub_model") {
        toast({
          title: "העסק נרשם בהצלחה! 🎉",
          description: `הצטרפתם למודל 5/5 של ReviewHub. הקישור שלכם: reviewshub.info/go/${slug}`,
        });
      } else if (affiliateMode === "personal_affiliate") {
        toast({
          title: "העסק נרשם בהצלחה! 🎉",
          description: "קישור השותפים האישי הוגדר. ניתן לעדכנו בכל עת מלוח הבקרה.",
        });
      } else {
        toast({
          title: "העסק נרשם בהצלחה! 🎉",
          description: "תוכלו להגדיר תוכנית שותפים בכל עת מלוח הבקרה תחת 'הגדרות שותפים'.",
        });
      }

      // Always navigate to dashboard after successful registration
      navigate("/business/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast({ title: "שגיאה ברישום", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-primary" />
            </div>
            <h1 className="font-display font-bold text-3xl text-foreground mb-2">הרשמת עסק חדש</h1>
            <p className="text-muted-foreground">הצטרפו ל-ReviewHub ובנו אמון אמיתי עם ביקורות מאומתות מלקוחות שרכשו בפועל</p>
          </div>

          <Card className="shadow-card animated-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                פרטי העסק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Business Name */}
                <div>
                  <Label className="mb-2 block">שם העסק *</Label>
                  <Input
                    placeholder="לדוגמה: אקדמיית שיווק דיגיטלי"
                    value={form.businessName}
                    onChange={e => { if (e.target.value.length <= BUSINESS_NAME_MAX) update("businessName", e.target.value); }}
                    maxLength={BUSINESS_NAME_MAX}
                    className="glass border-border/50"
                  />
                </div>

                {/* Business Type */}
                <div>
                  <Label className="mb-2 block">סוג העסק *</Label>
                  <Select value={form.businessType} onValueChange={v => { update("businessType", v); update("category", ""); update("pricingModel", ""); }}>
                    <SelectTrigger className="glass border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelancer">בעל מקצוע / פרילנסר</SelectItem>
                      <SelectItem value="course-provider">ספק קורסים / מוסד לימודים</SelectItem>
                      <SelectItem value="saas">SaaS / כלי דיגיטלי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category — multi-select up to 5 */}
                <div>
                  <Label className="mb-2 block">קטגוריות (עד 5) *</Label>
                  <p className="text-xs text-muted-foreground mb-2">בחרו את התחומים הרלוונטיים לעסק שלכם</p>
                  {(() => {
                    const selected = form.category ? form.category.split(",").map(s => s.trim()).filter(s => s && s !== OTHER_VALUE) : [];
                    const hasOther = form.category?.includes(OTHER_VALUE);
                    const toggle = (cat: string) => {
                      if (cat === OTHER_VALUE) {
                        const next = hasOther ? selected : [...selected, OTHER_VALUE];
                        update("category", next.join(","));
                        if (hasOther) update("customCategory", "");
                        return;
                      }
                      const next = selected.includes(cat) ? selected.filter(c => c !== cat) : selected.length < 5 ? [...selected, cat] : selected;
                      const parts = hasOther ? [...next, OTHER_VALUE] : next;
                      update("category", parts.join(","));
                    };
                    return (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-md border border-border/50 glass p-3" dir="rtl">
                        <div className="flex flex-wrap gap-1.5">
                          {filteredCategories.map(c => {
                            const active = selected.includes(c);
                            const disabled = !active && selected.length >= 5;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => !disabled && toggle(c)}
                                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${active ? "bg-primary text-primary-foreground" : disabled ? "bg-muted/30 text-muted-foreground/40 cursor-not-allowed" : "bg-muted/50 text-foreground hover:bg-muted/70"}`}
                              >
                                {c}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => toggle(OTHER_VALUE)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${hasOther ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground hover:bg-muted/70"}`}
                          >
                            <Sparkles size={12} /> אחר
                          </button>
                        </div>
                        {(selected.length > 0 || hasOther) && (
                          <p className="text-xs text-muted-foreground pt-1">{selected.length} / 5 נבחרו</p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Custom category input */}
                {form.category === OTHER_VALUE && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="mb-2 block">שם הקטגוריה החדשה *</Label>
                    <Input
                      placeholder="לדוגמה: מסחר בשוק ההון, אימון אישי, ניהול מוצר..."
                      value={form.customCategory}
                      onChange={e => { if (e.target.value.length <= CUSTOM_CATEGORY_MAX) update("customCategory", e.target.value); }}
                      maxLength={CUSTOM_CATEGORY_MAX}
                      className="glass border-border/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Sparkles size={12} className="text-primary" />
                      הקטגוריה תתווסף אוטומטית לאתר אחרי ש-3 עסקים יבקשו אותה.
                    </p>
                  </motion.div>
                )}

                {/* Founder Name */}
                <div>
                  <Label className="mb-2 block flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    שם המייסד / איש הקשר
                  </Label>
                  <Input
                    placeholder="לדוגמה: ישראל ישראלי"
                    value={form.founderName}
                    onChange={e => { if (e.target.value.length <= FOUNDER_NAME_MAX) update("founderName", e.target.value); }}
                    maxLength={FOUNDER_NAME_MAX}
                    className="glass border-border/50"
                  />
                </div>

                {/* Pricing Model — SaaS only */}
                {isSaas && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="mb-2 block">מודל תמחור</Label>
                    <Select value={form.pricingModel} onValueChange={v => update("pricingModel", v)}>
                      <SelectTrigger className="glass border-border/50">
                        <SelectValue placeholder="בחרו מודל תמחור" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(PRICING_MODEL_LABELS) as [PricingModel, string][]).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <Label className="mb-2 block">אימייל *</Label>
                  <Input type="email" placeholder="info@yourbusiness.co.il" value={form.email} onChange={e => update("email", e.target.value)} className="glass border-border/50" />
                </div>

                {/* Phone */}
                <div>
                  <Label className="mb-2 block">טלפון</Label>
                  <Input placeholder="03-1234567" value={form.phone} onChange={e => update("phone", e.target.value)} className="glass border-border/50" />
                </div>

                {/* Website field for free users */}
                {!canEditSocials && (
                  <div>
                    <Label className="mb-2 block">אתר אינטרנט</Label>
                    <Input placeholder="https://yourbusiness.co.il" value={form.website} onChange={e => update("website", e.target.value)} className="glass border-border/50" />
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="mb-2 block">תיאור העסק</Label>
                  <Textarea
                    placeholder={isSaas ? "ספרו על הכלי, מה הוא עושה ולמי הוא מיועד..." : "ספרו על העסק, הקורסים והשירותים שלכם..."}
                    value={form.description}
                    onChange={e => { if (e.target.value.length <= DESCRIPTION_MAX) update("description", e.target.value); }}
                    maxLength={DESCRIPTION_MAX}
                    rows={4}
                    className="glass border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left">
                    {form.description.length}/{DESCRIPTION_MAX}
                  </p>
                </div>

                {/* Social Links Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={18} className="text-primary" />
                    <Label className="font-display font-semibold text-base">רשתות חברתיות ואתר</Label>
                  </div>
                  <SocialLinksEditor
                    values={socialLinks}
                    onChange={updateSocial}
                    locked={!canEditSocials}
                  />
                </div>

                <PrivacyConsentCheckbox
                  checked={privacyConsent}
                  onCheckedChange={setPrivacyConsent}
                />

                <FormPrivacyNotice className="mt-1" />

                {/* ── Affiliate opt-in sits here, inside the form, so every
                    user sees it before reaching the submit button ──────── */}
                <div className="border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="font-display font-semibold text-sm text-foreground">
                      תוכנית שותפים — אופציונלי
                    </span>
                  </div>
                  <AffiliateOptInCard
                    mode={affiliateMode}
                    personalAffiliateUrls={personalAffiliateUrls}
                    onChange={setAffiliateMode}
                    onUrlsChange={setPersonalAffiliateUrls}
                    businessSlug={
                      form.businessName
                        ? form.businessName
                            .toLowerCase()
                            .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "")
                            .replace(/\s+/g, "-")
                            .slice(0, 30)
                        : undefined
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                  size="lg"
                  disabled={!privacyConsent || submitting}
                >
                  {submitting ? "רושם את העסק..." : "הרשמה ויצירת פרופיל"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessRegister;
