import Link from "next/link";
import { site } from "@/config/site";
import { trips } from "@/lib/content";
import { formatMonth } from "@/lib/trips";
import { pageMetadata } from "@/lib/metadata";
import { Photo } from "@/components/photo";
import { Stats } from "@/components/stats";
import { TripCard } from "@/components/trip-card";

export const metadata = pageMetadata("Hiking & backpacking from Atlanta", site.description, "/");
export default function Home() {
  const featured = trips[0];
  return (
    <>
      <section className="home-hero">
        <div className="container hero-heading">
          <div>
            <p className="location">
              <span aria-hidden="true">⌁</span> Atlanta, Georgia
            </p>
            <h1>{site.name}</h1>
          </div>
          <p className="hero-intro">
            {site.tagline}
            <br />
            Our adventures, one trip at a time.
          </p>
        </div>
        <div className="hero-image">
          <Photo id={site.heroPhotoId} hero label="A view from our adventures" />
          <div className="container hero-action">
            <Link href="/adventures" className="button button-yellow">
              View adventures
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 12h16m-6-6 6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </Link>
            <span>From the city to the mountains.</span>
          </div>
        </div>
      </section>
      <section className="container home-stats" aria-label="Our documented adventures">
        <Stats />
      </section>
      {featured && (
        <section className="container section featured">
          <div className="featured-copy">
            <p className="section-label">Latest adventure</p>
            <time dateTime={featured.month}>{formatMonth(featured.month)}</time>
            <h2>{featured.title}</h2>
            <p>{featured.region}. Explore the route details from our latest documented trip.</p>
            <Link href={`/adventures/${featured.slug}`} className="text-link">
              View this adventure
            </Link>
          </div>
          <Photo id={featured.images?.[0]} label="A moment from the adventure" />
        </section>
      )}
      <section className="story-band">
        <div className="container story-layout">
          <div>
            <p className="section-label">The crew</p>
            <h2>
              A little Atlanta.
              <br />A lot of outdoors.
            </h2>
          </div>
          <div>
            <p>
              We’re an Atlanta-based crew that hikes and backpacks together. This is our place to
              document the trips and see how far we’ve come.
            </p>
            <Link href="/our-story" className="text-link">
              Our story
            </Link>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <h2>Out on the trail</h2>
          <Link href="/adventures" className="text-link">
            All adventures
          </Link>
        </div>
        <div className="trip-grid">
          {trips.slice(1, 3).map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>
      <section className="container journey-invitation">
        <div>
          <p className="section-label">Since October 2023</p>
          <h2>Every trip adds to the story.</h2>
          <p>Follow the documented journey through Tennessee, North Carolina, and Virginia.</p>
        </div>
        <Link href="/our-journey" className="button button-outline">
          Explore our journey
        </Link>
      </section>
      <section className="partner-band">
        <div className="container">
          <div>
            <p className="section-label">Make a connection</p>
            <h2>Let’s talk trail.</h2>
            <p>Explore possibilities for working with our hiking and backpacking crew.</p>
          </div>
          <Link href="/partner-with-us" className="button button-yellow">
            Partner with us
          </Link>
        </div>
      </section>
    </>
  );
}
