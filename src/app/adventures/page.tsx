import { trips } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Archive } from "@/components/archive";

export const metadata = pageMetadata(
  "Adventures",
  "Explore our documented hiking and backpacking trips, with month-level dates and recorded route figures.",
  "/adventures",
);
export default function Adventures() {
  return (
    <div className="container page-content">
      <header className="page-heading">
        <p className="section-label">The trip archive</p>
        <h1>Adventures</h1>
        <p>
          From the Smokies to the Virginia highlands. Our documented hiking and backpacking history,
          one trip at a time.
        </p>
      </header>
      <Archive trips={trips} />
      <p className="metric-note archive-note">
        Distances and gain are documented route figures, not verified GPX measurements. Dates retain
        the month precision of our trip records.
      </p>
    </div>
  );
}
