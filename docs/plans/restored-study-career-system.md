# Study And Career System

Conclusion: study and company work are a separate career loop: library/university raise intelligence and credits, then company shift choices pay DP and advance promotion without adding reward formulas to the HTML shell.

## Feature Identity

- Feature id: restored:career:study-career-system
- Title: Study And Career System
- Domain: career
- Primary surface: place
- Related docs:
  - docs/baegeum-city-v2-restored-recomposition-plan.md
  - docs/baegeum-city-v2-restored-ui-online-ranking-chat-roadmap.md

## Current Baseline

- Current playable behavior: the Baegeum City job surface can expose a small study/career panel beside ordinary life-job panels.
- Current files or catalogs involved: `src/restored/career/study-career-contract.js`, `src/restored/career/study-career-application.js`, `src/restored/career/study-career-place-view.js`, `src/restored/career/study-career-summary-view.js`, `src/restored/data/place-catalog.js`, and `baegeum-city-v2-dice.html`.
- Existing blockers: browser click verification is still blocked when the Codex in-app browser pane is unavailable.

## Intended Player Loop

```text
library self-study
-> intelligence and study credits rise
-> university night class costs DP but grants more credits
-> company shift unlocks when intelligence and credits are high enough
-> choose documents / overtime report / team support company work
-> company shift pays DP and adds promotion points based on the chosen work style
-> promotion changes current company level and visible job title
```

## UI Surface Plan

- Top bar impact: future job title can read from `profile.jobTitle`; no new permanent top-card.
- My Info impact: current My Info shows a read-only education/career summary with credits, study hours, intelligence, company level, next level, and qualification/promotion progress.
- Bottom nav impact: none. Library, university, and company are inside the Baegeum job/place surface.
- Phone app impact: future ranking and job apps may read career state, but this slice is place-first.
- Modal or panel impact: the first UI is a compact `Study / Career` panel rendered by `study-career-place-view.js`.
- Mobile constraints: study buttons stay compact, and company work choices are grouped under one company section.
- Illustration or image slot: optional future building art must use asset manifest ids.

Rule: bottom nav is location-aware. It must show only actions and places valid for the current context, such as `home_inside`, `home_front`, `baegeum-city`, `dice-city`, or `seosan-city`.

## State And Catalog Plan

- New state fields: `education` and `career`.
- Static catalog entries: `baegeum:library`, `baegeum:university`, and `baegeum:company-district`.
- Migration or save compatibility: missing `education` and `career` state falls back to initial defaults.
- Selectors available now: education summary, company level summary, and promotion progress through `study-career-summary-view.js`.
- Selectors needed later: job history, reputation, interview readiness, and ranking snapshot helpers.
- Events produced now: `study_completed` and `company_shift_completed` result envelopes.
- Company shift presets now: `career:company-shift:documents`, `career:company-shift:overtime-report`, and `career:company-shift:team-support`.

Contract version: `restored-study-career-001`.

## Economy And Ownership Impact

- Cash/chips/items affected: university costs DP; company shifts pay DP. No chips.
- Ledger or event boundary: all money effects are `economy_ledger_entry` envelopes.
- Inventory or asset ownership rules: none in the first slice.
- Risks: company shifts must not become direct cash buttons detached from study gates or duplicated wage formulas in HTML.

## Relationship And Emotion Impact

- Partner state affected:
- Memory events:
- Dialogue triggers:
- Emotion fields:
- Do not mutate partner emotion directly from casino or money handlers.

## Ranking Impact

- Local rank impact:
- Online leaderboard impact:
- Job or occupation ranking impact:
- Board ids:
- Snapshot shape changes:
- Server authority needed:

## Job / Occupation Impact

- Job ids: `career:baegeum-office`.
- Unlock conditions: starter company level needs intelligence 48 and credits 8.
- Income or skill effects: company shifts pay DP, consume energy/mental, and add promotion points.
- UI display: company choices show work style, current level, projected wage, promotion hint, or the missing qualification message.
- Ranking category: future `jobIncome`, `jobRank`, and `jobReputation`.
- Online season behavior: none until ranking snapshots are server-owned.

## Chat Impact

- Partner DM impact:
- Public channel impact:
- Message shape changes:
- Moderation or rate-limit needs:
- Offline fallback:

## Online Authority

- Offline behavior:
- Online behavior:
- Server-owned decisions:
- Dev-mock behavior:
- Version gates:

## Asset Intake

- Required images:
- Required audio:
- Source or license notes:
- Manifest ids:
- Fallback behavior:

## Implementation Order

1. Add pure study/career contract.
2. Add application helper for `education`, `career`, profile stats, and DP effects.
3. Add place-view panel on the existing Baegeum job surface.
4. Add library, university, and company district to the place catalog.
5. Wire the restored HTML through one thin `completeStudyCareerAction()` hook.
6. Add the read-only My Info education/career summary.
7. Add company work choices driven by contract presets.
8. Verify with the narrow contract check and `npm run check`.

## Verification Plan

- Narrow check: `node tools/check-restored-study-career-contract.cjs`
- Full check: npm run check
- Browser check: open Baegeum City -> jobs and verify the study/career panel, the three company work choices, then return to My Info and verify the education/career summary.
- Manual play notes: library should work without DP, university should require DP, and company work choices should stay locked until study conditions are met.

## Do Not

- Do not add large inline systems to `baegeum-city-v2-dice.html`.
- Do not bypass study gates for company promotion.
- Do not add company wage or promotion formulas to `baegeum-city-v2-dice.html`.
- Do not merge company level with wealth rank.
- Do not add fake offline lobby behavior.
- Do not make online ranking client-authoritative.
- Do not add direct asset paths without manifest ids.
- Do not put every phone app or city place into global bottom navigation.
