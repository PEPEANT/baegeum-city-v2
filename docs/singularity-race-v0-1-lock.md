# Singularity Race v0.1 Lock

Conclusion: the current repository focus is to finish `특이점레이스` as the playable v0.1 representative game, while preserving later expansion paths without implementing a common engine now.

## Current Interpretation

`Baegeum-City_v3` is a workshop, experiment bench, and storage space. It is not yet a finished integrated platform.

- `index.html` is the Simulacra World launcher that presents `특이점레이스` as the main event-mode door while keeping login, skin, shop, archive, community, and preserved-mode entry slots available from the compact category menu.
- The launcher's primary `이벤트 참가` action opens the public Cloudflare Singularity Race entry. The old visible `바로 플레이` local action and separate `온라인 참가` button are intentionally removed from the root launcher.
- `singularity-race.html` is the current release-target game.
- `singularity-race-admin.html` is the host, operator, observer, and test-bot surface.
- Gameplay identity for this pass is corridor combat race: reach the destination while fighting, losing HP, being downed, and respawning from safe checkpoints. Do not frame it as a car-style fixed-track speed race.
- Baegeum City, Dice City, casino, life, Drawing World, editor, skin lab, and related files remain preserved sub-systems.
- The Simulacra World common engine is a future idea, not current implementation work.

## Active Scope

The v0.1 work should stay inside the Singularity Race flow:

```text
index.html
-> singularity-race.html public event entry
-> profile
-> lobby
-> queue
-> mapPreview
-> race
-> result
-> watch or return to queue/lobby
```

The minimum complete loop is:

- profile setup
- lobby or dev-room entry
- queue and map preview
- host/test start
- countdown
- racing
- result display
- watch-after-finish or restart/return
- mobile controls remaining usable
- admin page room, bot, start, observer, chat, and runner-state rehearsal remaining available

## Do Not Implement Now

- Do not create a new common engine.
- Do not replace the existing Simulacra World launcher with a new platform engine.
- Do not turn launcher login, skin, shop, archive, or community slots into live account/store/entitlement systems before separate contracts exist.
- Do not expand Baegeum City, Dice City, casino, life, parking, burger shop, stock, real estate, item exchange, or shop systems.
- Do not split `singularity-race.html` through a large refactor during the v0.1 stabilization pass.
- Do not delete existing Baegeum City, Dice City, casino, life, Drawing World, editor, or skin-lab files or links.
- Do not rename established entry paths, localStorage keys, or smoke-test contracts without a specific compatibility reason.
- Do not create ZIP deliverables for this pass.

## Future Expansion Protection

Movement authority decision: the current mobile joystick symptom, where upward input can still follow the race direction or stick to the dotted lane wall, is structural evidence of the live `progress + laneOffsetPx` authority model. It is not only a mobile-control bug. In v0.1, tune it as corridor-race comfort. For the reusable Baegeum City PvP/arena engine, `{ x, y, vx, vy }` must be authoritative and `progress` must be derived for ranking, destination, finish, and spectator UI only.

Implementation gate: this decision is recorded, but the live game is not migrated yet. Do not start a client-only x/y patch. A real migration must move the client, Worker session authority, snapshots, prediction/reconciliation, combat, pickups, checkpoints, finish logic, and ranking together. Until that staged migration exists, v0.1 remains corridor-race tuning.

This lock does not reject future expansion. It keeps the path open by avoiding premature abstraction.

Important naming decision: `특이점레이스` is the public/event title, not the reusable engine definition. The future reusable combat/race engine should be treated as a destination-based 2D PvP arena: free top-view `{ x, y, vx, vy }` is authority, while `progress`, destination distance, finish rate, and ranking are derived from position. Do not extract the current progress/lane rail coordinate system as the Baegeum City reusable PvP engine.

Future shared candidates may include:

- user profile
- skins
- phone UI
- chat and community
- ranking and achievements
- save/load
- admin surfaces
- UGC links

If a future idea appears during this pass, record it in MD/TODO only. Do not implement it as engine code yet.

Longer-term branches can still become:

```text
Race Core / City Core / UGC Core / Platform Core
```

The current rule is to finish one representative game first, then extract repeated parts from real working code.

## Verification

Use the Singularity Race quick gate while iterating:

```text
npm run check:singularity-race
```

Before a broad handoff or release check, also run:

```text
npm run check
```

For UI changes, run the local server and verify the relevant player/admin pages in a browser when feasible.
