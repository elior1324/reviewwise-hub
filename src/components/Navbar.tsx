import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Navbar = () => (
  <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="container flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-display font-bold text-sm">R</span>
        </div>
        <span className="font-display font-bold text-xl text-foreground">ReviewHub</span>
      </Link>
      <div className="hidden md:flex items-center gap-6">
        <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Browse Courses
        </Link>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          For Business
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/search">
          <Button variant="ghost" size="icon">
            <Search size={18} />
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;
