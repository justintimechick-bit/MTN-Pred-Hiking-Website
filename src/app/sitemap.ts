import type { MetadataRoute } from "next";
import { site, canIndex } from "@/config/site";
import { trips } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.domain || !canIndex) return [];
  return [
    "/",
    "/adventures",
    "/our-story",
    "/our-journey",
    "/partner-with-us",
    ...trips.map((trip) => `/adventures/${trip.slug}`),
  ].map((path) => ({ url: `${site.domain}${path}` }));
}
