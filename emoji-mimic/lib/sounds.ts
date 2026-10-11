let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Kullanıcı etkileşimiyle (ör. "Başla" tıklaması) çağır; tarayıcı ses kilidini açar. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSuccess() {
  tone(660, 0, 0.12, "triangle");
  tone(880, 0.1, 0.12, "triangle");
  tone(1320, 0.2, 0.25, "triangle");
}

export function playSkip() {
  tone(300, 0, 0.09, "square", 0.08);
  tone(240, 0.08, 0.12, "square", 0.08);
}

export function playGameOver() {
  tone(523, 0, 0.18, "sine");
  tone(392, 0.18, 0.18, "sine");
  tone(262, 0.36, 0.4, "sine");
}
