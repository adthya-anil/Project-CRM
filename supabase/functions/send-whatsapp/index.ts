// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      contentSid, 
      contentVariables, 
      body, // For freeform messages
      messageType = "template" // "template" or "freeform"
    } = await req.json();

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
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER"); // For freeform messages

    if (!accountSid || !authToken) {
      return new Response(JSON.stringify({ 
        error: "Missing Twilio credentials. Account SID and Auth Token are required" 
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Validate required parameters
    if (!to) {
      return new Response(JSON.stringify({ error: "Missing 'to' phone number" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Ensure phone number is in correct format
    const phoneNumber = to.startsWith('+') ? to : `+${to}`;
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);
    const formData = new URLSearchParams();

    // Base parameters
    formData.append("To", `whatsapp:${phoneNumber}`);

    if (messageType === "template") {
      // TEMPLATE MESSAGE LOGIC
      if (!contentSid) {
        return new Response(JSON.stringify({ 
          error: "Missing 'contentSid'. Template ContentSid is required for WhatsApp template messages" 
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!messagingServiceSid) {
        return new Response(JSON.stringify({ 
          error: "Missing 'messagingServiceSid'. Messaging Service SID is required for template messages" 
        }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      // Validate ContentSid format
      if (!contentSid.startsWith('HX')) {
        return new Response(JSON.stringify({ 
          error: "Invalid ContentSid format. ContentSid should start with 'HX'" 
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      formData.append("ContentSid", contentSid);
      formData.append("MessagingServiceSid", messagingServiceSid);

      // Handle template variables
      if (contentVariables && typeof contentVariables === "object" && contentVariables !== null) {
        const validVariables = {};
        for (const [key, value] of Object.entries(contentVariables)) {
          if (typeof key === "string" && value !== undefined && value !== null) {
            validVariables[key] = String(value);
          }
        }
        
        if (Object.keys(validVariables).length > 0) {
          formData.append("ContentVariables", JSON.stringify(validVariables));
        }
      }

      console.log("Sending WhatsApp template:", {
        to: `whatsapp:${phoneNumber}`,
        contentSid,
        contentVariables: contentVariables || null
      });

    } else if (messageType === "freeform") {
      // FREEFORM MESSAGE LOGIC
      if (!body) {
        return new Response(JSON.stringify({ 
          error: "Missing 'body'. Message body is required for freeform messages" 
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!whatsappNumber) {
        return new Response(JSON.stringify({ 
          error: "Missing 'whatsappNumber'. WhatsApp sender number is required for freeform messages" 
        }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      formData.append("From", whatsappNumber);
      formData.append("Body", body);

      console.log("Sending WhatsApp freeform message:", {
        to: `whatsapp:${phoneNumber}`,
        from: whatsappNumber,
        body: body.substring(0, 100) + (body.length > 100 ? "..." : "")
      });

    } else {
      return new Response(JSON.stringify({ 
        error: "Invalid messageType. Must be 'template' or 'freeform'" 
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

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
        message: `WhatsApp ${messageType} message sent successfully`,
        messageId: twilioResult.sid,
        to: phoneNumber,
        type: messageType,
        ...(messageType === "template" && { 
          contentSid, 
          contentVariables: contentVariables || null,
          messagingServiceSid 
        }),
        ...(messageType === "freeform" && { 
          body,
          from: whatsappNumber 
        }),
        response: {
          sid: twilioResult.sid,
          status: twilioResult.status,
          direction: twilioResult.direction,
          dateCreated: twilioResult.date_created,
          dateSent: twilioResult.date_sent,
          body: twilioResult.body
        }
      }), { headers: corsHeaders });
    } else {
      console.error("Twilio API error:", twilioResult);
      
      // Handle specific errors
      let errorMessage = `Failed to send WhatsApp ${messageType} message`;
      if (messageType === "template") {
        if (twilioResult.code === 63016) {
          errorMessage = "Template message failed - no active conversation. User may need to initiate contact first.";
        } else if (twilioResult.code === 63040) {
          errorMessage = "Template was rejected by WhatsApp. Please check your template approval status.";
        }
      } else if (messageType === "freeform") {
        if (twilioResult.code === 63016) {
          errorMessage = "Freeform message failed - no active conversation window. User must message you within 24 hours to receive freeform messages.";
        }
      }

      return new Response(JSON.stringify({
        error: errorMessage,
        details: twilioResult,
        statusCode: twilioResponse.status,
        twilioErrorCode: twilioResult.code || null
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
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});