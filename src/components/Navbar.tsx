import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, Scale, DollarSign,
  ChevronDown, ShieldCheck, LayoutDashboard, BarChart3, Tag,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isGmailAddress } from "@/components/GmailProtectedRoute";
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

// ── Product menu items ────────────────────────────────────────────────────────
// Pricing is intentionally excluded here; it is appended conditionally below
// based on Gmail authentication status.
const PRODUCT_LINKS = [
  { to: "/business/solutions/reviews", icon: ShieldCheck,     label: "ביקורות מאומתות" },
  { to: "/business/solutions/widgets", icon: LayoutDashboard, label: "ווידג'טים"          },
  { to: "/business/solutions/analytics", icon: BarChart3,     label: "אנליטיקס"           },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // True only when the authenticated user's email is @gmail.com
  const canSeePricing = isGmailAddress(user?.email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="container flex items-center justify-between h-16">

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoIcon}
            alt="ReviewHub Logo"
            className="w-10 h-10 rounded-xl shadow-lg object-cover"
          />
          <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────────────────── */}
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

          {/* ── "מוצר" dropdown ─────────────────────────────────────────────── */}
          <DropdownMenu open={productOpen} onOpenChange={setProductOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus-visible:outline-none"
                aria-haspopup="menu"
                aria-expanded={productOpen}
              >
                מוצר
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${productOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52" dir="rtl">
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
          {/* ── end Product dropdown ─────────────────────────────────────────── */}

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

          <Link to="/business" className="hidden md:block">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground font-medium text-sm"
            >
              לעסקים
            </Button>
          </Link>

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

          {/* Product sub-links (always visible on mobile) */}
          <div className="border-t border-border/30 pt-2 pb-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-0 mb-1">
              מוצר
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
            <Link
              to="/business"
              className="block text-sm py-3 min-h-[44px] flex items-center text-primary"
              onClick={() => setMobileOpen(false)}
            >
              לעסקים
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
