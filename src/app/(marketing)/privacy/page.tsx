import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";
import { getSettings } from "@/lib/content/repo";
import { PRIVACY_CONSENT_VERSION } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "What information Zyvilo collects, why, how long we keep it and how to request deletion.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { contactEmail, name } = await getSettings();
  return (
    <LegalPage title="Privacy notice" updated={PRIVACY_CONSENT_VERSION}>
      <p>
        This notice explains how {name} (&quot;we&quot;) handles information you share through this website. We collect only what we need to respond to
        you and to plan a possible project.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Contact details</strong> you provide: name, email, phone/WhatsApp, company and website.</li>
        <li><strong>Your request</strong>: industry, business size, the process you&apos;d like to automate, tools, timeline, budget range and contact preferences.</li>
        <li><strong>Attribution data</strong>: the page you submitted from, referring website and campaign (UTM) parameters, and submission time.</li>
        <li><strong>Consent records</strong>: when you accepted this notice (and its version) and whether you opted in to marketing updates.</li>
      </ul>
      <p>
        Please do not submit sensitive personal data (such as medical or financial records) through our forms. Our forms only ask whether such data is
        involved — never for the data itself.
      </p>
      <h2>Why we use it</h2>
      <ul>
        <li>To respond to your enquiry and prepare for a consultation (legitimate interest / steps prior to a contract).</li>
        <li>To understand which services and industries generate interest, using our own records (not third-party profiling).</li>
        <li>To send occasional updates — only if you separately opted in. You can unsubscribe at any time.</li>
      </ul>
      <h2>Analytics and cookies</h2>
      <p>
        We use strictly necessary browser storage to keep your form answers in your current tab until you submit, and to remember campaign parameters
        for the session. Optional analytics run only with your consent and receive event names only — never your name, email, phone or request text.
      </p>
      <h2>Who processes it</h2>
      <p>
        Your information is stored with our database and hosting providers (for example Supabase and Vercel) and our transactional email provider, under
        agreements that require them to protect it. We do not sell your information.
      </p>
      <h2>How long we keep it</h2>
      <p>
        Enquiries that do not become projects are deleted or anonymised within 24 months of last contact. Spam submissions are deleted promptly. Records
        connected to a client relationship are kept for the duration of that relationship and any legally required period.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or delete your information, or withdraw marketing consent, by emailing{" "}
        <a className="text-purple underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>. Please include your reference code if you have one.
      </p>
    </LegalPage>
  );
}
