import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, Shield, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "reviewhub_cookie_consent";

type ConsentState = "accepted" | "rejected" | "essential-only" | null;

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY) as ConsentState;
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(CONSENT_KEY, "essential-only");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          dir="rtl"
        >
          <div className="max-w-4xl mx-auto rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Cookie size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground text-base mb-1">
                    אנחנו משתמשים בעוגיות 🍪
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    אתר ReviewHub משתמש בעוגיות (Cookies) הכרחיות לתפעול האתר, ובעוגיות נוספות לשיפור חוויית הגלישה, ניתוח סטטיסטי ושיווק מותאם. 
                    בהתאם ל<strong>תיקון 13 לחוק הגנת הפרטיות, התשמ"א-1981</strong>, אנו מבקשים את הסכמתכם המדעת לשימוש בעוגיות שאינן הכרחיות.
                  </p>

                  {/* Details toggle */}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    {showDetails ? "הסתר פרטים ▲" : "פרטים נוספים ▼"}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t border-border/30 pt-3">
                          <div className="flex items-start gap-2">
                            <Shield size={14} className="text-primary shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-foreground">עוגיות הכרחיות</strong> — נדרשות לתפעול בסיסי של האתר (אימות, אבטחה, הגדרות). אלו פועלות תמיד ואינן דורשות הסכמה.
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Shield size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-foreground">עוגיות ביצועים וניתוח</strong> — עוזרות לנו להבין כיצד גולשים משתמשים באתר, לזהות בעיות ולשפר את השירות.
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Shield size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-foreground">עוגיות שיווק</strong> — משמשות להצגת תוכן ופרסומות רלוונטיים עבורכם.
                            </div>
                          </div>
                          <p className="pt-1">
                            למידע נוסף, קראו את{" "}
                            <Link to="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</Link>{" "}
                            שלנו.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Close button */}
                <button
                  onClick={handleEssentialOnly}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="סגור"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mr-[52px]">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  size="sm"
                >
                  אישור כל העוגיות
                </Button>
                <Button
                  onClick={handleEssentialOnly}
                  variant="outline"
                  className="border-border/50 text-sm"
                  size="sm"
                >
                  הכרחיות בלבד
                </Button>
                <Button
                  onClick={handleReject}
                  variant="ghost"
                  className="text-muted-foreground text-sm"
                  size="sm"
                >
                  דחייה
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
