import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon-cropped.png";
import { Youtube, Instagram, Linkedin, Twitter, Facebook } from "lucide-react";

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/>
  </svg>
);

const REVIEWHUB_SOCIALS = [
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: TikTokIcon, href: "#", label: "TikTok" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "X" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

const Footer = () => (
  <footer className="border-t border-border/50 mt-20">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logoIcon} alt="ReviewHub" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">ReviewHub</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">ביקורות מאומתות לחינוך דיגיטלי בישראל.</p>
          <div className="flex gap-2 flex-wrap">
            {REVIEWHUB_SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">פלטפורמה</h4>
          <div className="space-y-2">
            <Link to="/search" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">עיון בקורסים</Link>
            <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">אודות</Link>
            <Link to="/for-business" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">לחברות</Link>
            <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">לוח בקרה</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">משאבים</h4>
          <div className="space-y-2">
            <span className="block text-sm text-muted-foreground">תיעוד API</span>
            <span className="block text-sm text-muted-foreground">מדריך וידג׳טים</span>
            <Link to="/#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">שאלות נפוצות</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm text-foreground">משפטי</h4>
          <div className="space-y-2">
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

export default Footer;
