import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { deleteData } = await req.json().catch(() => ({ deleteData: false }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Delete the Gmail integration
    const { error: deleteError } = await adminClient
      .from("integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "gmail");

    if (deleteError) {
      throw deleteError;
    }

    // Optionally delete synced email data
    if (deleteData) {
      // Delete deals sourced from Gmail
      const { data: gmailDeals } = await adminClient
        .from("deals")
        .select("id")
        .eq("user_id", user.id)
        .eq("source", "gmail");

      if (gmailDeals && gmailDeals.length > 0) {
        const dealIds = gmailDeals.map(d => d.id);
        
        // Delete messages first (foreign key constraint)
        await adminClient
          .from("deal_messages")
          .delete()
          .in("deal_id", dealIds);

        // Delete deals
        await adminClient
          .from("deals")
          .delete()
          .in("id", dealIds);
      }
    }

    console.log("Gmail disconnected for user:", user.id, deleteData ? "(data deleted)" : "");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in gmail-disconnect:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
