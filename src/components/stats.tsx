import { trips } from "@/lib/content";
import { aggregateTrips } from "@/lib/trips";

export function Stats({ compact = false }: { compact?: boolean }) {
  const totals = aggregateTrips(trips);
  return (
    <div className={`stats ${compact ? "stats-compact" : ""}`}>
      <dl>
        <div>
          <dt>Documented trips</dt>
          <dd>{totals.tripCount}</dd>
        </div>
        <div>
          <dt>Documented route miles</dt>
          <dd>{totals.distanceMiles.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Listed elevation gain, ft</dt>
          <dd>{totals.elevationGainFt.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt>States represented</dt>
          <dd>{totals.states.length}</dd>
        </div>
      </dl>
      {!compact && (
        <p className="metric-note">
          From the published trip history. Route figures are not verified GPX measurements.
          {totals.missingDistances || totals.missingElevations
            ? " Totals include recorded values only; some metrics are unavailable."
            : ""}
        </p>
      )}
    </div>
  );
}
