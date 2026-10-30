export interface IdentifiedExperience { id: string; }
export interface RemovedExperience<T extends IdentifiedExperience> {
  item: T;
  index: number;
  previousId?: string;
  nextId?: string;
}

/** Reorder the current array without changing any of its entries. */
export function moveExperience<T extends IdentifiedExperience>(items: T[], id: string, direction: -1 | 1): T[] {
  const index = items.findIndex(item => item.id === id), nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function captureRemovedExperience<T extends IdentifiedExperience>(items: T[], id: string): RemovedExperience<T> | null {
  const index = items.findIndex(item => item.id === id);
  if (index < 0) return null;
  return { item: structuredClone(items[index]), index, previousId: items[index - 1]?.id, nextId: items[index + 1]?.id };
}

/** Restore only the missing entry; preserve edits, additions, and ordering made since removal. */
export function restoreExperience<T extends IdentifiedExperience>(items: T[], removed: RemovedExperience<T>, sourceResumeId: string, currentResumeId: string): T[] {
  if (sourceResumeId !== currentResumeId || items.some(item => item.id === removed.item.id)) return items;
  const next = [...items];
  const before = next.findIndex(item => item.id === removed.nextId);
  const after = next.findIndex(item => item.id === removed.previousId);
  const index = before >= 0 ? before : after >= 0 ? after + 1 : Math.min(Math.max(0, removed.index), next.length);
  next.splice(index, 0, structuredClone(removed.item));
  return next;
}

/** Persist writes after updating memory. Keep local undo/focus working when only that write fails. */
export function applyExperienceMutation<T>(readCurrent: () => T, mutate: () => void): void {
  const before = readCurrent();
  try {
    mutate();
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const storageFailure = name === "QuotaExceededError" || name === "SecurityError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
    // Do not hide failures that left memory unchanged or unrelated application errors.
    if (!storageFailure || readCurrent() === before) throw error;
    // Sidebar observes the changed resume and reports the failed save through its existing retry.
  }
}
