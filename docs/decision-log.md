# Decision Log

Use this file as append-only. Never rewrite old decisions; supersede them with new entries.

## D-001 - Web-Only Delivery
- Date: 2026-03-02
- Status: Accepted
- Context: iPad use is required and native install adds friction.
- Decision: Ship as browser game (iPad Safari compatible), no iOS app packaging.
- Consequences: Focus on responsive web UI, touch targets, and simple hosting.

## D-002 - Reversible Delivery Model
- Date: 2026-03-02
- Status: Accepted
- Context: Prior project got stuck from broad changes with side effects.
- Decision: Every change happens on a short-lived branch and is merged only after passing tests + demo check.
- Consequences: More commits and PR overhead, but easier rollback and experimentation.

## D-003 - Minimal-First Fun Loop
- Date: 2026-03-02
- Status: Accepted
- Context: Team wants "super fun" with less complexity.
- Decision: Build one tiny mechanic at a time and test fun quickly with kids before expanding.
- Consequences: Faster iteration, lower risk of architecture drift.

## D-004 - Coherent Theme + 3-Zone Timing Mini-Game
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested cat/dog butt wiggle, disco feel, and a rainbow meter while preserving coherence.
- Decision: Core loop is a dance timing mini-game with three judgment zones (Miss / Good / Perfect) that update a rainbow meter.
- Consequences: Unique identity, simple controls for iPad, and a clear performance signal for one-minute play tests.

## D-005 - Title Lock
- Date: 2026-03-02
- Status: Accepted
- Context: Creative directors selected a final title for this version.
- Decision: Game title is `Butt Wiggle: Rainbow Version`.
- Consequences: Keep this as default title unless future creative direction supersedes it.

## D-006 - 3-Beat Combo Core Loop
- Date: 2026-03-02
- Status: Accepted
- Context: Single-tap timing was fun but too shallow.
- Decision: Core action is now a 3-beat combo round with per-beat judgments and combo bonuses.
- Consequences: Higher engagement per round while preserving touch simplicity on iPad.

## D-007 - Rainbow Progression + Shop
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested levels of rainbowness and a shop.
- Decision: Add rainbow level tiers tied to rainbow meter and a point-based shop for cosmetic upgrades.
- Consequences: Clear long-term progression and reward loop without adding complex controls.

## D-008 - Visual Beat Intro
- Date: 2026-03-02
- Status: Accepted
- Context: Audio count-in was hard to hear reliably during play sessions.
- Decision: Primary timing cue is now visual (`3-2-1-TAP` badge + moving beat cursor lane).
- Consequences: Timing remains playable even with low volume or noisy environment.

## D-009 - Party Mode Feedback
- Date: 2026-03-02
- Status: Accepted
- Context: Experience needed stronger excitement and clearer reward feeling.
- Decision: Add hype text, burst effects on successful beats, and shell energy visuals tied to rainbow progression.
- Consequences: More readable fun feedback without changing core controls.

## D-010 - Music-Synced Tap Targets
- Date: 2026-03-02
- Status: Accepted
- Context: Timing feels better when taps align directly with backing music.
- Decision: Beat targets are now scheduled from the disco audio clock grid instead of fixed UI-only delays.
- Consequences: Tap rhythm feels musically coherent, especially for beats 2 and 3 in combo rounds.

## D-011 - Seven Rainbow Win Levels
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested explicit rainbow levels ending in a final win.
- Decision: Progression is now ordered levels `Violet -> Indigo -> Blue -> Green -> Yellow -> Orange -> Red`; filling Red to 100 wins.
- Consequences: Clear long-term goal and celebratory finish condition.

## D-012 - Single-Tap Rhythm Lane
- Date: 2026-03-02
- Status: Accepted
- Context: 3-combo taps felt too fast and less fun for current play style.
- Decision: Replace combo rounds with a single-tap, music-synced incoming-note lane with visible upcoming beats.
- Consequences: Simpler controls, better anticipation, and steadier rhythm gameplay.

## D-013 - Expanded Shop Catalog
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested more variety in the shop.
- Decision: Expand shop to five unlocks with escalating costs and distinct visual effects.
- Consequences: Stronger long-term reward loop and more personalization for repeated sessions.

## D-014 - Longer Progression + Variable Beat Gaps
- Date: 2026-03-02
- Status: Accepted
- Context: Directors wanted the game to be harder to finish immediately.
- Decision: Reduce rainbow meter gains per hit and vary target beat spacing with a repeating beat-gap pattern.
- Consequences: Levels take longer to clear and rhythm timing is less predictable while staying beat-synced.

