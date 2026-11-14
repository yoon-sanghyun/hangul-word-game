let audioCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || muted) return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundMuted(nextMuted: boolean) {
  muted = nextMuted;
}

export function isSoundMuted(): boolean {
  return muted;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
  volume = 0.08
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playTap() {
  playTone(520, 0.06, 'triangle', 0, 0.06);
}

export function playCorrect() {
  playTone(523.25, 0.12, 'sine', 0, 0.09); // C5
  playTone(659.25, 0.14, 'sine', 0.08, 0.09); // E5
  playTone(783.99, 0.22, 'sine', 0.16, 0.1); // G5
}

export function playWrong() {
  playTone(260, 0.12, 'triangle', 0, 0.06);
  playTone(210, 0.16, 'triangle', 0.09, 0.05);
}

export function playHint() {
  playTone(698.46, 0.1, 'sine', 0, 0.07); // F5
  playTone(880, 0.16, 'sine', 0.07, 0.07); // A5
}

export function playVictory() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    playTone(freq, i === notes.length - 1 ? 0.35 : 0.14, 'sine', i * 0.1, 0.1);
  });
}
