import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, ExternalLink, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedWidgetGeneratorProps {
  businessSlug: string;
  businessName: string;
  rating: number;
  reviewCount: number;
}

type WidgetType = "script" | "iframe" | "image";

const EmbedWidgetGenerator = ({ businessSlug, businessName, rating, reviewCount }: EmbedWidgetGeneratorProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<WidgetType>("script");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const widgetDataUrl = `${supabaseUrl}/functions/v1/widget-data?slug=${businessSlug}`;
  const widgetHtmlUrl = `${widgetDataUrl}&format=html`;
  const profileUrl = `${window.location.origin}/biz/${businessSlug}`;

  const embedCodes: Record<WidgetType, { label: string; description: string; code: string }> = {
    script: {
      label: "סקריפט JS",
      description: "הטמעה דינמית — הווידג'ט מתעדכן אוטומטית עם הדירוג והביקורות האחרונים.",
      code: `<!-- ReviewHub Widget -->
<div id="reviewhub-widget" data-slug="${businessSlug}"></div>
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${window.location.origin}/reviewhub-widget.js';
  s.async=true;
  d.head.appendChild(s);
})();
</script>`,
    },
    iframe: {
      label: "iFrame",
      description: "הטמעה פשוטה באמצעות iframe — עובד בכל פלטפורמה.",
      code: `<iframe src="${widgetHtmlUrl}" style="border:none;width:320px;height:80px;border-radius:12px;overflow:hidden;" title="ReviewHub Rating"></iframe>`,
    },
    image: {
      label: "תמונה + קישור",
      description: "באדג' סטטי עם קישור לפרופיל — מתאים לאימייל סיגנייצ'ר, חתימה באתר ועוד.",
      code: `<a href="${profileUrl}" target="_blank" rel="noopener" title="דירוג ${businessName} ב-ReviewHub">
  <img src="${supabaseUrl}/functions/v1/widget-badge?slug=${businessSlug}" alt="ReviewHub - ${rating.toFixed(1)} כוכבים מתוך ${reviewCount} ביקורות" style="height:48px;" />
</a>`,
    },
  };

  const handleCopy = (type: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    toast({ title: "הקוד הועתק! 📋", description: "הדביקו את הקוד באתר שלכם." });
    setTimeout(() => setCopied(null), 2000);
  };

  const displayRating = rating || 0;
  const displayStars = Math.round(displayRating);

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <Card className="shadow-card bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink size={18} className="text-primary" />
            תצוגה מקדימה של הווידג'ט
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow no-underline"
            >
              <img
                src="/favicon.ico"
                alt="ReviewHub"
                className="w-8 h-8 rounded-lg"
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">{displayRating.toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < displayStars ? "fill-star text-star" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">{reviewCount} ביקורות מאומתות</span>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  מופעל ע״י ReviewHub ✓
                </span>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Widget Type Selector */}
      <div className="flex gap-2">
        {(Object.keys(embedCodes) as WidgetType[]).map((type) => (
          <Button
            key={type}
            size="sm"
            variant={selectedType === type ? "default" : "outline"}
            onClick={() => setSelectedType(type)}
            className="text-xs"
          >
            {embedCodes[type].label}
          </Button>
        ))}
      </div>

      {/* Selected Embed Code */}
      <Card className="shadow-card bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 size={18} className="text-primary" />
              {embedCodes[selectedType].label}
              <Badge variant="outline" className="text-[10px]">העתקה</Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(selectedType, embedCodes[selectedType].code)}
              className="text-xs gap-1.5"
            >
              {copied === selectedType ? <Check size={14} /> : <Copy size={14} />}
              {copied === selectedType ? "הועתק!" : "העתק קוד"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{embedCodes[selectedType].description}</p>
          <div className="relative">
            <pre
              dir="ltr"
              className="bg-secondary rounded-lg p-4 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed"
            >
              {embedCodes[selectedType].code}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="shadow-card bg-card">
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-sm font-display font-semibold text-foreground">איך להטמיע?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              "העתיקו את הקוד למעלה",
              "הדביקו אותו ב-HTML של האתר שלכם — בפוטר, בדף הבית או בכל מקום שתרצו",
              "הווידג'ט יציג את הדירוג וכמות הביקורות שלכם בזמן אמת",
              "לחיצה על הווידג'ט תוביל לפרופיל שלכם ב-ReviewHub",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                  {i + 1}
                </div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbedWidgetGenerator;
