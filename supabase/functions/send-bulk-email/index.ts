import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json", // Required for Supabase res.data to work
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
  const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing Mailgun credentials" }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const emailData = await req.json();
    const recipientVariables: Record<string, any> = {};
    const recipientEmails: string[] = [];

    for (const recipient of emailData.recipients || []) {
      const email = recipient.email;
      recipientEmails.push(email);
      recipientVariables[email] = recipient.variables || {};
    }

    // ✅ 1. TEMPLATE EMAIL MODE
    if (emailData.emailType === "template" && emailData.templateData) {
      const formData = new FormData();
      formData.append("to", recipientEmails.join(","));
      formData.append("recipient-variables", JSON.stringify(recipientVariables));
      formData.append("from", `${emailData.senderName} <${emailData.senderEmail}>`);
      formData.append("subject", emailData.subject);
      formData.append("template", emailData.templateData.templateName);

      const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`api:${MAILGUN_API_KEY}`),
        },
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            recipients_count: recipientEmails.length,
            error: null
          }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.message || "Mailgun error"
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ✅ 2. CUSTOM PLAIN TEXT EMAIL MODE
    else if (emailData.emailType === "custom" && emailData.customContent) {
      for (const recipient of recipientEmails) {
  const vars = recipientVariables[recipient];

  // Replace in subject
  let personalizedSubject = emailData.subject;
  let personalizedText = emailData.customContent.text;

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    personalizedSubject = personalizedSubject.replace(regex, value);
    personalizedText = personalizedText.replace(regex, value);
  }

  const personalForm = new FormData();
  personalForm.append("to", recipient);
  personalForm.append("from", `${emailData.senderName} <${emailData.senderEmail}>`);
  personalForm.append("subject", personalizedSubject);
  personalForm.append("text", personalizedText);


        await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`api:${MAILGUN_API_KEY}`),
          },
          body: personalForm,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          recipients_count: recipientEmails.length,
          error: null
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ❌ Invalid type fallback
    else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid "emailType" or missing content/template.' }),
        { status: 400, headers: corsHeaders }
      );
    }

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (err as Error).message || "Unexpected server error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
