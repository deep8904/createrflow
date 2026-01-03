import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/contexts/AppContext";
import { getYouTubeIntegration, Integration } from "@/lib/api/integrations";
import { 
  Eye, 
  ThumbsUp,
  MessageSquare,
  Play,
  BarChart3,
  Link as LinkIcon
} from "lucide-react";

export default function Analytics() {
  const { isLoading, videos } = useApp();
  const [youtubeConnected, setYoutubeConnected] = useState<boolean | null>(null);

  useEffect(() => {
    getYouTubeIntegration().then(integration => {
      setYoutubeConnected(integration?.connected ?? false);
    });
  }, []);

  // Calculate real metrics from synced data
  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comments || 0), 0);
  const totalVideos = videos.length;

  // Get top videos sorted by views
  const topVideos = [...videos]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  if (youtubeConnected === false || (youtubeConnected === null && videos.length === 0)) {
    return (
      <AppLayout>
        <div className="p-6 space-y-5 max-w-5xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your channel performance</p>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium mb-1">Connect YouTube to view analytics</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-4">
              Link your channel and sync videos to see performance metrics
            </p>
            <Button size="sm" asChild>
              <Link to="/app/settings?tab=connections">
                <LinkIcon className="h-3.5 w-3.5 mr-2" />
                Connect YouTube
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance overview from your synced YouTube data</p>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="p-2 rounded-lg bg-primary/10">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{totalVideos}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Videos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="p-2 rounded-lg bg-info/10">
              <Eye className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{formatNumber(totalViews)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Views</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="p-2 rounded-lg bg-success/10">
              <ThumbsUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{formatNumber(totalLikes)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Likes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="p-2 rounded-lg bg-warning/10">
              <MessageSquare className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{formatNumber(totalComments)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Comments</p>
            </div>
          </div>
        </div>

        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
            <CardDescription>Your most viewed content</CardDescription>
          </CardHeader>
          <CardContent>
            {topVideos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos synced yet</p>
                <p className="text-sm">Sync your YouTube channel to see analytics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topVideos.map((video, i) => (
                  <div key={video.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-medium">
                      {i + 1}
                    </div>
                    <img
                      src={video.thumbnail || '/placeholder.svg'}
                      alt={video.title}
                      className="w-16 h-9 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(video.views || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {formatNumber(video.likes || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {video.comments || 0}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/app/repurpose">Repurpose</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Detailed Analytics Coming Soon</h4>
                <p className="text-sm text-muted-foreground">
                  We're working on bringing you more detailed analytics including watch time, 
                  subscriber growth, traffic sources, and engagement trends. Stay tuned!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
