# Module: Game Shell

File: `src/modules/game-shell.js`

## Responsibility
Render the single-screen game UI and wire input, rhythm timing, and shop interactions to state transitions.

## Inputs
- DOM container element.

## Behavior Contracts
- Must render rhythm lane, integrated rainbow meter, score display, sprite stage, and shop.
- Must render a lane-adjacent floating HUD with score, play/pause toggle, and music toggle.
- Must render a lane-adjacent floating HUD with score, play/pause toggle, music toggle, and global mute toggle.
- Must include a difficulty mode toggle (`Auto/Chill/Party/Legend`) in the floating HUD.
- Must allow toggling owned shop effects on/off without re-purchasing.
- Must present the shop as an interstitial between levels (and after win), hidden during active rhythm play.
- Must render and evaluate lane hazard notes (red notes should be skipped).
- Must run a boss phase near end-of-level and grant boss-clear reward unlocks.
- Must pause briefly with celebration messaging when advancing to the next rainbow level.
- Must trigger extra confetti bursts when `confetti-cannon` is enabled.
- Must render a pulsing lane callout and require tap-to-start at game start and after level transitions.
- Must show temporary stage banners for transient events and sticky stage banners for persistent states (for example, `Paused` and final win).
- Must keep lane timing cues and note previews in sync with the active rhythm schedule.
- Must support tap/click and keyboard lane input (`Enter` / `Space`) for play actions.
- Must provide `Pause` / `Resume`, `Play Again`, and music toggle controls.
- Must update UI immediately after each state-changing action.
- Must use layout mode from `layout.js` based on viewport size.

## Non-Goals
- No persistent storage.
- No networking.
- No server-authoritative game loop.
