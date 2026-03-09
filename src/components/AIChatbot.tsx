import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useAIChat } from "@/hooks/useAIChat";

type ChatContext = "consumer" | "business";

interface AIChatbotProps {
  context?: ChatContext;
}

const INITIAL_MESSAGES: Record<ChatContext, string> = {
  consumer: "שלום! 👋 אני העוזר החכם של ReviewHub. אני יכול לסייע לכם למצוא קורסים ופרילנסרים, לקרוא ביקורות ולקבל המלצות מותאמות אישית. במה אוכל לעזור?",
  business: "שלום! 👋 אני היועץ העסקי של ReviewHub. אני יכול לסייע לכם בבחירת התוכנית המתאימה, הדרכה על הפיצ'רים, טיפים לקבלת ביקורות ועוד. במה אוכל לעזור?",
};

const QUICK_SUGGESTIONS: Record<ChatContext, string[]> = {
  consumer: [
    "מה זה ReviewHub?",
    "איך אני יודע שהביקורות אמיתיות?",
    "תמליץ על קורס שיווק דיגיטלי",
    "מי הפרילנסר הכי טוב לעיצוב אתרים?",
    "איך כותבים ביקורת?",
    "כמה עולים הקורסים?",
  ],
  business: [
    "מה ההבדל בין התוכניות?",
    "כמה עולה תוכנית Pro?",
    "איך מקבלים יותר ביקורות?",
    "מה זה מערכת אפיליאט?",
    "איך עובד הדאשבורד?",
    "מה כולל דוח AI?",
  ],
};

const CHAT_TITLES: Record<ChatContext, string> = {
  consumer: "עוזר ReviewHub",
  business: "יועץ עסקי ReviewHub",
};

const CHAT_SUBTITLES: Record<ChatContext, string> = {
  consumer: "חיפוש, המלצות וביקורות",
  business: "ייעוץ עסקי וטכני",
};

const CHAT_PLACEHOLDERS: Record<ChatContext, string> = {
  consumer: "חפשו קורסים, פרילנסרים, או שאלו שאלה...",
  business: "שאלו על תוכניות, פיצ'רים, אסטרטגיה...",
};

const AIChatbot = ({ context = "consumer" }: AIChatbotProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useAIChat(context, INITIAL_MESSAGES[context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusiness = context === "business";
  const IconComponent = isBusiness ? Building2 : Bot;

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
            className="fixed bottom-24 left-4 right-4 sm:left-6 sm:right-auto z-50 sm:w-[380px] max-h-[70vh] h-[520px] rounded-2xl overflow-hidden glass border border-border/50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-border/50 flex items-center gap-3" style={{ background: "linear-gradient(135deg, hsl(160 100% 40% / 0.1), transparent)" }}>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <IconComponent size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm">{CHAT_TITLES[context]}</p>
                <p className="text-xs text-muted-foreground">{CHAT_SUBTITLES[context]}</p>
              </div>
            </div>

            <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-secondary/50 text-center border-b border-border/30">
              🤖 תשובות נוצרות באמצעות AI ואינן מהוות ייעוץ מקצועי. ייתכנו אי-דיוקים.
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
                    {msg.role === "assistant" ? <IconComponent size={14} className="text-primary" /> : <User size={14} className="text-muted-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tl-sm"
                      : "bg-secondary text-foreground rounded-tr-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mt-1 [&>ul]:mb-2 [&_a]:text-primary [&_a]:underline">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Quick suggestion chips — show only after the initial message */}
              {messages.length === 1 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {QUICK_SUGGESTIONS[context].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { sendMessage(q); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <IconComponent size={14} className="text-primary" />
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
                  placeholder={CHAT_PLACEHOLDERS[context]}
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
