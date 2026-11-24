import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms and conditions for Believe The Works.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10">
      <h1 className="btw-page-title mb-2">Terms and conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: November 23, 2026</p>

      <div className="max-w-none space-y-6 text-foreground">
        <section className="space-y-2">
          <h2 className="btw-section-title">1. Agreement</h2>
          <p className="btw-legal-body">
            Believe The Works, a registered nonprofit organization, operates this Service (“the Service”). By
            creating an account or using the Service, you agree to these Terms and our community standards. If you do
            not agree, do not use the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">2. Accounts</h2>
          <p className="btw-legal-body">
            You are responsible for your account credentials and for activity under your account. You must provide
            accurate information and keep your contact details up to date where required.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">3. User content</h2>
          <p className="btw-legal-body">
            You retain rights to content you submit. You grant Believe The Works a license to host, display, and
            distribute that content as needed to operate the Service, including to people anywhere the Service is
            available. You represent that you have the rights to post your content and that it does not violate others’
            rights or applicable law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">4. Acceptable use</h2>
          <p className="btw-legal-body">
            You will not use the Service to harass others, spread malware, spam, impersonate, or post unlawful or
            harmful material. We may remove content or suspend accounts that violate these rules or harm the community.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">5. Worldwide audience</h2>
          <p className="btw-legal-body">
            The Service is published so people anywhere can read witness, share their own, and take part where an
            account is offered. Reaching a worldwide audience is part of the ministry. You are responsible for using
            the Service in line with the laws that apply where you are. We may limit access where the law requires it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">6. Disclaimers</h2>
          <p className="btw-legal-body">
            The Service is provided “as is.” We do not guarantee uninterrupted or error-free operation. Content posted by
            users does not reflect our views. For important matters (including health, legal, or financial decisions),
            seek qualified professionals, the Service is not a substitute for professional advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">7. Limitation of liability</h2>
          <p className="btw-legal-body">
            To the fullest extent permitted by law, Believe The Works is not liable for indirect, incidental, or
            consequential damages arising from your use of the Service. Our total liability for claims relating to the
            Service is limited as permitted by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">8. Gifts</h2>
          <p className="btw-legal-body">
            Gifts support Believe The Works, a registered nonprofit organization, and its ministry operations. Tax
            treatment of a gift is your own responsibility.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">9. Changes</h2>
          <p className="btw-legal-body">
            We may update these Terms. Continued use after changes constitutes acceptance of the updated Terms. Material
            changes may be communicated through the Service or by email where appropriate.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="btw-section-title">10. Contact</h2>
          <p className="btw-legal-body">
            For questions about these Terms, contact Believe The Works through the{" "}
            <Link href="/contact" className="text-primary font-medium hover:underline">
              contact page
            </Link>
            .
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
