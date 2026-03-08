import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import AccessibilityMenu from "./AccessibilityMenu";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const BusinessNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border/50" dir="rtl">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to="/business" className="flex items-center gap-2">
            <img src={logoIcon} alt="ReviewHub Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
            <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
            <span className="text-xs text-muted-foreground font-medium border border-border/50 rounded px-1.5 py-0.5">לעסקים</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium border border-border/50 rounded px-2 py-1 hover:border-primary/50">
            ← לאישי
          </Link>
        </div>

        {/* Center nav */}
        <div className="hidden lg:flex items-center gap-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  פתרונות
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[520px] p-5 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">לפי יעד עסקי</p>
                      <div className="space-y-1">
                        <Link to="/business/solutions/engage" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">ניהול משוב</p>
                          <p className="text-xs text-muted-foreground">השיבו לביקורות ובנו קשר עם הלקוחות</p>
                        </Link>
                        <Link to="/business/solutions/conversions" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">האצת המרות</p>
                          <p className="text-xs text-muted-foreground">הפכו ביקורות חיוביות למנוע צמיחה</p>
                        </Link>
                        <Link to="/business/solutions/insights" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">שיפור עם תובנות</p>
                          <p className="text-xs text-muted-foreground">זהו חוזקות וחולשות בעזרת דוחות AI</p>
                        </Link>
                        <Link to="/business/solutions/revenue" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">הגדלת הכנסות</p>
                          <p className="text-xs text-muted-foreground">מעקב אפיליאט, קליקים והמרות</p>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">לפי גודל עסק</p>
                      <div className="space-y-1">
                        <Link to="/business/solutions/small-business" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">עסקים קטנים וצומחים</p>
                          <p className="text-xs text-muted-foreground">כלים פשוטים לבניית מוניטין מהיום הראשון</p>
                        </Link>
                        <Link to="/business/solutions/enterprise" className="block rounded-lg p-2.5 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-sm">ארגונים וחברות גדולות</p>
                          <p className="text-xs text-muted-foreground">API, אינטגרציות מותאמות ומנהל חשבון</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  יכולות
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[680px] p-5 grid grid-cols-4 gap-5">
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">הזמנת ביקורות</p>
                      <div className="space-y-1">
                        <Link to="/business/features/service-reviews" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">ביקורות שירות</p>
                        </Link>
                        <Link to="/business/features/product-reviews" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">ביקורות מוצר</p>
                        </Link>
                        <Link to="/business/features/location-reviews" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">ביקורות מיקום</p>
                        </Link>
                        <Link to="/business/features/review-invitations" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">הזמנות ביקורת</p>
                        </Link>
                      </div>
                      <div className="border-t border-border/30 my-3" />
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">ניהול משוב</p>
                      <div className="space-y-1">
                        <Link to="/business/features/profile-page" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">דף פרופיל</p>
                        </Link>
                        <Link to="/business/features/respond-reviews" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">תגובה לביקורות</p>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">האצת המרות</p>
                      <div className="space-y-1">
                        <Link to="/business/features/review-seo" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">SEO ביקורות וגילוי AI</p>
                        </Link>
                        <Link to="/business/features/widgets" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">וידג׳טים להטמעה</p>
                        </Link>
                        <Link to="/business/features/social-media" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">כלי רשתות חברתיות</p>
                        </Link>
                        <Link to="/business/features/marketing-assets" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">נכסים שיווקיים</p>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">שיפור עם תובנות</p>
                      <div className="space-y-1">
                        <Link to="/business/features/review-spotlight" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">זרקור ביקורות</p>
                        </Link>
                        <Link to="/business/features/market-insights" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">תובנות שוק</p>
                        </Link>
                        <Link to="/business/features/review-insights" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">תובנות ביקורות</p>
                        </Link>
                        <Link to="/business/features/analytics" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">נתונים ואנליטיקס</p>
                        </Link>
                        <Link to="/business/features/review-tagging" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">תיוג ביקורות</p>
                        </Link>
                        <Link to="/business/features/visitor-insights" className="block rounded-lg p-2 hover:bg-secondary transition-colors">
                          <p className="font-display font-semibold text-[13px]">תובנות מבקרים</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/business/pricing" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 inline-block">
                  מחירים
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  משאבים
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[300px] p-4 grid gap-3">
                    <Link to="/business/resources/docs" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">תיעוד</p>
                      <p className="text-xs text-muted-foreground">תיעוד API ומדריכי וידג׳טים</p>
                    </Link>
                    <Link to="/business/resources/blog" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">בלוג</p>
                      <p className="text-xs text-muted-foreground">טיפים ומתודולוגיות מומלצות</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  אודות
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[300px] p-4 grid gap-3">
                    <Link to="/about" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">אודותינו</p>
                      <p className="text-xs text-muted-foreground">המשימה והצוות שלנו</p>
                    </Link>
                    <Link to="/business/contact" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">צרו קשר</p>
                      <p className="text-xs text-muted-foreground">דברו עם הצוות שלנו</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <AccessibilityMenu />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border border-border/50">
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/dashboard")}>
                  לוח בקרה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={14} className="ml-2" />
                  התנתקו
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/business/login">
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  התחברו
                </Button>
              </Link>
              <Link to="/business/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-medium">
                  צרו חשבון בחינם
                </Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/50 p-4 space-y-3 glass">
          <p className="text-xs text-muted-foreground font-medium">פתרונות — לפי יעד עסקי</p>
          <Link to="/business/solutions/engage" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>ניהול משוב</Link>
          <Link to="/business/solutions/conversions" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>האצת המרות</Link>
          <Link to="/business/solutions/insights" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>שיפור עם תובנות</Link>
          <Link to="/business/solutions/revenue" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>הגדלת הכנסות</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium">פתרונות — לפי גודל עסק</p>
          <Link to="/business/solutions/small-business" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>עסקים קטנים וצומחים</Link>
          <Link to="/business/solutions/enterprise" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>ארגונים וחברות גדולות</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium">יכולות — הזמנת ביקורות</p>
          <Link to="/business/features/service-reviews" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>ביקורות שירות</Link>
          <Link to="/business/features/product-reviews" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>ביקורות מוצר</Link>
          <Link to="/business/features/location-reviews" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>ביקורות מיקום</Link>
          <Link to="/business/features/review-invitations" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>הזמנות ביקורת</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium">יכולות — ניהול משוב</p>
          <Link to="/business/features/profile-page" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>דף פרופיל</Link>
          <Link to="/business/features/respond-reviews" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>תגובה לביקורות</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium">יכולות — האצת המרות</p>
          <Link to="/business/features/review-seo" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>SEO ביקורות וגילוי AI</Link>
          <Link to="/business/features/widgets" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>וידג׳טים להטמעה</Link>
          <Link to="/business/features/social-media" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>כלי רשתות חברתיות</Link>
          <Link to="/business/features/marketing-assets" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>נכסים שיווקיים</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium">יכולות — שיפור עם תובנות</p>
          <Link to="/business/features/review-spotlight" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>זרקור ביקורות</Link>
          <Link to="/business/features/market-insights" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>תובנות שוק</Link>
          <Link to="/business/features/review-insights" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>תובנות ביקורות</Link>
          <Link to="/business/features/analytics" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>נתונים ואנליטיקס</Link>
          <Link to="/business/features/review-tagging" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>תיוג ביקורות</Link>
          <Link to="/business/features/visitor-insights" className="block text-sm py-1 pr-3" onClick={() => setMobileOpen(false)}>תובנות מבקרים</Link>
          <div className="border-t border-border/30 my-2" />
          <Link to="/business/pricing" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>מחירים</Link>
          <Link to="/about" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>אודותינו</Link>
          <div className="border-t border-border/30 my-2" />
          {!user && (
            <>
              <Link to="/business/login" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>התחברו</Link>
              <Link to="/business/signup" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>צרו חשבון בחינם</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/business/dashboard" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>לוח בקרה</Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block text-sm py-2 text-destructive">התנתקו</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default BusinessNavbar;
