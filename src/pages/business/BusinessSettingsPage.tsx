/**
 * BusinessSettingsPage.tsx  (v2 — premium SaaS redesign)
 *
 * Comprehensive settings page for business owners on ReviewHub.
 *
 * Architecture:
 *  • activeSection state drives the visible content panel — sidebar nav is
 *    properly wired (not decorative).
 *  • Business summary card lives at the top of the sidebar.
 *  • 5 sections: Business Profile · Contact & Social · Security ·
 *    Notifications · Account Management
 *  • Mobile: horizontal scrollable pill nav.
 *  • All data-fetching and business logic from v1 is preserved.
 *
 * Protected route — redirects unauthenticated users to /business/login
 * Full RTL Hebrew support · dark zinc/blue theme (Business Portal palette)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import BusinessNavbar from "@/components/BusinessNavbar";
import BusinessFooter from "@/components/BusinessFooter";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import ImageUploadField from "@/components/ImageUploadField";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import {
  Mail,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Music,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Loader2,
  BarChart3,
  Star,
  MessageSquare,
  Building2,
  Users,
  Settings,
  Link2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category?: string;
  email: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  cover_url?: string;
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
  };
  founder_name?: string;
  subscription_tier?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationPrefs {
  newReview: boolean;
  reviewNeedsResponse: boolean;
  weeklyAIReport: boolean;
  systemUpdates: boolean;
  monthlyDigest: boolean;
}

interface PasswordFormData {
  current: string;
  new: string;
  confirm: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section type + nav items
// ─────────────────────────────────────────────────────────────────────────────

type Section = "profile" | "contact" | "security" | "notifications" | "account";

const NAV_ITEMS: { id: Section; icon: React.ElementType; label: string }[] = [
  { id: "profile",       icon: Building2, label: "פרופיל עסקי"    },
  { id: "contact",       icon: Phone,     label: "פרטי קשר"       },
  { id: "security",      icon: Lock,      label: "אבטחה"           },
  { id: "notifications", icon: Bell,      label: "התראות"          },
  { id: "account",       icon: Settings,  label: "ניהול חשבון"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8)        strength++;
  if (password.length >= 12)       strength++;
  if (/[A-Z]/.test(password))      strength++;
  if (/[0-9]/.test(password))      strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;
  if (strength <= 1) return { label: "חלשה",   color: "text-red-400",    bars: 1 };
  if (strength <= 2) return { label: "בינונית", color: "text-yellow-400", bars: 2 };
  if (strength <= 3) return { label: "טובה",    color: "text-blue-400",   bars: 3 };
  return               { label: "חזקה",    color: "text-green-400",  bars: 4 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Section: Business Profile
// ─────────────────────────────────────────────────────────────────────────────

const ProfileSection = ({
  business,
  profileForm,
  setProfileForm,
  onSave,
  saving,
}: {
  business: Business;
  profileForm: { name: string; description: string; category: string; founder_name: string; logo_url: string; cover_url: string };
  setProfileForm: React.Dispatch<React.SetStateAction<typeof profileForm>>;
  onSave: () => Promise<void>;
  saving: boolean;
}) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold text-white mb-1">פרופיל עסקי</h2>
      <p className="text-sm text-zinc-400">עדכנו את פרטי העסק שיוצגו לציבור</p>
    </div>

    {/* Cover */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-zinc-300">תמונת כריכה</Label>
      <ImageUploadField
        value={profileForm.cover_url}
        onChange={(url) => setProfileForm({ ...profileForm, cover_url: url })}
        bucket="covers"
        storagePath={`${business.owner_id}/cover`}
        shape="rect"
        placeholder="לחצו להעלאת תמונת כריכה"
      />
    </div>

    {/* Logo */}
    <div className="space-y-2">
      <Label className="text-sm font-medium text-zinc-300">לוגו</Label>
      <div className="flex items-center gap-5">
        <ImageUploadField
          value={profileForm.logo_url}
          onChange={(url) => setProfileForm({ ...profileForm, logo_url: url })}
          bucket="avatars"
          storagePath={`${business.owner_id}/logo`}
          shape="circle"
          placeholder="לוגו"
        />
        <div className="text-xs text-zinc-400 space-y-1">
          <p>גודל מומלץ: 400×400 פיקסל</p>
          <p>פורמטים: JPG, PNG, WebP</p>
          <p>מקסימום: 5MB</p>
        </div>
      </div>
    </div>

    <Separator className="bg-zinc-700/40" />

    {/* Business name */}
    <div className="space-y-2 max-w-md">
      <Label htmlFor="biz-name" className="text-sm font-medium text-zinc-300">שם העסק</Label>
      <Input
        id="biz-name"
        value={profileForm.name}
        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
        placeholder="שם העסק"
        className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
      />
    </div>

    {/* Description */}
    <div className="space-y-2 max-w-lg">
      <Label htmlFor="biz-desc" className="text-sm font-medium text-zinc-300">תיאור העסק</Label>
      <Textarea
        id="biz-desc"
        value={profileForm.description}
        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
        placeholder="תיאור קצר של העסק שלכם"
        rows={4}
        className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500 resize-none"
      />
    </div>

    {/* Category (read-only) */}
    {profileForm.category && (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-300">קטגוריה</Label>
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-200 text-sm">{profileForm.category}</Badge>
      </div>
    )}

    {/* Founder name */}
    <div className="space-y-2 max-w-md">
      <Label htmlFor="founder" className="text-sm font-medium text-zinc-300">שם המייסד</Label>
      <Input
        id="founder"
        value={profileForm.founder_name}
        onChange={(e) => setProfileForm({ ...profileForm, founder_name: e.target.value })}
        placeholder="שם המייסד או הבעלים"
        className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
      />
    </div>

    <div className="pt-2">
      <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />שומר...</> : <><Save className="w-4 h-4" />שמרו שינויים</>}
      </Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section: Contact & Social
