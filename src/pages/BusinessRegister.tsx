import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import AIChatbot from "@/components/AIChatbot";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const OTHER_VALUE = "__other__";

const BusinessRegister = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: freelancerCats = [], isLoading: catsLoading } = useCategories("freelancer");
  const { data: courseCats = [] } = useCategories("course");

  const [form, setForm] = useState({
    businessName: "",
    website: "",
    email: "",
    phone: "",
    category: "",
    customCategory: "",
    businessType: "freelancer" as "freelancer" | "course-provider",
    description: "",
  });

  const categories = form.businessType === "freelancer" ? freelancerCats : courseCats;
  const filteredCategories = categories.filter(c => c !== "אחר");

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.email || (!form.category && !form.customCategory)) {
      toast({ title: "אנא מלאו את כל השדות הנדרשים", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "יש להתחבר כדי לרשום עסק", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const isCustomCategory = form.category === OTHER_VALUE && form.customCategory.trim();
    const finalCategory = isCustomCategory ? "אחר" : form.category;

    // Create slug
    const slug = form.businessName
      .toLowerCase()
      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Date.now().toString(36);

    try {
      // Insert business
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .insert({
          name: form.businessName,
          slug,
          category: finalCategory,
          owner_id: user.id,
          email: form.email,
          phone: form.phone || null,
          website: form.website || null,
          description: form.description || null,
        })
        .select("id")
        .single();

      if (bizError) throw bizError;

      // If custom category, call evaluate-category edge function
      if (isCustomCategory && biz) {
        const { data: evalData, error: evalError } = await supabase.functions.invoke("evaluate-category", {
          body: {
            suggested_name: form.customCategory.trim(),
            type: form.businessType === "course-provider" ? "course" : "freelancer",
            business_id: biz.id,
          },
        });

        if (!evalError && evalData) {
          if (evalData.status === "already_exists") {
            // Category exists - update business to use it
            await supabase
              .from("businesses")
              .update({ category: evalData.category })
              .eq("id", biz.id);

            toast({
              title: "העסק נרשם בהצלחה! 🎉",
              description: `הוצב בקטגוריה: ${evalData.category}`,
            });
          } else if (evalData.status === "approved" || evalData.status === "mapped_to_existing") {
            await supabase
              .from("businesses")
              .update({ category: evalData.category })
              .eq("id", biz.id);

            toast({
              title: "העסק נרשם בהצלחה! 🎉✨",
              description: `קטגוריה חדשה נוצרה: ${evalData.category}`,
            });
          } else if (evalData.status === "pending") {
            toast({
              title: "העסק נרשם בהצלחה! 🎉",
              description: evalData.message || `העסק שויך לקטגוריית "אחר" בינתיים. ${evalData.suggestions_count}/${evalData.threshold} עסקים ביקשו קטגוריה זו.`,
            });
          } else {
            toast({
              title: "העסק נרשם בהצלחה! 🎉",
              description: `שויך לקטגוריית "אחר"`,
            });
          }
        } else {
          toast({ title: "העסק נרשם בהצלחה! 🎉", description: "שויך לקטגוריית \"אחר\" בינתיים." });
        }
      } else {
        toast({ title: "העסק נרשם בהצלחה! 🎉", description: "תוכלו לגשת ללוח הבקרה שלכם." });
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      toast({ title: "שגיאה ברישום", description: err.message, variant: "destructive" });
    }
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
                  <Label className="mb-2 block">סוג העסק *</Label>
                  <Select value={form.businessType} onValueChange={v => { update("businessType", v); update("category", ""); }}>
                    <SelectTrigger className="glass border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelancer">בעל מקצוע / פרילנסר</SelectItem>
                      <SelectItem value="course-provider">ספק קורסים / מוסד לימודים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">קטגוריה *</Label>
                  <Select value={form.category} onValueChange={v => update("category", v)}>
                    <SelectTrigger className="glass border-border/50">
                      <SelectValue placeholder={catsLoading ? "טוען קטגוריות..." : "בחרו קטגוריה"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value={OTHER_VALUE}>
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-primary" />
                          אחר — הוסיפו קטגוריה חדשה
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.category === OTHER_VALUE && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="mb-2 block">שם הקטגוריה החדשה *</Label>
                    <Input
                      placeholder="לדוגמה: מסחר בשוק ההון, אימון אישי, ניהול מוצר..."
                      value={form.customCategory}
                      onChange={e => update("customCategory", e.target.value)}
                      className="glass border-border/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Sparkles size={12} className="text-primary" />
                      הקטגוריה תתווסף אוטומטית לאתר אחרי ש-3 עסקים יבקשו אותה. בינתיים העסק יופיע בקטגוריית "אחר".
                    </p>
                  </motion.div>
                )}

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
