import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCourseById } from "@/data/mockData";

const AffiliateRedirect = () => {
  const { courseId } = useParams();

  useEffect(() => {
    const course = getCourseById(courseId || "");
    // Mock: log click
    console.log(`[ReviewHub Affiliate] Click tracked for course: ${courseId}`);

    if (course) {
      // In production, record to DB then redirect
      setTimeout(() => {
        window.location.href = course.affiliateUrl;
      }, 1500);
    }
  }, [courseId]);

  const course = getCourseById(courseId || "");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center noise-overlay">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
          <span className="font-display font-bold text-primary text-2xl">R</span>
        </div>
        <h1 className="font-display font-bold text-xl text-foreground">מעביר אותך לאתר הקורס...</h1>
        {course && <p className="text-muted-foreground">{course.name}</p>}
        <p className="text-xs text-muted-foreground">מופנה דרך ReviewHub</p>
      </div>
    </div>
  );
};

export default AffiliateRedirect;
