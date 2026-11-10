import type { Metadata } from "next";
import { site, canIndex } from "@/config/site";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: site.domain ? { canonical: `${site.domain}${path}` } : undefined,
    robots: { index: canIndex, follow: canIndex },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      type: "website",
      siteName: site.name,
      ...(site.domain ? { url: `${site.domain}${path}` } : {}),
      ...(site.domain
        ? {
            images: [
              {
                url: `${site.domain}/share-image`,
                width: 1200,
                height: 630,
                alt: `${site.name}. ${site.tagline}`,
              },
            ],
          }
        : {}),
    },
    twitter: { card: "summary", title: `${title} | ${site.name}`, description },
  };
}
