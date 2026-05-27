# Restored Life Minigame System Plan

Conclusion: convenience store, fast-food, and labor-office work should become task-based life minigames that produce effect envelopes, not direct cash buttons.

## Purpose

The restored city needs ordinary work loops before more casino, market, and relationship pressure is layered on top. These jobs should feel playable, but their rewards must still flow through the same ledger/action boundary as the rest of the economy.

## Four-Tier Job Roadmap

Rule: Baegeum City jobs are not just money buttons. They define how the player survives, earns trust, builds credit, and later gains market information.

### V0.1 Starter Labor

Goal: make the first survival loop work before stock, leverage, or Dice City expansion.

Included:

- MacBurger / fast-food shift
- convenience-store shift
- labor-office day job
- won wage, energy, mental, time, reputation, and relationship-hook envelopes
- My Info can read the current job/career summary later, but no new phone app is required

Excluded:

- fixed schedules
- absences
- company hiring
- business ownership
- direct stock tips

Verification:

- each starter job has a different wage/time/energy profile
- job results emit `currency: "WON"`
- high-grade work can create inventory or relationship hooks

Exit criteria:

- The player can reliably earn ordinary 원 before needing stocks or Dice City.

### V0.2 Fixed Part-Time Work

Goal: turn repeated work into identity and reliability.

Included:

- fixed night MacBurger
- fixed night convenience store
- cafe / cashier / delivery-contract candidates
- work streak, absence, reliability, and weekly income records
- relationship trust/stability hooks from steady work

Excluded:

- full company ladders
- online rankings
- business ownership

Verification:

- repeated attendance increases reliability
- absence can lower trust or reputation through an event boundary
- fixed work still pays 원, not DPA

Exit criteria:

- Work history can explain why partners, creditors, and future employers trust or distrust the player.

### V0.3 Company And Career Work

Goal: add stable employment that trades time and mental energy for credit and information access.

Included:

- small-office worker
- call-center worker
- Baegeum Bank contractor
- Baegeum Securities intern
- insurance sales and loan-counselor candidates
- credit, loan capacity, and market-info hooks

Excluded:

- business ownership
- public company control
- direct insider-trading rewards

Verification:

- company work raises ordinary cash and career progress through won effects
- study/intelligence/credits gate higher roles
- job events can unlock market hints without giving guaranteed profits

Exit criteria:

- Employment changes how the player is seen by the economy, relationships, and market apps.

### V0.4 Business And Power Jobs

Goal: let the late game shift from worker to employer or market actor.

Included:

- franchise owner
- delivery-agency owner
- small-company CEO
- startup CEO
- listed-company representative
- market whale
- Dice City investor
- staff, rent, advertising, reputation, and public-news events

Excluded:

- server-authoritative online business ownership until online contracts exist
- automatic passive-money loops without upkeep costs

Verification:

- business income is separate from hourly wage
- staff/rent/advertising costs can offset revenue
- public news and ranking hooks read business events through neutral envelopes

Exit criteria:

- The player can climb from labor income to ownership without collapsing job, market, and casino economies into one button.

## Current V0 Contract

Contract modules:

- `src/restored/jobs/life-job-catalog.js`
- `src/restored/jobs/life-job-contract.js`
- `src/restored/jobs/life-job-fixed-contract.js`

Version: `restored-life-job-001`.

The first live starter job minigames are:

- `job:convenience-store`
- `job:fast-food`
- `job:labor-office`
- `job:pc-room`
- `job:flyer`
- `job:delivery`
- `job:parking`
- `job:car-wash`
- `job:cleaning`
- `job:factory`
- `job:port`
- `job:market`

Each shift accepts provided performance inputs:

- accuracy
- speed
- service
- stamina
- mistakes
- combo

The contract scores the shift as S/A/B/C/D/F and returns envelopes only:

- `economy_ledger_entry`
- `player_state_patch`
- `relationship_event_hook`
- optional `inventory_item_grant`
- `ui_message`

## Current Live Adapter

Live adapter modules:

- `src/restored/jobs/life-job-place-view.js`
- `src/restored/jobs/life-job-result-application.js`
- `src/restored/jobs/life-job-history-view.js`

The restored HTML shell now mounts a small life-job panel on supported place actions and exposes `completeLifeJobShift(jobId, presetId)`. The shell does not calculate wages directly; it asks the place-view adapter for a preset result and applies returned envelopes through the result-application module.

The live starter-labor panel now renders Korean job/task copy and shows a preview for each preset:

- expected grade
- expected won wage
- energy/mental impact
- shift time
- reputation impact

The live result application also maintains a small local work history:

- `jobHistory` keeps the latest completed shifts, capped to 20 records.
- `jobStats` aggregates total shifts, total won wages, best grade, latest grade, and current same-job streak by job id.
- My Info renders this through the read-only `life-job-history-card`.
- This is local/offline progression only; future online rankings must read server-owned snapshots instead of trusting this state.

