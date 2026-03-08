import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon-cropped.png";

const Footer = () => (
  <footer className="border-t border-border/50 mt-20">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">ReviewHub</span>
          </div>
          <p className="text-sm text-muted-foreground">ביקורות מאומתות לחינוך דיגיטלי בישראל.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">פלטפורמה</h4>
          <div className="space-y-2">
            <Link to="/search" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">עיון בקורסים</Link>
            <Link to="/compare" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">השוואה</Link>
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">אודות</Link>
            <Link to="/business" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">לעסקים</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">משפטי</h4>
          <div className="space-y-2">
            <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">מדיניות פרטיות</Link>
            <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">תנאי שימוש</Link>
            <Link to="/accessibility" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">הצהרת נגישות</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 mt-8 pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReviewHub. כל הזכויות שמורות.
      </div>
    </div>
  </footer>
);

export default Footer;
