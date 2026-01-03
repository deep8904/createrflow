import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getDraftsWithVideoStatus, updateDraft, deleteDraft, DraftWithVideo } from "@/lib/api/drafts";
import { 
  FileText, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Clock,
  Loader2,
  Youtube,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  newsletter: Mail,
  blog: FileText,
  youtube: Youtube,
};

export default function Drafts() {
  const [drafts, setDrafts] = useState<DraftWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDraft, setEditingDraft] = useState<DraftWithVideo | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      const data = await getDraftsWithVideoStatus();
      setDrafts(data);
    } catch (error) {
      console.error("Error loading drafts:", error);
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }

  const filteredDrafts = drafts.filter(draft =>
    draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (draft: DraftWithVideo) => {
    setEditingDraft(draft);
    setEditContent(draft.content);
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    
    setSubmitting(true);
    try {
      const updated = await updateDraft(editingDraft.id, { content: editContent });
      setDrafts(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      setEditingDraft(null);
      toast.success("Draft updated!");
    } catch (error) {
      toast.error("Failed to update draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDraft(id);
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast.success("Draft deleted");
    } catch (error) {
      toast.error("Failed to delete draft");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const getPlatformIcon = (platform: string) => {
    return PLATFORM_ICONS[platform.toLowerCase()] || FileText;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
      case "x": return "bg-blue-500/10 text-blue-500";
      case "linkedin": return "bg-blue-700/10 text-blue-700";
      case "instagram": return "bg-pink-500/10 text-pink-500";
      case "newsletter": return "bg-purple-500/10 text-purple-500";
      case "youtube": return "bg-red-500/10 text-red-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Drafts</h1>
            <p className="text-sm text-muted-foreground">Your saved content drafts</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium mb-1">
              {searchQuery ? "No drafts found" : "No drafts yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {searchQuery 
                ? "Try a different search term" 
                : "Generate content in Repurpose Studio to create drafts"
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map(draft => {
              const PlatformIcon = getPlatformIcon(draft.platform);
              const isVideoRemoved = draft.video_status === 'removed';
              
              return (
                <Card key={draft.id} className="group border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${getPlatformColor(draft.platform)}`}>
                          <PlatformIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm line-clamp-1">{draft.title}</CardTitle>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {draft.created_at ? formatDistanceToNow(new Date(draft.created_at), { addSuffix: true }) : "Unknown"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(draft)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy(draft.content)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(draft.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/30 rounded-lg p-2.5">
                      {draft.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">
                        {draft.platform}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                        {draft.type}
                      </Badge>
                      {isVideoRemoved && (
                        <Badge variant="destructive" className="text-[10px] px-2 py-0 h-5 flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Removed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Draft</DialogTitle>
            </DialogHeader>
            {editingDraft && (
              <div className="space-y-4 pt-4">
                {editingDraft.video_status === 'removed' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>The source video for this draft was removed from YouTube</span>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={12}
                    className="font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveEdit} className="flex-1" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
