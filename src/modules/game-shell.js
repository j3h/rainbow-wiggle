import { applyAction, createInitialState } from "./interaction-state.js";
import { getLayoutMode } from "./layout.js";
import {
  isDiscoLoopActive,
  playCountIn,
  playDiscoJingle,
  startDiscoLoop,
  toggleDiscoLoop
} from "./disco-sfx.js";
import { judgeTiming } from "./timing.js";

const PREP_MS = 1200;
const WIGGLE_MS = 850;
const SPRITE_SHEET_SRC = "/src/assets/sprites/cat-dog-butt-wiggle-base.png";
const FALLBACK_SHEET_ASPECT = 1536 / 1024;
const FRAME_INSET_X_PCT = 0.5;
const FRAME_INSET_Y_PCT = 0.5;
const DEFAULT_SPRITE_TUNE = {
  zoom: 4,
  catX: 22,
  catY: 39,
  dogX: 78,
  dogY: 47,
  frames: 9,
  frameW: 10.5,
  frameH: 18.8,
  catStripX: 1.8,
  catStripY: 15.8,
  dogStripX: 1.8,
  dogStripY: 55.0
};

function mapCenterPctToBackgroundPosition(centerPct, scale) {
  if (!Number.isFinite(centerPct) || !Number.isFinite(scale) || scale === 1) {
    return centerPct;
  }

  const t = centerPct / 100;
  const pos = ((0.5 - t * scale) / (1 - scale)) * 100;
  return pos;
}

function getFrameSample(spriteTune, frameIndex) {
  const frame = Math.max(0, Math.min(spriteTune.frames - 1, frameIndex));
  const sampleW = Math.max(0.5, spriteTune.frameW - FRAME_INSET_X_PCT * 2);
  const sampleH = Math.max(0.5, spriteTune.frameH - FRAME_INSET_Y_PCT * 2);

  return {
    sampleW,
    sampleH,
    catCenterX: spriteTune.catStripX + spriteTune.frameW * frame + FRAME_INSET_X_PCT + sampleW * 0.5,
    catCenterY: spriteTune.catStripY + FRAME_INSET_Y_PCT + sampleH * 0.5,
    dogCenterX: spriteTune.dogStripX + spriteTune.frameW * frame + FRAME_INSET_X_PCT + sampleW * 0.5,
    dogCenterY: spriteTune.dogStripY + FRAME_INSET_Y_PCT + sampleH * 0.5
  };
}

function buildFeedback(zone) {
  const byZone = {
    miss: "Too early or late. Cat and dog need tighter wiggles.",
    good: "Nice groove. Cat butt wiggle + dog butt wiggle synced.",
    perfect: "PERFECT! Disco legend mode unlocked."
  };

  return byZone[zone] || byZone.miss;
}

