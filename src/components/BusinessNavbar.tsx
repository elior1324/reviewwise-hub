import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
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
    <nav className="glass sticky top-0 z-50 border-b border-border/50" dir="ltr">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/business" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary glow-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">R</span>
          </div>
          <span className="font-display font-bold text-xl gradient-text">ReviewHub</span>
          <span className="text-xs text-muted-foreground font-medium border border-border/50 rounded px-1.5 py-0.5">for Business</span>
        </Link>

        {/* Center nav */}
        <div className="hidden lg:flex items-center gap-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4 grid gap-3">
                    <Link to="/business/solutions/reviews" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Verified Reviews</p>
                      <p className="text-xs text-muted-foreground">Collect authentic reviews from real customers</p>
                    </Link>
                    <Link to="/business/solutions/widgets" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Embeddable Widgets</p>
                      <p className="text-xs text-muted-foreground">Show reviews on your website with one line of code</p>
                    </Link>
                    <Link to="/business/solutions/analytics" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Analytics & Insights</p>
                      <p className="text-xs text-muted-foreground">AI-powered weekly reports and performance tracking</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4 grid gap-3">
                    <Link to="/business/features/affiliate" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Affiliate Tracking</p>
                      <p className="text-xs text-muted-foreground">Track clicks, conversions and revenue</p>
                    </Link>
                    <Link to="/business/features/ai-insights" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">AI Weekly Reports</p>
                      <p className="text-xs text-muted-foreground">Automated insights on strengths and weaknesses</p>
                    </Link>
                    <Link to="/business/features/review-requests" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Review Requests</p>
                      <p className="text-xs text-muted-foreground">Send automated review links to customers</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/business/pricing" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 inline-block">
                  Pricing
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[300px] p-4 grid gap-3">
                    <Link to="/business/resources/docs" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Documentation</p>
                      <p className="text-xs text-muted-foreground">API docs and widget guides</p>
                    </Link>
                    <Link to="/business/resources/blog" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Blog</p>
                      <p className="text-xs text-muted-foreground">Tips and best practices</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground">
                  Company
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[300px] p-4 grid gap-3">
                    <Link to="/about" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">About Us</p>
                      <p className="text-xs text-muted-foreground">Our mission and team</p>
                    </Link>
                    <Link to="/business/contact" className="block rounded-lg p-3 hover:bg-secondary transition-colors">
                      <p className="font-display font-semibold text-sm">Contact</p>
                      <p className="text-xs text-muted-foreground">Get in touch with our team</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
                <DropdownMenuItem onClick={() => navigate("/business/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut size={14} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/business/login">
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/business/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-medium">
                  Create Free Account
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
        <div className="lg:hidden border-t border-border/50 p-4 space-y-3 glass" dir="ltr">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Solutions</p>
          <Link to="/business/solutions/reviews" className="block text-sm py-1 pl-3" onClick={() => setMobileOpen(false)}>Verified Reviews</Link>
          <Link to="/business/solutions/widgets" className="block text-sm py-1 pl-3" onClick={() => setMobileOpen(false)}>Embeddable Widgets</Link>
          <Link to="/business/solutions/analytics" className="block text-sm py-1 pl-3" onClick={() => setMobileOpen(false)}>Analytics & Insights</Link>
          <div className="border-t border-border/30 my-2" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Features</p>
          <Link to="/business/features/affiliate" className="block text-sm py-1 pl-3" onClick={() => setMobileOpen(false)}>Affiliate Tracking</Link>
          <Link to="/business/features/ai-insights" className="block text-sm py-1 pl-3" onClick={() => setMobileOpen(false)}>AI Weekly Reports</Link>
          <div className="border-t border-border/30 my-2" />
          <Link to="/business/pricing" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link to="/about" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>About Us</Link>
          <div className="border-t border-border/30 my-2" />
          {!user && (
            <>
              <Link to="/business/login" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/business/signup" className="block text-sm py-2 text-primary" onClick={() => setMobileOpen(false)}>Create Free Account</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/business/dashboard" className="block text-sm py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block text-sm py-2 text-destructive">Sign Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default BusinessNavbar;
