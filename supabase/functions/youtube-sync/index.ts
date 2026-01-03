import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple decryption using XOR with key
function decrypt(encryptedText: string, key: string): string {
  const decoded = atob(encryptedText);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Simple encryption using XOR with key
function encrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'youtube')
      .single();

    if (integrationError || !integration) {
      throw new Error('YouTube not connected');
    }

    if (!integration.refresh_token_encrypted) {
      throw new Error('No refresh token available');
    }

    // Decrypt refresh token
    const refreshToken = decrypt(integration.refresh_token_encrypted, encryptionKey);

    // Check if access token needs refresh
    let accessToken: string;
    const tokenExpiry = new Date(integration.token_expiry);
    
    if (tokenExpiry < new Date()) {
      console.log('Access token expired, refreshing...');
      const newTokens = await refreshAccessToken(refreshToken, clientId, clientSecret);
      accessToken = newTokens.access_token;

      // Update tokens in database
      const encryptedAccessToken = encrypt(accessToken, encryptionKey);
      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      await supabase
        .from('integrations')
        .update({
          access_token_encrypted: encryptedAccessToken,
          token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
    } else {
      accessToken = decrypt(integration.access_token_encrypted, encryptionKey);
    }

    // Fetch ALL videos from YouTube (paginate to get complete list)
    console.log('Fetching videos from YouTube...');
    const allYouTubeVideoIds: string[] = [];
    let nextPageToken: string | undefined;
    
    do {
      const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${integration.channel_id}&type=video&order=date&maxResults=50${pageParam}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const videosData = await videosResponse.json();
      if (!videosResponse.ok) {
        console.error('Videos fetch failed:', videosData);
        throw new Error('Failed to fetch videos');
      }

      const pageVideoIds = videosData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
      allYouTubeVideoIds.push(...pageVideoIds);
      nextPageToken = videosData.nextPageToken;
    } while (nextPageToken && allYouTubeVideoIds.length < 500); // Limit to 500 videos max

    console.log(`Found ${allYouTubeVideoIds.length} videos on YouTube`);

    // Get all existing videos from DB for this user
    const { data: existingVideos } = await supabase
      .from('videos')
      .select('id, youtube_video_id, status')
      .eq('user_id', user.id);

    const existingVideoMap = new Map(
      (existingVideos || []).map(v => [v.youtube_video_id, v])
    );

    // Find videos that were removed from YouTube
    let removedCount = 0;
    let reactivatedCount = 0;

    for (const [youtubeVideoId, dbVideo] of existingVideoMap) {
      const existsOnYouTube = allYouTubeVideoIds.includes(youtubeVideoId);
      
      if (!existsOnYouTube && dbVideo.status !== 'removed') {
        // Video was deleted/unlisted on YouTube - mark as removed
        console.log(`Marking video as removed: ${youtubeVideoId}`);
        await supabase
          .from('videos')
          .update({
            status: 'removed',
            removed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbVideo.id);
        removedCount++;
      } else if (existsOnYouTube && dbVideo.status === 'removed') {
        // Video reappeared on YouTube - reactivate it
        console.log(`Reactivating video: ${youtubeVideoId}`);
        await supabase
          .from('videos')
          .update({
            status: 'active',
            removed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbVideo.id);
        reactivatedCount++;
      }
    }

    // If no videos on YouTube, return early
    if (allYouTubeVideoIds.length === 0) {
      // Update last sync time
      await supabase
        .from('integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return new Response(JSON.stringify({ 
        message: 'No videos found on YouTube',
        videosCount: 0,
        commentsCount: 0,
        removedCount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch video details with statistics (in batches of 50)
    const allVideoDetails: any[] = [];
    for (let i = 0; i < allYouTubeVideoIds.length; i += 50) {
      const batchIds = allYouTubeVideoIds.slice(i, i + 50);
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batchIds.join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const detailsData = await detailsResponse.json();
      if (detailsResponse.ok && detailsData.items) {
        allVideoDetails.push(...detailsData.items);
      }
    }

    // Upsert videos with status = 'active'
    let videosUpserted = 0;
    for (const video of allVideoDetails) {
      const { error: videoError } = await supabase
        .from('videos')
        .upsert({
          user_id: user.id,
          youtube_video_id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
          published_at: video.snippet.publishedAt,
          views: parseInt(video.statistics.viewCount) || 0,
          likes: parseInt(video.statistics.likeCount) || 0,
          comments_count: parseInt(video.statistics.commentCount) || 0,
          duration: video.contentDetails.duration,
          tags: video.snippet.tags || [],
          status: 'active',
          removed_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,youtube_video_id' });

      if (videoError) {
        console.error('Video upsert error:', videoError);
      } else {
        videosUpserted++;
      }
    }

    // Fetch comments for each video (limit to first 10 videos)
    let commentsUpserted = 0;
    for (const videoId of allYouTubeVideoIds.slice(0, 10)) {
      try {
        const commentsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!commentsResponse.ok) {
          console.log(`Comments disabled or unavailable for video ${videoId}`);
          continue;
        }

        const commentsData = await commentsResponse.json();

        // Get the video's internal ID
        const { data: videoRecord } = await supabase
          .from('videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('youtube_video_id', videoId)
          .single();

        for (const thread of commentsData.items || []) {
          const comment = thread.snippet.topLevelComment.snippet;
          const { error: commentError } = await supabase
            .from('comments')
            .upsert({
              user_id: user.id,
              video_id: videoRecord?.id,
              youtube_video_id: videoId,
              youtube_comment_id: thread.id,
              author: comment.authorDisplayName,
              author_avatar: comment.authorProfileImageUrl,
              text: comment.textDisplay,
              published_at: comment.publishedAt,
              like_count: comment.likeCount || 0,
              reply_count: thread.snippet.totalReplyCount || 0,
            }, { onConflict: 'user_id,youtube_comment_id' });

          if (!commentError) {
            commentsUpserted++;
          }
        }
      } catch (e) {
        console.error(`Error fetching comments for video ${videoId}:`, e);
      }
    }

    // Update last sync time
    await supabase
      .from('integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    console.log(`Sync complete: ${videosUpserted} videos, ${commentsUpserted} comments, ${removedCount} removed, ${reactivatedCount} reactivated`);

    return new Response(JSON.stringify({ 
      message: 'Sync completed',
      videosCount: videosUpserted,
      commentsCount: commentsUpserted,
      removedCount,
      reactivatedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-sync:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
