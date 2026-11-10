import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { trips, getTrip } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { formatMonth, miles, feet, stateNames } from "@/lib/trips";
import { Photo } from "@/components/photo";

export const dynamicParams = false;
export function generateStaticParams() {
  return trips.map((trip) => ({ slug: trip.slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const trip = getTrip((await params).slug);
  return trip
    ? pageMetadata(
        trip.title,
        `${formatMonth(trip.month)} in ${trip.region}. Documented hiking route details.`,
        `/adventures/${trip.slug}`,
      )
    : {};
}
export default async function Adventure({ params }: Props) {
  const trip = getTrip((await params).slug);
  if (!trip) notFound();
  const recap = trip.recap
    ? await readFile(path.join(process.cwd(), "src/content/public/recaps", trip.recap), "utf8")
    : null;
  return (
    <article className="container page-content adventure-detail">
      <Link href="/adventures" className="back-link">
        Back to adventures
      </Link>
      <header className="page-heading">
        <time dateTime={trip.month}>{formatMonth(trip.month)}</time>
        <h1>{trip.title}</h1>
        <p>{trip.region}</p>
      </header>
      <Photo id={trip.images?.[0]} hero label="From this adventure" className="detail-photo" />
      <div className="detail-layout">
        <div>
          <h2>The trip record</h2>
          {recap ? (
            <div className="prose">
              <ReactMarkdown skipHtml>{recap}</ReactMarkdown>
            </div>
          ) : (
            <p className="lead">
              A documented {trip.routeType.toLowerCase()} trip in {trip.region}, recorded in{" "}
              {formatMonth(trip.month)}.
            </p>
          )}
          {trip.componentRoutes && (
            <div className="component-routes">
              <h3>Two routes, one trip</h3>
              <p>
                This record combines the following routes. Its figures are included once in our trip
                totals.
              </p>
              <ul>
                {trip.componentRoutes.map((route) => (
                  <li key={route}>{route}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="metric-note">
            Source: the crew’s approved trip history. Figures describe the documented route, not
            verified GPX distance or elevation measurements. The exact hiking days and track are not
            recorded here.
          </p>
        </div>
        <aside className="trip-facts" aria-label="Trip facts">
          <dl>
            <div>
              <dt>When</dt>
              <dd>
                <time dateTime={trip.month}>{formatMonth(trip.month)}</time>
              </dd>
            </div>
            <div>
              <dt>States</dt>
              <dd>{trip.states.map((state) => stateNames[state]).join(" / ")}</dd>
            </div>
            <div>
              <dt>Route type</dt>
              <dd>{trip.routeType}</dd>
            </div>
            <div>
              <dt>Documented route distance</dt>
              <dd>{miles(trip.distanceMiles)}</dd>
            </div>
            <div>
              <dt>Listed elevation gain</dt>
              <dd>{feet(trip.elevationGainFt)}</dd>
            </div>
            {trip.participantCount != null && (
              <div>
                <dt>Recorded participants on this trip</dt>
                <dd>{trip.participantCount}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
      {(trip.images?.length ?? 0) > 1 && (
        <section className="section">
          <h2>From the trip</h2>
          <div className="trip-grid">
            {trip.images?.slice(1).map((id) => (
              <Photo key={id} id={id} />
            ))}
          </div>
        </section>
      )}
      <div className="detail-next">
        <h2>Keep exploring</h2>
        <Link className="button button-outline" href="/adventures">
          View all adventures
        </Link>
      </div>
    </article>
  );
}
