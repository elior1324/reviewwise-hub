import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Play, X, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  id: string;
  media_url: string;
  media_type: string; // "image" | "video" | "youtube" | "link"
  caption: string | null;
  sort_order: number;
}

interface Props {
  businessId: string;
}

const TestimonialCarousel = ({ businessId }: Props) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      const { data, error } = await supabase
        .from("testimonial_media")
        .select("id, media_url, media_type, caption, sort_order")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .limit(5);

      if (!error && data) setMedia(data as MediaItem[]);
      setLoading(false);
    };
    fetchMedia();
  }, [businessId]);

  if (loading || media.length === 0) return null;

  const getYouTubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  };

  const getTikTokId = (url: string) => {
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return match?.[1] || null;
  };

  const PlayOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md group-hover:bg-black/45 transition-colors">
      <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
        <Play size={13} className="text-primary-foreground mr-[-1px]" />
      </div>
    </div>
  );

  const renderThumbnail = (item: MediaItem) => {
    const url = item.media_url;

    // YouTube link
    if (item.media_type === "youtube" || (item.media_type === "link" && /youtube\.com|youtu\.be/.test(url))) {
      const ytId = getYouTubeEmbedId(url);
      if (ytId) {
        return (
          <div className="relative w-full h-full cursor-pointer group" onClick={() => setActiveItem(item)}>
            <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="סרטון לקוח" className="w-full h-full object-cover rounded-md" />
            <PlayOverlay />
          </div>
        );
      }
    }

    // Generic link (TikTok etc.)
    if (item.media_type === "link") {
      return (
        <div className="relative w-full h-full cursor-pointer group bg-muted rounded-md flex items-center justify-center" onClick={() => setActiveItem(item)}>
          <Video size={20} className="text-muted-foreground" />
          <PlayOverlay />
        </div>
      );
    }

    // Uploaded image
    if (item.media_type === "image") {
      return (
        <img src={url} alt="תמונת לקוח" className="w-full h-full object-cover rounded-md cursor-pointer" onClick={() => setActiveItem(item)} />
      );
    }

    // Uploaded video
    if (item.media_type === "video") {
      return (
        <div className="relative w-full h-full cursor-pointer group" onClick={() => setActiveItem(item)}>
          <video src={url} className="w-full h-full object-cover rounded-md" muted playsInline />
          <PlayOverlay />
        </div>
      );
    }

    return null;
  };

  const renderFullMedia = (item: MediaItem) => {
    const url = item.media_url;

    // YouTube
    if (item.media_type === "youtube" || (item.media_type === "link" && /youtube\.com|youtu\.be/.test(url))) {
      const ytId = getYouTubeEmbedId(url);
      if (ytId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
            className="w-full aspect-video rounded-lg"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        );
      }
    }

    // TikTok
    if (item.media_type === "link") {
      const tikTokId = getTikTokId(url);
      if (tikTokId) {
        return (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
            className="w-full aspect-[9/16] max-h-[70vh] rounded-lg"
            allowFullScreen
          />
        );
      }
      // Fallback — open in new tab
      window.open(url, "_blank");
      setActiveItem(null);
      return null;
    }

    // Uploaded image
    if (item.media_type === "image") {
      return (
        <img
          src={url}
          alt="תמונת לקוח"
          className="w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }

    // Uploaded video
    if (item.media_type === "video") {
      return (
        <video
          src={url}
          className="w-full max-h-[70vh] rounded-lg"
          controls
          autoPlay
        />
      );
    }

    return null;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Video size={12} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">חוויות לקוחות</span>
      </div>

      <Carousel opts={{ align: "start", direction: "rtl" }} className="w-full">
        <CarouselContent className="-ml-2">
          {media.map((item) => (
            <CarouselItem key={item.id} className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5">
              <div className="h-20 overflow-hidden rounded-md border border-border/40">
                {renderThumbnail(item)}
              </div>
              {item.caption && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5 px-0.5">{item.caption}</p>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {media.length > 4 && (
          <>
            <CarouselPrevious className="hidden md:flex h-6 w-6" />
            <CarouselNext className="hidden md:flex h-6 w-6" />
          </>
        )}
      </Carousel>

      {/* Full-screen overlay on click */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 left-0 text-white hover:bg-white/20 z-10"
                onClick={() => setActiveItem(null)}
              >
                <X size={24} />
              </Button>
              {renderFullMedia(activeItem)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestimonialCarousel;
