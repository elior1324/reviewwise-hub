import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, User, Scale, Trophy,
  ChevronDown, ShieldCheck, LayoutDashboard, BarChart3, Tag, BookOpen, Briefcase,
  UserCircle, ArrowLeftRight, Gift,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import type { AppMode } from "@/contexts/ModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "./NotificationBell";
import AccessibilityMenu from "./AccessibilityMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, dir } = useLanguage();

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

  // ── "לעסקים" dropdown items — translated ────────────────────────────────────
  const PRODUCT_LINKS = [
    { to: "/business",                     icon: ShieldCheck,     label: t("nav.allSolutions")       },
    { to: "/business/solutions/reviews",   icon: BarChart3,       label: t("nav.reviewVerification") },
    { to: "/business/solutions/analytics", icon: LayoutDashboard, label: t("nav.analyticsLabel")     },
  ];

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
      {/* ── Business Mode context band ─────────────────────────────────────────*/}
      {isBusinessMode && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 py-1 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-[11px] font-semibold">
            <Briefcase size={11} aria-hidden="true" />
            <span>{t("nav.businessModeActive")} — {t("nav.managingBusinessProfile")}</span>
          </div>
          {user && (
            <button
              onClick={handleSwitchToConsumer}
              className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 transition-colors"
              aria-label={t("nav.consumerMode")}
            >
              <UserCircle size={10} aria-hidden="true" />
              {t("nav.consumerMode")}
            </button>
          )}
        </div>
      )}

      <div className="container flex items-center justify-between h-16">

        {/* ── Left side: Logo + "לעסקים" dropdown ─────────────────────────────── */}
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
                  {t("nav.businessModeActive").split(" ")[0]}
                </span>
              )}
            </span>
          </Link>

          {/* ── "לעסקים / For Business" dropdown ── */}
          <div className="hidden md:block">
            <DropdownMenu open={productOpen} onOpenChange={setProductOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus-visible:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={productOpen}
                >
                  {t("nav.forBusiness")}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${productOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52" style={{ direction: dir }}>
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
                        <span className="text-primary font-medium">{t("nav.prices")}</span>
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
                        {t("nav.businessPortalLogin")}
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
                {t("nav.businessHome")}
              </Link>
              <Link to="/business/dashboard" className={navLinkCls("/business/dashboard", true)}>
                <LayoutDashboard size={14} aria-hidden="true" />
                {t("nav.dashboard")}
              </Link>
              <Link to="/business/pricing" className={navLinkCls("/business/pricing", true)}>
                <Tag size={14} aria-hidden="true" />
                {t("nav.pricing")}
              </Link>
              <Link to="/business/solutions/reviews" className={navLinkCls("/business/solutions/reviews", true)}>
                <ShieldCheck size={14} aria-hidden="true" />
                {t("nav.reviewVerification")}
              </Link>
            </>
          ) : (
            /* ── Consumer mode nav ── */
            <>
              <Link to="/" className={navLinkCls("/")}>
                {t("nav.home")}
              </Link>
              <Link to="/search" className={navLinkCls("/search")}>
                {t("nav.search")}
              </Link>
              <Link to="/leaderboard" className={navLinkCls("/leaderboard")}>
                <Trophy size={14} aria-hidden="true" />
                {t("nav.community")}
              </Link>
              <Link to="/compare" className={navLinkCls("/compare")}>
                <Scale size={14} aria-hidden="true" />
                {t("nav.compare")}
              </Link>
              <Link to="/about" className={navLinkCls("/about")}>
                <BookOpen size={14} aria-hidden="true" />
                {t("nav.about")}
              </Link>
            </>
          )}
        </div>

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Language switcher — appears next to the accessibility button */}
          <LanguageSwitcher />
          <AccessibilityMenu />
          {user && <NotificationBell />}

          {/* ── Mode switch pill — consumer → business ─── */}
          {!isBusinessMode && (
            <button
              onClick={handleSwitchToBusiness}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/70 transition-all"
              aria-label={t("nav.businessProfile")}
              title={t("nav.businessProfile")}
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              {t("nav.businessProfile")}
            </button>
          )}
          {/* ── Mode switch pill — business → consumer ─── */}
          {isBusinessMode && (
            <button
              onClick={handleSwitchToConsumer}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-700/60 border border-zinc-600 text-zinc-200 hover:bg-zinc-600 hover:text-white hover:border-zinc-500 transition-all"
              aria-label={t("nav.regularBrowsing")}
              title={t("nav.regularBrowsing")}
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              {t("nav.regularBrowsing")}
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full border ${isBusinessMode ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700" : "border-border/50"}`}
                  aria-label={t("nav.userMenu")}
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
                  <ArrowLeftRight size={14} className="me-2" aria-hidden="true" />
                  {isBusinessMode ? t("nav.regularBrowsing") : t("nav.businessProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/user/referrals" className="flex items-center gap-2 w-full text-primary font-medium">
                    <Gift size={14} className="me-2 text-primary" aria-hidden="true" />
                    {t("nav.inviteFriends")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={14} className="me-2" aria-hidden="true" />
                  {t("nav.logout")}
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
                  {t("nav.loginRegister")}
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t p-4 space-y-1 ${isBusinessMode ? "bg-zinc-900 border-zinc-700/60" : "glass border-border/50"}`}
          dir={dir}
        >
          {isBusinessMode ? (
            /* ── Business mode mobile nav ── */
            <>
              <Link
                to="/business"
                className="block text-sm py-3 min-h-[44px] flex items-center text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.businessHome")}
              </Link>
              <Link
                to="/business/dashboard"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} aria-hidden="true" />
                {t("nav.dashboard")}
              </Link>
              <Link
                to="/business/pricing"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <Tag size={14} aria-hidden="true" />
                {t("nav.pricing")}
              </Link>
              <Link
                to="/business/solutions/reviews"
                className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-zinc-200 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck size={14} aria-hidden="true" />
                {t("nav.reviewVerification")}
              </Link>
              <div className="border-t border-zinc-700/60 pt-1">
                <button
                  onClick={() => { handleSwitchToConsumer(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-amber-400 w-full"
                >
                  <UserCircle size={14} aria-hidden="true" />
                  {t("nav.consumerMode")}
                </button>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-destructive w-full"
                >
                  <LogOut size={14} aria-hidden="true" />
                  {t("nav.logout")}
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
                {t("nav.home")}
              </Link>
              <Link
                to="/search"
                className="block text-sm py-3 min-h-[44px] flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.search")}
              </Link>

              {/* Business sub-links */}
              <div className="border-t border-border/30 pt-2 pb-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-0 mb-1">
                  {t("nav.forBusiness")}
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
                    {t("nav.prices")}
                  </Link>
                )}
              </div>

              <div className="border-t border-border/30 pt-1">
                <Link
                  to="/leaderboard"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.community")}
                </Link>
                <Link
                  to="/compare"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.compareAlt")}
                </Link>
                <Link
                  to="/about"
                  className="block text-sm py-3 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.about")}
                </Link>
              </div>

              <div className="border-t border-border/30 pt-1">
                <button
                  onClick={() => { handleSwitchToBusiness(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-primary font-medium w-full"
                >
                  <ArrowLeftRight size={14} aria-hidden="true" />
                  {t("nav.businessProfile")}
                </button>
                {!user && (
                  <Link
                    to="/auth"
                    className="block text-sm py-3 min-h-[44px] flex items-center text-muted-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.loginRegisterMobile")}
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      to="/user/referrals"
                      className="flex items-center gap-2 text-sm py-3 min-h-[44px] text-primary font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Gift size={14} aria-hidden="true" />
                      {t("nav.inviteFriends")}
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      className="block text-sm py-3 min-h-[44px] flex items-center text-destructive w-full"
                    >
                      {t("nav.logout")}
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
