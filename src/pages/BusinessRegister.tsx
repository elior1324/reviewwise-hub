import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import AIChatbot from "@/components/AIChatbot";

const CATEGORIES = ["שיווק", "תכנות", "עיצוב", "מדעי נתונים", "עסקים", "כושר", "שפות", "אחר"];

const BusinessRegister = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    businessName: "",
    website: "",
    email: "",
    phone: "",
    category: "",
    description: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.email || !form.category) {
      toast({ title: "אנא מלאו את כל השדות הנדרשים", variant: "destructive" });
      return;
    }
    toast({ title: "העסק נרשם בהצלחה! 🎉", description: "תוכלו לגשת ללוח הבקרה שלכם." });
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <div className="container py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-primary" />
            </div>
            <h1 className="font-display font-bold text-3xl text-foreground mb-2">הרשמת עסק חדש</h1>
            <p className="text-muted-foreground">הצטרפו ל-ReviewHub ובנו אמון אמיתי עם ביקורות מאומתות מלקוחות שרכשו בפועל</p>
          </div>

          <Card className="shadow-card animated-border bg-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                פרטי העסק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="mb-2 block">שם העסק *</Label>
                  <Input placeholder="לדוגמה: אקדמיית שיווק דיגיטלי" value={form.businessName} onChange={e => update("businessName", e.target.value)} className="glass border-border/50" />
                </div>
                <div>
                  <Label className="mb-2 block">קטגוריה *</Label>
                  <Select value={form.category} onValueChange={v => update("category", v)}>
                    <SelectTrigger className="glass border-border/50">
                      <SelectValue placeholder="בחרו קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">אימייל *</Label>
                  <Input type="email" placeholder="info@yourbusiness.co.il" value={form.email} onChange={e => update("email", e.target.value)} className="glass border-border/50" />
                </div>
                <div>
                  <Label className="mb-2 block">טלפון</Label>
                  <Input placeholder="03-1234567" value={form.phone} onChange={e => update("phone", e.target.value)} className="glass border-border/50" />
                </div>
                <div>
                  <Label className="mb-2 block">אתר אינטרנט</Label>
                  <Input placeholder="https://yourbusiness.co.il" value={form.website} onChange={e => update("website", e.target.value)} className="glass border-border/50" />
                </div>
                <div>
                  <Label className="mb-2 block">תיאור העסק</Label>
                  <Textarea placeholder="ספרו על העסק, הקורסים והשירותים שלכם..." value={form.description} onChange={e => update("description", e.target.value)} rows={4} className="glass border-border/50" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" size="lg">
                  הרשמה ויצירת פרופיל
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default BusinessRegister;
