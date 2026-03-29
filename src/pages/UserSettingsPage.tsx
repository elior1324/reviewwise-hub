/**
 * UserSettingsPage.tsx  (v2 — premium SaaS redesign)
 *
 * Complete settings page for regular ReviewHub users.
 *
 * Architecture:
 *  • activeSection state drives the visible content panel — sidebar nav is
 *    properly wired (not decorative).
 *  • Profile summary card lives at the top of the sidebar.
 *  • 7 sections: Profile · Security · Notifications · Privacy ·
 *    Activity · Points & Rewards · Account Management
 *  • Mobile: horizontal scrollable pill nav replaces the broken hidden TabsList.
 *  • All data-fetching and business logic from v1 is preserved.
 *
 * Protected route — redirects unauthenticated users to /auth
 * Full RTL Hebrew support
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import ImageUploadField from "@/components/ImageUploadField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  User as UserIcon,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Mail,
  Star,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Download,
  Shield,
  Loader2,
  Save,
  KeyRound,
  Calendar,
  Trophy,
  Settings,
  Activity,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  marketing_consent: boolean;
  created_at: string;
}

interface Review {
  id: string;
  business_id: string;
  rating: number;
  text: string;
  status: string;
  created_at: string;
  verified: boolean;
  businesses?: { name: string; slug: string };
}

interface UserPoint {
  id: string;
  points: number;
  month_year: string;
  reason: string;
  created_at: string;
}

// ── Section type ───────────────────────────────────────────────────────────────

type Section =
  | "profile"
  | "security"
  | "notifications"
  | "privacy"
  | "activity"
  | "points"
  | "account";

const NAV_ITEMS: { id: Section; icon: React.ElementType; label: string }[] = [
  { id: "profile",       icon: UserIcon,    label: "פרופיל"         },
  { id: "security",      icon: Lock,        label: "אבטחה"          },
  { id: "notifications", icon: Bell,        label: "התראות"         },
  { id: "privacy",       icon: Eye,         label: "פרטיות"         },
  { id: "activity",      icon: Activity,    label: "הפעילות שלי"    },
  { id: "points",        icon: Trophy,      label: "נקודות ופרסים"  },
  { id: "account",       icon: Settings,    label: "ניהול חשבון"    },
];

// ── Utility helpers ────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));

const getInitials = (fullName: string | null) => {
  if (!fullName) return "U";
  return fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
};

const getReviewStatusColor = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "published": return "default";
    case "pending":   return "secondary";
    case "flagged":   return "destructive";
    case "removed":   return "outline";
    default:          return "default";
  }
};

const getReviewStatusLabel = (status: string) => {
  switch (status) {
    case "published": return "פורסם";
    case "pending":   return "בהמתנה";
    case "flagged":   return "מסומן";
    case "removed":   return "הוסר";
    default:          return status;
  }
};

// ── Section: Profile ───────────────────────────────────────────────────────────

const ProfileSection = ({
  profile,
  onUpdate,
  saving,
}: {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
  saving: boolean;
}) => {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [marketingConsent, setMarketingConsent] = useState(profile.marketing_consent || false);
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || null);

  useEffect(() => {
    setFullName(profile.full_name || "");
    setMarketingConsent(profile.marketing_consent || false);
    setCoverUrl(profile.cover_url || null);
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

  const handleSave = () =>
    onUpdate({ full_name: fullName, marketing_consent: marketingConsent, avatar_url: avatarUrl, cover_url: coverUrl });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">פרופיל</h2>
        <p className="text-sm text-muted-foreground">נהלו את פרטי הפרופיל הציבוריים שלכם</p>
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">תמונת כיסוי</Label>
        <div className="rounded-xl overflow-hidden border border-border">
          <ImageUploadField
            value={coverUrl}
            onChange={setCoverUrl}
            bucket="covers"
            storagePath={`${profile.id}/cover`}
            shape="rect"
            placeholder="לחצו להעלאת תמונת כיסוי"
            className="w-full"
          />
        </div>
      </div>

      {/* Avatar */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">תמונת פרופיל</Label>
        <div className="flex items-center gap-5">
          <ImageUploadField
            value={avatarUrl}
            onChange={setAvatarUrl}
            bucket="avatars"
            storagePath={`${profile.id}/avatar`}
            shape="circle"
            placeholder="העלו תמונה"
          />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>גודל מומלץ: 400×400 פיקסל</p>
            <p>פורמטים: JPG, PNG, WebP, GIF</p>
            <p>מקסימום: 5MB</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">שם מלא</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="הזינו שם מלא"
          disabled={saving}
          className="text-right max-w-sm"
          dir="rtl"
        />
        <p className="text-xs text-muted-foreground">השם שלכם יופיע על הביקורות שכתבתם</p>
      </div>

      {/* Marketing consent */}
      <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card max-w-lg">
        <div className="space-y-1">
          <p className="font-medium text-sm">עדכוני שיווק</p>
          <p className="text-xs text-muted-foreground">קבלו עדכונים על תכניות חדשות והנחות בלעדיות</p>
        </div>
        <Switch checked={marketingConsent} onCheckedChange={setMarketingConsent} disabled={saving} />
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />שומר...</> : <><Save className="w-4 h-4" />שמרו שינויים</>}
        </Button>
      </div>
    </div>
  );
};