The first fixed part-time slice is intentionally small:

- `fixedJobContract` stores one active local fixed job, reliability, attendance count, missed count, current streak, latest grade, and fixed-job won income.
- Supported job panels expose `고정 알바 등록`, which creates or resumes the fixed contract for that job.
- Matching completed shifts increase attendance, streak, total fixed-job won income, and reliability through the result-application path.
- Non-matching shifts still update ordinary `jobHistory/jobStats`, but do not update the active fixed contract.
- The My Info fixed-job card exposes a local `결근 처리` control. Absence increments `missedCount`, resets the fixed-job streak to 0, lowers reliability, and does not create ordinary wage history.
- This is local identity/reliability state only; it is not trusted for future online job rankings or server authority.

Current supported place actions:

- `convenience_store` -> `job:convenience-store`
- `fast_food` -> `job:fast-food`
- `labor_office` -> `job:labor-office`
- `pc_room` -> `job:pc-room`
- `flyer` -> `job:flyer`
- `delivery` -> `job:delivery`
- `parking_lot` -> `job:parking`
- `car_wash` -> `job:car-wash`
- `cleaning` -> `job:cleaning`
- `factory` -> `job:factory`
- `port` -> `job:port`
- `market` -> `job:market`

Building entry status:

- The Baegeum City job street cards expose `entryActionId` values and render `입장` buttons through `renderRestoredPlaceSurfaceHtml()`.
- The restored HTML owns a thin `enterRestoredPlaceBuilding(actionId)` router that opens the selected building surface without adding more bottom-nav tabs.
- Study/career buildings (`library`, `university`, `company`) reuse the study/career panel, while labor buildings reuse the life-job panel.

Current UI presets:

- `steady`
- `rush`
- `endure`

## Currency Boundary

- Life-job wages are ordinary won/cash income, not DP/DPA.
- DPA remains a Dice City casino/exchange token handled by `src/restored/economy/dpa-token-contract.js`.
- Ledger envelopes for work use `currency: "WON"` and `deltas.cash`; UI should render wages as `원`.

## Boundaries

- No DOM, browser storage, timers, or random outcome generation in the contract.
- No direct cash mutation in UI handlers.
- No direct partner mutation from job handlers.
- Wages render as 원 for restored surfaces, while the current ledger bridge still uses local `cash` deltas.
- UI adapters may animate timing, queue, or service tasks, but they must submit performance to the contract and consume the returned effects.

## V0.1 Scope

Convenience store:

- deterministic four-task deck
- shift score
- won wage envelope
- energy/mental/time condition effect
- relationship hook for steady work
- energy drink bonus for high-grade work

Fast-food:

- deterministic four-task deck
- higher wage than convenience store
- higher energy cost
- relationship hook for hard work
- food coupon bonus for high-grade work

Labor office:

- deterministic four-task day-labor deck
- highest starter wage
- highest starter energy cost
- relationship hook for visible hard work
- work-gloves bonus for high-grade work

Additional simple building jobs:

- PC room: night counter / snack / noise handling
- flyer board: lowest-risk immediate cash work
- delivery hub: speed-heavy and mental-risk work
- parking lot: stable guidance and ticket work
- car wash: physical work with reputation hooks
- cleaning office: quiet short shift
- Seosan factory: high-wage, high-cost industrial shift
- Seosan port: cargo unloading shift
- Seosan market: small merchant assistant shift

## Later Expansion

- delivery rush minigame
- PC room part-time shift
- motel front-desk shift
- factory overtime shift
- interview/job promotion chain
- relationship reactions to stable work history
- ranking board by occupation and weekly wage

## Verification Checklist

- `npm run check` includes the life job contract check.
- A perfect shift grades S.
- A failed shift grades F.
- Fast-food pays more and costs more energy than convenience store.
- Labor-office pays more and costs more energy than fast-food.
- A completed shift emits a wage ledger envelope.
- A completed shift emits player condition and relationship hook envelopes.
- Live preset buttons preview energy, mental, time, and reputation effects before the player works.
- High-grade convenience work can grant an energy drink envelope.
- High-grade labor-office work can grant a work-gloves envelope.
- Baegeum job-street building cards render `입장` buttons for job, study, and company buildings.
- The live restored HTML contains `completeLifeJobShift` but not its own wage formula.
- My Info renders `life-job-history-card` from the history view without calculating wages in the HTML shell.
- Job panels expose `registerFixedLifeJobContract` for fixed part-time registration.
- Fixed matching shifts update attendance and reliability through `life-job-fixed-contract.js`.
- The fixed-job absence hook exposes `markFixedLifeJobAbsence` and lowers reliability without paying wages.
- My Info renders fixed job title, reliability, attendance, streak, and fixed-job won income.
