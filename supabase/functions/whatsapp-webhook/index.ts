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

    // Find the lead by phone number (corrected query)
    const { data: lead, error: leadError } = await supabase
      .from("mock")
      .select("*")
      .eq("Phone", fromNumber)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return new Response("Lead not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log("Found lead:", {
      id: lead.id,
      name: lead.Name,
      phone: lead.Phone,
      user_id: lead.user_id
    });

    // Get the assigned user's details using the user_id from the lead
    const { data: assignedUser, error: userError } = await supabase
      .from("users")
      .select("name, phone, email")
      .eq("user_id", lead.user_id)
      .single();

    if (userError || !assignedUser) {
      console.error("Assigned user not found:", userError);
      return new Response("Assigned user not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (!assignedUser.phone || !assignedUser.email) {
      console.error("Assigned user missing phone or email:", assignedUser);
      return new Response("Assigned user details incomplete", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log("Found assigned user:", {
      name: assignedUser.name,
      phone: assignedUser.phone,
      email: assignedUser.email
    });

    // Helper function to send WhatsApp message via Twilio
    const sendWhatsAppMessage = async (to: string, message: string) => {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = btoa(`${accountSid}:${authToken}`);

      const formData = new URLSearchParams();
      formData.append("From", whatsappNumber);
      formData.append("To", `whatsapp:${to}`);
      formData.append("Body", message);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      return response;
    };

    // Helper function to send email via existing send-bulk-email function
    const sendEmail = async (to: string, subject: string, htmlContent: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('send-bulk-email', {
          body: {
            recipients: [
              {
                email: to,
                variables: {} // No variables needed for this email
              }
            ],
            senderEmail: 'ceo@safetycatch.in',
            senderName: 'CRM SafetyCatch',
            subject: subject,
            emailType: 'custom',
            customContent: {
              text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
            },
            metadata: {
              source: 'whatsapp_webhook',
              lead_phone: fromNumber,
              lead_name: lead.Name || 'Unknown'
            }
          }
        });

        if (error) {
          console.error('Email sending error:', error);
          return { success: false, error };
        }

        return { success: true, data };
      } catch (err) {
        console.error('Email function error:', err);
        return { success: false, error: err };
      }
    };

    // Clean phone number for WhatsApp link (remove country code formatting)
    const cleanPhoneForWhatsApp = (phone: string) => {
      return phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '');
    };

    // Send thank you message to the lead
    const leadThankYouMessage = `Hi ${lead.Name || 'there'}, thanks for your interest! 

You can speak directly to your Course Advisor ${assignedUser.name} here: https://wa.me/91${cleanPhoneForWhatsApp(assignedUser.phone)}`;

    console.log("Sending thank you message to lead:", {
      to: fromNumber,
      leadName: lead.Name,
      advisorName: assignedUser.name,
      advisorPhone: assignedUser.phone
    });

    const leadMessageResponse = await sendWhatsAppMessage(fromNumber, leadThankYouMessage);
    const leadMessageResult = await leadMessageResponse.json();

    if (!leadMessageResponse.ok) {
      console.error("Failed to send thank you message to lead:", leadMessageResult);
    }

    // Create WhatsApp chat link
    const whatsappChatLink = `https://wa.me/${fromNumber.replace('+', '')}`;
    
    // Compose email notification for the assigned user
    const emailSubject = `🎯 Lead Interested - ${lead.Name || 'Unknown Lead'}`;
    const emailContent = `🎯 LEAD INTERESTED!

Lead Details:
- Name: ${lead.Name || 'Unknown'}
- Phone: ${fromNumber}
- Organization: ${lead.Organization || 'N/A'}
- Response: "${messageBody}"

You can chat with this lead directly on WhatsApp: ${whatsappChatLink}

This lead has expressed interest and has been sent your contact details for direct communication.

---
SafetyCatch Lead Management System
This is an automated notification.`;

    // Send email notification to assigned user
    console.log("Sending email notification to user:", {
      to: assignedUser.email,
      user: assignedUser.name
    });

    const emailResult = await sendEmail(assignedUser.email, emailSubject, emailContent);

    if (emailResult.success) {
      // Log the interaction in database - check if lead_interactions table exists
      try {
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
          // Don't fail the entire request if logging fails
        }
      } catch (logErr) {
        console.error("Lead interactions table might not exist:", logErr);
        // Continue without logging if table doesn't exist
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Messages sent successfully",
        emailSent: true,
        thankYouSid: leadMessageResult.sid,
        leadPhone: fromNumber,
        leadName: lead.Name,
        userNotified: assignedUser.name,
        userEmail: assignedUser.email,
        thankYouSent: leadMessageResponse.ok,
        leadData: {
          id: lead.id,
          name: lead.Name,
          organization: lead.Organization,
          user_id: lead.user_id
        },
        assignedUser: {
          name: assignedUser.name,
          phone: assignedUser.phone,
          email: assignedUser.email
        }
      }), {
        headers: corsHeaders,
      });
    } else {
      console.error("Failed to send email notification:", emailResult.error);
      return new Response(JSON.stringify({
        error: "Failed to send email notification",
        details: emailResult.error
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