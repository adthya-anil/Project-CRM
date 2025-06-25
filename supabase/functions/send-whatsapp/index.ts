// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://crm.safetycatch.in",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, message, contentSid, contentVariables, mediaUrl } = await req.json();

    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");

    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({ error: "Missing authorization header or API key" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    if (!accountSid || !authToken || !whatsappNumber) {
      return new Response(JSON.stringify({ error: "Missing Twilio credentials" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!to) {
      return new Response(JSON.stringify({ error: "Missing 'to' number" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Ensure phone number is in correct format
    const phoneNumber = to.startsWith('+') ? to : `+${to}`;
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);
    const formData = new URLSearchParams();

    formData.append("To", `whatsapp:${phoneNumber}`);

    // 🧠 Use template if provided
    if (contentSid) {
      formData.append("ContentSid", contentSid);

      // Always use MessagingServiceSid for templates if available
      if (messagingServiceSid) {
        formData.append("MessagingServiceSid", messagingServiceSid);
      } else {
        formData.append("From", `whatsapp:${whatsappNumber}`);
      }

      // Handle template contentVariables
      if (contentVariables) {
        if (typeof contentVariables === "object") {
          // Ensure contentVariables is properly formatted
          const contentVariablesString = JSON.stringify(contentVariables);
          console.log("Template contentVariables:", contentVariablesString);
          formData.append("contentVariables", contentVariablesString);
        } else {
          return new Response(JSON.stringify({ error: "Template contentVariables must be an object" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
      }

    } else if (message) {
      // ✅ Fallback to freeform message
      formData.append("From", `whatsapp:${whatsappNumber}`);
      formData.append("Body", message);
      if (mediaUrl?.trim()) {
        formData.append("MediaUrl", mediaUrl.trim());
      }
    } else {
      return new Response(JSON.stringify({
        error: "Either 'message' or 'contentSid' must be provided"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("Sending to Twilio with data:", Object.fromEntries(formData.entries()));

    // Send to Twilio
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();
    console.log("Twilio response:", twilioResult);

    if (twilioResponse.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: "WhatsApp message sent successfully",
        messageId: twilioResult.sid,
        to: phoneNumber,
        type: contentSid ? "template" : "freeform",
        usedcontentSid: contentSid || null,
        response: twilioResult,
      }), { headers: corsHeaders });
    } else {
      console.error("Twilio API error:", twilioResult);
      return new Response(JSON.stringify({
        error: "Failed to send WhatsApp message",
        details: twilioResult,
        statusCode: twilioResponse.status,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: err.message,
      stack: err.stack,
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});