// ─────────────────────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: "facebook",  icon: Facebook,  label: "Facebook",  placeholder: "https://facebook.com/..." },
  { key: "instagram", icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "linkedin",  icon: Linkedin,  label: "LinkedIn",  placeholder: "https://linkedin.com/..." },
  { key: "twitter",   icon: Twitter,   label: "Twitter / X", placeholder: "https://twitter.com/..." },
  { key: "tiktok",    icon: Music,     label: "TikTok",    placeholder: "https://tiktok.com/@..." },
] as const;

const ContactSection = ({
  contactForm,
  setContactForm,
  onSave,
  saving,
}: {
  contactForm: { email: string; phone: string; website: string; personal_affiliate_url: string; social_links: Record<string, string> };
  setContactForm: React.Dispatch<React.SetStateAction<typeof contactForm>>;
  onSave: () => Promise<void>;
  saving: boolean;
}) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold text-white mb-1">פרטי קשר</h2>
      <p className="text-sm text-zinc-400">עדכנו את פרטי הקשר של העסק</p>
    </div>

    <div className="space-y-5 max-w-md">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="c-email" className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />אימייל
        </Label>
        <Input
          id="c-email"
          type="email"
          value={contactForm.email}
          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
          placeholder="your@business.com"
          className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="c-phone" className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />טלפון
        </Label>
        <Input
          id="c-phone"
          value={contactForm.phone}
          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
          placeholder="+972..."
          className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="c-web" className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />אתר רשמי
        </Label>
        <Input
          id="c-web"
          value={contactForm.website}
          onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
          placeholder="https://example.com"
          className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Affiliate link */}
      <div className="space-y-2">
        <Label htmlFor="c-affiliate" className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />קישור שיווק שותפים
        </Label>
        <Input
          id="c-affiliate"
          type="url"
          value={contactForm.personal_affiliate_url}
          onChange={(e) => setContactForm({ ...contactForm, personal_affiliate_url: e.target.value })}
          placeholder="https://your-affiliate-link.com/ref=..."
          className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
          dir="ltr"
        />
        <p className="text-[11px] text-zinc-500">
          הוסיפו קישור ייחודי לרכישה דרככם (Affiliate Link) — יוצג בעמוד העסק הציבורי שלכם
        </p>
      </div>
    </div>

    <Separator className="bg-zinc-700/40" />

    {/* Social links */}
    <div className="space-y-4 max-w-md">
      <h3 className="text-sm font-semibold text-white">רשתות חברתיות</h3>
      {SOCIAL_PLATFORMS.map(({ key, icon: Icon, label, placeholder }) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`social-${key}`} className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />{label}
          </Label>
          <Input
            id={`social-${key}`}
            value={contactForm.social_links[key] || ""}
            onChange={(e) =>
              setContactForm({
                ...contactForm,
                social_links: { ...contactForm.social_links, [key]: e.target.value },
              })
            }
            placeholder={placeholder}
            className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500"
          />
        </div>
      ))}
    </div>

    <div className="pt-2">
      <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />שומר...</> : <><Save className="w-4 h-4" />שמרו שינויים</>}
      </Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section: Security
