import type { MetadataRoute } from "next";
import { canIndex, site } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", ...(canIndex ? { allow: "/" } : { disallow: "/" }) },
    ...(canIndex && site.domain ? { sitemap: `${site.domain}/sitemap.xml` } : {}),
  };
}
