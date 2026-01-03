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

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const { videoId, outputs } = await req.json();

    if (!videoId) {
      throw new Error('videoId is required');
    }

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

    // Get video from database
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !video) {
      throw new Error('Video not found');
    }

    console.log(`Analyzing video: ${video.title}`);

    // Get integration for YouTube API access
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'youtube')
      .single();

    if (integrationError || !integration) {
      throw new Error('YouTube not connected');
    }

    // Get or refresh access token
    const refreshToken = decrypt(integration.refresh_token_encrypted, encryptionKey);
    let accessToken: string;
    const tokenExpiry = new Date(integration.token_expiry);
    
    if (tokenExpiry < new Date()) {
      console.log('Access token expired, refreshing...');
      const newTokens = await refreshAccessToken(refreshToken, clientId, clientSecret);
      accessToken = newTokens.access_token;

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

    // Check for existing transcript
    let transcript: string | null = null;
    let transcriptSource = 'youtube_captions';
    let timestamps: any[] = [];

    const { data: existingTranscript } = await supabase
      .from('transcripts')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single();

    if (existingTranscript) {
      console.log('Using existing transcript');
      transcript = existingTranscript.content;
      transcriptSource = existingTranscript.source;
      timestamps = existingTranscript.timestamps || [];
    } else {
      // Try to fetch YouTube captions
      console.log('Fetching YouTube captions...');
      
      try {
        // List caption tracks
        const captionsListResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${video.youtube_video_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (captionsListResponse.ok) {
          const captionsData = await captionsListResponse.json();
          const captionTracks = captionsData.items || [];
          
          // Find English caption track (prefer manual over auto-generated)
          const englishTrack = captionTracks.find((t: any) => 
            t.snippet.language === 'en' && t.snippet.trackKind !== 'asr'
          ) || captionTracks.find((t: any) => 
            t.snippet.language === 'en'
          ) || captionTracks[0];

          if (englishTrack) {
            console.log(`Found caption track: ${englishTrack.id}`);
            
            // Download captions (SRT format)
            const captionDownloadResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/captions/${englishTrack.id}?tfmt=srt`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (captionDownloadResponse.ok) {
              const srtContent = await captionDownloadResponse.text();
              
              // Parse SRT to extract text and timestamps
              const srtLines = srtContent.split('\n\n');
              const parsedCaptions: { start: string; end: string; text: string }[] = [];
              let fullText = '';
              
              for (const block of srtLines) {
                const lines = block.trim().split('\n');
                if (lines.length >= 3) {
                  const timeLine = lines[1];
                  const textLines = lines.slice(2).join(' ');
                  const [start, end] = timeLine.split(' --> ');
                  
                  parsedCaptions.push({ start, end, text: textLines });
                  fullText += textLines + ' ';
                }
              }
              
              transcript = fullText.trim();
              timestamps = parsedCaptions;
              transcriptSource = 'youtube_captions';
              console.log(`Retrieved ${parsedCaptions.length} caption segments`);
            }
          }
        }
      } catch (captionError) {
        console.log('Caption fetch failed, will use video metadata:', captionError);
      }

      // If no captions available, use video description as fallback
      if (!transcript) {
        console.log('No captions available, using video metadata');
        transcript = `Video Title: ${video.title}\n\nVideo Description: ${video.description || 'No description available.'}`;
        transcriptSource = 'metadata_only';
      }

      // Store transcript
      await supabase
        .from('transcripts')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          youtube_video_id: video.youtube_video_id,
          content: transcript,
          source: transcriptSource,
          timestamps: timestamps,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,youtube_video_id' });
    }

    // Get top comments for context
    const { data: comments } = await supabase
      .from('comments')
      .select('text, like_count')
      .eq('video_id', videoId)
      .order('like_count', { ascending: false })
      .limit(10);

    const topComments = comments?.map(c => c.text).join('\n') || '';

    // Generate content using OpenAI
    console.log('Generating content with AI...');

    const selectedOutputs = outputs || ['thread', 'linkedin', 'instagram', 'shorts'];
    
    const systemPrompt = `You are an expert content repurposing specialist. You help creators transform their video content into engaging posts for different social media platforms.

Your outputs should be:
- Authentic and match the creator's voice from the original content
- Optimized for each platform's best practices
- Engaging and designed to drive engagement
- Include relevant hashtags where appropriate

IMPORTANT: Return your response as valid JSON with the following structure:
{
  "thread": "Full X/Twitter thread with numbered tweets separated by ---",
  "linkedin": "LinkedIn post with proper formatting",
  "instagram": "Instagram caption with emojis and hashtags",
  "shorts": { "title": "Shorts title", "description": "Shorts description" },
  "clips": [{ "start": "00:00", "end": "00:30", "hook": "Why this moment is engaging" }]
}`;

    const userPrompt = `Analyze this video and create repurposed content.

VIDEO TITLE: ${video.title}

VIDEO DESCRIPTION: ${video.description || 'N/A'}

TRANSCRIPT:
${transcript}

TOP AUDIENCE COMMENTS:
${topComments || 'No comments yet'}

VIDEO STATS:
- Views: ${video.views?.toLocaleString() || 0}
- Likes: ${video.likes?.toLocaleString() || 0}
- Comments: ${video.comments_count?.toLocaleString() || 0}

Please generate the following content:
${selectedOutputs.includes('thread') ? '1. An engaging X/Twitter thread (5-8 tweets)' : ''}
${selectedOutputs.includes('linkedin') ? '2. A LinkedIn post that provides value and encourages discussion' : ''}
${selectedOutputs.includes('instagram') ? '3. An Instagram caption with relevant hashtags' : ''}
${selectedOutputs.includes('shorts') ? '4. A YouTube Shorts title and description' : ''}
5. 3 suggested clip moments from the video with timestamps (if transcript has timestamps) that would make great short-form content

Return ONLY valid JSON, no markdown or explanation.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate content');
    }

    const aiData = await aiResponse.json();
    let generatedContent: any;
    
    try {
      const contentText = aiData.choices?.[0]?.message?.content;
      if (!contentText) throw new Error('Empty model response');
      generatedContent = JSON.parse(contentText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData);
      throw new Error('Failed to parse AI response');
    }

    // Save outputs as drafts
    const draftsToCreate: any[] = [];
    const now = new Date().toISOString();

    if (generatedContent.thread && selectedOutputs.includes('thread')) {
      draftsToCreate.push({
        user_id: user.id,
        title: `X Thread: ${video.title.substring(0, 50)}...`,
        content: generatedContent.thread,
        platform: 'X',
        type: 'thread',
        status: 'Draft',
        related_video_id: videoId,
        created_at: now,
        updated_at: now,
      });
    }

    if (generatedContent.linkedin && selectedOutputs.includes('linkedin')) {
      draftsToCreate.push({
        user_id: user.id,
        title: `LinkedIn: ${video.title.substring(0, 50)}...`,
        content: generatedContent.linkedin,
        platform: 'LinkedIn',
        type: 'post',
        status: 'Draft',
        related_video_id: videoId,
        created_at: now,
        updated_at: now,
      });
    }

    if (generatedContent.instagram && selectedOutputs.includes('instagram')) {
      draftsToCreate.push({
        user_id: user.id,
        title: `Instagram: ${video.title.substring(0, 50)}...`,
        content: generatedContent.instagram,
        platform: 'Instagram',
        type: 'caption',
        status: 'Draft',
        related_video_id: videoId,
        created_at: now,
        updated_at: now,
      });
    }

    if (generatedContent.shorts && selectedOutputs.includes('shorts')) {
      const shortsContent = typeof generatedContent.shorts === 'string' 
        ? generatedContent.shorts 
        : `Title: ${generatedContent.shorts.title}\n\nDescription: ${generatedContent.shorts.description}`;
      
      draftsToCreate.push({
        user_id: user.id,
        title: `Shorts: ${video.title.substring(0, 50)}...`,
        content: shortsContent,
        platform: 'YouTube',
        type: 'shorts',
        status: 'Draft',
        related_video_id: videoId,
        created_at: now,
        updated_at: now,
      });
    }

    if (draftsToCreate.length > 0) {
      const { error: draftsError } = await supabase
        .from('drafts')
        .insert(draftsToCreate);

      if (draftsError) {
        console.error('Error saving drafts:', draftsError);
      } else {
        console.log(`Saved ${draftsToCreate.length} drafts`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      transcriptSource,
      generatedContent,
      draftsCreated: draftsToCreate.length,
      clips: generatedContent.clips || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-video:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
