import Link from "next/link";
import type { Trip } from "@/lib/schema";
import { formatMonth, miles, feet } from "@/lib/trips";
import { Photo } from "./photo";

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className="trip-card">
      <Link
        href={`/adventures/${trip.slug}`}
        className="trip-photo-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Photo id={trip.images?.[0]} label="From the trail" />
      </Link>
      <div className="trip-card-copy">
        <time dateTime={trip.month}>{formatMonth(trip.month)}</time>
        <h3>
          <Link href={`/adventures/${trip.slug}`}>{trip.title}</Link>
        </h3>
        <p>{trip.region}</p>
        <dl className="inline-metrics">
          <div>
            <dt>Route distance</dt>
            <dd>{miles(trip.distanceMiles)}</dd>
          </div>
          <div>
            <dt>Listed gain</dt>
            <dd>{feet(trip.elevationGainFt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
