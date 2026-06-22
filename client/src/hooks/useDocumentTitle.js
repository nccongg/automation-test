/**
 * useDocumentTitle — keeps the browser tab title in sync with the page.
 *
 * Usage:
 *   useDocumentTitle("Test Cases");      // → "Test Cases · AutoTesting"
 *   useDocumentTitle();                  // → "AutoTesting"
 */

import { useEffect } from "react";

const APP_NAME = "AutoTesting";

export function formatTitle(title) {
  return title ? `${title} · ${APP_NAME}` : APP_NAME;
}

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = formatTitle(title);
  }, [title]);
}

/**
 * Resolves a human-readable page title from a router pathname.
 * Used by the app shell so every route gets a sensible tab title
 * without each page wiring the hook individually.
 */
const SEGMENT_TITLES = {
  "": "Dashboard",
  projects: "Projects",
  "test-cases": "Test Cases",
  "test-runs": "Test Runs",
  suites: "Test Suites",
  collections: "Collections",
  data: "Data",
  objects: "Object Repository",
  settings: "Settings",
};

export function titleFromPathname(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return SEGMENT_TITLES[""];

  // Walk from the most specific known segment backwards.
  for (let i = segments.length - 1; i >= 0; i--) {
    const label = SEGMENT_TITLES[segments[i]];
    if (label) return label;
  }
  return SEGMENT_TITLES.projects;
}
