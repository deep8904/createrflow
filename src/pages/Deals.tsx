import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDeals, updateDeal, addDealMessage, Deal } from "@/lib/api/deals";
import { getGmailIntegration, syncGmailEmails, Integration } from "@/lib/api/integrations";
import { 
  Inbox, 
  Check, 
  X, 
  Clock, 
  DollarSign,
  Calendar,
  Sparkles,
  Loader2,
  RefreshCw,
  Mail,
  User,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type DealStatus = "New" | "Negotiating" | "Closed";

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gmailIntegration, setGmailIntegration] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dealsData, gmailInt] = await Promise.all([
        getDeals(),
        getGmailIntegration(),
      ]);
      setDeals(dealsData);
      setGmailIntegration(gmailInt);
    } catch (error) {
      console.error("Error loading deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }

  const handleSync = async () => {
    let timeoutId: number | undefined;
    try {
      setSyncing(true);
      
      timeoutId = window.setTimeout(() => {
        setSyncing(false);
        toast.message("Sync is still running", {
          description: "Check back in a moment and sync again if needed.",
        });
      }, 25000);

      const result = await syncGmailEmails();
      toast.success(result.message);
      
      const dealsData = await getDeals();
      setDeals(dealsData);
      
      const gmailInt = await getGmailIntegration();
      setGmailIntegration(gmailInt);
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync Gmail");
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      setSyncing(false);
    }
  };

  const newDeals = deals.filter(d => d.status === "New");
  const negotiatingDeals = deals.filter(d => d.status === "Negotiating");
  const closedDeals = deals.filter(d => d.status === "Closed");

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "New": return "bg-info/15 text-info border-info/20";
      case "Negotiating": return "bg-warning/15 text-warning border-warning/20";
      case "Closed": return "bg-success/15 text-success border-success/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "New": return <Clock className="h-3 w-3" />;
      case "Negotiating": return <TrendingUp className="h-3 w-3" />;
      case "Closed": return <CheckCircle2 className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleAccept = async (deal: Deal) => {
    setSubmitting(true);
    try {
      if (replyText.trim()) {
        await addDealMessage(deal.id, { content: replyText, sender: "me" });
      }
      const updated = await updateDeal(deal.id, { status: "Negotiating" });
      setDeals(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      toast.success(`Accepted deal from ${deal.brand_name}`);
      setSelectedDeal(null);
      setReplyText("");
    } catch (error) {
      toast.error("Failed to accept deal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (deal: Deal) => {
    setSubmitting(true);
    try {
      const updated = await updateDeal(deal.id, { status: "Closed" });
      setDeals(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      toast.info(`Declined deal from ${deal.brand_name}`);
      setSelectedDeal(null);
    } catch (error) {
      toast.error("Failed to decline deal");
    } finally {
      setSubmitting(false);
    }
  };

  const generateAIReply = async () => {
    if (!selectedDeal) return;
    
    setIsGeneratingReply(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const contactName = selectedDeal.contact_name || selectedDeal.brand_name + " team";
    setReplyText(`Hi ${contactName},

Thank you so much for reaching out! I'm excited about the opportunity to collaborate.

I've reviewed your proposal and I'm interested in discussing this further.

A few questions:
- What's the timeline for this campaign?
- Are there specific talking points you'd like me to cover?
- Will there be creative freedom in how I present the integration?

Looking forward to your response!

Best regards`);
    
    setIsGeneratingReply(false);
    toast.success("AI reply generated!");
  };

  const DealCard = ({ deal, index }: { deal: Deal; index: number }) => (
    <Card 
      className="group cursor-pointer border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setSelectedDeal(deal)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-background shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold text-sm">
              {deal.brand_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                  {deal.brand_name}
                </h4>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {deal.subject}
                </p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0.5 gap-1 font-medium ${getStatusColor(deal.status)}`}>
                {getStatusIcon(deal.status)}
                {deal.status || "New"}
              </Badge>
            </div>

            {deal.summary && (
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {deal.summary}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
              {deal.proposed_rate && (
                <span className="flex items-center gap-1 text-success font-semibold">
                  <DollarSign className="h-3 w-3" />
                  {deal.proposed_rate.toLocaleString()}
                </span>
              )}
              {deal.contact_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {deal.contact_name}
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto">
                <Calendar className="h-3 w-3" />
                {deal.updated_at ? formatDistanceToNow(new Date(deal.updated_at), { addSuffix: true }) : "Recently"}
              </span>
            </div>

            {deal.deliverables && deal.deliverables.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {deal.deliverables.slice(0, 2).map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal bg-secondary/50">
                    {d}
                  </Badge>
                ))}
                {deal.deliverables.length > 2 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal bg-secondary/50">
                    +{deal.deliverables.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-10 w-80" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show connect Gmail state when not connected
  if (!gmailIntegration?.connected) {
    return (
      <AppLayout>
        <div className="p-6 space-y-5 max-w-5xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
            <p className="text-sm text-muted-foreground">Manage brand partnerships</p>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Gmail to see your deals</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Connect your Gmail account to automatically sync brand partnership emails and manage deals in one place.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/app/settings?tab=connections">
                <Mail className="h-4 w-4" />
                Connect Gmail
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
            <p className="text-sm text-muted-foreground">
              Manage brand partnerships
              {gmailIntegration?.last_sync_at && (
                <span className="text-muted-foreground/60">
                  {" "}· Synced {formatDistanceToNow(new Date(gmailIntegration.last_sync_at), { addSuffix: true })}
                </span>
              )}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2 h-9"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync Gmail
          </Button>
        </div>

        {/* Stats row */}
        {deals.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-info/5 border border-info/10">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{newDeals.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">New</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{negotiatingDeals.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Negotiating</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/10">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{closedDeals.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Closed</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="new" className="space-y-4">
          <TabsList className="bg-muted/40 p-1 h-10">
            <TabsTrigger value="new" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Clock className="h-3.5 w-3.5" />
              New
              {newDeals.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-info/20 text-info font-medium">
                  {newDeals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="negotiating" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="h-3.5 w-3.5" />
              In Progress
              {negotiatingDeals.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-warning/20 text-warning font-medium">
                  {negotiatingDeals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Closed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4 space-y-3">
            {newDeals.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No new deals"
                description="New brand partnership requests will appear here."
              />
            ) : (
              newDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} />)
            )}
          </TabsContent>

          <TabsContent value="negotiating" className="mt-4 space-y-3">
            {negotiatingDeals.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No deals in progress"
                description="Deals you're actively negotiating appear here."
              />
            ) : (
              negotiatingDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} />)
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-4 space-y-3">
            {closedDeals.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No closed deals"
                description="Completed or declined deals appear here."
              />
            ) : (
              closedDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Deal Detail Sheet */}
        <Sheet open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
          <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col border-l">
            {selectedDeal && (
              <>
                <SheetHeader className="p-5 pb-4 border-b bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                        {selectedDeal.brand_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg truncate leading-tight">
                        {selectedDeal.brand_name}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {selectedDeal.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 ${getStatusColor(selectedDeal.status)}`}>
                          {getStatusIcon(selectedDeal.status)}
                          {selectedDeal.status || "New"}
                        </Badge>
                        {selectedDeal.source === "gmail" && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
                            <Mail className="h-2.5 w-2.5" />
                            Gmail
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                  <div className="p-5 space-y-5">
                    {/* AI Summary */}
                    {selectedDeal.summary && (
                      <div className="rounded-lg p-4 bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">AI Summary</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedDeal.summary}
                        </p>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</h4>
                      <div className="rounded-lg border bg-card p-3 space-y-2">
                        {selectedDeal.contact_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{selectedDeal.contact_name}</span>
                          </div>
                        )}
                        {(selectedDeal.contact_email || selectedDeal.brand_email) && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Email</span>
                            <a 
                              href={`mailto:${selectedDeal.contact_email || selectedDeal.brand_email}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                              {selectedDeal.contact_email || selectedDeal.brand_email}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        )}
                        {selectedDeal.proposed_rate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Proposed Rate</span>
                            <span className="font-semibold text-success">
                              ${selectedDeal.proposed_rate.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deliverables */}
                    {selectedDeal.deliverables && selectedDeal.deliverables.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deliverables</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDeal.deliverables.map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Data */}
                    {selectedDeal.extracted_data && Object.keys(selectedDeal.extracted_data).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</h4>
                        <div className="rounded-lg border bg-card p-3 space-y-2">
                          {selectedDeal.extracted_data.timeline && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Timeline</span>
                              <span className="font-medium">{selectedDeal.extracted_data.timeline}</span>
                            </div>
                          )}
                          {selectedDeal.extracted_data.budget && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Budget</span>
                              <span className="font-medium">{selectedDeal.extracted_data.budget}</span>
                            </div>
                          )}
                          {selectedDeal.extracted_data.next_steps && (
                            <div className="text-sm">
                              <span className="text-muted-foreground block text-xs mb-1">Next Steps</span>
                              <span className="font-medium">{selectedDeal.extracted_data.next_steps}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email Thread */}
                    {selectedDeal.messages && selectedDeal.messages.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" />
                          Thread ({selectedDeal.messages.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedDeal.messages.map((msg, i) => (
                            <div key={msg.id || i} className="rounded-lg border bg-muted/30 p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium">
                                  {msg.sender === "me" ? "You" : msg.sender}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.timestamp 
                                    ? format(new Date(msg.timestamp), "MMM d, h:mm a")
                                    : msg.created_at 
                                      ? format(new Date(msg.created_at), "MMM d, h:mm a")
                                      : ""
                                  }
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply section for New deals */}
                    {selectedDeal.status === "New" && (
                      <div className="pt-2 space-y-3">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Reply</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={generateAIReply}
                            disabled={isGeneratingReply}
                            className="gap-1.5 h-7 text-xs text-primary hover:text-primary"
                          >
                            <Sparkles className="h-3 w-3" />
                            {isGeneratingReply ? "Generating..." : "AI Draft"}
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={5}
                          className="resize-none text-sm"
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer Actions */}
                {selectedDeal.status === "New" && (
                  <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        className="flex-1 gap-2 h-9"
                        onClick={() => handleAccept(selectedDeal)}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept & Reply
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecline(selectedDeal)}
                        disabled={submitting}
                        className="gap-2 h-9"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}