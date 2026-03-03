let audioContext;
let masterGain;
let discoInterval = null;
let discoEnabled = false;

function getAudioContext() {
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
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

function playChipNote(ctx, startTime, duration, frequency, gainValue, type = "square") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(getMasterGain(ctx));

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
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

  tones.forEach((tone, index) => {
    playChipNote(ctx, now + index * 0.08, 0.11, tone, 0.06, "triangle");
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
    playChipNote(ctx, time, 0.09, frequency, gainValue, "square");
  };

  click(now + 0 * step, 900, 0.03);
  click(now + 1 * step, 900, 0.03);
  click(now + 2 * step, 900, 0.03);
  click(now + 3 * step, 1200, 0.05);
}

function scheduleDiscoBar(ctx, barStart) {
  const beat = 0.125;
  const leadPattern = [
    659, 0, 784, 0, 659, 0, 988, 0, 880, 0, 784, 0, 659, 0, 587, 0,
    659, 0, 784, 0, 880, 0, 988, 0, 784, 0, 659, 0, 587, 0, 523, 0
  ];
  const bassPattern = [131, 131, 147, 147, 131, 131, 165, 165];

  leadPattern.forEach((freq, index) => {
    if (!freq) {
      return;
    }

    playChipNote(ctx, barStart + index * beat, beat * 0.75, freq, 0.02, "square");
  });

  bassPattern.forEach((freq, index) => {
    const time = barStart + index * beat * 4;
    playChipNote(ctx, time, beat * 2.8, freq, 0.03, "triangle");
    playChipNote(ctx, time + beat * 2, beat * 0.6, freq * 2, 0.01, "square");
  });

  for (let index = 0; index < 32; index += 1) {
    const t = barStart + index * beat;
    playChipNote(ctx, t, 0.03, 3200, index % 2 === 0 ? 0.004 : 0.0025, "square");
  }
}

export function startDiscoLoop() {
  const ctx = getAudioContext();
  if (!ctx) {
    return false;
  }

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  getMasterGain(ctx).gain.setValueAtTime(1, ctx.currentTime);

  if (discoEnabled) {
    return true;
  }

  discoEnabled = true;
  const barDuration = 4;
  scheduleDiscoBar(ctx, ctx.currentTime + 0.02);

  discoInterval = setInterval(() => {
    if (!discoEnabled) {
      return;
    }
    scheduleDiscoBar(ctx, ctx.currentTime + 0.02);
  }, barDuration * 1000);

  return true;
}

export function stopDiscoLoop() {
  discoEnabled = false;
  if (discoInterval !== null) {
    clearInterval(discoInterval);
    discoInterval = null;
  }

  const ctx = getAudioContext();
  if (!ctx || !masterGain) {
    return;
  }

  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value || 1, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
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
