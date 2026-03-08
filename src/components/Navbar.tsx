import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, PenLine } from "lucide-react";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoIcon} alt="ReviewHub Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
          <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            עמוד הבית
          </Link>
          <Link to="/write-review" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <PenLine size={14} />
            כתבו ביקורת
          </Link>
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            קטגוריות
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            אודות
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}

          {/* לעסקים */}
          <Link to="/business" className="hidden md:block">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              לעסקים
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border border-border/50">
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
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
              <Link to="/auth">
                <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-medium">
                  התחברו
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
                  צרו חשבון
                </Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 p-4 space-y-3 glass">
          <Link to="/write-review" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>כתבו ביקורת</Link>
          <Link to="/search" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>קטגוריות</Link>
          <Link to="/about" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>אודות</Link>
          <Link to="/business" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>לעסקים</Link>
          {user && <Link to="/dashboard" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>לוח בקרה</Link>}
          {!user && <Link to="/auth" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>התחברו / צרו חשבון</Link>}
          {user && (
            <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block text-sm py-2 text-destructive">
              התנתקו
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
