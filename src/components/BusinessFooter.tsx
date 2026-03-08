import { Link } from "react-router-dom";

const BusinessFooter = () => (
  <footer className="border-t border-border/50 mt-20" dir="rtl">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">ReviewHub</span>
            <span className="text-xs text-muted-foreground">לעסקים</span>
          </div>
          <p className="text-sm text-muted-foreground">ביקורות מאומתות לחינוך דיגיטלי בישראל.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">מוצר</h4>
          <div className="space-y-2">
            <Link to="/business/solutions/reviews" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">ביקורות מאומתות</Link>
            <Link to="/business/solutions/widgets" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">וידג׳טים</Link>
            <Link to="/business/solutions/analytics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">אנליטיקס</Link>
            <Link to="/business/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">מחירים</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">משאבים</h4>
          <div className="space-y-2">
            <Link to="/business/resources/docs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">תיעוד</Link>
            <Link to="/business/resources/blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">בלוג</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">חברה</h4>
          <div className="space-y-2">
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">אודות</Link>
            <Link to="/business/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">צרו קשר</Link>
            <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">מדיניות פרטיות</Link>
            <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">תנאי שימוש</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 mt-8 pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReviewHub. כל הזכויות שמורות.
      </div>
    </div>
  </footer>
);

export default BusinessFooter;
