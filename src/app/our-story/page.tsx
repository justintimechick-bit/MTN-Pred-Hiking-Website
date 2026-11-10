import { site } from "@/config/site";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Photo } from "@/components/photo";
import Link from "next/link";

export const metadata = pageMetadata(
  "Our story",
  "Meet the idea behind our Atlanta-based hiking and backpacking crew and explore our documented adventures.",
  "/our-story",
);
export default function Story() {
  return (
    <div className="container page-content">
      <header className="page-heading">
        <p className="section-label">Based in Atlanta</p>
        <h1>Our story</h1>
        <p>A hiking and backpacking crew, with a growing collection of adventures.</p>
      </header>
      <div className="story-page-grid">
        <Photo id={site.crewPhotoId} label="The crew, outdoors" />
        <div>
          <h2>
            From Atlanta,
            <br />
            into the mountains.
          </h2>
          <p className="lead">
            {site.name} is an Atlanta-based hiking and backpacking crew. Our documented trip history
            begins in October 2023 and spans Tennessee, North Carolina, and Virginia.
          </p>
          <p>
            This journal brings those adventures together: where we went, the routes in our records,
            and the journey over time.
          </p>
          <Link className="text-link" href="/adventures">
            Explore the adventures
          </Link>
        </div>
      </div>
      {content.profiles.length > 0 && (
        <section className="section">
          <h2>Meet the crew</h2>
          <div className="profiles">
            {content.profiles.map((profile) => (
              <article key={profile.id}>
                <Photo id={profile.photoId} label="Crew portrait" />
                <h3>{profile.displayName}</h3>
                {profile.bio && <p>{profile.bio}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
