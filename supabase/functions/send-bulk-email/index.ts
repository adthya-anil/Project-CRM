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
  attachment_count?: number;
  attachment_size?: number;
}

interface EmailAttachment {
  filename: string;
  url: string;
  contentType?: string;
}

// Helper function to download attachment from URL and convert to Blob
async function downloadAttachment(attachment: EmailAttachment): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${attachment.filename}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return { blob, filename: attachment.filename };
  } catch (error) {
    console.error(`Error downloading attachment ${attachment.filename}:`, error);
    throw error;
  }
}

// Helper function to add attachments to FormData
async function addAttachmentsToFormData(formData: FormData, attachments: EmailAttachment[]) {
  if (!attachments || attachments.length === 0) return;

  try {
    // Download all attachments
    const downloadPromises = attachments.map(attachment => downloadAttachment(attachment));
    const downloadedAttachments = await Promise.all(downloadPromises);

    // Add each attachment to FormData
    downloadedAttachments.forEach(({ blob, filename }) => {
      formData.append("attachment", blob, filename);
    });
  } catch (error) {
    console.error("Error processing attachments:", error);
    throw new Error(`Failed to process attachments: ${error.message}`);
  }
}

// Helper function to send a copy to sender
async function sendSenderCopy(
  emailData: any,
  attachments: EmailAttachment[],
  MAILGUN_API_KEY: string,
  MAILGUN_DOMAIN: string,
  originalSubject: string,
  originalContent?: string
) {
  try {
    const senderCopyForm = new FormData();
    senderCopyForm.append("to", emailData.senderEmail);
    senderCopyForm.append("from", `${emailData.senderName} <${emailData.senderEmail}>`);
    senderCopyForm.append("subject", `[COPY] ${originalSubject}`);
    
    if (emailData.emailType === "template") {
      // For template emails, include a note about the template used
      const templateInfo = `This is a copy of the email sent using template: ${emailData.templateData.templateName}\n\nOriginal subject: ${originalSubject}\nRecipients: ${emailData.recipients?.length || 0}`;
      senderCopyForm.append("text", templateInfo);
    } else if (originalContent) {
      // For custom emails, include the actual content
      const copyContent = `This is a copy of the email you sent.\n\nOriginal subject: ${originalSubject}\nRecipients: ${emailData.recipients?.length || 0}\n\n--- Original Message ---\n${originalContent}`;
      senderCopyForm.append("text", copyContent);
    }

    // Add attachments to sender copy
    await addAttachmentsToFormData(senderCopyForm, attachments);

    const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`api:${MAILGUN_API_KEY}`),
      },
      body: senderCopyForm,
    });

    if (!res.ok) {
      console.error("Failed to send sender copy:", await res.text());
    }
  } catch (error) {
    console.error("Error sending sender copy:", error);
  }
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
    const attachments: EmailAttachment[] = emailData.attachments || [];

    // Calculate attachment statistics
    const attachmentCount = attachments.length;
    const attachmentSize = attachments.reduce((total, att) => {
      // Estimate size from URL or use a default (since we don't have size in the interface)
      return total + (att.contentType ? 1024 * 1024 : 0); // Rough estimate
    }, 0);

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
      metadata: {
        ...emailData.metadata,
        attachment_count: attachmentCount,
        attachment_filenames: attachments.map(att => att.filename)
      },
      user_id: userId,
      attachment_count: attachmentCount,
      attachment_size: attachmentSize,
    };

    // 📧 TEMPLATE MODE
    if (emailData.emailType === "template" && emailData.templateData) {
      const formData = new FormData();
      formData.append("to", recipientEmails.join(","));
      formData.append("recipient-variables", JSON.stringify(recipientVariables));
      formData.append("from", `${emailData.senderName} <${emailData.senderEmail}>`);
      formData.append("subject", emailData.subject);
      formData.append("template", emailData.templateData.templateName);

      // Add attachments to template emails
      try {
        await addAttachmentsToFormData(formData, attachments);
      } catch (attachmentError) {
        const errorMessage = attachmentError instanceof Error ? attachmentError.message : String(attachmentError);
        const errorLog: EmailLogPayload = {
          ...baseLog,
          mailgun_message_id: null,
          status: "failed",
          error_message: `Attachment processing failed: ${errorMessage}`,
        };
        await logToSupabase(errorLog);

        return new Response(
          JSON.stringify({
            success: false,
            recipients_count: 0,
            error: `Failed to process attachments: ${errorMessage}`,
          }),
          { status: 500, headers: corsHeaders }
        );
      }

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

      // Send copy to sender if main email was successful
      if (res.ok) {
        await sendSenderCopy(
          emailData,
          attachments,
          MAILGUN_API_KEY,
          MAILGUN_DOMAIN,
          emailData.subject
        );
      }

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
      // For custom emails, we need to send individual emails with attachments
      const results = [];
      let successfulSend = false;
      let sampleContent = "";
      
      for (const recipient of recipientEmails) {
        const vars = recipientVariables[recipient] as Record<string, string>;
        let personalizedSubject = emailData.subject;
        let personalizedText = emailData.customContent.text;

        for (const [key, value] of Object.entries(vars)) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
          personalizedSubject = personalizedSubject.replace(regex, value);
          personalizedText = personalizedText.replace(regex, value);
        }

        // Store sample content for sender copy (use first recipient's personalized content)
        if (!sampleContent) {
          sampleContent = personalizedText;
        }

        const personalForm = new FormData();
        personalForm.append("to", recipient);
        personalForm.append("from", `${emailData.senderName} <${emailData.senderEmail}>`);
        personalForm.append("subject", personalizedSubject);
        personalForm.append("text", personalizedText);

        // Add attachments to each individual email
        try {
          await addAttachmentsToFormData(personalForm, attachments);
        } catch (attachmentError) {
          const errorMessage = attachmentError instanceof Error ? attachmentError.message : String(attachmentError);
          const singleErrorLog: EmailLogPayload = {
            ...baseLog,
            recipient_count: 1,
            recipient_emails: [recipient],
            subject: personalizedSubject,
            mailgun_message_id: null,
            status: "failed",
            error_message: `Attachment processing failed for ${recipient}: ${errorMessage}`,
          };
          await logToSupabase(singleErrorLog);
          
          results.push({ success: false, recipient, error: errorMessage });
          continue;
        }

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
        results.push({ success: res.ok, recipient, error: res.ok ? null : result.message });
        
        if (res.ok) {
          successfulSend = true;
        }
      }

      // Send copy to sender if at least one email was successful
      if (successfulSend) {
        await sendSenderCopy(
          emailData,
          attachments,
          MAILGUN_API_KEY,
          MAILGUN_DOMAIN,
          emailData.subject,
          sampleContent
        );
      }

      const successCount = results.filter(r => r.success).length;
      const hasErrors = results.some(r => !r.success);

      return new Response(
        JSON.stringify({
          success: !hasErrors,
          recipients_count: successCount,
          total_recipients: recipientEmails.length,
          error: hasErrors ? "Some emails failed to send" : null,
          details: results,
        }),
        { status: hasErrors ? 207 : 200, headers: corsHeaders } // 207 Multi-Status for partial success
      );
    }

    // ❌ Fallback for bad emailType
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid "emailType" or missing data.' }),
      { status: 400, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unexpected server error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// 🔁 Helper: insert email log into Supabase
async function logToSupabase(payload: EmailLogPayload) {
  try {
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
  } catch (error) {
    console.error("Failed to log to Supabase:", error);
  }
}