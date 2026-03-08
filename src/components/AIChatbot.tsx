import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { COURSES, BUSINESSES } from "@/data/mockData";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGE: Msg = {
  role: "assistant",
  content: "שלום! 👋 אני העוזר החכם של ReviewHub. אני יכול לסייע לכם למצוא קורסים, לקרוא ביקורות ולקבל המלצות מותאמות אישית. במה אוכל לעזור לכם?",
};

const getMockResponse = (input: string): string => {
  const lower = input.toLowerCase();

  // Course recommendations based on actual data
  if (lower.includes("קורס") || lower.includes("course") || lower.includes("המלצ")) {
    const topCourses = [...COURSES].sort((a, b) => b.rating - a.rating).slice(0, 4);
    const list = topCourses.map(c => {
      const biz = BUSINESSES.find(b => b.slug === c.businessSlug);
      return `⭐ **${c.name}** (${c.rating}) - ₪${c.price.toLocaleString()}\n   ${biz?.name || ""} | ${c.verifiedPurchases} רכישות מאומתות`;
    }).join("\n\n");
    return `**הקורסים המומלצים ביותר:**\n\n${list}\n\nרוצים לדעת עוד על אחד מהם?`;
  }

  // Category-specific search
  const categories = ["שיווק", "תכנות", "עיצוב", "מדעי נתונים", "עסקים"];
  const matchedCat = categories.find(c => lower.includes(c));
  if (matchedCat) {
    const catCourses = COURSES.filter(c => c.category === matchedCat).sort((a, b) => b.rating - a.rating);
    if (catCourses.length > 0) {
      const list = catCourses.map(c => `⭐ **${c.name}** - דירוג ${c.rating} | ₪${c.price.toLocaleString()}`).join("\n");
      return `**קורסי ${matchedCat} מומלצים:**\n\n${list}\n\nכל הקורסים כוללים ביקורות מאומתות מסטודנטים אמיתיים.`;
    }
  }

  if (lower.includes("מחיר") || lower.includes("זול") || lower.includes("price")) {
    const affordable = [...COURSES].sort((a, b) => a.price - b.price).slice(0, 3);
    const list = affordable.map(c => `💰 **${c.name}** - ₪${c.price.toLocaleString()} (⭐ ${c.rating})`).join("\n");
    return `**הקורסים במחיר הנגיש ביותר:**\n\n${list}`;
  }

  if (lower.includes("ביקורת") || lower.includes("review")) {
    return "במערכת שלנו יש **מעל 12,400 ביקורות מאומתות**. כל ביקורת מקושרת לרכישה אמיתית, כך שתוכלו לסמוך על המידע. 🔒\n\nרוצים לחפש ביקורות על קורס מסוים?";
  }

  return "שמח לעזור! 😊 אני יכול לסייע לכם בנושאים הבאים:\n\n• 🔍 **חיפוש קורסים** — מצאו את הקורס המתאים לכם\n• ⭐ **ביקורות** — קראו חוויות של סטודנטים אמיתיים\n• 💡 **המלצות** — קבלו המלצות מותאמות לצרכים שלכם\n• 💰 **מחירים** — מצאו קורסים בטווח התקציב שלכם\n• 📊 **השוואה** — השוו בין קורסים שונים\n\nנסו לשאול על קורסי שיווק, תכנות, עיצוב ועוד!";
};

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const response = getMockResponse(userMsg.content);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] rounded-2xl overflow-hidden glass border border-border/50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-border/50 flex items-center gap-3" style={{ background: "linear-gradient(135deg, hsl(160 100% 40% / 0.1), transparent)" }}>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm">עוזר ReviewHub</p>
                <p className="text-xs text-muted-foreground">מופעל על ידי AI</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    {msg.role === "assistant" ? <Bot size={14} className="text-primary" /> : <User size={14} className="text-muted-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tl-sm"
                      : "bg-secondary text-foreground rounded-tr-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mt-1 [&>ul]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tr-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="שאלו אותי משהו..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="glass border-border/50 text-sm"
                  disabled={isLoading}
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
