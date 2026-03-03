let audioContext;

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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = tone;

    const start = now + index * 0.08;
    const end = start + 0.11;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end);
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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  click(now + 0 * step, 900, 0.03);
  click(now + 1 * step, 900, 0.03);
  click(now + 2 * step, 900, 0.03);
  click(now + 3 * step, 1200, 0.05);
}
