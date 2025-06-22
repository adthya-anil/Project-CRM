// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:5173", // Update for production
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");

    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({
        error: "Missing authorization header or API key",
      }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !whatsappNumber) {
      return new Response(JSON.stringify({
        error: "Missing Twilio credentials in environment variables",
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { to, message, mediaUrl } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({
        error: "Missing 'to' or 'message' in request body",
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append("From", whatsappNumber);
    formData.append("To", `whatsapp:${to}`);
    formData.append("Body", message);

    // Add media URL if provided
    if (mediaUrl && mediaUrl.trim()) {
      formData.append("MediaUrl", mediaUrl.trim());
    }

    console.log("Sending WhatsApp message:", {
      to: `whatsapp:${to}`,
      hasMedia: !!mediaUrl,
      mediaUrl: mediaUrl || 'none'
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (twilioResponse.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: "WhatsApp message sent successfully!",
        messageId: twilioResult.sid,
        to,
        sentMessage: message,
        mediaUrl: mediaUrl || null,
        twilioResponse: twilioResult,
      }), {
        headers: corsHeaders,
      });
    } else {
      console.error("Twilio API Error:", twilioResult);
      return new Response(JSON.stringify({
        error: "Failed to send WhatsApp message",
        details: twilioResult,
        status: twilioResponse.status,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: err.message,
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});