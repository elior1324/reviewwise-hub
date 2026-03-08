import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Course } from "@/data/mockData";

interface ReviewRequestFormProps {
  courses: Course[];
}

const ReviewRequestForm = ({ courses }: ReviewRequestFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !courseId) {
      toast({ title: "שגיאה", description: "יש למלא אימייל ולבחור קורס.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-review-request", {
        body: { customer_email: email.trim(), course_id: courseId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "המייל נשלח בהצלחה! ✉️", description: `בקשת ביקורת נשלחה ל-${email}` });
      setEmail("");
      setCourseId("");
    } catch (e: any) {
      toast({ title: "שגיאה בשליחה", description: e.message || "נסו שנית", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="shadow-card animated-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Link2 size={20} /> שליחת בקשת ביקורת</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">אימייל לקוח</label>
          <Input
            placeholder="customer@example.com"
            className="glass border-border/50"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">בחרו קורס</label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="glass border-border/50">
              <SelectValue placeholder="בחרו קורס..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {courses.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">עדיין לא הוספתם קורסים.</p>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || !email || !courseId}
          className="bg-primary text-primary-foreground gap-2 glow-primary"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "שולח..." : "שליחת בקשה במייל"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewRequestForm;
