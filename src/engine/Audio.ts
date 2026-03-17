let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Unlock AudioContext on first user gesture (required by browsers) */
export function unlockAudio() {
  const resume = () => {
    if (ctx?.state === "suspended") ctx.resume();
  };
  for (const evt of ["touchstart", "mousedown", "keydown"]) {
    window.addEventListener(evt, resume, { once: false, passive: true });
  }
}

/** Rate-limited sound player — prevents audio spam from rapid physics events. */
class RateLimitedSound {
  private lastTime = 0;
  private active = 0;
  private cooldown: number;
  private maxConcurrent: number;
  private play: (ac: AudioContext, now: number, intensity: number, onEnded: () => void) => void;

  constructor(
    cooldown: number,
    maxConcurrent: number,
    play: (ac: AudioContext, now: number, intensity: number, onEnded: () => void) => void,
  ) {
    this.cooldown = cooldown;
    this.maxConcurrent = maxConcurrent;
    this.play = play;
  }

  trigger(intensity: number): void {
    const ac = getCtx();
    if (ac.state === "suspended") return;
    const now = ac.currentTime;

    if (now - this.lastTime < this.cooldown) return;
    if (this.active >= this.maxConcurrent) return;
    this.lastTime = now;
    this.active++;

    this.play(ac, now, intensity, () => {
      this.active--;
    });
  }
}

const bounceSound = new RateLimitedSound(0.04, 3, (ac, now, intensity, onEnded) => {
  const vol = 0.02 + intensity * intensity * 0.35;
  const pitch = 250 + (1 - intensity) * 600;
  const dur = 0.03 + intensity * 0.1;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, now + dur);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur);
  osc.onended = onEnded;
});

const woodSound = new RateLimitedSound(0.05, 3, (ac, now, intensity, onEnded) => {
  const vol = 0.015 + intensity * intensity * 0.25;
  const dur = 0.02 + intensity * 0.05;

  const len = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 800 + (1 - intensity) * 600;
  bp.Q.value = 2;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(bp).connect(gain).connect(ac.destination);
  src.start(now);
  src.stop(now + dur);
  src.onended = onEnded;
});

/** Short bounce thud — rate-limited to avoid overwhelming audio */
export function playBounce(intensity: number) {
  bounceSound.trigger(intensity);
}

/** Woody clack for box/polygon collisions — rate-limited */
export function playWoodHit(intensity: number) {
  woodSound.trigger(intensity);
}

/** Synthesized explosion: filtered noise burst + low-frequency boom */
export function playExplosion(volume = 0.5) {
  const ac = getCtx();
  if (ac.state === "suspended") ac.resume();
  const now = ac.currentTime;

  // --- Noise burst (crackle / blast) ---
  const noiseDur = 0.4;
  const noiseLen = Math.ceil(ac.sampleRate * noiseDur);
  const noiseBuf = ac.createBuffer(1, noiseLen, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseSrc = ac.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  // Bandpass to shape the noise
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(800, now);
  bp.frequency.exponentialRampToValueAtTime(200, now + noiseDur);
  bp.Q.value = 0.8;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

  noiseSrc.connect(bp).connect(noiseGain).connect(ac.destination);
  noiseSrc.start(now);
  noiseSrc.stop(now + noiseDur);

  // --- Low boom (sub bass) ---
  const boomDur = 0.5;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + boomDur);

  const boomGain = ac.createGain();
  boomGain.gain.setValueAtTime(volume * 0.8, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + boomDur);

  osc.connect(boomGain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + boomDur);

  // --- Mid-frequency crunch ---
  const crunchDur = 0.25;
  const crunchBuf = ac.createBuffer(1, Math.ceil(ac.sampleRate * crunchDur), ac.sampleRate);
  const crunchData = crunchBuf.getChannelData(0);
  for (let i = 0; i < crunchData.length; i++) {
    crunchData[i] = Math.random() * 2 - 1;
  }

  const crunchSrc = ac.createBufferSource();
  crunchSrc.buffer = crunchBuf;

  const crunchBp = ac.createBiquadFilter();
  crunchBp.type = "bandpass";
  crunchBp.frequency.setValueAtTime(2000, now);
  crunchBp.frequency.exponentialRampToValueAtTime(400, now + crunchDur);
  crunchBp.Q.value = 1.5;

  const crunchGain = ac.createGain();
  crunchGain.gain.setValueAtTime(volume * 0.4, now);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + crunchDur);

  crunchSrc.connect(crunchBp).connect(crunchGain).connect(ac.destination);
  crunchSrc.start(now);
  crunchSrc.stop(now + crunchDur);
}
