import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";
import { Video } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Sparkles, 
  FileText, 
  Twitter, 
  Linkedin, 
  Instagram,
  Copy,
  Download,
  Youtube,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Captions,
  AudioLines,
  Clock,
  Scissors
} from "lucide-react";
import { toast } from "sonner";

const OUTPUT_OPTIONS = [
  { id: "thread", label: "X Thread", icon: Twitter },
  { id: "linkedin", label: "LinkedIn Post", icon: Linkedin },
  { id: "instagram", label: "Instagram Caption", icon: Instagram },
  { id: "shorts", label: "YouTube Shorts", icon: Youtube },
];

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface ClipSuggestion {
  start: string;
  end: string;
  hook: string;
}

export default function Repurpose() {
  const { videos, isLoading, refreshDrafts } = useApp();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["thread", "linkedin", "instagram", "shorts"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("thread");
  const [transcriptSource, setTranscriptSource] = useState<string | null>(null);
  const [clipSuggestions, setClipSuggestions] = useState<ClipSuggestion[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'fetch', label: 'Fetching captions', status: 'pending' },
    { id: 'analyze', label: 'Analyzing content', status: 'pending' },
    { id: 'generate', label: 'Generating outputs', status: 'pending' },
    { id: 'save', label: 'Saving drafts', status: 'pending' },
  ]);

  const handleVideoSelect = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    setSelectedVideo(video || null);
    setGeneratedContent({});
    setTranscriptSource(null);
    setClipSuggestions([]);
    setAnalysisProgress(0);
    setAnalysisSteps(steps => steps.map(s => ({ ...s, status: 'pending' })));
  };

  const toggleOutput = (outputId: string) => {
    setSelectedOutputs(prev => 
      prev.includes(outputId) 
        ? prev.filter(id => id !== outputId)
        : [...prev, outputId]
    );
  };

  const updateStepStatus = (stepId: string, status: AnalysisStep['status']) => {
    setAnalysisSteps(steps => 
      steps.map(s => s.id === stepId ? { ...s, status } : s)
    );
  };

  const handleAnalyze = async () => {
    if (!selectedVideo || selectedOutputs.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setGeneratedContent({});
    setAnalysisSteps(steps => steps.map(s => ({ ...s, status: 'pending' })));

    try {
      // Step 1: Fetching captions
      updateStepStatus('fetch', 'in_progress');
      setAnalysisProgress(10);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      // Step 2: Analyzing
      updateStepStatus('fetch', 'completed');
      updateStepStatus('analyze', 'in_progress');
      setAnalysisProgress(30);

      const response = await supabase.functions.invoke('analyze-video', {
        body: { 
          videoId: selectedVideo.id,
          outputs: selectedOutputs
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Analysis failed');
      }

      const data = response.data;

      // Step 3: Generating
      updateStepStatus('analyze', 'completed');
      updateStepStatus('generate', 'in_progress');
      setAnalysisProgress(70);

      // Process generated content
      const content: Record<string, string> = {};
      
      if (data.generatedContent.thread) {
        content.thread = data.generatedContent.thread;
      }
      if (data.generatedContent.linkedin) {
        content.linkedin = data.generatedContent.linkedin;
      }
      if (data.generatedContent.instagram) {
        content.instagram = data.generatedContent.instagram;
      }
      if (data.generatedContent.shorts) {
        const shorts = data.generatedContent.shorts;
        content.shorts = typeof shorts === 'string' 
          ? shorts 
          : `Title: ${shorts.title}\n\nDescription: ${shorts.description}`;
      }

      setGeneratedContent(content);
      setTranscriptSource(data.transcriptSource);
      setClipSuggestions(data.clips || []);

      // Step 4: Saving
      updateStepStatus('generate', 'completed');
      updateStepStatus('save', 'in_progress');
      setAnalysisProgress(90);

      // Refresh drafts to show newly created ones
      await refreshDrafts();

      updateStepStatus('save', 'completed');
      setAnalysisProgress(100);

      // Set active tab to first available content
      const firstKey = Object.keys(content)[0];
      if (firstKey) {
        setActiveTab(firstKey);
      }

      toast.success(`Generated ${Object.keys(content).length} content pieces and saved ${data.draftsCreated} drafts!`);

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze video';
      toast.error(errorMessage);
      
      // Mark current step as error
      setAnalysisSteps(steps => 
        steps.map(s => s.status === 'in_progress' ? { ...s, status: 'error' } : s)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Repurpose Studio</h1>
          <p className="text-sm text-muted-foreground">Transform your videos into multi-platform content</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Source Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Select Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {videos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No videos available</p>
                    <p className="text-sm mb-4">Connect your YouTube channel and sync videos first</p>
                    <Button asChild>
                      <Link to="/app/settings?tab=connections">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Connect YouTube
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Select onValueChange={handleVideoSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a video to repurpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos.map(video => (
                        <SelectItem key={video.id} value={video.id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{video.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(video.views || 0).toLocaleString()} views
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedVideo && (
                  <div className="rounded-lg overflow-hidden border bg-muted/30">
                    <img 
                      src={selectedVideo.thumbnail || '/placeholder.svg'} 
                      alt={selectedVideo.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium truncate">{selectedVideo.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(selectedVideo.views || 0).toLocaleString()} views • {selectedVideo.publishedAt ? new Date(selectedVideo.publishedAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {OUTPUT_OPTIONS.map(option => (
                    <label 
                      key={option.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox 
                        checked={selectedOutputs.includes(option.id)}
                        onCheckedChange={() => toggleOutput(option.id)}
                      />
                      <option.icon className="h-5 w-5 text-muted-foreground" />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>

                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  disabled={!selectedVideo || selectedOutputs.length === 0 || isAnalyzing}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze & Generate Pack
                    </>
                  )}
                </Button>

                {/* Progress Display */}
                {isAnalyzing && (
                  <div className="mt-4 space-y-3">
                    <Progress value={analysisProgress} className="h-2" />
                    <div className="space-y-2">
                      {analysisSteps.map(step => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          {step.status === 'completed' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {step.status === 'in_progress' && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {step.status === 'pending' && (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          {step.status === 'error' && (
                            <div className="h-4 w-4 rounded-full bg-destructive" />
                          )}
                          <span className={step.status === 'completed' ? 'text-muted-foreground' : ''}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Generated Content */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generated Content
                </CardTitle>
                {transcriptSource && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {transcriptSource === 'youtube_captions' ? (
                      <>
                        <Captions className="h-3 w-3" />
                        YouTube Captions
                      </>
                    ) : transcriptSource === 'whisper_transcription' ? (
                      <>
                        <AudioLines className="h-3 w-3" />
                        Transcribed Audio
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3" />
                        Metadata Only
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(generatedContent).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No content generated yet</p>
                  <p className="text-sm">Select a video and output formats, then click Analyze & Generate Pack</p>
                  <p className="text-xs mt-4 text-muted-foreground/70">
                    AI will analyze your video transcript and create tailored content for each platform
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full flex-wrap h-auto gap-1">
                      {Object.keys(generatedContent).map(key => {
                        const option = OUTPUT_OPTIONS.find(o => o.id === key);
                        return (
                          <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                            {option && <option.icon className="h-4 w-4" />}
                            {option?.label}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {Object.entries(generatedContent).map(([key, content]) => (
                      <TabsContent key={key} value={key} className="mt-4">
                        <div className="space-y-4">
                          <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                            {content}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(content)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/app/drafts">
                                <Download className="h-4 w-4 mr-2" />
                                View in Drafts
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Clip Suggestions */}
                  {clipSuggestions.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Scissors className="h-4 w-4" />
                        Suggested Clips
                      </h4>
                      <div className="space-y-2">
                        {clipSuggestions.map((clip, index) => (
                          <div key={index} className="p-3 rounded-lg bg-muted/30 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              <span>{clip.start} - {clip.end}</span>
                            </div>
                            <p>{clip.hook}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
