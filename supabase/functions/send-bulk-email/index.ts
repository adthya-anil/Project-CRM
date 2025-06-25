import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface EmailLogPayload {
  sender_email: string;
  recipient_count: number;
  recipient_emails: string[];
  subject: string;
  email_type: "template" | "custom";
  template_name: string | null;
  template_version: string | null;
  mailgun_message_id?: string | null;
  status: "sent" | "failed" | "queued";
  error_message: string | null;
  metadata?: Record<string, unknown> | null;
  user_id: string | null;
}

serve(async (req: Request) => {
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

  // 🔐 Extract user from Authorization Bearer token
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
  const userId = user?.id || null;

  try {
    const emailData = await req.json();
    const recipientVariables: Record<string, unknown> = {};
    const recipientEmails: string[] = [];

    for (const recipient of emailData.recipients || []) {
      const email = recipient.email;
      recipientEmails.push(email);
      recipientVariables[email] = recipient.variables || {};
    }

    const baseLog: Omit<EmailLogPayload, "mailgun_message_id"> = {
      sender_email: emailData.senderEmail,
      recipient_count: recipientEmails.length,
      recipient_emails: recipientEmails,
      subject: emailData.subject,
      email_type: emailData.emailType,
      template_name: emailData?.templateData?.templateName || null,
      template_version: emailData?.templateData?.templateVersion || null,
      status: "sent",
      error_message: null,
      metadata: emailData.metadata || null,
      user_id: userId,
    };

    // 📧 TEMPLATE MODE
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

      const logPayload: EmailLogPayload = {
        ...baseLog,
        mailgun_message_id: result.id || null,
        status: res.ok ? "sent" : "failed",
        error_message: res.ok ? null : result.message || "Mailgun error",
      };

      await logToSupabase(logPayload);

      return new Response(
        JSON.stringify({
          success: res.ok,
          recipients_count: recipientEmails.length,
          error: res.ok ? null : result.message,
        }),
        { status: res.ok ? 200 : 500, headers: corsHeaders }
      );
    }

    // ✉️ CUSTOM TEXT EMAIL MODE
    else if (emailData.emailType === "custom" && emailData.customContent) {
      for (const recipient of recipientEmails) {
        const vars = recipientVariables[recipient] as Record<string, string>;
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

        const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`api:${MAILGUN_API_KEY}`),
          },
          body: personalForm,
        });

        const result = await res.json();

        const singleLog: EmailLogPayload = {
          ...baseLog,
          recipient_count: 1,
          recipient_emails: [recipient],
          subject: personalizedSubject,
          mailgun_message_id: result.id || null,
          status: res.ok ? "sent" : "failed",
          error_message: res.ok ? null : result.message || "Mailgun error",
        };

        await logToSupabase(singleLog);
      }

      return new Response(
        JSON.stringify({
          success: true,
          recipients_count: recipientEmails.length,
          error: null,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ❌ Fallback for bad emailType
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid "emailType" or missing data.' }),
      { status: 400, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (err as Error).message || "Unexpected server error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// 🔁 Helper: insert email log into Supabase
async function logToSupabase(payload: EmailLogPayload) {
  await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/email_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}
