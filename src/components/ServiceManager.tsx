/**
 * ServiceManager — Dashboard component for managing business services/courses
 *
 * Allows business owners to:
 * - Add/edit/delete services
 * - Set per-service affiliate URL and discount percentage
 * - Toggle active/inactive per service
 *
 * Each service card shows: title, description, price, affiliate config
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, Link2, Percent, Package,
  Loader2, GripVertical, ExternalLink, Eye, EyeOff,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  url: string | null;
  affiliate_url: string | null;
  affiliate_percentage: number | null;
  is_active: boolean;
  category: string | null;
}

interface Props {
  businessId: string;
  isDemo?: boolean;
}

const EMPTY_SERVICE: Omit<Service, "id"> = {
  name: "",
  description: null,
  short_description: null,
  price: null,
  url: null,
  affiliate_url: null,
  affiliate_percentage: null,
  is_active: true,
  category: null,
};

const ServiceManager = ({ businessId, isDemo = false }: Props) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // service id being saved
  const [adding, setAdding] = useState(false);

  // ── New service form ──────────────────────────────────────────────────
  const [newService, setNewService] = useState(EMPTY_SERVICE);

  const fetchServices = useCallback(async () => {
    if (isDemo) {
      setServices([
        {
          id: "demo-1",
          name: "קורס שיווק דיגיטלי",
          description: "קורס מקיף ללמוד שיווק דיגיטלי מאפס",
          short_description: "למד שיווק דיגיטלי מאפס עד מקצוען",
          price: 497,
          url: "https://example.com/course",
          affiliate_url: "https://example.com/course?ref=rh",
          affiliate_percentage: 10,
          is_active: true,
          category: "שיווק",
        },
      ]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("courses")
      .select("id, name, description, short_description, price, url, affiliate_url, affiliate_percentage, is_active, category")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (data) setServices(data);
    setLoading(false);
  }, [businessId, isDemo]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Add service ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newService.name.trim()) {
      toast.error("שם השירות הוא שדה חובה");
      return;
    }

    // Validate affiliate percentage
    if (newService.affiliate_percentage !== null) {
      if (newService.affiliate_percentage < 0 || newService.affiliate_percentage > 100) {
        toast.error("אחוז ההנחה חייב להיות בין 0 ל-100");
        return;
      }
    }

    // Validate URLs
    if (newService.affiliate_url) {
      try { new URL(newService.affiliate_url); } catch {
        toast.error("קישור השותפים אינו תקין");
        return;
      }
    }
    if (newService.url) {
      try { new URL(newService.url); } catch {
        toast.error("כתובת האתר אינה תקינה");
        return;
      }
    }

    setAdding(true);
    const { error } = await supabase.from("courses").insert({
      business_id: businessId,
      name: newService.name.trim(),
      description: newService.description?.trim() || null,
      short_description: newService.short_description?.trim() || null,
      price: newService.price,
      url: newService.url?.trim() || null,
      affiliate_url: newService.affiliate_url?.trim() || null,
      affiliate_percentage: newService.affiliate_url ? newService.affiliate_percentage : null,
      is_active: newService.is_active,
      category: newService.category?.trim() || null,
    });

    if (error) {
      console.error("[ServiceManager] insert error:", error);
      toast.error("שגיאה בהוספת השירות");
    } else {
      toast.success("השירות נוסף בהצלחה");
      setNewService(EMPTY_SERVICE);
      fetchServices();
    }
    setAdding(false);
  };

  // ── Update service ────────────────────────────────────────────────────
  const handleUpdate = async (service: Service) => {
    if (isDemo) { toast.success("עודכן (דמו)"); return; }

    // Validate
    if (!service.name.trim()) {
      toast.error("שם השירות הוא שדה חובה");
      return;
    }
    if (service.affiliate_percentage !== null && (service.affiliate_percentage < 0 || service.affiliate_percentage > 100)) {
      toast.error("אחוז ההנחה חייב להיות בין 0 ל-100");
      return;
    }
    if (service.affiliate_url) {
      try { new URL(service.affiliate_url); } catch {
        toast.error("קישור השותפים אינו תקין");
        return;
      }
    }

    setSaving(service.id);
    const { error } = await supabase.from("courses").update({
      name: service.name.trim(),
      description: service.description?.trim() || null,
      short_description: service.short_description?.trim() || null,
      price: service.price,
      url: service.url?.trim() || null,
      affiliate_url: service.affiliate_url?.trim() || null,
      affiliate_percentage: service.affiliate_url ? service.affiliate_percentage : null,
      is_active: service.is_active,
      updated_at: new Date().toISOString(),
    }).eq("id", service.id);

    if (error) {
      console.error("[ServiceManager] update error:", error);
      toast.error("שגיאה בעדכון השירות");
    } else {
      toast.success("השירות עודכן");
    }
    setSaving(null);
  };

  // ── Delete service ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (isDemo) { toast.success("נמחק (דמו)"); return; }

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת השירות");
    } else {
      toast.success("השירות נמחק");
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────
  const handleToggleActive = async (service: Service) => {
    const updated = { ...service, is_active: !service.is_active };
    setServices((prev) => prev.map((s) => s.id === service.id ? updated : s));
    await handleUpdate(updated);
  };

  // ── Update local state ────────────────────────────────────────────────
  const updateService = (id: string, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">שירותים ומוצרים</h3>
          <p className="text-sm text-muted-foreground">הוסיפו שירותים עם קישורי שותפים ואחוזי הנחה מותאמים אישית</p>
        </div>
        <span className="text-xs text-muted-foreground">{services.length} שירותים</span>
      </div>

      {/* ── Existing services ───────────────────────────────────────── */}
      {services.map((service) => (
        <Card key={service.id} className={`transition-opacity ${service.is_active ? "" : "opacity-60"}`}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted-foreground" />
                <Package size={16} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <Input
                    value={service.name}
                    onChange={(e) => updateService(service.id, { name: e.target.value })}
                    className="font-semibold text-sm h-8 border-0 p-0 focus-visible:ring-0 bg-transparent"
                    placeholder="שם השירות"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(service)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={service.is_active ? "הסתר" : "הצג"}
                >
                  {service.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Description */}
            <Textarea
              value={service.short_description || ""}
              onChange={(e) => updateService(service.id, { short_description: e.target.value })}
              placeholder="תיאור קצר (יוצג בכרטיס)"
              className="text-sm resize-none h-16"
              maxLength={200}
            />

            {/* Price + URL */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">מחיר (₪)</Label>
                <Input
                  type="number"
                  value={service.price ?? ""}
                  onChange={(e) => updateService(service.id, { price: e.target.value ? Number(e.target.value) : null })}
                  placeholder="0"
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">קישור לאתר</Label>
                <Input
                  value={service.url || ""}
                  onChange={(e) => updateService(service.id, { url: e.target.value })}
                  placeholder="https://..."
                  className="text-sm h-8"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Affiliate section */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary">קישור שותפים</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">קישור שותפים (Affiliate URL)</Label>
                  <Input
                    value={service.affiliate_url || ""}
                    onChange={(e) => updateService(service.id, { affiliate_url: e.target.value })}
                    placeholder="https://...?ref=reviewhub"
                    className="text-sm h-8"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Percent size={10} />
                    אחוז הנחה
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={service.affiliate_percentage ?? ""}
                    onChange={(e) => updateService(service.id, { affiliate_percentage: e.target.value ? Number(e.target.value) : null })}
                    placeholder="למשל: 10"
                    className="text-sm h-8"
                  />
                </div>
              </div>
              {service.affiliate_url && service.affiliate_percentage != null && service.affiliate_percentage > 0 && (
                <p className="text-[11px] text-primary/70">
                  לקוחות שירכשו דרך הקישור יקבלו {service.affiliate_percentage}% הנחה
                </p>
              )}
            </div>

            {/* Save */}
            <Button
              size="sm"
              onClick={() => handleUpdate(service)}
              disabled={saving === service.id}
              className="gap-1.5"
            >
              {saving === service.id
                ? <><Loader2 size={13} className="animate-spin" /> שומר...</>
                : <><Save size={13} /> שמור שינויים</>
              }
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* ── Add new service ─────────────────────────────────────────── */}
      <Card className="border-dashed border-2 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            הוסף שירות חדש
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            placeholder="שם השירות *"
            className="text-sm"
          />
          <Textarea
            value={newService.short_description || ""}
            onChange={(e) => setNewService({ ...newService, short_description: e.target.value })}
            placeholder="תיאור קצר"
            className="text-sm resize-none h-16"
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              value={newService.price ?? ""}
              onChange={(e) => setNewService({ ...newService, price: e.target.value ? Number(e.target.value) : null })}
              placeholder="מחיר (₪)"
              className="text-sm"
            />
            <Input
              value={newService.url || ""}
              onChange={(e) => setNewService({ ...newService, url: e.target.value })}
              placeholder="קישור לאתר"
              className="text-sm"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={newService.affiliate_url || ""}
              onChange={(e) => setNewService({ ...newService, affiliate_url: e.target.value })}
              placeholder="קישור שותפים"
              className="text-sm"
              dir="ltr"
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={newService.affiliate_percentage ?? ""}
              onChange={(e) => setNewService({ ...newService, affiliate_percentage: e.target.value ? Number(e.target.value) : null })}
              placeholder="אחוז הנחה"
              className="text-sm"
            />
          </div>
          <Button onClick={handleAdd} disabled={adding || !newService.name.trim()} className="gap-1.5">
            {adding
              ? <><Loader2 size={13} className="animate-spin" /> מוסיף...</>
              : <><Plus size={13} /> הוסף שירות</>
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManager;
