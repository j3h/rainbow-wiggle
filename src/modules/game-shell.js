import { applyAction, createInitialState, RAINBOW_LEVELS } from "./interaction-state.js";
import { getLayoutMode } from "./layout.js";
import { getEnergyLevel, getHypeText } from "./fun-mode.js";
import {
  getBeatDurationMs,
  getNextAlignedBeatPerfTime,
  isDiscoLoopActive,
  playDiscoJingle,
  startDiscoLoop,
  toggleDiscoLoop
} from "./disco-sfx.js";
import { judgeTiming } from "./timing.js";

const PREP_MS = 1200;
const TAP_BEAT_PATTERN = [2, 3, 1, 2, 2, 1, 3, 2];
const NOTE_PREVIEW_COUNT = 4;
const LANE_START_PCT = 8;
const LANE_TARGET_PCT = 90;
const MIN_NOTE_GAP_PCT = 10;
const WIGGLE_MS = 850;
const SPRITE_SHEET_SRC = "/src/assets/sprites/cat-dog-butt-wiggle-base.png";
const FALLBACK_SHEET_ASPECT = 1536 / 1024;
const FRAME_INSET_X_PCT = 0.5;
const FRAME_INSET_Y_PCT = 0.5;
const SHOP_ITEMS = [
  { id: "neon-collar", name: "Neon Collar", cost: 12, effect: "Neon glow aura" },
  { id: "disco-sparkles", name: "Disco Sparkles", cost: 20, effect: "Sparkle storm around dancers" },
  { id: "rainbow-trail", name: "Rainbow Trail", cost: 28, effect: "Rainbow motion trails behind wiggles" },
  { id: "party-lasers", name: "Party Lasers", cost: 36, effect: "Moving laser beams in the background" },
  { id: "disco-ball", name: "Disco Ball", cost: 44, effect: "Spinning disco ball over the dance floor" },
  { id: "unicorn-crown", name: "Unicorn Crown", cost: 50, effect: "Legend crown sparkles for both dancers" }
];
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

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function getPatternValue(index) {
  return TAP_BEAT_PATTERN[index % TAP_BEAT_PATTERN.length];
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

function buildComboFeedback(zones, rank) {
  const joined = zones.map((zone) => zone.toUpperCase()).join(" / ");
  if (rank === "perfect") {
    return `Combo ${joined}. DISCO BLAST combo bonus!`;
  }
  if (rank === "good") {
    return `Combo ${joined}. Nice groove chain!`;
  }
  return `Combo ${joined}. Try tighter rhythm next round.`;
}

export function renderGameShell(container) {
  if (!container) {
    throw new Error("container is required");
  }

  let state = createInitialState();
  let nextBeatAt = null;
  let beatDurationMs = getBeatDurationMs() * getPatternValue(0);
  let beatPatternIndex = 0;
  let comboStreak = 0;
  let hypeText = "Ready to wiggle";
  let lastShopMessage = "";
  let countdownRaf = null;
  let isPaused = false;
  let pauseHasActiveRound = false;
  let resumeMusicAfterPause = false;
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
  const burstLayer = document.createElement("div");
  burstLayer.className = "burst-layer";
  const spotlight = document.createElement("div");
  spotlight.className = "spotlight";
  const partyLaserLayer = document.createElement("div");
  partyLaserLayer.className = "party-laser-layer";
  const discoBallChain = document.createElement("div");
  discoBallChain.className = "disco-ball-chain";
  const discoBallDecor = document.createElement("div");
  discoBallDecor.className = "disco-ball-decor";
  const discoBallRays = document.createElement("div");
  discoBallRays.className = "disco-ball-rays";
  const unicornLeft = document.createElement("div");
  unicornLeft.className = "unicorn-mascot unicorn-left";
  unicornLeft.textContent = "🦄";
  const unicornRight = document.createElement("div");
  unicornRight.className = "unicorn-mascot unicorn-right";
  unicornRight.textContent = "🦄";
  const winEffectsLayer = document.createElement("div");
  winEffectsLayer.className = "win-effects";

  const catSprite = document.createElement("div");
  catSprite.className = "sprite sprite-cat";
  catSprite.setAttribute("aria-label", "Cat butt wiggle");

  const dogSprite = document.createElement("div");
  dogSprite.className = "sprite sprite-dog";
  dogSprite.setAttribute("aria-label", "Dog butt wiggle");

  spriteStage.append(
    partyLaserLayer,
    catSprite,
    dogSprite,
    burstLayer,
    spotlight,
    discoBallChain,
    discoBallRays,
    discoBallDecor,
    unicornLeft,
    unicornRight,
    winEffectsLayer
  );

  const feedback = document.createElement("p");
  feedback.className = "feedback";
  const hype = document.createElement("p");
  hype.className = "hype";

  const beatCue = document.createElement("div");
  beatCue.className = "beat-cue";
  const beatPips = document.createElement("div");
  beatPips.className = "beat-pips";
  const pipEls = Array.from({ length: 1 }, () => {
    const pip = document.createElement("span");
    pip.className = "beat-pip";
    return pip;
  });
  beatPips.append(...pipEls);
  const beatLane = document.createElement("div");
  beatLane.className = "beat-lane";
  meterTrack.classList.add("lane-meter-track");
  meterFill.classList.add("lane-meter-fill");
  const hitFxLayer = document.createElement("div");
  hitFxLayer.className = "hit-fx-layer";
  const beatTarget = document.createElement("div");
  beatTarget.className = "beat-target";
  const noteEls = Array.from({ length: NOTE_PREVIEW_COUNT }, () => {
    const note = document.createElement("span");
    note.className = "beat-note";
    return note;
  });
  const beatZone = document.createElement("div");
  beatZone.className = "beat-zone";
  beatLane.append(meterTrack, hitFxLayer, beatTarget, beatZone, ...noteEls);
  beatCue.append(beatPips, beatLane);

  const shop = document.createElement("section");
  shop.className = "shop";
  const shopTitle = document.createElement("h2");
  shopTitle.className = "shop-title";
  shopTitle.textContent = "Rainbow Shop";
  const shopList = document.createElement("div");
  shopList.className = "shop-list";

  const controls = document.createElement("div");
  controls.className = "controls";

  const shellBody = document.createElement("div");
  shellBody.className = "shell-body";
  const playPanel = document.createElement("section");
  playPanel.className = "play-panel";
  const sidePanel = document.createElement("aside");
  sidePanel.className = "side-panel";

  const musicButton = document.createElement("button");
  musicButton.className = "music-toggle";
  musicButton.type = "button";
  musicButton.textContent = "♪";

  const playAgainButton = document.createElement("button");
  playAgainButton.className = "action action-replay";
  playAgainButton.type = "button";
  playAgainButton.textContent = "Play Again";

  const pauseButton = document.createElement("button");
  pauseButton.className = "action action-secondary action-pause";
  pauseButton.type = "button";
  pauseButton.textContent = "Pause";

  beatLane.setAttribute("role", "button");
  beatLane.setAttribute("tabindex", "0");
  beatLane.setAttribute("aria-label", "Rhythm lane. Tap when orange notes reach the target zone.");

  const shopButtons = SHOP_ITEMS.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-item";
    button.dataset.itemId = item.id;
    return button;
  });
  shopList.append(...shopButtons);
  shop.append(shopTitle, shopList);

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
    const active = isDiscoLoopActive();
    musicButton.classList.toggle("is-on", active);
    musicButton.setAttribute("aria-pressed", String(active));
    musicButton.setAttribute("aria-label", active ? "Turn music off" : "Turn music on");
    musicButton.title = active ? "Music on" : "Music off";
  };

  const launchWinCelebration = () => {
    for (let index = 0; index < 60; index += 1) {
      const piece = document.createElement("span");
      piece.className = "win-confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--drift-x", `${-40 + Math.random() * 80}px`);
      piece.style.setProperty("--fall-time", `${1.6 + Math.random() * 1.2}s`);
      piece.style.setProperty("--delay", `${Math.random() * 0.35}s`);
      piece.style.setProperty("--hue", `${Math.floor(Math.random() * 360)}deg`);
      winEffectsLayer.append(piece);
      setTimeout(() => piece.remove(), 3400);
    }
  };

  const launchBurst = (zone) => {
    if (zone === "miss") {
      return;
    }
    const count = zone === "perfect" ? 14 : 9;
    const targetX = LANE_TARGET_PCT;
    const targetY = 50;

    const core = document.createElement("span");
    core.className = `hit-explosion hit-explosion-${zone}`;
    core.style.left = `${targetX}%`;
    core.style.top = `${targetY}%`;
    hitFxLayer.append(core);
    setTimeout(() => core.remove(), 520);

    const ring = document.createElement("span");
    ring.className = `hit-ring hit-ring-${zone}`;
    ring.style.left = `${targetX}%`;
    ring.style.top = `${targetY}%`;
    hitFxLayer.append(ring);
    setTimeout(() => ring.remove(), 560);

    const sparkCount = zone === "perfect" ? 18 : 12;
    for (let index = 0; index < sparkCount; index += 1) {
      const spark = document.createElement("span");
      spark.className = `hit-spark hit-spark-${zone}`;
      spark.style.left = `${targetX}%`;
      spark.style.top = `${targetY}%`;
      spark.style.setProperty("--drift-x", `${-44 + Math.random() * 88}px`);
      spark.style.setProperty("--drift-y", `${-30 + Math.random() * 60}px`);
      hitFxLayer.append(spark);
      setTimeout(() => spark.remove(), 520);
    }

    for (let index = 0; index < count; index += 1) {
      const puff = document.createElement("span");
      puff.className = `burst burst-${zone}`;
      puff.style.left = `${14 + Math.random() * 72}%`;
      puff.style.top = `${22 + Math.random() * 50}%`;
      puff.style.setProperty("--burst-size", zone === "perfect" ? "18px" : "14px");
      puff.style.setProperty("--drift-x", `${-34 + Math.random() * 68}px`);
      puff.style.setProperty("--drift-y", `${-26 - Math.random() * 28}px`);
      burstLayer.append(puff);
      setTimeout(() => puff.remove(), 640);
    }
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
      if (nextBeatAt === null) {
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
    const now = performance.now();
    const currentBeatsAhead = getPatternValue(beatPatternIndex);
    const beatIntervalMs = getBeatDurationMs() * currentBeatsAhead;
    if (!isPaused && nextBeatAt !== null && beatIntervalMs > 0) {
      while (nextBeatAt < now - 200) {
        nextBeatAt += beatIntervalMs;
      }
      beatDurationMs = beatIntervalMs;
    }

    title.textContent = state.title;
    shell.dataset.energy = String(getEnergyLevel(state.rainbowMeter));
    const levelName = RAINBOW_LEVELS[state.rainbowStageIndex];
    shell.dataset.level = levelName.toLowerCase();
    stats.textContent = `Level ${levelName} | Meter ${state.rainbowMeter}% | Dance Points ${state.score}`;
    meterFill.style.width = `${state.rainbowMeter}%`;
    meterTrack.setAttribute("aria-valuenow", String(state.rainbowMeter));
    critters.textContent = "Cat butt wiggle + dog butt wiggle";
    SHOP_ITEMS.forEach((item) => {
      spriteStage.classList.toggle(`has-${item.id}`, state.ownedItems.includes(item.id));
    });
    partyLaserLayer.classList.toggle("is-visible", state.ownedItems.includes("party-lasers"));
    discoBallChain.classList.toggle("is-visible", state.ownedItems.includes("disco-ball"));
    discoBallDecor.classList.toggle("is-visible", state.ownedItems.includes("disco-ball"));
    discoBallRays.classList.toggle("is-visible", state.ownedItems.includes("disco-ball"));
    const showUnicorn = state.ownedItems.includes("unicorn-crown");
    unicornLeft.classList.toggle("is-visible", showUnicorn);
    unicornRight.classList.toggle("is-visible", showUnicorn);
    shell.classList.toggle("is-win", state.hasWon);

    SHOP_ITEMS.forEach((item, index) => {
      const owned = state.ownedItems.includes(item.id);
      const affordable = state.score >= item.cost;
      const button = shopButtons[index];
      button.disabled = owned;
      button.textContent = owned
        ? `${item.name} - Owned`
        : `${item.name} (${item.cost}) - ${item.effect}${affordable ? "" : " (Need points)"}`;
    });

    if (nextBeatAt === null) {
      beatLane.classList.remove("is-hot");
      beatLane.classList.toggle("is-paused", isPaused);
      beatCue.classList.remove("is-live");
      beatCue.style.setProperty("--beat-progress", "0");
      beatCue.classList.remove("is-window");
      pipEls[0].classList.remove("is-done");
      pipEls[0].classList.add("is-current");
      noteEls.forEach((note) => {
        note.style.opacity = "0";
      });
      if (!state.lastZone) {
        feedback.textContent = "Tap the lane to start. Hit orange notes in the target zone.";
      } else if (lastShopMessage) {
        feedback.textContent = lastShopMessage;
      } else if (state.hasWon) {
        feedback.textContent = "YOU WON THE RED LEVEL! Rainbow champions forever.";
      } else if (isPaused) {
        feedback.textContent = "Paused. Tap Resume to keep dancing.";
      } else {
        feedback.textContent = buildFeedback(state.lastZone);
      }
      hype.textContent = hypeText;
    } else {
      beatLane.classList.toggle("is-paused", isPaused);
      if (isPaused) {
        beatLane.classList.remove("is-hot");
        beatCue.classList.remove("is-window");
        beatCue.classList.remove("is-live");
        feedback.textContent = "Paused. Tap Resume to keep dancing.";
        hype.textContent = "Dance floor on hold";
        noteEls.forEach((note) => {
          note.style.opacity = "0";
        });
        playAgainButton.classList.toggle("is-visible", state.hasWon);
        playAgainButton.disabled = !state.hasWon;
        pauseButton.textContent = "Resume";
        pauseButton.disabled = false;
        return;
      }

      const msUntilBeat = nextBeatAt - now;
      const progress = beatDurationMs <= 0 ? 1 : clamp01(1 - msUntilBeat / beatDurationMs);
      const laneSpan = LANE_TARGET_PCT - LANE_START_PCT;
      feedback.textContent = `${getCountdownText(msUntilBeat)} Keep the rhythm!`;
      beatLane.classList.toggle("is-hot", msUntilBeat < 220 && msUntilBeat > -140);
      beatCue.classList.add("is-live");
      beatCue.classList.toggle("is-window", msUntilBeat < 220 && msUntilBeat > -140);
      beatCue.style.setProperty("--beat-progress", String(progress));

      let previousNotePos = LANE_TARGET_PCT + MIN_NOTE_GAP_PCT;
      noteEls.forEach((note, index) => {
        let noteAt = nextBeatAt;
        for (let step = 0; step < index; step += 1) {
          const beatsAhead = getPatternValue(beatPatternIndex + step + 1);
          noteAt += getBeatDurationMs() * beatsAhead;
        }
        const delta = noteAt - now;
        let lookAhead = 0;
        for (let step = 0; step < NOTE_PREVIEW_COUNT; step += 1) {
          lookAhead += getBeatDurationMs() * getPatternValue(beatPatternIndex + step);
        }
        const normalized = clamp01(1 - delta / lookAhead);
        const rawLanePosition = LANE_START_PCT + normalized * laneSpan;
        const lanePosition = Math.min(rawLanePosition, previousNotePos - MIN_NOTE_GAP_PCT);
        note.style.left = `${lanePosition.toFixed(2)}%`;
        note.style.opacity = delta < -220 ? "0" : "1";
        note.classList.toggle("is-next", index === 0);
        previousNotePos = lanePosition;
      });
      pipEls[0].classList.add("is-current");
      hype.textContent = "Hit orange notes when they enter the target zone!";
    }

    playAgainButton.classList.toggle("is-visible", state.hasWon);
    playAgainButton.disabled = !state.hasWon;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    pauseButton.disabled = nextBeatAt === null && !isPaused;
  };

  const handleLaneTap = () => {
    if (isPaused) {
      return;
    }

    if (!musicStarted) {
      startDiscoLoop();
      musicStarted = true;
      updateMusicLabel();
    }

    if (nextBeatAt === null) {
      beatPatternIndex = 0;
      const firstBeatsAhead = getPatternValue(beatPatternIndex);
      const firstBeat = getNextAlignedBeatPerfTime(firstBeatsAhead);
      if (firstBeat) {
        nextBeatAt = firstBeat;
        beatDurationMs = Math.max(500, getBeatDurationMs() * firstBeatsAhead);
      } else {
        beatDurationMs = Math.max(PREP_MS, getBeatDurationMs() * firstBeatsAhead);
        nextBeatAt = performance.now() + beatDurationMs;
      }
      startCountdownRender();
      render();
      return;
    }

    const deltaMs = performance.now() - nextBeatAt;
    const hadWonBefore = state.hasWon;
    const zone = judgeTiming(deltaMs);
    playDiscoJingle(zone);
    playWiggle(zone);
    launchBurst(zone);
    state = applyAction(state, { type: "APPLY_JUDGMENT", zone });
    if (!hadWonBefore && state.hasWon) {
      launchWinCelebration();
    }
    comboStreak = state.lastZone === "miss" ? 0 : comboStreak + 1;
    hypeText = getHypeText(state.lastZone, comboStreak);
    lastShopMessage = "";

    if (state.hasWon) {
      nextBeatAt = null;
      stopCountdownRender();
    } else {
      beatPatternIndex += 1;
      const beatsAhead = getPatternValue(beatPatternIndex);
      beatDurationMs = Math.max(500, getBeatDurationMs() * beatsAhead);
      const aligned = getNextAlignedBeatPerfTime(beatsAhead);
      if (aligned) {
        nextBeatAt = aligned;
      } else {
        nextBeatAt = performance.now() + beatDurationMs;
      }
    }
    render();
  };

  const handlePauseToggle = () => {
    if (!isPaused) {
      if (nextBeatAt === null) {
        return;
      }
      pauseHasActiveRound = true;
      isPaused = true;
      resumeMusicAfterPause = isDiscoLoopActive();
      if (resumeMusicAfterPause) {
        toggleDiscoLoop();
      }
      stopCountdownRender();
      updateMusicLabel();
      render();
      return;
    }

    isPaused = false;
    if (resumeMusicAfterPause) {
      startDiscoLoop();
      musicStarted = true;
      resumeMusicAfterPause = false;
    }
    if (pauseHasActiveRound && !state.hasWon) {
      const beatsAhead = getPatternValue(beatPatternIndex);
      beatDurationMs = Math.max(500, getBeatDurationMs() * beatsAhead);
      const aligned = getNextAlignedBeatPerfTime(beatsAhead);
      nextBeatAt = aligned || performance.now() + beatDurationMs;
      pauseHasActiveRound = false;
      startCountdownRender();
    }
    updateMusicLabel();
    render();
  };

  beatLane.addEventListener("click", handleLaneTap);
  beatLane.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLaneTap();
    }
  });

  musicButton.addEventListener("click", () => {
    const active = toggleDiscoLoop();
    musicStarted = musicStarted || active;
    updateMusicLabel();
  });

  playAgainButton.addEventListener("click", () => {
    state = createInitialState({
      title: state.title,
      ownedItems: state.ownedItems
    });
    nextBeatAt = null;
    beatPatternIndex = 0;
    comboStreak = 0;
    hypeText = "Ready to wiggle";
    lastShopMessage = "";
    isPaused = false;
    pauseHasActiveRound = false;
    resumeMusicAfterPause = false;
    stopCountdownRender();
    render();
  });

  pauseButton.addEventListener("click", handlePauseToggle);

  shopButtons.forEach((button, index) => {
    const item = SHOP_ITEMS[index];
    button.addEventListener("click", () => {
      const beforeScore = state.score;
      const beforeOwned = state.ownedItems.length;
      state = applyAction(state, { type: "BUY_ITEM", itemId: item.id, cost: item.cost });
      if (state.ownedItems.length > beforeOwned) {
        lastShopMessage = `Shop: ${item.name} unlocked!`;
      } else if (beforeScore < item.cost) {
        lastShopMessage = `Shop: Need ${item.cost - beforeScore} more dance points for ${item.name}.`;
      } else {
        lastShopMessage = `Shop: ${item.name} already owned.`;
      }
      render();
    });
  });

  controls.append(pauseButton, playAgainButton);
  playPanel.append(musicButton);
  playPanel.append(critters, spriteStage, beatCue, feedback, hype, controls);
  sidePanel.append(shop);
  shellBody.append(playPanel, sidePanel);
  shell.append(title, subtitle, stats, shellBody);
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
