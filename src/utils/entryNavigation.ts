export interface EntryAnchor {
  id: string;
  kind: "work" | "project";
  top: number;
  bottom: number;
  label: string;
}

export interface PageRange {
  start: number;
  end: number;
}

/** Entries whose first line starts on this page. Cross-page entries appear once. */
export function entriesStartingOnPage(entries: EntryAnchor[], pages: PageRange[], pageIndex: number): EntryAnchor[] {
  const page = pages[pageIndex];
  if (!page) return [];
  return entries.filter((entry) => entry.top >= page.start && entry.top < page.end);
}

/** Stable lookup by ID; never falls back to an index or another entry. */
export function findEntryById<T extends { id: string }>(items: T[], id: string): T | null {
  return items.find((item) => item.id === id) ?? null;
}
