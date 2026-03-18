import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, Scale, Trophy,
  ChevronDown, ShieldCheck, LayoutDashboard, BarChart3, Tag, BookOpen, Briefcase,
  UserCircle, ArrowLeftRight, Gift, Settings,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import type { AppMode } from "@/contexts/ModeContext";
import NotificationBell from "./NotificationBell";
import AccessibilityMenu from "./AccessibilityMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// ── "לעסקים" dropdown items ───────────────────────────────────────────────────
// Gateway for business owners who land on the public site.
// Pricing is appended conditionally based on auth status.
const PRODUCT_LINKS = [
  { to: "/business",                   icon: ShieldCheck, label: "כל הפתרונות לעסקים" },
  { to: "/business/solutions/reviews", icon: BarChart3,   label: "אימות ביקורות"      },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const { user, signOut } = useAuth();
  const { mode, switchToBusinessMode, switchToUserMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isBusinessMode = mode === "business";

  /** Returns true when the current pathname matches or starts with the given path */
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLinkCls = (path: string, dark = false) => {
    const active = isActive(path);
    if (dark) {
      return `text-sm transition-colors flex items-center gap-1.5 relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all ${
        active
          ? "text-white font-semibold after:bg-white"
          : "text-zinc-300 hover:text-white after:bg-transparent"
      }`;
    }
    return `text-sm transition-colors flex items-center gap-1.5 relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all ${
      active
        ? "text-foreground font-semibold after:bg-primary"
        : "text-muted-foreground hover:text-foreground after:bg-transparent"
    }`;
  };

  // Pricing is now open to all authenticated users (C-7 fix)
  const canSeePricing = !!user;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSwitchToBusiness = () => {
    switchToBusinessMode();
    // Logged-in users go straight to their dashboard; guests see the landing page
    navigate(user ? "/business/dashboard" : "/business");
  };

  const handleSwitchToConsumer = () => {
    switchToUserMode();
    navigate("/");
  };

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      isBusinessMode
        ? "bg-zinc-900 border-b border-zinc-700/60"
        : `glass border-b border-border/50 ${scrolled ? "shadow-lg" : "shadow-none"}`
    }`}>
      {/* ── Business Mode context band ─────────────────────────────────────────
          Full-width amber strip that makes it impossible to forget which mode
          the user is in. Only rendered when isBusinessMode is true.            */}
      {isBusinessMode && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 py-1 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-[11px] font-semibold">
            <Briefcase size={11} aria-hidden="true" />
            <span>מצב עסקי פעיל — אתם מנהלים פרופיל עסקי</span>
          </div>
          {user && (
            <button
              onClick={handleSwitchToConsumer}
              className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 transition-colors"
              aria-label="עבור למצב צרכן"
            >
              <UserCircle size={10} aria-hidden="true" />
              מצב צרכן
            </button>
          )}
        </div>
      )}

      <div className="container flex items-center justify-between h-16">

        {/* ── Left side: Logo + לעסקים dropdown ─────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link to={isBusinessMode ? "/business" : "/"} className="flex items-center gap-2.5">
            <img
              src={logoIcon}
              alt="ReviewHub Logo"
              className="w-10 h-10 rounded-xl shadow-lg object-cover"
            />
            <span className={`font-display font-bold text-xl ${isBusinessMode ? "text-white" : "gradient-text"}`}>
              ReviewHub
              {isBusinessMode && (
                <span className="ml-1.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full align-middle">
                  עסקי
                </span>
              )}
            </span>
          </Link>

          {/* ── "לעסקים" dropdown — anchored to the left next to the logo ──── */}
          <div className="hidden md:block">
            <DropdownMenu open={productOpen} onOpenChange={setProductOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus-visible:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={productOpen}
                >
                  לעסקים
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${productOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52" style={{ direction: "rtl" }}>
                {PRODUCT_LINKS.map(({ to, icon: Icon, label }) => (
                  <DropdownMenuItem key={to} asChild>
                    <Link
                      to={to}
                      className="flex items-center gap-2 w-full"
                      onClick={() => setProductOpen(false)}
                    >
                      <Icon size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {/* Pricing — visible only to logged-in users */}
                {canSeePricing && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/business/pricing"
                        className="flex items-center gap-2 w-full"
                        onClick={() => setProductOpen(false)}
                      >
                        <Tag size={15} className="text-primary shrink-0" aria-hidden="true" />
                        <span className="text-primary font-medium">מחירים</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* Business login CTA — only when not logged in */}
                {!user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/business/login"
                        className="flex items-center gap-2 w-full font-medium text-primary"
                        onClick={() => setProductOpen(false)}
                      >
                        <ShieldCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
                        כניסה לפורטל העסקי
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Center nav ────────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6">
          {isBusinessMode ? (
            /* ── Business mode nav ── */
            <>
              <Link to="/business" className={navLinkCls("/business", true)}>
                דף הבית
              </Link>
              <Link to="/business/dashboard" className={navLinkCls("/business/dashboard", true)}>
                <LayoutDashboard size={14} aria-hidden="true" />
                לוח הבקרה
              </Link>
              <Link to="/business/pricing" className={navLinkCls("/business/pricing", true)}>
                <Tag size={14} aria-hidden="true" />
                תמחור
              </Link>
              <Link to="/business/solutions/reviews" className={navLinkCls("/business/solutions/reviews", true)}>
                <ShieldCheck size={14} aria-hidden="true" />
                אימות ביקורות
              </Link>
            </>
          ) : (
            /* ── Consumer mode nav ── */
            <>
              <Link to="/" className={navLinkCls("/")}>
                עמוד הבית
              </Link>
              <Link to="/search" className={navLinkCls("/search")}>
                ספריית האמון
              </Link>
              {/* ── קהילה dropdown — Leaderboard + Referrals ── */}
              <DropdownMenu open={communityOpen} onOpenChange={setCommunityOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`text-sm transition-colors flex items-center gap-1 focus-visible:outline-none relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all ${
                      isActive("/leaderboard") || isActive("/user/referrals")
                        ? "text-foreground font-semibold after:bg-primary"
                        : "text-muted-foreground hover:text-foreground after:bg-transparent"
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={communityOpen}
                  >
                    <Trophy size={14} aria-hidden="true" />
                    קהילה
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${communityOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48" style={{ direction: "rtl" }}>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/leaderboard"
                      className="flex items-center gap-2 w-full"
                      onClick={() => setCommunityOpen(false)}
                    >
                      <Trophy size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
                      לוח המובילים
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/user/referrals"
                        className="flex items-center gap-2 w-full"
                        onClick={() => setCommunityOpen(false)}
                      >
                        <Gift size={15} className="text-primary shrink-0" aria-hidden="true" />
                        <span className="text-primary font-medium">הזמינו חברים</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/compare" className={navLinkCls("/compare")}>
                <Scale size={14} aria-hidden="true" />
                השוואה
              </Link>
              <Link to="/about" className={navLinkCls("/about")}>
                <BookOpen size={14} aria-hidden="true" />
                אודות
              </Link>
            </>
          )}
        </div>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          {user && <NotificationBell />}

          {/* ── Mode switch pill — consumer → business (always visible) ─── */}
          {!isBusinessMode && (
            <button
              onClick={handleSwitchToBusiness}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/70 transition-all"
              aria-label="עבור למצב עסקי"
              title="עבור לפרופיל העסקי"
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              פרופיל עסקי
            </button>
          )}
          {/* ── Mode switch pill — business → consumer (always visible) ─── */}
          {isBusinessMode && (
            <button
              onClick={handleSwitchToConsumer}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-700/60 border border-zinc-600 text-zinc-200 hover:bg-zinc-600 hover:text-white hover:border-zinc-500 transition-all"
              aria-label="עבור לגלישה רגילה"
              title="עבור לגלישה רגילה"
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              גלישה רגילה
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full border ${isBusinessMode ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700" : "border-border/50"}`}
                  aria-label="תפריט משתמש"
                >
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default select-none">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={isBusinessMode ? handleSwitchToConsumer : handleSwitchToBusiness}>
                  <ArrowLeftRight size={14} className="ml-2" aria-hidden="true" />
                  {isBusinessMode ? "גלישה רגילה" : "פרופיל עסקי"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={isBusinessMode ? "/business/settings" : "/settings"} className="flex items-center gap-2 w-full">
                    <Settings size={14} className="ml-2" aria-hidden="true" />
                    הגדרות
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={14} className="ml-2" aria-hidden="true" />
                  התנתקו
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/auth">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-medium"
                >
                  התחברו / הרשמו
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className={`md:hidden border-t p-4 space-y-1 ${isBusinessMode ? "bg-zinc-900 border-zinc-700/60" : "glass border-border/50"}`} dir="rtl">
          {isBusinessMode ? (
            /* ── Business mode mobile nav ── */
            <>
              <Link
                to="/business"
                className="block text-sm py-3 min-h-[44px] flex items-center text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                דף הבית
              </Link>
              <Link
                to="/business/dashboard"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} aria-hidden="true" />
                לוח הבקרה
              </Link>
              <Link
                to="/business/pricing"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <Tag size={14} aria-hidden="true" />
                תמחור
              </Link>
              <Link
                to="/business/solutions/reviews"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck size={14} aria-hidden="true" />
                אימות ביקורות
              </Link>
              <div className="border-t border-zinc-700/60 pt-1">
                <button
                  onClick={() => { handleSwitchToConsumer(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-amber-400 w-full"
                >
                  <UserCircle size={14} aria-hidden="true" />
                  מצב צרכן
                </button>
                <Link
                  to="/business/settings"
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings size={14} aria-hidden="true" />
                  הגדרות
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-destructive w-full"
                >
                  <LogOut size={14} aria-hidden="true" />
                  התנתקו
                </button>
              </div>
            </>
          ) : (
            /* ── Consumer mode mobile nav ── */
            <>
              <Link
                to="/"
                className="block text-sm py-3 min-h-[44px] flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                עמוד הבית
              </Link>
              <Link
                to="/search"
                className="block text-sm py-3 min-h-[44px] flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                ספריית האמון
              </Link>

              {/* Business sub-links */}
              <div className="border-t border-border/30 pt-2 pb-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-0 mb-1">
                  לעסקים
                </p>
                {PRODUCT_LINKS.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 text-sm py-2.5 min-h-[44px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                {canSeePricing && (
                  <Link
                    to="/business/pricing"
                    className="flex items-center gap-2 text-sm py-2.5 min-h-[44px] text-primary font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Tag size={14} aria-hidden="true" />
                    מחירים
                  </Link>
                )}
              </div>

              <div className="border-t border-border/30 pt-2 pb-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-0 mb-1">
                  קהילה
                </p>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-2 text-sm py-2.5 min-h-[44px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Trophy size={14} aria-hidden="true" />
                  לוח המובילים
                </Link>
                {user && (
                  <Link
                    to="/user/referrals"
                    className="flex items-center gap-2 text-sm py-2.5 min-h-[44px] text-primary font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Gift size={14} aria-hidden="true" />
                    הזמינו חברים
                  </Link>
                )}
              </div>

              <div className="border-t border-border/30 pt-1">
                <Link
                  to="/compare"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  השוואה חכמה
                </Link>
                <Link
                  to="/about"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  אודות
                </Link>
              </div>

              <div className="border-t border-border/30 pt-1">
                {/* פרופיל עסקי — visible to everyone */}
                <button
                  onClick={() => { handleSwitchToBusiness(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-primary font-medium w-full"
                >
                  <ArrowLeftRight size={14} aria-hidden="true" />
                  פרופיל עסקי
                </button>
                {!user && (
                  <Link
                    to="/auth"
                    className="block text-sm py-3 min-h-[44px] flex items-center text-muted-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    התחברו / צרו חשבון
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Settings size={14} aria-hidden="true" />
                      הגדרות
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="block text-sm py-3 min-h-[44px] flex items-center text-destructive w-full"
                    >
                      התנתקו
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
