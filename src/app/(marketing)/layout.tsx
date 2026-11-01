import { draftMode } from "next/headers";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { MotionProvider } from "@/components/marketing/motion-provider";
import { AttributionCapture } from "@/components/forms/attribution";
import { getSettings } from "@/lib/content/repo";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const preview = draftMode().isEnabled;
  return (
    <MotionProvider>
      {preview && (
        <div className="bg-navy px-4 py-2 text-center text-sm text-white">
          Preview mode — you are seeing draft content.{" "}
          <a href="/api/preview/exit" className="font-semibold underline">Exit preview</a>
        </div>
      )}
      <Navbar links={settings.headerNav} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <CookieConsent />
      <AttributionCapture />
    </MotionProvider>
  );
}
