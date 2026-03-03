# Module: Game Shell

File: `src/modules/game-shell.js`

## Responsibility
Render the single-screen game UI and wire input, rhythm timing, and shop interactions to state transitions.

## Inputs
- DOM container element.

## Behavior Contracts
- Must render rhythm lane, integrated rainbow meter, score display, sprite stage, and shop.
- Must render a lane-adjacent floating HUD with score, play/pause toggle, and music toggle.
- Must allow toggling owned shop effects on/off without re-purchasing.
- Must keep lane timing cues and note previews in sync with the active rhythm schedule.
- Must support tap/click and keyboard lane input (`Enter` / `Space`) for play actions.
- Must provide `Pause` / `Resume`, `Play Again`, and music toggle controls.
- Must update UI immediately after each state-changing action.
- Must use layout mode from `layout.js` based on viewport size.

## Non-Goals
- No persistent storage.
- No networking.
- No server-authoritative game loop.
