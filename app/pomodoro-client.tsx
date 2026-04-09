"use client";

import dynamic from "next/dynamic";

const PomodoroApp = dynamic(
  () =>
    import("@/components/pomodoro/pomodoro-app").then((m) => m.PomodoroApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-muted-foreground">
        A carregar…
      </div>
    ),
  },
);

export function PomodoroClient() {
  return <PomodoroApp />;
}
