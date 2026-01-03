import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  BookOpen,
  Video,
  Mail,
  ExternalLink,
  Send,
  Sparkles,
  Zap,
  BarChart,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

const FAQ_ITEMS = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I connect my YouTube channel?",
        a: "Go to Dashboard and click 'Connect YouTube' or navigate to Settings > Connections. You'll be prompted to sign in with your Google account and grant CreatorFlow access to your channel data.",
      },
      {
        q: "What data does CreatorFlow access from YouTube?",
        a: "CreatorFlow reads your video titles, descriptions, thumbnails, view counts, and comments. We never post anything on your behalf without explicit permission.",
      },
      {
        q: "How do I set up my content style preferences?",
        a: "During onboarding, you'll configure your tone, preferred words, and about section. You can update these anytime in Settings > Content Style.",
      },
    ],
  },
  {
    category: "Repurpose Studio",
    questions: [
      {
        q: "How does content generation work?",
        a: "Select a video, choose output formats (X thread, LinkedIn post, etc.), and click Generate. Our AI analyzes your video content and creates platform-optimized drafts matching your style preferences.",
      },
      {
        q: "Can I edit generated content?",
        a: "Yes! All generated content is saved as drafts. You can edit, regenerate, or copy them from the Drafts page.",
      },
      {
        q: "How many generations do I get per month?",
        a: "It depends on your plan. Free users get 10 generations/month, Pro gets 100, and Enterprise gets unlimited.",
      },
    ],
  },
  {
    category: "Deals & Sponsorships",
    questions: [
      {
        q: "How do brand deals appear in my inbox?",
        a: "Brands discover you through our marketplace and send partnership requests. You'll see them in your Deals inbox with full details about budget and requirements.",
      },
      {
        q: "How do I respond to deal offers?",
        a: "Click on any deal to view details. Use the AI Draft feature to generate a professional response, then customize and send it.",
      },
    ],
  },
  {
    category: "Automations",
    questions: [
      {
        q: "What automations can I create?",
        a: "You can automate content generation when you publish videos, notification alerts for comments, scheduled newsletter creation, and more.",
      },
      {
        q: "Can I pause an automation?",
        a: "Yes, use the toggle switch on any automation card to enable or disable it without deleting the configuration.",
      },
    ],
  },
];

const QUICK_LINKS = [
  { label: "Video Tutorials", icon: Video, href: "#" },
  { label: "Documentation", icon: BookOpen, href: "#" },
  { label: "Community Discord", icon: MessageSquare, href: "#" },
  { label: "API Reference", icon: ExternalLink, href: "#" },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ subject: "", message: "" });
  };

  const filteredFAQ = FAQ_ITEMS.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-2">How can we help?</h1>
          <p className="text-muted-foreground mb-6">
            Search our knowledge base or browse common questions
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{link.label}</span>
            </a>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <Sparkles className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">AI Repurposing</h3>
              <p className="text-sm text-muted-foreground">
                Turn videos into threads, posts, and more
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-info mb-3" />
              <h3 className="font-semibold mb-1">Automations</h3>
              <p className="text-sm text-muted-foreground">
                Set up workflows to save time
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="pt-6">
              <BarChart className="h-8 w-8 text-success mb-3" />
              <h3 className="font-semibold mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track your channel performance
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="pt-6">
              <DollarSign className="h-8 w-8 text-warning mb-3" />
              <h3 className="font-semibold mb-1">Deals Inbox</h3>
              <p className="text-sm text-muted-foreground">
                Manage brand partnerships
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFAQ.map(category => (
                  <div key={category.category}>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      {category.category}
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, i) => (
                        <AccordionItem key={i} value={`${category.category}-${i}`}>
                          <AccordionTrigger className="text-left">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="What do you need help with?"
                value={contactForm.subject}
                onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Describe your issue or question..."
                value={contactForm.message}
                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={handleSubmitContact}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
