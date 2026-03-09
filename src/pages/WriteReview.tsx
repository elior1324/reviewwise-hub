import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Star, DollarSign, Sparkles, BadgeCheck, Clock } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ReceiptUploader from "@/components/ReceiptUploader";

const WriteReview = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [receiptVerified, setReceiptVerified] = useState<boolean | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "אנא בחרו דירוג", variant: "destructive" });
      return;
    }
    if (receiptVerified) {
      toast({
        title: "💥 בום! צברתם 200 נקודות (2x מאומת)!",
        description: "ביקורת מאומתת = כפול נקודות! תמשיכו לטפס בלידרבורד — 70% הנחה ממתינה למקום הראשון!",
      });
    } else if (receiptVerified === false) {
      toast({
        title: "💥 בום! צברתם 100 נקודות!",
        description: "הביקורת נשלחה! האימות עדיין בבדיקה — נקודות הבונוס יתווספו לאחר אישור.",
      });
    } else {
      toast({
        title: "💥 בום! צברתם 100 נקודות!",
        description: "הביקורת נשלחה! תמשיכו לכתוב ולטפס בדירוג — 70% הנחה ממתינה למקום הראשון!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10 pb-32 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-trust-green text-sm font-medium mb-4">
            <ShieldCheck size={18} />
            ביקורת רכישה מאומתת
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4 mb-6 border border-primary/20 bg-primary/5 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-foreground">
                  ביקורת מאומתת = הכנסה פאסיבית 💰
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  כשמישהו רוכש בזכות הביקורת שלכם — אתם מרוויחים חלק מההכנסות. בלי מאמץ נוסף.
                </p>
              </div>
            </div>
          </motion.div>

          <Card className="shadow-card animated-border bg-card">
            <CardHeader>
              <CardTitle className="font-display">כתבו ביקורת</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="mb-2 block">הדירוג שלכם</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} type="button" onClick={() => setRating(i)} className="focus:outline-none">
                        <Star
                          size={32}
                          className={`transition-colors ${i <= rating ? "fill-star text-star" : "fill-star-empty text-star-empty"} hover:fill-star hover:text-star`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="mb-2 block">השם שלכם</Label>
                  <Input id="name" placeholder="השם שלכם" value={name} onChange={e => setName(e.target.value)} disabled={anonymous} className="glass border-border/50" />
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                  <Label htmlFor="anonymous">שליחה אנונימית</Label>
                </div>

                <div>
                  <Label htmlFor="review" className="mb-2 block">הביקורת שלכם</Label>
                  <Textarea id="review" placeholder="שתפו את החוויה שלכם עם הקורס..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={5} className="glass border-border/50" />
                </div>

                {/* 2X Points Boost Section */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowUploader(!showUploader)}
                    className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <BadgeCheck size={20} className="text-emerald-500" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display font-bold text-foreground flex items-center gap-2 flex-wrap">
                          ⭐ 2X POINTS BOOST
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          אמתו את הרכישה שלכם וטפסו בלידרבורד <strong className="text-emerald-600">מהר כפול!</strong>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 mr-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        receiptVerified ? "border-emerald-500 bg-emerald-500" : "border-border"
                      }`}>
                        {receiptVerified && <BadgeCheck size={14} className="text-white" />}
                      </div>
                    </div>
                  </button>

                  {showUploader && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-emerald-500/15 p-4"
                    >
                      <ReceiptUploader
                        businessId=""
                        onVerified={(verified) => setReceiptVerified(verified)}
                      />
                    </motion.div>
                  )}

                  {/* Pending verification message */}
                  {receiptVerified === false && (
                    <div className="border-t border-emerald-500/15 p-3 flex items-center gap-2.5 bg-amber-500/5">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">אימות בבדיקה.</strong> בונוס x2 הנקודות יתווסף ברגע שהצוות שלנו יאשר את ההוכחה שלכם.
                      </p>
                    </div>
                  )}

                  {/* Verified success */}
                  {receiptVerified === true && (
                    <div className="border-t border-emerald-500/15 p-3 flex items-center gap-2.5 bg-emerald-500/5">
                      <BadgeCheck size={16} className="text-emerald-500 shrink-0" />
                      <p className="text-xs text-emerald-600 font-medium">
                        ✅ רכישה אומתה — הביקורת שלכם תזכה ב-2x נקודות!
                      </p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" size="lg">
                  שליחת ביקורת
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default WriteReview;
