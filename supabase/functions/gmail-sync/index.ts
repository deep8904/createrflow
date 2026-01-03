import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// XOR decryption
function decrypt(encryptedText: string, key: string): string {
  const decoded = atob(encryptedText);
  let result = "";
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Refresh access token
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  return response.json();
}

// Extract company name from email
function extractCompanyName(email: string, fromName: string): string {
  // Try to extract domain and company name
  const domain = email.split("@")[1];
  if (domain) {
    const parts = domain.split(".");
    if (parts.length >= 2 && parts[0] !== "gmail" && parts[0] !== "yahoo" && parts[0] !== "hotmail" && parts[0] !== "outlook") {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }
  return fromName || email.split("@")[0];
}

// Parse email header to get sender info
function parseFrom(fromHeader: string): { name: string; email: string } {
  const match = fromHeader.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || "",
      email: match[2]?.trim() || fromHeader,
    };
  }
  return { name: "", email: fromHeader };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY")!;
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    // Get user from auth header
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get Gmail integration
    const { data: integration, error: intError } = await adminClient
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle();

    if (intError || !integration || !integration.connected) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt and refresh token if needed
    let accessToken = decrypt(integration.access_token_encrypted, encryptionKey);
    const tokenExpiry = new Date(integration.token_expiry);

    if (tokenExpiry < new Date()) {
      console.log("Refreshing Gmail access token...");
      const refreshToken = decrypt(integration.refresh_token_encrypted, encryptionKey);
      const newTokens = await refreshAccessToken(refreshToken, clientId, clientSecret);
      
      if (newTokens.error) {
        throw new Error("Failed to refresh token: " + newTokens.error);
      }
      
      accessToken = newTokens.access_token;
      
      // Update tokens in DB (encrypt new access token)
      const encryptedAccess = btoa(
        Array.from(newTokens.access_token as string).map((c: string, i: number) => 
          String.fromCharCode(c.charCodeAt(0) ^ encryptionKey.charCodeAt(i % encryptionKey.length))
        ).join("")
      );
      
      await adminClient
        .from("integrations")
        .update({
          access_token_encrypted: encryptedAccess,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq("id", integration.id);
    }

    // Get filter keywords
    const keywords = integration.filter_keywords || [
      "partnership", "collab", "collaboration", "sponsorship", "sponsor",
      "brand deal", "influencer", "campaign", "ambassador"
    ];

    // Cap work per sync so the request returns quickly (prevents UI "infinite spinner")
    const MAX_MESSAGES = 20;

    // Build Gmail search query - use simpler keyword matching
    const searchQuery = keywords.map((k: string) => k).join(" OR ");
    
    // On first sync (no last_sync_at), search last 90 days; otherwise search since last sync
    const isFirstSync = !integration.last_sync_at;
    const lastSync = integration.last_sync_at 
      ? new Date(integration.last_sync_at) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Format date for Gmail API (YYYY/MM/DD format)
    const afterDateStr = `${lastSync.getFullYear()}/${String(lastSync.getMonth() + 1).padStart(2, '0')}/${String(lastSync.getDate()).padStart(2, '0')}`;


    console.log("Searching Gmail with query:", searchQuery, "after:", afterDateStr, "isFirstSync:", isFirstSync);

    // Search for matching emails
    const searchUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    searchUrl.searchParams.set("q", `(${searchQuery}) after:${afterDateStr}`);
    searchUrl.searchParams.set("maxResults", String(MAX_MESSAGES));

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Gmail search API error:", searchResponse.status, errorText);
      throw new Error("Gmail search failed");
    }

    const searchData = await searchResponse.json();

    // Fallback: Gmail query can miss matches (HTML-only, odd formatting, etc.).
    // If nothing matches, scan recent inbox messages and filter locally by subject/snippet.
    if (!searchData.messages || searchData.messages.length === 0) {
      console.log("No matches via query; running fallback inbox scan...");

      const fallbackUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      fallbackUrl.searchParams.set("q", "in:inbox newer_than:365d -in:spam -in:trash");
      fallbackUrl.searchParams.set("maxResults", String(MAX_MESSAGES));

      const fallbackResp = await fetch(fallbackUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (fallbackResp.ok) {
        const fallbackData = await fallbackResp.json();
        const msgs: Array<{ id: string }> = fallbackData.messages || [];

        const loweredKeywords = (keywords || []).map((k: string) => k.toLowerCase());
        const matched: Array<{ id: string }> = [];

        for (const m of msgs) {
          const metaResp = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );

          if (!metaResp.ok) continue;
          const meta = await metaResp.json();

          const hdrs: Record<string, string> = {};
          for (const h of meta.payload?.headers || []) {
            hdrs[h.name?.toLowerCase?.() || ""] = h.value;
          }

          const haystack = `${hdrs.subject || ""}\n${meta.snippet || ""}`.toLowerCase();
          if (loweredKeywords.some((k: string) => k && haystack.includes(k))) {
            matched.push({ id: m.id });
          }
        }

        if (matched.length > 0) {
          console.log(`Fallback scan found ${matched.length} matching emails`);
          searchData.messages = matched;
        }
      } else {
        const t = await fallbackResp.text();
        console.error("Fallback inbox scan failed:", fallbackResp.status, t);
      }
    }

    if (!searchData.messages || searchData.messages.length === 0) {
      console.log("No matching emails found");


      // NOTE: Don't advance last_sync_at when we found no matches;
      // otherwise we can skip older emails on the next run.


      return new Response(JSON.stringify({
        dealsCreated: 0,
        messagesAdded: 0,
        message: "No new matching emails found",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${searchData.messages.length} matching emails`);

    let dealsCreated = 0;
    let messagesAdded = 0;

    // Process each message (capped to keep the request responsive)
    const messagesToProcess: Array<{ id: string }> = (searchData.messages || []).slice(0, MAX_MESSAGES);
    for (const msg of messagesToProcess) {
      try {
        // Get full message details
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const msgData = await msgResponse.json();

        // Check if message already processed
        const { data: existingMsg } = await adminClient
          .from("deal_messages")
          .select("id")
          .eq("gmail_message_id", msg.id)
          .maybeSingle();

        if (existingMsg) {
          console.log("Message already processed:", msg.id);
          continue;
        }

        // Extract headers
        const headers: Record<string, string> = {};
        for (const h of msgData.payload?.headers || []) {
          headers[h.name.toLowerCase()] = h.value;
        }

        const from = parseFrom(headers.from || "");
        const subject = headers.subject || "(No Subject)";
        const date = headers.date ? new Date(headers.date).toISOString() : new Date().toISOString();
        const threadId = msgData.threadId;

        // Extract body
        let body = "";
        function extractBody(part: any): string {
          if (part.body?.data) {
            return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
          if (part.parts) {
            for (const p of part.parts) {
              if (p.mimeType === "text/plain") {
                return extractBody(p);
              }
            }
            for (const p of part.parts) {
              const result = extractBody(p);
              if (result) return result;
            }
          }
          return "";
        }
        body = extractBody(msgData.payload) || "(No body)";

        // Check if deal exists for this thread
        let { data: existingDeal } = await adminClient
          .from("deals")
          .select("id")
          .eq("gmail_thread_id", threadId)
          .eq("user_id", user.id)
          .maybeSingle();

        let dealId: string;

        if (existingDeal) {
          dealId = existingDeal.id;
          // Update deal timestamp
          await adminClient
            .from("deals")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", dealId);
        } else {
          // Create new deal
          const brandName = extractCompanyName(from.email, from.name);
          
          // Use AI to summarize the email and extract deal details
          let summary = "";
          let extractedData: any = {};
          
          try {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content: `You are an assistant that analyzes brand partnership emails. Extract key information and provide a concise summary.
                    
Return a JSON object with these fields:
- summary: A 2-3 sentence summary of the email
- contact_name: The contact person's name
- deliverables: Array of requested deliverables (e.g., ["1 YouTube video", "2 Instagram posts"])
- timeline: Any mentioned timeline or deadlines
- budget: Any mentioned budget or compensation
- links: Array of any URLs mentioned
- next_steps: What action is requested

Only include fields that are clearly mentioned in the email. Use null for fields that aren't mentioned.`
                  },
                  {
                    role: "user",
                    content: `Email from: ${from.name} <${from.email}>
Subject: ${subject}

${body.substring(0, 3000)}`
                  }
                ]
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;
              if (content) {
                try {
                  extractedData = JSON.parse(content);
                  summary = extractedData.summary || "";
                } catch {
                  summary = content.substring(0, 500);
                }
              }
            }
          } catch (aiError) {
            console.error("AI summarization error:", aiError);
          }

          const { data: newDeal, error: dealError } = await adminClient
            .from("deals")
            .insert({
              user_id: user.id,
              brand_name: brandName,
              brand_email: from.email,
              subject: subject,
              status: "New",
              source: "gmail",
              gmail_thread_id: threadId,
              summary: summary,
              extracted_data: extractedData,
              contact_name: extractedData.contact_name || from.name,
              contact_email: from.email,
            })
            .select()
            .single();

          if (dealError) {
            console.error("Error creating deal:", dealError);
            continue;
          }

          dealId = newDeal.id;
          dealsCreated++;
        }

        // Insert message (idempotent: avoids duplicate-key errors)
        const { error: msgError } = await adminClient
          .from("deal_messages")
          .upsert({
            deal_id: dealId,
            content: body,
            sender: from.email,
            gmail_message_id: msg.id,
            gmail_thread_id: threadId,
            subject: subject,
            timestamp: date,
          }, {
            onConflict: "gmail_message_id",
          });

        if (msgError) {
          console.error("Error inserting message:", msgError);
        } else {
          messagesAdded++;
        }
      } catch (msgError) {
        console.error("Error processing message:", msg.id, msgError);
      }
    }

    // Update last sync time
    await adminClient
      .from("integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integration.id);

    console.log(`Sync complete: ${dealsCreated} deals created, ${messagesAdded} messages added`);

    return new Response(JSON.stringify({ 
      dealsCreated, 
      messagesAdded,
      message: `Synced ${dealsCreated} new deals and ${messagesAdded} messages` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in gmail-sync:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
