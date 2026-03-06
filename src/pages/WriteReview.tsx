import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const WriteReview = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    toast({ title: "Review submitted!", description: "Thank you for your verified review." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-trust-green text-sm font-medium mb-6">
            <ShieldCheck size={18} />
            Verified Purchase Review
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Write Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="mb-2 block">Your Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} type="button" onClick={() => setRating(i)} className="focus:outline-none">
                        <Star
                          size={32}
                          className={`transition-colors ${i <= rating ? "fill-star text-star" : "fill-star-empty text-star-empty"} hover:fill-star hover:text-star`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="mb-2 block">Your Name</Label>
                  <Input id="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} disabled={anonymous} />
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                  <Label htmlFor="anonymous">Submit anonymously</Label>
                </div>

                <div>
                  <Label htmlFor="review" className="mb-2 block">Your Review</Label>
                  <Textarea id="review" placeholder="Share your experience with this course..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={5} />
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Submit Review
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default WriteReview;
