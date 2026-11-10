"use client";

import Link from "next/link";
import { useState } from "react";
import type { Trip } from "@/lib/schema";
import { formatMonth, miles, feet, stateNames, filterTrips } from "@/lib/trips";

export function Archive({ trips }: { trips: Trip[] }) {
  const [year, setYear] = useState("all");
  const [state, setState] = useState("all");
  const years = [...new Set(trips.map((trip) => trip.month.slice(0, 4)))];
  const states = [...new Set(trips.flatMap((trip) => trip.states))].sort();
  const filtered = filterTrips(trips, year, state);
  return (
    <>
      <div className="archive-tools">
        <div className="filters">
          <label>
            Year
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="all">All years</option>
              {years.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            State
            <select value={state} onChange={(event) => setState(event.target.value)}>
              <option value="all">All states</option>
              {states.map((value) => (
                <option key={value} value={value}>
                  {stateNames[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "adventure" : "adventures"}
        </p>
      </div>
      {filtered.length ? (
        <div className="archive-list">
          {filtered.map((trip) => (
            <article key={trip.id} className="archive-row">
              <time dateTime={trip.month}>{formatMonth(trip.month)}</time>
              <div>
                <p className="region">{trip.region}</p>
                <h2>
                  <Link href={`/adventures/${trip.slug}`}>{trip.title}</Link>
                </h2>
                <p>
                  {trip.states.map((code) => stateNames[code]).join(" / ")}
                  <span className="route-type">{trip.routeType}</span>
                </p>
              </div>
              <dl>
                <div>
                  <dt>Route miles</dt>
                  <dd>{miles(trip.distanceMiles)}</dd>
                </div>
                <div>
                  <dt>Listed gain</dt>
                  <dd>{feet(trip.elevationGainFt)}</dd>
                </div>
              </dl>
              <Link
                className="round-link"
                href={`/adventures/${trip.slug}`}
                aria-label={`View ${trip.title}`}
              >
                <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No adventures in this selection.</h2>
          <p>Try another year or state.</p>
          <button
            type="button"
            className="button"
            onClick={() => {
              setYear("all");
              setState("all");
            }}
          >
            Show all adventures
          </button>
        </div>
      )}
    </>
  );
}
