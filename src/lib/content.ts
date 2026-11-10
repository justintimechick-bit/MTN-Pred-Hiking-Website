import "server-only";
import data from "@/content/public/content.json";
import { contentSchema } from "./schema";
import { publishedTrips } from "./trips";

// Build-time allowlist only. No private source reader or client-side filtering.
export const content = contentSchema.parse(data);
export const trips = publishedTrips(content.trips);
export const getTrip = (slug: string) => trips.find((trip) => trip.slug === slug);
