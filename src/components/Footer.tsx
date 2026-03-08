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
          <p className="text-sm text-muted-foreground">הפלטפורמה שעוזרת לכם לבחור נכון ולבנות את העתיד.</p>
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
            <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">מדיניות ביטולים והחזרים</Link>
            <Link to="/accessibility" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">הצהרת נגישות</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 mt-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground text-center md:text-right">
            <p className="font-semibold text-foreground mb-1">ReviewHub בע"מ</p>
            <p>תל אביב, ישראל</p>
            <p>אימייל: <a href="mailto:support@reviewhub.co.il" className="text-primary hover:underline">support@reviewhub.co.il</a></p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ReviewHub בע"מ. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
