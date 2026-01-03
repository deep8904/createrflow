import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using XOR with key
function encrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Parse state early to get frontend redirect for postMessage targetOrigin
    let state = { redirect: '', userId: '' };
    if (stateParam) {
      try {
        state = JSON.parse(atob(stateParam));
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }
    const frontendOrigin = state.redirect ? new URL(state.redirect).origin : '*';

    if (error) {
      console.error('OAuth error:', error);
      return new Response(`
        <html><body>
          <script>
            window.opener?.postMessage({ type: 'youtube-oauth-error', error: '${error}' }, '${frontendOrigin}');
            window.close();
          </script>
          <p>Authentication failed: ${error}. You can close this window.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    // Exchange code for tokens
    const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }

    // IMPORTANT: The redirect_uri used here must exactly match the one used in the initial auth request
    // and the one configured in Google Cloud Console.
    // req.url is often http://localhost:9999 inside the runtime, so we MUST NOT derive it from url.origin.
    const redirectUri = `${supabaseUrl}/functions/v1/youtube-oauth-callback`;
    console.log('Using OAuth redirect_uri:', redirectUri);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const channelData = await channelResponse.json();
    console.log('Channel fetch response status:', channelResponse.status);

    if (!channelResponse.ok) {
      console.error('Channel fetch failed:', channelData);
      throw new Error('Failed to fetch YouTube channel info');
    }

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = channelData.items[0];
    const channelInfo = {
      channelId: channel.id,
      channelName: channel.snippet.title,
      channelThumbnail: channel.snippet.thumbnails?.default?.url,
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
    };

    // Encrypt tokens
    const encryptedAccessToken = encrypt(access_token, encryptionKey);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token, encryptionKey) : null;
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store in database using service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header if available
    const authHeader = req.headers.get('authorization');
    let userId = state.userId;

    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || '';
    }

    // If we still don't have a userId, we need to return the data for the frontend to handle
    if (!userId) {
      // Return HTML that posts message to opener with temp data
      const tempData = {
        channelInfo,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiry,
      };

      return new Response(`
        <html><body>
          <script>
            window.opener?.postMessage({ 
              type: 'youtube-oauth-success', 
              data: ${JSON.stringify(tempData)}
            }, '${frontendOrigin}');
            window.close();
          </script>
          <p>Connected successfully! You can close this window.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Upsert integration
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        provider: 'youtube',
        connected: true,
        channel_id: channelInfo.channelId,
        channel_name: channelInfo.channelName,
        channel_thumbnail: channelInfo.channelThumbnail,
        subscribers: channelInfo.subscribers,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw new Error('Failed to save integration');
    }

    console.log('Successfully connected YouTube for user:', userId);

    // Redirect back to frontend
    const frontendBase = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
    const redirectUrl = state.redirect || `${frontendBase.replace(/\/$/, '')}/app/settings`;
    
    return new Response(`
      <html><body>
        <script>
          window.opener?.postMessage({ type: 'youtube-oauth-success' }, '${frontendOrigin}');
          window.location.href = '${redirectUrl}?youtube_connected=true';
        </script>
        <p>Connected successfully! Redirecting...</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-oauth-callback:', error);
    return new Response(`
      <html><body>
        <script>
          window.opener?.postMessage({ type: 'youtube-oauth-error', error: '${errorMessage}' }, '*');
          window.close();
        </script>
        <p>Error: ${errorMessage}. You can close this window.</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});
