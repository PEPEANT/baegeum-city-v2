# Singularity Race v0.1 Lock

Conclusion: the current repository focus is to finish `특이점레이스` as the playable v0.1 representative game, while preserving later expansion paths without implementing a common engine now.

## Current Interpretation

`Baegeum-City_v3` is a workshop, experiment bench, and storage space. It is not yet a finished integrated platform.

- `index.html` is the Simulacra World launcher that presents `특이점레이스` as the main mode while keeping login, skin, shop, archive, community, and preserved-mode entry slots visible.
- The launcher's primary `바로 플레이` action opens the local/guest Singularity Race flow; public Cloudflare entry remains a separate online action because public rooms can be admin-gated.
- `singularity-race.html` is the current release-target game.
- `singularity-race-admin.html` is the host, operator, observer, and test-bot surface.
- Baegeum City, Dice City, casino, life, Drawing World, editor, skin lab, and related files remain preserved sub-systems.
- The Simulacra World common engine is a future idea, not current implementation work.

## Active Scope

The v0.1 work should stay inside the Singularity Race flow:

```text
index.html
-> singularity-race.html local/guest entry
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

This lock does not reject future expansion. It keeps the path open by avoiding premature abstraction.

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
