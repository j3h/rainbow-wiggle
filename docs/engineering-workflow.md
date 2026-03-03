# Engineering Workflow

## Branching Model
- Base branch: `main`
- Feature branches: `codex/<short-topic>`
- Each branch should represent one reversible idea.

## Required Loop For Every Change
1. Define the change in one sentence.
2. Add or update tests for the expected behavior.
3. Implement the smallest code change that passes tests.
4. Run `npm test`.
5. Demo quickly in browser (`npm run start`) including iPad viewport.
6. Record any product decision in `docs/decision-log.md`.
7. Merge only when all checks pass and behavior is approved.

## Commit Rules
- Keep commits small and single-purpose.
- Commit message template: `<type>: <what changed> [D-xxx if relevant]`
- Types: `feat`, `fix`, `test`, `docs`, `refactor`.

## Definition Of Done
- Tests pass.
- No existing behavior regressions.
- Vision and decision docs updated when applicable.
- A non-technical adult can demo the feature in under 2 minutes.
