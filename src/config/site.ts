import { z } from "zod";

const configuredUrl = process.env.SITE_URL?.trim();
const domain = configuredUrl
  ? z
      .url()
      .refine((value) => {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password
        );
      }, "SITE_URL must be an HTTPS origin without a path, query, or credentials")
      .parse(configuredUrl)
      .replace(/\/$/, "")
  : null;
const email = process.env.GROUP_EMAIL?.trim();

export const site = {
  name: "Mountain Predators",
  tagline: "Hiking & backpacking from Atlanta.",
  description:
    "An Atlanta-based hiking and backpacking crew. Explore our documented adventures and journey through the Appalachian mountains.",
  groupEmail: email ? z.email().parse(email) : null,
  domain,
  // Add only confirmed, available public accounts. Never proposed handles.
  socialLinks: [] as { label: string; url: string }[],
  heroPhotoId: "p-0001" as string | null,
  crewPhotoId: null as string | null,
  // Configure an agreed goal only after the crew approves a target and period.
  goal: null as { label: string; year: number; targetMiles: number } | null,
};

export const canIndex = Boolean(
  site.domain && process.env.ALLOW_INDEXING === "true" && process.env.VERCEL_ENV !== "preview",
);
