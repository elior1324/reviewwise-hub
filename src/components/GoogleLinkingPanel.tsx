/**
 * GoogleLinkingPanel
 *
 * Dashboard panel for connecting a ReviewHub business to its Google Business Profile.
 *
 * Flow:
 *  1. "Unlinked" state — show search button
 *  2. "Searching" — spinner, then list of candidates with confidence scores
 *  3. "Candidate list" — user selects match OR enters manual Place ID
 *  4. "Pending / needs_review" — awaiting admin confirmation
 *  5. "Confirmed" — linked, shows sync status, manual refresh button
 *
 * This panel calls two edge functions:
 *   google-places-match  (search / confirm / unlink / status)
 *   google-places-sync   (sync_business — manual refresh)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  Link2, Unlink, ExternalLink, ChevronRight, Info, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Google G icon ─────────────────────────────────────────────────────────────

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Candidate {
  place_id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  maps_url?: string;
  confidence: number;
  method: string;
  signals: { name: number; website: number; phone: number };
}

interface LinkedProfile {
  external_id: string;
  external_url?: string;
  external_name?: string;
  external_rating?: number;
  external_review_count?: number;
  last_synced_at?: string;
  sync_status?: string;
  sync_error?: string;
  match_confidence: number;
  match_method: string;
  status: string;
  imported_review_count: number;
}

interface Props {
  businessId: string;
}

type PanelState = "loading" | "unlinked" | "searching" | "candidates" | "confirming" | "linked" | "pending" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

const GoogleLinkingPanel = ({ businessId }: Props) => {
  const [state, setState]           = useState<PanelState>("loading");
  const [profile, setProfile]       = useState<LinkedProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [msg, setMsg]               = useState<string | null>(null);
  const [manualPlaceId, setManualPlaceId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [syncing, setSyncing]       = useState(false);

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("google-places-match", {
      body: { action, business_id: businessId, ...extra },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const loadStatus = async () => {
    try {
      const data = await call("status");
      if (!data.profile || data.profile.status === "unlinked") {
        setState("unlinked");
      } else if (data.profile.status === "confirmed") {
        setProfile({ ...data.profile, imported_review_count: data.imported_review_count || 0 });
        setState("linked");
      } else {
        setProfile({ ...data.profile, imported_review_count: data.imported_review_count || 0 });
        setState("pending");
      }
    } catch {
      setState("unlinked");
    }
  };

  useEffect(() => { loadStatus(); }, [businessId]);

  const handleSearch = async () => {
    setState("searching");
    setMsg(null);
    try {
      const data = await call("search");
      if (!data.candidates || data.candidates.length === 0) {
        setMsg(data.message || "לא נמצאו תוצאות. נסה לקשר ידנית באמצעות Place ID.");
        setState("unlinked");
      } else {
        setCandidates(data.candidates);
        setState("candidates");
      }
    } catch (e: any) {
      setMsg(`שגיאה: ${e.message}`);
      setState("unlinked");
    }
  };

  const handleConfirm = async (placeId: string) => {
    setState("confirming");
    try {
      const data = await call("confirm", { place_id: placeId });
      if (data.success) {
        setMsg(data.message || "חובר בהצלחה!");
        await loadStatus();
      } else {
        setMsg("שגיאה בחיבור. נסה שוב.");
        setState("candidates");
      }
    } catch (e: any) {
      setMsg(`שגיאה: ${e.message}`);
      setState("candidates");
    }
  };

  const handleUnlink = async () => {
    if (!confirm("האם לנתק את הקישור לפרופיל Google? ביקורות Google לא יוצגו יותר.")) return;
    await call("unlink");
    setProfile(null);
    setMsg("הפרופיל נותק.");
    setState("unlinked");
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-sync", {
        body: { action: "sync_business", business_id: businessId },
      });
      if (error || !data.success) {
        setMsg(data?.error || "שגיאת סנכרון.");
      } else {
        setMsg(`סונכרן! ביקורות חדשות: ${data.new || 0}`);
        await loadStatus();
      }
    } catch (e: any) {
      setMsg(`שגיאה: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const confidenceColor = (c: number) =>
    c >= 0.90 ? "text-green-600 dark:text-green-400" :
    c >= 0.65 ? "text-amber-600 dark:text-amber-400" :
    "text-destructive";

  const confidenceLabel = (c: number) =>
    c >= 0.90 ? "התאמה גבוהה" : c >= 0.65 ? "התאמה בינונית" : "התאמה נמוכה";

  return (
    <Card className="shadow-card bg-card">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <GoogleIcon size={18} />
          חיבור פרופיל Google
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground"><Info size={13} /></button>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[260px] text-right leading-relaxed">
              חיבור פרופיל Google מציג ביקורות Google בעמוד הפרופיל שלכם — בסעיף נפרד, בנוסף לביקורות ReviewHub.
              ביקורות Google אינן מוזגות לציון האמון הרשמי.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Loading */}
        {state === "loading" && (
          <p className="text-sm text-muted-foreground text-center py-4">טוען...</p>
        )}

        {/* Unlinked */}
        {(state === "unlinked" || state === "searching") && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>קשרו את הפרופיל שלכם ב-Google כדי להציג ביקורות Google בעמוד הפרופיל.</p>
              <p className="mt-1 text-xs">ביקורות Google יוצגו <strong className="text-foreground">בנפרד</strong> מביקורות ReviewHub ולא ישפיעו על ציון האמון.</p>
            </div>
            <Button
              onClick={handleSearch}
              disabled={state === "searching"}
              className="w-full gap-2"
              variant="outline"
            >
              {state === "searching" ? (
                <><RefreshCw size={14} className="animate-spin" /> מחפש ב-Google...</>
              ) : (
                <><Search size={14} /> חפש פרופיל Google אוטומטית</>
              )}
            </Button>

            {/* Manual Place ID entry */}
            <div>
              <button
                onClick={() => setShowManual(m => !m)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ChevronRight size={11} className={showManual ? "rotate-90 transition-transform" : "transition-transform"} />
                קישור ידני באמצעות Google Place ID
              </button>
              {showManual && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="ChIJxxxxxxx..."
                    value={manualPlaceId}
                    onChange={e => setManualPlaceId(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3"
                    disabled={!manualPlaceId.startsWith("ChIJ") || (state as PanelState) === "confirming"}
                    onClick={() => handleConfirm(manualPlaceId)}
                  >
                    <Link2 size={12} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidates */}
        {state === "candidates" && candidates.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">בחרו את הפרופיל התואם לעסקכם:</p>
            {candidates.map((c) => (
              <div
                key={c.place_id}
                className="border border-border/50 rounded-lg p-3 space-y-1.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.address && <p className="text-xs text-muted-foreground truncate">{c.address}</p>}
                    {c.rating != null && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className={
                          c.rating >= 4.5 ? "fill-emerald-400 text-emerald-400" :
                          c.rating >= 3.5 ? "fill-lime-400 text-lime-400" :
                          c.rating >= 2.5 ? "fill-amber-400 text-amber-400" :
                          c.rating >= 1.5 ? "fill-orange-500 text-orange-500" :
                          "fill-red-500 text-red-500"
                        } />
                        <span className="text-xs text-muted-foreground">{c.rating} ({c.review_count?.toLocaleString()} ביקורות)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-semibold ${confidenceColor(c.confidence)}`}>
                      {confidenceLabel(c.confidence)} {Math.round(c.confidence * 100)}%
                    </span>
                    {c.maps_url && (
                      <a href={c.maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5">
                        <ExternalLink size={9} /> Maps
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5"
                  onClick={() => handleConfirm(c.place_id)}
                  disabled={(state as PanelState) === "confirming"}
                >
                  <CheckCircle2 size={11} /> בחר פרופיל זה
                </Button>
              </div>
            ))}
            <button onClick={() => setState("unlinked")} className="text-xs text-muted-foreground hover:text-foreground">
              ← ביטול
            </button>
          </div>
        )}

        {/* Confirming spinner */}
        {state === "confirming" && (
          <div className="text-center py-6">
            <RefreshCw size={20} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">מאמת ומקשר...</p>
          </div>
        )}

        {/* Pending admin review */}
        {state === "pending" && profile && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">ממתין לאישור ReviewHub</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  הגשתם בקשה לקשר את הפרופיל "{profile.external_name}".
                  הקישור יאושר תוך 24 שעות על ידי צוות ReviewHub.
                </p>
              </div>
            </div>
            <button
              onClick={handleUnlink}
              className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1"
            >
              <Unlink size={10} /> ביטול הבקשה
            </button>
          </div>
        )}

        {/* Linked and confirmed */}
        {state === "linked" && profile && (
          <div className="space-y-3">
            {/* Status bar */}
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{profile.external_name || "Google Profile"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {profile.external_rating != null && (
                    <span className="mr-2">⭐ {Number(profile.external_rating).toFixed(1)} ({profile.external_review_count} ביקורות Google)</span>
                  )}
                  {profile.imported_review_count > 0 && (
                    <span>{profile.imported_review_count} ביקורות מיובאות</span>
                  )}
                </p>
              </div>
              {profile.external_url && (
                <a href={profile.external_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {profile.sync_status === "ok" && profile.last_synced_at
                  ? `עודכן: ${new Date(profile.last_synced_at).toLocaleDateString("he-IL")}`
                  : profile.sync_status === "rate_limited"
                  ? "⚠️ הגבלת קצב — יתעדכן בקרוב"
                  : profile.sync_status === "error"
                  ? `שגיאת סנכרון: ${profile.sync_error?.slice(0, 40) || "?"}`
                  : "טרם סונכרן"
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleManualSync}
                disabled={syncing}
              >
                <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
                {syncing ? "מסנכרן..." : "רענן"}
              </Button>
            </div>

            {/* Match quality */}
            <div className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <span>רמת התאמה:</span>
              <span className={`font-medium ${profile.match_confidence >= 0.9 ? "text-green-600" : profile.match_confidence >= 0.65 ? "text-amber-600" : "text-destructive"}`}>
                {Math.round((profile.match_confidence || 0) * 100)}%
              </span>
              <span>·</span>
              <span>{profile.match_method === "manual_business" ? "קישור ידני" : "זוהה אוטומטית"}</span>
            </div>

            {/* Unlink */}
            <button
              onClick={handleUnlink}
              className="text-[11px] text-destructive/60 hover:text-destructive flex items-center gap-1 mt-1"
            >
              <Unlink size={9} /> נתק פרופיל Google
            </button>
          </div>
        )}

        {/* Feedback message */}
        {msg && (
          <p className={`text-xs ${msg.startsWith("שגיאה") ? "text-destructive" : "text-green-600"}`}>
            {msg}
          </p>
        )}

        {/* Policy note */}
        <p className="text-[10px] text-muted-foreground/60 border-t border-border/30 pt-3 leading-relaxed">
          ביקורות Google מוצגות בהתאם לתנאי Google Places API ומסומנות בבירור כמקורן ב-Google.
          הן אינן מוזגות לציון האמון הרשמי של ReviewHub.
        </p>
      </CardContent>
    </Card>
  );
};

export default GoogleLinkingPanel;
