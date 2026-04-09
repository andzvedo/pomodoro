import type { AlarmSoundId } from "./pomodoro-types";

let audioCtx: AudioContext | null = null;

export const ALARM_SOUND_OPTIONS: {
  id: AlarmSoundId;
  label: string;
  description: string;
}[] = [
  {
    id: "triple",
    label: "Três tons",
    description: "Três notas descendentes suaves",
  },
  {
    id: "digital",
    label: "Digital",
    description: "Bipes curtos em sequência",
  },
  {
    id: "soft",
    label: "Suave",
    description: "Um único tom longo e calmo",
  },
  {
    id: "beep",
    label: "Duplo bipe",
    description: "Dois bipes rápidos clássicos",
  },
];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    audioCtx = new AC();
  }
  return audioCtx;
}

/**
 * Chame após um gesto do utilizador (ex.: Iniciar o temporizador).
 * Sem isto, muitos browsers mantêm o AudioContext suspenso e o alarme no fim da fase não toca.
 */
export function primeAlarmAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => {
    /* ignorar */
  });
}

function scheduleTone(
  ctx: AudioContext,
  startTime: number,
  frequencyHz: number,
  durationSec: number,
  peakGain: number,
  wave: OscillatorType = "sine",
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = frequencyHz;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t0 = startTime;
  const attack = 0.015;
  const release = Math.max(0.05, durationSec - attack);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  osc.start(t0);
  osc.stop(t0 + attack + release + 0.02);
}

function playTripleAlarm(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const step = 0.38;
  scheduleTone(ctx, now + 0, 880, 0.22, 0.18, "sine");
  scheduleTone(ctx, now + step, 660, 0.22, 0.16, "sine");
  scheduleTone(ctx, now + step * 2, 523, 0.28, 0.14, "sine");
}

function playDigitalAlarm(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const step = 0.14;
  for (let i = 0; i < 5; i++) {
    scheduleTone(ctx, now + i * step, 1040, 0.08, 0.065, "square");
  }
}

function playSoftAlarm(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 392;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const dur = 0.95;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

function playBeepAlarm(ctx: AudioContext): void {
  const now = ctx.currentTime;
  scheduleTone(ctx, now, 880, 0.12, 0.16, "sine");
  scheduleTone(ctx, now + 0.22, 880, 0.12, 0.16, "sine");
}

function playAlarmById(ctx: AudioContext, sound: AlarmSoundId): void {
  switch (sound) {
    case "triple":
      playTripleAlarm(ctx);
      break;
    case "digital":
      playDigitalAlarm(ctx);
      break;
    case "soft":
      playSoftAlarm(ctx);
      break;
    case "beep":
      playBeepAlarm(ctx);
      break;
    default: {
      const _e: never = sound;
      return _e;
    }
  }
}

/**
 * Alarme quando o tempo da fase chega a zero.
 */
export function playPhaseAlarm(sound: AlarmSoundId): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const run = (): void => {
    try {
      playAlarmById(ctx, sound);
    } catch {
      /* ignorar */
    }
  };

  if (ctx.state === "suspended") {
    void ctx.resume().then(run).catch(run);
  } else {
    run();
  }
}

/** Pré-escuta no diálogo de ajustes (requer clique do utilizador). */
export function previewAlarmSound(sound: AlarmSoundId): void {
  primeAlarmAudio();
  playPhaseAlarm(sound);
}
