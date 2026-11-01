import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { listIndustries, listServices } from "@/lib/content/repo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, industries] = await Promise.all([listServices(), listIndustries()]);
  const staticRoutes = ["", "/solutions", "/industries", "/how-it-works", "/about", "/contact", "/request-automation", "/privacy", "/terms"];
  return [
    ...staticRoutes.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...services.map((s) => ({ url: `${SITE_URL}/solutions/${s.slug}`, lastModified: s.updated_at, priority: 0.8 })),
    ...industries.map((i) => ({ url: `${SITE_URL}/industries/${i.slug}`, lastModified: i.updated_at, priority: 0.8 })),
  ];
}
