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
