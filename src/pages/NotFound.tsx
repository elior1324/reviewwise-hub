import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home, Search, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md mx-auto">
          {/* Large 404 */}
          <p className="text-8xl font-display font-bold gradient-text mb-2" aria-hidden="true">
            404
          </p>

          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            הדף לא נמצא
          </h1>
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            הקישור שניסיתם לגשת אליו אינו קיים, אולי הועבר או הוסר.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto">
                <Home size={16} aria-hidden="true" />
                חזרה לעמוד הבית
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="border-border/50 gap-2 w-full sm:w-auto">
                <Search size={16} aria-hidden="true" />
                חיפוש
              </Button>
            </Link>
          </div>

          {/* Back link */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowRight size={14} aria-hidden="true" />
            חזרה לדף הקודם
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