## D-015 - Disco Ball + Win Celebration FX
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested more shop content and a stronger win moment.
- Decision: Add `Disco Ball` shop unlock and trigger spotlight + rainbow confetti effects on final Red-level win.
- Consequences: Clearer celebration payoff and richer visual progression loop.

## D-016 - Explosive Hit Feedback
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested a more exciting reward cue on successful taps.
- Decision: Add a lane-centered hit explosion effect (flash + ring + spark particles) for `good` and `perfect` taps, while keeping misses quiet.
- Consequences: Stronger moment-to-moment impact without changing rhythm timing rules or controls.

## D-017 - Rainbow Meter Embedded In Rhythm Lane
- Date: 2026-03-02
- Status: Accepted
- Context: Creative direction requested the rainbow meter be part of the lane instead of a separate bar.
- Decision: Move the rainbow progress meter into the bottom of the rhythm lane as an integrated strip.
- Consequences: Cleaner layout and tighter gameplay readability with progress and timing in one visual region.

## D-018 - De-Emphasized Music Toggle
- Date: 2026-03-02
- Status: Accepted
- Context: Music control should be available but not compete with gameplay focus.
- Decision: Replace the full-width music button with a small side icon toggle.
- Consequences: Lower visual clutter while preserving quick access to audio control.

## D-019 - Pause/Resume Control
- Date: 2026-03-02
- Status: Accepted
- Context: Players need a way to temporarily stop active rhythm rounds.
- Decision: Add a `Pause` / `Resume` control that freezes active lane input, then resumes on-beat alignment when unpaused.
- Consequences: Better play-session control without adding new core mechanics.

## D-020 - Minimal Top HUD
- Date: 2026-03-02
- Status: Accepted
- Context: Level and meter are already visible in lane color and meter strip, so extra labels add clutter.
- Decision: Replace top status text with a compact numeric score box (no "Points" label).
- Consequences: Cleaner screen focus and faster readability during play.

## D-021 - Floating Lane HUD Controls
- Date: 2026-03-02
- Status: Accepted
- Context: Pause/music controls should require minimal finger travel and stay visually lightweight.
- Decision: Group score, play/pause toggle, and music toggle into a small floating HUD next to the rhythm lane; play/pause now acts as start/pause/resume from one control.
- Consequences: Faster control access on touch devices and less layout noise in the main action area.

## D-022 - Shop Tap Reliability Over Visual FX
- Date: 2026-03-02
- Status: Accepted
- Context: Decorative visual layers may overlap the shop region and intermittently steal taps.
- Decision: Make all sprite-stage visuals non-interactive and raise the side-panel/shop stacking context.
- Consequences: Shop buttons remain consistently tappable while keeping effects visible.

## D-023 - Progressive Shop Reveal
- Date: 2026-03-02
- Status: Accepted
- Context: Shop copy should feel cleaner than showing repeated "need points" text.
- Decision: Hide locked items until the player has reached each item's cost threshold at least once in the current run.
- Consequences: Cleaner shop list and clearer sense of unlocking as score increases.

## D-024 - Shop Effect Toggle For Owned Items
- Date: 2026-03-03
- Status: Accepted
- Context: Players requested control to turn purchased visual effects on/off.
- Decision: Keep purchased items owned permanently, but allow toggling each owned effect active/inactive from its shop button.
- Consequences: More player control over visual intensity without removing progression.

## D-025 - Lasers Must Read As Lasers
- Date: 2026-03-03
- Status: Accepted
- Context: Party laser effect looked abstract and did not read clearly as laser beams.
- Decision: Use sharper beam lines, visible emitter heads, and wider sweep motion for the party-laser layer.
- Consequences: Effect is more legible and thematically aligned with "disco lasers".

## D-026 - Dual Difficulty Model (Auto + Selectable)
- Date: 2026-03-03
- Status: Accepted
- Context: Creative direction requested both automatic ramping and player-selectable challenge options.
- Decision: Add difficulty modes `Auto`, `Chill`, `Party`, and `Legend`; auto mode escalates by rainbow stage and harder tiers reduce meter gains per hit.
- Consequences: Levels take longer (about a minute target) with controllable challenge and minimal extra UI complexity.

## D-027 - Lane Hazard Notes
- Date: 2026-03-03
- Status: Accepted
- Context: Creative direction requested a new mechanic and explicitly selected lane hazards.
- Decision: Add red hazard notes that should be skipped; tapping a hazard converts the tap to a miss with clear feedback.
- Consequences: Adds a fresh challenge dimension without heavier punishment.
