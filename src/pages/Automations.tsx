import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getAutomations, createAutomation, updateAutomation, deleteAutomation, Automation } from "@/lib/api/automations";
import { useAuth } from "@/hooks/useAuth";
import { 
  Zap, 
  Plus, 
  Clock,
  MessageSquare,
  Upload,
  Bell,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const TRIGGER_OPTIONS = [
  { id: "new_video", label: "New video published", icon: Upload },
  { id: "new_comment", label: "New comment received", icon: MessageSquare },
  { id: "milestone", label: "Milestone reached", icon: Bell },
  { id: "schedule", label: "Scheduled time", icon: Clock },
];

const ACTION_OPTIONS = [
  { id: "generate_thread", label: "Generate X thread" },
  { id: "generate_linkedin", label: "Generate LinkedIn post" },
  { id: "send_notification", label: "Send notification" },
  { id: "create_draft", label: "Create content draft" },
  { id: "reply_comment", label: "Auto-reply to comment" },
];

export default function Automations() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    trigger: "",
    action: "",
  });

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    try {
      const data = await getAutomations();
      setAutomations(data);
    } catch (error) {
      console.error("Error loading automations:", error);
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  }

  const toggleAutomation = async (id: string, currentEnabled: boolean) => {
    try {
      const updated = await updateAutomation(id, { enabled: !currentEnabled });
      setAutomations(prev => prev.map(a => a.id === id ? updated : a));
      toast.success(currentEnabled ? "Automation paused" : "Automation enabled");
    } catch (error) {
      toast.error("Failed to update automation");
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    try {
      await deleteAutomation(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
      toast.success("Automation deleted");
    } catch (error) {
      toast.error("Failed to delete automation");
    }
  };

  const handleCreate = async () => {
    if (!newAutomation.name || !newAutomation.trigger || !newAutomation.action) {
      toast.error("Please fill in all fields");
      return;
    }

    const trigger = TRIGGER_OPTIONS.find(t => t.id === newAutomation.trigger);
    const action = ACTION_OPTIONS.find(a => a.id === newAutomation.action);

    setSubmitting(true);
    try {
      const automation = await createAutomation({
        name: newAutomation.name,
        description: `${trigger?.label} → ${action?.label}`,
        trigger_type: newAutomation.trigger,
        action_type: newAutomation.action,
        enabled: true,
        frequency: "on-event",
      });
      setAutomations(prev => [automation, ...prev]);
      setNewAutomation({ name: "", trigger: "", action: "" });
      setIsCreateOpen(false);
      toast.success("Automation created!");
    } catch (error) {
      toast.error("Failed to create automation");
    } finally {
      setSubmitting(false);
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    if (triggerType.includes("video") || triggerType === "new_video") return Upload;
    if (triggerType.includes("comment") || triggerType === "new_comment") return MessageSquare;
    if (triggerType.includes("milestone") || triggerType === "milestone") return Bell;
    if (triggerType.includes("schedule") || triggerType === "schedule") return Clock;
    return Zap;
  };

  const getTriggerLabel = (triggerType: string) => {
    const trigger = TRIGGER_OPTIONS.find(t => t.id === triggerType);
    return trigger?.label || triggerType;
  };

  const getActionLabel = (actionType: string) => {
    const action = ACTION_OPTIONS.find(a => a.id === actionType);
    return action?.label || actionType;
  };

  const getLastRunStatus = (runs: Automation["runs"]) => {
    if (!runs || runs.length === 0) return null;
    const lastRun = runs[0];
    if (lastRun.status === "success") return <CheckCircle className="h-4 w-4 text-success" />;
    if (lastRun.status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    return null;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
            <p className="text-sm text-muted-foreground">Set up workflows to automate content tasks</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Automation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Automation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="My automation"
                    value={newAutomation.name}
                    onChange={e => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">When this happens...</label>
                  <Select 
                    value={newAutomation.trigger}
                    onValueChange={v => setNewAutomation({ ...newAutomation, trigger: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Do this...</label>
                  <Select 
                    value={newAutomation.action}
                    onValueChange={v => setNewAutomation({ ...newAutomation, action: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  Create Automation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium mb-1">No automations yet</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-4">Create your first automation to save time</p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Create Automation
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {automations.map(automation => {
              const TriggerIcon = getTriggerIcon(automation.trigger_type);
              
              return (
                <Card key={automation.id} className={automation.enabled ? "" : "opacity-60"}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${automation.enabled ? "bg-primary/10" : "bg-muted"}`}>
                          <TriggerIcon className={`h-5 w-5 ${automation.enabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{automation.name}</CardTitle>
                          <CardDescription className="text-xs flex items-center gap-2">
                            {automation.runs?.length || 0} runs
                            {automation.runs?.[0]?.created_at && ` • Last: ${new Date(automation.runs[0].created_at).toLocaleDateString()}`}
                            {getLastRunStatus(automation.runs)}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={automation.enabled ?? true}
                        onCheckedChange={() => toggleAutomation(automation.id, automation.enabled ?? true)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">When:</span>
                        <span>{getTriggerLabel(automation.trigger_type)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">Then:</span>
                        <span>{getActionLabel(automation.action_type)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteAutomation(automation.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Suggested Automations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Automations</CardTitle>
            <CardDescription>Popular workflows to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { trigger: "New video", action: "Create X thread", icon: Upload },
                { trigger: "New comment", action: "Send notification", icon: MessageSquare },
                { trigger: "Weekly", action: "Generate newsletter", icon: Clock },
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setNewAutomation({ 
                      name: `${suggestion.trigger} → ${suggestion.action}`,
                      trigger: "",
                      action: ""
                    });
                    setIsCreateOpen(true);
                  }}
                  className="p-4 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <suggestion.icon className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{suggestion.trigger}</p>
                  <p className="text-xs text-muted-foreground">→ {suggestion.action}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
