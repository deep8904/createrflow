import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simple XOR encryption for token storage
function encrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Parse state
  let userId = "";
  let redirectUrl = "";
  try {
    const state = JSON.parse(atob(stateParam || ""));
    userId = state.userId;
    redirectUrl = state.redirect || "";
  } catch {
    console.error("Failed to parse state");
  }

  // Handle errors
  if (error) {
    console.error("OAuth error:", error);
    const errorRedirect = redirectUrl || "/app/settings";
    return new Response(null, {
      status: 302,
      headers: { Location: `${errorRedirect}?gmail_error=${encodeURIComponent(error)}` },
    });
  }

  if (!code || !userId) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");

    if (!clientId || !clientSecret || !encryptionKey) {
      throw new Error("Missing required environment variables");
    }

    const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    console.log("Gmail tokens received for user:", userId);

    // Get user email from Gmail API
    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token, encryptionKey);
    const refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token, encryptionKey) : null;
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert Gmail integration
    const { error: upsertError } = await supabase
      .from("integrations")
      .upsert({
        user_id: userId,
        provider: "gmail",
        connected: true,
        channel_id: profile.emailAddress,
        channel_name: profile.emailAddress,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider",
      });

    if (upsertError) {
      console.error("Error upserting integration:", upsertError);
      throw upsertError;
    }

    console.log("Gmail integration saved for user:", userId);

    // Redirect back to settings
    const successRedirect = redirectUrl || "/app/settings";
    return new Response(null, {
      status: 302,
      headers: { Location: `${successRedirect}?gmail_connected=true` },
    });
  } catch (error: unknown) {
    console.error("Error in gmail-oauth-callback:", error);
    const errorRedirect = redirectUrl || "/app/settings";
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(null, {
      status: 302,
      headers: { Location: `${errorRedirect}?gmail_error=${encodeURIComponent(message)}` },
    });
  }
});
