import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-card mt-20">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">R</span>
            </div>
            <span className="font-display font-bold text-lg">ReviewHub</span>
          </div>
          <p className="text-sm text-muted-foreground">Verified reviews for digital education in Israel.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Platform</h4>
          <div className="space-y-2">
            <Link to="/search" className="block text-sm text-muted-foreground hover:text-foreground">Browse Courses</Link>
            <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">For Business</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Resources</h4>
          <div className="space-y-2">
            <span className="block text-sm text-muted-foreground">API Documentation</span>
            <span className="block text-sm text-muted-foreground">Widget Guide</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Legal</h4>
          <div className="space-y-2">
            <span className="block text-sm text-muted-foreground">Privacy Policy</span>
            <span className="block text-sm text-muted-foreground">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReviewHub. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
