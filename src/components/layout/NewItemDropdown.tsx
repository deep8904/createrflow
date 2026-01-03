import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  FileText,
  Lightbulb,
  Handshake,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ModalType = "draft" | "idea" | "deal" | "automation" | null;

export function NewItemDropdown() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);

  // Draft form state
  const [draftForm, setDraftForm] = useState({
    title: "",
    type: "caption",
    platform: "Instagram",
    content: "",
    status: "Draft",
  });

  // Idea form state
  const [ideaForm, setIdeaForm] = useState({
    title: "",
    platform: "YouTube",
    status: "New",
    category: "General",
  });

  // Deal form state
  const [dealForm, setDealForm] = useState({
    brandName: "",
    subject: "",
    initialMessage: "",
  });

  const resetForms = () => {
    setDraftForm({ title: "", type: "caption", platform: "Instagram", content: "", status: "Draft" });
    setIdeaForm({ title: "", platform: "YouTube", status: "New", category: "General" });
    setDealForm({ brandName: "", subject: "", initialMessage: "" });
  };

  const handleClose = () => {
    setOpenModal(null);
    resetForms();
  };

  const handleCreateDraft = async () => {
    if (!draftForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("drafts").insert({
        user_id: user.id,
        title: draftForm.title.trim(),
        type: draftForm.type,
        platform: draftForm.platform,
        content: draftForm.content.trim() || "",
        status: draftForm.status,
      });

      if (error) throw error;

      toast.success("Draft created!");
      handleClose();
      navigate("/app/drafts");
    } catch (error: any) {
      toast.error(error.message || "Failed to create draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async () => {
    if (!ideaForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ideas").insert({
        user_id: user.id,
        title: ideaForm.title.trim(),
        platform: ideaForm.platform,
        status: ideaForm.status,
        category: ideaForm.category,
        source_type: "manual",
      });

      if (error) throw error;

      toast.success("Idea created!");
      handleClose();
      navigate("/app/ideas");
    } catch (error: any) {
      toast.error(error.message || "Failed to create idea");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!dealForm.brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    if (!dealForm.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create deal
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .insert({
          user_id: user.id,
          brand_name: dealForm.brandName.trim(),
          subject: dealForm.subject.trim(),
          status: "New",
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Create initial message if provided
      if (dealForm.initialMessage.trim() && deal) {
        await supabase.from("deal_messages").insert({
          deal_id: deal.id,
          sender: "brand",
          content: dealForm.initialMessage.trim(),
        });
      }

      toast.success("Deal created!");
      handleClose();
      navigate("/app/deals");
    } catch (error: any) {
      toast.error(error.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOpenModal("draft")}>
            <FileText className="h-4 w-4 mr-2" />
            New Draft
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("idea")}>
            <Lightbulb className="h-4 w-4 mr-2" />
            New Idea
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("deal")}>
            <Handshake className="h-4 w-4 mr-2" />
            New Deal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/automations")}>
            <Zap className="h-4 w-4 mr-2" />
            New Automation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Draft Modal */}
      <Dialog open={openModal === "draft"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-title">Title *</Label>
              <Input
                id="draft-title"
                placeholder="Enter draft title"
                value={draftForm.title}
                onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={draftForm.type} onValueChange={(v) => setDraftForm({ ...draftForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Caption</SelectItem>
                    <SelectItem value="thread">Thread</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="shorts">Shorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={draftForm.platform} onValueChange={(v) => setDraftForm({ ...draftForm, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="X">X (Twitter)</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={draftForm.status} onValueChange={(v) => setDraftForm({ ...draftForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-content">Content (optional)</Label>
              <Textarea
                id="draft-content"
                placeholder="Enter content..."
                rows={4}
                value={draftForm.content}
                onChange={(e) => setDraftForm({ ...draftForm, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCreateDraft} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Idea Modal */}
      <Dialog open={openModal === "idea"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="idea-title">Title *</Label>
              <Input
                id="idea-title"
                placeholder="Enter idea title"
                value={ideaForm.title}
                onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={ideaForm.platform} onValueChange={(v) => setIdeaForm({ ...ideaForm, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="X">X (Twitter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={ideaForm.status} onValueChange={(v) => setIdeaForm({ ...ideaForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Scripted">Scripted</SelectItem>
                    <SelectItem value="Filming">Filming</SelectItem>
                    <SelectItem value="Posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={ideaForm.category} onValueChange={(v) => setIdeaForm({ ...ideaForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Vlog">Vlog</SelectItem>
                  <SelectItem value="Educational">Educational</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCreateIdea} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Idea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Deal Modal */}
      <Dialog open={openModal === "deal"} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deal-brand">Brand Name *</Label>
              <Input
                id="deal-brand"
                placeholder="Enter brand name"
                value={dealForm.brandName}
                onChange={(e) => setDealForm({ ...dealForm, brandName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-subject">Subject *</Label>
              <Input
                id="deal-subject"
                placeholder="Enter deal subject"
                value={dealForm.subject}
                onChange={(e) => setDealForm({ ...dealForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-message">Initial Message (optional)</Label>
              <Textarea
                id="deal-message"
                placeholder="Paste the brand's initial message..."
                rows={4}
                value={dealForm.initialMessage}
                onChange={(e) => setDealForm({ ...dealForm, initialMessage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCreateDeal} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
