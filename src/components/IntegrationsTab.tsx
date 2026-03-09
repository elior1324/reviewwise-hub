import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Lock, Webhook, Link2, Key, CheckCircle2, Loader2, ExternalLink,
  Crown, Zap, MessageSquare, Mail, HardDrive, LayoutGrid, ArrowRight, Sparkles, CircleDot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

// SVG brand icons as inline components for crisp rendering
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/>
  </svg>
);

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm6.312 5.852a2.528 2.528 0 012.521-2.52A2.528 2.528 0 0124 12.165a2.528 2.528 0 01-2.522 2.52h-2.52v-2.52h-.812zm-1.271 0a2.528 2.528 0 01-2.521 2.52 2.528 2.528 0 01-2.521-2.52V5.852a2.528 2.528 0 012.521-2.52 2.528 2.528 0 012.521 2.52v6.313z" fill="#E01E5A"/>
    <path d="M15.165 5.042a2.528 2.528 0 012.52-2.52A2.528 2.528 0 0120.208 5.042a2.527 2.527 0 01-2.522 2.52h-2.52V5.042zm-1.271 0a2.527 2.527 0 01-2.52 2.52 2.527 2.527 0 01-2.52-2.52V2.522A2.528 2.528 0 0111.374 0a2.528 2.528 0 012.52 2.522v2.52z" fill="#36C5F0"/>
    <path d="M8.834 18.958a2.528 2.528 0 012.521 2.52A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 01-2.521-2.521 2.528 2.528 0 012.521-2.521h6.312a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H8.834z" fill="#2EB67D"/>
    <path d="M18.958 15.166a2.528 2.528 0 01-2.52-2.521 2.528 2.528 0 012.52-2.521h2.52A2.528 2.528 0 0124 12.645a2.528 2.528 0 01-2.522 2.521h-2.52z" fill="#ECB22E"/>
  </svg>
);

const MondayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
    <path d="M2.597 8.634a2.577 2.577 0 01-.884 3.53 2.577 2.577 0 01-3.53-.884L.78 7.75a2.577 2.577 0 013.53.884h-1.713zm6.348 0a2.577 2.577 0 01-.884 3.53 2.577 2.577 0 01-3.53-.884L7.128 7.75a2.577 2.577 0 013.53.884H8.945zm4.635 3.53a2.577 2.577 0 112.597-4.414 2.577 2.577 0 01-2.597 4.414z" fill="#FF3D57" transform="translate(3 4)"/>
  </svg>
);

const MailchimpIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7">
    <path d="M18.824 13.014c-.39-.243-.756-.401-1.074-.509.27-.618.421-1.28.421-1.99 0-1.377-.562-2.651-1.484-3.573a5.137 5.137 0 00-.596-.52c.098-.362.178-.78.178-1.222 0-1.09-.416-1.844-.87-2.351C14.889 2.27 14.15 2 13.5 2c-.532 0-1.006.15-1.394.403A5.036 5.036 0 0010 2C7.24 2 5 4.24 5 7c0 .52.08 1.023.228 1.494A4.98 4.98 0 003 12.5c0 2.76 2.24 5 5 5h.09A4.982 4.982 0 0012 20c1.93 0 3.602-1.096 4.432-2.697.422.082.87.127 1.335.127C20.11 17.43 22 15.78 22 13.735c0-.88-.393-1.63-1.176-2.121-.5-.313-1.175-.6-2-.6zM12 18c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" fill="#FFE01B"/>
  </svg>
);

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
    <path d="M8 2l7 12H1L8 2z" fill="#0066DA" transform="translate(0 1)"/>
    <path d="M16 2l7 12h-14L16 2z" fill="#00AC47" transform="translate(0 1)"/>
    <path d="M4.5 15l3.5 6h14l-3.5-6H4.5z" fill="#FFBA00" transform="translate(0 0)"/>
  </svg>
);

const APP_ICONS = [
  { name: "WhatsApp", icon: WhatsAppIcon, color: "bg-[#25D366]/10" },
  { name: "Slack", icon: SlackIcon, color: "bg-[#4A154B]/10" },
  { name: "Monday.com", icon: MondayIcon, color: "bg-[#FF3D57]/10" },
  { name: "Mailchimp", icon: MailchimpIcon, color: "bg-[#FFE01B]/10" },
  { name: "Google Drive", icon: GoogleDriveIcon, color: "bg-[#0066DA]/10" },
];

