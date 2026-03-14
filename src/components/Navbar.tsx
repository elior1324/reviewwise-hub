import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, Scale, Trophy,
  ChevronDown, ShieldCheck, LayoutDashboard, BarChart3, Tag, BookOpen, Briefcase,
  UserCircle,
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
  { to: "/business",                     icon: ShieldCheck,     label: "כל הפתרונות לעסקים" },
  { to: "/business/solutions/reviews",   icon: BarChart3,       label: "אימות ביקורות"      },
  { to: "/business/solutions/analytics", icon: LayoutDashboard, label: "לוח בקרה ונתונים"   },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const { user, signOut } = useAuth();
  const { mode, switchToBusinessMode, switchToUserMode } = useAppMode();
  const navigate = useNavigate();
  const isBusinessMode = mode === "business";

  // Pricing is now open to all authenticated users (C-7 fix)
  const canSeePricing = !!user;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSwitchToBusiness = () => {
    switchToBusinessMode();
    navigate("/business/dashboard");
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
              <Link
                to="/business"
                className="text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                דף הבית
              </Link>
              <Link
                to="/business/dashboard"
                className="text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard size={14} aria-hidden="true" />
                לוח הבקרה
              </Link>
              <Link
                to="/business/pricing"
                className="text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Tag size={14} aria-hidden="true" />
                תמחור
              </Link>
              <Link
                to="/business/solutions/reviews"
                className="text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck size={14} aria-hidden="true" />
                אימות ביקורות
              </Link>
            </>
          ) : (
            /* ── Consumer mode nav ── */
            <>
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                עמוד הבית
              </Link>

              <Link
                to="/search"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ספריית האמון
              </Link>

              <Link
                to="/leaderboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Trophy size={14} aria-hidden="true" />
                קהילה
              </Link>

              <Link
                to="/compare"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Scale size={14} aria-hidden="true" />
                השוואה
              </Link>

              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
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

          {/* ── Switch Mode button (logged-in only) ──────────────────────── */}
          {user && !isBusinessMode && (
            <button
              onClick={handleSwitchToBusiness}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all"
              aria-label="עבור למצב עסקי"
            >
              <Briefcase size={13} aria-hidden="true" />
              מצב עסקי
            </button>
          )}
          {user && isBusinessMode && (
            <button
              onClick={handleSwitchToConsumer}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 transition-all"
              aria-label="עבור למצב צרכן"
            >
              <UserCircle size={13} aria-hidden="true" />
              מצב צרכן
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
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                {!isBusinessMode && (
                  <DropdownMenuItem onClick={handleSwitchToBusiness}>
                    <Briefcase size={14} className="ml-2" aria-hidden="true" />
                    לוח בקרה עסקי
                  </DropdownMenuItem>
                )}
                {isBusinessMode && (
                  <DropdownMenuItem onClick={handleSwitchToConsumer}>
                    <UserCircle size={14} className="ml-2" aria-hidden="true" />
                    עבור למצב צרכן
                  </DropdownMenuItem>
                )}
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

              <div className="border-t border-border/30 pt-1">
                <Link
                  to="/leaderboard"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  קהילה
                </Link>
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
                {user && (
                  <button
                    onClick={() => { handleSwitchToBusiness(); setMobileOpen(false); }}
                    className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-primary font-medium w-full"
                  >
                    <Briefcase size={14} aria-hidden="true" />
                    מצב עסקי
                  </button>
                )}
                {!user && (
                  <Link
                    to="/auth"
                    className="block text-sm py-3 min-h-[44px] flex items-center text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    התחברו / צרו חשבון
                  </Link>
                )}
                {user && (
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="block text-sm py-3 min-h-[44px] flex items-center text-destructive w-full"
                  >
                    התנתקו
                  </button>
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
