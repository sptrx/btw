import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms and conditions for Believe The Works.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Terms and conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="max-w-none space-y-6 text-foreground">
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Agreement</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By creating an account or using Believe The Works (“the Service”), you agree to these Terms and our community
            standards. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Accounts</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You are responsible for your account credentials and for activity under your account. You must provide
            accurate information and keep your contact details up to date where required.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. User content</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You retain rights to content you submit, but you grant the Service a license to host, display, and distribute
            your content as needed to operate the platform. You represent that you have the rights to post your content
            and that it does not violate others’ rights or applicable law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Acceptable use</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You will not use the Service to harass others, spread malware, spam, impersonate, or post unlawful or
            harmful material. We may remove content or suspend accounts that violate these rules or harm the community.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Disclaimers</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The Service is provided “as is.” We do not guarantee uninterrupted or error-free operation. Content posted by
            users does not reflect our views. For important matters (including health, legal, or financial decisions),
            seek qualified professionals—the Service is not a substitute for professional advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Limitation of liability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages
            arising from your use of the Service. Our total liability for claims relating to the Service is limited as
            permitted by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Changes</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update these Terms. Continued use after changes constitutes acceptance of the updated Terms. Material
            changes may be communicated through the Service or by email where appropriate.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For questions about these Terms, contact the site operator using the contact information provided on the
            site (or your project’s support channel).
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/auth/signup" className="text-primary font-medium hover:underline">
          ← Back to sign up
        </Link>
        {" · "}
        <Link href="/" className="text-muted-foreground hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
