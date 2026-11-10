import type { Metadata } from "next";
import Link from "next/link";
import { site, canIndex } from "@/config/site";
import { Navigation } from "@/components/navigation";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "./globals.css";

export const metadata: Metadata = {
  ...(site.domain ? { metadataBase: new URL(site.domain) } : {}),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  robots: { index: canIndex, follow: canIndex },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand" aria-label={`${site.name} home`}>
              <svg width="39" height="39" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path
                  d="m3 30 12-22 7 12 4-7 11 17H3Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path d="m10 17 5 3 4-5M22 20l4 4 5-3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>{site.name}</span>
            </Link>
            <Navigation />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="container footer-main">
            <div>
              <Link href="/" className="footer-brand">
                {site.name}
              </Link>
              <p>{site.tagline}</p>
            </div>
            <nav aria-label="Footer">
              <Link href="/adventures">Adventures</Link>
              <Link href="/our-story">Our story</Link>
              <Link href="/our-journey">Our journey</Link>
              <Link href="/partner-with-us">Partner with us</Link>
            </nav>
            {(site.groupEmail || site.socialLinks.length > 0) && (
              <div className="footer-contact">
                {site.groupEmail && <a href={`mailto:${site.groupEmail}`}>{site.groupEmail}</a>}
                {site.socialLinks.map((link) => (
                  <a key={link.url} href={link.url} rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="container footer-bottom">
            <span>Based in Atlanta, Georgia.</span>
            <span>See you on the trail.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
