# Restored Life Minigame System Plan

Conclusion: convenience store, fast-food, and labor-office work should become task-based life minigames that produce effect envelopes, not direct cash buttons.

## Purpose

The restored city needs ordinary work loops before more casino, market, and relationship pressure is layered on top. These jobs should feel playable, but their rewards must still flow through the same ledger/action boundary as the rest of the economy.

## Current V0 Contract

Contract modules:

- `src/restored/jobs/life-job-catalog.js`
- `src/restored/jobs/life-job-contract.js`

Version: `restored-life-job-001`.

The first three life job minigames are:

- `job:convenience-store`
- `job:fast-food`
- `job:labor-office`

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

The restored HTML shell now mounts a small life-job panel on supported place actions and exposes `completeLifeJobShift(jobId, presetId)`. The shell does not calculate wages directly; it asks the place-view adapter for a preset result and applies returned envelopes through the result-application module.

Current supported place actions:

- `convenience_store` -> `job:convenience-store`
- `fast_food` -> `job:fast-food`
- `labor_office` -> `job:labor-office`

Current UI presets:

- `steady`
- `rush`
- `endure`

## Boundaries

- No DOM, browser storage, timers, or random outcome generation in the contract.
- No direct cash mutation in UI handlers.
- No direct partner mutation from job handlers.
- Wages render as DP for restored surfaces, while the current ledger bridge still uses local `cash` deltas.
- UI adapters may animate timing, queue, or service tasks, but they must submit performance to the contract and consume the returned effects.

## V0.1 Scope

Convenience store:

- deterministic four-task deck
- shift score
- DP wage envelope
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
- High-grade convenience work can grant an energy drink envelope.
- High-grade labor-office work can grant a work-gloves envelope.
- The live restored HTML contains `completeLifeJobShift` but not its own wage formula.
