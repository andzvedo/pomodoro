import type {
  AlarmSoundId,
  PomodoroMode,
  PomodoroSettings,
  PomodoroState,
  Task,
} from "./pomodoro-types";

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 20,
  alarmSound: "triple",
  autoContinueAfterPhase: false,
};

export function normalizeAlarmSound(value: unknown): AlarmSoundId {
  if (
    value === "triple" ||
    value === "digital" ||
    value === "soft" ||
    value === "beep"
  ) {
    return value;
  }
  return DEFAULT_SETTINGS.alarmSound;
}

export function modeDurationSeconds(
  mode: PomodoroMode,
  settings: PomodoroSettings,
): number {
  switch (mode) {
    case "focus":
      return settings.focusMinutes * 60;
    case "shortBreak":
      return settings.shortBreakMinutes * 60;
    case "longBreak":
      return settings.longBreakMinutes * 60;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function createInitialState(
  settings: PomodoroSettings = DEFAULT_SETTINGS,
): PomodoroState {
  return {
    mode: "focus",
    secondsRemaining: modeDurationSeconds("focus", settings),
    isRunning: false,
    marksInCycle: 0,
    settings,
    tasks: [],
    activeTaskId: null,
    distractions: [],
  };
}

export type PomodoroAction =
  | { type: "START" }
  | { type: "PAUSE"; secondsRemaining?: number }
  | { type: "RESET"; confirmDiscard: boolean }
  | { type: "TICK"; secondsRemaining: number }
  | { type: "PHASE_COMPLETE" }
  | { type: "SKIP_PHASE" }
  | { type: "APPLY_SETTINGS"; settings: PomodoroSettings }
  | { type: "ADD_TASK"; title: string }
  | { type: "TOGGLE_TASK"; id: string }
  | { type: "DELETE_TASK"; id: string }
  | { type: "SET_ACTIVE_TASK"; id: string | null }
  | { type: "ADD_DISTRACTION"; text: string }
  | { type: "REMOVE_DISTRACTION"; id: string }
  | { type: "HYDRATE"; state: PomodoroState };

function nextModeAfterFocusComplete(
  marksBefore: number,
): { mode: PomodoroMode; marksInCycle: number } {
  const nextMarks = marksBefore + 1;
  if (nextMarks >= 4) {
    return { mode: "longBreak", marksInCycle: 0 };
  }
  return { mode: "shortBreak", marksInCycle: nextMarks };
}

export function pomodoroReducer(
  state: PomodoroState,
  action: PomodoroAction,
): PomodoroState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...action.state,
        isRunning: false,
        settings: {
          ...DEFAULT_SETTINGS,
          ...action.state.settings,
          alarmSound: normalizeAlarmSound(action.state.settings?.alarmSound),
          autoContinueAfterPhase:
            typeof action.state.settings?.autoContinueAfterPhase === "boolean"
              ? action.state.settings.autoContinueAfterPhase
              : DEFAULT_SETTINGS.autoContinueAfterPhase,
        },
      };

    case "START":
      return { ...state, isRunning: true };

    case "PAUSE":
      return {
        ...state,
        isRunning: false,
        ...(action.secondsRemaining !== undefined
          ? { secondsRemaining: action.secondsRemaining }
          : {}),
      };

    case "RESET": {
      if (!action.confirmDiscard) return state;
      return {
        ...state,
        isRunning: false,
        mode: "focus",
        marksInCycle: 0,
        secondsRemaining: modeDurationSeconds("focus", state.settings),
      };
    }

    case "TICK": {
      if (!state.isRunning) return state;
      return { ...state, secondsRemaining: action.secondsRemaining };
    }

    case "SKIP_PHASE":
      return transitionAfterPhaseEnd(state);

    case "PHASE_COMPLETE":
      return transitionAfterPhaseEnd(state);

    case "APPLY_SETTINGS": {
      const next = action.settings;
      const duration = modeDurationSeconds(state.mode, next);
      return {
        ...state,
        settings: next,
        secondsRemaining: state.isRunning ? state.secondsRemaining : duration,
      };
    }

    case "ADD_TASK": {
      const title = action.title.trim();
      if (!title) return state;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `t-${Date.now()}`;
      const task: Task = { id, title, done: false };
      const tasks = [...state.tasks, task];
      return {
        ...state,
        tasks,
        activeTaskId: state.activeTaskId ?? id,
      };
    }

    case "TOGGLE_TASK": {
      const tasks = state.tasks.map((t) =>
        t.id === action.id ? { ...t, done: !t.done } : t,
      );
      return { ...state, tasks };
    }

    case "DELETE_TASK": {
      const tasks = state.tasks.filter((t) => t.id !== action.id);
      const activeTaskId =
        state.activeTaskId === action.id ? null : state.activeTaskId;
      return { ...state, tasks, activeTaskId };
    }

    case "SET_ACTIVE_TASK":
      return { ...state, activeTaskId: action.id };

    case "ADD_DISTRACTION": {
      const text = action.text.trim();
      if (!text) return state;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `d-${Date.now()}`;
      return {
        ...state,
        distractions: [
          ...state.distractions,
          { id, text, createdAt: Date.now() },
        ],
      };
    }

    case "REMOVE_DISTRACTION":
      return {
        ...state,
        distractions: state.distractions.filter((d) => d.id !== action.id),
      };

    default: {
      const _never: never = action;
      return _never;
    }
  }
}

function transitionAfterPhaseEnd(state: PomodoroState): PomodoroState {
  const { mode, marksInCycle, settings } = state;

  switch (mode) {
    case "focus": {
      const next = nextModeAfterFocusComplete(marksInCycle);
      const seconds = modeDurationSeconds(next.mode, settings);
      return {
        ...state,
        mode: next.mode,
        marksInCycle: next.marksInCycle,
        secondsRemaining: seconds,
        isRunning: false,
      };
    }
    case "shortBreak": {
      const seconds = modeDurationSeconds("focus", settings);
      return {
        ...state,
        mode: "focus",
        secondsRemaining: seconds,
        isRunning: false,
      };
    }
    case "longBreak": {
      const seconds = modeDurationSeconds("focus", settings);
      return {
        ...state,
        mode: "focus",
        secondsRemaining: seconds,
        isRunning: false,
      };
    }
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
