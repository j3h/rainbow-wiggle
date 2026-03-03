# Module: Game Shell

File: `src/modules/game-shell.js`

## Responsibility
Render the single-screen UI and wire user actions to state transitions.

## Inputs
- DOM container element.

## Behavior Contracts
- Must render title, round, score, and three primary buttons.
- Must update UI immediately after each action.
- Must use layout mode from `layout.js` based on viewport size.

## Non-Goals
- No persistent storage.
- No networking.
- No game-specific content beyond shell interactions.
