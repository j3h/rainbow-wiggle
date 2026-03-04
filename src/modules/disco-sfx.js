let audioContext;
let masterGain;
let loopGain;
let discoInterval = null;
let discoEnabled = false;
let masterMuted = false;
let loopStartAudioTime = null;
let loopStartPerfTime = null;
let nextBarAudioTime = null;

const BPM = 120;
const BEAT_SECONDS = 60 / BPM; // quarter note
const BAR_SECONDS = BEAT_SECONDS * 8;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new Ctx();
  }

  return audioContext;
}

function getMasterGain(ctx) {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = masterMuted ? 0.0001 : 1;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

function syncMasterMute(ctx) {
  if (!ctx || !masterGain) {
    return;
  }
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value || 0.0001, ctx.currentTime);
  const target = masterMuted ? 0.0001 : 1;
  masterGain.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 0.03);
}

function getLoopGain(ctx) {
  if (!loopGain) {
    loopGain = ctx.createGain();
    loopGain.gain.value = 1;
    loopGain.connect(getMasterGain(ctx));
  }
  return loopGain;
}

function playChipNote(ctx, target, startTime, duration, frequency, gainValue, type = "square") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(target);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function scheduleDiscoBar(ctx, barStart) {
  const loopTarget = getLoopGain(ctx);
  const sixteenth = BEAT_SECONDS / 4;
  const leadPattern = [
    659, 0, 784, 0, 659, 0, 988, 0, 880, 0, 784, 0, 659, 0, 587, 0,
    659, 0, 784, 0, 880, 0, 988, 0, 784, 0, 659, 0, 587, 0, 523, 0
  ];
  const bassPattern = [131, 131, 147, 147, 131, 131, 165, 165];

  leadPattern.forEach((freq, index) => {
    if (!freq) {
      return;
    }

    playChipNote(ctx, loopTarget, barStart + index * sixteenth, sixteenth * 0.75, freq, 0.02, "square");
  });

  bassPattern.forEach((freq, index) => {
    const time = barStart + index * BEAT_SECONDS;
    playChipNote(ctx, loopTarget, time, BEAT_SECONDS * 0.7, freq, 0.03, "triangle");
    playChipNote(ctx, loopTarget, time + BEAT_SECONDS * 0.5, BEAT_SECONDS * 0.18, freq * 2, 0.012, "square");
  });

  for (let index = 0; index < 32; index += 1) {
    const t = barStart + index * sixteenth;
    playChipNote(ctx, loopTarget, t, 0.02, 3200, index % 2 === 0 ? 0.004 : 0.0025, "square");
  }
}

function startScheduler(ctx) {
  if (discoInterval !== null) {
    clearInterval(discoInterval);
  }

  discoInterval = setInterval(() => {
    if (!discoEnabled || nextBarAudioTime === null) {
      return;
    }

    const scheduleAhead = ctx.currentTime + 1.25;
    while (nextBarAudioTime <= scheduleAhead) {
      scheduleDiscoBar(ctx, nextBarAudioTime);
      nextBarAudioTime += BAR_SECONDS;
    }
  }, 180);
}

export function getBeatDurationMs() {
  return BEAT_SECONDS * 1000;
}

export function getNextAlignedBeatPerfTime(beatsAhead = 1) {
  const ctx = getAudioContext();
  if (!ctx || loopStartAudioTime === null || loopStartPerfTime === null) {
    return null;
  }

  const safeAhead = Number.isInteger(beatsAhead) && beatsAhead > 0 ? beatsAhead : 1;
  const audioNow = ctx.currentTime;
  const beatsSinceStart = (audioNow - loopStartAudioTime) / BEAT_SECONDS;
  const nextBeatIndex = Math.ceil(beatsSinceStart + safeAhead - 1);
  const nextBeatAudio = loopStartAudioTime + nextBeatIndex * BEAT_SECONDS;
  const deltaMs = (nextBeatAudio - audioNow) * 1000;
  return performance.now() + deltaMs;
}

export function playDiscoJingle(zone) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const tonesByZone = {
    miss: [180, 160],
    good: [280, 340, 400],
    perfect: [440, 554, 659, 784]
  };

  const tones = tonesByZone[zone] || tonesByZone.miss;
  const now = ctx.currentTime;
  const sfxTarget = getMasterGain(ctx);

  tones.forEach((tone, index) => {
    playChipNote(ctx, sfxTarget, now + index * 0.08, 0.11, tone, 0.06, "triangle");
  });
}

export function playCountIn(delayMs = 1200) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const beatDelayS = Math.max(0.15, delayMs / 1000);
  const step = beatDelayS / 3;

  const click = (time, frequency, gainValue) => {
    playChipNote(ctx, getMasterGain(ctx), time, 0.09, frequency, gainValue, "square");
  };

  click(now + 0 * step, 900, 0.03);
  click(now + 1 * step, 900, 0.03);
  click(now + 2 * step, 900, 0.03);
  click(now + 3 * step, 1200, 0.05);
}

export function startDiscoLoop() {
  const ctx = getAudioContext();
  if (!ctx) {
    return false;
  }

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  getMasterGain(ctx);
  syncMasterMute(ctx);
  getLoopGain(ctx).gain.setValueAtTime(1, ctx.currentTime);

  if (discoEnabled) {
    return true;
  }

  discoEnabled = true;
  loopStartAudioTime = ctx.currentTime + 0.08;
  loopStartPerfTime = performance.now() + 80;
  nextBarAudioTime = loopStartAudioTime;
  startScheduler(ctx);

  return true;
}

export function stopDiscoLoop() {
  discoEnabled = false;
  nextBarAudioTime = null;
  loopStartAudioTime = null;
  loopStartPerfTime = null;
  if (discoInterval !== null) {
    clearInterval(discoInterval);
    discoInterval = null;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (loopGain) {
    loopGain.gain.cancelScheduledValues(ctx.currentTime);
    loopGain.gain.setValueAtTime(Math.max(0.0001, loopGain.gain.value || 1), ctx.currentTime);
    loopGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
    const staleLoopGain = loopGain;
    loopGain = null;
    setTimeout(() => {
      staleLoopGain.disconnect();
    }, 60);
  }
}

export function toggleDiscoLoop() {
  if (discoEnabled) {
    stopDiscoLoop();
    return false;
  }
  return startDiscoLoop();
}

export function isDiscoLoopActive() {
  return discoEnabled;
}

export function setMasterMuted(value) {
  masterMuted = Boolean(value);
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended" && !masterMuted) {
    ctx.resume();
  }
  syncMasterMute(ctx);
  return masterMuted;
}

export function toggleMasterMuted() {
  return setMasterMuted(!masterMuted);
}

export function isMasterMuted() {
  return masterMuted;
}
