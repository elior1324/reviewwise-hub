import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home, Search, ArrowRight, ShieldCheck, Info } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Detect if the path looks like a business profile (/biz/...)
  const isBizPath = location.pathname.startsWith("/biz/");
  const slug = isBizPath ? location.pathname.replace("/biz/", "") : null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg mx-auto">

          {/* Icon instead of big 404 number */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={36} className="text-primary" aria-hidden="true" />
          </div>

          {isBizPath ? (
            <>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                ישות זו אינה במאגר
              </h1>
              <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                <strong className="text-foreground">{slug}</strong> טרם נרשמה למערכת האימות של ReviewHub — או שהכתובת שגויה.
              </p>
              {/* Institutional framing: absence IS information */}
              <div className="flex items-start gap-3 text-right bg-card/60 border border-border/40 rounded-xl p-4 mb-8 text-sm text-muted-foreground">
                <Info size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong className="text-foreground">היעדר רשומה הוא מידע בפני עצמו.</strong>{" "}
                  אם יוצר או עסק אינם מופיעים במאגר, פירוש הדבר שציון האמון שלהם טרם אומת — ולא ניתן להסתמך על ביקורות שאינן מקושרות לרכישה.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Link to="/search">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto">
                    <Search size={16} aria-hidden="true" />
                    חפשו ישויות מאומתות
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="border-border/50 gap-2 w-full sm:w-auto">
                    <Home size={16} aria-hidden="true" />
                    עמוד הבית
                  </Button>
                </Link>
              </div>
              {/* Offer to request verification */}
              <p className="text-sm text-muted-foreground">
                מכירים את העסק ורוצים לראותו במאגר?{" "}
                <a href="mailto:support@reviewshub.info" className="text-primary hover:underline">
                  בקשו אימות
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                הדף לא נמצא
              </h1>
              <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                הקישור שניסיתם לגשת אליו אינו קיים, אולי הועבר או הוסר.
              </p>
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
            </>
          )}

          {/* Back link */}
          <button
            onClick={() => window.history.back()}
            className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
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
