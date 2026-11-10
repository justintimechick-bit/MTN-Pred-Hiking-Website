import Link from "next/link";
import { site } from "@/config/site";
import { Stats } from "@/components/stats";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Partner with us",
  "Explore potential collaborations with our Atlanta hiking and backpacking crew, grounded in documented adventures.",
  "/partner-with-us",
);
const ideas = [
  [
    "Local outfitter collaboration",
    "A workshop, product demo, or group discount could be a starting point for a local relationship.",
  ],
  [
    "Gear trials",
    "Discuss loaned or gifted gear, honest field feedback, and a clearly disclosed report from actual use.",
  ],
  [
    "Trip support",
    "Explore support for a specific adventure, with acknowledgment and any deliverables agreed in advance.",
  ],
  [
    "A defined content project",
    "Discuss a specific photo or storytelling assignment, with scope, usage rights, and delivery terms agreed separately.",
  ],
];
export default function Partners() {
  return (
    <div className="container page-content">
      <header className="page-heading">
        <p className="section-label">A conversation starts here</p>
        <h1>Partner with us</h1>
        <p>
          We’re an Atlanta-based hiking and backpacking crew. We’re interested in conversations that
          connect our time outdoors with relevant local businesses and outdoor brands.
        </p>
      </header>
      <Stats />
      <section className="section">
        <div className="section-heading">
          <h2>Possibilities to explore</h2>
        </div>
        <p className="lead narrow">
          Every collaboration starts with a conversation. These are ideas to discuss, with any
          commitments subject to a separate agreement.
        </p>
        <div className="opportunities">
          {ideas.map(([title, description]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="contact-panel">
        <div>
          <h2>Let’s talk trail.</h2>
          {site.groupEmail ? (
            <p>Tell us about your idea and the kind of collaboration you have in mind.</p>
          ) : (
            <p>
              Partnership contact details will appear here when available. In the meantime, explore
              our documented adventures.
            </p>
          )}
        </div>
        {site.groupEmail ? (
          <a
            className="button button-yellow"
            href={`mailto:${site.groupEmail}?subject=${encodeURIComponent(`Partnership inquiry: ${site.name}`)}`}
          >
            Email the crew
          </a>
        ) : (
          <Link className="button button-yellow" href="/adventures">
            Explore our adventures
          </Link>
        )}
      </section>
    </div>
  );
}
