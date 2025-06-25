// supabase/functions/get-templates/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (_req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (_req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      console.error("Missing Twilio credentials");
      return new Response(JSON.stringify({ error: "Missing Twilio credentials" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("Fetching templates from Twilio...");
    
    const twilioUrl = "https://content.twilio.com/v1/Content";
    const authHeader = "Basic " + btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio API Error:", result);
      return new Response(JSON.stringify({
        error: "Failed to fetch templates",
        details: result,
        status: response.status
      }), { status: 400, headers: corsHeaders });
    }

    console.log("Raw Twilio API Response:", JSON.stringify(result, null, 2));

    if (!result.contents || !Array.isArray(result.contents)) {
      console.log("No contents array found in response");
      return new Response(JSON.stringify({ 
        templates: [],
        message: "No contents array found in Twilio response",
        rawResponse: result
      }), {
        headers: corsHeaders,
      });
    }

    console.log(`Found ${result.contents.length} total content items`);

    // Log each content item to understand the structure
    result.contents.forEach((content: any, index: number) => {
      console.log(`Content ${index}:`, JSON.stringify(content, null, 2));
    });

    // Filter for WhatsApp templates with more flexible filtering
    const whatsappContents = result.contents.filter((t: any) => {
      // Check multiple possible ways WhatsApp templates might be identified
      const hasWhatsAppType = t.type === "whatsapp" || 
                             (t.types && t.types.whatsapp) ||
                             (t.whatsapp);
      
      console.log(`Content ${t.sid} has WhatsApp type:`, hasWhatsAppType);
      return hasWhatsAppType;
    });

    console.log(`Found ${whatsappContents.length} WhatsApp content items`);

    const templates = result.contents.map((t: any) => {
  return {
    sid: t.sid,
    friendlyName: t.friendly_name || t.name || t.sid,
    status: t.status,
    raw: t
  };
});


    console.log(`Final processed templates:`, templates);

    // Return all templates, even those without body (for debugging)
    return new Response(JSON.stringify({ 
      templates,
      debug: {
        totalContents: result.contents.length,
        whatsappContents: whatsappContents.length,
        processedTemplates: templates.length
      }
    }), {
      headers: corsHeaders,
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});