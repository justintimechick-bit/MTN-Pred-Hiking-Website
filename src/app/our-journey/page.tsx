import Link from "next/link";
import { trips } from "@/lib/content";
import { aggregateTrips, yearlyTotals, formatMonth, stateNames } from "@/lib/trips";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/config/site";
import { Stats } from "@/components/stats";

export const metadata = pageMetadata(
  "Our journey",
  "Follow our completed-trip timeline and documented route totals, year by year.",
  "/our-journey",
);
export default function Journey() {
  const annual = yearlyTotals(trips);
  const totals = aggregateTrips(trips);
  const goalTotal = site.goal
    ? (annual.find((year) => Number(year.year) === site.goal?.year)?.distanceMiles ?? 0)
    : 0;
  return (
    <div className="container page-content">
      <header className="page-heading">
        <p className="section-label">The miles add up</p>
        <h1>Our journey</h1>
        <p>
          {totals.tripCount} documented trips
          {trips.length
            ? ` from ${formatMonth(trips[trips.length - 1].month)} through ${formatMonth(trips[0].month)}`
            : ""}
          . A record of where we’ve been, with room for what comes next.
        </p>
      </header>
      <Stats />
      <section className="section">
        <div className="section-heading">
          <h2>Year by year</h2>
          <p>Documented route figures</p>
        </div>
        <div className="year-grid">
          {annual.map((year) => (
            <div className="year-summary" key={year.year}>
              <h3>{year.year}</h3>
              <p>
                <strong>{year.distanceMiles.toFixed(1)}</strong> route miles
              </p>
              <div className="year-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${(year.distanceMiles / Math.max(1, ...annual.map((row) => row.distanceMiles))) * 100}%`,
                  }}
                />
              </div>
              <p>
                {year.tripCount} {year.tripCount === 1 ? "trip" : "trips"} ·{" "}
                {year.elevationGainFt.toLocaleString("en-US")} ft listed gain
              </p>
            </div>
          ))}
        </div>
        <p className="metric-note">
          Bars compare recorded annual mileage. They do not represent a chosen goal.
        </p>
      </section>
      <div className="journey-layout">
        <section>
          <h2>Along the way</h2>
          <ol className="timeline">
            {[...trips].reverse().map((trip) => (
              <li key={trip.id}>
                <time dateTime={trip.month}>{formatMonth(trip.month)}</time>
                <h3>
                  <Link href={`/adventures/${trip.slug}`}>{trip.title}</Link>
                </h3>
                <p>{trip.region}</p>
              </li>
            ))}
          </ol>
        </section>
        <aside className="states-panel">
          <h2>
            {totals.states.length} states.
            <br />
            Plenty of trail.
          </h2>
          <ul>
            {totals.states.map((state) => (
              <li key={state}>{stateNames[state]}</li>
            ))}
          </ul>
          <p>
            {totals.participations} recorded trip participations across the archive. This counts
            attendance across trips, not unique hikers.
          </p>
        </aside>
      </div>
      {site.goal && (
        <section className="goal-panel">
          <h2>{site.goal.label}</h2>
          <p>
            {site.goal.year}: {goalTotal.toFixed(1)} of {site.goal.targetMiles} documented route
            miles
          </p>
          <progress value={goalTotal} max={site.goal.targetMiles} aria-label={site.goal.label} />
        </section>
      )}
    </div>
  );
}
