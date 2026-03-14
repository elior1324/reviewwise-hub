/**
 * BusinessNavbar — the navigation bar shown inside the Business Dashboard.
 *
 * Visibility rules:
 *  • "דף הבית" and "מחירון" are always visible (logged-in and logged-out).
 *  • "לוח הבקרה", "אימות ביקורות", "ווידג׳טים ותגי אמון" are only shown to
 *    authenticated users — guests see a "התחברו / הרשמו" CTA instead.
 */
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, LayoutDashboard, ShieldCheck,
  ArrowLeftRight, Home, Tag,
} from "lucide-react";
import AccessibilityMenu from "./AccessibilityMenu";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BusinessNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { switchToUserMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();

  /** Active link helper — highlights the current route */
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLink = (active: boolean) =>
    `text-sm transition-colors flex items-center gap-1.5 relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all ${
      active
        ? "text-white font-semibold after:bg-white"
        : "text-zinc-300 hover:text-white after:bg-transparent"
    }`;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSwitchToUser = () => {
    switchToUserMode();
    navigate("/");
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b bg-zinc-900 border-zinc-700/60 shadow-lg"
      dir="rtl"
    >
      <div className="container flex items-center justify-between h-16">

        {/* ── Logo + mode badge ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link to="/business" className="flex items-center gap-2">
            <img
              src={logoIcon}
              alt="ReviewHub Logo"
              className="w-9 h-9 rounded-xl shadow-lg object-cover ring-1 ring-white/10"
            />
            <span className="font-display font-bold text-lg text-white">ReviewHub</span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase bg-primary/20 text-primary border border-primary/30 rounded px-2 py-0.5 select-none">
            מצב עסקי
          </span>
        </div>

        {/* ── Center nav ────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-5">

          {/* Always visible */}
          <Link to="/business" className={navLink(location.pathname === "/business")}>
            <Home size={14} aria-hidden="true" />
            דף הבית
          </Link>

          {/* Authenticated-only links */}
          {user && (
            <>
              <Link to="/business/dashboard" className={navLink(isActive("/business/dashboard"))}>
                <LayoutDashboard size={14} aria-hidden="true" />
                לוח הבקרה
              </Link>
              <Link to="/business/solutions/reviews" className={navLink(isActive("/business/solutions/reviews"))}>
                <ShieldCheck size={14} aria-hidden="true" />
                אימות ביקורות
              </Link>
              <Link to="/partners/prestige-badges" className={navLink(isActive("/partners/prestige-badges"))}>
                ווידג׳טים ותגי אמון
              </Link>
            </>
          )}

          {/* מחירון — always visible */}
          <Link
            to="/business/pricing"
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all ${
              isActive("/business/pricing")
                ? "text-primary after:bg-primary"
                : "text-primary/80 hover:text-primary after:bg-transparent"
            }`}
          >
            <Tag size={14} aria-hidden="true" />
            מחירון
          </Link>
        </div>

        {/* ── Right side ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />

          {/* Switch to Consumer Mode — only for logged-in users */}
          {user && (
            <button
              onClick={handleSwitchToUser}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all"
              aria-label="חזרה לחשבון רגיל"
            >
              <ArrowLeftRight size={13} aria-hidden="true" />
              חזרה לחשבון רגיל
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-800"
                >
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48" style={{ direction: "rtl" }}>
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/dashboard")}>
                  לוח בקרה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/pricing")}>
                  <Tag size={14} className="ml-2" aria-hidden="true" />
                  מחירון
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSwitchToUser}>
                  <ArrowLeftRight size={14} className="ml-2" aria-hidden="true" />
                  חזרה לחשבון רגיל
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
              <Link to="/business/login">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  התחברו / הרשמו
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-zinc-300 hover:text-white hover:bg-zinc-800"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-700/60 bg-zinc-900 p-4 space-y-1">

          {/* Always visible */}
          <Link
            to="/business"
            className={`flex items-center gap-2 text-sm py-3 min-h-[44px] font-medium border-r-2 pr-2 transition-colors ${location.pathname === "/business" ? "text-white border-white" : "text-zinc-300 border-transparent hover:text-white"}`}
            onClick={() => setMobileOpen(false)}
          >
            <Home size={14} aria-hidden="true" /> דף הבית
          </Link>

          {/* Authenticated-only links */}
          {user && (
            <>
              <Link
                to="/business/dashboard"
                className={`flex items-center gap-2 text-sm py-3 min-h-[44px] border-r-2 pr-2 transition-colors ${isActive("/business/dashboard") ? "text-white border-white font-medium" : "text-zinc-300 border-transparent hover:text-white"}`}
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} aria-hidden="true" /> לוח הבקרה
              </Link>
              <Link
                to="/business/solutions/reviews"
                className={`flex items-center gap-2 text-sm py-3 min-h-[44px] border-r-2 pr-2 transition-colors ${isActive("/business/solutions/reviews") ? "text-white border-white font-medium" : "text-zinc-300 border-transparent hover:text-white"}`}
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck size={14} aria-hidden="true" /> אימות ביקורות
              </Link>
              <Link
                to="/partners/prestige-badges"
                className={`flex items-center gap-2 text-sm py-3 min-h-[44px] border-r-2 pr-2 transition-colors ${isActive("/partners/prestige-badges") ? "text-white border-white font-medium" : "text-zinc-300 border-transparent hover:text-white"}`}
                onClick={() => setMobileOpen(false)}
              >
                ווידג׳טים ותגי אמון
              </Link>
            </>
          )}

          {/* מחירון — always visible */}
          <Link
            to="/business/pricing"
            className={`flex items-center gap-2 text-sm py-3 min-h-[44px] font-semibold border-r-2 pr-2 transition-colors ${isActive("/business/pricing") ? "text-primary border-primary" : "text-primary/80 border-transparent hover:text-primary"}`}
            onClick={() => setMobileOpen(false)}
          >
            <Tag size={14} aria-hidden="true" /> מחירון
          </Link>

          <div className="border-t border-zinc-700/60 pt-1 mt-1">
            {!user ? (
              <Link
                to="/business/login"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-primary font-medium"
                onClick={() => setMobileOpen(false)}
              >
                התחברו / הרשמו
              </Link>
            ) : (
              <>
                <button
                  onClick={() => { handleSwitchToUser(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-300 w-full"
                >
                  <ArrowLeftRight size={14} aria-hidden="true" />
                  חזרה לחשבון רגיל
                </button>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-destructive w-full"
                >
                  <LogOut size={14} aria-hidden="true" />
                  התנתקו
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default BusinessNavbar;
