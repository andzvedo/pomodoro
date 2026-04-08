let audioCtx: AudioContext | null = null;

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

function scheduleBeep(
  ctx: AudioContext,
  startTime: number,
  frequencyHz: number,
  durationSec: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
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

function playAlarmSequence(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const step = 0.38;
  // Três tons descendentes — perceptível como “fim de fase” sem ser agressivo
  scheduleBeep(ctx, now + 0, 880, 0.22, 0.18);
  scheduleBeep(ctx, now + step, 660, 0.22, 0.16);
  scheduleBeep(ctx, now + step * 2, 523, 0.28, 0.14);
}

/**
 * Alarme quando o tempo da fase chega a zero.
 * Usa resume() porque o contexto pode voltar a “suspended” após inatividade.
 */
export function playPhaseAlarm(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const run = (): void => {
    try {
      playAlarmSequence(ctx);
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
