import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Video, Image, Link, Trash2, GripVertical } from "lucide-react";

interface MediaItem {
  id: string;
  file_path: string;
  file_type: string;
  media_type: string;
  external_url: string | null;
  title: string | null;
  sort_order: number;
}

interface Props {
  businessId: string;
  maxItems?: number;
}

const TestimonialMediaUploader = ({ businessId, maxItems = 5 }: Props) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [businessId]);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from("testimonial_media")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });

    if (!error && data) setMedia(data as MediaItem[]);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (media.length >= maxItems) {
      toast.error(`ניתן להעלות עד ${maxItems} קבצים`);
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("ניתן להעלות סרטונים או תמונות בלבד");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("גודל קובץ מקסימלי: 50MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${businessId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("testimonials")
      .upload(path, file);

    if (uploadError) {
      toast.error("שגיאה בהעלאת הקובץ");
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("testimonial_media")
      .insert({
        business_id: businessId,
        file_path: path,
        file_type: isVideo ? "video" : "image",
        media_type: "upload",
        sort_order: media.length,
      });

    if (insertError) {
      toast.error("שגיאה בשמירת המדיה");
    } else {
      toast.success("הקובץ הועלה בהצלחה!");
      fetchMedia();
    }
    setUploading(false);
  };

  const handleAddLink = async () => {
    if (!externalUrl.trim()) return;
    if (media.length >= maxItems) {
      toast.error(`ניתן להעלות עד ${maxItems} פריטים`);
      return;
    }

    const { error } = await supabase
      .from("testimonial_media")
      .insert({
        business_id: businessId,
        file_path: "",
        file_type: "video",
        media_type: "link",
        external_url: externalUrl.trim(),
        sort_order: media.length,
      });

    if (error) {
      toast.error("שגיאה בהוספת הקישור");
    } else {
      toast.success("הקישור נוסף בהצלחה!");
      setExternalUrl("");
      fetchMedia();
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (item.media_type === "upload" && item.file_path) {
      await supabase.storage.from("testimonials").remove([item.file_path]);
    }
    await supabase.from("testimonial_media").delete().eq("id", item.id);
    toast.success("הפריט נמחק");
    fetchMedia();
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
    return data.publicUrl;
  };

  const getYouTubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  };

  if (loading) return null;

  return (
    <Card className="shadow-card bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Video size={18} />
          סרטונים ותמונות של לקוחות ({media.length}/{maxItems})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current media */}
        {media.length > 0 && (
          <div className="space-y-2">
            {media.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/30">
                <GripVertical size={14} className="text-muted-foreground" />
                {item.file_type === "video" ? (
                  <Video size={16} className="text-primary shrink-0" />
                ) : (
                  <Image size={16} className="text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {item.media_type === "link" ? (
                    <p className="text-sm truncate">{item.external_url}</p>
                  ) : (
                    <p className="text-sm truncate">{item.file_path.split("/").pop()}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.media_type === "link" ? "קישור חיצוני" : "קובץ מועלה"} · {item.file_type === "video" ? "סרטון" : "תמונה"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {media.length < maxItems && (
          <>
            {/* File upload */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer justify-center border-2 border-dashed border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
                <Upload size={16} />
                <span className="text-sm">
                  {uploading ? "מעלה..." : "העלאת סרטון או תמונה"}
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* External link */}
            <div className="flex gap-2">
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="קישור YouTube / TikTok"
                className="text-sm"
                dir="ltr"
              />
              <Button variant="outline" size="sm" onClick={handleAddLink} disabled={!externalUrl.trim()}>
                <Link size={14} className="ml-1" />
                הוסף
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestimonialMediaUploader;
