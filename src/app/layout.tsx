import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Zyvilo — AI Agents & Business Automation", template: "%s | Zyvilo" },
  description:
    "Zyvilo builds AI agents, multi-agent systems and end-to-end automations that handle repetitive work, so your team can focus on growth.",
  openGraph: { type: "website", siteName: "Zyvilo", locale: "en" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FCFAFF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
