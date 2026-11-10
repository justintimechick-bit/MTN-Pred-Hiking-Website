import type { Trip } from "./schema";

export const stateNames: Record<string, string> = {
  TN: "Tennessee",
  NC: "North Carolina",
  VA: "Virginia",
  GA: "Georgia",
  SC: "South Carolina",
  AL: "Alabama",
  KY: "Kentucky",
  WV: "West Virginia",
};
export function publishedTrips(trips: Trip[]) {
  return trips
    .filter((trip) => trip.publicationState === "published" && trip.tripState === "completed")
    .sort((a, b) => b.month.localeCompare(a.month) || a.id.localeCompare(b.id));
}

export function filterTrips(trips: Trip[], year: string, state: string) {
  return publishedTrips(trips).filter(
    (trip) =>
      (year === "all" || trip.month.startsWith(`${year}-`)) &&
      (state === "all" || trip.states.some((entry) => entry === state)),
  );
}
export function aggregateTrips(trips: Trip[]) {
  const completed = publishedTrips(trips);
  return {
    tripCount: completed.length,
    distanceMiles:
      Math.round(completed.reduce((sum, trip) => sum + (trip.distanceMiles ?? 0), 0) * 10) / 10,
    elevationGainFt: completed.reduce((sum, trip) => sum + (trip.elevationGainFt ?? 0), 0),
    participations: completed.reduce((sum, trip) => sum + (trip.participantCount ?? 0), 0),
    states: [...new Set(completed.flatMap((trip) => trip.states))].sort(),
    missingDistances: completed.filter((trip) => trip.distanceMiles === null).length,
    missingElevations: completed.filter((trip) => trip.elevationGainFt === null).length,
  };
}
export function yearlyTotals(trips: Trip[]) {
  const completed = publishedTrips(trips);
  return [...new Set(completed.map((trip) => trip.month.slice(0, 4)))].sort().map((year) => ({
    year,
    ...aggregateTrips(completed.filter((trip) => trip.month.startsWith(year))),
  }));
}
export function formatMonth(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Expected a YYYY-MM date");
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, number - 1, 1)));
}
export const miles = (value: number | null) =>
  value === null ? "Not recorded" : `${value.toFixed(1)} mi`;
export const feet = (value: number | null) =>
  value === null ? "Not recorded" : `${value.toLocaleString("en-US")} ft`;
