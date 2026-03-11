import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, Scale, DollarSign,
  ChevronDown, ShieldCheck, LayoutDashboard, BarChart3, Tag,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import AccessibilityMenu from "./AccessibilityMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteAccountButton from "./DeleteAccountButton";

// ── "לעסקים" dropdown items ───────────────────────────────────────────────────
// Pricing is intentionally excluded here; it is appended conditionally below
// based on Gmail authentication status.
const PRODUCT_LINKS = [
  { to: "/business/solutions/reviews",   icon: ShieldCheck,     label: "ביקורות מאומתות" },
  { to: "/business/solutions/widgets",   icon: LayoutDashboard, label: "ווידג'טים"          },
  { to: "/business/solutions/analytics", icon: BarChart3,       label: "אנליטיקס"           },
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
  const navigate = useNavigate();

  // Pricing is now open to all authenticated users (C-7 fix)
  const canSeePricing = !!user;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className={`glass fixed top-0 z-50 border-b border-border/50 w-full transition-shadow duration-300 ${scrolled ? "shadow-lg" : "shadow-none"}`}>
      <div className="container flex items-center justify-between h-16">

        {/* ── Left side: Logo + לעסקים dropdown ─────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoIcon}
              alt="ReviewHub Logo"
              className="w-10 h-10 rounded-xl shadow-lg object-cover"
            />
            <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
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

                {/* Pricing — visible only to Gmail users */}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Center nav ────────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6">
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
            קטגוריות
          </Link>

          <Link
            to="/partner"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <DollarSign size={14} aria-hidden="true" />
            שותפים
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
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            אודות
          </Link>
        </div>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border/50"
                  aria-label="תפריט משתמש"
                >
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/dashboard")}>
                  לוח בקרה עסקי
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={14} className="ml-2" aria-hidden="true" />
                  התנתקו
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <div>
                    <DeleteAccountButton />
                  </div>
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
        <div className="md:hidden border-t border-border/50 p-4 space-y-1 glass" dir="rtl">
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
            קטגוריות
          </Link>

          {/* Business sub-links (always visible on mobile) */}
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
              to="/partner"
              className="block text-sm py-3 min-h-[44px] flex items-center"
              onClick={() => setMobileOpen(false)}
            >
              שותפים
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
              <Link
                to="/business/dashboard"
                className="block text-sm py-3 min-h-[44px] flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                לוח בקרה עסקי
              </Link>
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
              <>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="block text-sm py-3 min-h-[44px] flex items-center text-destructive w-full"
                >
                  התנתקו
                </button>
                <DeleteAccountButton />
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
