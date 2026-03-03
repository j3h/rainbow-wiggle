# Module: State + Layout

Files:
- `src/modules/interaction-state.js`
- `src/modules/layout.js`

## Responsibility
Provide pure, testable rules for state transitions and iPad-web layout decisions.

## Behavior Contracts
- State updates are immutable.
- Invalid titles fall back to a safe default.
- Minimum touch target rule is 44px.
- iPad-like viewport (shortest side >= 768) selects tablet layout.

## Testing
- Covered by `test/interaction-state.test.js` and `test/layout.test.js`.
