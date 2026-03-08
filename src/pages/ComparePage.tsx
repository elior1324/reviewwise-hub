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
}

type Msg = { role: "user" | "assistant"; content: string };

const COMPARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-items`;

const ComparePage = () => {
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // AI comparison state
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

  // Search businesses and courses
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const [bizRes, courseRes] = await Promise.all([
        supabase.from("businesses").select("id, name, slug, category, rating, review_count, description").ilike("name", `%${query}%`).limit(5),
        supabase.from("courses").select("id, name, category, rating, review_count, price, description, business_id, businesses(name, slug)").ilike("name", `%${query}%`).limit(5),
      ]);

      const results: SearchResult[] = [];

      if (bizRes.data) {
        bizRes.data.forEach((b: any) => {
          results.push({
            id: b.id,
            name: b.name,
            category: b.category || "",
            rating: b.rating || 0,
            reviewCount: b.review_count || 0,
            description: b.description || "",
            type: "freelancer",
            slug: b.slug,
          });
        });
      }

      if (courseRes.data) {
        courseRes.data.forEach((c: any) => {
          results.push({
            id: c.id,
            name: c.name,
            category: c.category || "",
            rating: c.rating || 0,
            reviewCount: c.review_count || 0,
            price: c.price,
            description: c.description || "",
            type: "course",
            businessName: c.businesses?.name,
            slug: c.businesses?.slug,
          });
        });
      }

      setSearchResults(results);
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
    // Reset comparison when items change
    setComparisonStarted(false);
    setMessages([]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
    setComparisonStarted(false);
    setMessages([]);
  };

  // Stream AI comparison
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
      const resp = await fetch(COMPARE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          items: selectedItems,
          messages: chatMessages,
        }),
      });

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

      {/* Hero */}
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
        {/* Search & Selection */}
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
              <button onClick={() => { setSearchQuery(""); setShowResults(false); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            )}

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => addItem(r)}
                      disabled={selectedItems.some(s => s.id === r.id)}
                      className="w-full text-right p-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 border-b border-border/30 last:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.businessName ? `${r.businessName} · ` : ""}
                          {r.category}
                          {r.price ? ` · ₪${r.price.toLocaleString()}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.reviewCount} ביקורות</span>
                        <span className="text-xs font-medium text-primary">⭐{r.rating}</span>
                        <Plus size={16} className="text-primary" />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-50 p-6 text-center text-muted-foreground"
                >
                  לא נמצאו תוצאות עבור "{searchQuery}"
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {selectedItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-card border border-border rounded-xl p-4 group"
                >
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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

              {/* Add more placeholder */}
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

          {/* Compare Button */}
          {selectedItems.length >= 2 && !comparisonStarted && (
            <div className="text-center">
              <Button onClick={startComparison} size="lg" className="gap-2 px-8">
                <Scale size={18} />
                השוו עכשיו עם AI
              </Button>
            </div>
          )}
        </div>

        {/* AI Comparison Results + Chat */}
        <AnimatePresence>
          {comparisonStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* View Toggle */}
              <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-xl p-1 max-w-xs mx-auto">
                <button
                  onClick={() => setViewMode("chat")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    viewMode === "chat"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare size={15} />
                  ניתוח AI
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    viewMode === "table"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Table2 size={15} />
                  טבלה
                </button>
              </div>

              {/* Table View */}
              {viewMode === "table" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right p-4 font-semibold text-muted-foreground bg-muted/30 min-w-[120px]">קריטריון</th>
                          {selectedItems.map((item, i) => (
                            <th key={item.id} className="p-4 text-center min-w-[160px]">
                              <div className="flex flex-col items-center gap-1">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                <span className="font-semibold text-foreground text-sm">{item.name}</span>
                                {item.businessName && <span className="text-xs text-muted-foreground">{item.businessName}</span>}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-4 font-medium text-muted-foreground bg-muted/10">סוג</td>
                          {selectedItems.map(item => (
                            <td key={item.id} className="p-4 text-center">
                              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                {item.type === "freelancer" ? "בעל מקצוע" : "קורס"}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-4 font-medium text-muted-foreground bg-muted/10">קטגוריה</td>
                          {selectedItems.map(item => (
                            <td key={item.id} className="p-4 text-center text-foreground">{item.category || "—"}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-4 font-medium text-muted-foreground bg-muted/10">דירוג</td>
                          {selectedItems.map(item => {
                            const maxRating = Math.max(...selectedItems.map(i => i.rating));
                            const isTop = item.rating === maxRating;
                            return (
                              <td key={item.id} className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <StarRating rating={item.rating} size={14} />
                                  <span className={`font-semibold ${isTop ? "text-primary" : "text-foreground"}`}>
                                    {item.rating}
                                  </span>
                                  {isTop && <span className="text-xs text-primary">👑</span>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-4 font-medium text-muted-foreground bg-muted/10">ביקורות</td>
                          {selectedItems.map(item => {
                            const maxReviews = Math.max(...selectedItems.map(i => i.reviewCount));
                            const isTop = item.reviewCount === maxReviews;
                            return (
                              <td key={item.id} className="p-4 text-center">
                                <span className={`font-semibold ${isTop ? "text-primary" : "text-foreground"}`}>
                                  {item.reviewCount}
                                </span>
                                {isTop && <span className="text-xs text-primary mr-1">🏆</span>}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-4 font-medium text-muted-foreground bg-muted/10">מחיר</td>
                          {selectedItems.map(item => {
                            const prices = selectedItems.filter(i => i.price !== undefined).map(i => i.price!);
                            const minPrice = prices.length > 0 ? Math.min(...prices) : null;
                            const isCheapest = item.price !== undefined && item.price === minPrice;
                            return (
                              <td key={item.id} className="p-4 text-center">
                                {item.price !== undefined ? (
                                  <span className={`font-semibold ${isCheapest ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                                    ₪{item.price.toLocaleString()}
                                    {isCheapest && <span className="text-xs mr-1">💰</span>}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {selectedItems.some(i => i.description) && (
                          <tr>
                            <td className="p-4 font-medium text-muted-foreground bg-muted/10 align-top">תיאור</td>
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

              {/* Chat View */}
              {viewMode === "chat" && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Messages */}
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

                  {/* Follow-up Chat Input */}
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
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {["מי מתאים למתחיל?", "מה היתרון הכי גדול של כל אחד?", "איזה יחס מחיר-ערך הכי טוב?"].map(q => (
                        <button
                          key={q}
                          onClick={() => { setChatInput(q); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {selectedItems.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Scale size={28} className="text-primary" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">התחילו להשוות</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              חפשו קורסים, בעלי מקצוע או הכשרות בשדה החיפוש למעלה והוסיפו אותם להשוואה.
              ה-AI שלנו ינתח ויציג את ההבדלים והמלצות בצורה חכמה.
            </p>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ComparePage;