// ── Section: Security ──────────────────────────────────────────────────────────

const SecuritySection = ({ profile }: { profile: UserProfile }) => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("אנא מלאו את כל השדות");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("הסיסמאות החדשות אינן תואמות");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("הסיסמה החדשה חייבת להיות לפחות 8 תווי��");
      return;
    }

    setChangingPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });
      if (verifyError) { toast.error("סיסמה נוכחית שגויה"); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // Invalidate all sessions globally (all devices/tabs) and force re-login.
      // scope: "global" revokes refresh tokens server-side.
      // The onAuthStateChange listener in AuthContext automatically handles local
      // cleanup (stops SessionTimeout, clears user/session state) when the
      // session becomes null — no separate signOut() call needed.
      toast.success("הסיסמה שונתה בהצלחה. יש להתחבר מחדש.");
      await supabase.auth.signOut({ scope: "global" });
      navigate("/auth");
      return;
    } catch {
      toast.error("שגיאה בשינוי הסיסמה");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">אבטחה</h2>
        <p className="text-sm text-muted-foreground">נהלו את הסיסמה ואמצעי האבטחה של החשבון</p>
      </div>

      {/* Email read-only */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">כתובת דוא״ל</Label>
        <div className="flex items-center gap-3 rounded-xl border border-border p-4 bg-card max-w-lg">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium flex-1">{profile.email}</span>
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Lock className="w-3 h-3" />
            מאומת
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">לשינוי כתובת הדוא״ל, אנא פנו לתמיכה</p>
      </div>

      <Separator />

      {/* Password change */}
      <div className="space-y-5 max-w-sm">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          <h3 className="font-semibold text-sm">שינוי סיסמה</h3>
        </div>

        {[
          { id: "cur",  label: "סיסמה נוכחית", value: currentPassword, onChange: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
          { id: "new",  label: "סיסמה חדשה",    value: newPassword,     onChange: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v)     },
          { id: "con",  label: "אישור סיסמה חדשה", value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
        ].map(({ id, label, value, onChange, show, toggle }) => (
          <div key={id} className="space-y-2">
            <Label htmlFor={id} className="text-sm">{label}</Label>
            <div className="relative">
              <Input
                id={id}
                type={show ? "text" : "password"}
                placeholder={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={changingPassword}
                className="text-right pl-10"
                dir="rtl"
              />
              <button
                type="button"
                onClick={toggle}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}

        <Button onClick={handlePasswordChange} disabled={changingPassword} className="w-full gap-2">
          {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" />מעדכן...</> : "שנו סיסמה"}
        </Button>
      </div>

      <Separator />

      {/* 2FA (coming soon) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <h3 className="font-semibold text-sm">אימות דו-שלבי (2FA)</h3>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card max-w-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">הגנה נוספת על חשבונכם</p>
              <p className="text-xs text-muted-foreground">אמתו את זהותכם בכל כניסה לחשבון</p>
              <Badge variant="outline" className="text-xs mt-1">בקרוב</Badge>
            </div>
            <Button disabled variant="outline" size="sm">הגדירו 2FA</Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Account info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">מידע חשבון</h3>
        <div className="rounded-xl border border-border p-4 bg-card space-y-3 max-w-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">חבר מ</span>
            <span className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Section: Notifications ─────────────────────────────────────────────────────

const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    reviewResponses: true,
    newPrograms: true,
    platformUpdates: true,
    marketing: false,
  });

  const items = [
    { key: "reviewResponses", label: "תגובות על ביקורות",    desc: "קבלו עדכון כשמישהו מגיב על הביקורת שלכם" },
    { key: "newPrograms",     label: "תוכניות חדשות",         desc: "עדכונים על תוכניות חדשות שאוספות ביקורות" },
    { key: "platformUpdates", label: "עדכוני פלטפורמה",       desc: "שיפורים ותכונות חדשות בפלטפורמה" },
    { key: "marketing",       label: "דיוור שיווקי",          desc: "קבלו הצעות בלעדיות והנחות מיוחדות" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">התראות</h2>
        <p className="text-sm text-muted-foreground">בחרו אילו עדכונים תרצו לקבל</p>
      </div>

      <div className="space-y-3 max-w-lg">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
            <div className="space-y-0.5 flex-1">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={prefs[key as keyof typeof prefs]}
              onCheckedChange={(val) => setPrefs({ ...prefs, [key]: val })}
            />
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 max-w-lg rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">העדפות התראות יישמרו בשרת בקרוב</p>
      </div>

      <div className="pt-2">
        <Button onClick={() => toast.success("העדפות נשמרו")} className="gap-2">
          <Save className="w-4 h-4" />
          שמרו העדפות
        </Button>
      </div>
    </div>
  );
};

// ── Section: Privacy ───────────────────────────────────────────────────────────

const PrivacySection = () => {
  const [prefs, setPrefs] = useState({ anonymousByDefault: false, hideFromSearch: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">פרטיות</h2>
        <p className="text-sm text-muted-foreground">שלטו בחשיפת המידע שלכם לאחרים</p>
      </div>

      <div className="space-y-3 max-w-lg">
        <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
          <div className="space-y-0.5 flex-1">
            <p className="font-medium text-sm">ביקורות אנונימיות כברירת מחדל</p>
            <p className="text-xs text-muted-foreground">כתבו ביקורות ללא חשיפת הזהות שלכם</p>
          </div>
          <Switch checked={prefs.anonymousByDefault} onCheckedChange={(v) => setPrefs({ ...prefs, anonymousByDefault: v })} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-card">
          <div className="space-y-0.5 flex-1">
            <p className="font-medium text-sm">הסתרת הפרופיל מגוגל</p>
            <p className="text-xs text-muted-foreground">מנעו מגוגל להציג את הפרופיל שלכם בתוצאות חיפוש</p>
          </div>
          <Switch checked={prefs.hideFromSearch} onCheckedChange={(v) => setPrefs({ ...prefs, hideFromSearch: v })} />
        </div>
      </div>

      <Separator className="max-w-lg" />

      <div className="space-y-3 max-w-lg">
        <h3 className="font-semibold text-sm">ייצוא נתונים</h3>
        <p className="text-xs text-muted-foreground">קבלו עותק של כל הנתונים שלכם בפורמט קריא</p>
        <Button variant="outline" disabled className="gap-2">
          <Download className="w-4 h-4" />
          ייצוא הנתונים שלי
        </Button>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">בקרוב</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">ייצוא נתונים יהיה זמין בקרוב</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 max-w-lg rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">העדפות הפרטיות יישמרו בשרת בקרוב</p>
      </div>
    </div>
  );
};

// ── Section: Activity ──────────────────────────────────────────────────────────

const ActivitySection = ({ userId }: { userId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: reviewsData }, { count }] = await Promise.all([
          supabase
            .from("reviews")
            .select("*, businesses(name,slug)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("customer_user_id", userId),
        ]);
        setReviews(reviewsData || []);
        setTotalPurchases(count || 0);
      } catch {
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">הפעילות שלי</h2>
        <p className="text-sm text-muted-foreground">ביקורות שכתבתם ורכישות שביצעתם</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="rounded-xl border border-border p-4 bg-card text-center space-y-1">
          <Star className="w-6 h-6 mx-auto text-yellow-500" />
          <p className="text-2xl font-bold">{reviews.length}</p>
          <p className="text-xs text-muted-foreground">ביקורות</p>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card text-center space-y-1">
          <ShoppingBag className="w-6 h-6 mx-auto text-blue-500" />
          <p className="text-2xl font-bold">{totalPurchases}</p>
          <p className="text-xs text-muted-foreground">רכישות</p>
        </div>
      </div>

      <Separator />

      {/* Reviews list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Star className="w-4 h-4" />
          הביקורות שלי
        </h3>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-2">
            <Star className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">עדיין לא כתבתם ביקורות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border p-4 bg-card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{review.businesses?.name || "עסק"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getReviewStatusColor(review.status)}>{getReviewStatusLabel(review.status)}</Badge>
                    {review.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        אומת
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                {review.text && (
                  <p className="text-sm text-foreground/80 line-clamp-2">{review.text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section: Points & Rewards ──────────────────────────────────────────────────

const PointsSection = ({ userId }: { userId: string }) => {
  const [points, setPoints] = useState<UserPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("user_points")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        const rows: UserPoint[] = data || [];
        setPoints(rows);
        setTotalPoints(rows.reduce((s, p) => s + p.points, 0));
      } catch {
        toast.error("שגיאה בטעינת הנקודות");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Inline tier logic (mirrors UserReferralDashboard thresholds — do not modify)
  const tierLabel =
    totalPoints >= 600 ? "Ambassador" :
    totalPoints >= 300 ? "Influencer" :
    totalPoints >= 150 ? "Explorer"   : "Starter";
  const tierColor =
    totalPoints >= 600 ? "text-amber-600 bg-amber-500/10 border-amber-500/30" :
    totalPoints >= 300 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" :
    totalPoints >= 150 ? "text-primary bg-primary/10 border-primary/30" :
                         "text-muted-foreground bg-muted/40 border-border/40";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">נקודות ופרסים</h2>
        <p className="text-sm text-muted-foreground">
          נקודות אלו צוברות פעילות מאומתת — ביקורות, השתתפות קהילתית, והזמנת חברים.
          ניתן לממש אותן להטבות פלטפורמה כגון הנחה על קורס.
        </p>
      </div>

      {/* Total points hero + tier badge */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 max-w-xs text-center space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-primary" />
        <p className="text-4xl font-bold">{totalPoints}</p>
        <p className="text-sm text-muted-foreground">סה״כ נקודות שנצברו</p>
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${tierColor}`}>
          {tierLabel}
        </span>
      </div>

      {/* Referral CTA — temporarily disabled, keep for future
      <div className="rounded-xl border border-primary/30 p-4 bg-primary/5 flex items-center justify-between gap-4 max-w-lg">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">מסע הנקודות והפרסים</p>
          <p className="text-xs text-muted-foreground">ראו את מסלול הדרגות, התקדמות הרמה, ומימוש הטבות</p>
        </div>
        <Button variant="default" size="sm" asChild>
          <a href="/user/referrals">לדף הפרסים</a>
        </Button>
      </div>
      */}

      {/* Secondary CTA — community leaderboard */}
      <div className="rounded-xl border border-border p-4 bg-card flex items-center justify-between gap-4 max-w-lg">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">דירוג קהילה</p>
          <p className="text-xs text-muted-foreground">ראו את המיקום שלכם ביחס לתורמי הקהילה (נקודות קהילה — נפרדות)</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/leaderboard">לוח המובילים</a>
        </Button>
      </div>

      <Separator />

      {/* Points history */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          היסטוריית נקודות
        </h3>

        {points.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">אין נקודות עדיין — כתבו ביקורת ראשונה!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {points.map((point) => (
              <div key={point.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{point.reason}</p>
                  <p className="text-xs text-muted-foreground">{point.month_year}</p>
                </div>
                <span className="font-semibold text-sm text-green-600">+{point.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section: Account Management ────────────────────────────────────────────────

const AccountSection = ({ profile }: { profile: UserProfile }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">ניהול חשבון</h2>
        <p className="text-sm text-muted-foreground">פרטי חשבון ואפשרויות מתקדמות</p>
      </div>

      {/* Account info */}
      <div className="space-y-3 max-w-lg">
        <h3 className="font-semibold text-sm">מידע כללי</h3>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">כתובת דוא״ל</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">חבר מ</span>
            <span className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(profile.created_at)}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">סוג חשבון</span>
            <Badge variant="secondary">חינמי</Badge>
          </div>
        </div>
      </div>

      <Separator className="max-w-lg" />

      {/* Danger zone */}
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-sm text-destructive">אזור סכנה</h3>
        </div>

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">מחיקת חשבון</p>
            <p className="text-xs text-muted-foreground">
              מחיקת החשבון תתבצע לאחר 7 ימים, כדי לתת לכם אפשרות לחזור בכם. כל הנתונים יימחקו לאחר מכן סופית.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDeleteModalOpen(true)} className="gap-2">
            <Trash2 className="w-4 h-4" />
            מחק או השהה חשבון
          </Button>
        </div>
      </div>

      <DeleteAccountModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} />
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const UserSettingsPage = () => {
  const { user, loading: isLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [saving, setSaving]             = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("profile");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    supabase.from("users")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) { toast.error("שגיאה בטעינת הפרופיל"); return; }
        setProfile(data);
      })
      .finally(() => setLoadingProfile(false));
  }, [user]);

  // Profile update
  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success("הפרופיל עודכן בהצלחה");
    } catch {
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background noise-overlay flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background noise-overlay flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">הגדרות</h1>
            <p className="text-muted-foreground mt-1">נהלו את חשבונכם, הפרטיות, והגדרות הפלטפורמה</p>
          </div>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : profile ? (
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
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Desktop: sticky card sidebar */}
                <Card className="hidden lg:block bg-card shadow-card sticky top-24">
                  {/* Profile summary */}
                  <div className="p-5 flex flex-col items-center text-center gap-3 border-b border-border">
                    <Avatar className="w-16 h-16 ring-2 ring-border">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || ""} />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0 w-full">
                      <p className="font-semibold text-sm truncate">
                        {profile.full_name || "משתמש"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">חבר</Badge>
                  </div>

                  {/* Nav items */}
                  <CardContent className="p-3 space-y-0.5">
                    {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right",
                          activeSection === id
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </aside>

              {/* ── Content panel ───────────────────────────────────────────── */}
              <div className="flex-1 min-w-0">
                <Card className="bg-card shadow-card">
                  <CardContent className="p-6 sm:p-8">
                    {activeSection === "profile" && (
                      <ProfileSection profile={profile} onUpdate={handleProfileUpdate} saving={saving} />
                    )}
                    {activeSection === "security" && (
                      <SecuritySection profile={profile} />
                    )}
                    {activeSection === "notifications" && (
                      <NotificationsSection />
                    )}
                    {activeSection === "privacy" && (
                      <PrivacySection />
                    )}
                    {activeSection === "activity" && (
                      <ActivitySection userId={user.id} />
                    )}
                    {activeSection === "points" && (
                      <PointsSection userId={user.id} />
                    )}
                    {activeSection === "account" && (
                      <AccountSection profile={profile} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">לא ניתן לטעון את הפרופיל</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserSettingsPage;
