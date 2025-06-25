// supabase/functions/whatsapp-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SB_URL")!;
    const supabaseServiceKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error("Missing Twilio credentials");
    }

    // Parse incoming webhook data
    const body = await req.text();
    const params = new URLSearchParams(body);
    
    const fromNumber = params.get("From")?.replace("whatsapp:", "") || "";
    const toNumber = params.get("To")?.replace("whatsapp:", "") || "";
    const messageBody = params.get("Body") || "";
    const messageSid = params.get("MessageSid") || "";

    console.log("Incoming WhatsApp message:", {
      from: fromNumber,
      to: toNumber,
      body: messageBody,
      sid: messageSid
    });

    // Check if the message contains "interested" (case insensitive)
    const isInterested = /(?:\binterested\b|\byes\b|\bok\b|\bs\b)/i.test(messageBody);

    
    if (!isInterested) {
      console.log("Message doesn't contain 'interested', skipping notification");
      return new Response("ok", { headers: corsHeaders });
    }

    // Find the lead by phone number
    const { data: lead, error: leadError } = await supabase
      .from("mock")
      .select("*, users(name, phone)")
      .eq("Phone", fromNumber)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return new Response("Lead not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get the assigned user's details
    const assignedUser = lead.users;
    if (!assignedUser || !assignedUser.phone) {
      console.error("Assigned user or phone not found");
      return new Response("Assigned user not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Create WhatsApp chat link
    const whatsappChatLink = `https://wa.me/${fromNumber.replace('+', '')}`;
    
    // Compose notification message for the assigned user
    const notificationMessage = `🎯 LEAD INTERESTED!

Lead: ${lead.Name || 'Unknown'}
Phone: ${fromNumber}
Organization: ${lead.Organization || 'N/A'}
Response: "${messageBody}"

Click to chat: ${whatsappChatLink}`;

    // Send notification to assigned user via WhatsApp
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append("From", whatsappNumber);
    formData.append("To", `whatsapp:${assignedUser.phone}`);
    formData.append("Body", notificationMessage);

    console.log("Sending notification to user:", {
      to: assignedUser.phone,
      user: assignedUser.name
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
      // Optional: Log the interaction in database
      const { error: logError } = await supabase
        .from("lead_interactions")
        .insert({
          lead_id: lead.id,
          user_id: lead.user_id,
          interaction_type: "interested_response",
          message: messageBody,
          twilio_message_sid: messageSid,
          notification_sent: true,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error("Failed to log interaction:", logError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        notificationSid: twilioResult.sid,
        leadPhone: fromNumber,
        userNotified: assignedUser.name
      }), {
        headers: corsHeaders,
      });
    } else {
      console.error("Failed to send notification:", twilioResult);
      return new Response(JSON.stringify({
        error: "Failed to send notification",
        details: twilioResult
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: err.message,
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});