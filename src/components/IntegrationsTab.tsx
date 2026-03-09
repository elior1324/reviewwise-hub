import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import LockedOverlay from "@/components/LockedOverlay";
import { Lock, Webhook, Link2, Key, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface IntegrationsTabProps {
  businessId: string;
  isPremium: boolean;
  isDemo: boolean;
  onUpgrade: () => void;
}

interface IntegrationConfig {
  webhook_url?: string;
  api_key?: string;
}

const IntegrationsTab = ({ businessId, isPremium, isDemo, onUpgrade }: IntegrationsTabProps) => {
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsActive, setSheetsActive] = useState(false);
  const [sheetsSaving, setSheetsSaving] = useState(false);
  const [sheetsSaved, setSheetsSaved] = useState(false);

  const [hubspotKey, setHubspotKey] = useState("");
  const [hubspotActive, setHubspotActive] = useState(false);
  const [hubspotSaving, setHubspotSaving] = useState(false);
  const [hubspotSaved, setHubspotSaved] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !businessId) {
      setLoading(false);
      return;
    }
    const fetchIntegrations = async () => {
      const { data } = await supabase
        .from("business_integrations" as any)
        .select("*")
        .eq("business_id", businessId);

      if (data) {
        const sheets = (data as any[]).find((d: any) => d.integration_type === "google_sheets");
        if (sheets) {
          setSheetsUrl(sheets.config?.webhook_url || "");
          setSheetsActive(sheets.active);
          setSheetsSaved(true);
        }
        const hubspot = (data as any[]).find((d: any) => d.integration_type === "hubspot");
        if (hubspot) {
          setHubspotKey(hubspot.config?.api_key ? "••••••••" : "");
          setHubspotActive(hubspot.active);
          setHubspotSaved(true);
        }
      }
      setLoading(false);
    };
    fetchIntegrations();
  }, [businessId, isDemo]);

  const saveIntegration = async (type: string, config: IntegrationConfig, active: boolean) => {
    if (isDemo) {
      toast({ title: "מצב דמו", description: "הירשמו כדי לשמור אינטגרציות." });
      return;
    }

    const { error } = await supabase
      .from("business_integrations" as any)
      .upsert(
        {
          business_id: businessId,
          integration_type: type,
          config,
          active,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "business_id,integration_type" }
      );

    if (error) {
      console.error("Save integration error:", error);
      toast({ title: "שגיאה", description: "לא הצלחנו לשמור. נסו שוב.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSaveSheets = async () => {
    if (!sheetsUrl.trim()) {
      toast({ title: "שגיאה", description: "הזינו כתובת Webhook תקינה.", variant: "destructive" });
      return;
    }
    setSheetsSaving(true);
    const ok = await saveIntegration("google_sheets", { webhook_url: sheetsUrl }, sheetsActive);
    if (ok) {
      setSheetsSaved(true);
      toast({ title: "נשמר!", description: "חיבור Google Sheets נשמר בהצלחה." });
    }
    setSheetsSaving(false);
  };

  const handleSaveHubspot = async () => {
    if (!hubspotKey.trim() || hubspotKey === "••••••••") {
      toast({ title: "שגיאה", description: "הזינו מפתח API תקין.", variant: "destructive" });
      return;
    }
    setHubspotSaving(true);
    const ok = await saveIntegration("hubspot", { api_key: hubspotKey }, hubspotActive);
    if (ok) {
      setHubspotSaved(true);
      toast({ title: "נשמר!", description: "חיבור HubSpot נשמר בהצלחה." });
    }
    setHubspotSaving(false);
  };

  const disabled = !isPremium;

  return (
    <LockedOverlay isLocked={disabled} tier="premium" onUpgrade={onUpgrade} featureName="אינטגרציות">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets / Zapier / Make */}
        <Card className="shadow-card bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 size={18} className="text-primary" />
              Google Sheets (Zapier / Make)
              {sheetsSaved && sheetsActive && (
                <Badge variant="outline" className="mr-auto text-[10px] border-primary/30 text-primary">
                  <CheckCircle2 size={10} className="ml-1" /> מחובר
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              חברו את ReviewHub ל-Google Sheets דרך Zapier או Make. כל ביקורת חדשה או ליד חדש יישלחו אוטומטית לטבלה שלכם.
            </p>

            <div className="space-y-2">
              <Label htmlFor="sheets-url" className="text-sm">Webhook URL</Label>
              <Input
                id="sheets-url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={sheetsUrl}
                onChange={(e) => { setSheetsUrl(e.target.value); setSheetsSaved(false); }}
                disabled={disabled || loading}
                dir="ltr"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                הדביקו את כתובת ה-Webhook שקיבלתם מ-Zapier או Make.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={sheetsActive}
                  onCheckedChange={(v) => { setSheetsActive(v); setSheetsSaved(false); }}
                  disabled={disabled || loading}
                />
                <span className="text-sm text-muted-foreground">הפעלה אוטומטית</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveSheets}
                disabled={disabled || loading || sheetsSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sheetsSaving ? <Loader2 size={14} className="animate-spin ml-1" /> : null}
                שמור
              </Button>
            </div>

            <div className="pt-3 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ExternalLink size={10} />
                <a href="https://zapier.com/apps/webhook" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  איך ליצור Webhook ב-Zapier?
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* HubSpot */}
        <Card className="shadow-card bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key size={18} className="text-primary" />
              HubSpot CRM
              {hubspotSaved && hubspotActive && (
                <Badge variant="outline" className="mr-auto text-[10px] border-primary/30 text-primary">
                  <CheckCircle2 size={10} className="ml-1" /> מחובר
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              חברו את HubSpot כדי לשלוח לידים וביקורות חיוביות ישירות ל-CRM שלכם. כל ליד חדש ייווצר אוטומטית כ-Contact ב-HubSpot.
            </p>

            <div className="space-y-2">
              <Label htmlFor="hubspot-key" className="text-sm">HubSpot API Key</Label>
              <Input
                id="hubspot-key"
                type="password"
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={hubspotKey}
                onChange={(e) => { setHubspotKey(e.target.value); setHubspotSaved(false); }}
                disabled={disabled || loading}
                dir="ltr"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                מפתח ה-API נמצא בהגדרות HubSpot → Integrations → API Key.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hubspotActive}
                  onCheckedChange={(v) => { setHubspotActive(v); setHubspotSaved(false); }}
                  disabled={disabled || loading}
                />
                <span className="text-sm text-muted-foreground">הפעלה אוטומטית</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveHubspot}
                disabled={disabled || loading || hubspotSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {hubspotSaving ? <Loader2 size={14} className="animate-spin ml-1" /> : null}
                {hubspotSaved ? "מחובר ✓" : "חבר"}
              </Button>
            </div>

            <div className="pt-3 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ExternalLink size={10} />
                <a href="https://knowledge.hubspot.com/integrations/how-do-i-get-my-hubspot-api-key" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  איך להשיג מפתח API מ-HubSpot?
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation info */}
      <Card className="shadow-card bg-card mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook size={18} className="text-primary" /> אוטומציה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</div>
              <p>כשביקורת חדשה או ליד חדש נוצרים, המערכת בודקת אם יש אינטגרציות פעילות.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</div>
              <p>אם חיבור Google Sheets פעיל, הנתונים נשלחים אוטומטית ל-Webhook URL שהגדרתם.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</div>
              <p>אם HubSpot מחובר, Contact חדש נוצר אוטומטית עם פרטי הליד או הביקורת.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </LockedOverlay>
  );
};

export default IntegrationsTab;