const IntegrationsTab = ({ businessId, isPremium, isDemo, onUpgrade }: IntegrationsTabProps) => {
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsActive, setSheetsActive] = useState(false);
  const [sheetsSaving, setSheetsSaving] = useState(false);
  const [sheetsSaved, setSheetsSaved] = useState(false);

  const [hubspotKey, setHubspotKey] = useState("");
  const [hubspotActive, setHubspotActive] = useState(false);
  const [hubspotSaving, setHubspotSaving] = useState(false);
  const [hubspotSaved, setHubspotSaved] = useState(false);
  const [hubspotConnected, setHubspotConnected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const disabled = !isPremium;

  useEffect(() => {
    if (isDemo || !businessId) {
      setLoading(false);
      return;
    }
    const fetchIntegrations = async () => {
      const { data: result } = await supabase.functions.invoke("manage-integrations", {
        body: { action: "get", business_id: businessId },
      });

      if (result?.data) {
        const sheets = result.data.find((d: any) => d.integration_type === "google_sheets");
        if (sheets) {
          setSheetsUrl(sheets.config?.webhook_url || "");
          setSheetsActive(sheets.active);
          setSheetsSaved(true);
        }
        const hubspot = result.data.find((d: any) => d.integration_type === "hubspot");
        if (hubspot) {
          setHubspotKey(hubspot.config?.has_api_key ? "••••••••••••••••" : "");
          setHubspotActive(hubspot.active);
          setHubspotSaved(true);
          setHubspotConnected(hubspot.config?.has_api_key && hubspot.active);
        }
      }
      setLoading(false);
    };
    fetchIntegrations();
  }, [businessId, isDemo]);

  const saveIntegration = async (type: string, config: IntegrationConfig, active: boolean) => {
    if (isDemo) {
      toast({ title: "מצב דמו", description: "הירשמו כדי לשמור אינטגרציות." });
      return false;
    }

    const { data: result, error } = await supabase.functions.invoke("manage-integrations", {
      body: {
        action: "save",
        business_id: businessId,
        integration_type: type,
        config,
        active,
      },
    });

    if (error || result?.error) {
      console.error("Save integration error:", error || result?.error);
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
      toast({ title: "נשמר!", description: "ה-Webhook נשמר בהצלחה. כל ביקורת וליד חדשים יישלחו אוטומטית." });
    }
    setSheetsSaving(false);
  };

  const handleSaveHubspot = async () => {
    if (!hubspotKey.trim() || hubspotKey === "••••••••••••••••") {
      toast({ title: "שגיאה", description: "הזינו מפתח API תקין.", variant: "destructive" });
      return;
    }
    setHubspotSaving(true);
    const ok = await saveIntegration("hubspot", { api_key: hubspotKey }, hubspotActive);
    if (ok) {
      setHubspotSaved(true);
      setHubspotConnected(hubspotActive);
      toast({ title: "מחובר!", description: "HubSpot מחובר בהצלחה. לידים חדשים ייווצרו אוטומטית." });
    }
    setHubspotSaving(false);
  };

  const handleLockedClick = () => {
    if (disabled) {
      setShowUpgradeModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Upgrade Modal ── */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-md w-full mx-4 rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Crown size={20} className="text-primary-foreground" />
                </div>
              </div>

              <div className="text-center pt-4 space-y-4">
                <h3 className="font-display font-bold text-xl text-foreground">
                  🔓 שחררו אוטומציות ללא הגבלה
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  שדרגו לתוכנית פרימיום וחברו את העסק שלכם ל-6,000+ אפליקציות דרך Zapier & Make.
                </p>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 text-right">
                  {[
                    "Webhook אוטומטי לכל ביקורת וליד",
                    "חיבור ישיר ל-HubSpot CRM",
                    "גישה מלאה ל-API ו-Webhooks",
                    "דוחות AI יומיים + Google Ads Stars",
                    "מנהל הצלחה אישי",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={14} className="text-primary shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <p className="text-2xl font-display font-bold text-foreground">
                    ₪479<span className="text-sm font-normal text-muted-foreground">/חודש</span>
                  </p>
                </div>

                <Button
                  onClick={() => { setShowUpgradeModal(false); onUpgrade(); }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold gap-2"
                >
                  <Crown size={16} /> שדרגו לפרימיום
                </Button>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  אולי מאוחר יותר
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero: Universal Automation ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-card bg-card overflow-hidden relative">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-display font-bold flex items-center gap-2 flex-wrap">
                  התחברו ל-6,000+ אפליקציות דרך Zapier & Make
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2">
                    <Crown size={10} className="ml-1" /> פרימיום
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  הפכו את העסק שלכם לאוטומטי — שלחו נתוני ביקורות ולידים לכל כלי בסטאק שלכם באמצעות Webhook אוניברסלי.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* App Icons Grid */}
            <div className="flex flex-wrap items-center gap-3">
              {APP_ICONS.map(({ name, icon: Icon, color }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300 }}
                  className={`flex items-center gap-2 rounded-xl border border-border/40 ${color} px-3 py-2`}
                >
                  <Icon />
                  <span className="text-xs font-medium text-foreground/80">{name}</span>
                </motion.div>
              ))}
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs px-2">
                <LayoutGrid size={14} />
                <span>+6,000 נוספים</span>
              </div>
            </div>

            {/* Webhook URL Field — with frosted overlay when locked */}
            <div className="relative">
              {disabled && (
                <div
                  className="absolute inset-0 z-10 rounded-xl backdrop-blur-[6px] bg-background/50 border border-border/30 flex items-center justify-center cursor-pointer transition-all hover:bg-background/60"
                  onClick={handleLockedClick}
                >
                  <div className="flex items-center gap-2 bg-card/90 border border-primary/20 rounded-lg px-4 py-2.5 shadow-lg">
                    <Lock size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">שדרגו לפרימיום לגישה</span>
                    <ArrowRight size={14} className="text-primary" />
                  </div>
                </div>
              )}

              <div className={`space-y-3 rounded-xl border border-border/30 bg-muted/20 p-4 ${disabled ? "select-none" : ""}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="webhook-url" className="text-sm font-semibold flex items-center gap-2">
                    <Webhook size={14} className="text-primary" />
                    Webhook URL
                  </Label>
                  {sheetsSaved && sheetsActive && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                      <CheckCircle2 size={10} /> פעיל
                    </Badge>
                  )}
                </div>

                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/... או https://hook.eu1.make.com/..."
                  value={sheetsUrl}
                  onChange={(e) => { setSheetsUrl(e.target.value); setSheetsSaved(false); }}
                  disabled={disabled || loading}
                  dir="ltr"
                  className="font-mono text-xs bg-background/50"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sheetsActive}
                      onCheckedChange={(v) => { setSheetsActive(v); setSheetsSaved(false); }}
                      disabled={disabled || loading}
                    />
                    <span className="text-xs text-muted-foreground">שלח אוטומטית בכל ביקורת / ליד חדש</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveSheets}
                    disabled={disabled || loading || sheetsSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                  >
                    {sheetsSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {sheetsSaved ? "נשמר ✓" : "שמור"}
                  </Button>
                </div>

                <div className="pt-2 border-t border-border/20 flex gap-4">
                  <a
                    href="https://zapier.com/apps/webhook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={10} /> מדריך Zapier
                  </a>
                  <a
                    href="https://www.make.com/en/help/tools/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={10} /> מדריך Make
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── HubSpot CRM ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="shadow-card bg-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A59]/3 via-transparent to-transparent pointer-events-none" />

          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              {/* HubSpot official logo mark */}
              <div className="w-10 h-10 rounded-xl bg-[#FF7A59]/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                  <path d="M17.25 8.38V6.71a1.8 1.8 0 001.06-1.63v-.05A1.81 1.81 0 0016.5 3.22h-.05a1.81 1.81 0 00-1.81 1.81v.05a1.8 1.8 0 001.05 1.63v1.67a4.81 4.81 0 00-2.2 1.14l-5.82-4.53a1.91 1.91 0 00.08-.52 1.94 1.94 0 10-1.94 1.93 1.91 1.91 0 00.92-.24l5.72 4.45a4.82 4.82 0 00-.62 2.36 4.87 4.87 0 00.75 2.6l-1.74 1.74a1.63 1.63 0 00-.48-.08 1.66 1.66 0 101.66 1.66 1.63 1.63 0 00-.08-.48l1.7-1.7a4.84 4.84 0 10-3.19-8.13z" fill="#FF7A59"/>
                </svg>
              </div>

              <div className="flex-1">
                <CardTitle className="text-base font-display font-bold flex items-center gap-2 flex-wrap">
                  HubSpot CRM
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2">
                    <Crown size={10} className="ml-1" /> פרימיום
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  סנכרנו לידים וביקורות ישירות ל-CRM שלכם
                </p>
              </div>

              {/* Status indicator */}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${
                hubspotConnected
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-muted/50 border-border/40 text-muted-foreground"
              }`}>
                <CircleDot size={10} className={hubspotConnected ? "text-primary" : "text-muted-foreground/40"} />
                {hubspotConnected ? "Active" : "Not Connected"}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-4">
            {/* Frosted overlay for locked state */}
            {disabled && (
              <div
                className="absolute inset-0 z-10 rounded-b-xl backdrop-blur-[6px] bg-background/50 flex items-center justify-center cursor-pointer transition-all hover:bg-background/60"
                onClick={handleLockedClick}
              >
                <div className="flex items-center gap-2 bg-card/90 border border-primary/20 rounded-lg px-4 py-2.5 shadow-lg">
                  <Lock size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">שדרגו לפרימיום לגישה</span>
                  <ArrowRight size={14} className="text-primary" />
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              חברו את HubSpot כדי לשלוח לידים וביקורות חיוביות ישירות ל-CRM. כל ליד חדש ייווצר אוטומטית כ-Contact עם פרטי הביקורת.
            </p>

            <div className="space-y-2">
              <Label htmlFor="hubspot-key" className="text-sm font-semibold flex items-center gap-2">
                <Key size={14} className="text-muted-foreground" />
                Private App Access Token
              </Label>
              <Input
                id="hubspot-key"
                type="password"
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={hubspotKey}
                onChange={(e) => { setHubspotKey(e.target.value); setHubspotSaved(false); setHubspotConnected(false); }}
                disabled={disabled || loading}
                dir="ltr"
                className="font-mono text-xs bg-background/50"
              />
              <p className="text-[11px] text-muted-foreground">
                צרו Private App ב-HubSpot → Settings → Integrations → Private Apps
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hubspotActive}
                  onCheckedChange={(v) => { setHubspotActive(v); setHubspotSaved(false); }}
                  disabled={disabled || loading}
                />
                <span className="text-xs text-muted-foreground">סנכרון אוטומטי</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveHubspot}
                disabled={disabled || loading || hubspotSaving}
                className={`gap-1 ${hubspotConnected ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                variant={hubspotConnected ? "outline" : "default"}
              >
                {hubspotSaving ? <Loader2 size={14} className="animate-spin" /> : hubspotConnected ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                {hubspotConnected ? "מחובר" : "חבר"}
              </Button>
            </div>

            <div className="pt-3 border-t border-border/20">
              <a
                href="https://developers.hubspot.com/docs/api/private-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={10} /> איך ליצור Private App ב-HubSpot
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── How It Works ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="shadow-card bg-card border-dashed border-border/40">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">איך האוטומציה עובדת?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "אירוע חדש", desc: "ביקורת חדשה, ליד חדש, או המרה מתרחשים בפלטפורמה." },
                { step: "2", title: "שליחה אוטומטית", desc: "המערכת שולחת את הנתונים ל-Webhook URL או ל-HubSpot API באופן מיידי." },
                { step: "3", title: "פעולה בכלי שלכם", desc: "Zapier/Make מעבירים את הנתונים ל-Google Sheets, Slack, WhatsApp ועוד." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-display font-bold text-sm text-primary">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default IntegrationsTab;
