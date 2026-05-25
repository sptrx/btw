import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the Believe The Works team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl space-y-8 pb-4">
      <header className="space-y-3">
        <h1 className="btw-page-title">Contact us</h1>
        <p className="btw-lead">
          Questions about the ministry, partnerships, giving, or your account? Send us a message and we will respond as
          soon as we can.
        </p>
      </header>

      <ContactForm />
    </div>
  );
}
