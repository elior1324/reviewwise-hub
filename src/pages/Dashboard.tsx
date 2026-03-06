import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";
import { Star, MessageSquare, Link2, Upload, TrendingUp, Users, BarChart3, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const STATS = [
  { icon: Star, label: "Average Rating", value: "4.8" },
  { icon: MessageSquare, label: "Total Reviews", value: "124" },
  { icon: TrendingUp, label: "Response Rate", value: "92%" },
  { icon: Users, label: "Requests Sent", value: "180" },
];

const RECENT_REVIEWS = [
  { reviewerName: "Sarah L.", rating: 5, text: "Absolutely transformative!", courseName: "Full-Stack Bootcamp", date: "Feb 28, 2026", verified: true, anonymous: false },
  { reviewerName: "Anonymous", rating: 4, text: "Great content overall.", courseName: "SEO Fundamentals", date: "Feb 25, 2026", verified: true, anonymous: true },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display font-bold text-3xl mb-2">Business Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your reviews and grow your reputation.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
            <TabsTrigger value="upload">Upload Purchases</TabsTrigger>
            <TabsTrigger value="links">Review Links</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECENT_REVIEWS.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ReviewCard {...r} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload size={20} /> Upload Purchase CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV with columns: email, course_name, purchase_date, receipt_id, amount
                </p>
                <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Drag & drop your CSV file here</p>
                  <Button variant="outline" size="sm">Browse Files</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 size={20} /> Generate Review Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Email</label>
                  <Input placeholder="customer@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Course Name</label>
                  <Input placeholder="e.g. Digital Marketing Masterclass" />
                </div>
                <Button className="bg-primary text-primary-foreground gap-2"><Send size={16} /> Generate & Send Link</Button>
                <div className="mt-4 p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Generated Link:</p>
                  <code className="text-sm text-foreground">reviewhub.co.il/review/abc123-token</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="widgets">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 size={20} /> Embed Widgets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-display font-semibold mb-2">Rating Badge</h3>
                  <div className="bg-secondary p-4 rounded-lg">
                    <code className="text-xs text-foreground break-all">
                      {'<script src="https://reviewhub.co.il/widget.js" data-business="your-slug" data-type="badge"></script>'}
                    </code>
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-2">Review Carousel</h3>
                  <div className="bg-secondary p-4 rounded-lg">
                    <code className="text-xs text-foreground break-all">
                      {'<script src="https://reviewhub.co.il/widget.js" data-business="your-slug" data-type="carousel"></script>'}
                    </code>
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-2">Review List</h3>
                  <div className="bg-secondary p-4 rounded-lg">
                    <code className="text-xs text-foreground break-all">
                      {'<script src="https://reviewhub.co.il/widget.js" data-business="your-slug" data-type="list"></script>'}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
