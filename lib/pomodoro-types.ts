export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

/** Identificador do som ao terminar uma fase. */
export type AlarmSoundId = "triple" | "digital" | "soft" | "beep";

export type PomodoroSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  alarmSound: AlarmSoundId;
  /** Se true, após o fim de uma fase inicia a seguinte sozinha após AUTO_CONTINUE_DELAY_SECONDS. */
  autoContinueAfterPhase: boolean;
};

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export type Distraction = {
  id: string;
  text: string;
  createdAt: number;
};

export type PomodoroState = {
  mode: PomodoroMode;
  secondsRemaining: number;
  isRunning: boolean;
  /** Marcas no ciclo atual; após 4 focos completos → pausa longa e zera. */
  marksInCycle: number;
  settings: PomodoroSettings;
  tasks: Task[];
  activeTaskId: string | null;
  distractions: Distraction[];
};
