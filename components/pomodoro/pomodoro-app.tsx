"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { ALARM_SOUND_OPTIONS, previewAlarmSound } from "@/lib/chime";
import { AUTO_CONTINUE_DELAY_SECONDS } from "@/lib/pomodoro-constants";
import { formatMmSs } from "@/lib/format-time";
import { modeDurationSeconds } from "@/lib/pomodoro-reducer";
import type { AlarmSoundId, PomodoroMode, PomodoroSettings } from "@/lib/pomodoro-types";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw, Settings2, SkipForward } from "lucide-react";

function modeLabel(mode: PomodoroMode): string {
  switch (mode) {
    case "focus":
      return "Foco";
    case "shortBreak":
      return "Pausa curta";
    case "longBreak":
      return "Pausa longa";
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}

function modeDescription(mode: PomodoroMode): string {
  switch (mode) {
    case "focus":
      return "Trabalhe numa única tarefa até o sino.";
    case "shortBreak":
      return "Respire. Distancie-se da tela por instantes.";
    case "longBreak":
      return "Pausa longa — renove antes do próximo ciclo.";
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}

export function PomodoroApp() {
  const {
    state,
    dispatch,
    start,
    pause,
    reset,
    skipPhase,
    autoStartCountdown,
    cancelAutoContinue,
  } = usePomodoro();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState<PomodoroSettings>(
    state.settings,
  );

  const onSettingsOpenChange = (open: boolean) => {
    if (open) {
      setDraftSettings(state.settings);
    }
    setSettingsOpen(open);
  };

  const totalSeconds = useMemo(
    () => modeDurationSeconds(state.mode, state.settings),
    [state.mode, state.settings],
  );
  const progress = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return state.secondsRemaining / totalSeconds;
  }, [state.secondsRemaining, totalSeconds]);

  const toggleRun = useCallback(() => {
    if (state.isRunning) pause();
    else start();
  }, [pause, start, state.isRunning]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest("input, textarea, [contenteditable='true']") ||
        settingsOpen
      ) {
        return;
      }
      e.preventDefault();
      toggleRun();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRun, settingsOpen]);

  const onReset = () => {
    if (
      state.secondsRemaining === totalSeconds &&
      !state.isRunning &&
      state.mode === "focus" &&
      state.marksInCycle === 0
    ) {
      return;
    }
    if (
      window.confirm("Reiniciar o temporizador e o ciclo atual?")
    ) {
      reset();
    }
  };

  const ringStyle = useMemo(() => {
    const r = 118;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - progress);
    return { strokeDasharray: `${c}px`, strokeDashoffset: `${offset}px` };
  }, [progress]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col items-center gap-12 px-6 py-14 md:px-10 lg:py-20">
      <header className="absolute right-6 top-8 md:right-10">
        <Dialog open={settingsOpen} onOpenChange={onSettingsOpenChange}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2 font-sans">
                <Settings2 className="size-4" aria-hidden />
                Ajustes
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg tracking-tight">
                Ajustes
              </DialogTitle>
              <DialogDescription>
                Durações dos blocos e som ao terminar cada fase. Tempos típicos
                da técnica: 25 / 5 / 20 minutos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="focus-m">Foco (min)</Label>
                <Input
                  id="focus-m"
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={120}
                  value={draftSettings.focusMinutes}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      focusMinutes: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="short-m">Pausa curta (min)</Label>
                <Input
                  id="short-m"
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={60}
                  value={draftSettings.shortBreakMinutes}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      shortBreakMinutes: Math.max(
                        1,
                        Number(e.target.value) || 1,
                      ),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="long-m">Pausa longa (min)</Label>
                <Input
                  id="long-m"
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={90}
                  value={draftSettings.longBreakMinutes}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      longBreakMinutes: Math.max(
                        1,
                        Number(e.target.value) || 1,
                      ),
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="grid min-w-0 flex-1 gap-2">
                    <Label htmlFor="alarm-sound">Som do alarme</Label>
                    <select
                      id="alarm-sound"
                      className={cn(
                        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors",
                        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      value={draftSettings.alarmSound}
                      onChange={(e) =>
                        setDraftSettings((s) => ({
                          ...s,
                          alarmSound: e.target.value as AlarmSoundId,
                        }))
                      }
                    >
                      {ALARM_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label} — {opt.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 font-sans"
                    onClick={() =>
                      previewAlarmSound(draftSettings.alarmSound)
                    }
                  >
                    Ouvir exemplo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O alarme toca automaticamente quando o tempo de uma fase chega
                  a zero.
                </p>
              </div>
              <Separator />
              <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
                <input
                  type="checkbox"
                  id="auto-continue"
                  checked={draftSettings.autoContinueAfterPhase}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      autoContinueAfterPhase: e.target.checked,
                    }))
                  }
                  className="mt-1 size-4 shrink-0 rounded border border-input"
                  aria-describedby="auto-continue-desc"
                />
                <div className="grid min-w-0 gap-1">
                  <Label
                    htmlFor="auto-continue"
                    className="cursor-pointer font-sans font-medium leading-snug"
                  >
                    Continuidade automática
                  </Label>
                  <p
                    id="auto-continue-desc"
                    className="text-xs leading-relaxed text-muted-foreground"
                  >
                    Inicia a fase seguinte {AUTO_CONTINUE_DELAY_SECONDS}{" "}
                    segundos após o alarme ao fim da anterior (sem precisar de
                    carregar em Iniciar).
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="border-0 bg-transparent p-4 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (state.isRunning) pause();
                  dispatch({ type: "APPLY_SETTINGS", settings: draftSettings });
                  setSettingsOpen(false);
                }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="flex w-full max-w-xl flex-col items-center gap-10 text-center">
        <div className="w-full">
          <p className="font-heading text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Técnica pomodoro
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Ritmo quieto,
            <br />
            foco profundo.
          </h1>
        </div>

        <div className="relative flex w-full flex-col items-center">
          <div
            className="relative flex aspect-square w-full max-w-[min(100%,20rem)] items-center justify-center"
            aria-hidden
          >
            <svg
              className="absolute size-full -rotate-90 text-border"
              viewBox="0 0 256 256"
            >
              <circle
                cx="128"
                cy="128"
                r="118"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                opacity={0.35}
              />
              <circle
                cx="128"
                cy="128"
                r="118"
                fill="none"
                stroke="currentColor"
                className={cn(
                  "text-primary transition-[stroke-dashoffset] duration-300 ease-out",
                  state.mode === "focus" && "text-primary",
                  state.mode === "shortBreak" && "text-muted-foreground",
                  state.mode === "longBreak" && "text-muted-foreground",
                )}
                strokeWidth="2"
                strokeLinecap="round"
                style={ringStyle}
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span
                className="font-heading text-[clamp(3.5rem,12vw,5rem)] font-medium tabular-nums tracking-tight text-foreground"
                aria-live="polite"
              >
                {formatMmSs(state.secondsRemaining)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {modeLabel(state.mode)}
              </span>
            </div>
          </div>

          <p className="mt-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            {modeDescription(state.mode)}
          </p>

          {autoStartCountdown !== null && (
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium text-foreground" aria-live="polite">
                A iniciar em {autoStartCountdown}s…
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-sans text-muted-foreground"
                onClick={cancelAutoContinue}
              >
                Cancelar início automático
              </Button>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              size="lg"
              className="min-w-36 gap-2 font-sans"
              onClick={toggleRun}
            >
              {state.isRunning ? (
                <>
                  <Pause className="size-4" aria-hidden />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="size-4" aria-hidden />
                  Iniciar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="font-sans"
              onClick={onReset}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reiniciar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="font-sans text-muted-foreground"
              onClick={() => {
                if (
                  window.confirm(
                    "Saltar esta fase e avançar para a seguinte?",
                  )
                ) {
                  skipPhase();
                }
              }}
            >
              <SkipForward className="size-4" aria-hidden />
              Saltar fase
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tecla espaço inicia ou pausa quando não estiver a escrever.
          </p>
        </div>

        <div className="w-full max-w-xl rounded-lg border border-border/80 bg-card/60 px-5 py-4 text-sm text-muted-foreground backdrop-blur-sm">
          <p>
            <span className="font-medium text-foreground">
              Marcações neste ciclo: {state.marksInCycle}
            </span>{" "}
            — após quatro focos completos segue a pausa longa (a contagem
            reinicia).
          </p>
        </div>
      </section>
    </div>
  );
}
