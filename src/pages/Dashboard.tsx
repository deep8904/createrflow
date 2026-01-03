import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { getVideos, Video } from '@/lib/api/videos';
import { getDrafts } from '@/lib/api/drafts';
import { getYouTubeIntegration, syncYouTubeVideos, Integration } from '@/lib/api/integrations';
import { Scissors, MessageSquare, Handshake, Youtube, RefreshCw, Eye, ThumbsUp, Video as VideoIcon, FileText, Lightbulb, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [draftsCount, setDraftsCount] = useState(0);
  const [integration, setIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [videosData, draftsData, integrationData] = await Promise.all([
          getVideos(),
          getDrafts(),
          getYouTubeIntegration(),
        ]);
        setVideos(videosData);
        setDraftsCount(draftsData.length);
        setIntegration(integrationData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncYouTubeVideos();
      let message = `Synced ${result.videosCount} videos and ${result.commentsCount} comments`;
      if (result.removedCount && result.removedCount > 0) {
        message += ` — ${result.removedCount} video${result.removedCount > 1 ? 's' : ''} marked as removed`;
      }
      toast.success(message);
      // Refresh data
      const [videosData, integrationData] = await Promise.all([
        getVideos(),
        getYouTubeIntegration(),
      ]);
      setVideos(videosData);
      setIntegration(integrationData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync YouTube');
    } finally {
      setSyncing(false);
    }
  };

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comments_count || 0), 0);
  const thisMonthVideos = videos.filter(v => {
    if (!v.published_at) return false;
    const publishDate = new Date(v.published_at);
    const now = new Date();
    return publishDate.getMonth() === now.getMonth() && publishDate.getFullYear() === now.getFullYear();
  }).length;

  const kpis = [
    { label: 'Videos this month', value: thisMonthVideos.toString(), icon: VideoIcon, change: `${thisMonthVideos > 0 ? '+' : ''}${thisMonthVideos}` },
    { label: 'Total views', value: totalViews >= 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : totalViews >= 1000 ? `${(totalViews / 1000).toFixed(0)}K` : totalViews.toString(), icon: Eye, change: '+' },
    { label: 'Comments', value: totalComments.toString(), icon: MessageSquare, change: '+' },
    { label: 'Drafts generated', value: draftsCount.toString(), icon: FileText, change: `+${draftsCount}` },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.user_metadata?.name?.split(' ')[0] || 'Creator'}!</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening with your content.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start border-border/50 hover:border-primary/40 hover:shadow-sm transition-all">
            <Link to="/app/repurpose">
              <Scissors className="h-4 w-4 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Generate Repurpose Pack</p>
                <p className="text-[11px] text-muted-foreground">Turn a video into content</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start border-border/50 hover:border-primary/40 hover:shadow-sm transition-all">
            <Link to="/app/ideas">
              <Lightbulb className="h-4 w-4 mr-3 text-warning" />
              <div className="text-left">
                <p className="font-medium text-sm">Scan Comments for Ideas</p>
                <p className="text-[11px] text-muted-foreground">Find content opportunities</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start border-border/50 hover:border-primary/40 hover:shadow-sm transition-all">
            <Link to="/app/deals">
              <Handshake className="h-4 w-4 mr-3 text-success" />
              <div className="text-left">
                <p className="font-medium text-sm">Create Brand Reply</p>
                <p className="text-[11px] text-muted-foreground">Respond to partnerships</p>
              </div>
            </Link>
          </Button>
        </div>

        {/* YouTube Status + KPIs */}
        <div className="grid lg:grid-cols-5 gap-3">
          <Card className="lg:col-span-1 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Youtube className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">YouTube</p>
                  <Badge variant={integration?.connected ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                    {integration?.connected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </div>
              {integration?.connected ? (
                <>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Last sync: {integration.last_sync_at ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true }) : 'Never'}
                  </p>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                    Sync now
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="default" className="w-full h-8 text-xs" asChild>
                  <Link to="/app/settings?tab=connections">
                    <LinkIcon className="h-3 w-3 mr-1.5" />
                    Connect
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {kpis.map((kpi, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 text-success">{kpi.change}</Badge>
                </div>
                <p className="text-xl font-bold leading-none">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Videos */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Videos</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7">View all</Button>
          </CardHeader>
          <CardContent>
            {!integration?.connected ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
                  <Youtube className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-sm font-medium mb-1">Connect YouTube</h3>
                <p className="text-xs text-muted-foreground max-w-[240px] mb-3">Connect your YouTube channel to see your videos and sync comments.</p>
                <Button size="sm" asChild>
                  <Link to="/app/settings?tab=connections">Connect YouTube</Link>
                </Button>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <VideoIcon className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-medium mb-1">No videos yet</h3>
                <p className="text-xs text-muted-foreground max-w-[240px] mb-3">Sync your YouTube channel to see your videos here.</p>
                <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  Sync now
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {videos.slice(0, 5).map((video) => (
                  <div key={video.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <img
                      src={video.thumbnail_url || '/placeholder.svg'}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Eye className="h-2.5 w-2.5" />
                          {(video.views || 0) >= 1000 ? `${((video.views || 0) / 1000).toFixed(0)}K` : video.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-2.5 w-2.5" />
                          {(video.likes || 0) >= 1000 ? `${((video.likes || 0) / 1000).toFixed(1)}K` : video.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {video.comments_count || 0}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                      <Link to="/app/repurpose">Repurpose</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {videos.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs">Your audience keeps asking about <span className="font-medium">AI tools</span></p>
                  <Button size="sm" className="h-7 text-xs" asChild>
                    <Link to="/app/ideas">Create content</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs">Repurpose your top performer: <span className="font-medium truncate max-w-[180px] inline-block align-bottom">{videos[0]?.title.substring(0, 25)}...</span></p>
                  <Button size="sm" className="h-7 text-xs" asChild>
                    <Link to="/app/repurpose">Repurpose</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">Insights will appear once you have synced videos.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
