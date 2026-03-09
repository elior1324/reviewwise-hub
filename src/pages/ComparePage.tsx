import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Scale, Send, Bot, User, Loader2, Plus, Trash2, MessageSquare, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import StarRating from "@/components/StarRating";

interface CompareItem {
  id: string;
  name: string;
  businessName?: string;
  category: string;
  rating: number;
  reviewCount: number;
  price?: number;
  description?: string;
  type: "freelancer" | "course";
  slug?: string;
  yearsExperience?: number;
  difficultyLevel?: string;
  targetAudience?: string;
  location?: string;
  duration?: string;
  format?: string;
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  price?: number;
  description?: string;
  type: "freelancer" | "course";
  businessName?: string;
  slug?: string;
  yearsExperience?: number;
  difficultyLevel?: string;
  targetAudience?: string;
  location?: string;
  duration?: string;
  format?: string;
}

type Msg = { role: "user" | "assistant"; content: string };

const COMPARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-items`;

const ComparePage = () => {
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [comparisonStarted, setComparisonStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "table">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const [bizRes, courseRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, slug, category, rating, review_count, description, years_experience, difficulty_level, target_audience, location")
          .ilike("name", `%${query}%`)
          .limit(5),
        supabase
          .from("courses")
          .select("id, name, category, rating, review_count, price, description, duration, format, difficulty_level, target_audience, business_id, businesses(name)")
          .ilike("name", `%${query}%`)
          .limit(5),
      ]);

      const businesses: SearchResult[] = (bizRes.data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        rating: b.rating || 0,
        reviewCount: b.review_count || 0,
        description: b.description,
        type: "freelancer" as const,
        slug: b.slug,
        yearsExperience: b.years_experience,
        difficultyLevel: b.difficulty_level,
        targetAudience: b.target_audience,
        location: b.location,
      }));

      const courses: SearchResult[] = (courseRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        rating: c.rating || 0,
        reviewCount: c.review_count || 0,
        price: c.price,
        description: c.description,
        type: "course" as const,
        businessName: c.businesses?.name,
        duration: c.duration,
        format: c.format,
        difficultyLevel: c.difficulty_level,
        targetAudience: c.target_audience,
      }));

      setSearchResults([...businesses, ...courses]);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const addItem = (item: SearchResult) => {
    if (selectedItems.length >= 4) {
      toast({ title: "מקסימום 4 פריטים", description: "ניתן להשוות עד 4 פריטים בו-זמנית", variant: "destructive" });
      return;
    }
    if (selectedItems.some(s => s.id === item.id)) {
      toast({ title: "כבר נוסף", description: "פריט זה כבר נמצא ברשימת ההשוואה", variant: "destructive" });
      return;
    }
    setSelectedItems(prev => [...prev, { ...item }]);
    setSearchQuery("");
    setShowResults(false);
    setComparisonStarted(false);
    setMessages([]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
    setComparisonStarted(false);
    setMessages([]);
  };

  const streamComparison = useCallback(async (chatMessages: Msg[]) => {
    setIsAILoading(true);
    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      // Use the authenticated user's session JWT, not the anon key
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(COMPARE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selectedItems,
          messages: chatMessages,
        }),
      });

      if (resp.status === 401) {
        toast({ title: "נדרשת התחברות", description: "התחברו כדי להשתמש בהשוואת AI", variant: "destructive" });
        setIsAILoading(false);
        return;
      }
      if (resp.status === 429) {
        toast({ title: "יותר מדי בקשות", description: "נסו שוב בעוד רגע", variant: "destructive" });
        setIsAILoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "שגיאה", description: "שירות ה-AI אינו זמין כרגע", variant: "destructive" });
        setIsAILoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Compare error:", e);
      toast({ title: "שגיאה", description: "לא הצלחנו להתחבר לשירות ההשוואה", variant: "destructive" });
      setMessages(prev => [...prev, { role: "assistant", content: "מצטערים, נתקלנו בבעיה טכנית. נסו שוב בעוד רגע. 🙏" }]);
    } finally {
      setIsAILoading(false);
    }
  }, [selectedItems, toast]);

  const startComparison = () => {
    if (selectedItems.length < 2) {
      toast({ title: "נדרשים לפחות 2 פריטים", description: "הוסיפו עוד פריט להשוואה", variant: "destructive" });
      return;
    }
    setComparisonStarted(true);
    setMessages([]);
    streamComparison([{ role: "user", content: "אנא צור השוואה מפורטת בין הפריטים שנבחרו" }]);
  };

  const sendFollowUp = () => {
    if (!chatInput.trim() || isAILoading) return;
    const userMsg: Msg = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput("");
    streamComparison(updatedMessages);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay" dir="rtl">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="container py-12 md:py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium mb-4 text-primary">
              <Scale size={16} /> השוואה חכמה
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              השוו בין קורסים, פרילנסרים והכשרות
            </h1>
            <p className="text-muted-foreground text-lg">
              בחרו עד 4 פריטים להשוואה ו-AI ינתח עבורכם את היתרונות, החסרונות וההמלצות
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto mb-6">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="חפשו קורס, בעל מקצוע או הכשרה..."
              className="pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowResults(false); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}

            <AnimatePresence>
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {isSearching ? (
                    <div className="p-4 flex items-center gap-2 text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">מחפש...</span>
                    </div>
                  ) : (
                    searchResults.map(item => (
                      <button
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {item.type === "freelancer" ? "בעל מקצוע" : "קורס"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{item.category}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          {item.businessName && (
                            <p className="text-xs text-muted-foreground">{item.businessName}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-left">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StarRating rating={item.rating} size={10} />
                            <span>{item.rating}</span>
                          </div>
                          {item.price !== undefined && (
                            <p className="text-xs font-medium text-primary">₪{item.price.toLocaleString()}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {selectedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-card border border-border rounded-xl p-4"
                >
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 left-2 w-5 h-5 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                  <div className="mb-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {item.type === "freelancer" ? "בעל מקצוע" : "קורס"}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-1 truncate">{item.name}</h3>
                  {item.businessName && <p className="text-xs text-muted-foreground mb-1">{item.businessName}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StarRating rating={item.rating} size={12} />
                    <span>{item.reviewCount} ביקורות</span>
                  </div>
                  {item.price !== undefined && (
                    <p className="text-xs font-medium text-primary mt-1">₪{item.price.toLocaleString()}</p>
                  )}
                </motion.div>
              ))}

              {selectedItems.length < 4 && (
                <div
                  onClick={() => document.querySelector<HTMLInputElement>("input[placeholder]")?.focus()}
                  className="border border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all min-h-[120px]"
                >
                  <Plus size={20} className="text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">הוסיפו פריט</span>
                </div>
              )}
            </div>
          )}

          {selectedItems.length >= 2 && !comparisonStarted && (
            <div className="text-center">
              <Button onClick={startComparison} size="lg" className="gap-2 px-8">
                <Scale size={18} />
                השוו עכשיו עם AI
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {comparisonStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-xl p-1 max-w-xs mx-auto">
                <button
                  onClick={() => setViewMode("chat")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    viewMode === "chat" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare size={14} />
                  ניתוח AI
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    viewMode === "table" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Table2 size={14} />
                  טבלה
                </button>
              </div>

              {viewMode === "table" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="p-4 text-right text-sm font-semibold text-muted-foreground w-32">פרמטר</th>
                          {selectedItems.map(item => (
                            <th key={item.id} className="p-4 text-center text-sm font-semibold text-foreground">
                              {item.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 align-top">סוג</td>
                          {selectedItems.map(item => (
                            <td key={item.id} className="p-4 text-center text-sm">
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                                {item.type === "freelancer" ? "בעל מקצוע" : "קורס"}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 align-top">דירוג</td>
                          {selectedItems.map(item => (
                            <td key={item.id} className="p-4">
                              <div className="flex flex-col items-center gap-1">
                                <StarRating rating={item.rating} size={14} />
                                <span className="text-xs text-muted-foreground">{item.rating} ({item.reviewCount})</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        {selectedItems.some(i => i.price !== undefined) && (
                          <tr className="border-b border-border/50">
                            <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 align-top">מחיר</td>
                            {selectedItems.map(item => (
                              <td key={item.id} className="p-4 text-center text-sm font-medium text-primary">
                                {item.price !== undefined ? `₪${item.price.toLocaleString()}` : "—"}
                              </td>
                            ))}
                          </tr>
                        )}
                        {selectedItems.some(i => i.category) && (
                          <tr className="border-b border-border/50">
                            <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 align-top">קטגוריה</td>
                            {selectedItems.map(item => (
                              <td key={item.id} className="p-4 text-center text-sm text-muted-foreground">
                                {item.category || "—"}
                              </td>
                            ))}
                          </tr>
                        )}
                        {selectedItems.some(i => i.description) && (
                          <tr>
                            <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 align-top">תיאור</td>
                            {selectedItems.map(item => (
                              <td key={item.id} className="p-4 text-muted-foreground text-xs leading-relaxed">
                                {item.description || "—"}
                              </td>
                            ))}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-border bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground mb-2">רוצים ניתוח מעמיק יותר?</p>
                    <Button variant="outline" size="sm" onClick={() => setViewMode("chat")} className="gap-2">
                      <MessageSquare size={14} />
                      עברו לניתוח AI
                    </Button>
                  </div>
                </motion.div>
              )}

              {viewMode === "chat" && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border/50 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted/50 [&_th]:text-foreground [&_th]:font-semibold [&_th]:text-sm [&_td]:border [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-muted-foreground [&_strong]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:space-y-1 [&_li]:text-muted-foreground">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                              {isAILoading && i === messages.length - 1 && (
                                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse mr-1" />
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {isAILoading && messages.length === 0 && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">מנתח ומשווה...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="border-t border-border p-4">
                    <p className="text-xs text-muted-foreground mb-2">💡 שאלו שאלות המשך על ההשוואה</p>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendFollowUp()}
                        placeholder="למשל: מה מתאים למתחיל? מי זול יותר?"
                        disabled={isAILoading}
                        className="flex-1"
                      />
                      <Button onClick={sendFollowUp} disabled={isAILoading || !chatInput.trim()} size="icon">
                        {isAILoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setComparisonStarted(false);
                    setMessages([]);
                    setSelectedItems([]);
                  }}
                  className="text-muted-foreground gap-2"
                >
                  <X size={14} />
                  התחילו השוואה חדשה
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};

export default ComparePage;
