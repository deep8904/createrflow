import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, updateProfile } from "@/lib/api/profiles";
import { getYouTubeIntegration, startYouTubeOAuth, disconnectYouTube, syncYouTubeVideos, getGmailIntegration, startGmailOAuth, disconnectGmail, syncGmailEmails, Integration } from "@/lib/api/integrations";
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  CreditCard,
  Youtube,
  Twitter,
  Linkedin,
  Instagram,
  Link,
  Unlink,
  Save,
  Camera,
  RefreshCw,
  Loader2,
  Mail
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [youtubeIntegration, setYoutubeIntegration] = useState<Integration | null>(null);
  const [gmailIntegration, setGmailIntegration] = useState<Integration | null>(null);
  const [connectingYoutube, setConnectingYoutube] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [syncingYoutube, setSyncingYoutube] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [disconnectingYoutube, setDisconnectingYoutube] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
  });

  const [notifications, setNotifications] = useState({
    emailNewDeals: true,
    emailComments: false,
    emailWeeklyDigest: true,
    pushNewDeals: true,
    pushMilestones: true,
  });

  const [contentStyle, setContentStyle] = useState({
    tone: "",
    wordsToUse: "",
    wordsToAvoid: "",
    aboutMe: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const [profileData, integration, gmailInt] = await Promise.all([
          getProfile(user.id),
          getYouTubeIntegration(),
          getGmailIntegration(),
        ]);

        if (profileData) {
          setProfile({
            name: profileData.name || "",
            email: profileData.email || "",
            bio: "",
            website: "",
          });
          if (profileData.personal_style) {
            const style = profileData.personal_style as any;
            setContentStyle({
              tone: style.tone || "",
              wordsToUse: (style.wordsToUse || []).join(", "),
              wordsToAvoid: (style.wordsToAvoid || []).join(", "),
              aboutMe: style.aboutMe || "",
            });
          }
        }

        setYoutubeIntegration(integration);
        setGmailIntegration(gmailInt);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Listen for OAuth success messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'youtube-oauth-success') {
        toast.success("YouTube connected successfully!");
        getYouTubeIntegration().then(setYoutubeIntegration);
      } else if (event.data.type === 'youtube-oauth-error') {
        toast.error(`YouTube connection failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check URL params for connection status
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      toast.success("YouTube connected successfully!");
      getYouTubeIntegration().then(setYoutubeIntegration);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('gmail_connected') === 'true') {
      toast.success("Gmail connected successfully!");
      getGmailIntegration().then(setGmailIntegration);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('gmail_error')) {
      toast.error(`Gmail connection failed: ${params.get('gmail_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, { name: profile.name, email: profile.email });
      toast.success("Profile saved!");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved!");
  };

  const handleSaveContentStyle = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, {
        personal_style: {
          tone: contentStyle.tone,
          wordsToUse: contentStyle.wordsToUse.split(",").map(w => w.trim()).filter(Boolean),
          wordsToAvoid: contentStyle.wordsToAvoid.split(",").map(w => w.trim()).filter(Boolean),
          aboutMe: contentStyle.aboutMe,
          exampleCaptions: [],
        },
      });
      toast.success("Content style saved!");
    } catch (error) {
      toast.error("Failed to save content style");
    }
  };

  const handleConnectYoutube = async () => {
    try {
      setConnectingYoutube(true);
      const authUrl = await startYouTubeOAuth();
      
      // If we're embedded (e.g., preview environment), avoid window navigation issues
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        // In iframe context, navigate directly instead of popup
        // This avoids the blocked popup issue
        window.open(authUrl, '_blank');
      } else {
        // Open OAuth in popup for normal contexts
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        window.open(
          authUrl,
          'youtube-oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start YouTube connection");
    } finally {
      setConnectingYoutube(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    try {
      setDisconnectingYoutube(true);
      await disconnectYouTube(true); // Delete videos and comments
      setYoutubeIntegration(null);
      toast.success("YouTube disconnected and data cleared");
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect YouTube");
    } finally {
      setDisconnectingYoutube(false);
    }
  };

  const handleSyncYoutube = async () => {
    try {
      setSyncingYoutube(true);
      const result = await syncYouTubeVideos();
      toast.success(`Synced ${result.videosCount} videos and ${result.commentsCount} comments`);
      // Refresh integration data
      const integration = await getYouTubeIntegration();
      setYoutubeIntegration(integration);
    } catch (error: any) {
      toast.error(error.message || "Failed to sync YouTube data");
    } finally {
      setSyncingYoutube(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setConnectingGmail(true);
      const authUrl = await startGmailOAuth();
      window.open(authUrl, '_blank');
    } catch (error: any) {
      toast.error(error.message || "Failed to start Gmail connection");
    } finally {
      setConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      setDisconnectingGmail(true);
      await disconnectGmail(true); // Delete deals and messages
      setGmailIntegration(null);
      toast.success("Gmail disconnected and deals cleared");
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect Gmail");
    } finally {
      setDisconnectingGmail(false);
    }
  };

  const handleSyncGmail = async () => {
    let timeoutId: number | undefined;
    try {
      setSyncingGmail(true);

      // If sync runs long (first-time imports), stop the spinner and inform the user.
      timeoutId = window.setTimeout(() => {
        setSyncingGmail(false);
        toast.message("Gmail sync is still running", {
          description: "This can take a bit on first import. Check Deals in a moment and run Sync again if needed.",
        });
      }, 20000);

      const result = await syncGmailEmails();
      toast.success(result.message);
      const integration = await getGmailIntegration();
      setGmailIntegration(integration);
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync Gmail");
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      setSyncingGmail(false);
    }
  };

  const connections = [
    { 
      id: "gmail", 
      name: "Gmail (Deals Inbox)", 
      icon: Mail, 
      connected: gmailIntegration?.connected,
      channelName: gmailIntegration?.channel_name,
      lastSync: gmailIntegration?.last_sync_at,
      color: "text-red-400",
      description: "Import brand deal emails automatically"
    },
    { 
      id: "youtube", 
      name: "YouTube", 
      icon: Youtube, 
      connected: youtubeIntegration?.connected,
      channelName: youtubeIntegration?.channel_name,
      subscribers: youtubeIntegration?.subscribers,
      lastSync: youtubeIntegration?.last_sync_at,
      color: "text-red-500"
    },
    { 
      id: "twitter", 
      name: "X (Twitter)", 
      icon: Twitter, 
      connected: false,
      color: "text-foreground"
    },
    { 
      id: "linkedin", 
      name: "LinkedIn", 
      icon: Linkedin, 
      connected: false,
      color: "text-blue-600"
    },
    { 
      id: "instagram", 
      name: "Instagram",
      icon: Instagram, 
      connected: false,
      color: "text-pink-500"
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-4xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Link className="h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Palette className="h-4 w-4" />
              Content Style
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Avatar
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={profile.website}
                    onChange={e => setProfile({ ...profile, website: e.target.value })}
                  />
                </div>

                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Manage your social platform connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.map(connection => (
                    <div 
                      key={connection.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <connection.icon className={`h-6 w-6 ${connection.color}`} />
                        <div>
                          <p className="font-medium">{connection.name}</p>
                          {connection.id === 'youtube' && connection.connected ? (
                            <div className="text-sm text-muted-foreground">
                              <span>{connection.channelName}</span>
                              {connection.subscribers && (
                                <span className="ml-2">• {connection.subscribers.toLocaleString()} subscribers</span>
                              )}
                              {connection.lastSync && (
                                <span className="ml-2">• Last sync: {new Date(connection.lastSync).toLocaleDateString()}</span>
                              )}
                            </div>
                          ) : connection.id === 'gmail' && connection.connected ? (
                            <div className="text-sm text-muted-foreground">
                              <span>{connection.channelName}</span>
                              {connection.lastSync && (
                                <span className="ml-2">• Last sync: {new Date(connection.lastSync).toLocaleDateString()}</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {connection.connected ? "Connected" : (connection as any).description || "Not connected"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {connection.id === 'gmail' && connection.connected && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSyncGmail}
                            disabled={syncingGmail}
                          >
                            {syncingGmail ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">Sync</span>
                          </Button>
                        )}
                        {connection.id === 'youtube' && connection.connected && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSyncYoutube}
                            disabled={syncingYoutube}
                          >
                            {syncingYoutube ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">Sync</span>
                          </Button>
                        )}
                        {connection.id === 'gmail' ? (
                          <Button 
                            variant={connection.connected ? "outline" : "default"}
                            size="sm"
                            onClick={connection.connected ? handleDisconnectGmail : handleConnectGmail}
                            disabled={connectingGmail || disconnectingGmail}
                          >
                            {(connectingGmail || disconnectingGmail) ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : connection.connected ? (
                              <Unlink className="h-4 w-4 mr-2" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            {connection.connected ? "Disconnect" : "Connect Gmail"}
                          </Button>
                        ) : connection.id === 'youtube' ? (
                          <Button 
                            variant={connection.connected ? "outline" : "default"}
                            size="sm"
                            onClick={connection.connected ? handleDisconnectYoutube : handleConnectYoutube}
                            disabled={connectingYoutube || disconnectingYoutube}
                          >
                            {(connectingYoutube || disconnectingYoutube) ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : connection.connected ? (
                              <Unlink className="h-4 w-4 mr-2" />
                            ) : (
                              <Link className="h-4 w-4 mr-2" />
                            )}
                            {connection.connected ? "Disconnect" : "Connect"}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            disabled
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Style</CardTitle>
                <CardDescription>Customize how AI generates content for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Tone of Voice</label>
                  <Input
                    value={contentStyle.tone}
                    onChange={e => setContentStyle({ ...contentStyle, tone: e.target.value })}
                    placeholder="e.g., Professional, Casual, Witty"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Words/Phrases to Use</label>
                  <Textarea
                    value={contentStyle.wordsToUse}
                    onChange={e => setContentStyle({ ...contentStyle, wordsToUse: e.target.value })}
                    placeholder="Comma-separated list of words you like to use"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Words/Phrases to Avoid</label>
                  <Textarea
                    value={contentStyle.wordsToAvoid}
                    onChange={e => setContentStyle({ ...contentStyle, wordsToAvoid: e.target.value })}
                    placeholder="Comma-separated list of words to avoid"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">About Me (for AI context)</label>
                  <Textarea
                    value={contentStyle.aboutMe}
                    onChange={e => setContentStyle({ ...contentStyle, aboutMe: e.target.value })}
                    placeholder="Brief description about yourself and your content"
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveContentStyle}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Content Style
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New deal offers</p>
                        <p className="text-sm text-muted-foreground">Get notified when brands reach out</p>
                      </div>
                      <Switch
                        checked={notifications.emailNewDeals}
                        onCheckedChange={v => setNotifications({ ...notifications, emailNewDeals: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Important comments</p>
                        <p className="text-sm text-muted-foreground">Highlights from your video comments</p>
                      </div>
                      <Switch
                        checked={notifications.emailComments}
                        onCheckedChange={v => setNotifications({ ...notifications, emailComments: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly digest</p>
                        <p className="text-sm text-muted-foreground">Summary of your channel performance</p>
                      </div>
                      <Switch
                        checked={notifications.emailWeeklyDigest}
                        onCheckedChange={v => setNotifications({ ...notifications, emailWeeklyDigest: v })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Push Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New deal offers</p>
                        <p className="text-sm text-muted-foreground">Instant notification for new deals</p>
                      </div>
                      <Switch
                        checked={notifications.pushNewDeals}
                        onCheckedChange={v => setNotifications({ ...notifications, pushNewDeals: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Milestones</p>
                        <p className="text-sm text-muted-foreground">Celebrate your achievements</p>
                      </div>
                      <Switch
                        checked={notifications.pushMilestones}
                        onCheckedChange={v => setNotifications({ ...notifications, pushMilestones: v })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage your subscription and payments</CardDescription>
              </CardHeader>
              <CardContent className="py-12">
                <div className="text-center max-w-md mx-auto">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Billing not set up</h3>
                  <p className="text-muted-foreground mb-6">
                    Billing and subscriptions aren't enabled yet. Connect Stripe to enable paid plans and manage payments.
                  </p>
                  <Button disabled>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Enable Billing (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
