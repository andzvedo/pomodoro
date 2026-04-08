"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  startTransition,
} from "react";
import { playPhaseChime } from "@/lib/chime";
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

export function usePomodoro() {
  const [hydrated, setHydrated] = useState(false);
  const [state, dispatch] = useReducer(
    reducerWithInit,
    undefined,
    () => createInitialState(),
  );
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadPomodoroState();
    startTransition(() => {
      if (saved) {
        dispatch({ type: "HYDRATE", state: saved });
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePomodoroState(state);
  }, [state, hydrated]);

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
        playPhaseChime();
        dispatch({ type: "PHASE_COMPLETE" });
        return;
      }
      dispatch({ type: "TICK", secondsRemaining: rem });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.isRunning]);

  useEffect(() => {
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
  }, [state.mode, state.secondsRemaining]);

  const start = useCallback(() => {
    endAtRef.current = Date.now() + state.secondsRemaining * 1000;
    dispatch({ type: "START" });
  }, [state.secondsRemaining]);

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
    dispatch({ type: "RESET", confirmDiscard: true });
  }, []);

  const skipPhase = useCallback(() => {
    endAtRef.current = null;
    dispatch({ type: "SKIP_PHASE" });
  }, []);

  return { state, dispatch, start, pause, reset, skipPhase, hydrated };
}
