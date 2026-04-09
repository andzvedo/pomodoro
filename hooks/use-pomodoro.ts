"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { playPhaseAlarm, primeAlarmAudio } from "@/lib/chime";
import { AUTO_CONTINUE_DELAY_SECONDS } from "@/lib/pomodoro-constants";
import {
  createInitialState,
  pomodoroReducer,
} from "@/lib/pomodoro-reducer";
import type { PomodoroAction } from "@/lib/pomodoro-reducer";
import { loadPomodoroState, savePomodoroState } from "@/lib/pomodoro-storage";
import type { PomodoroState } from "@/lib/pomodoro-types";

function reducerWithInit(
  state: PomodoroState,
  action: PomodoroAction,
): PomodoroState {
  return pomodoroReducer(state, action);
}

/** Estado inicial no cliente: localStorage sem passo de hidratação assíncrona (evita bloqueio no Electron). */
function createClientInitialState(): PomodoroState {
  if (typeof window === "undefined") {
    return createInitialState();
  }
  try {
    const saved = loadPomodoroState();
    if (saved) {
      return pomodoroReducer(createInitialState(), {
        type: "HYDRATE",
        state: saved,
      });
    }
  } catch {
    /* ignore */
  }
  return createInitialState();
}

export function usePomodoro() {
  const [state, dispatch] = useReducer(
    reducerWithInit,
    undefined,
    createClientInitialState,
  );
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(
    null,
  );

  const endAtRef = useRef<number | null>(null);
  const alarmSoundRef = useRef(state.settings.alarmSound);
  const stateRef = useRef(state);
  const autoStartIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    alarmSoundRef.current = state.settings.alarmSound;
  }, [state.settings.alarmSound]);

  const clearAutoContinueSchedule = useCallback(() => {
    if (autoStartIntervalRef.current !== null) {
      clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }
    setAutoStartCountdown(null);
  }, []);

  const start = useCallback(() => {
    clearAutoContinueSchedule();
    primeAlarmAudio();
    endAtRef.current = Date.now() + stateRef.current.secondsRemaining * 1000;
    dispatch({ type: "START" });
  }, [clearAutoContinueSchedule]);

  const scheduleAutoContinue = useCallback(() => {
    clearAutoContinueSchedule();
    let remaining = AUTO_CONTINUE_DELAY_SECONDS;
    setAutoStartCountdown(remaining);
    autoStartIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (autoStartIntervalRef.current !== null) {
          clearInterval(autoStartIntervalRef.current);
          autoStartIntervalRef.current = null;
        }
        setAutoStartCountdown(null);
        start();
      } else {
        setAutoStartCountdown(remaining);
      }
    }, 1000);
  }, [clearAutoContinueSchedule, start]);

  const scheduleAutoContinueRef = useRef(scheduleAutoContinue);
  useEffect(() => {
    scheduleAutoContinueRef.current = scheduleAutoContinue;
  }, [scheduleAutoContinue]);

  useEffect(() => {
    savePomodoroState(state);
  }, [state]);

  useEffect(() => {
    if (!state.settings.autoContinueAfterPhase) {
      queueMicrotask(() => {
        clearAutoContinueSchedule();
      });
    }
  }, [state.settings.autoContinueAfterPhase, clearAutoContinueSchedule]);

  useEffect(() => {
    return () => {
      if (autoStartIntervalRef.current !== null) {
        clearInterval(autoStartIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;
    const tick = () => {
      if (!endAtRef.current) return;
      const rem = Math.max(
        0,
        Math.ceil((endAtRef.current - Date.now()) / 1000),
      );
      if (rem <= 0) {
        endAtRef.current = null;
        const shouldAutoContinue =
          stateRef.current.settings.autoContinueAfterPhase;
        playPhaseAlarm(alarmSoundRef.current);
        dispatch({ type: "PHASE_COMPLETE" });
        if (shouldAutoContinue) {
          scheduleAutoContinueRef.current();
        }
        return;
      }
      dispatch({ type: "TICK", secondsRemaining: rem });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
    if (autoStartCountdown !== null) {
      document.title = `A iniciar em ${autoStartCountdown}s… — Pomodoro`;
      return () => {
        document.title = "Pomodoro";
      };
    }
    const label =
      state.mode === "focus"
        ? "Foco"
        : state.mode === "shortBreak"
          ? "Pausa curta"
          : "Pausa longa";
    const mm = String(Math.floor(state.secondsRemaining / 60)).padStart(
      2,
      "0",
    );
    const ss = String(state.secondsRemaining % 60).padStart(2, "0");
    document.title = `${mm}:${ss} · ${label} — Pomodoro`;
    return () => {
      document.title = "Pomodoro";
    };
  }, [state.mode, state.secondsRemaining, autoStartCountdown]);

  const pause = useCallback(() => {
    if (endAtRef.current) {
      const rem = Math.max(
        0,
        Math.ceil((endAtRef.current - Date.now()) / 1000),
      );
      endAtRef.current = null;
      dispatch({ type: "PAUSE", secondsRemaining: rem });
    } else {
      dispatch({ type: "PAUSE" });
    }
  }, []);

  const reset = useCallback(() => {
    endAtRef.current = null;
    clearAutoContinueSchedule();
    dispatch({ type: "RESET", confirmDiscard: true });
  }, [clearAutoContinueSchedule]);

  const skipPhase = useCallback(() => {
    endAtRef.current = null;
    clearAutoContinueSchedule();
    dispatch({ type: "SKIP_PHASE" });
  }, [clearAutoContinueSchedule]);

  const cancelAutoContinue = useCallback(() => {
    clearAutoContinueSchedule();
  }, [clearAutoContinueSchedule]);

  return {
    state,
    dispatch,
    start,
    pause,
    reset,
    skipPhase,
    autoStartCountdown,
    cancelAutoContinue,
  };
}
