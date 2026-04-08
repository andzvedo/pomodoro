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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { formatMmSs } from "@/lib/format-time";
import { modeDurationSeconds } from "@/lib/pomodoro-reducer";
import type { PomodoroMode, PomodoroSettings } from "@/lib/pomodoro-types";
import { cn } from "@/lib/utils";
import {
  ListTodo,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  StickyNote,
} from "lucide-react";

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
  const { state, dispatch, start, pause, reset, skipPhase, hydrated } =
    usePomodoro();
  const [taskInput, setTaskInput] = useState("");
  const [distractionDraft, setDistractionDraft] = useState("");
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
      window.confirm(
        "Reiniciar o temporizador e o ciclo atual? As tarefas permanecem.",
      )
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

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-14 md:flex-row md:gap-16 md:px-10 lg:py-20">
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
                Durações
              </DialogTitle>
              <DialogDescription>
                Tempos sugeridos pela técnica: 25 / 5 / 20 minutos. Ajuste ao
                seu ritmo.
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
            </div>
            <DialogFooter className="border-0 bg-transparent p-0 sm:justify-between">
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

      <section className="flex flex-1 flex-col items-start gap-10 md:max-w-xl">
        <div>
          <p className="font-heading text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Técnica pomodoro
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Ritmo quieto,
            <br />
            foco profundo.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Blocos de trabalho com pausas deliberadas. Uma marcação por pomodoro
            concluído; ao quarto, pausa longa — como na versão original de
            Francesco Cirillo.
          </p>
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

        <div className="w-full rounded-lg border border-border/80 bg-card/60 px-5 py-4 text-sm text-muted-foreground backdrop-blur-sm">
          <p>
            <span className="font-medium text-foreground">
              Marcações neste ciclo: {state.marksInCycle}
            </span>{" "}
            — após quatro focos completos segue a pausa longa (a contagem
            reinicia).
          </p>
        </div>
      </section>

      <aside className="flex w-full flex-col gap-8 md:max-w-md md:pt-10">
        <Card className="border-border/90 bg-card/80 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <ListTodo className="size-4 text-primary" aria-hidden />
              Tarefas
            </CardTitle>
            <CardDescription>
              Escolha o que faz neste momento. A tarefa ativa acompanha o foco.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                dispatch({ type: "ADD_TASK", title: taskInput });
                setTaskInput("");
              }}
            >
              <Input
                placeholder="Nova tarefa…"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="font-sans"
              />
              <Button type="submit" variant="secondary">
                Adicionar
              </Button>
            </form>
            <Separator />
            <ul className="space-y-2">
              {state.tasks.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nenhuma tarefa ainda. Escreva a primeira acima.
                </li>
              ) : (
                state.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 rounded-md border border-transparent px-1 py-1.5 hover:border-border"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() =>
                        dispatch({ type: "TOGGLE_TASK", id: t.id })
                      }
                      className="mt-1 size-4 rounded border-border"
                      aria-label={`Concluir ${t.title}`}
                    />
                    <button
                      type="button"
                      className={cn(
                        "flex-1 text-left text-sm leading-snug",
                        t.done && "text-muted-foreground line-through",
                        state.activeTaskId === t.id &&
                          "font-semibold text-foreground",
                      )}
                      onClick={() =>
                        dispatch({ type: "SET_ACTIVE_TASK", id: t.id })
                      }
                    >
                      {t.title}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="shrink-0 text-muted-foreground"
                      onClick={() =>
                        dispatch({ type: "DELETE_TASK", id: t.id })
                      }
                    >
                      Remover
                    </Button>
                  </li>
                ))
              )}
            </ul>
            {activeTask ? (
              <p className="text-xs text-muted-foreground">
                Ativa:{" "}
                <span className="font-medium text-foreground">
                  {activeTask.title}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sem tarefa ativa — selecione uma na lista.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/90 bg-card/80 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <StickyNote className="size-4 text-primary" aria-hidden />
              Distrações
            </CardTitle>
            <CardDescription>
              Se surgir algo urgente, registe e volte ao foco — sem parar o
              relógio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Anotação rápida…"
              value={distractionDraft}
              onChange={(e) => setDistractionDraft(e.target.value)}
              rows={2}
              className="resize-none font-sans text-sm"
              disabled={state.mode !== "focus"}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full font-sans"
              disabled={state.mode !== "focus"}
              onClick={() => {
                dispatch({ type: "ADD_DISTRACTION", text: distractionDraft });
                setDistractionDraft("");
              }}
            >
              Registar e continuar
            </Button>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {state.distractions.length === 0 ? (
                <li className="text-muted-foreground">
                  Ainda sem notas de distração.
                </li>
              ) : (
                state.distractions.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
                  >
                    <span className="leading-snug">{d.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="shrink-0"
                      onClick={() =>
                        dispatch({ type: "REMOVE_DISTRACTION", id: d.id })
                      }
                    >
                      ✕
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
