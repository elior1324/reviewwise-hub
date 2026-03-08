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
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/business/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            מחירים
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            אודות
          </Link>
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
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-medium">
                  התחברו / הרשמו
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
          <Link to="/business/pricing" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>מחירים</Link>
          <Link to="/about" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>אודות</Link>
          <div className="border-t border-border/30 my-2" />
          {!user && (
            <Link to="/business/login" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>התחברו / הרשמו</Link>
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
