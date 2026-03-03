# Module: Game Shell

File: `src/modules/game-shell.js`

## Responsibility
Render the single-screen game UI and wire input, rhythm timing, and shop interactions to state transitions.

## Inputs
- DOM container element.

## Behavior Contracts
- Must render rhythm lane, integrated rainbow meter, score/level stats, sprite stage, and shop.
- Must keep lane timing cues and note previews in sync with the active rhythm schedule.
- Must support tap/click and keyboard lane input (`Enter` / `Space`) for play actions.
- Must provide `Pause` / `Resume`, `Play Again`, and music toggle controls.
- Must update UI immediately after each state-changing action.
- Must use layout mode from `layout.js` based on viewport size.

## Non-Goals
- No persistent storage.
- No networking.
- No server-authoritative game loop.
