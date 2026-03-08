import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, LogOut, User } from "lucide-react";
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
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary glow-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">R</span>
          </div>
          <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            עיון בקורסים
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            אודות
          </Link>
          <Link to="/for-business" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            לחברות
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              לוח בקרה
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/search">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search size={18} />
            </Button>
          </Link>
          {user && <NotificationBell />}

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
            <>
              <Link to="/auth" className="hidden md:block">
                <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-medium">
                  התחברו
                </Button>
              </Link>
              <Link to="/auth" className="hidden md:block">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                  הרשמו
                </Button>
              </Link>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 p-4 space-y-3 glass">
          <Link to="/search" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>עיון בקורסים</Link>
          <Link to="/about" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>אודות</Link>
          <Link to="/for-business" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>לחברות</Link>
          {user && <Link to="/dashboard" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>לוח בקרה</Link>}
          {!user && <Link to="/auth" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>התחברו / הרשמו</Link>}
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
