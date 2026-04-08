import type { PomodoroState } from "./pomodoro-types";
import { createInitialState, DEFAULT_SETTINGS } from "./pomodoro-reducer";

const STORAGE_KEY = "pomodoro-app-state-v1";

export type PersistedPomodoro = Omit<PomodoroState, "isRunning">;

export function loadPomodoroState(): PomodoroState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPomodoro;
    const base = createInitialState({
      ...DEFAULT_SETTINGS,
      ...parsed.settings,
    });
    return {
      ...base,
      ...parsed,
      isRunning: false,
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
      },
    };
  } catch {
    return null;
  }
}

export function savePomodoroState(state: PomodoroState): void {
  if (typeof window === "undefined") return;
  try {
    const { isRunning, ...persisted } = state;
    void isRunning;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* ignore quota */
  }
}

export function clearPomodoroStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