// ─────────────────────────────────────────────────────────────────────────────

const SecuritySection = ({
  userEmail,
  passwordForm,
  setPasswordForm,
  showPasswords,
  setShowPasswords,
  onChangePassword,
  changingPassword,
}: {
  userEmail: string;
  passwordForm: PasswordFormData;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormData>>;
  showPasswords: { current: boolean; new: boolean; confirm: boolean };
  setShowPasswords: React.Dispatch<React.SetStateAction<typeof showPasswords>>;
  onChangePassword: () => Promise<void>;
  changingPassword: boolean;
}) => {
  const strength = passwordForm.new ? getPasswordStrength(passwordForm.new) : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">אבטחה</h2>
        <p className="text-sm text-zinc-400">נהלו את הסיסמה ואמצעי האבטחה של חשבונכם</p>
      </div>

      {/* Email read-only */}
      <div className="space-y-2 max-w-md">
        <Label className="text-sm font-medium text-zinc-300">כתובת דוא״ל</Label>
        <div className="flex items-center gap-3 bg-zinc-800/30 border border-zinc-700/60 rounded-lg px-4 py-3">
          <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-zinc-300 text-sm flex-1">{userEmail}</span>
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs shrink-0">מאומת</Badge>
        </div>
        <p className="text-xs text-zinc-500">לשינוי כתובת הדוא״ל, אנא פנו לתמיכה</p>
      </div>

      <Separator className="bg-zinc-700/40" />

      {/* Password change */}
      <div className="space-y-5 max-w-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-300" />
          <h3 className="text-sm font-semibold text-white">שינוי סיסמה</h3>
        </div>

        {(["current", "new", "confirm"] as const).map((field) => {
          const labels = { current: "סיסמה נוכחית", new: "סיסמה חדשה", confirm: "אישור סיסמה חדשה" };
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={`pwd-${field}`} className="text-sm font-medium text-zinc-300">{labels[field]}</Label>
              <div className="relative">
                <Input
                  id={`pwd-${field}`}
                  type={showPasswords[field] ? "text" : "password"}
                  value={passwordForm[field]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                  placeholder={labels[field]}
                  disabled={changingPassword}
                  className="bg-zinc-800/50 border-zinc-700/60 text-white placeholder:text-zinc-500 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPasswords[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {field === "new" && strength && passwordForm.new && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all",
                          bar <= strength.bars
                            ? strength.bars <= 1 ? "bg-red-500" : strength.bars <= 2 ? "bg-yellow-500" : strength.bars <= 3 ? "bg-blue-500" : "bg-green-500"
                            : "bg-zinc-700"
                        )}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.color}`}>חוזק סיסמה: {strength.label}</p>
                </div>
              )}
            </div>
          );
        })}

        <Button onClick={onChangePassword} disabled={changingPassword} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
          {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" />משנה...</> : "שנו סיסמה"}
        </Button>
      </div>

      <Separator className="bg-zinc-700/40" />

      {/* 2FA */}
      <div className="space-y-3 max-w-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-300" />
          <h3 className="text-sm font-semibold text-white">אימות דו-שלבי (2FA)</h3>
        </div>
        <div className="bg-zinc-800/30 border border-zinc-700/60 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-zinc-300 text-sm">הגנה נוספת על חשבונכם</p>
              <p className="text-xs text-zinc-500">אמתו זהות בכל כניסה לחשבון</p>
              <Badge className="mt-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">בקרוב</Badge>
            </div>
            <Button disabled variant="outline" size="sm" className="border-zinc-700 text-zinc-400 shrink-0">הגדירו 2FA</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section: Notifications
// ─────────────────────────────────────────────────────────────────────────────

const NotificationsSection = ({
  notifPrefs,
  setNotifPrefs,
}: {
  notifPrefs: NotificationPrefs;
  setNotifPrefs: React.Dispatch<React.SetStateAction<NotificationPrefs>>;
}) => {
  const items: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: "newReview",            label: "ביקורת חדשה התקבלה",         desc: "קבלו התראה כאשר לקוח משאיר ביקורת"              },
    { key: "reviewNeedsResponse",  label: "ביקורת מחייבת מענה",          desc: "קבלו התראה כאשר יש ביקורת שלא הגבתם לה"         },
    { key: "weeklyAIReport",       label: "דוח AI שבועי",                desc: "תובנות שבועיות מבוססות AI על הביקורות שלכם"      },
    { key: "systemUpdates",        label: "עדכוני מערכת ותכונות חדשות",  desc: "קבלו עדכון על תכונות חדשות ושיפורים"             },
    { key: "monthlyDigest",        label: "דוח חודשי מסכם",              desc: "סיכום חודשי של ביצועי הביקורות"                  },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">התראות</h2>
        <p className="text-sm text-zinc-400">בחרו אילו עדכונים תרצו לקבל</p>
      </div>

      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 max-w-lg">
        <p className="text-yellow-400 text-xs">
          <Badge className="mr-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">בקרוב</Badge>
          שמירת הגדרות התראות בשרת תהיה זמינה בקרוב
        </p>
      </div>

      <div className="space-y-3 max-w-lg">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700/60 rounded-xl hover:bg-zinc-800/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-white text-sm">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
            </div>
            <Switch
              checked={notifPrefs[key]}
              onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, [key]: checked })}
              className="mr-4"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section: Account Management
// ─────────────────────────────────────────────────────────────────────────────

const AccountSection = ({
  business,
  reviewStats,
  onOpenDelete,
}: {
  business: Business;
  reviewStats: { total: number; averageRating: number };
  onOpenDelete: () => void;
}) => {
  const tierLabel = business.subscription_tier === "pro"
    ? "פרו" : business.subscription_tier === "enterprise"
    ? "ארגוני" : "חינמי";

  const tierClass = business.subscription_tier === "pro"
    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"
    : business.subscription_tier === "enterprise"
    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
    : "bg-zinc-700/80 text-zinc-200";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">ניהול חשבון</h2>
        <p className="text-sm text-zinc-400">מידע על העסק, מנוי, ואפשרויות מתקדמות</p>
      </div>

      {/* Subscription */}
      <div className="space-y-3 max-w-lg">
        <h3 className="text-sm font-semibold text-white">התוכנית הנוכחית</h3>
        <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-zinc-700/60 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-zinc-400 text-xs">תוכנית כרגע:</p>
              <Badge className={cn("text-sm font-semibold px-3 py-1", tierClass)}>{tierLabel}</Badge>
              <p className="text-zinc-400 text-xs mt-2">
                {business.subscription_tier === "free"
                  ? "אתם משתמשים בתוכנית החינמית. שדרגו לפרו לקבלת תכונות נוספות."
                  : business.subscription_tier === "pro"
                  ? "תוכנית פרו — גישה לכל התכונות המתקדמות."
                  : "תוכנית ארגונית עם תמיכה ייעודית."}
              </p>
            </div>
            {business.subscription_tier === "free" && (
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                <a href="/business/pricing">שדרגו עכשיו</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-700/40" />

      {/* Business stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          סטטיסטיקות
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
          {[
            { icon: Calendar,     value: business.created_at ? new Date(business.created_at).toLocaleDateString("he-IL") : "—", label: "תאריך יצירה",   iconClass: "text-zinc-400" },
            { icon: MessageSquare, value: reviewStats.total,                                                                  label: "סה״כ ביקורות", iconClass: "text-blue-400" },
            { icon: Star,          value: reviewStats.total > 0 ? `${reviewStats.averageRating.toFixed(1)} / 5` : "—",         label: "דירוג ממוצע",  iconClass: "text-yellow-400" },
            { icon: CheckCircle2,  value: business.verified ? "מאומת" : "לא מאומת",                                            label: "אימות",        iconClass: "text-green-400" },
          ].map(({ icon: Icon, value, label, iconClass }) => (
            <div key={label} className="bg-zinc-800/30 border border-zinc-700/60 rounded-xl p-4 space-y-2">
              <Icon className={cn("w-5 h-5", iconClass)} />
              <p className="font-semibold text-white text-sm leading-tight">{value}</p>
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-700/40" />

      {/* Danger zone */}
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-500">אזור הסכנה</h3>
        </div>
        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-white font-medium text-sm">מחיקת חשבון עסקי</p>
            <p className="text-zinc-400 text-xs mt-1.5">
              כאשר תמחקו את החשבון, כל הנתונים הקשורים אליו יימחקו. לא ניתן לשחזר חשבון שנמחק כעבור 30 יום.
            </p>
          </div>
          <Button onClick={onOpenDelete} variant="destructive" className="bg-red-600 hover:bg-red-700 gap-2">
            <Trash2 className="w-4 h-4" />
            מחקו חשבון
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const BusinessSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]               = useState(true);
  const [business, setBusiness]             = useState<Business | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeSection, setActiveSection]   = useState<Section>("profile");
  const [reviewStats, setReviewStats]       = useState({ total: 0, averageRating: 0 });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "", description: "", category: "", founder_name: "", logo_url: "", cover_url: "",
  });

  // Contact form
  const [contactForm, setContactForm] = useState({
    email: "", phone: "", website: "", personal_affiliate_url: "",
    social_links: { facebook: "", instagram: "", linkedin: "", twitter: "", tiktok: "" } as Record<string, string>,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    newReview: true, reviewNeedsResponse: true, weeklyAIReport: true, systemUpdates: false, monthlyDigest: true,
  });

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { navigate("/business/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") { navigate("/business/signup"); return; }
          throw error;
        }

        if (data) {
          const d = data;
          setBusiness(d);
          setProfileForm({
            name: d.name || "",
            description: d.description || "",
            category: d.category || "",
            founder_name: d.founder_name || "",
            logo_url: d.logo_url || "",
            cover_url: d.cover_url || "",
          });
          setContactForm({
            email: d.email || "",
            phone: d.phone || "",
            website: d.website || "",
            personal_affiliate_url: d.personal_affiliate_url || "",
            social_links: d.social_links || { facebook: "", instagram: "", linkedin: "", twitter: "", tiktok: "" },
          });

          // Fetch review stats
          const { data: rData } = await supabase.from("reviews").select("rating").eq("business_id", data.id);
          if (rData) {
            const total = rData.length;
            const avg = total > 0 ? rData.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
            setReviewStats({ total, averageRating: avg });
          }
        }
      } catch {
        toast.error("לא הצלחנו לטעון את פרטי העסק");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  // ── Save handlers ──────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("businesses").update({
        name: profileForm.name, description: profileForm.description,
        founder_name: profileForm.founder_name, logo_url: profileForm.logo_url,
        cover_url: profileForm.cover_url, updated_at: new Date().toISOString(),
      }).eq("id", business.id);
      if (error) throw error;
      toast.success("פרטי העסק נשמרו בהצלחה");
    } catch { toast.error("לא הצלחנו לשמור את פרטי העסק"); }
    finally { setSaving(false); }
  };

  const handleSaveContact = async () => {
    if (!business) return;
    setSaving(true);
    try {
      // Validate affiliate URL if provided
      const affUrl = contactForm.personal_affiliate_url.trim();
      if (affUrl) {
        try { new URL(affUrl); } catch {
          toast.error("קישור השותפים אינו תקין — נא להזין כתובת מלאה (https://...)");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase.from("businesses").update({
        email: contactForm.email,
        phone: contactForm.phone,
        website: contactForm.website,
        personal_affiliate_url: affUrl || null,
        ...(affUrl ? { affiliate_mode: "personal_affiliate" } : {}),
        social_links: contactForm.social_links,
        updated_at: new Date().toISOString(),
      }).eq("id", business.id);
      if (error) throw error;
      toast.success("פרטי הקשר נשמרו בהצלחה");
    } catch { toast.error("לא הצלחנו לשמור את פרטי הקשר"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error("אנא מלאו את כל השדות"); return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("הסיסמאות החדשות לא תואמות"); return;
    }
    if (passwordForm.new.length < 8) {
      toast.error("הסיסמה חייבת להיות לפחות 8 תווים"); return;
    }
    if (!/[A-Z]/.test(passwordForm.new)) {
      toast.error("הסיסמה חייבת להכיל אות גדולה"); return;
    }
    if (!/[0-9]/.test(passwordForm.new)) {
      toast.error("הסיסמה חייבת להכיל ספרה"); return;
    }

    setChangingPassword(true);
    try {
      if (!user?.email) throw new Error("No user email");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordForm.current });
      if (signInError) { toast.error("הסיסמה הנוכחית שגויה"); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (updateError) throw updateError;
      toast.success("הסיסמה שונתה בהצלחה");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch { toast.error("לא הצלחנו לשנות את הסיסמה"); }
    finally { setChangingPassword(false); }
  };

  // ── Loading / empty states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise-overlay flex flex-col" dir="rtl">
        <BusinessNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <p className="text-zinc-400 text-sm">טוען הגדרות...</p>
          </div>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background noise-overlay flex flex-col" dir="rtl">
        <BusinessNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="border-zinc-700/60 bg-zinc-900/50 max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-white">לא נמצא עסק</CardTitle>
              <CardDescription>עדיין לא יצרתם עסק. אנא הרשמו כדי להמשיך.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <a href="/business/signup">הרשמה לעסק</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <BusinessFooter />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background noise-overlay flex flex-col" dir="rtl">
      <BusinessNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">הגדרות</h1>
            <p className="text-zinc-400 mt-1">נהלו את פרטי העסק, אבטחה, התראות וחשבונכם</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="w-full lg:w-64 shrink-0">

              {/* Mobile: horizontal pill nav */}
              <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
                {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
                      activeSection === id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-900/40"
                        : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Desktop: sticky sidebar */}
              <div className="hidden lg:block sticky top-24 rounded-2xl border border-zinc-700/60 bg-zinc-900/70 overflow-hidden">
                {/* Business summary card */}
                <div className="p-5 border-b border-zinc-700/60">
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700/60 flex items-center justify-center shrink-0">
                      {business.logo_url || profileForm.logo_url ? (
                        <img src={profileForm.logo_url || business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="min-w-0 w-full space-y-0.5">
                      <p className="font-semibold text-white text-sm truncate">{business.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{business.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-xs",
                        business.subscription_tier === "pro" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        business.subscription_tier === "enterprise" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                        "bg-zinc-700/60 text-zinc-300"
                      )}>
                        {business.subscription_tier === "pro" ? "פרו" : business.subscription_tier === "enterprise" ? "ארגוני" : "חינמי"}
                      </Badge>
                      {business.verified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          מאומת
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nav items */}
                <div className="p-2 space-y-0.5">
                  {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right",
                        activeSection === id
                          ? "bg-blue-600/15 text-blue-400 border-r-2 border-blue-500"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Content panel ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-6 sm:p-8">
                {activeSection === "profile" && (
                  <ProfileSection
                    business={business}
                    profileForm={profileForm}
                    setProfileForm={setProfileForm}
                    onSave={handleSaveProfile}
                    saving={saving}
                  />
                )}
                {activeSection === "contact" && (
                  <ContactSection
                    contactForm={contactForm}
                    setContactForm={setContactForm}
                    onSave={handleSaveContact}
                    saving={saving}
                  />
                )}
                {activeSection === "security" && (
                  <SecuritySection
                    userEmail={user?.email || ""}
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    showPasswords={showPasswords}
                    setShowPasswords={setShowPasswords}
                    onChangePassword={handleChangePassword}
                    changingPassword={changingPassword}
                  />
                )}
                {activeSection === "notifications" && (
                  <NotificationsSection notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs} />
                )}
                {activeSection === "account" && (
                  <AccountSection
                    business={business}
                    reviewStats={reviewStats}
                    onOpenDelete={() => setDeleteModalOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <DeleteAccountModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} />
      <BusinessFooter />
    </div>
  );
};

export default BusinessSettingsPage;
