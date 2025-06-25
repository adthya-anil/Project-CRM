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
      return new Response(JSON.stringify({ error: "Missing Twilio credentials" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

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
      return new Response(JSON.stringify({
        error: "Failed to fetch templates",
        details: result,
        status: response.status
      }), { status: 400, headers: corsHeaders });
    }

    if (!result.contents || !Array.isArray(result.contents)) {
      return new Response(JSON.stringify({
        templates: [],
        message: "No templates found",
        rawResponse: result
      }), {
        headers: corsHeaders,
      });
    }

    const templates = result.contents.map((content: any) => {
      const whatsapp = content.types?.whatsapp || null;
      const quickReply = content.types?.["twilio/quick-reply"] || null;
      const text = content.types?.["twilio/text"] || null;

      // Extract template body and variables
      let body = null;
      let variables = [];
      let approvalStatus = null;

      // Check WhatsApp template structure
      if (whatsapp) {
        approvalStatus = whatsapp.approval_status;
        if (whatsapp.body) {
          body = whatsapp.body;
          // Extract variables from WhatsApp template body
          const variableMatches = body.match(/\{\{(\d+)\}\}/g);
          if (variableMatches) {
            variables = variableMatches.map((match: string) => match.replace(/[{}]/g, ''));
          }
        }
      }

      // Check Quick Reply template structure
      if (quickReply) {
        approvalStatus = approvalStatus || quickReply.approval_status;
        if (quickReply.body) {
          body = quickReply.body;
          // Extract variables from quick reply template
          const variableMatches = body.match(/\{\{(\w+)\}\}/g);
          if (variableMatches) {
            variables = variableMatches.map((match: string) => match.replace(/[{}]/g, ''));
          }
        }
      }

      // Check text template structure
      if (text && !body) {
        body = text.body || text.content;
        if (body) {
          const variableMatches = body.match(/\{\{(\w+)\}\}/g);
          if (variableMatches) {
            variables = variableMatches.map((match: string) => match.replace(/[{}]/g, ''));
          }
        }
      }

      return {
        sid: content.sid,
        friendlyName: content.friendly_name || content.name || content.sid,
        status: content.status || null,
        approvalStatus: approvalStatus,
        dateCreated: content.date_created,
        dateUpdated: content.date_updated,
        body: body,
        variables: [...new Set(variables)], // Remove duplicates
        types: {
          whatsapp,
          quickReply,
          text
        },
        raw: content
      };
    });

    return new Response(JSON.stringify({
      templates,
      debug: {
        total: result.contents.length,
        approved: templates.filter(t => t.approvalStatus === 'approved').length,
        withVariables: templates.filter(t => t.variables && t.variables.length > 0).length
      }
    }), {
      headers: corsHeaders,
    });

  } catch (err) {
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