"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["/adventures", "Adventures"],
  ["/our-story", "Our story"],
  ["/our-journey", "Our journey"],
  ["/partner-with-us", "Partner with us"],
];
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Main navigation" className="navigation">
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-links"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close menu" : "Menu"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <ul
        id="main-links"
        className={open ? "nav-links is-open" : "nav-links"}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
          }
        }}
      >
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
