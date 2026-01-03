import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIdeas, createIdea, updateIdea, deleteIdea, Idea } from "@/lib/api/ideas";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Lightbulb, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type IdeaStatus = "New" | "Scripted" | "Filming" | "Posted";
type IdeaDifficulty = "Easy" | "Medium" | "Hard";

const COLUMNS: { id: IdeaStatus; label: string; color: string }[] = [
  { id: "New", label: "New", color: "bg-muted" },
  { id: "Scripted", label: "Scripted", color: "bg-info/20" },
  { id: "Filming", label: "Filming", color: "bg-warning/20" },
  { id: "Posted", label: "Posted", color: "bg-success/20" },
];

export default function Ideas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newIdea, setNewIdea] = useState({ 
    title: "", 
    category: "",
    difficulty: "Medium" as IdeaDifficulty
  });

  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    try {
      const data = await getIdeas();
      setIdeas(data);
    } catch (error) {
      console.error("Error loading ideas:", error);
      toast.error("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }

  const handleAddIdea = async () => {
    if (!newIdea.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const idea = await createIdea({
        title: newIdea.title,
        category: newIdea.category || "General",
        status: "New",
        difficulty: newIdea.difficulty,
        source: "Manual entry",
        source_type: "manual",
        platform: "YouTube",
        estimated_length: "10-15 min",
      });
      setIdeas(prev => [idea, ...prev]);
      setNewIdea({ title: "", category: "", difficulty: "Medium" });
      setIsAddDialogOpen(false);
      toast.success("Idea added!");
    } catch (error) {
      toast.error("Failed to add idea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIdea = async () => {
    if (!editingIdea) return;
    
    setSubmitting(true);
    try {
      const updated = await updateIdea(editingIdea.id, {
        title: editingIdea.title,
        category: editingIdea.category,
      });
      setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i));
      setEditingIdea(null);
      toast.success("Idea updated!");
    } catch (error) {
      toast.error("Failed to update idea");
    } finally {
      setSubmitting(false);
    }
  };

  const moveToNextStage = async (idea: Idea) => {
    const currentIndex = COLUMNS.findIndex(c => c.id === idea.status);
    if (currentIndex < COLUMNS.length - 1) {
      const newStatus = COLUMNS[currentIndex + 1].id;
      try {
        const updated = await updateIdea(idea.id, { status: newStatus });
        setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i));
        toast.success(`Moved to ${COLUMNS[currentIndex + 1].label}`);
      } catch (error) {
        toast.error("Failed to move idea");
      }
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteIdea(id);
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast.success("Idea deleted");
    } catch (error) {
      toast.error("Failed to delete idea");
    }
  };

  const getIdeasByStatus = (status: IdeaStatus) => 
    ideas.filter(idea => idea.status === status);

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "Easy": return "bg-success/20 text-success";
      case "Medium": return "bg-warning/20 text-warning";
      case "Hard": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[400px]" />
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
            <h1 className="text-2xl font-bold tracking-tight">Ideas Board</h1>
            <p className="text-sm text-muted-foreground">Organize and track your video ideas</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Video idea title"
                    value={newIdea.title}
                    onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="e.g., Tutorial, Vlog, Review"
                    value={newIdea.category}
                    onChange={e => setNewIdea({ ...newIdea, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select 
                    value={newIdea.difficulty} 
                    onValueChange={(v: IdeaDifficulty) => setNewIdea({ ...newIdea, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddIdea} className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Idea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium mb-1">No ideas yet</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-4">Start capturing your video ideas</p>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Your First Idea
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(column => (
              <div key={column.id} className="space-y-3">
                <div className={`rounded-lg p-3 ${column.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{column.label}</h3>
                    <Badge variant="secondary">
                      {getIdeasByStatus(column.id).length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {getIdeasByStatus(column.id).map(idea => (
                    <Card key={idea.id} className="group border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2">{idea.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingIdea(idea)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {column.id !== "Posted" && (
                                <DropdownMenuItem onClick={() => moveToNextStage(idea)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Move to Next Stage
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                            {idea.category || "General"}
                          </Badge>
                          <Badge className={`text-[10px] px-2 py-0 h-5 ${getDifficultyColor(idea.difficulty)}`}>
                            {idea.difficulty || "Medium"}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-2">
                          {idea.platform || "YouTube"} • {idea.estimated_length || "TBD"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingIdea} onOpenChange={() => setEditingIdea(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Idea</DialogTitle>
            </DialogHeader>
            {editingIdea && (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editingIdea.title}
                    onChange={e => setEditingIdea({ ...editingIdea, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editingIdea.category || ""}
                    onChange={e => setEditingIdea({ ...editingIdea, category: e.target.value })}
                  />
                </div>
                <Button onClick={handleUpdateIdea} className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
