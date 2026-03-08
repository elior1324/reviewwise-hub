import { Link } from "react-router-dom";

const BusinessFooter = () => (
  <footer className="border-t border-border/50 mt-20" dir="ltr">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">R</span>
            </div>
            <span className="font-display font-bold text-lg gradient-text">ReviewHub</span>
            <span className="text-xs text-muted-foreground">for Business</span>
          </div>
          <p className="text-sm text-muted-foreground">Verified reviews for digital education in Israel.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">Product</h4>
          <div className="space-y-2">
            <Link to="/business/solutions/reviews" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Verified Reviews</Link>
            <Link to="/business/solutions/widgets" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Widgets</Link>
            <Link to="/business/solutions/analytics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
            <Link to="/business/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">Resources</h4>
          <div className="space-y-2">
            <Link to="/business/resources/docs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
            <Link to="/business/resources/blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">Company</h4>
          <div className="space-y-2">
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/business/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <span className="block text-sm text-muted-foreground">Privacy Policy</span>
            <span className="block text-sm text-muted-foreground">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 mt-8 pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReviewHub. All rights reserved.
      </div>
    </div>
  </footer>
);

export default BusinessFooter;
