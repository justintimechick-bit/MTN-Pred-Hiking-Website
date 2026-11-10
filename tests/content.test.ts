import { test } from "node:test";
import assert from "node:assert/strict";
import data from "../src/content/public/content.json";
import { contentSchema, tripSchema, profileSchema } from "../src/lib/schema";
import {
  aggregateTrips,
  publishedTrips,
  yearlyTotals,
  formatMonth,
  miles,
  filterTrips,
} from "../src/lib/trips";

const content = contentSchema.parse(data);
test("archive filters compose across year and state, preserve sort, and handle empty matches", () => {
  assert.deepEqual(
    filterTrips(content.trips, "2026", "all").map((trip) => trip.id),
    ["t-007", "t-006", "t-005"],
  );
  assert.deepEqual(
    filterTrips(content.trips, "2026", "VA").map((trip) => trip.id),
    ["t-007"],
  );
  assert.equal(filterTrips(content.trips, "2023", "VA").length, 0);
  assert.equal(filterTrips(content.trips, "all", "all").length, 7);
});
test("approved history reconciles route totals and participation meaning", () => {
  assert.deepEqual(aggregateTrips(content.trips), {
    tripCount: 7,
    distanceMiles: 105.9,
    elevationGainFt: 19920,
    participations: 75,
    states: ["NC", "TN", "VA"],
    missingDistances: 0,
    missingElevations: 0,
  });
});
test("drafts and planned trips cannot affect public totals", () => {
  const draft = { ...content.trips[0], id: "t-100", publicationState: "draft" as const };
  const planned = { ...content.trips[0], id: "t-101", tripState: "planned" as const };
  assert.deepEqual(
    aggregateTrips([...content.trips, draft, planned]),
    aggregateTrips(content.trips),
  );
});
test("combined routes count once, with unique states", () => {
  const totals = aggregateTrips([content.trips[0]]);
  assert.equal(totals.tripCount, 1);
  assert.equal(totals.distanceMiles, 21.5);
  assert.deepEqual(totals.states, ["NC", "TN"]);
  assert.equal(
    tripSchema.safeParse({ ...content.trips[0], componentRoutes: undefined }).success,
    false,
  );
});
test("month formatting has no inferred hiking day or timezone drift", () => {
  assert.equal(formatMonth("2023-10"), "October 2023");
  assert.equal(formatMonth("2026-03"), "March 2026");
  assert.throws(() => formatMonth("2026-03-01"));
  assert.throws(() => formatMonth("2026-13"));
});
test("new published completed trip updates shared totals and annual history", () => {
  const extra = tripSchema.parse({
    ...content.trips[6],
    id: "t-008",
    slug: "t-008",
    month: "2027-02",
    distanceMiles: 10,
    elevationGainFt: 1000,
    participantCount: null,
  });
  const updated = [...content.trips, extra];
  assert.equal(aggregateTrips(updated).tripCount, 8);
  assert.equal(aggregateTrips(updated).distanceMiles, 115.9);
  assert.equal(yearlyTotals(updated).at(-1)?.year, "2027");
  assert.equal(publishedTrips(updated)[0].id, "t-008");
});
test("unknown metrics remain unknown and disclose incomplete totals", () => {
  const trip = { ...content.trips[0], distanceMiles: null, elevationGainFt: null };
  assert.equal(miles(trip.distanceMiles), "Not recorded");
  assert.equal(aggregateTrips([trip]).missingDistances, 1);
  assert.equal(aggregateTrips([trip]).missingElevations, 1);
});
test("schema fails closed on unexpected contact fields and exact-day dates", () => {
  assert.equal(
    tripSchema.safeParse({ ...content.trips[0], email: "not-real@example.invalid" }).success,
    false,
  );
  assert.equal(tripSchema.safeParse({ ...content.trips[0], month: "2023-10-01" }).success, false);
  assert.equal(contentSchema.safeParse({ ...data, roster: [] }).success, false);
});
test("profiles require explicit approval, stable IDs and first names without initials", () => {
  const profile = { id: "m-0001", publicApproval: true, displayName: "River", nameKind: "first" };
  assert.equal(profileSchema.safeParse(profile).success, true);
  assert.equal(profileSchema.safeParse({ ...profile, publicApproval: false }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, displayName: "River Q." }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, lastName: "test-only" }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, id: "river" }).success, false);
  assert.equal(content.profiles.length, 0);
});
test("duplicate identities and unapproved photo references fail validation", () => {
  assert.equal(
    contentSchema.safeParse({ ...data, trips: [data.trips[0], data.trips[0]] }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ ...data, trips: [{ ...data.trips[0], images: ["p-0001"] }] }).success,
    false,
  );
});
test("annual history derives from the same published records", () => {
  assert.deepEqual(
    yearlyTotals(content.trips).map(({ year, tripCount, distanceMiles }) => ({
      year,
      tripCount,
      distanceMiles,
    })),
    [
      { year: "2023", tripCount: 1, distanceMiles: 21.5 },
      { year: "2024", tripCount: 1, distanceMiles: 14.5 },
      { year: "2025", tripCount: 2, distanceMiles: 37.2 },
      { year: "2026", tripCount: 3, distanceMiles: 32.7 },
    ],
  );
});
