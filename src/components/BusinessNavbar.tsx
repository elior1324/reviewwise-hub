/**
 * BusinessNavbar — the navigation bar shown inside the Business Dashboard.
 *
 * Visibility rules:
 *  • "דף הבית", "מחירון" and "משאבים" are always visible (logged-in and logged-out).
 *  • "לוח הבקרה" is only shown to authenticated users — guests see a "התחברו / הרשמו" CTA instead.
 */
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, LayoutDashboard,
  ArrowLeftRight, Home, Tag, BookOpen, Settings,
} from "lucide-react";
import AccessibilityMenu from "./AccessibilityMenu";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";

const BusinessNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
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
      className="fixed top-0 z-50 w-full border-b bg-zinc-900 border-zinc-700/60 shadow-lg"
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

          {/* דף הבית — always visible */}
          <Link to="/business" className={navLink(location.pathname === "/business")}>
            <Home size={14} aria-hidden="true" />
            דף הבית
          </Link>

          {/* לוח הבקרה — authenticated only */}
          {user && (
            <Link to="/business/dashboard" className={navLink(isActive("/business/dashboard"))}>
              <LayoutDashboard size={14} aria-hidden="true" />
              לוח הבקרה
            </Link>
          )}

          {/* מחירון — always visible, highlighted */}
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

          {/* משאבים — always visible */}
          <Link
            to="/business/resources"
            className={navLink(isActive("/business/resources"))}
          >
            <BookOpen size={14} aria-hidden="true" />
            משאבים
          </Link>
        </div>

        {/* ── Right side ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />

          {/* Mode switch — visible to everyone, logged-in or not */}
          <button
            onClick={handleSwitchToUser}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-700/60 border border-zinc-600 text-zinc-200 hover:bg-zinc-600 hover:text-white hover:border-zinc-500 transition-all"
            aria-label="עבור לגלישה רגילה"
            title="עבור לגלישה רגילה"
          >
            <ArrowLeftRight size={12} aria-hidden="true" />
            גלישה רגילה
          </button>

          {user ? (
            /* Avatar hover menu — pb-2 bridges the gap, single hover opens it */
            <div
              className="relative pb-2"
              onMouseEnter={() => setUserOpen(true)}
              onMouseLeave={() => setUserOpen(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-800"
                aria-label="תפריט משתמש"
                aria-haspopup="menu"
                aria-expanded={userOpen}
              >
                <User size={18} />
              </Button>

              {userOpen && (
                <div
                  className="absolute top-full left-0 w-44 rounded-xl border border-zinc-700/80 bg-zinc-800/95 backdrop-blur-sm shadow-2xl py-1 z-50"
                  style={{ direction: "rtl" }}
                  role="menu"
                >
                  <Link
                    to="/business/settings"
                    role="menuitem"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm w-full text-zinc-200 hover:text-white hover:bg-zinc-700/50 transition-colors"
                  >
                    <Settings size={14} aria-hidden="true" />
                    הגדרות
                  </Link>
                  <div className="border-t border-zinc-700/60 my-0.5" />
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm w-full text-red-400 hover:text-red-300 hover:bg-zinc-700/50 transition-colors"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    התנתקו
                  </button>
                </div>
              )}
            </div>
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

          {/* דף הבית — always visible */}
          <Link
            to="/business"
            className={`flex items-center gap-2 text-sm py-3 min-h-[44px] font-medium border-r-2 pr-2 transition-colors ${location.pathname === "/business" ? "text-white border-white" : "text-zinc-300 border-transparent hover:text-white"}`}
            onClick={() => setMobileOpen(false)}
          >
            <Home size={14} aria-hidden="true" /> דף הבית
          </Link>

          {/* לוח הבקרה — authenticated only */}
          {user && (
            <Link
              to="/business/dashboard"
              className={`flex items-center gap-2 text-sm py-3 min-h-[44px] border-r-2 pr-2 transition-colors ${isActive("/business/dashboard") ? "text-white border-white font-medium" : "text-zinc-300 border-transparent hover:text-white"}`}
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard size={14} aria-hidden="true" /> לוח הבקרה
            </Link>
          )}

          {/* מחירון — always visible */}
          <Link
            to="/business/pricing"
            className={`flex items-center gap-2 text-sm py-3 min-h-[44px] font-semibold border-r-2 pr-2 transition-colors ${isActive("/business/pricing") ? "text-primary border-primary" : "text-primary/80 border-transparent hover:text-primary"}`}
            onClick={() => setMobileOpen(false)}
          >
            <Tag size={14} aria-hidden="true" /> מחירון
          </Link>

          {/* משאבים — always visible */}
          <Link
            to="/business/resources"
            className={`flex items-center gap-2 text-sm py-3 min-h-[44px] border-r-2 pr-2 transition-colors ${isActive("/business/resources") ? "text-white border-white font-medium" : "text-zinc-300 border-transparent hover:text-white"}`}
            onClick={() => setMobileOpen(false)}
          >
            <BookOpen size={14} aria-hidden="true" /> משאבים
          </Link>

          <div className="border-t border-zinc-700/60 pt-1 mt-1">
            {/* גלישה רגילה — visible to everyone */}
            <button
              onClick={() => { handleSwitchToUser(); setMobileOpen(false); }}
              className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-300 w-full"
            >
              <ArrowLeftRight size={14} aria-hidden="true" />
              גלישה רגילה
            </button>
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
                <Link
                  to="/business/settings"
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-300 hover:text-white"
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
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default BusinessNavbar;
