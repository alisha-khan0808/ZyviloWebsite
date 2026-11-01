import type { Metadata } from "next";
import { Hero } from "@/components/marketing/home/hero";
import {
  CapabilitiesSection,
  FaqSection,
  FinalCta,
  ProblemSection,
  ProcessSection,
  TestimonialsSection,
  WhySection,
  WorkforceSection,
} from "@/components/marketing/home/sections";
import { DemoTabs } from "@/components/marketing/home/demo-tabs";
import { IndustrySelector } from "@/components/marketing/home/industry-selector";
import { Section, SectionHeader } from "@/components/ui/section";
import { getHome, getSettings, listFaqs, listIndustries, listServices, listTestimonials } from "@/lib/content/repo";
import { SITE_URL } from "@/lib/config";
import type { HomeSection } from "@/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { absolute: settings.seo.defaultTitle },
    description: settings.seo.defaultDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [home, services, industries, faqs, testimonials, settings] = await Promise.all([
    getHome(),
    listServices(),
    listIndustries(),
    listFaqs("home"),
    listTestimonials(),
    getSettings(),
  ]);

  const render = (s: HomeSection) => {
    switch (s.id) {
      case "problem":
        return <ProblemSection s={s} />;
      case "capabilities":
        return <CapabilitiesSection s={s} />;
      case "demo":
        return (
          <Section id="see-it-work" aria-labelledby="demo-h">
            <SectionHeader id="demo-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
            <DemoTabs />
          </Section>
        );
      case "workforce":
        return <WorkforceSection s={s} services={services} />;
      case "industries":
        return (
          <Section id="industries" aria-labelledby="ind-h" className="bg-gradient-to-b from-bg via-lavender/50 to-bg">
            <SectionHeader id="ind-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
            <IndustrySelector industries={industries} />
          </Section>
        );
      case "process":
        return <ProcessSection s={s} />;
      case "why":
        return <WhySection s={s} />;
      case "testimonials":
        return <TestimonialsSection s={s} items={testimonials} />;
      case "faq":
        return <FaqSection s={s} faqs={faqs} />;
      case "final":
        return <FinalCta heading={s.heading} intro={s.intro} cta={s.cta} />;
    }
  };

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.name,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/zyvilo-logo.png`,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    sameAs: settings.social.map((s) => s.href),
  };

  return (
    <>
      <Hero hero={home.hero} />
      {home.sections.filter((s) => s.visible).map((s) => (
        <div key={s.id}>{render(s)}</div>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