export function renderGameShell(container) {
  if (!container) {
    throw new Error("container is required");
  }

  let state = createInitialState();
  let targetBeatAt = null;
  let countdownRaf = null;
  let spriteSheetAspect = FALLBACK_SHEET_ASPECT;
  const params = new URLSearchParams(window.location.search);
  const debugSprites = params.get("debugSprites") === "1";
  const spriteTune = { ...DEFAULT_SPRITE_TUNE };

  const shell = document.createElement("section");
  shell.className = "shell";

  const title = document.createElement("h1");
  title.className = "title";

  const subtitle = document.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = "Creative directors: Lola + Alder";

  const stats = document.createElement("p");
  stats.className = "stats";

  const meterTrack = document.createElement("div");
  meterTrack.className = "meter-track";
  meterTrack.setAttribute("role", "progressbar");
  meterTrack.setAttribute("aria-label", "Rainbow meter");

  const meterFill = document.createElement("div");
  meterFill.className = "meter-fill";
  meterTrack.append(meterFill);

  const critters = document.createElement("p");
  critters.className = "critters";

  const spriteStage = document.createElement("div");
  spriteStage.className = "sprite-stage";

  const catSprite = document.createElement("div");
  catSprite.className = "sprite sprite-cat";
  catSprite.setAttribute("aria-label", "Cat butt wiggle");

  const dogSprite = document.createElement("div");
  dogSprite.className = "sprite sprite-dog";
  dogSprite.setAttribute("aria-label", "Dog butt wiggle");

  spriteStage.append(catSprite, dogSprite);

  const feedback = document.createElement("p");
  feedback.className = "feedback";

  const controls = document.createElement("div");
  controls.className = "controls";

  const danceButton = document.createElement("button");
  danceButton.className = "action";
  danceButton.type = "button";

  const musicButton = document.createElement("button");
  musicButton.className = "action action-secondary";
  musicButton.type = "button";
  musicButton.textContent = "Music: Off";

  const applySpriteTune = () => {
    const sample = getFrameSample(spriteTune, 0);
    const frameAspect = (sample.sampleW / sample.sampleH) * spriteSheetAspect;
    const frameZoomX = 100 / sample.sampleW;
    const frameZoomY = 100 / sample.sampleH;
    const catBgX = mapCenterPctToBackgroundPosition(sample.catCenterX, frameZoomX);
    const catBgY = mapCenterPctToBackgroundPosition(sample.catCenterY, frameZoomY);
    const dogBgX = mapCenterPctToBackgroundPosition(sample.dogCenterX, frameZoomX);
    const dogBgY = mapCenterPctToBackgroundPosition(sample.dogCenterY, frameZoomY);

    catSprite.style.setProperty("--sprite-x", `${sample.catCenterX}%`);
    catSprite.style.setProperty("--sprite-y", `${sample.catCenterY}%`);
    catSprite.style.setProperty("--sprite-bx", `${catBgX}%`);
    catSprite.style.setProperty("--sprite-by", `${catBgY}%`);
    catSprite.style.setProperty("--sprite-zoom", String(frameZoomX));
    catSprite.style.setProperty("--sprite-ar", String(frameAspect));
    dogSprite.style.setProperty("--sprite-x", `${sample.dogCenterX}%`);
    dogSprite.style.setProperty("--sprite-y", `${sample.dogCenterY}%`);
    dogSprite.style.setProperty("--sprite-bx", `${dogBgX}%`);
    dogSprite.style.setProperty("--sprite-by", `${dogBgY}%`);
    dogSprite.style.setProperty("--sprite-zoom", String(frameZoomX));
    dogSprite.style.setProperty("--sprite-ar", String(frameAspect));
  };

  let wiggleTimeout = null;
  let frameTimer = null;
  let musicStarted = false;

  const setFrame = (frameIndex) => {
    const sample = getFrameSample(spriteTune, frameIndex);
    const frameAspect = (sample.sampleW / sample.sampleH) * spriteSheetAspect;
    const frameZoomX = 100 / sample.sampleW;
    const frameZoomY = 100 / sample.sampleH;
    const catBgX = mapCenterPctToBackgroundPosition(sample.catCenterX, frameZoomX);
    const catBgY = mapCenterPctToBackgroundPosition(sample.catCenterY, frameZoomY);
    const dogBgX = mapCenterPctToBackgroundPosition(sample.dogCenterX, frameZoomX);
    const dogBgY = mapCenterPctToBackgroundPosition(sample.dogCenterY, frameZoomY);

    catSprite.style.setProperty("--sprite-zoom", String(frameZoomX));
    catSprite.style.setProperty("--sprite-ar", String(frameAspect));
    catSprite.style.setProperty("--sprite-x", `${sample.catCenterX}%`);
    catSprite.style.setProperty("--sprite-y", `${sample.catCenterY}%`);
    catSprite.style.setProperty("--sprite-bx", `${catBgX}%`);
    catSprite.style.setProperty("--sprite-by", `${catBgY}%`);
    dogSprite.style.setProperty("--sprite-zoom", String(frameZoomX));
    dogSprite.style.setProperty("--sprite-ar", String(frameAspect));
    dogSprite.style.setProperty("--sprite-x", `${sample.dogCenterX}%`);
    dogSprite.style.setProperty("--sprite-y", `${sample.dogCenterY}%`);
    dogSprite.style.setProperty("--sprite-bx", `${dogBgX}%`);
    dogSprite.style.setProperty("--sprite-by", `${dogBgY}%`);
  };

  const stopFrameAnimation = () => {
    if (frameTimer !== null) {
      clearInterval(frameTimer);
      frameTimer = null;
    }
  };

  const updateMusicLabel = () => {
    musicButton.textContent = isDiscoLoopActive() ? "Music: On" : "Music: Off";
  };

  const playWiggle = (zone) => {
    const power = zone === "perfect" ? "max" : zone === "good" ? "mid" : "min";
    const cycleCount = zone === "perfect" ? 2 : zone === "good" ? 1.5 : 1;
    const frameIntervalMs = zone === "perfect" ? 85 : zone === "good" ? 105 : 130;

    if (wiggleTimeout !== null) {
      clearTimeout(wiggleTimeout);
      wiggleTimeout = null;
    }
    stopFrameAnimation();

    catSprite.classList.remove("wiggle-min", "wiggle-mid", "wiggle-max");
    dogSprite.classList.remove("wiggle-min", "wiggle-mid", "wiggle-max");

    const wiggleClass = `wiggle-${power}`;
    catSprite.classList.add(wiggleClass);
    dogSprite.classList.add(wiggleClass);

    let frame = 0;
    const totalSteps = Math.max(1, Math.round(spriteTune.frames * cycleCount));
    let step = 0;
    setFrame(0);
    frameTimer = setInterval(() => {
      frame = (frame + 1) % spriteTune.frames;
      setFrame(frame);
      step += 1;
      if (step >= totalSteps) {
        stopFrameAnimation();
        setFrame(0);
      }
    }, frameIntervalMs);

    wiggleTimeout = setTimeout(() => {
      catSprite.classList.remove(wiggleClass);
      dogSprite.classList.remove(wiggleClass);
      stopFrameAnimation();
      setFrame(0);
      wiggleTimeout = null;
    }, WIGGLE_MS);
  };

  const buildSpriteDebugPanel = () => {
    const debug = document.createElement("section");
    debug.className = "sprite-debug";

    const heading = document.createElement("h2");
    heading.className = "debug-title";
    heading.textContent = "Sprite Debug";

    const note = document.createElement("p");
    note.className = "debug-note";
    note.textContent =
      "Use Overlay controls to move the 1x8 boxes. Preview controls only move the in-game crop.";

    const stage = document.createElement("div");
    stage.className = "debug-stage";

    const img = document.createElement("img");
    img.className = "debug-image";
    img.src = SPRITE_SHEET_SRC;
    img.alt = "Sprite source debug";

    const buildStrip = (stripClass) => {
      const strip = document.createElement("div");
      strip.className = `debug-strip ${stripClass}`;
      for (let index = 0; index < spriteTune.frames; index += 1) {
        const cell = document.createElement("div");
        cell.className = "debug-cell";
        strip.append(cell);
      }
      return strip;
    };

    const catStrip = buildStrip("debug-cat");
    const dogStrip = buildStrip("debug-dog");

    stage.append(img, catStrip, dogStrip);

    const controls = document.createElement("div");
    controls.className = "debug-controls";

    const readout = document.createElement("p");
    readout.className = "debug-readout";
    const frameReadout = document.createElement("p");
    frameReadout.className = "debug-readout";

    const previewRow = document.createElement("div");
    previewRow.className = "debug-preview-row";
    const catPreview = document.createElement("div");
    catPreview.className = "sprite debug-preview-sprite";
    const dogPreview = document.createElement("div");
    dogPreview.className = "sprite debug-preview-sprite";
    previewRow.append(catPreview, dogPreview);

    let previewFrame = 0;

    const updateFramePreview = () => {
      const sample = getFrameSample(spriteTune, previewFrame);
      const frameAspect = (sample.sampleW / sample.sampleH) * spriteSheetAspect;
      const zoomX = 100 / sample.sampleW;
      const zoomY = 100 / sample.sampleH;
      const catBgX = mapCenterPctToBackgroundPosition(sample.catCenterX, zoomX);
      const catBgY = mapCenterPctToBackgroundPosition(sample.catCenterY, zoomY);
      const dogBgX = mapCenterPctToBackgroundPosition(sample.dogCenterX, zoomX);
      const dogBgY = mapCenterPctToBackgroundPosition(sample.dogCenterY, zoomY);

      catPreview.style.setProperty("--sprite-zoom", String(zoomX));
      catPreview.style.setProperty("--sprite-ar", String(frameAspect));
      catPreview.style.setProperty("--sprite-x", `${sample.catCenterX}%`);
      catPreview.style.setProperty("--sprite-y", `${sample.catCenterY}%`);
      catPreview.style.setProperty("--sprite-bx", `${catBgX}%`);
      catPreview.style.setProperty("--sprite-by", `${catBgY}%`);
      dogPreview.style.setProperty("--sprite-zoom", String(zoomX));
      dogPreview.style.setProperty("--sprite-ar", String(frameAspect));
      dogPreview.style.setProperty("--sprite-x", `${sample.dogCenterX}%`);
      dogPreview.style.setProperty("--sprite-y", `${sample.dogCenterY}%`);
      dogPreview.style.setProperty("--sprite-bx", `${dogBgX}%`);
      dogPreview.style.setProperty("--sprite-by", `${dogBgY}%`);
      frameReadout.textContent = `Frame Preview: ${previewFrame + 1}/${spriteTune.frames}`;
    };

    const makeSlider = (labelText, key, min, max, step) => {
      const wrap = document.createElement("label");
      wrap.className = "debug-row";
      const label = document.createElement("span");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(spriteTune[key]);
      const number = document.createElement("input");
      number.type = "number";
      number.className = "debug-number";
      number.min = String(min);
      number.max = String(max);
      number.step = String(step);
      number.value = String(spriteTune[key]);

      const sync = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return;
        }
        const bounded = Math.min(max, Math.max(min, numeric));
        spriteTune[key] = bounded;
        if (key === "frames") {
          while (catStrip.firstChild) {
            catStrip.removeChild(catStrip.firstChild);
          }
          while (dogStrip.firstChild) {
            dogStrip.removeChild(dogStrip.firstChild);
          }
          for (let index = 0; index < spriteTune.frames; index += 1) {
            const catCell = document.createElement("div");
            catCell.className = "debug-cell";
            catStrip.append(catCell);
            const dogCell = document.createElement("div");
            dogCell.className = "debug-cell";
            dogStrip.append(dogCell);
          }
          previewFrame = Math.min(previewFrame, spriteTune.frames - 1);
        }
        input.value = String(bounded);
        number.value = String(bounded);
        applySpriteTune();
        updateBoxes();
        updateFramePreview();
      };

      input.addEventListener("input", () => {
        sync(input.value);
      });
      number.addEventListener("change", () => {
        sync(number.value);
      });
      wrap.append(label, input, number);
      return wrap;
    };

    controls.append(
      makeSlider("Frames", "frames", 4, 12, 1),
      makeSlider("Frame W%", "frameW", 2, 30, 0.2),
      makeSlider("Frame H%", "frameH", 5, 60, 0.2),
      makeSlider("Overlay Cat X%", "catStripX", 0, 100, 0.2),
      makeSlider("Overlay Cat Y%", "catStripY", 0, 100, 0.2),
      makeSlider("Overlay Dog X%", "dogStripX", 0, 100, 0.2),
      makeSlider("Overlay Dog Y%", "dogStripY", 0, 100, 0.2),
      makeSlider("Preview Zoom", "zoom", 1.2, 10, 0.05),
      makeSlider("Preview Cat X", "catX", 0, 100, 1),
      makeSlider("Preview Cat Y", "catY", 0, 100, 1),
      makeSlider("Preview Dog X", "dogX", 0, 100, 1),
      makeSlider("Preview Dog Y", "dogY", 0, 100, 1)
    );

    const updateBoxes = () => {
      const frameW = spriteTune.frameW;
      const frameH = spriteTune.frameH;
      const stripW = frameW * spriteTune.frames;

      const placeStrip = (el, x, y) => {
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.width = `${stripW}%`;
        el.style.height = `${frameH}%`;
        el.style.gridTemplateColumns = `repeat(${spriteTune.frames}, minmax(0, 1fr))`;
      };

      placeStrip(catStrip, spriteTune.catStripX, spriteTune.catStripY);
      placeStrip(dogStrip, spriteTune.dogStripX, spriteTune.dogStripY);
      updateFramePreview();

      readout.textContent =
        `zoom=${spriteTune.zoom.toFixed(2)} ` +
        `cat(${Math.round(spriteTune.catX)}, ${Math.round(spriteTune.catY)}) ` +
        `dog(${Math.round(spriteTune.dogX)}, ${Math.round(spriteTune.dogY)}) ` +
        `frames(${Math.round(spriteTune.frames)}) ` +
        `frame(${frameW.toFixed(1)}%, ${frameH.toFixed(1)}%) ` +
        `catStrip(${spriteTune.catStripX.toFixed(1)}%, ${spriteTune.catStripY.toFixed(1)}%) ` +
        `dogStrip(${spriteTune.dogStripX.toFixed(1)}%, ${spriteTune.dogStripY.toFixed(1)}%)`;
    };

    img.addEventListener("load", updateBoxes);
    window.addEventListener("resize", updateBoxes);
    updateBoxes();
    updateFramePreview();
    setInterval(() => {
      previewFrame = (previewFrame + 1) % spriteTune.frames;
      updateFramePreview();
    }, 160);

    debug.append(heading, note, stage, previewRow, controls, readout, frameReadout);
    return debug;
  };

  const getCountdownText = (msUntilBeat) => {
    if (msUntilBeat > 800) {
      return "Listen... 3";
    }

    if (msUntilBeat > 400) {
      return "Listen... 2";
    }

    if (msUntilBeat > 0) {
      return "Listen... 1";
    }

    return "TAP NOW!";
  };

  const stopCountdownRender = () => {
    if (countdownRaf !== null) {
      cancelAnimationFrame(countdownRaf);
      countdownRaf = null;
    }
  };

  const startCountdownRender = () => {
    if (countdownRaf !== null) {
      return;
    }

    const tick = () => {
      if (targetBeatAt === null) {
        countdownRaf = null;
        return;
      }

      render();
      countdownRaf = requestAnimationFrame(tick);
    };

    countdownRaf = requestAnimationFrame(tick);
  };

  const updateLayoutMode = () => {
    const mode = getLayoutMode(window.innerWidth, window.innerHeight);
    shell.dataset.layout = mode;
  };

  const render = () => {
    title.textContent = state.title;
    stats.textContent = `Round ${state.round} | Dance Points ${state.score} | ${state.lastZone ?? "Ready"}`;
    meterFill.style.width = `${state.rainbowMeter}%`;
    meterTrack.setAttribute("aria-valuenow", String(state.rainbowMeter));
    critters.textContent = "Cat butt wiggle + dog butt wiggle";

    if (targetBeatAt === null) {
      danceButton.textContent = "Start Dance Party";
      danceButton.classList.remove("is-hot");
      if (!state.lastZone) {
        feedback.textContent = "Tap to start. Then tap again when the beat lands.";
      } else {
        feedback.textContent = buildFeedback(state.lastZone);
      }
    } else {
      danceButton.textContent = "HIT THE BEAT";
      const msUntilBeat = targetBeatAt - performance.now();
      feedback.textContent = `${getCountdownText(msUntilBeat)}  Miss / Good / Perfect`;
      danceButton.classList.toggle("is-hot", msUntilBeat < 220);
    }
  };

  danceButton.addEventListener("click", () => {
    if (!musicStarted) {
      startDiscoLoop();
      musicStarted = true;
      updateMusicLabel();
    }

    if (targetBeatAt === null) {
      targetBeatAt = performance.now() + PREP_MS;
      playCountIn(PREP_MS);
      startCountdownRender();
      render();
      return;
    }

    const deltaMs = performance.now() - targetBeatAt;
    const zone = judgeTiming(deltaMs);

    state = applyAction(state, { type: "APPLY_JUDGMENT", zone });
    targetBeatAt = null;
    stopCountdownRender();
    playWiggle(zone);
    playDiscoJingle(zone);
    render();
  });

  musicButton.addEventListener("click", () => {
    const active = toggleDiscoLoop();
    musicStarted = musicStarted || active;
    updateMusicLabel();
  });

  controls.append(danceButton, musicButton);
  shell.append(title, subtitle, stats, meterTrack, critters, spriteStage, feedback, controls);
  applySpriteTune();
  updateMusicLabel();
  if (debugSprites) {
    shell.append(buildSpriteDebugPanel());
  }
  container.replaceChildren(shell);

  const spriteProbe = new Image();
  spriteProbe.src = SPRITE_SHEET_SRC;
  spriteProbe.addEventListener("load", () => {
    if (spriteProbe.naturalWidth > 0 && spriteProbe.naturalHeight > 0) {
      spriteSheetAspect = spriteProbe.naturalWidth / spriteProbe.naturalHeight;
      applySpriteTune();
      setFrame(0);
    }
  });

  updateLayoutMode();
  render();

  window.addEventListener("resize", updateLayoutMode);
}
