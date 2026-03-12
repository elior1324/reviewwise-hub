import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export interface Notification {
  id: string;
  type: "deal" | "response" | "like" | "update" | "review";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "deal",
    title: "🔥 מבצע חדש!",
    description: "אקדמיית שיווק דיגיטלי הוציאו 30% הנחה על קורס SEO",
    time: "לפני 5 דקות",
    read: false,
  },
  {
    id: "n2",
    type: "response",
    title: "💬 תגובה חדשה",
    description: 'בעל העסק הגיב לביקורת שלכם על "בוטקמפ Full-Stack"',
    time: "לפני 20 דקות",
    read: false,
  },
  {
    id: "n3",
    type: "like",
    title: "👍 לייק חדש",
    description: '3 אנשים אהבו את התגובה שלכם על "יסודות עיצוב UI/UX"',
    time: "לפני שעה",
    read: false,
  },
  {
    id: "n4",
    type: "update",
    title: "📢 עדכון קורס",
    description: 'Code Masters IL עדכנו את תוכן הקורס "React מתקדם"',
    time: "לפני 3 שעות",
    read: true,
  },
  {
    id: "n5",
    type: "review",
    title: "⭐ ביקורת חדשה",
    description: 'ביקורת חדשה התפרסמה על "Python למדעי נתונים"',
    time: "לפני 5 שעות",
    read: true,
  },
  {
    id: "n6",
    type: "deal",
    title: "💰 הנחה מיוחדת",
    description: "מרכז מדעי הנתונים — 20% הנחה על למידת מכונה מתקדמת",
    time: "אתמול",
    read: true,
  },
];

const typeColors: Record<string, string> = {
  deal: "bg-accent/20 text-accent",
  response: "bg-primary/20 text-primary",
  like: "bg-primary/20 text-primary",
  update: "bg-secondary text-foreground",
  review: "bg-star/20 text-star",
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground relative"
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl glass border border-border/50 shadow-2xl z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-display font-semibold text-sm">התראות</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  סמנו הכל כנקרא
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 border-b border-border/30 last:border-0 transition-colors ${
                    !n.read ? "bg-primary/5" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs ${typeColors[n.type] || "bg-secondary text-foreground"}`}>
                    {n.type === "deal" && "🔥"}
                    {n.type === "response" && "💬"}
                    {n.type === "like" && "👍"}
                    {n.type === "update" && "📢"}
                    {n.type === "review" && "⭐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
