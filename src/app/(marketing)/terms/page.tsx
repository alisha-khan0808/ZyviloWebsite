import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";
import { getSettings } from "@/lib/content/repo";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the Zyvilo website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const { contactEmail, name } = await getSettings();
  return (
    <LegalPage title="Terms of use" updated="2026-11-01">
      <p>By using this website you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>Information on this site</h2>
      <p>
        Content on this website is general information about {name}&apos;s services. Workflow diagrams and examples are illustrative: they show possible
        workflows, not proof that a given integration is already deployed or available out of the box. Any project scope, pricing and outcomes are agreed
        separately in writing.
      </p>
      <h2>No guaranteed results</h2>
      <p>We do not guarantee specific savings, response times or business results from automation. Results depend on each business&apos;s processes, data and tools.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not submit false information, other people&apos;s personal data without permission, or sensitive records.</li>
        <li>Do not attempt to disrupt, probe or gain unauthorised access to the site or its systems.</li>
        <li>Do not use automated means to submit forms.</li>
      </ul>
      <h2>Intellectual property</h2>
      <p>The {name} name, logo and site content belong to {name} or its licensors. Product names on this site are descriptive and not claimed as registered trademarks.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, the website is provided &quot;as is&quot; and we are not liable for losses arising from its use.</p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: <a className="text-purple underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
