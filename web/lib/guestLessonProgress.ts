/** Guest lesson quiz state (device-local only; not synced cross-device). */

const STORAGE_KEY = "qw_guest_lesson_progress";

export type GuestLessonProgress = {
  completed: Record<string, boolean>;
  lastScore: Record<string, number>;
};

export function loadGuestLessonProgress(): GuestLessonProgress {
  if (typeof window === "undefined") return { completed: {}, lastScore: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {}, lastScore: {} };
    const parsed = JSON.parse(raw) as GuestLessonProgress;
    return {
      completed: parsed.completed ?? {},
      lastScore: parsed.lastScore ?? {},
    };
  } catch {
    return { completed: {}, lastScore: {} };
  }
}

export function recordGuestLessonAttempt(slug: string, correct: boolean): GuestLessonProgress {
  const current = loadGuestLessonProgress();
  const score = correct ? 100 : 0;
  const next: GuestLessonProgress = {
    completed: { ...current.completed, ...(correct ? { [`lesson:${slug}`]: true } : {}) },
    lastScore: { ...current.lastScore, [slug]: score },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}
