"use client";

import { useActionState } from "react";
import { submitContact, type ContactFormState } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm";

function FieldError({ state, id }: { state: ContactFormState; id: string }) {
  if (!state?.error) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null);

  if (state?.success) {
    return (
      <div
        className="btw-content-panel border-primary/25 bg-primary/5 text-foreground"
        role="status"
      >
        <p className="btw-lead text-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="btw-content-panel max-w-xl space-y-5">
      <FieldError state={state} id="contact-form-error" />

      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-foreground">
          Subject <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input id="contact-subject" name="subject" type="text" className={inputClassName} />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          minLength={10}
          placeholder="How can we help?"
          className={cn(inputClassName, "min-h-[9rem] resize-y")}
        />
      </div>

      <Button type="submit" disabled={pending} className="min-h-11 rounded-full px-8">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
