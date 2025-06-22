// utils/sendWhatsApp.js
import { supabase } from "../../supabaseClient"; // adjust path

export async function sendWhatsAppMessage(to, message, mediaUrl = null) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("User not authenticated.");
  }

  console.log("Sending WhatsApp message:", {
    to,
    hasMessage: !!message,
    hasMedia: !!mediaUrl,
    mediaUrl
  });

  const response = await fetch(
    "http://localhost:54321/functions/v1/send-whatsapp", // replace with production URL
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        to, 
        message, 
        mediaUrl: mediaUrl || null 
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp send error:", data);
    throw new Error(data.error || "Failed to send WhatsApp message");
  }

  return data;
}