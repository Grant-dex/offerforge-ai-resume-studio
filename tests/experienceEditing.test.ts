import assert from "node:assert/strict";
import test from "node:test";
import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import { applyExperienceMutation, captureRemovedExperience, moveExperience, restoreExperience, type RemovedExperience } from "../src/utils/experienceEditing.ts";

const entries = () => [
  { id: "a", name: "公司甲", bullets: ["甲的经历"] },
  { id: "b", name: "公司乙", bullets: ["乙的经历"] },
  { id: "c", name: "公司丙", bullets: ["丙的经历"] },
];

test("reordering changes only positions and does not mutate entries or their stable IDs", () => {
  const original = entries(), moved = moveExperience(original, "b", -1);
  assert.deepEqual(moved.map(item => item.id), ["b", "a", "c"]);
  assert.deepEqual(original.map(item => item.id), ["a", "b", "c"]);
  assert.equal(moved[0], original[1]);
  assert.deepEqual(moveExperience(moved, "b", 1), original);
  assert.equal(moveExperience(original, "a", -1), original);
  assert.equal(moveExperience(original, "c", 1), original);
  assert.equal(moveExperience(original, "missing", 1), original);
});

test("undo restores only the removed entry and retains edits or additions made afterward", () => {
  const original = entries(), removed = captureRemovedExperience(original, "b")!;
  const current = [original[0], { ...original[2], bullets: ["刚编辑的新成果"] }, { id: "d", name: "新公司", bullets: [] }];
  const restored = restoreExperience(current, removed, "resume-1", "resume-1");
  assert.deepEqual(restored.map(item => item.id), ["a", "b", "c", "d"]);
  assert.deepEqual(restored[2].bullets, ["刚编辑的新成果"]);
  assert.equal(restored[3], current[2]);
  assert.equal(current.length, 3);
  restored[1].bullets.push("恢复后的编辑");
  assert.deepEqual(removed.item.bullets, ["乙的经历"]);
});

test("undo restores multiple removals in reverse order including the final entry", () => {
  const original = entries(), b = captureRemovedExperience(original, "b")!;
  const remaining = [original[0], original[2]], a = captureRemovedExperience(remaining, "a")!, c = captureRemovedExperience([original[2]], "c")!;
  let restored = restoreExperience([], c, "same", "same");
  restored = restoreExperience(restored, a, "same", "same");
  restored = restoreExperience(restored, b, "same", "same");
  assert.deepEqual(restored, original);
  assert.equal(captureRemovedExperience(original, "missing"), null);
});

test("stale undo cannot cross drafts or replace an entry that already exists", () => {
  const original = entries(), removed = captureRemovedExperience(original, "b")!;
  const current = [original[0]];
  assert.equal(restoreExperience(current, removed, "old-draft", "new-draft"), current);
  assert.equal(restoreExperience(original, removed, "same", "same"), original);
});

test("undo uses surviving neighbors after reordering and a bounded fallback when both are gone", () => {
  const original = entries(), removed = captureRemovedExperience(original, "b")!;
  const reordered = [original[2], original[0]];
  assert.deepEqual(restoreExperience(reordered, removed, "same", "same").map(item => item.id), ["b", "c", "a"]);
  assert.deepEqual(restoreExperience([], removed, "same", "same").map(item => item.id), ["b"]);
});

type Entry = ReturnType<typeof entries>[number];
interface PersistedExperienceState {
  items: Entry[];
  remove: (id: string) => void;
  restore: (entry: RemovedExperience<Entry>) => void;
  add: () => string;
  move: (id: string, direction: -1 | 1) => void;
}

function failingPersistStore(initial: Entry[], errorName = "QuotaExceededError") {
  const saved = new Map<string, string>();
  let fail = false;
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (fail) throw new DOMException("Storage write failed", errorName);
      saved.set(key, value);
    },
    removeItem: (key: string) => saved.delete(key),
  };
  const store = createStore<PersistedExperienceState>()(persist((set, get) => {
    const mutate = (update: (state: PersistedExperienceState) => Partial<PersistedExperienceState>) =>
      applyExperienceMutation(() => get().items, () => set(update));
    return {
      items: initial,
      remove: id => mutate(state => ({ items: state.items.filter(item => item.id !== id) })),
      restore: removed => mutate(state => ({ items: restoreExperience(state.items, removed, "same", "same") })),
      add: () => {
        const id = "new-entry";
        mutate(state => ({ items: [...state.items, { id, name: "新增经历", bullets: [] }] }));
        return id;
      },
      move: (id, direction) => mutate(state => ({ items: moveExperience(state.items, id, direction) })),
    };
  }, { name: "experience-regression", storage: createJSONStorage(() => storage) }));
  store.setState({ items: initial });
  return { store, saved, failWrites: () => { fail = true; } };
}

test("real persist quota failure keeps a final-entry removal undoable and lets undo finish", () => {
  const { store, saved, failWrites } = failingPersistStore(entries().slice(0, 1));
  const originalCache = saved.get("experience-regression");
  const undo: RemovedExperience<Entry>[] = [];
  const removed = captureRemovedExperience(store.getState().items, "a")!;
  failWrites();
  // Match the UI: register recovery before calling the synchronous persisted action.
  undo.push(removed);
  assert.doesNotThrow(() => store.getState().remove("a"));
  assert.deepEqual(store.getState().items, []);
  assert.equal(undo.length, 1);
  assert.doesNotThrow(() => store.getState().restore(undo[undo.length - 1]));
  undo.pop();
  assert.deepEqual(store.getState().items, entries().slice(0, 1));
  assert.equal(undo.length, 0, "the caller can clear completed undo instead of leaving a stale action");
  assert.equal(saved.get("experience-regression"), originalCache, "failed persistence never reports itself as saved");
});

test("real persist security failure still returns the new entry ID and completes reordering", () => {
  const { store, failWrites } = failingPersistStore(entries(), "SecurityError");
  failWrites();
  let focusId = "";
  assert.doesNotThrow(() => { focusId = store.getState().add(); });
  assert.equal(focusId, "new-entry", "the editor can focus the added card after an unsuccessful storage write");
  assert.equal(store.getState().items.at(-1)?.id, focusId);
  assert.doesNotThrow(() => store.getState().move(focusId, -1));
  assert.deepEqual(store.getState().items.map(item => item.id), ["a", "b", "new-entry", "c"]);
});

test("experience persistence protection does not swallow failures before mutation or unrelated bugs", () => {
  let state = { value: 1 };
  assert.throws(() => applyExperienceMutation(() => state, () => { throw new DOMException("Denied", "SecurityError"); }), /Denied/);
  assert.throws(() => applyExperienceMutation(() => state, () => { state = { value: 2 }; throw new TypeError("Application bug"); }), /Application bug/);
});
