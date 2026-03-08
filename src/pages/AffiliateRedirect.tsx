import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AffiliateRedirect = () => {
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trackAndRedirect = async () => {
      if (!courseId) {
        setError(true);
        return;
      }

      try {
        // Fetch course from DB
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("name, affiliate_url")
          .eq("id", courseId)
          .single();

        if (courseError || !course) {
          setError(true);
          return;
        }

        setCourseName(course.name);

        // Record affiliate click in DB
        const referrer = document.referrer || null;
        // Simple anonymous hash of IP (we use a placeholder — real IP hashing happens server-side)
        await supabase.from("affiliate_clicks").insert({
          course_id: courseId,
          referrer,
          converted: false,
        });

        // Redirect to affiliate URL
        if (course.affiliate_url) {
          setTimeout(() => {
            window.location.href = course.affiliate_url!;
          }, 1500);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    trackAndRedirect();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center noise-overlay">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
          <span className="font-display font-bold text-primary text-2xl">R</span>
        </div>
        {error ? (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">הקורס לא נמצא</h1>
            <p className="text-muted-foreground text-sm">הקישור שגוי או שהקורס כבר לא קיים.</p>
          </>
        ) : (
          <>
            <h1 className="font-display font-bold text-xl text-foreground">מעביר אותך לאתר הקורס...</h1>
            {courseName && <p className="text-muted-foreground">{courseName}</p>}
            <p className="text-xs text-muted-foreground">מופנה דרך ReviewHub · עמלת שותפים 10%</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateRedirect;
