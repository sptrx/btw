"use server";

import { createClient } from "@/utils/supabase/server";

export type ContactFormState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const honeypot = String(formData.get("company") ?? "").trim();
  if (honeypot) {
    return { success: true, message: "Thank you. We will be in touch soon." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { error: "Please enter your name." };
  if (!email || !EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (message.length < 10) return { error: "Please enter a message of at least 10 characters." };
  if (message.length > 8000) return { error: "Message is too long." };

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    subject: subject || null,
    message,
  });

  if (error) {
    console.error("[contact]", error.message);
    return {
      error:
        "We could not send your message right now. Please try again later or email us through another channel.",
    };
  }

  return {
    success: true,
    message: "Thank you for reaching out. We will respond as soon as we can.",
  };
}
