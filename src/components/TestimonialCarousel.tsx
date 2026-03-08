import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Play, X, Image, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const TestimonialCarousel = ({ businessId }: Props) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      const { data, error } = await supabase
        .from("testimonial_media")
        .select("*")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .limit(5);

      if (!error && data) setMedia(data as MediaItem[]);
      setLoading(false);
    };
    fetchMedia();
  }, [businessId]);

  if (loading || media.length === 0) return null;

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
    return data.publicUrl;
  };

  const getYouTubeEmbedId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  };

  const getTikTokId = (url: string) => {
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return match?.[1] || null;
  };

  const renderThumbnail = (item: MediaItem) => {
    if (item.media_type === "link" && item.external_url) {
      const ytId = getYouTubeEmbedId(item.external_url);
      if (ytId) {
        return (
          <div className="relative w-full h-full cursor-pointer group" onClick={() => setActiveVideo(item)}>
            <img
              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
              alt="סרטון לקוח"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                <Play size={20} className="text-primary-foreground mr-[-2px]" />
              </div>
            </div>
          </div>
        );
      }
      // TikTok or other - show generic play button
      return (
        <div className="relative w-full h-full cursor-pointer group" onClick={() => setActiveVideo(item)}>
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <Video size={32} className="text-muted-foreground" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <Play size={20} className="text-primary-foreground mr-[-2px]" />
            </div>
          </div>
        </div>
      );
    }

    if (item.file_type === "image" && item.file_path) {
      return (
        <img
          src={getPublicUrl(item.file_path)}
          alt="תמונת לקוח"
          className="w-full h-full object-cover rounded-lg cursor-pointer"
          onClick={() => setActiveVideo(item)}
        />
      );
    }

    if (item.file_type === "video" && item.file_path) {
      return (
        <div className="relative w-full h-full cursor-pointer group" onClick={() => setActiveVideo(item)}>
          <video
            src={getPublicUrl(item.file_path)}
            className="w-full h-full object-cover rounded-lg"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <Play size={20} className="text-primary-foreground mr-[-2px]" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderFullMedia = (item: MediaItem) => {
    if (item.media_type === "link" && item.external_url) {
      const ytId = getYouTubeEmbedId(item.external_url);
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
      const tikTokId = getTikTokId(item.external_url);
      if (tikTokId) {
        return (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
            className="w-full aspect-[9/16] max-h-[70vh] rounded-lg"
            allowFullScreen
          />
        );
      }
      // Fallback - open in new tab
      window.open(item.external_url, "_blank");
      setActiveVideo(null);
      return null;
    }

    if (item.file_type === "image" && item.file_path) {
      return (
        <img
          src={getPublicUrl(item.file_path)}
          alt="תמונת לקוח"
          className="w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }

    if (item.file_type === "video" && item.file_path) {
      return (
        <video
          src={getPublicUrl(item.file_path)}
          className="w-full max-h-[70vh] rounded-lg"
          controls
          autoPlay
        />
      );
    }

    return null;
  };

  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
        <Video size={20} className="text-primary" />
        חוויות לקוחות ({media.length})
      </h2>

      <Carousel opts={{ align: "start", direction: "rtl" }} className="w-full">
        <CarouselContent className="-ml-3">
          {media.map((item) => (
            <CarouselItem key={item.id} className="pl-3 basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div className="aspect-video overflow-hidden rounded-lg border border-border/50">
                {renderThumbnail(item)}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {media.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </>
        )}
      </Carousel>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setActiveVideo(null)}
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
                onClick={() => setActiveVideo(null)}
              >
                <X size={24} />
              </Button>
              {renderFullMedia(activeVideo)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestimonialCarousel;
