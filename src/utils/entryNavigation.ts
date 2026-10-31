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

export interface SectionAnchor { key: string; top: number; bottom: number }

/** Match the pointer's content position, including the gutter leading to its button. */
export function previewEditTargetAtY(sections: SectionAnchor[], entries: EntryAnchor[], pages: PageRange[], pageIndex: number, y: number): string | null {
  const page = pages[pageIndex];
  if (!page || !Number.isFinite(y) || y < page.start || y >= page.end) return null;
  const entry = entriesStartingOnPage(entries, pages, pageIndex).find(item => y >= item.top && y < item.bottom);
  if (entry) return `entry:${entry.id}`;
  const section = sections.find(item => item.top >= page.start && item.top < page.end && y >= item.top && y < item.bottom);
  return section ? `section:${section.key}` : null;
}

/** Grow touch targets only into free space, avoiding adjacent entry controls. */
export function entryHitPadding(entries: EntryAnchor[], entry: EntryAnchor, scale: number): { top: number; bottom: number } {
  const sorted = [...entries].sort((a, b) => a.top - b.top);
  const index = sorted.findIndex(item => item.id === entry.id);
  const before = sorted[index - 1], after = sorted[index + 1];
  const freeAbove = before ? ((entry.top - before.top) * scale - 24) / 2 : 10;
  const freeBelow = after ? ((after.top - entry.top) * scale - 24) / 2 : 10;
  return { top: Math.max(0, Math.min(10, freeAbove)), bottom: Math.max(0, Math.min(10, freeBelow)) };
}
