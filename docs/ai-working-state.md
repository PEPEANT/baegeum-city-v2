# AI Working State

Date: 2026-06-03
Observed: User wanted the runner-head UI simplified: remove the separate rank badge above the HP area, show live rank as `#1` on the nickname label, and keep overhead HP bars hidden until damage/down state matters.
Changed: In `singularity-race.html`, runner rank labels now use `#rank`, runner avatars pass a `nameLabel` like `nickname #1`, and damaged/down runners get `has-visible-health` so overhead HP bars are hidden while HP is full. Removed the mobile CSS rule that forced runner rank badges visible. In `src/restored/games/singularity-race-runner-view.js`, rank badges are kept hidden and the nameplate accepts the rank-decorated label. Updated mobile/combat smoke guards and the running-screen ranking guard in `docs/plans/restored-marathon-stadium.md`.
Verified: `node --check src/restored/games/singularity-race-runner-view.js`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: Browser visual verification was not repeated in this slice; human should glance at one local race to judge exact label spacing.
Next: If the head UI still feels crowded, the next smallest tweak is reducing the nameplate max width or showing rank only for top 10.
Do not: Reintroduce a separate runner-head rank badge above the HP/name layers.

Date: 2026-06-03
Observed: User switched priority to urgent, dangerous Singularity Race bugs. The highest-risk confirmed issue was the online finish-window client sync: Worker `finish_window_started` sends `firstFinishAtMs` and `finishWindowEndsAtMs`, but the client only accepted `finishWindowStartedAtMs`, leaving `getActiveRaceFinishWindow()` without a start time so the first-finisher countdown HUD could fail to appear. Full project verification was also blocked by `tools/smoke-singularity-race-progression.cjs` exceeding the 300-line size limit.
Changed: Updated `syncActionFinishWindowFromPayload()` in `singularity-race.html` to accept `firstFinishAtMs` as the finish-window start, accept `finishWindowMs` as the duration, and respect explicit zero values so stale finish-window state can clear after reset/summary packets. Added Cloudflare smoke guards for the server payload aliases. Compressed the progression smoke watch-camera assertions so the file stays under the size gate.
Verified: Live Worker `/rooms` returned `roomActive:true` and `entryOpen:false` with the expected public room contract. `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-finish-window.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `npm run check:singularity-race`, `git diff --check`, `node tools/smoke-singularity-race-progression.cjs`, and full `npm run check` passed.
Blocked: Browser visual verification was not repeated in this slice; this was a code/contract risk pass.
Next: If testing online, have one player finish first and confirm the top finish countdown appears immediately while the finisher enters watch mode and chat remains reachable.
Do not: Regress client finish-window sync back to requiring only `finishWindowStartedAtMs`; Worker packets may use `firstFinishAtMs`.

Date: 2026-06-03
Observed: User wanted the remaining Singularity Race spectator slice closed: pure spectators need a visible chat action and manual runner camera switching, while finishers and spectators should share the same watch-target state.
Changed: In `singularity-race.html`, spectator/post-finish watch mode now shares `state.action.watchTargetRunnerId`, resolves camera anchoring through unfinished watchable runners, and exposes fixed previous/next runner controls. Spectator CSS no longer hides the whole `race-input-controls` layer; it hides only movement/attack/skill/item controls while keeping `#race-chat-action-button` clickable. The watch camera controls are hidden for admin observer mode and closed rooms. Added smoke guards for the watch controls, shared target state, spectator chat action, and removed whole-input spectator hide.
Verified: `node --check` for the edited smoke/contract files, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, full `npm run check`, and browser verification passed. Browser verification used a dev room with three test bots: spectator mode showed enabled previous/next runner buttons, the chat action button, and a `다음 러너` click changed the watch label from `하늘 4%` to `초코 3%`.
Blocked: None. Changes are still uncommitted.
Next: Human-review spectator and post-finish watching in a normal dev room, then continue with any remaining race feel/UI polish.
Do not: Reintroduce `.shell.is-spectator .race-input-controls { display: none; }` or make spectators publish movement/combat packets.

Date: 2026-06-03
Observed: User wanted the Singularity Race mobile race view to stop covering the lower field: keep the existing room chat transport, remove/compact skin explanatory UI on phones, make chat open/close compact, and shrink mobile controls so runners remain visible.
Changed: In `singularity-race.html`, the mobile queue skin panel now hides its explanatory copy, uses a smaller toggle, smaller cards, smaller selected badges, and shorter grid height. The mobile in-race chat overlay is reduced to a small upper-left log, composing height is shorter, message cards and input controls are smaller, the closed state leaves only a tiny `CHAT` chip, and the close button is forced visible on mobile. Mobile race controls were compacted: smaller options/chat buttons, smaller joystick, sprint, attack, skill, and item buttons, plus reduced action-button sublabels. The existing room chat data path and send/receive logic were not changed.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: Browser-plugin visual verification is still not available in this environment; human/mobile browser review should confirm the exact feel.
Next: Human-review mobile portrait and landscape race screens; if still crowded, the next safe tweak is hiding the chat log by default and leaving only the `CHAT` chip until tapped.
Do not: Replace the existing room chat transport or add a separate mobile-only chat system.

Date: 2026-06-03
Observed: User clarified the Singularity Race issue is the gray road/wall loop artifact itself, not item glow. A first clipping attempt hid too much and made a normal top wall disappear.
Changed: Added `src/restored/games/marathon-trail-wall-clip.js` and routed `createRestoredMarathonTrailWallSvgPaths()` through it. The helper now splits decorative wall SVG paths at short road-interior artifact runs and at small U-shaped foldbacks inside long protected runs, while preserving the long normal top wall segments. `singularity-race.html` keeps the normal draw order (`outline`, `surface`, then wall layers) so the road surface does not hide whole walls. `tools/check-restored-marathon-contract.cjs` now guards that wall paths split into multiple subpaths.
Verified: Browser preview via the local static server showed the top wall restored and the red/left foldback triangle removed. `node --check src/restored/games/marathon-trail-wall-clip.js`, `node --check src/restored/games/marathon-trail-geometry.js`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Blocked: None. The change is still uncommitted.
Next: Human-review the in-game map at normal zoom; if another wall loop appears, tune the clip helper with that exact viewport rather than moving map control points broadly.
Do not: Reorder `trail-surface` above the wall layers as the fix; that visually deletes normal walls.

Date: 2026-06-03
Observed: User noticed the Singularity Race lobby could show `생성된 방 없음` while the `입장` / `관전 입장` buttons still looked usable.
Changed: Tightened the Cloudflare public-room gate in `singularity-race.html`: the built-in Cloudflare fallback room now starts with `roomActive:false` and `entryOpen:false`, `normalizeCloudflareRoomSummary()` treats missing `roomActive` as inactive instead of open, inactive rooms force `방 없음` / `관전 불가` button labels, and disabled primary/secondary lobby buttons now visibly fade. Local non-online mode now labels the fallback as `로컬 테스트방` so local practice is not confused with a missing public room.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser runtime verification was attempted but the available Playwright browser profile was locked and this repo does not have a local `playwright` package installed.
Blocked: None for the code path; visual browser confirmation should be repeated when the browser runtime is free.
Next: Human can re-open the lobby: plain local URL should say `로컬 테스트방`; `?online=cloudflare` with no admin-created room should show `방 없음` and disabled entry buttons.
Do not: Treat absent Cloudflare `/rooms` or missing `roomActive` as an open public room.

Date: 2026-06-03
Observed: User confirmed the core diagnosis for the mobile joystick issue: upward stick input follows the race direction or sticks to the dotted lane wall because live movement authority is `progress + laneOffsetPx`, not free `{ x, y }`.
Changed: Reinforced the long-term movement decision in `docs/singularity-race-v0-1-lock.md` and `docs/singularity-race-free-movement-prototype-brief.md`: treat the current symptom as structural evidence of the rail/corridor authority model, tune only as v0.1 comfort, and keep the reusable Baegeum City PvP/arena engine direction as authoritative `{ x, y, vx, vy }` with derived `progress` for ranking/destination/finish UI. Added a live-game migration gate that blocks client-only x/y patches and requires staged client+Worker authority, snapshots, prediction, combat, pickups, checkpoints, finish, and ranking migration. Also applied the v0.1 corridor comfort fix in `singularity-race.html`: mobile joystick drag now stores `mobileDirection` screen/world direction and sends it through the existing `direction` input path instead of converting upward drag directly into race `forward` intent. `mobileIntent` is cleared for active joystick movement so `resolveSingularityRaceInputMovement()` uses the same screen-direction projection path as keyboard movement. Updated the mobile race UI smoke guard.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, and `npm run check:singularity-race` passed after the code change.
Blocked: The full client/Worker migration from `progress/lane` authority to `{ x, y, vx, vy }` is intentionally not started in this slice; this is only the v0.1 mobile input comfort fix.
Next: If the human wants implementation, start with the pure `deriveProgressFromXY(position, course)` contract and a flagged local/dev-only free-position runner model before touching public online authority.
Do not: Present mobile joystick wall-sticking as fully fixable inside the current progress/lane authority model, or start the x/y rewrite inside `singularity-race.html` without a staged plan.

Date: 2026-06-03
Observed: User wanted the Singularity Race queue-room skin picker to be collapsible on both mobile and PC, always start collapsed, and stop the mobile queue chat panel from being clipped in portrait/landscape preview.
Changed: In `singularity-race.html`, the queue skin panel now has `#queue-skin-toggle`, starts from `queueSkinPanelOpen: false`, resets to collapsed whenever entering the queue screen, and only renders skin cards while expanded. The queue shell toggles `queue-skin-expanded`; collapsed queue skin panels hide their body. Mobile queue chat now uses a viewport-clamped height with message `min-height: 0` so the chat form and bottom edge stay inside short portrait/landscape screens. Added smoke guards in `tools/smoke-singularity-race-v01-lock.cjs` and `tools/smoke-singularity-race-mobile-race-ui.cjs`.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Playwright verified queue room at 390x740, 740x390, and 1366x768 starts collapsed with `스킨 펼치기`, 0 skin cards rendered, chat bottom fitting inside the viewport, and PC expand shows `스킨 접기` with 24 skin cards.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-review the queue-room feel locally, then commit/push/deploy when ready.
Do not: Make queue skin cards render while collapsed, or restore the mobile queue chat to a fixed 360px minimum height.

Date: 2026-06-03
Observed: User wanted the Singularity Race loading artwork to appear before the first launcher/profile scene itself, because the launcher could show before the skin/stage felt ready.
Changed: In `singularity-race.html`, `#race-loading-overlay` now starts visible in the HTML, initial boot calls `settleInitialLauncherLoading()`, and the page waits for the profile scene images, selected skin preview, skin-card images, and two animation frames before hiding the overlay. The old profile-submit forced pause was neutralized with `RACE_LAUNCHER_LOADING_MIN_MS = 0`, so clicking `start` no longer shows the long loading artwork again. `tools/smoke-singularity-race-v01-lock.cjs` now guards that the initial overlay is not restored to `hidden`.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-items.cjs`, full `npm run check`, and `git diff --check` passed. Playwright verified the initial overlay is visible with `런처 준비 중`, hides after about 2073ms, shows the profile launcher with 24 skin cards and complete selected-skin preview, and a direct start click changes to lobby in about 15ms with the overlay still hidden.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-review the first boot feel locally, then commit/push so Vercel can redeploy when ready.
Do not: Put the 2.4s loading pause back on profile submit, or let the first launcher become visible before the skin/stage preparation pass finishes.

Date: 2026-06-03
Observed: User wanted the Singularity Race first profile/launcher scene polished: stop the stage/character from moving separately, keep the full skin picker visible on tiny mobile portrait, show a current-skin label under the `2026 AGI` title, restore a larger PC launcher scale after the mobile fit pass made it too small, and show the loading artwork once when the first launcher start button is pressed.
Changed: In `singularity-race.html`, the old `podium.png` layer is hidden and `.profile-avatar-rig` now owns both the CSS-coded stage and selected skin preview, so the character and platform share one anchor. Mobile portrait keeps the compressed 24-card full picker, while desktop was re-expanded to a 1380px launcher with a 760px hero, 360px profile controls, 52px skin rows, and a larger avatar/stage. `#profile-skin-name` is now a small current-skin label under the `2026 AGI` title. The first profile submit is the only path with a forced loading overlay and uses `RACE_LAUNCHER_LOADING_MIN_MS = 2400`; later ready/join flow does not get that forced pause.
Verified: Browser checks at 303x430, 303x500, 303x568, 760x360, 1100x720, and 1845x900 confirmed no page overflow, all 24 skin cards visible, mobile unchanged, PC larger, the old podium layer hidden, and first-start loading visible for about 2447ms. `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-items.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-review the first launcher/profile scene feel on mobile and desktop, then commit/push/deploy the current cleanup and Singularity Race stabilization batch when ready.
Do not: Return to separately aligning `podium.png` against the live character, make the mobile skin grid scroll/collapse on tiny portrait screens, or add forced loading pauses after the first launcher start.

Date: 2026-06-03
Observed: User wanted the Singularity Race first profile/launcher scene polished: remove the floating skin-name text above the character, put the player and start controls inside the blue prep background, shrink the skin cards, stop the stage/character from moving separately, replace the awkward `2027 AGI` image shadow with code-rendered pixel text, change the visible title to `2026 AGI`, show `스킨명 : 현재스킨` under the title, and keep the full skin picker visible on tiny mobile portrait, mobile landscape, and PC.
Changed: Updated `singularity-race.html` profile prep layout so the nickname input and start button live inside `.profile-hero`, the visible title is code-rendered `.profile-title-text` (`2026 AGI`) with the old PNG title layer and swoosh hidden, and `#profile-skin-name` is now a small title-underlabel (`스킨명 : ...`) instead of a floating character nameplate. Hid the old `podium.png` layer and introduced `.profile-avatar-rig`, a single CSS-coded stage/character wrapper; the selected skin preview now moves inside that rig so the character and platform share one anchor. Desktop and mobile landscape use a right-column skin picker; desktop controls are capped to 292px, mobile landscape controls to 226px, and tiny/mobile portrait controls to 198px with a blue start button. Tiny portrait (`max-height: 640px`) uses a compressed hero and 31px skin-card rows so the full 24-card picker remains visible instead of collapsing away. Added v0.1 smoke guards for the rig, visible selected-skin label, and controllable title.
Verified: `node --check src/restored/ui/layered-scene.js`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-items.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser verification at 303x430, 303x500, 303x568, 760x360, and 1100x720 confirmed `2026 AGI`, visible `스킨명 : 특붕이`, hidden PNG title/swoosh and old podium layer, no page overflow, all 24 skin cards visible, smaller nickname/start controls, mobile landscape and PC right-column skin pickers, and zero console errors or 4xx/5xx responses.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-review the first launcher/profile scene feel on mobile and desktop, then commit/push/deploy the current cleanup and Singularity Race stabilization batch when ready.
Do not: Reattach `#profile-skin-name` to `.scene-content`, move the start controls back outside the blue prep scene, restore the title PNG shadow/swoosh as the visible `2027 AGI`, or return to separately aligning the old `podium.png` layer against the live character.

Date: 2026-06-03
Observed: User wanted the local root cleaned without deleting project files, leaving the directly clickable entry HTMLs visible while moving non-primary diagnostics/prototypes/assets into folders.
Changed: Moved the Baegeum world editor to `archive/tools/editor.html`, the blackjack design prototype to `archive/prototypes/blackjack-design-test.html`, the Simulacra World diagnostic page to `archive/diagnostics/simulacra-world.html`, and the Singularity Race loading/lobby PNGs under `assets/singularity-race/`. Updated links, smoke paths, and docs so `index.html` stays the launcher and the archived pages still resolve their relative imports. The archived blackjack prototype remains only a handoff/design page with chip-click flight animation; Do not: Wire this prototype into `baegeum-city-v2-dice.html`.
Verified: `node tools/smoke-editor-entry.cjs`, `node tools/check-blackjack-design-prototype.cjs`, `node tools/check-simulacra-world-engine-contract.cjs`, `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser verification loaded `index.html`, `archive/tools/editor.html`, `archive/diagnostics/simulacra-world.html`, and `singularity-race.html`; the race loading CSS used `assets/singularity-race/loading.png` with HTTP 200, and there were zero console errors or 4xx/5xx responses.
Blocked: None so far.
Next: Commit/push the current cleanup and Singularity Race stabilization batch when the human is ready, or continue with the next product slice.
Do not: Delete the archived files, restore the old root clutter, or make `index.html` a redirect-only shim.

Date: 2026-06-03
Observed: User wanted the Singularity Race transition loader to use `Loading.png` and move the progress treatment toward the bottom instead of the small centered spinner/card.
Changed: Restyled `race-loading-overlay` in `singularity-race.html` into a full-bleed `Loading.png` loading scene with a bottom HUD panel and animated progress bar. Replaced the spinner DOM with `race-loading-bar` / `race-loading-bar-fill` and added v0.1 smoke guards for the loading image and bar tokens.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, and `git diff --check` passed. Playwright captured the profile-start loading state and confirmed the overlay used `Loading.png`, the bottom progress bar was visible, the page returned to lobby after the transition, and there were zero console errors or non-audio failed requests.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Run the full project check, then human-review the loader feel on desktop/mobile timing.
Do not: Return the loader to a centered card that hides the artwork, or make `Loading.png` part of the initial non-loading profile render.

Date: 2026-06-03
Observed: User asked whether a first-entry loading system plus lazy asset loading would solve the slow-feeling Singularity Race entry. Browser verification showed the old player page requested 17 `.mp3` files on the profile/launcher screen because every race audio element used `preload="auto"`.
Changed: Updated `singularity-race.html` so hidden player audio elements start with `preload="none"` and keep their URL in `data-src`; `attachRaceAudioSource()` assigns `src` only when a specific BGM/SFX track is actually played, while `waitForRaceAudioMetadata()` preserves countdown offset support. Added a small `race-loading-overlay` for profile-to-lobby and event-entry transitions. Extended the audio and v0.1 smoke guards, and updated the marathon stadium plan's audio guard.
Verified: `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, and `git diff --check` passed. Playwright loaded the local profile URL and confirmed first entry has 17 audio nodes but 0 loaded audio sources, all preload values are `none`, and 0 `.mp3` resource requests. Clicking profile start and then lobby entry showed the loading overlay titles, reached `queue`, loaded only the used tracks, and produced zero console errors or non-audio failed requests.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Run the full project check, then human-play the public/local entry flow to confirm the loading overlay timing feels natural.
Do not: Reintroduce eager `audio.preload = "auto"` plus immediate `audio.src = track.src` inside setup; first profile/launcher render must not download the full BGM/SFX set.

Date: 2026-06-03
Observed: User reported that refreshing `singularity-race.html?codex=sword-final-browser-2` opened the room-list lobby instead of the first launcher/prep scene because an existing `singularity-race:profile:v1` localStorage profile made the initial screen skip `PROFILE`.
Changed: Updated `singularity-race.html` so `resolveInitialRaceScreen()` always starts normal player loads on the profile/launcher screen while preserving saved nickname/skin values; admin direct launch and admin observer shell still go straight to race. Added v0.1 smoke guards so saved profiles cannot reintroduce the old `screen: savedProfile || ... LOBBY` branch.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser-plugin `iab` was unavailable, so cached Playwright fallback loaded the exact local URL with a stored profile and confirmed `screen=profile`, nickname prefilled as `CodexSaved`, lobby hidden before start, then `screen=lobby` only after clicking the profile start button; zero console errors and zero non-audio failed requests.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-refresh the local page without `resetProfile=1`; it should now show the launcher/prep scene first even with an existing profile.
Do not: Restore saved-profile auto-skip to lobby for normal player loads; keep direct race entry limited to admin direct launch or observer shell flows.

Date: 2026-06-03
Observed: User identified the biggest race-flow bug: if one runner reaches the destination but another runner is stuck, dead, AFK, or griefing, the public Worker only finished the race when every player had `finishedAtMs`, so a match could stay in `racing` forever.
Changed: Added `src/restored/games/singularity-race-finish-window.js` with the shared finish-window formula `firstFinisherElapsedMs * 0.45`, clamped to 45-90 seconds. Updated `workers/singularity-race-worker.js` so the first finisher starts a persisted `finishWindowEndsAtMs`, sets a Durable Object alarm, snapshots remaining time and finished/player counts, and ends the race on all-finished or `finish_window_expired`. Updated `singularity-race.html` and `singularity-race-track.js` with a `track-finish-window` HUD countdown, server snapshot sync, local-preview matching timer, and DNF result metadata for unfinished runners. Updated Cloudflare/plan docs and smoke guards.
Verified: `node --check` passed for the Worker, finish-window contract, track helper, and Cloudflare smoke file. `node tools/smoke-singularity-race-finish-window.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser fallback loaded `singularity-race.html`, entered the queue through `#ready-button`, and confirmed zero console errors, zero 4xx/5xx responses, finish-window CSS/source tokens, Worker finish-window tokens, and no non-audio failed requests.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the cached Playwright fallback. Changes are still uncommitted and not deployed.
Next: Human-play a public/admin room with two clients: finish with one runner, confirm the 45-90 second countdown appears, and confirm DNF results after expiry.
Do not: Revert the Worker to `players.every(finishedAtMs)` only, remove the finish-window alarm, or mark DNF runners as finished in the result list.

Date: 2026-06-03
Observed: User requested another final bug scan after the sword item implementation.
Changed: Fixed one real browser-only runtime bug found during the scan: `setupProfilePrepScene()` ran before the `let profilePrepSceneStyleInjected` declaration executed, causing `Cannot access 'profilePrepSceneStyleInjected' before initialization` and preventing the track/effect DOM from rendering correctly. Moved the declaration up into the early state-variable block before initial setup/render.
Verified: `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=final-bug-scan-sword-fixed`, clicked into the queue, and confirmed zero console/page errors, zero 4xx/5xx responses, `item:sword` contract tokens, five `.race-sword-pickup` nodes, 15 item boxes, the on-track sword icon, and the item button.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Move to the next product slice or human-play the local sword pickup/one-use slash feel before making sword combat server-authoritative.
Do not: Reintroduce late `let` declarations for values used by initial setup/render.

Date: 2026-06-03
Observed: User requested the previously deferred sword swing to become an actual collectible item: visible sword pickups should be scattered on the race track, collectable by proximity, and usable with the item key without turning the base attack back into sword combat.
Changed: Added `item:sword` to the Singularity Race item contract and local race item pool. Added five direct `race-sword-pickup` track pickups with respawn, sword icon CSS (`sword-blade`, `sword-guard`, `sword-hilt`), slot/roulette support, and `useSwordItem()` as a consumed melee item. Sword use now renders `is-sword-attacking` with `runner-sword-lunge`/`runner-sword-slash`, applies a wider local melee hit through the marathon combat contract, and leaves base attack as punch/kick alternation. Restored the `profile-heading` lock class on the profile name row so the v0.1 lock stays green after the existing profile layout change.
Verified: `node --check src/restored/games/singularity-race-item-contract.js`, `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=sword-final-browser-2`, confirmed the profile background path no longer 404s, `item:sword` is defined in the item contract, sword pickup/use/icon/motion tokens exist, base attack still has punch/kick tokens, and there were zero console/page errors. One audio request was aborted by the browser, not returned as a console error or 4xx response.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-play a local race and confirm the five visible sword drops feel frequent enough, the pickup radius reads fair, and the one-use sword slash is not too strong before moving sword HP authority into the public Worker.
Do not: Move sword visuals back into the base `.is-attacking` punch/kick path or make public Worker HP authority trust the local sword item without a separate server-authority slice.

Date: 2026-06-03
Observed: User asked to verify whether the old basic sword-swing motion has been moved into a stage-2 basic-attack upgrade, and to run a broader bug pass after the item and attack-motion changes.
Changed: No gameplay code change in this pass. Clarified the current implementation state: the active basic attack is punch/kick alternation (`runner-attack-lunge`, `runner-attack-swipe`, `runner-attack-kick`, `runner-attack-kick-strike`, `.is-attack-kick`). The sword/swing runtime is not active in basic attack and is not yet implemented as a stage-2 upgrade or item; the handoff doc still lists that as a future C-slice.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=motion-items-final-verify`, confirmed zero console/page errors, item button present, two item slots, turbo-car riding layer, E item priority, chat rank tokens, punch/kick attack visual tokens, client attack range 4.8, and no `sword|slash|blade|knife|katana` runtime tokens in the race page source.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the available Playwright fallback. Changes are still uncommitted and not deployed.
Next: If sword combat is desired, implement it as a separate stage-2 upgrade or box item in a new small slice: define the upgrade/item state, make the sword arc render only while upgraded, and add a smoke guard that base attack remains punch/kick.
Do not: Describe sword swing as already implemented, or reintroduce sword visuals into the base attack path without an explicit upgrade/item gate.

Date: 2026-06-03
Observed: User asked for final verification and to fix anything still unfinished after the basic-attack handoff. The remaining unfinished A-slice was small combat-feel tuning, not a new combo system or x/y engine rewrite.
Changed: Tuned Singularity Race basic attack range from `4.2` to `4.8` in both `singularity-race.html` and `workers/singularity-race-worker.js`, preserving client/Worker authority parity. Tuned `SINGULARITY_RACE_RED_PILL_SIZE_SCALE` from `1.55` to `1.7` so the giant-state item reads more clearly. Added smoke guards for the 4.8 client/Worker attack range and the red-pill 1.65-1.8 readable size band. Updated the marathon plan and attack handoff doc so future AI does not keep describing one item slot or the old 1.55 red-pill scale.
Verified: `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=attack-redpill-final`, confirmed title `특이점레이스 로비`, client attack range `4.8`, punch/kick visual tokens, red-pill import, item button presence, and zero console/page errors.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Human-play the local/public race for attack reach, red-pill size readability, item 2-slot usage, E item priority, turbo-car visibility, and remote smoothness. If accepted, commit/push/deploy the current Singularity Race stabilization batch.
Do not: Increase basic attack range beyond this small 4.8 tune without playtest evidence, make red-pill size exceed the readable lane band, start a combo-state machine, or begin the future x/y arena rewrite inside `singularity-race.html`.

Date: 2026-06-03
Observed: User asked to continue the verified five-issue Singularity Race fix order: remote/spectator stutter, two held items, turbo-car riding visual, E item usage, and chat rank labels.
Changed: Raised the public Cloudflare Worker snapshot cadence from 5 Hz to 10 Hz and updated the online contract docs/smoke guard. Converted the local race item hold state to a two-slot `currentItemIds` queue while keeping `currentItemId` as compatibility state, added a two-slot item button strip, allowed same-item duplicates, and changed item pickup gating to use count/limit. Added a dedicated `runner-ride-vehicle` layer so turbo-car riding shows an actual car body instead of only a glow. Changed PC `E` to use the held race item first and fall back to the reward skill only when no item is held. Decorated race chat player display names with live rank suffixes such as `#1` while leaving system and spectator messages unchanged.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=final-verify`, confirmed the profile page loads, the item button exists, `race-item-slot-strip` and `runner-ride-vehicle` CSS are present, and there were zero console/page errors.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the available Playwright fallback. Changes are still uncommitted and not deployed.
Next: Human-play a local/public race to confirm remote smoothness, two-slot pickup/use order, turbo-car visibility, E item priority, and chat rank readability. If accepted, commit/push/deploy as the next release slice.
Do not: Return public Worker snapshots to 5 Hz for the active public room, collapse race items back to one slot, hide turbo-car riding behind glow only, or make E ignore held items again.

Date: 2026-06-03
Observed: User approved continuing after the first corridor-combat UI exposure slice. The next safe slice was to make existing safe checkpoints visible on the race surface without changing movement authority, Worker authority, or respawn contracts.
Changed: Added keyed in-track `race-save-marker` nodes for every safe checkpoint in `singularity-race.html`, with next and cleared visual states. Updated `tools/smoke-singularity-race-render-budget.cjs`, `tools/smoke-singularity-race-combat-full-race.cjs`, and `docs/plans/restored-marathon-stadium.md` so the checkpoint-save exposure stays tied to the corridor combat race direction.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `npm run check:singularity-race`, and full `npm run check` passed. Local static server returned 200 for `singularity-race.html`, and Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=save-markers` with title `?뱀씠?먮젅?댁뒪 濡쒕퉬` and zero console errors.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Continue corridor combat race exposure by making down/respawn timing and public damage authority clearer, then tune balance separately.
Do not: Start the full x/y arena rewrite inside the v0.1 page, make checkpoint/respawn client-authoritative in public online, or remove the keyed track-effects rendering path.

Date: 2026-06-03
Observed: User said to move to the next step after the corridor-combat-race framing. The next safe slice was to make existing combat/HP state visible without starting the full x/y arena rewrite.
Changed: Added small overhead runner health bars to `createSingularityRunnerAvatarNode()` / `updateSingularityRunnerAvatarNode()`, with low-health and downed visual classes on `singularity-race.html`. The existing player HUD HP meter remains, rankings stay simple, and the new combat UI exposure is guarded by `tools/smoke-singularity-race-combat-full-race.cjs`.
Verified: `node --check src/restored/games/singularity-race-runner-view.js`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-reverse-attack.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Local static server returned 200 for `singularity-race.html`, and Playwright loaded `http://127.0.0.1:4173/singularity-race.html?codex=runner-health-bars` with title `특이점레이스 로비`.
Blocked: None. Changes are still uncommitted and not deployed.
Next: Continue corridor combat race exposure by making safe checkpoint/save points and down/respawn cues more obvious in-race, then balance public damage authority separately.
Do not: Put HP text into ranking rows, start the full x/y arena rewrite inside the v0.1 page, or treat public Cloudflare stun-only combat as finished HP/down PvP authority.

Date: 2026-06-03
Observed: User approved the realistic framing: this is not a car-style fixed-track speed game. The intended v0.1 is a corridor combat race where players fight, lose HP, can be downed, respawn from safe checkpoints, and still win by reaching the destination.
Changed: Added the v0.1 corridor-combat-race plan to `docs/plans/restored-marathon-stadium.md` and reinforced it in `docs/singularity-race-v0-1-lock.md`. The docs now separate three layers: current live progress/lane event race, near-term HP/down/checkpoint corridor combat race, and future reusable `{ x, y, vx, vy }` destination PvP arena core for Baegeum City reuse.
Verified: Documentation-only change; `git diff --check` should be enough before commit. The previous code slice already passed `node tools/smoke-singularity-race-reverse-attack.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and full `npm run check`.
Blocked: None.
Next: First finish v0.1 as a corridor combat race by making HP bars, down state, safe checkpoint respawn, and destination victory visible and balanced. Do not start the full x/y reusable engine rewrite inside `singularity-race.html`.
Do not: Let future AI reinterpret the game as a car-style fixed-track speed race or treat the current progress/lane rail coordinate system as the reusable Baegeum City PvP engine.

Date: 2026-06-03
Observed: User clarified the critical future direction: although players and AI call the project `특이점레이스`, the reusable target is not a rail-only race but a destination-based top-view 2D PvP arena that can later serve Baegeum City event battles.
Changed: Documented the naming/engine split in `docs/singularity-race-free-movement-prototype-brief.md` and `docs/singularity-race-v0-1-lock.md`: public title remains Singularity Race, but reusable engine authority must be `{ x, y, vx, vy }`; `progress`, destination distance, finish rate, and ranking are derived outputs, not movement authority.
Verified: Documentation-only change; `git diff --check` should be enough before commit. The previous code slice already passed `node tools/smoke-singularity-race-reverse-attack.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and full `npm run check`.
Blocked: None.
Next: If continuing engine planning, design the future goal-race PvP arena core separately from the live progress/lane v0.1 event race. Do not start that rewrite inside `singularity-race.html`.
Do not: Let future AI reinterpret the reusable Baegeum City PvP engine as the current progress/lane rail coordinate system.

Date: 2026-06-03
Observed: User asked to compare the final basic-attack diagnosis and start fixing the remaining issue where basic attack could not be intentionally aimed backward/reverse along the Singularity Race progress axis.
Changed: Updated `singularity-race.html` so button/basic attack no longer derives aim from sprite `facing`; it resolves the current WASD/mobile input through `resolveSingularityRaceInputMovement()` at the runner's trail point, remembers recent progress-axis attack direction for short tap-then-attack timing, and prevents explicit reverse input from being auto-flipped by the nearest-target fallback. Updated the Cloudflare Worker so missing attack aim falls back from the server session's last input projected onto the selected track axis instead of raw `direction.x`. Added reverse-aim combat validation and a dedicated `tools/smoke-singularity-race-reverse-attack.cjs` server smoke.
Verified: `node tools/smoke-singularity-race-reverse-attack.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and full `npm run check` passed. Local Playwright fallback loaded `http://127.0.0.1:4173/singularity-race.html` with page title `특이점레이스 로비`.
Blocked: None. The local server was already running on `127.0.0.1:4173`; no deploy or commit was performed in this slice.
Next: Human-play basic attack in local/public race: hold or tap reverse/back input then attack, confirm behind targets are hit and front targets are not accidentally selected. If accepted, commit/push/deploy as the next release slice.
Do not: Revert button basic attack to visual `facing`, raw screen `direction.x`, or unconditional nearest-target fallback for explicit reverse input.

Date: 2026-06-03
Observed: User asked to commit, push, deploy, and provide the public admin-page link with the supplied admin token.
Changed: Updated `singularity-race-admin.html` so `?online=cloudflare&adminToken=...` is a one-time handoff: the page stores the token only in tab-scoped `sessionStorage`, immediately removes `adminToken` from the address bar with `history.replaceState`, and lets the Cloudflare admin status pill replace or clear the token. Updated the Cloudflare online smoke guard and admin docs to forbid persistent/localStorage admin-token storage while preserving the admin-token URL handoff contract.
Verified: The literal supplied token is not present in project files. `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `git diff --check`, and full `npm run check` passed. Browser fallback verified a dummy admin URL strips `adminToken` from the URL, stores it in `sessionStorage`, and does not write localStorage. The live Worker `/admin/state` returned 200 with the supplied token. Committed and pushed `8a1697a Store admin token per browser tab`, deployed Pages preview `https://5f1594b6.singularity-race-client.pages.dev`, and confirmed preview/stable admin HTML contains the session-token handling and no old persistent storage key.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the available Playwright fallback.
Next: Use the admin page to create/open/start/reset the fixed public room, then verify a public player can join the queue from the root `이벤트 참가` flow.
Do not: Commit the admin token value, store it in `localStorage`, paste it into public docs, or expose admin controls through the player page.

Date: 2026-06-03
Observed: User wanted the root Simulacra World launcher to feel less cluttered and to present `특이점레이스` as the door: remove the visible `바로 플레이/로컬` local action, remove the visible login/skin/shop/archive row, and move those slots behind a top-right `...` category menu.
Changed: Updated `index.html` so the document title and main headline are `특이점레이스`, the only primary race CTA is `이벤트 참가 / 공개방` pointing to the public Cloudflare Singularity Race entry, and login, skins, shop, archive, community, and info/settings live inside a compact top-right category menu. Removed the old visible hub-chip strip and separate `온라인 참가` button. Fixed a mobile layering bug found during browser verification by keeping the menu panel above the banner and resetting mobile nav offsets. Updated launcher smoke guards and v0.1/roadmap docs to preserve the new event-entry/category-menu contract.
Verified: `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `git diff --check`, and full `npm run check` passed. Browser fallback on `http://127.0.0.1:4173/index.html?codex=event-launcher-v3` at 390px confirmed title/H1 `특이점레이스`, primary `이벤트 참가 공개방` Cloudflare href, no `onlineRaceLink`, no `.hub-strip/.hub-chip`, category menu closed by default, menu opens with login/skin/shop/archive slots, login modal opens from the menu, and no horizontal overflow before or after opening the menu. Committed and pushed `cff4497 Make launcher event entry primary`, deployed the committed snapshot to Cloudflare Pages preview `https://1349ba92.singularity-race-client.pages.dev`, and confirmed preview/stable HTML plus preview mobile menu behavior.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the available Playwright fallback. `singularity-race-admin.html` is currently dirty from a separate token-storage/admin-page change and was not part of this launcher edit, commit, or Pages deploy.
Next: Decide whether the separate admin-token page change should be kept, tested, committed, and deployed as its own slice.
Do not: Restore visible root login/skin/shop/archive chips, re-add the separate `온라인 참가` CTA, or make the root event entry depend on an admin-token URL.

Date: 2026-06-03
Observed: User corrected the prototype direction: Singularity Race free-movement testing should remain 2D top-view. Constant gravity/jump/side-view floor behavior was not agreed; gravity should only be considered later for specific sections.
Changed: Corrected `free-race-prototype.html` back to top-view movement. Removed `onGround`, `GRAVITY_ACCELERATION`, `JUMP_VELOCITY`, fast-fall, `resolveTerrain()`, and side-view floor/pit rendering. WASD/arrows now apply 8-direction top-view acceleration to `vx/vy`; velocity uses drag and a 2D max-speed clamp. Pressure plates now use a top-view `pressureContactPoint()` at the player center instead of a foot/jump model. Follow-up bug audit fixed two prototype bugs: off-course drag now actually slows/limits speed instead of making off-course movement more slippery, and closed gate collision now removes velocity along the collision normal instead of only zeroing rightward `vx`. Updated `tools/smoke-free-race-prototype.cjs` to fail if gravity/jump/onGround/floor logic, old inflated plate checks, old one-way gate collision, or stale gate-open timing returns.
Verified: `node tools/smoke-free-race-prototype.cjs`, `git diff --check`, and full `npm run check` passed after the bug-audit patch. Browser fallback on `http://127.0.0.1:4173/free-race-prototype.html?codex=bug-audit` confirmed authority keys `x/y/vx/vy`, no gravity/jump/onGround tokens, no horizontal overflow, off-course speed capped at `245px/s`, closed gate collision blocks both left-side and right-side approaches by removing normal velocity, strict pressure contact rejects a near-outside point and accepts an inside point, two occupied pads open the gate, and no console/page errors.
Blocked: None. This correction still does not touch `singularity-race.html`, `workers/singularity-race-worker.js`, or the live rail/progress movement modules.
Next: Human-play the corrected top-view prototype for movement speed, reverse feel, body bumping, and pressure plate precision before adding any attack or future gravity-zone slice.
Do not: Re-add jump, onGround, constant gravity, floor/ramp/pit physics, or side-view assumptions to the top-view prototype unless the human explicitly approves a gravity-zone slice.

Date: 2026-06-03
Observed: Superseded historical note. This intermediate v2 retune briefly introduced side-view jump/gravity language and should not be treated as current behavior.
Changed: Superseded by the top-view correction entry above. Current `free-race-prototype.html` has no `onGround`, jump, constant gravity, floor, ramp, or pit physics.
Verified: Superseded. Use the current top-view verification entry above.
Blocked: None.
Next: See the current top-view prototype entry above.
Do not: Revive this side-view/jump/gravity interpretation without explicit human approval.

Date: 2026-06-03
Observed: User approved moving on after final verification, and the current movement handoff brief points to a standalone free-movement prototype instead of rewriting the live Singularity Race rail/progress authority.
Changed: Historical prototype creation note. The current corrected prototype keeps the same standalone file/test/doc shape, but the authority keys are now `x/y/vx/vy` and side-view gravity/floor/pit behavior has been removed.
Verified: Historical verification was superseded by the top-view correction and bug-audit verification above.
Blocked: None. The prototype intentionally does not touch `singularity-race.html`, `workers/singularity-race-worker.js`, or the live `src/restored/games/singularity-race-*` rail movement modules.
Next: Human-play the top-view prototype for free movement feel, reverse movement, pressure plate precision, body bumping, and whether the `(x,y)+velocity -> derived progress` model is worth a later migration plan.
Do not: Treat prototype progress as input authority, wire it into public online, or start replacing live Singularity Race movement before the prototype feel is accepted.

Date: 2026-06-03
Observed: User clarified that "launcher" means the root Simulacra World engine-core launcher with Baegeum City v2, Dice City v1, Drawing World, and Baegeum City v1 cards, and wanted it visible first as a future hub for login, skins, shop, archive, and community instead of feeling blocked by online room state.
Changed: Updated `index.html` so the first shell is titled `시뮬라크 월드`, the primary `바로 플레이` action opens local/guest `singularity-race.html`, and public Cloudflare race entry is a separate `온라인 참가` action. Added visible launcher hub slots for login, skins, shop, and archive with a shared modal, kept community and the four preserved mode cards visible, and softened the one-note blue launcher background. Updated launcher/v0.1 smoke guards and the restored UI/v0.1 docs to treat this as an existing launcher hub slot, not a new common-engine implementation.
Verified: `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `git diff --check`, `npm run check:singularity-race`, and full `npm run check` passed. Browser fallback on `http://127.0.0.1:4173/index.html?codex=launcher-hub` confirmed title/H1 `시뮬라크 월드`, primary href `./singularity-race.html`, separate online Cloudflare href, login hub modal contents, no horizontal overflow, and mobile order with banner before launcher controls.
Blocked: The in-app Browser `iab` target was unavailable, so browser verification used the available Playwright fallback. Real account, skin inventory, shop, archive persistence, and community surfaces are still shell slots only.
Next: If continuing launcher work, wire one real but local-only profile/session selector or skin inventory summary into the launcher hub before adding any account/store entitlement behavior.
Do not: Make the root launcher depend on public room creation, collapse local and online entry back into one button, or turn hub slots into live account/shop systems without separate contracts.

Date: 2026-06-03
Observed: User approved changing the public Cloudflare room from "always visible" to "created by admin first" while keeping the one fixed Durable Object backend.
Changed: Added `roomActive` to the Singularity Race Worker state. Fresh rooms and `/admin/deactivate` now stay hidden and reject player/spectator joins with `room_not_created`; `/admin/create` activates the fixed public room while keeping `entryOpen:false` so users can join the waiting queue but still need admin in-game entry. The admin page now maps `방 만들기` to `/admin/create`, maps room close/delete to `/admin/deactivate`, hides inactive public rooms from the list, and disables visit/entry/start/delete controls until the room is active. The player page now treats inactive/unknown Cloudflare rooms as non-joinable, shows a `방 없음` gate, and handles `room_closed` by disconnecting and returning to the lobby/profile.
Guarded: Updated Cloudflare online static and Worker contract smokes for `/admin/create`, `/admin/deactivate`, `roomActive`, `room_not_created`, inactive start/open rejection, active room creation, and deactivate hiding.
Deployed: Committed and pushed `7a7d948 Gate public race room creation` to `main`, deployed Worker version `d856ed98-ec07-48c4-b6dd-f32397c8b3d8`, and redeployed Cloudflare Pages preview `https://3b083ad4.singularity-race-client.pages.dev`.
Verified: `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-worker-skill.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, a VM module parse of `singularity-race-admin.html` plus `singularity-race.html`, `git diff --check`, `node tools/check-size.cjs`, and full `npm run check` passed. Local browser fallback loaded the admin/user Cloudflare pages, confirmed the inactive admin list says `방 만들기를 누르면 유저 페이지에 공개됩니다.`, confirmed the user page shows server-check state, and saw no page JS errors; the only console error was expected `127.0.0.1:8787/rooms` connection refusal because the local Worker was not running.
Live: Worker `/health` and `/rooms` returned OK with `roomActive:false`, `lobby`, `entryOpen:false`, and `0/50`; unauthenticated `/admin/state` returned 401, token-authenticated `/admin/state` returned `roomActive:false`; stable and preview Pages returned 200 and include `/admin/create` plus `/admin/deactivate`.
Next: Public live testing should start by pressing admin `방 만들기`, then user queue join, then admin `인게임 입장 시작`, then admin `시작`.
Do not: Reinterpret `/admin/open` as room creation, expose a joinable public room while `roomActive:false`, or collapse `roomActive` and `entryOpen` back into one flag.

Date: 2026-06-03
Observed: User pointed out a protruding gray triangular road/wall shape on the Singularity Race basic map that felt like it lightly caught runners, and asked for a fullscreen lock that can be turned off in settings on both mobile and PC.
Changed: Smoothed the basic `baegeum-city` trail's early left-side bend in `marathon-trail-map-catalog.js`, removing the sharp triangular wall/island shape while keeping the map above the route-length guard. Added a saved `singularity-race:fullscreen-lock:v1` preference, a gear-panel fullscreen toggle, entry/spectator/connected-click fullscreen requests, and `100dvh`/overscroll guards so the race viewport is steadier on mobile browser chrome and PC fullscreen.
Guarded: Updated the mobile race UI smoke to assert the fullscreen lock button, persistence key, request/toggle hooks, dynamic viewport height, and scroll-bounce guard. Updated Singularity Race docs for the smoothed map bend, fullscreen lock, mid-race spectator-only joins, and signed mobile backward intent.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/check-restored-marathon-contract.cjs`, `git diff --check`, `npm run check:singularity-race`, and full `npm run check` passed.
Next: Public/mobile playtest should confirm the gray triangle no longer catches runners and whether browser fullscreen is accepted on the target phones. If iOS Safari rejects the Fullscreen API, keep the saved toggle but rely on the `100dvh`/install-to-home-screen path for true standalone fullscreen.
Do not: Reintroduce the old early basic-map triangle, make fullscreen mandatory without a settings escape hatch, or rely on automatic non-gesture fullscreen requests.

Date: 2026-06-03
Observed: User approved the next public Singularity Race control slice: allow mid-race spectator-only joins, make mobile movement signed so backward movement works, separate mobile skill/item button roles, and connect public `skill_use` to Worker-side authority instead of relay.
Changed: Public Worker joins now allow `spectator` during active phases while keeping player joins closed outside lobby. Mobile and transport input contracts preserve signed `intent.forward` from `-1..1`; local prediction, local movement, Cloudflare input signatures, and Worker ticks use a shared slow-backward multiplier. The mobile controls now show a true reward `스킬` button plus a separate `아이템` button, and `E` uses the reward skill path. Connected checkpoint rewards update local skill state without sending unsupported `checkpoint_reward` packets to Cloudflare. Worker `skill_use` now validates reward grade, cooldown, charges, action lock, target range, and server positions, then applies self boosts/checkpoint hop or target slow/stun/push through server snapshots.
Guarded: Added `tools/smoke-singularity-race-cloudflare-worker-skill.cjs` and wired it into Cloudflare online smoke. Existing input, movement, prediction, transport, and online smoke contracts now assert signed reverse intent, Worker skill authority tokens, spectator join split, mobile skill/item controls, and no return to relay-only public skills.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-worker-skill.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/check-size.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Next: Public test mid-race spectator entry, mobile forward/back/left/right feel, skill cooldown/target feedback, and whether PC item usage needs a separate non-E hotkey after `E` became reward skill.
Do not: Re-clamp mobile `intent.forward` to `0..1`, send Cloudflare checkpoint_reward packets from the client, or return public `skill_use` to client-relayed hit/effect authority.

Date: 2026-06-03
Observed: User chose to stop broad root-cause surgery for now and run a smaller public test with about five players, then asked to commit, push, and deploy the current stabilization slice.
Deployed: Committed and pushed `e748f79 Stabilize public race sync and gate feedback` to `main`, deployed Worker version `7ef8496b-e4fc-4159-a393-880dd5550bb5`, and redeployed Cloudflare Pages preview `https://bca14acb.singularity-race-client.pages.dev`.
Verified: Full `npm run check` and `git diff --check` passed before commit. Live Worker `/health` returned OK, `/rooms` returned `lobby`, `entryOpen:false`, and `0/50`; unauthenticated `/admin/state` returned 401. Stable and preview player Pages returned 200 and contain `startConnectedInputPump`, `관리자 대기중`, and `--gate-open-y`; stable admin Pages returned 200 and contain `/admin/state` plus the `유저 입장` control.
Next: Run a controlled public test with about five players on the stable Pages URL. If stutter remains, use the live ping/jitter debug row and profile `state_snapshot -> renderAll()`, pre-race staging reconciliation, and Cloudflare snapshot cadence before changing larger netcode pieces.
Do not: Jump straight into 30-player scaling changes or broad synchronization rewrites before the five-player public test produces a concrete remaining symptom.

Date: 2026-06-03
Observed: User reported that the start gate looked like it opened by pulling toward the runner pack, making the start feel like players were colliding with the door.
Changed: Changed the Singularity Race start-gate visual from sideways X movement plus rotation to a downward retract animation. Both the shared `createSingularityStartGateNode()` helper and the in-page hot-loop `updateStartGateNode()` now use `--gate-open-y` and `--gate-open-scale` instead of `--gate-open-rotate`, while the physical start gate clamp and countdown authority remain unchanged.
Guarded: `tools/smoke-singularity-race-progression.cjs` now asserts the gate uses the downward retract variables and does not reintroduce the rotate-open variable.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. The local static server on `127.0.0.1:4173` loaded the Singularity Race lobby through the browser tooling, but the in-app browser runtime was unavailable for deeper click/evaluate verification in this environment.
Next: Run the Singularity Race checks and browser/DOM verification if feasible, then deploy only after explicit publish approval.
Do not: Change the server start gate clamp or let the visual gate opening become movement authority.

Date: 2026-06-02
Observed: User asked whether player-to-player attacks actually apply impact stun online, suspected hitbox/player collision issues, and asked to check balance before implementation. Code inspection showed local/dev combat had stun contracts, but the public Cloudflare Worker was only relaying `attack_action` packets and snapshots did not carry server-owned stun state.
Changed: Public Cloudflare `attack_action` is now Worker-decided instead of client-relayed. Worker sessions track `stunnedUntilMs`, `slowUntilMs`, `attackCooldownUntilMs`, `actionLockedUntilMs`, and `lastAttackSequence`; the Worker ignores client-supplied attack origins, resolves hits from current server `progressPercent + laneOffsetPx`, applies impact stun/slow without HP damage, blocks stunned runners from advancing on held input, and includes combat state in `state_snapshot`. The race client now sends connected attacks whenever the public race input gate is open, including the in-game start rail before countdown.
Guarded: Cloudflare online smoke now rejects the old attack relay-only path, and the Worker contract smoke verifies spoofed client origin cannot decide the hit, a nearby target is stunned from server positions, held input does not move a stunned runner, and attack cooldown spam is rejected.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. The first full check caught the Worker smoke file over the 300-line size gate; the smoke was compacted to 280 lines and rerun green.
Next: Run `npm run check:singularity-race`, `git diff --check`, and full `npm run check`; if green, the next gameplay slice is live/public testing of attack feel and then tighter visual hitbox overlay/tuning if the server-owned stun feels misaligned.
Do not: Return public attacks to client-owned hit results, trust client attack origin, or reduce HP in public Cloudflare basic attacks until damage/down/respawn authority is explicitly designed for public play.

Date: 2026-06-02
Observed: User reported PC/mobile movement, circular roulette UI, and multi-client sync felt unplayably stuttery. The likely root was split between hot-loop DOM rebuilds and online local-runner identity/order drift.
Changed: Singularity Race track effects now sync keyed DOM entries instead of replacing the whole effect layer every hot frame, the item roulette keeps its panel/reel while spinning, and Cloudflare snapshots order localized `runner:you` first while local snapshot lookup uses `runner:you` after localization. Local input, camera, HUD, item targeting, prediction, checkpoints, and local mutation now use `getLocalRunner()` / `setLocalRunner()` instead of assuming `state.runners[0]`, and target selection uses remote-runner entries instead of assuming remotes start at index 1. Remote connected runners keep a short snapshot history and render through a bounded interpolation delay while the local runner stays on prediction/soft reconciliation. Cloudflare live `ping`/`pong` probing updates the debug `ping_sample` row with RTT, one-way ping, jitter, and lane.
Guarded: Render budget, item, and obstacle smoke checks now assert the cache/diff path, the local-runner helper contract, the remote interpolation buffer, and live ping probe wiring.
Verified: `npm run check:singularity-race`, `node tools/smoke-singularity-race-render-budget.cjs`, `git diff --check`, and full `npm run check` passed before this note. Browser fallback loaded `http://127.0.0.1:4173/singularity-race.html`, reached the queue flow, found track/roulette roots, and reported no console errors on reload.
Note: The in-app Browser target was unavailable in this environment, so browser verification used the fallback Playwright browser. Live Cloudflare multi-device feel still needs public deploy testing after commit/deploy.
Next: If stutter remains after deploy, profile `state_snapshot -> renderAll()`, pre-race staging reconciliation, and Cloudflare RTT/jitter. Otherwise commit and deploy this slice.
Do not: Reintroduce full `trackEffects.replaceChildren(...nodes)`, per-frame roulette panel replacement, direct `state.runners[0]` local-player indexing, or server-order-dependent local runner assumptions.

Date: 2026-06-02
Observed: User summarized the Singularity Race ceremony-room problem: top-five finishers were locked out of movement, the room movement bounds were too narrow, and the post-finish watch button had no path back to the ranking/ceremony room.
Changed: Updated `singularity-race.html` so all non-spectator finishers can move in the ceremony room during wait and award phases, widened ceremony free movement to `x 8-92` and `y 30-92`, and made the result watch button a two-way toggle between post-finish watching and returning to the ceremony room. The watch-state result panel now keeps only the action buttons visible instead of hiding the whole panel. Also moved breakable-obstacle constants before initial render to fix a current browser startup error, and compacted two already-modified contract files enough to satisfy the repository size gates without changing behavior.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-items.cjs`, `npm run check:singularity-race`, `node tools/check-restored-growth-architecture.cjs`, and full `npm run check` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?resetProfile=1&codex=ceremony-toggle-verify-2` loaded without console errors, and a DOM state probe confirmed post-finish watching leaves the transparent result action buttons visible while hiding the rest of the panel.
Next: Commit/push/deploy when the current accumulated Singularity Race public-flow and ceremony changes are ready to publish.

Date: 2026-06-02
Observed: User clarified the intended public start-rail flow: after admin in-game entry opens, users should move from queue into the race screen/start rail, be unable to start the race, still move freely inside the start paddock, be blocked by the front gate, then continue after the admin-owned 10-second countdown opens the gate.
Changed: Public Cloudflare pre-race movement is now server-owned instead of local-only. The user page can publish connected input while the public room is in lobby `entryOpen:true` or countdown, and the Worker last-intent tick loop advances those players only inside the start paddock (`START_PADDOCK_MIN_PROGRESS` to `START_PADDOCK_MAX_PROGRESS`). Worker snapshots preserve the bounded pre-start position, `/admin/start` still remains the only countdown trigger, and the gate opens only when the Worker phase becomes `racing`.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. The new Worker contract test verifies lobby start-paddock movement, gate clamping, and countdown clamping.
Next: Commit/push/deploy the public Worker and Pages so the live links reflect the corrected queue -> start rail -> admin countdown flow.

Date: 2026-06-02
Observed: User clarified the public admin `입장 시작` meaning: it is not lobby-to-queue entry. It is queue-to-in-game/start-rail entry.
Changed: Repositioned the public Cloudflare entry gate. `entryOpen:false` no longer blocks Worker WebSocket player joins or client queue entry; queued players can now appear to the admin before in-game entry opens. Admin `/admin/open` now acts as the in-game entry/start-rail signal, and connected queue clients move into the race screen/start rail when they receive `presence_update`/snapshot with `entryOpen:true`. Admin `/admin/start` now requires at least one player and `entryOpen:true`, so countdown cannot skip the in-game entry step. The public admin button label now says `인게임 입장 시작`, and smoke/docs were updated to lock this interpretation.
Verified: `node tools/smoke-singularity-race-cloudflare-worker-contract.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and `git diff --check` passed after the gate correction.
Next: Run full `npm run check`, then commit/push/deploy Worker and Pages if accepted.

Date: 2026-06-02
Observed: User reviewed the deployed/editor screenshot and said the new obstacle visuals were too large.
Changed: Reduced the race editor obstacle marker sizes and matching in-race obstacle CSS sizes while keeping the barricade, traffic-block, and crate silhouettes. The spectator final position remains `progress: 0.05` and `laneOffsetPx: 0`.
Verified: `node tools/smoke-singularity-race-map-editor.cjs`, `node tools/smoke-singularity-race-obstacles.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Headless Chrome screenshot verification on the clean map editor profile showed the smaller obstacle markers and the same finalized spectator position.
Next: Commit, push, and redeploy the static Pages bundle so the public preview reflects the smaller obstacles.

Date: 2026-06-02
Observed: User finalized the basic spectator position from the map editor screenshot and asked obstacle visuals to read as barricades/boxes before commit/deploy.
Changed: The basic-map start crowd default in `src/restored/games/singularity-race-spectator-contract.js` is now `progress: 0.05` and `laneOffsetPx: 0`, matching the saved editor position. `singularity-race-map-editor.html` and `singularity-race.html` now render obstacles as larger barricade, traffic-block, and crate pieces instead of tiny square/cone markers. `tools/smoke-singularity-race-obstacles.cjs` and `tools/smoke-singularity-race-map-editor.cjs` now guard the finalized spectator default and obstacle visual tokens.
Verified: `node --check tools/smoke-singularity-race-map-editor.cjs`, `node --check tools/smoke-singularity-race-obstacles.cjs`, `node tools/smoke-singularity-race-map-editor.cjs`, `node tools/smoke-singularity-race-obstacles.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed on the final diff. Headless Chrome with a clean temporary profile confirmed the map editor defaults to `0.05 / 0px` and shows obstacle markers as crate/barrier/block shapes. The in-app Browser `iab` session was unavailable, so Chrome headless screenshot verification was used.
Next: Re-run the full project check for the final diff, then commit/push and deploy the static Pages bundle. Obstacle dragging remains the next editor feature.

Date: 2026-06-02
Observed: User asked for the next race editor slice: minimal spectator drag move/save UI, plus a direct map-editor button from the admin page.
Changed: Added `singularity-race-map-editor.html` as the first separate trail-coordinate editor surface. It loads the selected race map, renders the trail, obstacles, and spectator groups, supports dragging the spectator group to update `progress + laneOffsetPx`, and saves through the shared `singularity-race-map-draft:v1:<mapId>` draft while preserving existing obstacle draft data. `singularity-race-admin.html` now has a `맵 에디터` topbar link that carries the current `mapId`. Added `tools/smoke-singularity-race-map-editor.cjs` and wired it into `check:singularity-race` and the full check chain.
Verified: `node --check tools/smoke-singularity-race-map-editor.cjs`, package JSON parse, `node tools/smoke-singularity-race-map-editor.cjs`, `node tools/smoke-singularity-race-obstacles.cjs`, `npm run check:singularity-race`, `node tools/check-size.cjs`, `git diff --check`, and full `npm run check` passed. Browser fallback with cached Chromium confirmed the admin map-editor link resolves to `singularity-race-map-editor.html?mapId=baegeum-city`; dragging the spectator marker changed it from `progress 2 / lane -318` to `progress 67.55 / lane -72`, saved a draft with one spectator and six obstacles, and produced zero console/page/log errors.
Next: Run the full project check, then extend the same editor to obstacle dragging.

Date: 2026-06-02
Observed: User asked to continue the race editor foundation with either minimal spectator draft move/save or putting obstacles on the same draft merge base.
Changed: Added `src/restored/games/singularity-race-map-draft-contract.js` as the shared local race-map draft envelope for `progress + laneOffsetPx` spectator and obstacle layers. `singularity-race.html` now reads a map-specific cached draft key and applies it to track spectators, obstacle rendering, minimap obstacle dots, local player collision, local bot movement, and connected local prediction. The obstacle and spectator contracts both accept the same draft merge input, while the Cloudflare Worker remains server-authoritative and does not trust client local drafts. Local-storage diagnostics now inventory the race draft keys so stale editor previews are visible during browser testing.
Verified: `node --check src/restored/games/singularity-race-map-draft-contract.js`, `node --check src/systems/local-storage-diagnostics.js`, `node tools/smoke-singularity-race-obstacles.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/smoke-local-storage-workflow.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser fallback with cached Chromium confirmed a local draft changes the visible crowd to one `DRAFT` sign group, changes obstacles to the drafted single obstacle, and produces zero console/page/log errors.
Next: Build the minimal spectator move/save UI on top of this shared draft envelope, then extend the same editor surface to obstacle dragging.

Date: 2026-06-02
Observed: User approved the hybrid race editor direction: keep the Baegeum City world editor XY-only, create a future separate race editor for trail coordinates, and start with spectator data before obstacle moving or trail editing.
Changed: Started Phase 0 by moving the start-line crowd out of hardcoded HTML into `src/restored/games/singularity-race-spectator-contract.js`. `singularity-race.html` now keeps an empty `track-start-crowd` root and renders spectator groups from map data when the trail map renders, using `progress + laneOffsetPx` trail placement while preserving the same CSS-only citizens, signs, compact back-left block, and no race-skin images. Updated smoke checks and the marathon plan so spectators are a data-backed static track decoration, not hot-loop DOM.
Verified: `node --check src/restored/games/singularity-race-spectator-contract.js`, `node tools/smoke-singularity-race-obstacles.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, and `node tools/check-restored-game-contract-purity.cjs` passed. Local Playwright fallback on `singularity-race.html?resetProfile=1&codex=spectator-data-verify` confirmed one spectator group, 17 CSS citizens, 8 signs, no images, and the expected sample signs. The in-app Browser `iab` session was unavailable, so Playwright fallback was used for DOM verification.
Next: Add the minimal race spectator editor draft layer next, or first apply the same data/draft merge pattern to obstacles so both spectators and obstacles share the future race-map editor save target.

Date: 2026-06-02
Observed: User approved the second netcode surgery for public Singularity Race: move the Worker from packet-arrival movement integration to a last-intent server tick.
Changed: `workers/singularity-race-worker.js` now records only the latest accepted normalized input intent/direction on `input_update`, then advances runner progress/lane from that stored intent through a 100 ms `scheduleServerTick()` loop. Fresh input expires after 550 ms, so packet jitter and mobile render throttling no longer directly become movement speed. The Worker clears the tick on reset/finished/empty-room paths and keeps player start authority blocked behind admin-only start. Added `tools/smoke-singularity-race-cloudflare-worker-contract.cjs` for Durable Object behavior checks and kept the main Cloudflare online smoke under the 300-line size limit.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. The first full check caught the Cloudflare online smoke growing past 300 lines; the Worker behavior test was split into its own smoke file and the full check then passed. `git diff --check` reports only Windows line-ending warnings.
Deployed: Committed and pushed `a4839af Stabilize public race admin and input ticking` to `main`, deployed Worker version `421b91f7-d2ed-4d47-b2df-3d7d65fdac27`, and redeployed Pages preview `https://ba86d94e.singularity-race-client.pages.dev`. Live Worker `/health` and `/rooms` returned OK with `lobby`, `entryOpen:false`, and `0/50`; unauthenticated `/admin/state` returned 401, confirming admin mutation is token-gated. Stable and preview Pages returned 200, and the stable user/admin static files contain `startConnectedInputPump`, `관리자 대기중`, and the `유저 입장 열기/닫기` admin toggle.
Next: Phone-test the stable public user link. Before admin opens entry it should show `관리자 대기중`; after admin opens entry it should allow joining the rail and show `관리자 시작 대기중`; admin start should be the only countdown trigger.

Date: 2026-06-02
Observed: User accepted the diagnosis that mobile running failure is primarily an input/netcode pump issue, not joystick math: connected input send was tied to the `requestAnimationFrame` render loop while the Worker still advances movement only when `input_update` packets arrive.
Changed: Kept this pass to the first surgery only. `singularity-race.html` now starts a render-independent `startConnectedInputPump()` at a 100ms / 10 Hz interval for connected race input, matching the existing Cloudflare input budget. The rAF hot loop still performs local prediction/rendering, but no longer owns the held-input heartbeat. Existing key/joystick/sprint release paths still send immediate edge packets so stop/start edges are not delayed until the next pump tick. Updated mobile/render-budget smoke guards and the Cloudflare/marathon docs to describe the separate 10 Hz input pump.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. `git diff --check` reported only Windows line-ending warnings.
Next: After this first pump split is accepted, the next structural pass is Worker/DO last-intent ticking so movement no longer depends on packet-arrival cadence.

Date: 2026-06-02
Observed: User confirmed the desired public Singularity Race flow: admin opens user entry, players join only into the waiting rail/queue, players cannot start, and only the admin console starts countdown/race.
Changed: Kept the work inside Singularity Race public online. The Worker now starts with public entry closed, rejects player `start_request`/`start_race` with `admin_start_required`, no longer assigns first-player host authority, and moves all-finished races to `finished` with entry closed until admin reopens. The user page now reads Cloudflare `entryOpen`, shows `관리자 대기중` before admin opens entry, shows `관리자 시작 대기중` after a public join, and no longer exposes or sends player start requests. The admin page now uses a clear `유저 입장 열기/닫기` control for `/admin/open` and `/admin/close`, while start remains admin-only. Updated Cloudflare/public-admin docs and smoke guards to prevent the old first-player host fallback from returning.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser automation was attempted, but the in-app browser was unavailable and the fallback Playwright session was already closed in this environment.
Blocked: Not committed, pushed, or deployed in this loop. Live Worker/Pages still need redeploy before the public URLs reflect this code.
Next: Commit/push/deploy Worker and Pages, then test the live user link: before admin opens entry it should show `관리자 대기중`; after admin opens entry users should join the rail and see `관리자 시작 대기중`; admin `시작` should be the only countdown trigger.

Date: 2026-06-02
Observed: User asked to start the public admin revival after Opus/Codex agreed the old failure was a transport-plane split: dev admin commands lived in localStorage/BroadcastChannel while public play lived in the Cloudflare Worker/Durable Object.
Changed: Kept the work inside Singularity Race public online. Added `docs/singularity-race-admin-revival-plan.md` to the doc map, then implemented an `ADMIN_TOKEN`-authenticated Worker minimal admin console: `/admin/state`, `/admin/open`, `/admin/close`, `/admin/start`, `/admin/reset`, and `/admin/map`. The Worker now owns `entryOpen` and `mapId` in room summary/snapshots, keeps public joins blocked when entry is closed or the race is active, and preserves first-player host start as a fallback. `singularity-race-admin.html?online=cloudflare` now reads `/admin/state` only after token auth succeeds and otherwise falls back to public `/rooms`; it never joins as a player, never creates `operator=1`, and does not persist the token.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. A direct Worker-class harness verified wrong token -> 401, empty start -> 409 with `ok:false`, open/close entry toggles, map changes to `singularity-maze-run`, and one fake player start -> `countdown` with `entryOpen:false`. Browser verification on localhost showed tokenless public admin renders one room card, user link, `관리자 토큰 필요 / lobby`, and locked management buttons; dummy token renders without blanking and keeps management buttons locked after auth failure.
Final sweep: Re-ran `git diff --check`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and full `npm run check` after the last wording cleanup. Fixed the discovered `no_players` response contract bug (`ok:false`), removed stale public-admin-disabled wording from the active admin UI, and confirmed current code has no old `host_start_countdown`, public `operator=1`, or admin-token localStorage persistence path.
Deployed: Committed and pushed `169b088 Revive Cloudflare admin console` to `main`, deployed Worker version `3759cd7c-38da-4030-a634-b38ee4cc9a70`, and redeployed Pages preview `https://6006c321.singularity-race-client.pages.dev`. Live Worker `/health` and `/rooms` returned OK, live user/admin Pages loaded, and `/admin/state` correctly returned `admin_token_not_configured` until the Worker `ADMIN_TOKEN` secret is set.
Blocked: Code can be deployed, but enabling live admin mutation still requires setting the Cloudflare Worker secret `ADMIN_TOKEN`. The token must not be stored in the repo, localStorage, or chat.
Next: Set or confirm the Worker `ADMIN_TOKEN` secret, then verify live admin with `/admin/state`, empty start, one-user start, reset, and map change.
Do not: Re-enable `operator=1`, make the admin page a player participant, add kick/bots/observer controls in this first revival slice, or deploy admin control without a Worker secret.

Date: 2026-06-02
Observed: User identified a broader public loading issue separate from the admin transport-plane problem: public links can feel slow, delayed, or unavailable when the Worker/room summary is slow or fails, especially under free-tier/DO pressure.
Changed: Kept the change inside Singularity Race public loading. `singularity-race.html?online=cloudflare` now renders the page shell first, refreshes the live public room summary through `/rooms` in the background, shows a visible server-check/error/retry state, and uses the room refresh button to retry `/rooms` instead of reloading the full page. Added the Cloudflare online smoke tokens and documented the public loading reliability rule.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on localhost with the live Worker showed the public room summary `0/50`, visible refresh, and zero current-tab console errors. Browser verification with an intentionally invalid Worker URL showed the profile shell still loaded, `공개방 상태 확인 실패`, `서버 재시도 필요`, visible refresh, and zero current-tab console errors.
Blocked: Not committed, pushed, or deployed in this loop. A real phone/network test can still reveal external DNS/mobile latency that local browser checks cannot reproduce.
Next: If accepted, commit/push/deploy this loading reliability patch before starting public admin revival.
Do not: Reopen public admin `/admin/*` or add adminToken behavior in this loading-only slice.

Date: 2026-06-02
Observed: During the requested commit/push/deploy pass, live Worker `/health` succeeded but live `/rooms` returned Cloudflare 1101. Wrangler tail showed the actual cause: `Exceeded allowed rows written in Durable Objects free tier.`
Changed: Kept the fix inside `workers/singularity-race-worker.js`. Durable Object storage reads/writes/alarm calls are now wrapped in safe helpers. If storage row writes or alarms are unavailable, the one-room public loop falls back to in-memory phase/countdown state and a local countdown timer instead of crashing `/rooms` or joins. Added a smoke guard and Cloudflare online note so storage quota cannot become a hard public-room dependency again.
Verified: `node --check workers/singularity-race-worker.js`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `git diff --check` passed before redeploy.
Verified: Full `npm run check` passed after the storage fallback. Committed and pushed the fallback, redeployed Worker version `64ea42bd-e812-4236-b2b3-8b61296c9d97`, redeployed Pages preview `https://9914f27b.singularity-race-client.pages.dev`, and live `/health`, `/rooms`, user page, and admin page all returned successfully with zero browser console errors.
Blocked: None for this deploy pass. The Cloudflare account still appears to have Durable Object storage write quota pressure, but the public one-room loop now keeps working without storage writes.
Next: Share the stable user/admin links and use the user page for public play tests; public admin remains disabled by design while first joined user acts as temporary host.
Do not: Add billing-required storage assumptions or make the public loop depend on persistent Durable Object writes until the account quota issue is resolved.

Date: 2026-06-02
Observed: User asked for a final wrap-up sweep to find any unfinished Singularity Race v0.1 bugs or unexpected breakage before stopping.
Changed: No new gameplay code was needed in this sweep. Rechecked the current launcher, profile, race desktop, race mobile, and dev admin surfaces after the mobile minimap/obstacle/control passes.
Verified: `npm run check:singularity-race`, `git diff --check`, `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and full `npm run check` passed. Browser final sweep loaded `index.html`, `singularity-race.html?resetProfile=1`, desktop race, mobile race at 390x844, and `singularity-race-admin.html?devOnline=1`; all had zero console/page errors. Desktop/mobile race showed one runner, six obstacles, minimap with six obstacle markers and one player dot, and no minimap overlap with chat, attack, or sprint controls. Dev admin loaded with one local dev room card; any old room name there is localStorage state, not a code failure.
Blocked: Only real-device subjective feel remains outside automation: physical touch latency, thumb comfort, and obstacle fairness on a phone.
Next: Stop local code work unless the human phone test reports a concrete remaining issue. Do not commit, push, or deploy without an explicit request.
Do not: Start new systems, broaden admin/public authority, or add city/common-engine work during this finish pass.

Date: 2026-06-02
Observed: User asked to finish the final mobile feel pass by showing the minimap on mobile, checking for ping/rubber-band symptoms, and rechecking the result loop.
Changed: Kept the change inside Singularity Race UI/verification. The race minimap now stays visible on mobile as a compact top-right panel with save-point and obstacle dots, while the mobile race standings panel remains hidden and the minimap avoids chat, sprint, and attack controls. The Cloudflare online smoke now also guards the snapshot merge smoothing tokens that prevent 5 Hz server snapshots from hard-snapping the local player during normal prediction/reconciliation.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification at 390x844 on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=mobile-minimap-verify-4` reached the race screen with the minimap visible, six obstacle markers, one player dot, zero console/page errors, and no overlap with chat, attack, or sprint controls.
Blocked: Human phone feel still needs a real device pass for touch latency and physical thumb comfort. Automated checks can guard layout and prediction contracts, but not exact hand feel.
Next: Stop unless a real phone test reports a remaining touch-latency, route-readability, or control-comfort issue.
Do not: Hide the mobile minimap again, use it as an interactive control, or change server authority while tuning phone UI.

Date: 2026-06-02
Observed: User requested a final/third verification of the attack animation pass, then asked to make the race maps less static by placing obstacles with real hitbox/collision feedback instead of only straight running.
Changed: Kept the work inside Singularity Race. Added `src/restored/games/singularity-race-obstacle-contract.js` with static obstacle placements for the basic, square, and maze race maps. Obstacles render in the track effects layer on race and map-preview surfaces. The collision helper pushes runners slightly backward/sideways, stamps `collisionAtMs`, and is now consumed by local player movement, local bot movement, connected client prediction, and the Cloudflare Worker so obstacle hitboxes do not become client-only rubber-band sources. Worker snapshots now carry collision/obstacle fields for visual feedback.
Verified: `node tools/smoke-singularity-race-obstacles.cjs`, `node --check src/restored/games/singularity-race-obstacle-contract.js`, `node --check src/restored/games/singularity-race-prediction.js`, `node --check src/restored/games/singularity-race-local-sim.js`, `node --check workers/singularity-race-worker.js`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?resetProfile=1&codex=obstacle-verify` confirmed six basic-map obstacle DOM nodes, obstacle CSS/source hooks, attack burst/recoil hooks, and zero console/page errors.
Blocked: Human phone feel still needs a real touch test to tune obstacle spacing, bounce strength, and whether any obstacle is too punishing on curves.
Next: Human-test one full race on desktop and phone, then tune individual obstacle positions/radii only if collisions feel unfair.
Do not: Move obstacle authority into client-only code, turn these into city/world-editor obstacles, or let obstacle collisions hard-stop movement like old wall bugs.

Date: 2026-06-02
Observed: After the basic attack movement-preservation pass, the next weak point was attack readability: the runner could attack without dropping controls, but the short swipe did not clearly sell wind-up, strike, and hit feedback.
Changed: Kept the change inside Singularity Race visual combat. Basic attack now keeps the longer 420 ms one-shot lunge/sweep visual, and successful local hits set `attackImpactUntilMs`/`attackImpactTargetId` so the target gets a brief recoil plus `runner-hit-burst` impact layer. The runner DOM helper now reserves that hit-burst span up front, so hot track rendering only toggles classes/datasets and does not rebuild runner nodes.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node --check src/restored/games/singularity-race-runner-view.js`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?resetProfile=1&codex=attack-animation-verify` confirmed the page loads, attack button exists, `runner-hit-burst`/`runner-hit-recoil` CSS hooks are present, the impact state source is present, and there are zero console errors.
Blocked: Human phone feel still needs a real touch test; this slice does not redesign projectile/item aiming or public server-owned hit authority.
Next: Run full `npm run check`, then human-test attack on phone with movement held to tune lunge duration, hit-burst size, and mobile target selection.
Do not: Reintroduce attack movement cancel, make local hit effects server-authoritative, or rebuild runner DOM nodes every frame.

Date: 2026-06-02
Observed: After the mobile movement intent pass, the next control-feel issue was basic attack: the old path released held movement controls and blocked the local race loop with a 520 ms stall, which made attack feel like it killed joystick/WASD input.
Changed: Kept the change inside Singularity Race combat feel. Basic attack now calls `preservePlayerMovementForAttack()` instead of `cancelPlayerMovementForAction()`, no longer clears held WASD/mobile joystick/sprint input, and no longer applies the local `stallUntilMs` hard-stop. The attack cooldown, short swipe visual, local hit/stun/damage rules, and two-step projectile item aiming remain unchanged. The future/dev server action-lock value was reduced to 180 ms so connected rehearsal does not fight movement as harshly.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node --check src/restored/online/marathon-server-combat-state.js`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?resetProfile=1&codex=attack-preserve-verify` confirmed the page loads, attack button exists, `preservePlayerMovementForAttack()` is present, the old attack movement-cancel and hard-stop lines are absent, the attack action-lock value is `180`, and there are zero console errors.
Blocked: Human phone feel still needs a real touch test. This slice does not redesign projectile/item aiming beyond preserving basic-attack movement.
Next: Tune mobile attack targeting only if the attack button still feels unreliable in a real phone play test.
Do not: Reintroduce basic attack paths that release held movement keys or clear `mobileIntent`.

Date: 2026-06-02
Observed: User reported that mobile movement, sprinting, and general control feel were still severe enough to consider a redesign; second root-cause verification showed the mobile joystick was still emulating WASD key changes, held input was not heartbeating to the server continuously, and client prediction could interpret some curved-track inputs as reverse while the Worker clamped reverse progress away.
Changed: Kept the change inside Singularity Race and limited this pass to movement/sprint input, not attack redesign. Added a race-intent path for mobile input: joystick movement now produces `intent.forward` and `intent.lateral`, mobile pull-down no longer means reverse, input frames/envelopes preserve that intent, local prediction consumes the same intent helper as the Worker, and connected race frames heartbeat through the existing 100 ms input budget while a movement frame is active. PC WASD track projection remains as the fallback path.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?resetProfile=1&codex=input-intent-verify` confirmed the page loads, joystick DOM exists, `createMobileRaceIntent`/`mobileIntent`/heartbeat source hooks are present, mobile reverse-KeyS mapping is gone, and there are zero console errors.
Blocked: Attack aiming/attack stall feel is still intentionally not redesigned in this slice.
Next: Human-play mobile joystick and sprint on a real phone before starting the next attack-control slice.
Do not: Revert mobile joystick to WASD-only emulation or let Worker movement consume a different movement math path than client prediction.

Date: 2026-06-02
Observed: User clarified that after the game/result ceremony ends, the player should return to the lobby rather than being automatically gathered back into the waiting queue.
Changed: Kept the change inside Singularity Race. The result action button now reads `로비로 복귀`; `restartRaceAfterResult()` still clears movement keys, connected packets, preview sessions, audio, runner visuals, motion caches, and the room packet relay log, but now returns to `SINGULARITY_RACE_SCREENS.LOBBY` instead of rejoining the queue through `joinOnlineConnectedRoom("result_restart")`. Updated the progression/v0.1 smoke contracts and the marathon plan to lock the post-result lobby return.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?resetProfile=1&codex=result-lobby-return` confirmed the button text `로비로 복귀`, no `joinOnlineConnectedRoom("result_restart")` call in the loaded source, the lobby-return message, and zero console errors.
Blocked: Not deployed in this loop.
Next: Redeploy Worker/Pages when the current local result-flow changes are accepted, then test a full public round through finish and lobby return.
Do not: Reintroduce automatic result-to-queue rejoin until rematch/map-vote flow is deliberately redesigned.

Date: 2026-06-02
Observed: User decided the public online loop should stop depending on the public admin/operator path because admin page commands, user page joins, and room state were repeatedly drifting apart. New direction is one public user page: first joined player is temporary host, other players wait, and mid-race entry is blocked for now.
Changed: Kept the change inside Singularity Race public online. The Cloudflare Worker now disables public `/admin/*` routes with `public_admin_disabled`, assigns temporary host authority to the first player session, accepts `start_request` from that host only after Worker validation, and rejects new joins outside the lobby phase with `room_join_closed`. The Cloudflare client now sends `start_request` instead of the old host-start packet. The public admin UI is visibly disabled, no longer creates operator links or calls public start/open/reset endpoints, and all public admin controls are disabled while the dev/test admin page remains available through `?devOnline=1`. Updated the Cloudflare online docs, marathon guard, and online smoke contract to match the v2 user-host loop.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-bot-control.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on local `singularity-race-admin.html?online=cloudflare` showed `공개 관리자 비활성화`, the first-user-host notice, disabled start/map/capacity/entry controls, and no console errors.
Blocked: Not deployed in this loop. The hosted Worker/Pages URLs still need redeploy before the public site reflects this v2 contract.
Next: If accepted, redeploy Worker and Pages, then test two real devices: first entrant sees `경기 시작`, second entrant sees `방장 시작 대기중`, and late entry during countdown/race is blocked.
Do not: Reintroduce `operator=1`, public admin start/reset endpoints, or mid-race spectator join before the user-host loop is stable.

Date: 2026-06-01
Observed: User correctly pointed out that the `operator=1` player page was not a real admin page and that `singularity-race-admin?devOnline=1` still controlled only the local dev-room system, so the admin and user pages were looking at different room sources.
Changed: Kept the fix inside Singularity Race public online. The Cloudflare Worker now exposes operator-gated one-room admin endpoints: `/admin/start`, `/admin/open`, and `/admin/reset`/`close`, all against the same fixed public room used by players. `singularity-race-admin.html?online=cloudflare` now reads the public `/rooms` summary, shows the real public room count, links to the public user page, and starts/resets the public room from the admin page. The dev admin page remains available only for `?devOnline=1` local rehearsal.
Verified: Worker deploy completed as version `aabd6402-2381-4b79-8c65-1b3a20ad918e`. Live `/rooms` returned `lobby 0/50`, `/admin/start?operator=1` correctly returns `no_players` when empty, `/admin/open?operator=1` resets/opens the room, and a live WebSocket smoke with one player received `start_countdown` after the admin start endpoint. Public Pages redeploy completed, and browser verification on `singularity-race-admin?online=cloudflare` showed `공개방 lobby / 0/50`, room card `선수 0/50`, public user link, public operator/direct link, and no console errors. `npm run check:singularity-race` and `git diff --check` passed.
Blocked: Admin auth is still a future hardening task; `operator=1` is a public v0.1 control bridge.
Next: Use the public admin URL for real play tests, not `?devOnline=1`.
Do not: Expect the dev/localStorage admin page to create or delete Cloudflare public rooms.

Date: 2026-06-01
Observed: User reported the Squid wake MP3 should be the cue when a player actually enters the waiting queue room, not a generic gate-open or earlier lobby sound. The same pass also checked the skin picker space/caption issue.
Changed: Kept the fix inside Singularity Race. The entry gate opening no longer auto-plays `squid-wake`; queue entry and connected-room entry remain the explicit triggers. The lobby `입장` button now skips the normal UI confirm SFX so the browser user gesture is reserved for the Squid entry cue. The profile/queue skin grids no longer show English/id captions and the desktop queue grid fits all 24 skins without a clipped scroll row.
Verified: Browser verification reached `queue`, confirmed 24/24 skin cards visible on desktop queue, no English captions, green selected border, and no console warnings. Browser automation cannot audibly play media because the test context blocks `audio.play`, so audio behavior is guarded by source contracts. `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Cloudflare Pages redeploy completed for `singularity-race-client`, and the stable public page returns the new queue-entry audio guard and no skin caption code.
Blocked: None locally.
Next: Human-listen on the public player link: profile start -> `입장` should trigger the Squid cue, while the earlier lobby/profile state should not.
Do not: Put `squid-wake` back into lobby/menu rotation or let `entry_gate_open` play it before the player enters.

Date: 2026-06-01
Observed: User reported the public admin page showed "no created room" while the user page still showed a room. Root cause is that `singularity-race-admin.html` is the dev/localStorage host page, while the deployed user link uses the Cloudflare fixed public room.
Changed: Kept the dev admin page as development-only and added a temporary public Cloudflare operator path through the player page. `operator=1` is now passed through the Cloudflare client WebSocket join, the Worker grants countdown authority for that operator session, and the queue ready button can start the 10-second countdown only for that explicit operator link. Normal player pages still wait for the operator and do not expose host start.
Verified: Pending final redeploy verification for Worker and Pages.
Blocked: Authenticated public operator/admin roles remain future work; the temporary operator link is a v0.1 operations bridge for the fixed public room.
Next: Redeploy Worker and Pages, then verify `/rooms`, operator join/start, and normal user room visibility all point at the same public room.
Do not: Treat the dev/localStorage admin page as the public Cloudflare admin source of truth.

Date: 2026-06-01
Observed: User reported a serious movement bug: the player could appear to auto-move forward, stutter/rubber-band, and even visually turn left after moving right.
Changed: Root cause was found in the connected/server reconciliation path, not in the basic WASD vector itself. First, `mergeSingularityServerSnapshotRunners()` normalized the local participant id (`runner:<session>`) to display id `you`, but the local prediction preservation check still compared against the original session id, so 5 Hz `state_snapshot` packets could overwrite the local runner instead of easing toward server authority. Second, the Cloudflare Worker movement path used a shortcut where any nonzero input advanced progress and raw `direction.y` moved lane, which disagreed with the client/dev-server tangent/normal track projection on curves and vertical route sections. A second verification also found the Worker sprint progress speed was `1.8` while client prediction uses `0.76`, which could make server snapshots pull the player forward and read as auto-movement after input. The merge path now preserves prediction for the normalized local `you` runner, and the Worker now uses the same trail tangent/normal movement projection, lane boundary helpers, and run/sprint progress speeds as the client prediction layer.
Verified: A targeted module probe reproduced the old snap shape (`progress 12 -> 10`) and now shows smoothing (`progress 12 -> 11.76`) for `runner:tab-123` normalized to `you`. The second movement probe showed horizontal `D` sprint now matches client prediction (`0.152` progress delta over 0.2s) instead of the old Worker `0.36` delta, and curve/vertical segment progress/lane deltas also match between Worker and client prediction. `node --check workers/singularity-race-worker.js`, `node --check src/restored/games/singularity-race-dev-online.js`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Public Worker deploy completed as version `9d2a3a48-b48e-464d-bcdf-9286254994cc`; live `/health`, `/rooms`, WebSocket join, host countdown, `race_started`, and sprint input snapshot smoke passed. Static Cloudflare Pages project `singularity-race-client` was created and deployed from the current working tree for public launcher/player links.
Blocked: None for the current public Worker/static deployment. Authenticated public operator roles and a hardened admin flow remain future work.
Next: Human-play the public page with two devices, holding `D`, then entering a curve/vertical segment with `W`, and releasing input to confirm there is no auto-forward rubber-band by feel.
Do not: Reintroduce raw Worker movement shortcuts or compare local prediction preservation only against the pre-normalized participant id.

Date: 2026-06-01
Observed: User asked for projectile-style race items such as water balloons or launch shots to use a deliberate aim flow: press `E` or the mobile skill button once to auto-aim, optionally retarget with mouse click or mobile touch, then press `E` or the mobile skill button again to fire.
Changed: Kept the change inside Singularity Race item scope. `singularity-race.html` now gives projectile items (`Stun Shot` and `Ink Cloud`) a local `itemAim` lock state, a green track aim reticle, automatic target selection, click/touch retargeting against nearby forward runners or a clicked track point, and second-press firing. Immediate items (`Booster` and `Banana`) still use the old one-press behavior. The mobile skill button now reads as aim/fire based on that state, and the item smoke guard plus marathon plan document record the two-step projectile contract.
Verified: `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=item-aim-verify` loaded the race surface with 15 item boxes, the mobile skill button, and the new `race-item-aim` CSS available.
Blocked: None. Live hand-feel still needs a human run with Stun Shot or Ink Cloud because the browser check did not force a specific item pickup.
Next: Human should pick up Stun Shot or Ink Cloud once, press `E`/skill to lock, click/touch a different forward point or runner, then press again to fire; tune target radius only if that feels too hard or too loose.
Do not: Make public online item hit authority client-owned, expand into an item economy/shop, or convert non-projectile items to a two-step flow.

Date: 2026-06-01
Observed: User reported the ordinary NPC cheering crowd was visually wrong because it looked like spectators were placed on both sides of the road instead of behind the starting players in the basic map's back-left corner.
Changed: Kept the change inside Singularity Race track decoration. `track-start-crowd` is now a compact back-left spectator block behind the start area, with both citizen rows merged into one cluster instead of split across the road. The crowd still uses CSS-only ordinary pixel citizens, not race skins, and sign boards now use a small CSS waving animation.
Verified: Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=crowd-back-left` showed the race screen with 17 citizens and 8 signs grouped behind the player start area; the two visual rows were only 21px apart and the player remained well below the crowd. `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed.
Blocked: None.
Next: Redeploy the static site when the local visual pass is accepted.
Do not: Use Singularity Race runner skins for the crowd, place the crowd as road-side blockers, or make these spectators interactive NPC systems.

Date: 2026-06-01
Observed: User reported that the player queue screen wrongly showed a `10초 카운트다운 시작` button and that the entry/waiting audio flow was wrong. Root cause was the Cloudflare online first slice surfacing the first-player temporary host flag directly through player queue buttons, plus normal menu BGM setting the entry-cue `entryStarted` flag so the Squid entry cue could be skipped.
Changed: Kept the fix inside Singularity Race. `singularity-race.html` no longer lets normal player ready/map-preview buttons start the Cloudflare/dev host countdown; entered players see `운영자 시작 대기중` and wait for the operator. Normal menu BGM no longer marks the Squid entry cue as played. Entry/queue music stops the waiting playlist and plays the Squid cue, operator countdown start stops entry music, the countdown bell is louder with a short stadium echo, and race BGM starts only after the 10-second gate opens. Updated the audio and Cloudflare online smoke contracts plus the marathon plan guard.
Verified: Static source search found no remaining `10초 카운트다운 시작` label in `singularity-race.html`; only negative smoke assertions mention it. Browser verification in a temp dev room showed `입장 -> 운영자 시작 대기중`, disabled user start, `맵 미리보기` still available, no countdown-start text in the page body, waiting BGM paused, Squid entry cue playing, and countdown SFX volume set to `0.88`. `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-cloudflare-online.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed.
Blocked: None locally. Public static hosting still needs redeploy if this UI/audio fix must be visible on the hosted URL.
Next: Redeploy the static site/Pages bundle when this UI/audio fix should be visible on the hosted URL.
Do not: Re-expose host start/countdown on the normal user page or let a temporary protocol host flag become public admin authority.

Date: 2026-06-01
Observed: User reported the admin page `입장` control was behaving like a player lobby navigation: pressing it could kick the admin page into the user lobby, and newly created/dev rooms or joined users sometimes did not show `1/50` in the lobby without a manual recovery path.
Changed: Kept the fix inside Singularity Race. `singularity-race-admin.html` now treats `입장` as a host gate-opening button that writes `entryOpensAtMs: 0` and stays on the admin page. User/direct view links now open in a separate tab, and the admin page has a `새로고침` control plus room-list/runner-list refresh on stored room packet changes. `singularity-race.html` now has a room refresh button, reloads when the dev-room registry changes, reads stored dev-room snapshots for visible room counts, and preserves existing participants when a new dev tab joins by using per-tab dev participant ids while still mapping the local runner to `you`.
Verified: Browser verification with a temporary dev room showed admin `입장` is a `BUTTON` with no `href`, clicking it kept the URL on `singularity-race-admin.html`, opened the entry policy to `0`, and displayed `대기열방 입장 가능`. After inserting a room snapshot with one player, the admin room list showed `선수 1/50`, the runner badge showed `1명`, and the player page room code showed `선수 1/50 / 관전자 0/32`. `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `npm run check:singularity-race`, `git diff --check`, and full `npm run check` passed.
Blocked: None.
Next: Redeploy the static Pages bundle if this admin/dev-room fix should be available from the public hosted URL, then continue the next Singularity Race v0.1 polish slice.
Do not: Turn the dev admin page into a public authenticated admin system or add multi-room/common-engine work in this bug fix.

Date: 2026-06-01
Observed: User reported that the first profile skin picker still looked unnecessarily cramped: skin cards were visually cut inside the scroll area even though desktop and mobile had usable vertical room, and selected skins did not read strongly enough as selected.
Changed: Tightened only the Singularity Race profile picker CSS in `singularity-race.html`. The profile grid keeps the four-column order, reserves stable full-row card heights, uses more available vertical space on desktop, shows exactly full visible rows on phone widths, and adds a clear green selected-skin treatment with a `선택` badge, green border, green-tinted background, and green pulse.
Verified: Browser verification at 1454x837 showed all 24 profile skins visible with no clipped cards and one selected green card. Browser verification at 390x844 showed 16 visible cards in four complete rows, no partial clipped row, vertical scrolling for the remaining skins, and green selection state moving correctly after selecting `제미나이쨩`. `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `git diff --check`, and `npm run check:singularity-race` passed.
Blocked: None.
Next: If accepted visually, wire the static public page to use the Cloudflare online URL and continue deployment preparation.
Do not: Change the skin preset order, split `singularity-race.html`, or move profile/skin logic into a common engine during this UI polish.

Date: 2026-06-01
Observed: User created the Cloudflare Worker as `singularity-race-online` and wanted the online room to be usable for real players, not only locally simulated. Initial live WebSocket smoke showed join/chat/countdown working but no automatic `race_started` after the 10-second countdown because Durable Object in-memory phase state was lost when the object woke for the alarm.
Changed: Deployed `singularity-race-online` to Cloudflare Workers at `https://singularity-race-online.rneetn.workers.dev`. Hardened `workers/singularity-race-worker.js` so room phase/countdown state is persisted in Durable Object storage, uses an alarm to transition countdown to racing, and resets to lobby when the last socket leaves. Updated the Singularity Race client queue UI so the Cloudflare host gets a visible `10초 카운트다운 시작` button in the queue room via the existing preview button surface. Added `.wrangler/` to `.gitignore`.
Verified: `https://singularity-race-online.rneetn.workers.dev/health`, `/rooms`, and WSS join all succeeded. Live WebSocket verification passed join, chat delivery, host countdown, and automatic `race_started` after the countdown. Browser verification on `singularity-race.html?online=cloudflare&serverUrl=http://singularity-race-online.rneetn.workers.dev/ws` entered the public room as host, showed the `10초 카운트다운 시작` button, clicked it, and reached the race screen with phase `경기 중`. Full `npm run check` passed after the patch.
Blocked: None for the first public online room. The current hosted Worker is one fixed public room with 50-runner cap, 32 spectator cap, 10 Hz input guard, 5 Hz snapshots, and chat limits; it is not multi-room matchmaking or full server-authoritative race resolution yet.
Next: Wire the public launcher/deployed static page to use `?online=cloudflare&serverUrl=wss://singularity-race-online.rneetn.workers.dev/ws`, then publish the static site through a free host such as GitHub Pages or Cloudflare Pages.
Do not: Add paid infrastructure, multi-room matchmaking, public admin powers, economy authority, or common-engine work in this online slice.

Date: 2026-06-01
Observed: User decided GitHub Pages static hosting is not enough because people must actually meet online, then approved the first Cloudflare plan: one room, 50-runner cap, input at 10 Hz or lower, server snapshots at 5-8 Hz, and chat limits.
Changed: Added a Singularity Race-only Cloudflare Workers + Durable Objects online slice. `workers/singularity-race-worker.js` defines one public room `room:singularity-race:public-001`, 50 runners, 32 spectators, 10 Hz input guard, 5 Hz server snapshots, chat cooldown/burst limits, first-player temporary host, and server-owned start countdown. `wrangler.toml` declares the Durable Object binding. `src/restored/online/singularity-race-cloudflare-client.js` adds the browser WebSocket client used only behind `?online=cloudflare`. `singularity-race.html` can now enter the Cloudflare public room, receive server snapshots/chat/history/countdown, send chat/input through the Worker, and let the temporary host trigger a 10-second countdown. Added `docs/singularity-race-cloudflare-online.md` and a Cloudflare smoke guard.
Verified: `node tools/smoke-singularity-race-cloudflare-online.cjs`, `npm run check:singularity-race`, and full `npm run check` passed. Browser verification on `singularity-race.html?online=cloudflare&resetProfile=1&codex=cloudflare-client-load` showed the page loading on the profile screen with the public room status `0/50` and no broken shell.
Blocked: Deployment itself still needs the user's Cloudflare login/account context through `wrangler login` or dashboard. No API token or secret should be pasted into the repo or chat.
Next: Run Cloudflare smoke, Singularity Race checks, full check, then guide the user through free Cloudflare deploy.
Do not: Add multi-room matchmaking, common engine work, economy/reward authority, or public admin powers in this slice.

Date: 2026-06-01
Observed: User asked whether the launcher Baegeum City v2 card should lead to the old 2D city-core screen shown in the screenshot, not Dice City v1, and requested launcher copy cleanup: remove the representative-mode label, remove the banner description text, rename the primary action to `플레이`, and put the banner first on mobile.
Changed: Restored the old canvas city-core entry as `baegeum-city-v2.html` using the preserved `src/main.js` city runtime, HUD, phone shell, editor link, and skin-lab link, without redirecting into the dice build. Updated `index.html` so Baegeum City v2 links to `baegeum-city-v2.html`, Dice City v1 stays on `baegeum-city-v2-dice.html?map=dice-city&spawn=dice-blackjack-casino-01`, the primary button says `플레이`, the old visible banner copy is removed, and the mobile launcher orders the banner section above the play panel.
Verified: `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, targeted `git diff --check`, and full `npm run check` passed. Browser verification at 384px confirmed the launcher mobile order (`race-preview` above `launch-panel`), no old representative/banner copy in visible text, primary text `플레이 0.1`, and the Baegeum City v2 card href `./baegeum-city-v2.html`. Browser verification on `baegeum-city-v2.html?codex=city-core-verify` showed the canvas, phone UI, editor/skin-lab links, `scene: Iron Line 원본 도시맵`, no redirect to the dice build, and zero warning/error logs.
Blocked: None.
Next: Let the human visually confirm the restored Baegeum City v2 city-core entry from the launcher; then continue Singularity Race v0.1 polish without expanding Baegeum systems.
Do not: Treat Dice City v1 as Baegeum City v2, delete preserved city/dice/editor/skin files, or start a common engine/Baegeum expansion during this launcher fix.

Date: 2026-06-01
Observed: User reported that the queue room still showed too many pre-filled empty seats, wanted skin changes to be possible from the queue room, and wanted chat/skin change surfaces above the queue seats.
Changed: Kept the change inside `singularity-race.html`. The normal queue room now renders the chat panel and a visible `skin-panel` at the top, moves the runner slot grid to the lower track panel, and compacts non-debug queue slots to actual joined runners instead of pre-rendering all room-capacity empty seats. Queue skin selection updates the selected skin and saved profile before start.
Verified: Browser verification at 384px width entered the queue, confirmed the visible `스킨 변경` panel, 24 skin cards, actual slot count of 1 instead of 50 empty seats, queue slots below chat/skin panels, and successful skin selection change to `robot`. `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed.
Blocked: None. The existing full-check warning remains `tools/check-restored-life-job-contract.cjs longest function is 102 lines`.
Next: Have the human try queue-room skin switching once with the host page open; if accepted, continue to the next Singularity Race v0.1 polish slice.
Do not: Reintroduce 50 pre-filled empty visible queue seats in the normal player UI, move this into a common engine, or alter admin room capacity contracts.

Date: 2026-06-01
Observed: User asked for ordinary Baegeum-city-style pixel citizen spectators behind the pre-start race line, separated from Singularity Race runner skins, with small jumping motion and cheering signs such as `특이점은온다`, `특이점갤러리 화이팅`, `AGI 2027`, and `1등 부기줄`.
Changed: Added a static `track-start-crowd` decoration inside `singularity-race.html`'s race track world. It uses CSS-only `pixel-citizen` bodies, a transparent `start-crowd-fence`, staggered `start-crowd-hop` animation, and Korean cheering sign text. The crowd uses no race skin images or `getSingularityRaceSkinDataUrl` path and is hidden in map-preview mode so route reading stays clean.
Verified: Browser DOM verification confirmed 17 CSS citizens, 8 signs, no `img` tags in the crowd, race display enabled, map-preview display hidden, the transparent fence present, and `start-crowd-hop` animation active. `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed.
Blocked: None.
Next: Run the Singularity Race smoke gate and full check.
Do not: Use existing Singularity Race skins for this crowd, make spectators controllable NPCs, or expand Baegeum City systems for this decorative slice.

Date: 2026-06-01
Observed: User requested final launcher copy/link cleanup: the root launcher should show `SIMULACRA WORLD` as the shell label, keep `특이점레이스` as the main playable mode, remove the old English preview/card labels, and replace the old editor/skin-lab cards with Drawing World and Baegeum City v1 external links while keeping Baegeum City v2 and Dice City v1 preserved.
Changed: Updated `index.html` copy and card links only. The launcher now uses the Simulacra World brand label, Korean invitation copy for the Singularity Race main mode, Korean banner description, and four preserved mode cards: `배금도시 v2`, `다이스시티 v1`, `드로잉월드`, and `배금도시 v1`. Updated launcher smokes so the root page keeps the new links while `editor.html` and `skin-lab.html` files remain preserved off-card.
Verified: `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser verification on `index.html?codex=simulacra-launcher` confirmed `SIMULACRA WORLD`, the new Korean invitation copy, the primary race link, the four requested cards/links, no old English launcher tokens, and no horizontal overflow at 390px mobile width.
Blocked: None.
Next: Verify the launcher visually in browser, then continue to the next Singularity Race v0.1 slice.
Do not: Implement a Simulacra World common engine, delete preserved editor/skin-lab files, or expand Baegeum/Dice systems while changing launcher copy.

Date: 2026-06-01
Observed: User clarified the ceremony should not move everyone at once. After a runner finishes, they should briefly see that they will move to the ceremony room, then finishers should enter the podium space one by one. User also asked to confirm free movement, chat continuity, and mobile spectator/control placement around the ceremony.
Changed: Kept the change inside `singularity-race.html`. Finish results now start in a transfer phase with a short "잠시 후 시상대 공간으로 이동합니다" notice before the local player enters the ceremony room. The ceremony room now has floor-arrival runners, staggered arrival timing, a movable local finisher on the ceremony floor, and a top-five podium that only fills when the award phase locks. Existing chat remains available because the race chat path is not reset, while mobile movement controls are allowed back only during ceremony-room free movement and remain hidden for normal finished/watch states.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser/mobile verification at 390x844 confirmed the ceremony-free class path reveals the joystick/sprint controls, keeps chat at the top-left, keeps the ceremony room visible, and moves watch/restart actions above the mobile controls instead of overlapping the joystick.
Blocked: None yet.
Next: Verify smoke/check/browser, then judge the actual feel of the transfer delay and one-by-one arrival in a manual finish run.
Do not: Make ranking or finish authority client-owned, move non-finishers into the ceremony as if they finished, or expand this into a shared engine.

Date: 2026-06-01
Observed: User clarified that the podium should not be a card/panel UI. The finish should feel like players moved into a separate rectangular ceremony room with walls and a central podium, with characters physically standing on the podium.
Changed: Added a Singularity Race-only `race-ceremony-space` inside the race track surface. When a race final result is shown, the active track/minimap/HUD are hidden and a separate ceremony room with back/side walls, floor, central 1-5 podium steps, and runner skin sprites on the podium slots is rendered from the existing final ranking. The old `race-result-panel` is reduced to transparent bottom action buttons so restart/watch behavior remains available without covering the scene.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=ceremony-room` showed the race page loading with the ceremony host, room/back-wall/stage CSS hooks, existing race screen, 15 item boxes, and zero browser warning/error logs.
Blocked: None.
Next: Verify that the ceremony room renders on finish without console errors and that result restart still returns to the queue.
Do not: Make ceremony ranking client-authoritative, add free movement in the ceremony room yet, or expand this into a shared engine.

Date: 2026-06-01
Observed: User reported that item boxes could be collected from too far away, even when the runner only passed near the box.
Changed: Tightened the Singularity Race item pickup radius from the old wide anti-pass-through values to visible-contact values: progress radius `0.72` and lane radius `58px`. Kept the short movement trace so a true fast crossing through the box still collects it. The item contract and smoke now explicitly reject near lane/progress misses while preserving crossed-box pickup.
Verified: `node --check src/restored/games/singularity-race-item-contract.js`, `node --check tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-items.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=item-hitbox-tight` showed race screen, 15 item boxes, 15 item icons, roulette host, and zero browser warning/error logs.
Blocked: None.
Next: Verify item smoke, Singularity Race readiness, and browser load; then have the human try passing just beside a box once.
Do not: Return to the old overly wide pickup radius unless item pass-through returns with proof from a real run.

Date: 2026-06-01
Observed: User reported small Singularity Race item bugs, especially Booster feeling like it was not working, and asked to verify whether other items such as a vision-blocking ink effect exist.
Changed: Kept the change inside Singularity Race item scope. The 0.1 item contract now exposes four items: Booster, Banana, Stun Shot, and Ink Cloud. Booster already affected local/connected prediction speed; it now also gives the local runner a visible boost glow while active. Ink Cloud drops a short-lived hazard, briefly slows/blinds hit runners, applies a local screen mask when it hits the player, appears in item roulette/effect markers, and is covered by the item smoke guard. Item visuals now use shared code-built pixel icons for the track box, Booster rocket, Banana peel, Stun Shot bolt, and Ink Cloud blob across track markers, roulette, and the mobile item button instead of plain letter markers.
Verified: `node --check src/restored/games/singularity-race-item-contract.js`, `node --check tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-items.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&codex=item-design` showed race screen, 15 item boxes, 15 track item icons, the shared icon CSS for Booster/Banana/Stun/Ink, roulette host, and zero browser warning/error logs.
Blocked: None yet.
Next: Human should try one real item pickup and use Booster/Banana/Stun Shot/Ink Cloud in a live run; if Booster still feels weak, tune only the effect duration/feedback inside the safe item contract range.
Do not: Expand into a broad item economy/shop/trading system, replace the checkpoint reward skill contract, or make public online item authority client-owned.

Date: 2026-06-01
Observed: User asked for final verification and to move to the next slice. The next risk in the post-result rematch path was stale host start commands replaying after `다시 대기`.
Changed: Hardened `result_restart` so connected players gathered back into the queue/waiting room do not replay an old host `start_countdown` command. The next round now still requires host action: map selection or map vote may change the map, but the race only starts after the host presses `시작` again. Updated the progression/v0.1 lock smokes and the marathon plan.
Verified: Browser admin verification confirmed `입장`, `시작`, and `맵 투표하기` remain separate with map buttons `기본/네모/미로`, rendered track path, and zero warning/error logs. `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, and `npm run check:singularity-race` passed.
Blocked: None.
Next: Continue with a true post-ceremony rematch prompt if desired: host opens map vote from the gathered queue, users vote, winning map applies, then host presses `시작`.
Do not: Auto-start a race from result restart, map selection, or map vote; do not make rematch/vote authority client-owned.

Date: 2026-06-01
Observed: User confirmed the ceremony direction, asked whether the podium/ceremony was implemented, and reported that the three race maps looked too similar. User also wanted post-result players gathered back into the waiting room before later rematch/vote work.
Changed: Confirmed the ceremony MVP remains implemented, then reshaped the three Singularity Race-only maps. `기본` keeps the balanced zigzag stadium, `네모` now uses a large outer-box/inner-box route, and `미로` now uses many short corridor turns on one safe route. Admin map labels now show `기본`, `네모`, and `미로`. Added geometry validation that sampled selectable map shapes must be visibly distinct. Changed `다시 대기` so result restart returns players to the queue/waiting room and reconnects dev-room players with `joinDevConnectedRoom("result_restart")` instead of dropping connected players back to the lobby.
Verified: Browser verification on `singularity-race-admin.html?devOnline=1&codex=map-shape-final` confirmed admin map buttons `기본/네모/미로`, descriptive titles, start button still separate as `시작`, map vote button still separate as `맵 투표하기`, a rendered track path, and zero warning/error logs. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-progression.cjs`, and `npm run check:singularity-race` passed.
Blocked: None for map shape separation. A human visual pass should still judge whether the new maze feels maze-like enough in actual play.
Next: If the map visuals are accepted, the next slice can be post-ceremony rematch flow: gather to queue, optionally open a map vote, then require the host to press Start again.
Do not: Auto-start from map selection or map vote, make vote/ranking client-authoritative, or create a shared common engine.

Date: 2026-06-01
Observed: User asked for a final check and to move on after the first ceremony MVP. The next safe continuation was to add the ceremony wait/award timing without creating a free-move ceremony room yet.
Changed: Added a 15-second local ceremony wait phase to `singularity-race.html`. Local finish results now show a `race-ceremony-status` countdown, keep updating local ranking while bots continue, then lock the 1-5 podium into an award phase and play the podium applause only when the award phase begins. Connected/server finish results remain server-owned and do not let the client timer decide final authority. Updated the progression and v0.1 lock smokes plus the marathon plan.
Verified: Browser verification on `singularity-race.html?resetProfile=1&codex=ceremony-timer` confirmed the ceremony status, podium, and summary DOM exist with zero warning/error logs. `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, and `npm run check:singularity-race` passed.
Blocked: Full audible timing feel still needs a human finish run because automated verification does not judge whether 15 seconds feels right.
Next: Run one manual finish, then either tune `CEREMONY_GRACE_MS` or continue to the next ceremony slice: a separate `ceremony_wait -> ceremony_award` surface with limited free movement below the podium.
Do not: Make connected final ranking client-authoritative, auto-start a rematch, or turn this into a shared common engine.

Date: 2026-06-01
Observed: User asked to continue toward the Singularity Race post-race ceremony idea, with the safe first slice being a shared result/podium MVP rather than free movement in a new ceremony room.
Changed: Kept the existing in-race `race-result-panel` and added a ceremony MVP inside it: a 1-5 podium strip, summary chips for 6th-and-lower finishers, not-finished/timeouts, and spectators, plus full-ranking data on the finalized local/server result object. Existing watch/chat/restart behavior remains intact, and the later free-move ceremony room is still deferred. Updated the progression/v0.1 lock smokes and the marathon plan.
Verified: Browser verification on `singularity-race.html?resetProfile=1&codex=ceremony-podium` confirmed the podium and ceremony-summary DOM exist, the blue theme tokens still resolve, and warning/error logs were empty. `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `node tools/check-size.cjs`, full `npm run check`, and `git diff --check` passed. The existing size warning remains: `tools/check-restored-life-job-contract.cjs` longest function is 102 lines.
Blocked: None for the MVP. The real free-move ceremony space, automatic podium movement, and post-result rematch/map-vote loop are still separate future slices.
Next: If continuing the ceremony system, add a `ceremony_wait -> ceremony_award` state and grace timer after first finish, still inside Singularity Race only.
Do not: Add a shared common engine, auto-start rematches from votes, or wire ceremony state into Baegeum/Dice/casino/life systems.

Date: 2026-06-01
Observed: User provided `freesound_community-10sec-countdown-bell-sound-79584.mp3` and asked for the pre-race 10-second countdown to follow that sound.
Changed: Copied the provided MP3 to `assets/restored/audio/singularity-race/sfx/countdown-bell.mp3`, registered it as `audio:sfx:singularity-race:countdown-bell`, added a `sfx-countdown-bell` audio track to `singularity-race.html`, and play it when `startLocalCountdown()` begins. The countdown now stops menu/entry music first, uses an offset when a client late-syncs into an already-running countdown, and stops any countdown tail before `dont-stop-me` starts at gate open. Updated the audio smoke and OST/marathon docs.
Verified: `node tools/smoke-singularity-race-audio.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `npm run check:singularity-race`, `node tools/check-size.cjs`, and `git diff --check` passed. Browser verification confirmed `race-audio-sfx-countdown-bell` exists with asset id `audio:sfx:singularity-race:countdown-bell`, role `sfx-countdown`, and zero browser warning/error logs.
Blocked: Actual timing/volume feel still needs a human listen because browser automation cannot judge whether the bell matches the visible countdown rhythm.
Next: Hand-listen once from an admin-started countdown; if it feels early/late or too loud, tune only the countdown SFX volume or offset.
Do not: Start `dont-stop-me` before the countdown finishes, put countdown audio into normal lobby rotation, or create a shared audio engine.

Date: 2026-06-01
Observed: User requested a Singularity Race audio-flow change: normal launcher/lobby BGM should use only the two lobby tracks, `squid-wake` should be removed from normal lobby rotation and play as the entry cue when the host opens/players enter the waiting room, and `dont-stop-me` should start only after the 10-second race countdown opens the gate.
Changed: Removed `squid-wake` from the `index.html` launcher playlist and from `singularity-race.html` `MENU_AUDIO_TRACK_KEYS`. Added a separate `ENTRY_GATE_AUDIO_TRACK_KEY` flow for `squid-wake`, played when the entry gate opens and on queue/dev-room entry, stopped on race start, and allowed to hand back to the two-track lobby playlist if the race has not started. Kept `dont-stop-me` on the existing `requestRaceMusicStart("gate_open")` path so it starts after countdown completion, not at host start-click time. Updated audio smokes and OST/marathon docs.
Verified: `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-index-entry.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser verification confirmed the launcher audio element now points to `audio:bgm:singularity-race:modern-future-world` instead of `squid-wake`, and the player page creates separate audio roles for `entry-bgm`, two `menu-bgm` tracks, and `race-start` with zero browser warning/error logs.
Blocked: Actual speaker loudness/taste still needs a human listen because automated browser clicks may leave audio paused under autoplay policy.
Next: Hand-listen once from launcher/profile to lobby, then enter the queue/dev room and confirm the `squid-wake` cue feels right before starting a race.
Do not: Put `squid-wake` back into normal launcher/lobby rotation, start `dont-stop-me` before the countdown gate opens, or move this into a shared audio engine.

Date: 2026-06-01
Observed: User approved the next natural Singularity Race slice: pre-race map voting MVP where the host opens a vote, users choose one of three maps in a central modal, the winning map updates room policy, and the host still starts the race separately.
Changed: Added room-policy map-vote helpers for opening, casting, status/counting, and finalizing votes. `singularity-race-admin.html` now has a `맵 투표하기` host control, shows live vote counts, disables race start while the vote is running, and finalizes the winning `mapId` after the timer without publishing `start_countdown`. `singularity-race.html` now shows a central `map-vote-panel` before the race, lets the local player vote once with a stable voter id, shows vote counts/selection, and keeps the actual race start under the existing host Start button. Updated the marathon plan and smokes to guard this slice.
Verified: Browser verification opened a dev-room vote from the admin page, confirmed Start was disabled during voting, voted for Square from the user modal, saw Square receive 1 vote, waited for the timer, and confirmed admin finalized MAP Square while Start remained a separate button. Browser logs had zero warnings/errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None.
Next: A clean next slice is post-result ceremony/podium or post-result rematch voting, but rematch voting should stay separate from this pre-race MVP.
Do not: Auto-start the race from a map vote, add race-in-progress voting, create a shared lobby engine, or wire this into Baegeum/Dice/casino/life systems.

Date: 2026-06-01
Observed: User asked to add an admin-controlled "enter after N minutes" gate for the Singularity Race waiting room, merge the visible queue heading into one waiting-room title, and make empty slots follow the admin room-capacity setting.
Changed: Added entry-delay policy support to the Singularity Race room policy, dev room registry, admin page, and player waiting-room gate. Admins can now set immediate/1/3/5/10 minute entry availability, room cards and user-entry links show the remaining entry delay, and player entry/spectator buttons are blocked until the gate opens. The waiting-room title now reads "특이점레이스 대기열방" in the player page title area, the old separate queue panel heading is hidden, and empty runner slots are rendered up to the active admin room max instead of a fixed global count.
Verified: Browser verification reset the admin delay to immediate, confirmed admin entry actions were enabled, entered the player waiting room, and confirmed the title, hidden queue panel heading, 50 room-capacity slots, and zero browser warning/error logs. `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None.
Next: Continue with the next Singularity Race v0.1 slice, likely map voting now that multiple maps and waiting-room host controls exist.
Do not: Turn the entry-delay gate into a common lobby engine or wire it into Baegeum/Dice/casino/life systems.

Date: 2026-06-01
Observed: User asked for a final browser confirmation that entering from the game launcher starts the lobby/waiting BGM from the launcher button click.
Changed: Fixed launcher-to-player BGM handoff by storing a `singularity-race:launcher-menu-bgm-intent` session intent on `index.html` primary entry click and consuming it in `singularity-race.html` to try menu/lobby BGM immediately after load. Also prevented ordinary non-dev launcher entry from replaying stale dev-room close/control commands, so a previously closed host test room no longer blocks the public lobby or its BGM.
Verified: Browser verification from `index.html` -> `특이점레이스 시작` showed `race-audio-entry` playing on the lobby page with `paused: false`, `currentTime` advancing, and the normal lobby no longer marked as a closed dev room. `node tools/smoke-index-entry.cjs`, `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Blocked: None.
Next: Proceed to the next feature slice, with map voting still the clean next candidate.
Do not: Turn this into a shared audio engine or wire launcher/lobby BGM into other held systems.

Date: 2026-06-01
Observed: User approved moving past the current bug slice and discussed map voting, with the realistic next step being maps first rather than voting/auto-rematch immediately.
Changed: Added a Singularity Race-only three-map trail catalog in `src/restored/games/marathon-trail-map-catalog.js` and exposed it through `marathon-trail-geometry.js`: Basic Stadium, Square Sprint, and Maze Run. Room policy now persists a selected `mapId`; the dev adapter, dev room registry, snapshots, player page, local bot/prediction movement, minimap, attack targeting, and dev server mock consume that selected map. `singularity-race-admin.html` now has a manual MAP selector for the active room, and `singularity-race.html` syncs policy map changes while avoiding mid-race map swaps.
Verified: Browser verification showed the admin MAP selector exposes all 3 maps, Maze selection updates the track preview, and the player lobby/map preview syncs to `MAP Maze` with zero console warning/error logs. `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Blocked: None so far.
Next: Leave map voting itself as the next separate slice: admin opens a pre-race vote, users choose one of the 3 maps, the winning `mapId` updates room policy, and the host still presses Start separately.
Do not: Add map voting, post-race auto-rematch, a common engine, or city/economy/life expansion in this slice.

Date: 2026-06-01
Observed: User clarified the admin bug report: `입장` and `시작` must be visibly separate on the host page. `시작` may immediately issue the countdown once entrants exist, but there must also be a distinct player-entry control so room entry is not confused with race start.
Changed: Added a separate `입장` control to the admin quick actions in `singularity-race-admin.html`, changed the top player link to `유저 입장`, and changed room-card actions from `로비` to `입장`. The new entry controls point to `createPlayerRoomHref(activeRoomId)` and never publish `start_countdown`; the existing `시작` button remains gated by `canStartRaceControl()` and still only starts the countdown when at least one visible runner or test bot exists. Updated the bot-control/v0.1 lock smokes and the marathon plan connected-start guard.
Verified: Browser verification on a freshly created dev room showed `입장` href pointing to `singularity-race.html?devOnline=1&roomId=...`, room-card action text `입장`, top link text `유저 입장`, runner count `0명`, and `시작` disabled. After pressing `봇 넣기`, runner count became `50명` and `시작` enabled, with zero console warning/error logs. `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None.
Next: Use the admin `입장` control for player/normal lobby entry, then use `시작` only after the player or test bots appear in the host runner list.
Do not: Merge player entry back into the `시작` command, allow zero-entrant race starts, or replace this with a broader admin-page rewrite.

Date: 2026-06-01
Observed: User asked to continue and finish anything left after the blue theme and button animation slice; the pending item was the quiet four-cue UI SFX set for player/admin controls.
Changed: Added generated `ui-tap`, `ui-confirm`, `ui-toggle`, and `ui-deny` MP3s under `assets/restored/audio/singularity-race/sfx/`, registered them as `audio:sfx:singularity-race:*` manifest ids, and wired them only inside `singularity-race.html` and `singularity-race-admin.html`. Player controls now route lobby/profile/chat/card clicks through `playRaceUiSfx()` while excluding race movement/attack controls; admin console buttons/cards/chat route through `playAdminUiSfx()` with a hidden `admin-ui-audio-root`. The audio smoke and Singularity Race audio docs now guard the UI SFX ids and player/admin hooks.
Verified: Browser verification showed the player page creates 16 hidden race audio elements including all four UI SFX ids, the admin page creates 4 hidden admin UI audio elements with the same ids, the blue admin accent remains `#168dff`, and both pages had zero warning/error logs after a control click. `node tools/check-restored-asset-pipeline.cjs`, `node tools/smoke-singularity-race-audio.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: Actual loudness/taste still needs human listening because browser autoplay policy and remote verification cannot judge volume feel.
Next: Hand-listen once on profile skin selection, start/ready/chat, and admin console controls; if any cue feels too sharp, tune only per-track volume or replace the specific MP3 while keeping the same manifest ids.
Do not: Move UI SFX into the shared OST button, add a common audio engine, or wire these cues into Baegeum/Dice/casino/life systems.

Date: 2026-06-01
Observed: User approved the first visual slice: make the Singularity Race lobby and admin page match the blue launcher style, add button press animation feedback, and postpone the 4 UI SFX set. During browser review, the user also noted the dark skin picker made characters hard to see.
Changed: Updated `singularity-race.html` profile/lobby/queue/map-preview UI tokens to the launcher-like blue SF palette, added blue panel/header/button styling, hover/active press animation, and reduced-motion guards. Kept the skin picker and profile preview on bright white/light-blue cards so pixel characters remain readable. Updated `singularity-race-admin.html` with the same blue operating-console palette, dark blue camera frame, button/card press reactions, active-state pulse, and reduced-motion guard. Added v0.1 lock smoke tokens for the blue accent and UI press animation.
Verified: Browser verification showed the player page using `#061326` / `#168dff`, gradient blue action buttons, `ui-press-pop`, bright skin cards, 24 skin cards, scrollable profile picker, and zero warning/error logs. Admin browser verification showed the same blue accent, gradient primary button, dark blue camera frame, `ui-press-pop`, and zero warning/error logs. `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None.
Next: If the visual feel is accepted, the next optional slice is the postponed UI SFX set: `ui-tap`, `ui-confirm`, `ui-toggle`, and `ui-deny`, tuned quietly after a real click/tap gesture.
Do not: Re-darken skin cards, add UI SFX into attack/item SFX ids, or broaden this into a common design engine.

Date: 2026-06-01
Observed: User asked whether the now-large Singularity Race profile skin list should scroll, and preferred replacing the intro copy under the title with nickname entry plus `Start`.
Changed: Removed the profile intro sentence from `singularity-race.html`, moved the nickname input and `Start` button into a new `profile-heading` directly under the `Singularity Race` title, left skin cards as direct selectable buttons with no extra select button, and capped the profile skin grid with its own vertical scroll area. Added v0.1 lock smoke coverage for the heading, direct nickname/start controls, the removed intro copy, and the nickname-before-skin-grid order.
Verified: Browser verification on `singularity-race.html?resetProfile=1&codex=profile-top-name` showed screen `profile`, title text present, intro copy absent, nickname/start before the grid, 24 skin cards, four columns, `overflow-y: auto`, and `scrollHeight > clientHeight`. `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed.
Blocked: None.
Next: Human can judge the exact first-screen visual balance on a phone; if it feels cramped, tune only the profile grid max-height/padding.
Do not: Add per-card select buttons, move nickname/profile state into another system, or expand this into a broader profile/account rewrite.

Date: 2026-06-01
Observed: User requested Singularity Race event SFX: generated MP3s for attack and item pickup, the provided warm positive MP3 for winner finish arrival, the provided Dragon Studio applause MP3 for podium applause, and any additional useful effects for item throw/use, item hit, skill use, and attack feedback.
Changed: Added generated `attack-swipe`, `item-pickup`, `item-use`, `item-hit`, and `skill-use` MP3s under `assets/restored/audio/singularity-race/sfx/`, copied the provided finish and applause MP3s as `winner-finish.mp3` and `podium-applause.mp3`, and registered all seven as `audio:sfx:singularity-race:*` manifest ids. `singularity-race.html` now creates hidden SFX audio elements, plays attack/item/skill/hit feedback at their event points, stops race BGM on finish, plays the winner finish cue, schedules podium applause, and stops long SFX on restart/room close.
Verified: `node tools/check-restored-asset-pipeline.cjs`, `node tools/smoke-singularity-race-audio.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser verification loaded 12 manifest-backed race audio elements, including all seven SFX ids, with no console warning/error logs.
Blocked: Actual audible playback still requires a real user gesture and human listening for volume taste.
Next: Hand-listen to attack, item pickup/use/hit, finish, and applause once; if any sound is too loud or too long, tune only per-track `volume` or swap the SFX file without changing ids.
Do not: Move these feature SFX into the shared OST button, add a common audio engine, or wire them into Baegeum/Dice/casino systems.

Date: 2026-06-01
Observed: User requested a total three-track BGM flow starting from the game launcher through profile/lobby/waiting rooms, with waiting music turning off automatically when the race starts.
Changed: Promoted the two user-provided MP3s to `assets/restored/audio/singularity-race/bgm/modern-future-world.mp3` and `assets/restored/audio/singularity-race/bgm/atlas-futuristic.mp3`, registered them as Singularity Race manifest ids, and combined them with `squid-wake` as the launcher/menu playlist. `index.html` now resolves launcher BGM through the asset manifest and stops it before entering the race page. `singularity-race.html` now separates menu BGM from race BGM, cycles the three waiting tracks after user gesture, and calls `stopMenuBgm()` when the race surface or race-start command takes over.
Verified: `node tools/smoke-singularity-race-audio.cjs`, `node tools/smoke-index-entry.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `npm run check:singularity-race`, full `npm run check`, and `git diff --check` passed. Browser verification showed the launcher creates one hidden audio element and starts `audio:bgm:singularity-race:squid-wake` after a click, while the player page creates five manifest-backed audio elements and starts the menu BGM after profile completion with no console warning/error logs.
Blocked: Audible playback still depends on a real click/tap/key gesture because of browser autoplay policy.
Next: Hand-listen once on launcher and once through profile/lobby/queue to tune volume if it feels too loud or too quiet.
Do not: Move Singularity Race feature BGM into the common OST button, add a generic audio engine, or wire the unused Drowning track into this map version.

Date: 2026-06-01
Observed: User continued the Singularity Race skin/profile polish: blank nicknames should become `플레이어01` to `플레이어99`, `지피쨩/클로드/그록/제미나이` should stay on one row, `클로드쨩` should become `클로드군`, `개미단` should become `서학개미`, `특붕이` should use a sky-blue outfit, `특궁` should read Robocop-like, `역류기` should read hacker-like, `제미나이쨩` should look more feminine, `아틀라스` should be a robot with a central black circular face, and `도널드트럼프`, `이재명`, and `폰 노이만` should be added.
Changed: Kept stable skin ids where existing saves might point to them, but updated visible names and race-only SVG styling in `src/skins/singularity-race-skin-presets.js`. Added `grok-chan`, `gemini-chan`, `claude-chan` as `클로드군`, `atlas-robot`, `donald-trump`, `lee-jaemyung`, and `von-neumann`, with matching run styles in `singularity-race-runner-view.js`. The profile grid now uses four columns and orders `지피쨩`, `클로드군`, `그록쨩`, and `제미나이쨩` together on one row. Blank profile submission now stores a random `플레이어NN` nickname.
Verified: Browser verification showed 24 skin cards, `특붕이` first with sky-blue SVG color, the mascot group sharing one row, `아틀라스` visible with a central black circle in its SVG, `클로드쨩` and `이재명(대한민국대통령)` absent, and `클로드군`, `도널드트럼프`, `이재명`, `폰 노이만`, and `아틀라스` visible. Playwright verification submitted an empty nickname and confirmed `singularity-race:profile:v1` saved a value matching `플레이어\d{2}`. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Blocked: None.
Next: Human can judge the 32px readability of the public-figure and mascot skins; if needed, tune only their SVG accessory rectangles and keep the same ids.
Do not: Rename existing stable skin ids for visual-only changes, break `singularity-fan` first / `kaguya` last, or expand this into a broader skin marketplace/economy system.

Date: 2026-06-01
Observed: User requested five Singularity Race profile skin edits: `서버 터짐이 -> 역류기`, `AI 신봉자 -> 특궁`, `손절 전사 -> 김대식`, `익절 요정 -> 일론머스크` with a matching pixel-personality redesign, and `도지 러너 -> 강성태` as a human with human hair, checkered shirt, and black pants.
Changed: Kept the existing stable skin ids for save/localStorage compatibility, but changed the visible names and race-only SVG styling in `src/skins/singularity-race-skin-presets.js`. `doge-runner` now displays as `강성태` with human hair, checkered shirt, and black pants, and its run style changed from hop to quick in `singularity-race-runner-view.js`. Added guard coverage for the new requested names and updated the marathon plan note.
Verified: Browser verification on `singularity-race.html?resetProfile=1` showed all five new names visible, all five old names absent, all changed skin images loaded as SVG data URLs, and the `특붕이` first / `카구야` last order still intact. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, and full `npm run check` passed.
Blocked: None.
Next: Human can visually judge whether `일론머스크` and `강성태` read strongly enough at 32px; if not, tune only their SVG overlay/accessory rectangles.
Do not: Rename the stable skin ids or remove the `singularity-fan` first / `kaguya` last picker contract while iterating on these visible character designs.

Date: 2026-06-01
Observed: User asked to remove the launcher operations/admin button, replace the Singularity Race banner with the provided city-race image, return the launcher styling to a blue direction, connect community to the Singularity Gallery, add settings credits, and put `특붕이` first / `카구야` last in the skin page.
Changed: Reworked `index.html` as a blue Singularity Race-first launcher with Home/Community/Settings navigation, removed the visible operations/admin action from the launcher, copied the provided banner to `assets/singularity-race/banner-qorud.png`, registered it in the restored asset manifest, and added the requested credits/settings modal. Added Home/Community/Settings links to the race options panel with the same credits panel. Reordered the Singularity Race skin presets and profile priority so `singularity-fan`/`특붕이` is first and `kaguya`/`카구야` is last.
Verified: Browser verification showed the launcher has no admin/operations action, loads `banner-qorud.png`, opens the settings modal with the requested credits, and points Community to `https://gall.dcinside.com/mgallery/board/lists?id=thesingularity`. Browser verification on the player page showed the normal profile skin grid starts with `singularity-fan`/`특붕이` and ends with `kaguya`/`카구야`, with admin text not visible in a normal user URL. `npm run check:singularity-race` and full `npm run check` passed.
Blocked: None. A previously stored debug room was closed in local browser storage, so browser verification did not use that old room for live race entry.
Next: Hand-open the launcher and player profile once to judge final banner crop/brightness; if it feels too tall or dark, adjust only the launcher image fit/overlay.
Do not: Re-add a visible operations/admin button to the user launcher, move admin testing into the normal launcher path, or change the skin ids/localStorage contracts for this visual slice.

Date: 2026-06-01
Observed: After the admin start/entry split passed, the next v0.1 slice moved to result/restart verification. Browser verification exposed two result-loop blockers: the race minimap hot render called `listRestoredMarathonTrailSavePoints()` without importing it on the player page, and the visible result panel had `pointer-events: none`, so `다시 대기` could be blocked by the track surface.
Changed: Imported `listRestoredMarathonTrailSavePoints` into `singularity-race.html`, made the visible finish result panel accept pointer events, and made `restartRaceAfterResult()` clear the room-scoped dev packet relay log before disconnecting the preview session. Updated progression/render-budget/v0.1 lock smokes and the marathon plan so these result/restart contracts stay guarded.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-v01-lock.cjs`, and targeted `git diff --check` passed. Browser verification on `room:singularity-race:dev-234` showed `profile -> lobby -> queue`, `join_result` before start, race input gates open, server `finished` snapshot producing a ranked result row and visible `다시 대기`, clicking `다시 대기` returning to `lobby`, result rows clearing, room packet log dropping to `0`, and no captured console warnings/errors.
Blocked: None for this result/restart slice.
Next: Continue to the mobile hand-control verification slice, then run `npm run check:singularity-race` and full `npm run check` as the next integration gates.
Do not: Reintroduce a non-clickable result panel, leave room packet storage uncleared after result restart, or remove the minimap save-point import without removing the hot-loop call.

Date: 2026-06-01
Observed: User reported two Singularity Race bugs during admin/player verification: the admin `시작` action could be pressed before a player had entered, and after start the player appeared unable to move.
Changed: Split room entry from race start more strictly. Normal connected player entry now stays on `queue`; only admin-direct/spectator/admin-observer links enter the race view immediately. The admin start button now requires at least one visible runner or test bot before it enables, and clicking start with no entrant reports `선수 입장 대기` instead of broadcasting a start. The race animation loop now schedules through `scheduleActionPreviewLoop()` and has `startActionPreviewWatchdog()` so a single frame failure or stalled frame loop cannot freeze the countdown at `9` and prevent `finishCountdownIfReady()` from opening the race. Updated progression/render-budget/bot-control smokes and the marathon plan to guard the new start boundary.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/check-restored-marathon-contract.cjs`, `npm run check:singularity-race`, targeted `git diff --check`, and full `npm run check` passed. Browser verification on a fresh `room:singularity-race:dev-007` showed: empty room start disabled; user `입장` lands on `queue`; admin sees `선수 1/50` and start enables; start sets `카운트다운 시작`; user re-entry reaches `race`; countdown advances `8 -> 5`; phase becomes `경기 중`; joystick and sprint are enabled; attack is enabled; console warning/error logs are empty.
Blocked: Browser automation could not prove a long physical key hold because available key helpers send short key presses, but the post-countdown input gates are open and existing movement/prediction smokes pass.
Next: Continue to the next v0.1 stabilization slice: result/restart verification or mobile hand-control verification. Keep changes focused on Singularity Race.
Do not: Re-merge room entry and race start, allow host start with zero visible entrants, or remove the frame-loop watchdog without an equivalent countdown/race liveness guard.

Date: 2026-06-01
Observed: User fixed the current direction: do not build a common engine or broaden Baegeum/Dice/life/economy systems now; focus remaining work on making `특이점레이스` the playable v0.1 representative game while preserving future expansion paths.
Changed: Added `docs/singularity-race-v0-1-lock.md`, linked it from `docs/INDEX.md`, and added `tools/smoke-singularity-race-v01-lock.cjs`. The new smoke guards the launcher staying Singularity Race-first without becoming redirect-only, preserved muted Baegeum/Dice/editor/skin-lab links, the profile/lobby/queue/mapPreview/race/result/restart flow anchors, admin room/bot/start/observer anchors, and the future-expansion lock doc. Wired the smoke into both `npm run check:singularity-race` and full `npm run check`.
Verified: `node tools/smoke-singularity-race-v01-lock.cjs`, `npm run check:singularity-race`, `node tools/check-size.cjs`, targeted `git diff --check -- docs/singularity-race-v0-1-lock.md tools/smoke-singularity-race-v01-lock.cjs tools/smoke-singularity-race-01-ready.cjs docs/INDEX.md package.json`, and full `npm run check` passed.
Blocked: No browser pass was run because this slice changed docs/test coverage and package wiring only, not runtime UI behavior.
Next: Continue with narrow Singularity Race v0.1 stabilization, especially hand/browser verification of the normal player entry, admin-created dev room start, finish result, watch-after-finish, and return-to-queue loop.
Do not: Start common-engine extraction, Simulacra World launcher work, Baegeum/Dice/casino/life/economy expansion, ZIP creation, large `singularity-race.html` refactors, or link/file deletion during the v0.1 focus pass.

Date: 2026-06-01
Observed: User asked for a final bug check and for the Singularity Race admin page to support actual room deletion in addition to room close/end.
Changed: Added a separate `방 삭제` admin action and confirmation dialog. `방 종료` still keeps the room record closed and blocks re-entry; `방 삭제` now broadcasts a close command for active clients, removes the dev room from the registry, clears room packets/chat/control storage, and moves selection to the next room or clears it. The room-close smoke now guards the delete path too.
Verified: `node tools/smoke-singularity-race-room-close.cjs`, `npm run check:singularity-race`, targeted `git diff --check -- singularity-race-admin.html tools/smoke-singularity-race-room-close.cjs`, and full `npm run check` passed. Browser verification on the admin page showed `방 종료` and `방 삭제` as separate buttons, the delete dialog opening with the selected room name, room cards still rendering, and zero warning/error logs.
Blocked: Delete confirmation was not clicked in browser verification to avoid removing the user's current local room; the pure smoke and code path cover the deletion behavior.
Next: Use `방 종료` when players should be kicked but the closed room should remain visible, and `방 삭제` only when the admin wants to remove the local dev room from the list entirely.
Do not: Merge the close and delete semantics again; they serve different admin operations.

Date: 2026-06-01
Observed: User reported that the provided Singularity Race player URL for `room:singularity-race:dev-003` was skipping the lobby and opening the in-game race screen.
Changed: Split admin-page links so normal room/player links use `devOnline=1&roomId=...` without `adminLaunch`, while the top admin shortcut is explicitly labelled `관리자 직접 보기` and keeps the direct-launch flag. The player page now treats stored start/room-close commands as replay state on page load: ordinary fresh player links stay in lobby/profile, while live players and admin observer/direct paths still receive the race/closed-room behavior when appropriate.
Verified: `npm run check:singularity-race`, targeted `git diff --check -- singularity-race.html singularity-race-admin.html`, and full `npm run check` passed. Browser verification confirmed the normal `dev-003` player link now lands on `screen=lobby` with `adminLaunch=false` and no warning/error logs, while the closed room status remains visible instead of forcing the race screen.
Blocked: The local `dev-003` room is currently closed in browser storage, so it correctly remains non-enterable until a new room is created or reopened from the admin page.
Next: Use the player link without `adminLaunch` for normal testing; create a fresh room from the admin page when a playable room is needed.
Do not: Give normal player links with `adminLaunch=1`; reserve that flag for admin direct/observer paths only.

Date: 2026-06-01
Observed: User asked for final whole bug verification before moving on from the current Singularity Race slice.
Changed: Ran the full project gate and fixed only verification blockers: trimmed `tools/check-restored-marathon-contract.cjs` under the 300-line size limit, compacted newly added asset manifest entries under the restored growth limit, and compacted `singularity-race-control.js` plus `marathon-room-adapter.js` without changing behavior. The earlier package duplicate for `smoke-singularity-race-audio.cjs` remains deduped.
Verified: Full `npm run check` passed end to end. Browser verification on the admin observer narration link showed `screen: race`, `shell is-spectator is-admin-observer`, observer panel/start/narration/close controls visible, 15 item boxes, 3 audio elements, minimap/options mounted, and zero warning/error logs. Clicking `나레이션 시작` showed the narration overlay with typed Korean text and no warning/error logs. Targeted `git diff --check` passed with only existing LF/CRLF warnings.
Blocked: None. Audible music still needs a real human click/tap/key gesture to satisfy browser autoplay policy, as documented.
Next: If the human accepts the current Singularity Race slice, the next work can move to either commit/backup or the next game/system slice.
Do not: Reopen broad movement/map/UI redesign in this verification pass unless a new hand-test bug is reported.

Date: 2026-05-31
Observed: User asked to wire Singularity Race music: Squid wake music on first player entry, `날 막지마!` on race start, `Tjie She Pen` if the race continues, and leave `Drowning` unused for a later map version.
Changed: Promoted three user-provided MP3s under `assets/restored/audio/singularity-race/bgm/`, registered their manifest ids, registered the existing narration PNGs in the restored asset manifest, and added local client-side race audio wiring in `singularity-race.html`. The player page now creates hidden audio elements, unlocks playback from real user gestures, queues one-time personal entry music, starts the primary race BGM when the gate opens or server racing snapshots arrive, and advances to looping extended BGM after the primary track ends. A mild Web Audio delay/wet path is attempted after playback starts for a stadium/broadcast feel, with normal playback as fallback.
Verified: `node tools/smoke-singularity-race-audio.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `node tools/smoke-singularity-race-narration.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `npm run check:singularity-race` passed. Browser verification showed the race page loading three manifest-backed audio elements with correct sources, roles, and no warning/error logs. Browser automation did not prove audible playback because media playback still depends on a real user activation, so human should click/tap once in the app and listen.
Blocked: No blocker in code/static checks. Audible playback may still be blocked until a real browser click/tap/key gesture, which is expected browser policy.
Next: Hand-listen once from a normal player entry and once from an admin-started race to tune volume/reverb if it feels too loud, too dry, or too echo-heavy.
Do not: Wire `Drowning (Drowning)` into this map version or move these feature-owned race tracks into the generic OST button.

Date: 2026-05-31
Observed: User accepted the narration/browser verification and said to move on if no bugs remained.
Changed: Added `tools/smoke-singularity-race-01-ready.cjs` and `npm run check:singularity-race`, a short Singularity Race-only readiness gate that runs the core 0.1 checks without waiting for the entire project `npm run check`.
Verified: `npm run check:singularity-race`, `node --check tools/smoke-singularity-race-01-ready.cjs`, and `git diff --check -- tools/smoke-singularity-race-01-ready.cjs package.json` passed with only existing LF/CRLF warnings.
Blocked: None.
Next: Use `npm run check:singularity-race` as the quick gate before handoff, commit, or the next game slice.
Do not: Treat this quick gate as a replacement for the full project check before a final release or broad commit.

Date: 2026-05-31
Observed: User asked to finish the next Singularity Race slice while fixing bugs, specifically the admin-observer-triggered pre-race narration using four chroma-key character frames and typewriter Korean dialogue.
Changed: Added transparent narration assets under `assets/singularity-race/narration/`, added a room-scoped `narration_start` control command with its own storage key so start/close commands are not overwritten, and added an observer-panel `나레이션 시작` button. The race page now shows a right-side PC / centered mobile narration overlay with rise, wave, talk, and blink frames, one-character-at-a-time Korean copy, and automatic hide. The admin observer link also now initializes as spectator observer shell state even when connected observer auto-join is unstable, and initial render errors no longer prevent event listener registration.
Verified: `node tools/smoke-singularity-race-narration.cjs`, `node tools/smoke-singularity-race-admin-observer.cjs`, `node tools/smoke-singularity-race-room-close.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, and targeted `git diff --check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&adminObserver=1&roomId=room:singularity-race:dev-003` showed the observer panel visible, options click working, `나레이션 시작` producing the transparent character overlay, the first sentence typing progressively, the wave/talk/blink frames changing, the second item-instruction sentence showing, auto-hide after the timeline, and zero warning/error logs.
Blocked: Full `npm run check` was not rerun because the user asked to keep long tests short.
Next: Human can judge the exact character size/placement during a busy 30-50 runner scene; if it blocks the road too much, adjust only `.race-narration` responsive placement.
Do not: Store narration commands in the main race-control key or let observer narration become gameplay authority.

Date: 2026-05-31
Observed: User asked to remove the large `1/2/3` checkpoint text and marker lines from the Singularity Race course view, and to move the late item boxes out of a curved/corner section into a clean one-line road-width placement.
Changed: `singularity-race.html` no longer renders `trail-save-line` or `trail-save-label` SVG nodes on the track. The third item-box row in `src/restored/games/singularity-race-item-contract.js` moved from progress `78` to progress `90`, a straight late-course road segment, while preserving the five lane offsets across the road width.
Verified: `node tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser reload showed `saveLineCount: 0`, `saveLabelCount: 0`, 15 item boxes, final-row item boxes sharing one `left` value with five distinct `top` values across the road width, and zero browser error logs.
Blocked: None in targeted validation.
Next: Human can visually confirm the end-section item line from the observer camera; if it still feels too close to the finish, move only that final progress row slightly earlier on the same straight.
Do not: Reintroduce large checkpoint marker labels/lines on the live race surface.

Date: 2026-05-31
Observed: User approved continuing the admin-room plan after the full room-close slice, specifically the dev-only admin observer/free-camera entry, then asked for a first in-game observer operations panel.
Changed: The admin page now exposes `옵저버 참석`, which opens `singularity-race.html` with `adminObserver=1` for the selected dev room and is disabled when the room is closed. The player page now auto-joins that link as a spectator, marks `state.adminObserverMode`, hides normal player controls through spectator mode, sets a wider `66%` camera zoom, and moves a wall-agnostic free camera with WASD plus faster Shift movement without writing to player movement, item, attack, or ranking state. Observer mode also shows a draggable/collapsible right-side operations panel for countdown start, test-bot count/apply/clear, room close, camera mode (`자유 카메라`, `1등 따라가기`, `특정 플레이어 따라가기`), follow target select, zoom reset, and room/player/spectator/open-state status.
Verified: `node --check tools/smoke-singularity-race-admin-observer.cjs`, `node tools/smoke-singularity-race-admin-observer.cjs`, `node tools/smoke-singularity-race-room-close.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `node tools/smoke-singularity-race-bot-control.cjs` passed. Browser verification showed admin `방 종료` and enabled `옵저버 참석` on `singularity-race-admin.html?devOnline=1`; the observer player link loaded race screen with `shell is-spectator is-admin-observer`, hidden player controls, `66%` zoom, the side panel visible, start/close/50-bot/camera/follow/zoom/status controls present, room status `열림`, players `30`, spectators `1`, collapse toggling from `접기` to `열기`, drag moving the panel from top-right to an arbitrary position, and zero browser error logs.
Blocked: Full `npm run check` was not rerun because the user asked to avoid long tests; the new observer smoke was added to the full check chain.
Next: Hand-test the actual admin observer view during a running 30-50 runner rehearsal, then decide whether observer zoom/speed should be exposed as admin settings.
Do not: Let the admin observer consume a player slot, collide with road walls, send movement/attack/item packets, or become a public-player feature before real server roles exist.

Date: 2026-05-31
Observed: User approved the admin-room operation plan: first make `방 종료` fully end a Singularity Race room so active players can leave and later joins are blocked, then handle admin observer/free-camera as a separate slice.
Changed: Dev room registry now has `closeRestoredMarathonDevRoom()`, closed dev rooms map to abandoned adapter rooms, and joins return explicit `room_closed`. The host page's room action is now `방 종료`, marks the selected room closed, clears packet relay, keeps the selected closed room record, broadcasts a `room_closed` control command, and clears test bots without erasing the close command. The player page listens for that command, freezes/disconnects the active session, blocks movement/attack/skill/chat-entry joins through `state.roomClosed`, shows a closed-room panel with `나가기`, and keeps closed rooms disabled on refresh.
Verified: `node --check` for the changed modules passed. `node tools/smoke-singularity-race-room-close.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, and `node tools/smoke-singularity-race-server-load.cjs` passed. Browser verification showed the admin button text `방 종료`, player closed-room panel/exit DOM present, and no browser warning/error logs.
Blocked: Full `npm run check` was not rerun because the user asked to keep long tests short; the new smoke was added to the check chain for the next full gate.
Next: Implement the second slice: admin observer/free camera as a separate participant mode that does not consume runner slots, ignores walls/items/ranking, and uses a wider/faster camera.
Do not: Delete closed room markers immediately or clear the room-close control command before connected clients and reloads can see that the room is unavailable.

Date: 2026-05-31
Observed: User asked for the next mobile HUD pass: move the chat panel to the very upper-left, put the chat input button at the top-right, make attack larger/lower, make sprint a larger circular button, and support stronger two-finger zoom feel.
Changed: Mobile race layout now places the read-only chat log at the top-left, moves the chat input button to the far top-right, shifts the settings gear beside it, makes attack an 86px lower-right primary circle, keeps skill as a smaller upper-right support button, and turns sprint into a 78px circular button above the joystick. Camera zoom range widened from `0.72-1.65` to `0.58-1.9` while preserving the existing two-finger pinch handlers on the track.
Verified: `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser verification at `390x844` showed the chat panel at `10,10` with width `252`, chat button at top-right `50x50`, gear beside it, attack `86x86` at lower-right, skill `66x66` above it, sprint `78x78` circular above the joystick, minimap/standings hidden, and zero warning/error logs.
Blocked: Two-finger pinch could not be physically multi-touch simulated by the browser automation, so it is guarded by the existing touch handler path and zoom-range smoke checks.
Next: Human should pinch on a phone once to judge whether `0.58-1.9` feels too wide or just right.
Do not: Let mobile controls drift back into the center of the playfield or restore panel ranking/minimap on mobile.

Date: 2026-05-31
Observed: User approved the mobile readability A-plan: mobile should not be a compressed PC HUD, and should hide minimap/panel ranking while showing rank over runner heads.
Changed: Mobile race CSS now hides the minimap and the left panel standings. Runner avatars now include a `runner-rank-badge`, updated from the throttled race ranking cache, and the badge is shown only on mobile so PC keeps the compact panel ranking. The mobile gear button returns to the upper-right after the minimap is removed.
Verified: `node --check src/restored/games/singularity-race-runner-view.js`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser verification at a `390x844` mobile viewport showed `minimapDisplay: none`, `standingsDisplay: none`, player rank badge `1위` with `display: grid`, gear top `12px`, and zero warning/error logs.
Blocked: None in targeted validation.
Next: Continue the mobile pass with the separate read-only chat placement/toggle if the head-rank HUD feels good.
Do not: Reintroduce minimap or panel-style standings on mobile race view.

Date: 2026-05-31
Observed: User noted the live ranking panel was being clipped and asked whether HP/progress should be removed for a simpler ranking view.
Changed: Simplified race ranking rows to rank badge plus runner name only, with the local row still marked as `나`. The race overlay now caps visible desktop standings at five rows, reducing panel width/height so it does not cut off or cover too much road.
Verified: `node --check src/restored/games/singularity-race-runner-view.js`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser reload showed `rowCount: 1` in the current solo room, first rank `1위`, first text `Codex · 나`, no HP/progress text, `260px` panel width, and zero warning/error logs.
Blocked: None in targeted validation.
Next: In a multi-runner hand test, confirm whether five desktop rows feels right; if it still feels busy, reduce desktop to four too.
Do not: Re-add HP/progress details to the in-race ranking overlay unless it moves to a result/detail panel.

Date: 2026-05-31
Observed: User asked for race chat readability: the send/input row should appear only after pressing `T` or explicitly clicking chat, instead of always occupying the lower-left overlay.
Changed: Race chat now keeps the message log visible while hiding the input/send row until the `race-chat-composing` state is opened by `T`, the mobile/chat action, or clicking the message log. `Escape`, empty blur, successful race submit, full chat hide, and screen exits close only the composer/input state without destroying the chat log unless the settings hide action is used.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser reload showed initial `formDisplay: none`, `T` changed focus to `chat-input` with `formDisplay: grid`, `Escape` hid the form again, clicking `#messages` reopened it, and warning/error logs stayed at zero.
Blocked: Browser text entry through the automation clipboard failed, so submit-hides-composer was covered by code path/static guards rather than a typed browser send in this pass.
Next: Human can hand-test one real chat send; the expected behavior is that the input row folds away after sending.
Do not: Keep the race chat input/send row permanently visible over the lower-left map.

Date: 2026-05-31
Observed: User asked for the Singularity Race live ranking to read more directly and to remove the `LIVE RANK` label, while keeping the race chat lower-left with its scrollbar on the left.
Changed: Race standings rows now expose a rank badge (`1위`, `2위`, etc.) through the shared runner-view helper, highlight top ranks and the local player, and no longer render the `LIVE RANK` pseudo heading. Race chat keeps the transparent lower-left layout with a left-side scrollbar and compact backed message bubbles.
Verified: `node --check src/restored/games/singularity-race-runner-view.js` and `node tools/smoke-singularity-race-render-budget.cjs` passed. Browser reload on the current race URL showed `screen: race`, standings display `grid`, first row `1위`, no standings pseudo heading, chat message container direction `rtl`, queue/chat close/open buttons hidden, and zero warning/error logs.
Blocked: None in targeted validation.
Next: Human can visually judge the exact rank-card opacity and row count during a busier 30-50 runner scene.
Do not: Reintroduce a developer-style ranking header or redraw chat/profile UI from the hot movement frame loop.

Date: 2026-05-31
Observed: User chose the race UI A-plan: move chat to the lower-left, put live ranking where chat used to be, make chat visually transparent so it does not cover the map, remove the standalone queue button, and move chat hide/show into the settings menu instead of an on-panel X.
Changed: Race screen standings now render as a throttled live-ranking overlay in the upper-left. Race chat moved to the lower-left with transparent panel chrome and dark text backing on individual messages. The standalone queue button, chat close X, and chat reopen button are hidden on the race screen; options now toggle `채팅 숨기기/채팅 보이기` and `대기열 보기/대기열 닫기`.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, and `git diff --check -- singularity-race.html tools/smoke-singularity-race-render-budget.cjs` passed with only existing LF/CRLF warnings. Browser reload showed live standings at upper-left, chat at lower-left, queue button/chat X/chat-open button all `display:none`, options chat text `채팅 숨기기`, options queue text `대기열 보기`, and zero warning/error logs.
Blocked: None in automated/browser layout validation. Human should still judge exact chat opacity against busy combat scenes.
Next: Human can test a 30-50 runner scene and adjust ranking row count/opacity if it blocks too much map information.
Do not: Bring back standalone queue/chat-close controls over the race surface unless the settings menu becomes inaccessible.

Date: 2026-05-31
Observed: User clarified Singularity Race should support free positioning, dodging, attacking, and player-vs-player competition inside the road, so W/S/A/D should feel screen-space consistent instead of being strongly forced to follow the dashed centerline.
Changed: Reworked `resolveSingularityRaceTrackMovement()` to preserve raw screen-input projection into progress/lane axes and removed the cardinal uphill assist that forced W/S toward the road centerline on diagonal/uphill segments. Raised lane movement from `86/112px/s` to `122/160px/s` so W/S lane movement matches normal/sprint forward pixel speed. Updated local prediction, server-owned input defaults, and movement smoke guards to treat this as fixed-camera free movement.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `git diff --check -- singularity-race.html src/restored/games/singularity-race-movement-vector.js src/restored/games/singularity-race-prediction.js src/restored/online/marathon-server-state-contract.js tools/smoke-singularity-race-progression.cjs tools/check-restored-marathon-contract.cjs` passed with only existing LF/CRLF warnings. Browser reload on the current race link showed the race world loaded, the local avatar idle, and zero warning/error logs.
Blocked: Automated checks can verify the new speed contract, but the final hand feel still depends on the human testing one uphill/diagonal corridor with Shift and attack positioning.
Next: Human should test W/S/A/D in one horizontal lane, one vertical climb, and one diagonal/uphill turn. If accepted, keep the free-movement model and move on to ranking/queue UI polish.
Do not: Reintroduce centerline-follow assist that makes W/S feel slower or less screen-space during combat positioning.

Date: 2026-05-31
Observed: User clarified the remaining Singularity Race motion bug was not attack movement coming back, but one WASD tap leaving the local runner's movement animation feeling repeated even after movement was no longer intended.
Changed: Added an explicit local run-animation stop path. Movement keyup now clears the player motion cache as soon as all movement keys are released, Shift keyup does the same when no movement key is held, virtual movement/sprint release uses the same stop path, and basic attack still cancels held movement through that shared path before its one-shot visual resolves. Local player run animation no longer keeps the 180ms post-move grace tail; that smoothing remains only for non-player runners. Reworked the stale-key guard so focused Shift+movement holds are not auto-released, and key-repeat events no longer refresh movement freshness after the first keydown.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, and `git diff --check -- singularity-race.html tools/smoke-singularity-race-render-budget.cjs docs/ai-working-state.md` passed with only existing LF/CRLF warnings. Browser probe on `t=no-jump-repeat-guard` showed KeyW tap and Shift tap returning to `runner-avatar is-player is-idle`, `imgAnimation: none`, foot-shadow animation `none`, and a stable local avatar rect after release.
Blocked: Full `npm run check` was not rerun because this was a narrow input/visual fix and the human asked to avoid long testing.
Next: Revisit WASD uphill speed feel separately: current road-axis projection is mechanically valid for racing, but fixed-camera arcade feel likely needs pixel-normalized forward speed so upward road travel feels closer to side travel.
Do not: Let released/stale movement keys, key-repeat freshness, focused held-key stale release, or post-move grace keep local `is-running` alive through cached runner motion.

Date: 2026-05-31
Observed: User clarified the green focus ring should be removed entirely and reported the local character was still jumping/running in place after the ring pulse fix.
Changed: Removed the focus ring from the race effect layer, left `.player-focus-ring` hidden if legacy markup ever appears, and tightened local run animation so it requires fresh player movement input instead of merely server/prediction position changes. Added stale-key release in the hot loop and ignored orphan repeat keydown events so a missed keyup cannot restart `is-running` after reload.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, and browser verification on `t=no-jump-repeat-guard` passed. Browser probe showed `focusCount: 0`, `runner-avatar is-player is-idle`, `imgAnimation: none`, foot-shadow animation `none`, stable avatar/image rects over 850ms, and zero warning/error logs.
Blocked: Full `npm run check` was not rerun for this narrow visual/input fix because the human recently asked to avoid long testing.
Next: Return to the planned race UI layout decision: remove the visible queue button into settings, then choose a live-ranking placement that does not collide with chat/minimap/mobile controls.
Do not: Let local `is-running` depend only on server/camera/prediction movement, or bring back the green focus ring.

Date: 2026-05-31
Observed: User reported the local Singularity Race character still looked like it was moving in place while standing still.
Changed: Browser inspection showed the runner node was already idle with `imgAnimation: none` and a stable avatar rect, but the green `player-focus-ring` was continuously running `focus-pulse` and scaling around the character. Removed the focus-ring pulse and made the player marker static, then added a render-budget smoke guard so `focus-pulse` cannot return.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, and `git diff --check` passed with only existing LF/CRLF warnings. Browser verification on `t=static-idle-ring` showed `runner-avatar is-player is-idle`, avatar/image/before/focus animations all `none`, and the avatar/image/focus rects unchanged across 1.4 seconds with zero warning/error logs.
Blocked: Full `npm run check` was not rerun for this narrow idle-visual fix because the human recently asked to avoid long testing.
Next: Human should visually confirm the current race screen. If it still feels active, the remaining motion is likely a non-player effect such as item roulette, chat pop, countdown, or another runner rather than the local idle avatar.
Do not: Reintroduce pulsing/scaling idle player position markers.

Date: 2026-05-31
Observed: User asked for a final Singularity Race chat polish pass: white runner speech bubbles/name labels, closable chat, a visible reopen button, a light chat background/open button, and no intrusive MISS cue on failed attacks.
Changed: Updated the race chat overlay so it can close/reopen with compact buttons, kept the chat panel and reopen button on a white/light surface, made runner speech bubbles and nameplates white, and removed failed-attack MISS cue/system spam from the play surface. Updated the marathon guard so the new compact chat open/close controls are allowed while the old large chat-toggle panel remains blocked.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, and `git diff --check` passed with only existing LF/CRLF warnings. Browser verification on `t=chat-polish-white` showed race screen chat panel background `rgba(255,255,255,0.94)`, runner bubble/nameplate white, close button hides the chat, `채팅 열기` appears as a white button, reopening focuses `chat-input`, and there were zero warning/error logs.
Blocked: Full `npm run check` was not rerun for this narrow UI pass because the human asked to avoid long testing.
Next: Human can visually confirm the chat overlay on the current race link. If accepted, continue with the next 0.1 polish/bug slice.
Do not: Reintroduce the intrusive MISS cue or the old large race chat-toggle panel.

Date: 2026-05-31
Observed: User reported two visible post-final-check regressions in Singularity Race: dark shadow-like road geometry protruding outside the course and the local runner continuing to show run animation while not actually moving.
Changed: Removed the heavy SVG drop-shadow filters from the race road/rail surface, reduced the side-wall shadow width, and changed wall stroke caps/joins to butt/bevel so wall corners do not spill into big dark blobs. Runner motion now turns on the run cycle only when the runner actually changes visual position, progress, or lane offset, instead of keeping it alive from recent key input while blocked.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-camera.cjs`, and `node tools/smoke-singularity-race-progression.cjs` passed. Browser verification on `t=shadow-run-fix` showed road/rail/wall filters as `none`, wall shadow `52px` with `butt/bevel`, idle runner animation `none`, `0,0` drift over 700ms, 15 item boxes, and zero warning/error logs.
Blocked: None in quick validation. Full `npm run check` was intentionally skipped because the user asked to stop long testing.
Next: Human should visually confirm the same camera spot and try one short held-key movement. If accepted, keep this as the post-final visual fix.
Do not: Reintroduce thick road drop-shadows or key-input-only running animation during blocked movement.

Date: 2026-05-31
Observed: Final Singularity Race verification needed to cover the new 0.1 play links plus the user's last concern that 50 online runners, ping/budget behavior, and post-finish spectating should not regress the game after the road/item/animation polish pass.
Changed: Raised the Singularity Race runner cap to 50 through the marathon contract, player page, admin page, dev room registry, and bot-control command path. Added a 50-runner large-room netcode profile with 20Hz server tick, 16Hz input, 5Hz server snapshots, and compact runner deltas. The player page now uses that profile for connected dev rooms and exposes a post-finish watch button that hides the result panel while keeping input disabled so finishers can spectate the remaining race. Admin room settings now preserve the 50-runner cap and the bot input allows 50.
Verified: `node tools/check-restored-marathon-contract.cjs`, Singularity Race bot/progression/camera/render-budget/mobile/items/combat/server-load smokes, `git diff --check`, and full `npm run check` passed. The server-load smoke ran 50 server-owned runners with 114 snapshots, `serverEgressKbps: 1928`, bounded packet log 1200, and no rejected valid inputs. Browser verification on the player link showed `선수 0/50`, race screen, 15 item boxes, minimap, result watch/restart buttons, 5Hz/16Hz budget rows, and zero warning/error logs; admin verification showed bot max `50`, host start/add/clear bot controls, camera SVG, and zero warning/error logs.
Blocked: None in automated or browser validation. Real 50-client public multiplayer still requires an actual backend provider; this remains a dev/server-mock rehearsal.
Next: Give the player/admin links and let the human do one hand-play pass from the provided URLs.
Do not: Treat local/dev room finalization as public reward or ranking authority, or raise snapshot cadence for 50 runners without a new load budget.

Date: 2026-05-31
Observed: User reported that the Singularity Race road exterior still looked strange in the browser: adjacent maze rows and the old green-gray rail made the road boundary read like broad horizontal stripes instead of a clear wall/road/outside split.
Changed: Reworked the race-road visual layer in `singularity-race.html` without changing track coordinates, collision, item placement, or pacing. The road now uses a darker asphalt surface, a narrower dark shoulder (`560px` outline instead of the old `660px` green rail), quieter grass/grid background, and two generated concrete wall paths per side rendered as shadow/body/top-highlight layers. The minimap rail/road colors now match the darker road language, and `tools/check-restored-marathon-contract.cjs` guards the new wall-shadow/highlight tokens.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-camera.cjs`, and `node tools/smoke-singularity-race-progression.cjs` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=road-visual-redesign` showed a `4600x3600` world, `560px` outline, `468px` road, concrete wall shadow/body/highlight layers (`96px/70px/18px`), 15 item boxes, and zero warning/error logs.
Blocked: None in automated validation. Human visual approval is still needed because this is an art/readability pass.
Next: Run the full project check, then have the human compare the same straight corridor against the screenshot that looked wrong.
Do not: Re-expand the road shoulder to the old broad green rail unless the route spacing is redesigned too.

Date: 2026-05-31
Observed: Final bug pass found that the new movement-trace item pickup protection lived only inside `singularity-race.html`, so the smoke test could only check for tokens instead of proving the crossing math.
Changed: Moved item pickup trace creation and box-range math into `src/restored/games/singularity-race-item-contract.js` via `createSingularityRaceItemPickupTrace()` and `isSingularityRaceItemBoxInPickupRange()`. The game page now calls those contract helpers, and the item smoke test asserts that a fast 16.4% -> 20% movement segment still collects the 18% center item box while lane-miss and stale-trace cases remain blocked.
Verified: `node --check src/restored/games/singularity-race-item-contract.js`, `node tools/smoke-singularity-race-items.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, Singularity Race progression/camera/render-budget/mobile/combat/server-load smokes, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=final-bug-pass` showed race screen, `4600x3600` world, 15 visible `50x50` item boxes, wall/minimap nodes, and zero warning/error logs.
Blocked: None in automated or browser layout validation. Final hand feel still belongs to the human play pass.
Next: Human can run the first item row and one curve. If accepted, this closes the current bug-fix slice.
Do not: Move item pickup math back into page-only code without contract coverage.

Date: 2026-05-31
Observed: User asked to continue catching bugs after the item-size/song-length pass. The remaining likely item bug was a frame-skip pass-through case: collection checked only the player's current point, so a fast prediction/correction frame could cross a box radius without ending inside it.
Changed: Added a short `itemPickupTrace` to `singularity-race.html`. Local and connected player movement now remember the previous and next progress/lane point each frame, and item collection checks the current point plus the normalized movement segment against the box pickup radius. This preserves the visible `50x50` boxes and current pickup radius while covering brief frame skips, booster movement, and connected prediction corrections.
Verified: `node tools/smoke-singularity-race-items.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, Singularity Race progression/camera/render-budget/mobile/combat/server-load smokes, `git diff --check`, and full `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=item-pickup-trace` showed race screen, `4600px x 3600px` world, 15 visible `50px x 50px` item boxes, two wall paths, minimap rail/road/player nodes, and zero warning/error logs.
Blocked: Browser automation can verify layout and logs, but sustained held-key feel still needs human play.
Next: Human should run through the first item row. If a box still appears to be missed, inspect the player's lane offset at that moment rather than shrinking the map further.
Do not: Return to single-point-only item pickup.

Date: 2026-05-31
Observed: User reported that item boxes were too small and could be passed through, overall speed felt a little too fast, and the Singularity Race map should be rebalanced around the roughly 2:30 song length rather than the previous 5-9 minute long-maze target.
Changed: Compactified the active Singularity Race course to a `4600x3600` song-length maze world, retuned local/connected prediction speeds to `0.58%/s` run and `0.76%/s` sprint with calmer `86px/s` lane and `112px/s` sprint-lane movement, enlarged item boxes to `50x50`, and widened item pickup detection to `1.45` progress / `112px` lane radius. Updated progression, item, server-state, and marathon contract guards plus the Singularity Race plan to lock the new timing and pickup contract.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, Singularity Race progression/items/camera/render-budget/mobile/combat/server-state/server-load smokes, `git diff --check`, and full `npm run check` passed. Progression smoke now reports normal completion at 165 seconds and constant sprint at 126 seconds. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=song-balance-verify` showed race screen, `4600px x 3600px` world, 15 visible `50px x 50px` item boxes, two wall paths, minimap rail/road/player nodes, item roulette host, and zero browser console logs.
Blocked: Automated checks and browser layout validation are green. Real held-key play is still the only way to judge final hand feel against the music.
Next: Have the human try one real run through the first item row and one curve. If the feel is accepted, treat the current race/map/item slice as ready for the next 0.1 task.
Do not: Return to the 5-9 minute pacing target unless the music/runtime plan changes again, or shrink item pickup radius back below the visible box footprint.

Date: 2026-05-31
Observed: User reported that after attacking, the runner did not return cleanly to idle and the attack motion looked like it kept repeating. They also wanted hit targets to read as stunned instead of grabbed or collision-locked.
Changed: Made idle runners explicitly hold `animation: none`, kept attack and stun states from sharing run/sprint/collision animation classes, shortened the basic attack lunge into a one-shot low forward swipe, added an `attackVisualId` plus cleanup render so attack visuals clear back to idle, and made stunned targets use a separate blue shake animation. Basic attack target updates now replace the runner state in `state.runners` instead of mutating possibly frozen runner objects, fixing a 30-runner browser page error during attack.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `git diff --check`, and full `npm run check` passed. Browser verification on a 30-runner pack showed the attacker as `is-idle is-attacking` with `runner-attack-lunge` and `runner-attack-swipe`, the hit bot as `is-idle is-stunned` with `runner-stun-shake`, then the attacker returned to `is-idle` with `animationName=none` and no console errors.
Blocked: None for automated validation. Human feel can still tune the attack art timing if the swipe should be stronger or softer.
Next: Hand-test one attack in the visible in-app browser. If accepted, continue to the next 0.1 polish item.
Do not: Let attack/stun states stack with run or collision animations, or mutate frozen runner objects during combat.

Date: 2026-05-31
Observed: User reported three related feel bugs after item work: the local runner appeared to move in place while idle, curves still felt unnatural/jittery, and running with AI packs caused frame/position stutter. Code review found three likely causes: the default sprite image used a perpetual idle breathing animation, normal pack movement applied pairwise soft-collision impulses every frame, and trail tangent/normal vectors still snapped at sampled curve segments.
Changed: Removed the default idle breathing animation from runner sprites so standing still is visually still unless an input/event animation is active. Normal `pack` movement no longer calls `resolveSingleRailCollisions()` every frame, the local player no longer receives soft-pass visual side offsets, and AI pack pressure no longer directly slows the local player. Existing runner DOM nodes are updated in place instead of re-appended every hot render frame, and soft collision push constants were reduced for discrete attack/skill contact. Updated `marathon-trail-geometry.js` to compute tangent/normal from a small forward/backward distance sample, smoothing lane normals and movement projection through curves. Added render-budget smoke guards so idle breathing, per-frame pack collision, per-frame runner DOM re-append, and local-player AI pressure do not return.
Verified: Targeted checks passed: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, Singularity Race progression/camera/render-budget/items/mobile/combat/server-state/server-load smokes, `git diff --check`, and full `npm run check`. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=jitter-final-idle` showed idle player `animationName=none`, `isIdle=true`, `isRunning=false`, 15 item boxes, no console logs, and `0,0` pixel drift over 1.2 seconds. A 30-runner pack probe on `t=jitter-final-pack-mcp` showed the player stayed idle with `animation=none`, no console logs, and `0,0` pixel drift over 1.2 seconds while 30 runner nodes were present.
Blocked: Automated checks can prove idle stability and remove the worst collision jitter path, but only human held-key play can judge whether every curve now feels natural enough.
Next: Have the human test one real curve section with 30 runners. If a specific curve still shudders, tune route control points or tangent sample distance, not camera rotation or AI body pressure.
Do not: Reintroduce constant idle sprite motion, per-frame physical pack collision, direct local-player AI pressure, or per-frame runner DOM re-append for normal running.

Date: 2026-05-31
Observed: User asked for a Mario Kart-style item pickup reveal and then requested final bug verification. The previous item slice granted the item immediately, which worked but did not give enough visual feedback when a box was collected.
Changed: Added a bottom-center item roulette overlay to `singularity-race.html`. Item boxes now start a short rolling reveal before the selected item enters the one-item slot; the mobile skill button shows a rolling state while disabled, and the overlay moves upward on mobile so it does not cover the joystick or action buttons. Updated the Singularity Race plan and item smoke guard for the roulette path.
Verified: `node tools/smoke-singularity-race-items.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, Singularity Race progression/mobile/camera/render-budget/combat/server-load smokes, `git diff --check`, and `npm run check` passed. Browser reload on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=item-roulette-clean` showed the race screen, 15 item boxes, 2 trail-wall paths, the roulette host element, the item skill button in empty-slot state, and no browser logs. A browser layout probe confirmed the roulette overlay does not overlap the desktop minimap and, at `390x844`, sits at `left 76/right 314/top 536/bottom 618` while the joystick is `top 706/bottom 822` and action buttons are `top 622/bottom 822`.
Blocked: None.
Next: Verify pickup roulette, mobile placement, and full project checks.
Do not: Add more item types before the three-item 0.1 loop is hand-tested.

Date: 2026-05-31
Observed: User approved adding the first simple Singularity Race item layer and asked that mobile use the existing skill button for it. The existing checkpoint D-to-S reward skill contract still needs to remain intact, so the new slice should be a race item slot rather than a replacement for server reward skills.
Changed: Added `src/restored/games/singularity-race-item-contract.js` with three 0.1 items, three rows of five item boxes, one-slot collection rules, and safe booster timing. Wired `singularity-race.html` so race item boxes render on the track, players collect one item at a time, `E` and the mobile skill button use the current item, Booster speeds the local/connected prediction briefly, Banana drops a short trap, and Stun Shot targets a nearby runner. Local bot simulation now honors short item slow windows. Added `tools/smoke-singularity-race-items.cjs` and wired it into `npm run check`.
Verified: `node --check src/restored/games/singularity-race-item-contract.js`, `node --check tools/smoke-singularity-race-items.cjs`, `node tools/smoke-singularity-race-items.cjs`, targeted Singularity Race camera/progression/mobile/render-budget/combat/server-load checks, `git diff --check`, and `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=items-001` showed race screen, 15 item boxes, 2 trail-wall paths, mobile skill button DOM text for the item slot, and empty browser logs.
Blocked: None so far. Connected public authority for items is intentionally not implemented; this is a 0.1 local/dev-play item layer.
Next: Human play should try picking up one box and using Booster/Banana/Stun Shot in a real run. If accepted, move on to the next 0.1 feature slice without expanding the item set.
Do not: Remove the older D-to-S checkpoint reward skill contract while introducing race item boxes.

Date: 2026-05-31
Observed: User reported that `W/S` still felt slow while climbing after the asymmetric maze update. Code review showed the remaining issue was not a missing uphill mapping, but exact vector projection on diagonal uphill connectors: pure `W` could advance at only about 0.58-0.82 strength and still leak lateral force toward the wall.
Changed: Added a narrow cardinal uphill assist in `src/restored/games/singularity-race-movement-vector.js`. Pure vertical `W/S` input on upward/diagonal road segments now keeps at least `0.92` forward strength and reduces lateral drift, while near-horizontal side-only input and pure vertical `A/D` lane behavior remain unchanged. Updated the marathon plan with this movement-feel rule.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=uphill-assist` showed a `9200px x 6800px` race world, local minimap viewBox `23.01 58 42 42`, two wall paths, fixed camera counter-rotation `0rad`, and no console errors.
Blocked: None for automated validation. Human play can still report a specific bad segment if the new assist does not feel strong enough in hand.
Next: Treat this as the final movement-feel fix before the next feature slice unless human play still reports a specific bad segment.
Do not: Increase global run/sprint speed just to fix uphill feel, because that would break the 5-9 minute long-race pacing target.

Date: 2026-05-31
Observed: User liked the previous maze direction but reported that the newly lengthened course felt too static after it became a stacked corridor grid.
Changed: Replaced the long stacked-corridor default with a longer asymmetric maze route that keeps the extended race world and local-follow minimap, but adds staggered endpoints, diagonal connectors, and a mid-course chicane so the course reads less like repeated horizontal rows. Updated movement validation to find an actual uphill trail sample before asserting that `W` advances progress, so future route edits are not tied to one hardcoded progress percent.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `npm run check` passed. Progression smoke still reports normal completion at 503 seconds and constant sprint at 309 seconds. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=dynamic-maze-redesign` showed a `9200px x 6800px` race world, local minimap viewBox `10.47 58 42 42`, two wall paths, fixed camera counter-rotation `0rad`, and no console errors.
Blocked: Manual held-key play is still required to judge whether the asymmetric maze feels fun enough, but the automated code/UI gates are green.
Next: Have the human test one real run. If the route still reads too static, tune only the control points or build the separated track editor; do not reopen camera rotation or movement-axis changes.
Do not: Return to the purely stacked-grid course unless the asymmetric maze introduces a specific wall or control regression.

Date: 2026-05-31
Observed: User approved extending the maze race further and asked for a course that can exceed the visible minimap, with a target playtime of at least five minutes and ideally five to nine minutes.
Changed: Extended the active Singularity Race map into a longer stacked-corridor maze, increased the race world from `9200x3600` to `9200x6800`, and kept a single authoritative progress path for server/ranking safety. The race minimap now follows the player with a local `42x42` viewBox so the road continues outside the minimap frame while the map-preview surface still shows the whole route. Long-race pacing now uses `0.19%/s` normal, `0.31%/s` sprint, `105px/s` lateral, and `145px/s` sprint lateral.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, and `node tools/smoke-singularity-race-server-load.cjs` passed. Progression smoke reports normal completion at 503 seconds and constant sprint at 309 seconds. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=long-maze-redesign` showed a `9200px x 6800px` race world, local minimap viewBox `11.82 58 42 42`, full map viewBox `0 0 100 100`, two wall paths, fixed camera counter-rotation `0rad`, and no console errors.
Blocked: Full `npm run check` still needs to be rerun after the long-maze timing and minimap changes. Manual held-key play is still required to confirm the longer race feels fun rather than merely longer.
Next: Run full `npm run check`, then have the human test one real run. If accepted, keep this as the 0.1 default long maze and build the track editor around this stacked-corridor model later.
Do not: Physically split the progress path into disconnected roads until item/teleport/branch contracts exist.

Date: 2026-05-31
Observed: User rejected the overly round/smooth race feel and asked for a more interesting maze-style map that can later support item placement and disconnected-looking route sections. The current engine still needs one authoritative progress path, so fully broken physical road segments would require a separate teleport/branch/item contract.
Changed: Redesigned the active Singularity Race route again as a segmented corridor maze: long straight chunks, softened right-angle switchbacks, a lower start straight, mid-course maze passages, a long vertical upper climb, and a short upper finish. Updated the smoothing helper from full Catmull-Rom-style curve sampling to straight-preserving rounded-corner sampling so the course reads like corridor pieces rather than a round circuit. Kept fixed camera, gray side walls, screen-space movement projection, and the movement-axis deadband.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=maze-redesign` showed the race screen, 92 centerline segments, two side-wall paths, fixed camera counter-rotation `0rad`, rail `660px`, road `468px`, wall `58px`, and no console errors.
Blocked: Manual held-key PC play is still required to judge whether the maze turns feel fun rather than merely valid.
Next: Have the human test the maze course. If accepted, keep this as the 0.1 default and build the separated track editor later around this segmented-corridor model.
Do not: Physically break the progress path into disconnected roads yet, or merge race-track editing into the Baegeum/Dice world editor before the segmented course is accepted.

Date: 2026-05-31
Observed: User play feedback and geometry inspection showed the Singularity Race route itself was the remaining root problem: the old right-angle maze had 12 hard 90-degree direction snaps, so lane normals flipped at corners and made uphill/edge play feel like jitter or outward bouncing even after screen-space WASD projection.
Changed: Replaced the active route with a broad smoothed race course generated from control points, split smoothing into `src/restored/games/marathon-trail-smoothing.js`, kept fixed camera as the normal mode, added generated gray side-wall SVG paths on both road edges, and added a small movement-axis deadband so side-only input does not leak into progress on near-horizontal segments. Updated progression/server smokes and marathon docs for the smoothed course and explicit wall paths.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-001&t=road-redesign` showed race screen render, fixed camera counter-rotation `0rad`, two wall paths (`trail-wall-left/right`) with gray `58px` stroke, wider rail `660px`, road surface `468px`, and no console errors.
Blocked: Browser automation still cannot replace a real held-key PC/mobile feel pass, especially for long continuous uphill movement.
Next: Have the human run one real PC race on the redesigned course. If it feels acceptable, move to the separated Singularity Race track editor; if it still feels bad, tune only the new route control points, side-wall offset, or lane clamp in a small follow-up.
Do not: Merge this into the Baegeum/Dice world editor yet, reintroduce the old right-angle maze course, or re-enable rotating camera while checking the redesigned road feel.

Date: 2026-05-31
Observed: User play feedback showed the current Singularity Race course still felt nearly undrivable: uphill segments did not respond naturally to `W`, road boundaries were hard to read, and dev-online/server movement could still reinterpret input using the old progress/lane axes.
Changed: Added `src/restored/games/singularity-race-movement-vector.js` so client prediction, local race movement, and server-owned movement all project the screen-space WASD vector onto the current trail tangent/normal. On upward track segments `W` now advances progress while `D/A` become lateral lane movement. Dev-server bot/load inputs now steer along the active trail tangent instead of sending fixed `{x:1}` input. The visible road rail is darker and wider, and boundary contact now reports a `경계` cue/message instead of only looking like body collision.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `node tools/smoke-singularity-race-combat-full-race.cjs` passed. Browser reload on the current `singularity-race.html?devOnline=1&roomId=room:singularity-race:dev-001&t=feel-verify-2` showed the movement-vector module loaded, dark rail `660px`, pale road `468px`, race entry still opens, and no console errors.
Blocked: Full held-key human feel is still required; browser automation could not synthesize sustained keydown after the patch.
Next: Run full `npm run check`, then do a real PC feel pass. If the course is still unpleasant after projection, build the separated Singularity Race track editor next instead of merging into the city map editor.
Do not: Start the track editor before this screen-space movement projection is verified by a real play pass, or merge race-track editing into the Baegeum/Dice world editor contract yet.

Date: 2026-05-31
Observed: After committing and pushing the completed Singularity Race 0.1 stabilization patch, the user approved making Singularity Race the main project entry while keeping Baegeum City and Dice City as preserved sub modes.
Changed: Replaced the root `index.html` redirect with a lightweight launcher that marks `data-primary-mode="singularity-race"`, puts `특이점레이스 시작` first, keeps the dev host entry visible, and leaves `baegeum-city-v2-dice.html`, dice-city, editor, and skin lab links as sub mode/tool entries. Added `tools/smoke-index-entry.cjs` to guard the new root entry and wired it into `npm run check`. Updated current-entry docs from `index.html -> baegeum-city-v2-dice.html` to the singularity-race-first launcher.
Verified: `node tools/smoke-index-entry.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html?codex=launcher` showed `h1=특이점레이스`, `data-primary-mode=singularity-race`, primary link `./singularity-race.html`, the city hub sub-mode link, no `window.location.replace`, and zero console errors. Clicking the primary link opened `http://127.0.0.1:4173/singularity-race.html` with title `특이점레이스 로비` and zero console errors.
Blocked: None.
Next: Verify and commit this launcher slice separately, then continue Singularity Race 0.1 final entry/play loop work.
Do not: Delete Baegeum City, Dice City, casino, city-core, or editor surfaces while making Singularity Race the main mode.

Date: 2026-05-31
Observed: Singularity Race automatic gates were green and the user asked to move on if no further fix was needed. The work queue's next safe map-editor slice was construction UX, specifically placement-only building shell name/color editing.
Changed: Added a world editor building-shell edit panel for selected `building_shell` obstacles. The panel writes `shellName` and `shellColor` only, renders those visual fields as a lightweight overlay, and keeps size editing separate from venue metadata. Updated the build-palette/editor-entry smokes and docs so building shells still do not gain doors, channels, interiors, economy, game type, venue id, or online room id fields.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/smoke-editor-entry.cjs`, and `node tools/check-size.cjs` passed. Browser verification on `http://127.0.0.1:4173/editor.html` confirmed an existing building shell opens the name/color panel, the color swatches activate, and no venue-owned field is exposed by the panel path. Text-entry automation was limited by the Browser virtual clipboard, but the pure helper/draft smoke covers `shellName` persistence.
Blocked: None for the code path. A human can still do the final manual name typing check directly in the editor because automated typing into the in-app browser input was blocked by the browser tool.
Next: Continue with venue metadata editing only as a separate `venue_anchor` slice, or visually tune baegeum/dice shell frontage without converting shells into enterable venues.
Do not: Store doors, channels, interiors, economy, game type, venue id, or online room id on `building_shell` objects.

Date: 2026-05-31
Observed: After the movement-axis tuning, the user asked to do the final wrap and move on if complete. The automatic gate was already green, so the next feasible check was whether mobile controls actually move the player rather than only rendering correctly.
Changed: No gameplay code changed in this pass. Verified the current race page and mobile joystick input path in the in-app browser.
Verified: `git diff --check` and `npm run check` passed. Browser reload on the current race URL showed 30 runners, player runner, minimap, hidden result panel, no console errors, `rotate(0rad)`, and `--track-counter-rotation: 0rad`. In a `390x844` mobile viewport, dragging the joystick right changed the player `left` from `22.32%` to `22.3928%`, then dragging up changed `top` from `91%` to `90.8333%`, with console error count 0.
Blocked: None for automated finalization. Human held-key PC/mobile feel is still the only remaining subjective acceptance gate.
Next: Treat Singularity Race 0.1 automatic validation as passed. If the human accepts the feel, move to the next feature slice outside movement/camera; if not, tune only the `150/210px/s` lane speed pair.
Do not: Reopen camera rotation, change the WASD axis contract, or add new race mechanics before the human feel pass.

Date: 2026-05-31
Observed: The user approved fixing the WASD feel hypothesis after code review confirmed `A/D` drives trail `progress` and `W/S` drives `laneOffsetPx`, with the old lane speeds reading much slower in pixel space than forward progress on the fixed camera.
Changed: Increased active lane movement from `74/88px/s` to `150/210px/s`, aligned the connected prediction defaults and dev server lane handling to the same normal/sprint lane speeds, and added a progression smoke guard that compares lane speed against progress-axis pixel speed across multiple route samples.
Verified: Browser reload of the current race URL showed 30 runners, the player runner, minimap, no console errors, hidden result panel, `rotate(0rad)`, and `--track-counter-rotation: 0rad`. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Automated browser controls still cannot replace a real held-key feel pass, so the exact comfort of `150/210px/s` needs one human PC/mobile run.
Next: Manually test fixed-camera race movement around lane edges and turns. If `W/S` now feels too sensitive, tune only the lane speed pair in a small follow-up.
Do not: Change the `A/D = progress`, `W/S = laneOffsetPx` contract or re-enable camera rotation while checking this movement-feel pass.

Date: 2026-05-31
Observed: The user asked for a final verification pass and to move on if no issues were found. The current race URL was already on `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-002`.
Changed: No gameplay code changed in this pass. Verified the current race surface again on desktop and mobile-sized browser viewports after the fixed-camera guard.
Verified: Browser reload on the current desktop race page showed 30 runners, a player runner, minimap, no console errors, `rotate(0rad)`, and `--track-counter-rotation: 0rad`. Mobile viewport `390x844` showed chat, minimap, queue button, gear button, joystick, sprint, attack, skill, and chat buttons visible; opening the gear panel kept it on-screen with no console errors and fixed camera rotation still at 0. `git diff --check` and `npm run check` passed.
Blocked: Automated browser control still cannot replace a real held-key 3-run PC feel pass, but the automatic code/UI gates are green.
Next: Treat the automatic final gate as passed and move to the next human-facing step: one real PC run and one mobile run for feel confirmation, or start the next feature slice if the human accepts the current feel.
Do not: Reopen camera rotation work unless fixed-camera play exposes a specific remaining problem.

Date: 2026-05-31
Observed: The user asked whether Singularity Race should auto-flip, weakly rotate, or keep the camera fully fixed while uphill/curve movement and wall-edge feel are still being stabilized. Rechecking the code showed normal play was already using `fixed`, not the older `soft-follow` default, so the safest 0.1 decision is to keep camera rotation off and guard against accidental reactivation.
Changed: Kept the normal race camera fixed, capped optional `soft-follow`/`road-follow` rotation to 35 degrees, and strengthened `tools/smoke-singularity-race-camera.cjs` so it verifies the default camera mode is fixed, default rotation stays zero across curve/finish progress, optional rotation stays mild, and `singularity-race.html` does not opt into rotating modes. Updated the marathon plan camera note with the 35-degree experiment cap.
Verified: Browser reload of `singularity-race.html?devOnline=1&adminLaunch=1&roomId=room:singularity-race:dev-002` confirmed the race track transform contains `rotate(0rad)`, `--track-counter-rotation` is `0rad`, and console error count is 0. `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-restored-marathon-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None for the camera guard. Manual PC 3-run and mobile 1-run feel checks are still separate playtest gates.
Next: Keep camera rotation off while checking remaining wall/edge movement feel; only revisit weak `soft-follow` after fixed-camera PC movement feels stable.
Do not: Add 90/180-degree auto-flip camera behavior or re-enable rotating default camera before the movement/collision pass is accepted.

Date: 2026-05-31
Observed: Stage 2 browser play verification used the current in-app browser plus a same-tab admin flow. The host page created a 30-runner bot pack and start command, the player direct-launch race screen loaded without console errors, the gate disappeared after countdown, and repeated Shift+D input moved the player through multiple course segments. Full automated finish remained inefficient because the browser API sends short key taps rather than a sustained held sprint.
Changed: Strengthened `tools/smoke-singularity-race-progression.cjs` so the result restart guard now checks that connected preview session, action state, and stale runner motion are cleared before re-entry.
Verified: Browser admin/player flow had no console errors during room start, countdown, and extended player movement. `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-restored-marathon-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Automated browser control did not complete a whole manual-feel race because it cannot hold Shift+D continuously like a human. A human/manual browser pass is still the best final judgment for PC 3-run feel.
Next: If the player reports no wall/edge sticking after manual play, treat Singularity Race 0.1 as close enough and move to mobile one-run verification. If sticking remains, tune only lane/forward/collision constants in one small slice.
Do not: Treat the in-app tap-loop as equivalent to a real held-key playtest, or add more race mechanics before manual PC feel is confirmed.

Date: 2026-05-31
Observed: Continued the staged Singularity Race 0.1 hardening after the user approved splitting risky work into small bug-fix steps. Browser lobby and room entry were error-free, but the road-boundary motion guard was still inline-only and the result panel lacked an explicit return/restart loop.
Changed: Extracted the road-boundary held-key movement guard to `src/restored/games/singularity-race-runner-motion.js` with pure validation cases for finish/start/lane edges, wired the HTML through that helper, documented it, and added a `다시 대기` result button that clears current race/action/session preview state before returning to lobby/queue. The progression smoke now guards result restart tokens.
Verified: Browser reload of the current `singularity-race.html?devOnline=1&roomId=room:singularity-race:dev-001` had no console errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Full PC 3-run and mobile 1-run manual completion are still not done inside the in-app browser. The next risky work should wait for actual play feel feedback.
Next: Play one real PC race from room start through finish and press `다시 대기`; only tune lane/forward speed or collision constants if road-edge sticking still feels wrong.
Do not: Bundle camera rotation, mobile joystick tuning, and speed/collision constant changes into the same slice.

Date: 2026-05-31
Observed: Rechecked the Singularity Race feel hypothesis. The priority order is still correct: PC WASD and road-edge/sticking feel first, then camera, animation polish, mobile, and finish/restart checks. The smallest confirmed gap was that player running state could still be driven by held input even when the runner had no visible movement at a road/lane boundary.
Changed: Updated the race runner motion gate so the local player only keeps the run cycle from actual visible movement or from a still-possible movement direction. Added a marathon contract token guard for the new boundary-motion helper.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `git diff --check`, browser reload of `singularity-race.html?devOnline=1&roomId=room:singularity-race:dev-001` with no console errors, and `npm run check` passed.
Blocked: Browser host/player dual-tab play was limited by the in-app browser session keeping a single active tab, so the 3-run manual completion pass still needs a real interactive browser pass.
Next: Continue with the next small feel slice: direct PC play pass for road-edge/lane clamp, then tune actual lane/forward speed only if the new no-movement animation guard is not enough.
Do not: Treat held keys alone as proof the runner is moving at road boundaries, or jump to camera/mobile tuning before PC boundary feel is confirmed.

Date: 2026-05-31
Observed: Work prep found the existing Singularity Race working tree had shifted the player track world size to the shared `RESTORED_MARATHON_WORLD_WIDTH` import, while the marathon contract check still expected the old inline `TRACK_WORLD_WIDTH = 9200` token in `singularity-race.html`.
Changed: Updated `tools/check-restored-marathon-contract.cjs` to guard the imported shared width constant instead of the removed inline literal.
Verified: `node tools/check-restored-marathon-contract.cjs` and `npm run check` passed.
Blocked: None for workspace preparation. Browser play verification was not run because this was only a check-guard prep fix.
Next: Continue from the existing Singularity Race worktree or run a browser play check on `singularity-race.html` / `singularity-race-admin.html` before further race-feel tuning.
Do not: Reintroduce player/admin world-size drift or duplicate the marathon world size as an unrelated inline literal.

Date: 2026-05-28
Observed: Runner sprites still felt too static while moving because all skins shared one small run-cycle rhythm.
Changed: Added lightweight per-skin run-style tagging in `singularity-race-runner-view.js` and CSS run animations for stride, quick, bounce/hop, robot, glide, and heavy movement. This keeps the existing static skin assets but makes robots step mechanically, meme runners bounce, and smoother human skins glide/lean while running.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `node tools/smoke-singularity-race-render-budget.cjs` passed. Browser automation opened the race screen and confirmed the selected Kaguya runner had `data-run-style="glide"` and used the `runner-run-glide` animation while moving.
Blocked: This is still CSS motion, not true multi-frame sprite animation. Final character-specific frame sheets can replace or extend these run styles later.
Next: Keep this as the cheap running-feel layer while playtesting; only add real frame sheets for favorite skins once final art direction is stable.
Do not: Add large per-character animation assets or per-frame DOM overlays before the core route and online movement are stable.

Date: 2026-05-28
Observed: In the redesigned Singularity Race route, lateral lane movement felt too fast compared with forward progress, and chat did not surface immediately above the runner when a player talked.
Changed: Slowed `W/S` lane movement, increased forward run/sprint feel, aligned the server sprint pace with the new client sprint prediction, and added local runner-head chat bubbles with capped text plus cooldown/burst guards for chat spam. The runner DOM helper now owns the chat bubble span so track rendering reuses existing avatar nodes instead of creating extra overlay rows.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed. Browser automation created a dev room, opened the race screen, submitted chat, confirmed the runner bubble displayed a 42-character clipped message, and confirmed rapid follow-up chat was blocked with the input left intact.
Blocked: None for this movement/chat-feel slice.
Next: Continue playtesting the new course with real start/turn segments and tune the forward/lane speed again only after live feel feedback.
Do not: Let side-lane movement become faster than forward racing, or put chat bubble rendering into a separate per-frame DOM overlay.

Date: 2026-05-28
Observed: The current Singularity Race course had become a mostly straight/log-curve run, and the first maze replacement still felt too arbitrary compared with the human's new draft.
Changed: Replaced the single active trail geometry with the draft-shaped stadium route: lower long straight start, folded right-side maze corridors, upper long finish straight, and three save/reward stages. The player/admin/full-map renderers draw the finish marker from the active geometry instead of a hardcoded old finish line. The default race camera is fixed/non-rotating, with soft/road-follow rotation kept only as optional guarded modes.
Verified: `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `git diff --check`, and `npm.cmd run check` passed. Browser automation confirmed the admin map and player race screen render the draft-shaped path with three save labels and `rotate(0rad)`.
Blocked: None for this map redesign slice.
Next: Tune route pacing, start-pack spacing, and later gravity/event zones only after live play confirms the new draft-shaped course feels fun.
Do not: Re-enable default camera rotation on the maze course or add multiple map choices before the single redesigned map feels good.

Date: 2026-05-28
Observed: Bug review found that `adminLaunch=1` could still show the race surface without any created dev room, the player page always preferred the first dev room instead of the host-selected room link, and dev chat/control storage still had global keys that could leak across room delete/recreate loops.
Changed: Gated direct race launch behind an actually open dev room, added `roomId` to admin game links and player room selection, ordered the dev adapter around the requested room, moved race-control and test-bot commands to room-scoped storage keys, split room-scoped chat storage into `marathon-dev-chat-storage.js`, and cleared room packets/chat/control keys when a dev room is created or deleted.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed. The marathon contract check now guards the no-room/direct-room launch tokens and room-scoped chat/control helpers. Browser verification confirmed no-room `adminLaunch=1` now stays on profile with no track visible, admin room links include the selected `roomId`, direct launch joins `room:singularity-race:dev-102` when requested, and chat no longer writes the global `singularity-race:chat:v1` key.
Blocked: This is still local dev-room rehearsal. Public online still needs server-owned room creation, host auth, room-scoped chat history, and server-side start commands.
Next: Continue toward the real online bridge by making server-owned room creation/host auth replace the local dev room registry, or add a browser smoke for the room create/delete/link flow if UI regressions continue.
Do not: Let `adminLaunch=1` bypass room existence, let the player page silently join the first room when a room link is provided, or store active room commands/chat in global dev keys.

Date: 2026-05-28
Observed: Singularity Race dev online still exposed a default room whenever `?devOnline=1` was open, which made the admin page look like a room already existed and could also reuse stale room packets after a delete/recreate loop.
Changed: Added a local dev room registry, made the dev adapter accept an explicit room list, changed the admin page so rooms start empty until the host creates one, added room create/settings/delete dialogs, disabled start/direct-game actions without an active room, and made new/deleted rooms clear their room-scoped packet relay.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `git diff --check` passed. Browser verification confirmed admin starts with no room, `방 만들기` opens a popup and creates an empty room, settings can rename/change spectator capacity, delete removes the room and packet rows, the player lobby blocks entry while no room exists, and the player lobby enables entry once a registry room exists.
Blocked: This is still local dev-room rehearsal; public online still needs server-owned room creation, host auth, and persistent room settings.
Next: Continue simplifying host UI around actual operator tasks and move real room creation behind the future WebSocket/Firebase server transport.
Do not: Reintroduce an automatically visible dev room on `?devOnline=1` or let stale room packets repopulate a newly created room.

Date: 2026-05-28
Observed: The current three-stage Singularity Race course still read too short, especially the first horizontal start and the final vertical climb, and the race camera had no player-controlled zoom.
Changed: Kept the three save/reward stages but stretched the log-curve geometry, expanded the player/admin track world to `9200x3600`, made the road gray with a darker yellow dashed center line, and added race-camera zoom with a `100%` default, mouse-wheel zoom on PC, mobile pinch zoom, and an options reset button.
Verified: `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, and `node tools/check-size.cjs` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=long-map-default-zoom-check` confirmed the race screen uses a `9200px x 3600px` world, starts at `100%` zoom, still shows only save markers `1,2,3`, mouse wheel zooms the camera, the reset returns to `100%`, and simulated mobile pinch zoom reaches `150%`.
Blocked: None for the long-map and camera-zoom pass.
Next: Continue playtesting the longer curve to tune actual race pacing; the final public duration should still be server-owned balance, not this visual world size alone.
Do not: Reintroduce five save points or make the race camera default to a non-100% zoom.

Date: 2026-05-28
Observed: Browser playtest showed the runner could stand at the start gate, but after GO the connected preview could still pull the runner backward because local prediction reconciled against an old lobby snapshot, and the dev server loop froze modern 2026 epoch milliseconds at an old 1e12 ms clamp.
Changed: Connected race start now pins server reconciliation targets to the current paddock positions and publishes an immediate racing snapshot. The server loop and ping sampler now accept modern epoch millisecond timestamps, and server sprint speed is aligned with the current client Shift sprint prediction for the 900m dev course.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-restored-marathon-contract.cjs`, and `node tools/smoke-singularity-race-server-load.cjs` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=sprint-clock-sync-browser-3` confirmed the start seed stayed at 7.12%, server snapshots advanced after GO, and Shift sprint no longer rubber-banded backward on release.
Blocked: None for this start/reconciliation fix.
Next: Run the remaining full check gate and continue live playtesting for long-course camera/skill/combat feel.
Do not: Let connected prediction reconcile against stale lobby snapshots or reintroduce clock clamps below current epoch milliseconds.

Date: 2026-05-28
Observed: The Singularity Race start gate still felt like it had an invisible buffer before the race opened, and the gate disappeared instantly at GO instead of reading like a physical starting barrier.
Changed: Reduced the pre-start paddock clearance to let runners stand nearly flush with the visible gate, added `gateOpenedAtMs` and a short gate open progress window, and changed the start gate node/CSS so it slides and rotates open briefly before leaving the track. The progression smoke now guards the close-gate clearance and visible open animation.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-size.cjs` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=gate-open-check` confirmed the runner can move close to the gate and the gate enters `is-opening` with slide/rotation values before disappearing.
Blocked: None for this gate-feel pass.
Next: Continue tuning live start feel only after manual playtest confirms the gate timing is readable with 30 runners crowding the line.
Do not: Reintroduce a wide invisible pre-start wall or remove the gate instantly on GO.

Date: 2026-05-28
Observed: The D-to-S checkpoint reward loop now grants temporary E skills, but a future corrupted server participant state could still pair a low reward grade with a stronger skill id unless the skill contract guarded that pairing directly.
Changed: Added a reward-grade skill-pool validator, made `createRestoredMarathonSkillUse()` reject grade/skill mismatches, added server skill-state validation for mismatched rewards, and documented that the server skill boundary rejects D-grade state trying to fire S-grade skills.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed.
Blocked: Final D-to-S reward skin art and live balance tuning are still placeholders.
Next: Tune D/C/B/A/S skill pool balance and later replace placeholder reward skins with final checkpoint reward art.
Do not: Allow a server-held reward grade and skill id to drift apart, or let client-supplied skill ids decide public-online skill authority.

Date: 2026-05-28
Observed: Singularity Race had D-to-S checkpoint reward visuals, but the skill contract still allowed character identity to imply an E skill path. That did not match the intended loop where the base/profile skin has no skill and checkpoint rewards temporarily replace the active skill.
Changed: Locked base/profile E use behind a no-reward state, split reward-grade rolling into `src/restored/games/marathon-reward-grade.js`, made checkpoint reward grade choose the active skill pool and charge state, added reward grade propagation through local action packets and server checkpoint/snapshot state, and disabled the mobile skill button until a current reward skill exists.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed. A headless Chrome playthrough confirmed the race screen starts with the skill button disabled as `스킬보상 필요`, then after sprinting past the first checkpoint it becomes enabled as a D-to-S reward skill (`스킬C급 무제한` in that run).
Blocked: Final D-to-S reward skin art and final skill balance values are still placeholders.
Next: Balance the D/C/B/A/S skill pools and replace placeholder reward skins with final art when assets are ready.
Do not: Let the profile skin, character id alone, or a client-supplied skill id become public-online authority for reward skills.

Date: 2026-05-28
Observed: Checkpoint rewards now rolled a placeholder D-to-S skin grade, but the reward was still mostly a cue/HUD value; without final skin art it did not visibly feel like the runner had received anything.
Changed: Added a temporary runner reward visual state. When the player reaches a checkpoint, the awarded placeholder skin id/label/grade is copied onto the runner with an expiry time, and the race renderer shows a grade-colored aura plus D/C/B/A/S badge on the avatar for a short confirmation window.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed. Browser automation with the local race surface reached the first checkpoint and confirmed the player avatar had `is-reward-skin is-reward-grade-c`, `data-reward-grade="C"`, and the checkpoint cue showed the matching placeholder reward.
Blocked: Final D-to-S skin illustrations are still not connected; this remains a temporary visual badge/aura.
Next: Replace the temporary grade aura with real D-to-S reward skin art when assets arrive, and separately review connected-mode held-input cadence before calling dev-online movement final.
Do not: Treat the temporary grade aura as permanent profile skin ownership or server-authoritative public reward state.

Date: 2026-05-28
Observed: The three-stage Singularity Race reward loop could assign character/skill rewards, but checkpoint arrival did not yet guarantee a visible D-to-S skin-grade result while final reward skin assets are still missing.
Changed: Added a separate placeholder skin reward roll to the checkpoint reward contract. Each checkpoint reward now carries `placeholderSkin` with `D/C/B/A/S` grade, label, swatch, and placeholder asset status. The player race cue now shows the placeholder grade card near the runner on checkpoint arrival, and checkpoint reward packets carry placeholder skin id/label/grade for future server transport use.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm.cmd run check` passed. The full-race smoke observed placeholder skin grades `A/B/C/D/S` during a 30-runner run, and browser snapshot verification confirmed the race page still renders the three-save-point course.
Blocked: No final D-to-S checkpoint skin illustrations are connected yet; this is a visible placeholder grade reward only.
Next: Replace placeholder skins with real grade-specific skin assets once the final character illustrations are provided.
Do not: Tie placeholder skin grade to profile skin choice or make it authoritative client state in real online mode.

Date: 2026-05-28
Observed: The Singularity Race checkpoint reward loop still used five save/reward points, which made D-to-S character rerolls happen too often on the long marathon course.
Changed: Reduced the current race loop to three save/reward stages at 28%, 58%, and 88%. The trail geometry, standalone race course meters, server checkpoint reward stage count, local action checkpoint rewards, contract checks, full-race combat smoke, and marathon plan now agree on the three-stage loop. The reward grade ramp is now stage 1 low D/C, stage 2 A-capable, and stage 3 S-capable.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser snapshot verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=three-stage-loop-check` showed the trail labelled only `1`, `2`, and `3`.
Blocked: None.
Next: Tune the distance/reward feel through a real playtest before changing the stage count again.
Do not: Reintroduce five visible save/reward points in the current Singularity Race course unless the full course pacing is retuned.

Date: 2026-05-28
Observed: A `stale-command-check` player URL correctly opened the profile flow and existing smoke checks passed, but the player page's generic start-command listener did not force the command's `roomId` to match the current dev room before accepting a fresh countdown command.
Changed: Scoped initial and broadcast-applied Singularity Race start commands to `DEV_ROOM_ID`, added control-contract assertions for mismatched room rejection, and extended the progression smoke so future room-control changes cannot accept another room's host start command.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&resetProfile=1&t=stale-command-check` confirmed a wrong-room start command does not enter race, and a correct-room command still cannot skip nickname/skin profile setup.
Blocked: None.
Next: Re-run the targeted Singularity Race checks, full `npm run check`, and browser-recheck the stale-command URL.
Do not: Accept host start commands without a matching room id, even in dev-only localStorage/BroadcastChannel rehearsal mode.

Date: 2026-05-28
Observed: The Singularity Race race-screen controls were still mixing PC keyboard labels with mobile controls. Mobile showed visible WASD buttons, the chat and play-status buttons duplicated state that should not be on the race surface, and the chat panel opened as a bottom overlay instead of staying available like the Drawing World chat reference.
Changed: Reworked `singularity-race.html` race UI so chat stays open as a compact top-left overlay, the queue button sits below it without overlap, the old chat-toggle and play-status buttons are removed, the minimap is larger, and a top-right gear options button is present. PC now hides the circular mobile controls. Mobile now uses a text-free dragged circular joystick, a separate hold-to-run `달리기` button, and bottom attack/skill/chat input buttons. Updated the marathon plan and contract guard to reject the old visible WASD/chat-toggle/status controls. Added `tools/smoke-singularity-race-mobile-race-ui.cjs` to keep that PC/mobile split in `npm run check`.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-mobile-race-ui.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser verification opened `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=mobile-ui-pass-2`; desktop showed no mobile circular controls, mobile showed no visible WASD buttons, chat/minimap/queue did not overlap, the old buttons were absent, and joystick drag moved/released the thumb correctly.
Blocked: This is still a DOM/CSS joystick mapped to keyboard-style input. A later mobile feel pass should tune joystick thresholds after hand testing on a real phone.
Next: Keep PC keyboard/mouse and mobile touch controls visually separate; do not bring PC key labels back into the mobile control surface.
Do not: Reintroduce visible `W/A/S/D` mobile buttons, `채팅창 열기/닫기`, or the play-status button on the race screen.

Date: 2026-05-28
Observed: The Singularity Race skin list still rendered `kaguya`, `robot`, and `gpichan` through the race-only SVG placeholder renderer, so those three did not match their original PEPEANT/-drawing-world skins.
Changed: Updated `src/skins/singularity-race-skin-presets.js` so `kaguya`, `robot`, and `gpichan` resolve through the Drawing World preset adapter (`src/skins/drawing-world-adapter.js`) and the vendored Drawing World source (`vendor/drawing-world/public/src/ui/skin-presets.js`). Race-only meme skins still use the lightweight SVG renderer, and the restored marathon contract check now guards the adapter path.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&resetProfile=1&t=skin-originals` passed. Browser inspection confirmed those three skin cards now use `data:image/png` from the Drawing World canvas preset, while race-only skins remain SVG.
Blocked: None for this skin correction.
Next: Keep future original Drawing World skins flowing through the adapter instead of hand-redrawing them in the race file.
Do not: Recreate Drawing World original skins as race-only placeholder SVGs.

Date: 2026-05-28
Observed: The Singularity Race host/admin page had become too explanation-heavy for actual operation. It repeated room/camera/status descriptions, showed hidden implementation wording such as detailed room state labels, showed lane numbers in the runner list, and let system chat spam such as gate/attack/skill notices dominate the visible chat.
Changed: Simplified `singularity-race-admin.html` into a compact host surface: shorter top actions, `방 관리`, spectator capacity, start/bot controls, whole-map camera, runner count, compact runner rows without lane numbers, and a single visible room chat. The page now filters system messages out of the visible host chat while keeping the underlying channel transport intact, removes the leftover hidden current-room/camera-target/race-state cards, and the marathon contract check guards the simplified admin tokens.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check` on the touched files, and `npm.cmd run check` passed. Browser verification opened `http://127.0.0.1:4173/singularity-race-admin.html?devOnline=1` and confirmed the visible page now shows the compact host controls, whole-map camera, empty runner state, and quiet chat without system spam.
Blocked: The page is still an HTML-local host shell, not a final authenticated online admin console.
Next: Keep future host controls grouped by operator task, not by internal packet/channel/debug concepts.
Do not: Reintroduce visible system spam, lane/debug rows, hidden status-card leftovers, or long explanatory copy on the host page.

Date: 2026-05-28
Observed: The Singularity Race admin whole-map camera was not reflecting the in-game map correctly. The SVG trail used a centered `preserveAspectRatio="meet"` viewBox while runner markers were absolutely positioned as full-frame percentages, and admin runner lane offsets were stored as ad-hoc percent units instead of the in-game `laneOffsetPx` world-space value.
Changed: Updated `singularity-race-admin.html` so the host camera uses `preserveAspectRatio="none"` and shares the same full-frame 0-100 coordinate space for track and runners. Admin runner placement now carries `laneOffsetPx`, clamps it to the same road lane width as the player page, and converts it through `progressToRestoredMarathonMapPoint()` in `src/restored/games/marathon-trail-geometry.js` using the `7600 x 2600` track-world ratio before drawing markers. The restored marathon check now guards those admin camera tokens, and the marathon plan records the host camera guard.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check` on the touched files, and `npm.cmd run check` passed. Browser verification opened `http://127.0.0.1:4173/singularity-race-admin.html?devOnline=1` and confirmed the whole-map camera renders as a full-frame course instead of the old centered/letterboxed trail.
Blocked: This is still a simplified whole-map admin view, not a full reuse of the player track DOM/camera module.
Next: If more admin-map drift appears, keep extending the shared geometry helper instead of adding page-local camera math.
Do not: Reintroduce a centered SVG letterbox or page-local runner map conversion while positioning runner markers against the full camera frame.

Date: 2026-05-28
Observed: The Simulacra World shell guard existed, but there was still no visible way to inspect it without importing modules manually. That would make the next migration harder to review and could tempt future UI work to bypass the shell guard.
Changed: Added `simulacra-world.html`, a small responsive diagnostic surface that reads only `createSimulacraWorldShellSnapshot()` and `createSimulacraWorldGameLaunch()`. It shows registered derived games, common modules, and keeps only Singularity Race launchable while Drawing World and Iron Line stay locked.
Verified: `node tools/check-simulacra-world-engine-contract.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser verification opened `http://127.0.0.1:4173/simulacra-world.html` at desktop and mobile widths with no console errors after adding an inline favicon.
Blocked: This is still a diagnostic page, not the final Simulacra World main menu.
Next: Use this page as the safe visual checkpoint before moving one shared feature, probably profile/skin or chat, out of Singularity Race into a common module.
Do not: Let the page launch candidate/reference games, or use it as permission to rewrite Singularity Race wholesale.

Date: 2026-05-28
Observed: The Simulacra World branch had a plan and registry contract, but no small runtime-readable shell boundary yet. Without that, the next UI step could start reading the raw registry directly and blur candidate/reference game rules.
Changed: Added `src/restored/engine/simulacra-world-shell.js`, which creates a pure shell snapshot and launch guard from the game-module registry. Only Singularity Race is launchable; Drawing World remains candidate-only and Iron Line remains ops-reference-only. The Simulacra World check now validates the shell snapshot and launch blocking rules.
Verified: `node tools/check-simulacra-world-engine-contract.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed.
Blocked: No visible UI has been added yet; this is still a diagnostic/runtime contract layer only.
Next: Render the shell snapshot in a tiny development surface or main-app diagnostic panel before moving any Singularity Race UI into shared modules.
Do not: Let candidate/reference entries launch, or let UI code consume the raw registry without the shell guard.

Date: 2026-05-28
Observed: The next branch point should not be more Singularity Race features yet. The safer move is to define Simulacra World as a common shell first, then attach derived games through a tiny registry so Drawing World and Iron Line references do not get copied wholesale into the running game.
Changed: Added `docs/plans/simulacra-world-engine.md` and `src/restored/engine/simulacra-world-game-module-contract.js`. The contract fixes common module ids, keeps Singularity Race as the first active derived game, registers Drawing World as the second candidate, and restricts Iron Line to an ops/admin reference. Added `tools/check-simulacra-world-engine-contract.cjs` and wired it into `npm run check`.
Verified: `node tools/check-simulacra-world-engine-contract.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed.
Blocked: No runtime migration has happened yet; this is intentionally only the planning and interface layer.
Next: If this branch holds, expose the registry in a small diagnostic/app shell before moving any Singularity Race UI into common Simulacra World modules.
Do not: Rewrite `singularity-race.html` into a new engine in one pass, or import Drawing World/Iron Line runtime code wholesale.

Date: 2026-05-28
Observed: After connected attack/skill forwarding, the next public-online hole was checkpoint and finish authority: a future client could otherwise fake checkpoint rewards, character/skill assignment, duplicate reward claims, or final ranking if those stayed local-only.
Changed: Added `src/restored/online/marathon-server-race-state.js` for server-owned `checkpoint_claim` and `finish_claim` handling. The dev server now accepts those client claim packets, validates reached checkpoints, rejects duplicate rewards, assigns character/skill rewards with a deterministic server seed, and emits server-owned `race_finalized` envelopes only from server ranking state.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, and `npm.cmd run check` passed.
Blocked: This is still a local WebSocket-shaped rehearsal. Real public rooms still need a deployed backend, authenticated host/admin commands, durable room history, and backend persistence for finalized results.
Next: Keep the next slice on real transport/provider wiring or a browser-level playthrough check once the in-app browser automation is available.
Do not: Trust client-supplied checkpoint rewards, character ids, skill ids, duplicate checkpoint claims, finish times, or final ranking.

Date: 2026-05-28
Observed: The previous Singularity Race review left two online-hardening risks: connected attack/skill packets were still mostly local relay/log traffic from the player page, and host-spawned dev rehearsal bots could collapse into player participants inside the dev server/session layer.
Changed: Connected attack and skill packets now forward through the WebSocket-shaped dev server `ingestClientEnvelope()` boundary and publish a server-owned snapshot after accepted action resolution. Dev test bots now join with `participantType: "bot"` and bot session permissions, while real runners remain player participants and spectators remain read/chat-only.
Verified: `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `node tools/smoke-singularity-race-combat-full-race.cjs` passed.
Blocked: This is still the local dev-server rehearsal, not a real public WebSocket/Firebase backend.
Next: Keep the real online bridge behind the provider/server transport adapter so clients keep sending only input, attack, skill, and chat requests.
Do not: Let test bots count as player sessions, or let connected attack/skill effects be resolved only by client-side relay packets.

Date: 2026-05-28
Observed: Browser review showed Singularity Race key input was accepted, but the pre-start and connected sprint movement deltas were small enough that short holds looked almost frozen. This could be mistaken for the old "cannot move before/after start" bug.
Changed: Increased local staging/run/sprint progress speeds and added progression smoke assertions that staging movement is visibly non-trivial and Shift sprint remains at least twice normal run speed.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-restored-marathon-contract.cjs` passed. Browser verification confirmed `D` moves before the gate opens, `Shift+D` moves after host start, the player enters `is-running/is-sprinting`, the camera transform follows, and no visible `순위` text remains during the active race screen.
Blocked: This is still a feel tune, not a final balance pass. Real full-race pacing should be tuned again once obstacles, skills, and real backend snapshots are active.
Next: Keep movement visibly responsive while preserving server authority; if more tuning is needed, adjust speed constants with browser checks instead of adding UI workarounds.
Do not: Reintroduce a slow connected movement path that makes accepted key input look frozen.

Date: 2026-05-28
Observed: The Singularity Race running screen could still show live rank residue: `updateLocalRankCue()` emitted `순위 #...` cue bubbles on rank changes, and the hidden `race-standings` surface was still periodically rendered during the race hot frame.
Changed: Removed the rank-change cue path, removed live race-standings hot-frame refresh, cleared the standings container instead of rendering ranking rows during running, and updated the render-budget smoke to fail if live ranking rows or rank cue bubbles are reintroduced.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-bot-control.cjs`, and `node tools/check-size.cjs` passed.
Blocked: Browser verification for the player tab was not rerun in this slice; use manual playtest if another visual residue remains.
Next: Keep running UI clean until finish; final ranking should stay in the result panel/server finalization path only.
Do not: Reintroduce live `순위 #...` cue bubbles or in-race ranking rows on the hot movement path.

Date: 2026-05-28
Observed: The Singularity Race dev room still showed 30 runners before anyone joined because old local rehearsal paths were mixed into the real room view: the host page filled an empty snapshot to 30 preview runners, the direct game path created `MAX_RUNNERS` locally, and the dev WebSocket-shaped runtime auto-joined bot participants on connected entry.
Changed: Split test bots from room membership. Fresh player/admin dev rooms now start with no automatic bot pack; connected player entry creates only the joined player. The host page has explicit test-bot add/clear controls, filters stale bot snapshots unless that command is active, and clears the room packet relay when bots are turned off. The player page listens for the host test-bot command and only then rebuilds the dev mock/server snapshot with the requested rehearsal pack. The old player-side debug fill button no longer creates 30 local runners, and `tools/smoke-singularity-race-bot-control.cjs` is now part of `npm run check` so this boundary is guarded.
Verified: `node tools/smoke-singularity-race-bot-control.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check` on the touched files, and `npm.cmd run check` passed. Browser verification on the admin page confirmed 0/30 at first, 30/30 after `테스트 봇 30명 넣기`, and 0/30 after `봇 비우기`.
Blocked: This is still a dev-only localStorage/broadcast rehearsal. Real public online still needs backend-owned room membership and host bot/test controls.
Next: Keep the next online slice on backend-owned room membership and host controls so real players, bots, spectators, and admin commands are all counted by the server instead of localStorage.
Do not: Auto-seed bots as real participants on fresh room open, or count dev preview actors as actual online users.

Date: 2026-05-28
Observed: After server-owned basic attacks, `skill_use` was still only a client/dev packet path. That would let future D~S character skills become client-trusted unless the server owns character id, skill id, charge, cooldown, and effect application.
Changed: Added `marathon-server-skill-state.js` for server-owned skill validation and effects. Marathon participants and snapshots now carry character/skill ids, skill charges, skill cooldown, and last skill sequence. The dev WebSocket-shaped server now applies `skill_use` through server state, validates spectator blocking, stale sequence, cooldown, charge use, action lock, self effects such as checkpoint hop/boost, and nearby disruption targets. The player snapshot merge now preserves server skill fields for future connected UI.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `npm.cmd run check` passed. The full check still shows only the existing `tools/check-restored-life-job-contract.cjs longest function is 102 lines` warning.
Blocked: Checkpoint rewards still assign characters locally in the playable surface; real online still needs server-owned `checkpoint_reward`, `respawn_notice`, and `race_finalized` handlers before public release.
Next: Move checkpoint character assignment and respawn/finalization into server-owned handlers so D~S grades, save points, and rankings cannot be client-forged.
Do not: Trust client-supplied character ids, skill ids, charges, cooldowns, checkpoint rewards, respawn positions, or final ranking data in public online.

Date: 2026-05-28
Observed: Singularity Race basic attack existed on the player surface, but connected/dev server state still accepted `attack_action` packets without owning hit range, stun, damage, or cooldown decisions. That would become client-authoritative if a real transport were plugged in too early.
Changed: Extended marathon participants and server snapshots with HP, stun, slow, action-lock, attack cooldown, last attack sequence, and safe checkpoint fields. Added server-owned `attack_action` handling in `marathon-server-combat-state.js`: the server now computes attacker origin from authoritative progress/lane, validates hit range/arc/cooldown, applies countdown stun without damage, applies racing stun/damage, locks the attacker briefly, rejects cooldown spam, and carries combat state into snapshots. Wired the WebSocket-shaped dev server mock through that attack path and made the player snapshot merge consume server hp/stun fields.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/smoke-singularity-race-server-load.cjs` passed. The 30-runner server-load smoke still finished all runners with 426 snapshots, a bounded 720-packet log, and 85 coalesced duplicate inputs.
Blocked: Real public online still needs an actual backend transport and server-authenticated host/admin identity. Skill effects, checkpoint rewards, collision ordering, final ranking, and reconnect persistence still need backend-owned handlers before public release.
Next: Move `skill_use`, checkpoint reward, respawn, and finish/ranking decisions through the same server-state boundary, then attach the real WebSocket/Firebase provider behind the existing provider adapter.
Do not: Trust client-supplied attack origin, damage, stun duration, cooldown, checkpoint reward, respawn, finish time, or ranking data in public online.

Date: 2026-05-28
Observed: Singularity Race running visuals were smoother, but side-view skins still always faced the same direction and the basic attack path was incomplete for phone play. Mouse attack existed as a local prototype, but start-staging attacks were blocked, mobile had no attack button, and the contract did not explicitly expose cooldown/stun/no-damage staging behavior.
Changed: Added runner facing memory and `--runner-facing-scale` skin flipping, added a mobile/PC `공격` action button that shares the mouse basic-attack path, and extended the combat contract with attack cooldown, stun duration, and zero-damage staging attacks. Basic attack now stalls the attacker, applies cooldown, stuns a nearby target before start without HP loss, and can stun/damage after the race starts. Local bots pause while stunned, and connected snapshot merging preserves local stun visuals while the real server authority remains future work.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser verification confirmed the attack button, pre-start stun cue, cooldown text, no console errors, and A/D facing flip classes.
Blocked: Public online attack authority is still not implemented. Real rooms must validate attack range, cooldown, stun, damage, and hit targets on the backend before players can trust it competitively.
Next: Tune attack range/stun duration manually in a live race if the feel is too weak or too annoying, then move real online attack validation to the backend provider path.
Do not: Let client-side attack/stun/damage become public online authority or remove the attacker's self-stall/cooldown penalty.

Date: 2026-05-28
Observed: The Singularity Race start/reconciliation fixes made connected movement authoritative enough, but the visual layer could still read like ghosting or shuddering because runner DOM positions and the camera world both had browser transitions while the game loop updated at mixed timer/snapshot cadences. Collision feedback also animated the runner container transform, which could fight the track counter-rotation and make sprites look like they were sliding instead of running.
Changed: Moved the local action loop to `requestAnimationFrame`, guarded it so inactive screens do not redraw, removed `left/top` and camera transform transitions from the hot runner/world layers, and added a per-runner motion cache that drives `is-running` and `is-sprinting` classes. Runner movement is now shown by instant position updates plus inner sprite stride/shadow animation, while collision feedback animates only the child sprite. Local player run animation and active prediction correction now use recent real movement input, and hidden-tab changes release movement keys to prevent stuck-key drift.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser inspection confirmed race CSS no longer transitions runner `left/top` or world transform, runner sprites switch to `runner-run-cycle` during movement input, the admin page emits a countdown command, and there were no console errors.
Blocked: The in-app browser automation can tap keys but cannot reliably hold `Shift+D` exactly like a player, so long sustained key-hold feel still needs manual confirmation in the live page.
Next: Use manual playtesting to tune the exact stride speed and camera rotation feel; keep future online work on real server ping/reconciliation rather than UI-side authority.
Do not: Reintroduce CSS `left/top` transitions, world transform easing, or parent-container bump transforms on runner avatars in the active race hot path.

Date: 2026-05-28
Observed: Connected Singularity Race now seeds the server race from the visible paddock position, but the active racing display still depended on 10Hz server snapshots for local player movement. That left a risk of small snapshot corrections reading as tremble or input lag after the gate opened.
Changed: Added `src/restored/games/singularity-race-prediction.js` for client-side local movement prediction plus server reconciliation. The player page now predicts the local runner every connected race frame, while `mergeSingularityServerSnapshotRunners()` preserves the local predicted display, stores authoritative `serverProgress` and `serverLaneOffsetPx`, smooths small server corrections, and snaps only large divergence.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed. Browser verification used the admin countdown into `singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1`, confirmed the gate was visible during countdown, disappeared after `GO`, and the player did not snap backward on release.
Blocked: This is still dev-only connected rehearsal. Public online still needs a real backend transport, server-owned countdown/start state, ping samples from the server, reconnect replay, and authoritative attack/skill/collision/checkpoint/finish handling.
Next: Add a more reliable automated browser key-hold harness for sustained `Shift+D` once the in-app browser input API can hold keys, then keep the real online bridge focused on backend ping/replay/reconciliation.
Do not: Replace server snapshots with client-authoritative position, or let prediction finalize checkpoints, attacks, rankings, or finish results.

Date: 2026-05-28
Observed: After the connected countdown fix, a start-after-GO jitter path remained: the dev server race still started from server default positions while the visible player had already moved inside the local start paddock. That first racing snapshot could pull the player backward or sideways and make the camera look like it was trembling instead of moving forward cleanly.
Changed: `startConnectedDevServerRace()` now sends the current paddock progress and `laneOffsetPx` into the dev server start call. The WebSocket-shaped dev server applies those seeded race positions before switching the room to `racing`. Server participants and snapshots now preserve `laneOffsetPx`, and server input applies `W/S` as road-lane movement without allowing side-only input to advance race progress. The connected hot path now renders every tick while still only applying authoritative snapshots when due.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-size.cjs` passed. Browser verification sent an admin countdown, moved the player during countdown, and confirmed the runner continued from `left 12.45%` before `GO` to `left 12.97%` after `GO` with the gate removed instead of snapping backward; a post-start `S` input also changed lane position.
Blocked: This is still a local dev-server rehearsal. Real public online still needs server-owned countdown phase, initial runner placement, lane movement, reconciliation, and client prediction from the backend transport.
Next: Add a browser-level jitter/performance smoke around start release once a stable automated key-hold path exists; then move connected input prediction/reconciliation out of the page and behind the real provider adapter.
Do not: Start a connected race from default server positions after players have freely positioned in the start paddock.

Date: 2026-05-28
Observed: Singularity Race dev-connected staging could appear frozen before start or enter an already-running state because normal connected entry still landed in queue, connected mode blocked local staging movement, input packets could be published before the gate opened, and stale localStorage start commands could remove the gate from a fresh session.
Changed: Normal connected entries now enter the race staging screen, reset action state, clear stale room relay packets on fresh join, allow local start-paddock movement until the race starts, and block connected movement/skill/attack packets before `raceStarted`. Connected joins now reattach an active host countdown after the join reset, while already-running host commands only sync for a bounded player grace window or the longer spectator late-join window.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-render-budget.cjs`, and `node tools/check-size.cjs` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&resetProfile=1` confirmed fresh connected entry reaches `race` staging with a visible gate, `D` moves the player before start, an old start command no longer removes the gate after the player grace expires, and an admin countdown keeps the gate visible during countdown then removes it on `GO`.
Blocked: This is still dev-only local storage and in-page mock transport. Real public online still needs authenticated server host start, server-owned room phase, durable room snapshots, and late-player-to-spectator conversion from the backend.
Next: Keep the next online slice on server-owned room phase/reconciliation so the UI no longer has to infer countdown/running state from a localStorage command.
Do not: Let old client-side race-control commands, pre-start input packets, or local connected positions become public online authority.

Date: 2026-05-28
Observed: The backup branch point was clean: local `main`, `origin/main`, and `backup-v3/main` all pointed at `d45746b` before the next Singularity Race online slice.
Changed: Added reconnect-grace handling to `src/restored/online/marathon-server-provider-adapter.js`. A reconnect now creates a resume `hello`, blocks runner input while replay is pending, requires server-owned chat history before a fresh `state_snapshot`, captures the runner's authoritative snapshot row, and unlocks input only after that server snapshot. Wired the WebSocket dev server validation through the same reconnect path.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check` on touched files, and `npm.cmd run check` passed.
Blocked: This still does not open public online or persist reconnect tokens on a real backend. WebSocket/Firebase still needs a server process/provider, auth/session storage, durable chat history, and reconnect token persistence.
Next: Run the restored marathon contract checks, then attach the real provider implementation behind this adapter boundary rather than letting UI code talk directly to a socket SDK.
Do not: Accept movement, skill, attack, checkpoint, or finish packets from a reconnecting client before the server replay and authoritative snapshot have completed.

Date: 2026-05-28
Observed: The next Singularity Race online slice needed a real-provider flow boundary before attaching any WebSocket/Firebase SDK, so the client cannot hand-roll join/history/snapshot handling per provider.
Changed: Added `src/restored/online/marathon-server-provider-adapter.js` as a pure state machine for `hello -> hello_result -> join_request -> join_result -> chat_history -> state_snapshot`, requiring server-origin replay and server-owned snapshots. Wired the WebSocket dev server validation through that provider flow and changed dev `hello_result` envelopes to come from `server:ws-dev` with `targetClientId` metadata. Documented the provider adapter in the marathon plan and restored module README.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, and `node tools/check-size.cjs` passed.
Blocked: This still does not open a public socket or Firebase connection. Real online still needs an actual backend process/provider implementation, auth, persistence, moderation, and reconnect storage.
Next: Add reconnect-grace handling around the provider adapter: reconnect should replay latest server room state, recent chat history, and the runner's authoritative snapshot before accepting new input.
Do not: Put API keys, Firebase config secrets, or provider-specific SDK calls into the generic contract layer.

Date: 2026-05-28
Observed: Singularity Race could enter a race and the server-load/full-race smokes proved 30 runners can finish, but the player-facing race screen did not yet have one final progression closure shared by local finish preview and connected server snapshots.
Changed: Added a minimal `race-result-panel` inside the clean in-game surface, added `finalizeRaceResult()` so local `race_finalized` rehearsal and connected `state_snapshot` finish rows share the same result path, stopped movement/skill controls after a result is shown, rendered the result layer without restoring the old HUD, and added the progression smoke to `npm run check`.
Verified: `node tools/smoke-singularity-race-progression.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-restored-marathon-contract.cjs`, `git diff --check -- singularity-race.html tools/smoke-singularity-race-progression.cjs package.json`, and `npm.cmd run check` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&adminLaunch=1&resetProfile=1&t=final` confirmed the race-only screen loads with the three bottom controls, minimap, mobile controls, and no old lobby/HUD panels at both desktop and 390px mobile widths.
Blocked: Real public completion still needs backend-owned `race_finalized`, authenticated host start, reconnect-safe room snapshots, and server reward/ranking writes.
Next: Attach a real provider adapter behind the server transport contract, then move attack/skill/checkpoint/respawn/final ranking handlers fully server-side.
Do not: Treat the result panel as authority, or let clients publish final positions, rewards, rankings, or finish times.

Date: 2026-05-28
Observed: The next Singularity Race online step needed server-owned role/session assignment and chat history replay before a real WebSocket/Firebase provider is attached.
Changed: Added `src/restored/online/marathon-server-session-contract.js` for server-owned player/spectator/host/admin sessions, late-runner-to-spectator conversion, packet permission checks, trusted host/admin chat metadata, and channel-filtered chat replay. Wired the WebSocket-shaped dev server mock through that contract so spectator input is rejected by session permissions, host chat ignores spoofed sender metadata, late runner joins convert to spectators, and spectator clients can replay approved room chat. Added `chat_history` to the server transport packet vocabulary.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `node tools/smoke-singularity-race-server-load.cjs` passed. The server-load smoke still finished 30 runners with 426 snapshots, 1881.6kbps server egress, a bounded 720-packet log, and 85 coalesced duplicate inputs.
Blocked: This is still a local contract/mock boundary. Real public online still needs an actual backend process, authenticated host/admin identity, server-persisted chat storage, moderation, reconnect replay, and real transport delivery.
Next: Attach the real provider adapter behind the existing server transport contract, starting with `hello -> join -> chat_history -> state_snapshot` before any public matchmaking is exposed.
Do not: Let client-supplied sender ids, sender roles, runner positions, host commands, or chat visibility decisions become authoritative.

Conclusion: the human has pivoted the active playable entry to a Dice City-derived single-file **배금도시 V2** restore. The previous modular city-core, multimap, ledger, and editor work remains preserved as reference/source material, but the current player-facing start is the restored economy-clicker HTML.

Current verified building shell presets: baegeum-city uses the `도시` infrastructure shells plus `building-shop-shell`, `building-home-shell`, and `building-civic-shell`; dice-city uses `building-casino-shell`, `building-alley-shell`, `building-loan-shell`, and `building-motel-shell`.
Current verified horse-racing interior sections: `horse-scoreboard`, `horse-track`, `horse-grandstand`, `horse-betting-station`, and `exchange-atm`.

Date: 2026-05-28
Observed: Singularity Race needed a spectator path that can enter during an active room, chat with players/host, and watch runners without receiving host or runner authority.
Changed: Added a visible spectator entry on the player page, allowed spectators to see/send shared room chat while keeping the admin channel hidden, routed spectator chat with spectator sender metadata, hid movement controls for spectator mode, blocked spectator movement/attack/skill packets, filtered spectator snapshots out of runner rendering, and rejected spectator/admin movement input in the server-owned state contract.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/restored/online/marathon-channel-adapter.js src/restored/online/marathon-dev-chat-transport.js src/restored/online/marathon-server-state-contract.js src/restored/games/singularity-race-dev-online.js`, and `npm.cmd run check` passed. Browser verification on `http://127.0.0.1:4173/singularity-race.html?devOnline=1&resetProfile=1` confirmed spectator entry lands on `race`, the shell has `is-spectator`, movement controls are hidden, chat opens, spectator room chat sends and persists in the message list, and console errors were zero. A second browser check confirmed the host/admin page can send a room-channel message and a spectator can see it in the race room chat.
Blocked: Real public spectator mode still needs server-authenticated role assignment, server-owned chat history/replay, moderation, and host-owned spectator capacity policy.
Next: When the real transport is attached, make late runner joins become spectator joins server-side and send spectator replay from authoritative room snapshots rather than local dev state.
Do not: Let spectator clients publish runner inputs or host commands, or rely on client-side channel filtering as the public security boundary.

Date: 2026-05-28
Observed: Singularity Race already separated player, spectator, and admin channels, but room capacity still only counted 30 runners and late joins were not explicitly routed into spectator policy.
Changed: Added separate marathon spectator capacity to the core room contract, allowed spectator mid-join during countdown/racing while blocking late runner joins, exposed spectator counts in dev room summaries, added a small `marathon-room-policy` host setting module, and added Korean spectator-capacity controls to the dev host page.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm.cmd run check`, `git diff --check` on the touched files, and browser verification on `http://127.0.0.1:4173/singularity-race-admin.html?devOnline=1` passed. Browser verified the `관전자 정원` controls, 0/32 default, 50명 change, stored host policy, and reset back to 32명 with no console errors.
Blocked: Real public spectator entry still needs server-authenticated host policy, server room snapshots, and real transport-backed join history.
Next: Add a real spectator join surface after the lobby/queue flow, backed by the same participant type and `maxSpectators` server policy, without letting spectators enter runner movement state.
Do not: Let late entrants become runners after countdown/racing, or store public spectator limits only in client localStorage once real online is attached.

## Last Known Project Shape

- Project: `baegeum-city-v2`
- Runtime: browser-based offline city-core prototype
- Main command: `npm start`
- Full check: `npm run check`
- Current priority source: `docs/baegeum-city-v2-work-queue.md`
- Foundation rules: `docs/baegeum-city-v2-foundation.md`

## Active Priority

Dice City full-restore playable prototype is the active priority:

1. Root `index.html` redirects to `baegeum-city-v2-dice.html`.
2. `baegeum-city-v2-dice.html` is the current player-facing build: a full Dice City-style single HTML renamed to 배금도시 V2.
3. The restored build owns its own localStorage key, `baegeum_city_v2_dice_restore`, so it does not mix with the previous modular city-core storage.
4. The previous ledger/action/multimap city-core remains in `src/`, `editor.html`, and docs, but it is paused unless the human explicitly redirects back to that architecture.
5. `docs/baegeum-city-v2-restored-growth-architecture.md` is the current growth architecture for AI lovers, emotion, gambling, ownership, conversation, and illustrations.
6. Near-term code changes should continue extracting runtime contracts under `src/restored/` instead of adding more inline script to the restored HTML.
7. Asset additions for mp3 files, partner illustrations, phone art, casino art, and item images should go through `src/restored/assets/asset-manifest.js` and `docs/baegeum-city-v2-restored-asset-pipeline.md` before runtime use.
8. Restored read-only selectors for total asset, rank, ownership value, phone ownership, smartphone ownership, and carried inventory now live in `src/restored/state/selectors.js`.
9. Human-provided files, links, design drafts, and raw notes now have an intake lane: raw files in `assets/inbox/`, reference cards in `refs/intake/`, and classification through `tools/intake-restored-material.cjs`.
10. Restored UI, online expansion, ranking, and chat growth are now planned in `docs/baegeum-city-v2-restored-ui-online-ranking-chat-roadmap.md`; phone remains the hub for news, markets, rankings, and chat, while current bottom navigation is location-aware instead of a permanent feature list.
11. New restored features should get a draft plan through `npm run plan:restored -- <slug> --write` before implementation. The plan template includes job/occupation impact so rankings can include jobs without mixing them into wealth rank.
12. `docs/plans/restored-ranking-job-system.md` is the first concrete restored feature plan. It keeps wealth title, leaderboard position, and job/occupation rank separate.
13. `docs/plans/restored-three-city-home-navigation.md` is the current navigation plan: start inside the player home, move to house-front, and expand through Baegeum City, Dice City, and Seosan City with location-aware tabs.
14. Static restored catalogs for ranks, assets, markets, partner archetypes, city ids, and place seeds now live under `src/restored/data/`.
15. `src/restored/data/location-catalog.js` and `src/restored/ui/location-nav-contract.js` define the planned home, house-front, travel, and first-city navigation contexts. The next code slice should make the playable shell consume these contracts in a reversible way.
16. Visible save-code backup UI has been removed from the restored HTML. The current start screen is a local guest login home, with online login explicitly unavailable until an online adapter exists.
17. `src/restored/account/session-contract.js` owns restored account/session and online availability state. MammonCity2 is pinned as a login/online/phone reference in `refs/`, but no Firebase config or runtime import should be copied without a separate adoption decision.
18. `src/restored/online/online-adapter-contract.js` now owns the unavailable-by-default online adapter snapshot and lobby availability guard. The next restored coding slice should move phone app rendering under `src/restored/phone/` before any Firebase or connected lobby work.
19. `src/restored/player/profile-contract.js` now owns the restored profile/job/residence/condition/core-stat shape. My Info is now a character sheet; money duplication and always-visible hunting/home actions should move to top bar, home, or outside-location surfaces instead.
20. `src/restored/phone/phone-app-contract.js` now owns phone app ids, labels, icons, and phone/smartphone gates, including the `relationships` app. The HTML still renders the app views, but visible app buttons are derived from the contract.
21. `docs/plans/restored-ui-surface-redesign.md` now owns the immediate pre-redesign checklist for the restored shell: My Info, home, outside/home-front, phone, city, ranking, chat, online, and asset boundaries.
22. The partner/lover list now belongs to the phone relationship app, not to My Info. My Info only shows a compact relationship summary, and the current playable phone tab exposes the `인연` app beside news/stock for folder phones. The MammonCity2-style phone registry/router/app-stage pattern remains the reference for relationship, market, ranking, chat, and online apps.
23. My Info now has a carried-item inventory preview for shop-owned devices, luxury goods, and consumables. Registered consumables can show a `사용` button through `src/restored/inventory/consumable-contract.js`; real estate remains excluded, and `docs/baegeum-city-v2-restored-inventory.md` records the restored inventory boundary.

24. Existing restored gambling is legacy scaffolding. The next gambling direction is a replacement system: each venue/game needs its own restored contract before UI work, and old odd-even/blackjack/casino scripts should be kept only as playable reference until replaced.
25. `src/restored/games/gambling-replacement-contract.js` now owns the restored gambling event/effect vocabulary: neutral gambling events, ledger bridge effects, relationship/emotion hooks, and online authority requests. The live restored HTML is still intentionally unconnected to this contract.
26. `src/restored/games/blackjack-contract.js` now owns pure blackjack scoring, outcome comparison, and bet/result envelopes on top of the restored gambling contract. It is not connected to `blackjack-design-test.html` or the live restored HTML yet.
27. `src/restored/games/blackjack-round-contract.js` now owns the pure blackjack round flow `ready -> player_turn -> dealer_turn -> settled`, including shoe consumption, initial deal, hit, stand, auto-settle, and settled result-envelope creation. It is still intentionally unconnected to UI.
28. `src/restored/games/roulette-contract.js` now owns pure single-zero roulette bet rules, color resolution, payout projection, and bet/result envelopes. It is still intentionally unconnected to UI.
29. `src/restored/games/baccarat-contract.js` now owns pure baccarat scoring, player / banker / tie bet normalization, banker commission payout, tie refund behavior, and bet/result envelopes. It is still intentionally unconnected to UI.
30. `src/restored/games/slot-contract.js` now owns pure provided-reel slot symbols, jackpot / triple / pair / loss classification, payout projection, and bet/result envelopes. It is still intentionally unconnected to UI and does not generate random outcomes.
31. `src/restored/games/pawnshop-contract.js` now owns pure pawnshop collateral quotes, pawn/redeem/forfeit envelopes, local item hold/return/sold effects, and local cash delta effects. It is still intentionally unconnected to UI and does not use the economy ledger until a debt/collateral ledger contract exists.
32. `src/restored/games/loan-office-contract.js` now owns pure loan quotes, borrow, payment, delinquency, default, and local debt/cash effects. It is still intentionally unconnected to UI and does not use the economy ledger until a debt ledger exists.
33. `tools/check-restored-game-contract-purity.cjs` now guards restored game contracts against DOM, browser storage, timers, direct random outcome generation, and missing smoke-check coverage before animated roulette, baccarat, horse racing, or slots are added.
34. `src/restored/economy/dpa-token-contract.js` now owns the DPA casino-token boundary: normal cash stays 원화, Dice City betting/exchange UI can refer to `DPA`, and `1 DPA = 1,000원` bridges to the current `chips` ledger field during migration.
35. Baegeum frontage rows are now guarded: job street shows 고시원/편의점/맥버거/인력소, shop street shows 디페이 ATM/배금증권/배금은행/중고차 매장, and Dice City casino street shows 룰렛카지노/바카라카지노/경마장/DPA 환전소 without adding more bottom tabs.
36. `docs/plans/restored-lover-relationship-system.md` now owns the relationship v2 planning boundary: My Info can show social/emotional summaries, the phone relationship app owns the full partner/lover flow, and future affection/trust/stability/risk changes must consume events instead of being mutated directly by casino, stock, loan, pawnshop, gift, or job handlers.
37. `src/restored/systems/relationship-contract.js` now owns pure relationship v2 helpers for legacy `love` migration, stage inference, affection/trust/stability/risk clamping, confession readiness, relationship summaries, and relationship log envelopes.
38. `src/restored/ui/relationship-summary-view.js` now turns that contract into a compact My Info summary card and phone app badge label. The full partner list remains inside the phone relationship app, and relationship mutations still need event boundaries.
39. `src/restored/phone/relationship-app-view.js` now owns the phone relationship app partner-card list and recent relationship-log HTML. The HTML shell only mounts the returned summary label, list HTML, and log HTML, preserving `openInteractModal(index)` as the current interaction entry.
40. Restored initial state and storage now seed and preserve `relationshipLogs`.
41. `src/restored/systems/relationship-event-runtime.js` now routes current walk encounters, interest, calls, AI talk, gifts, intimacy, marriage, and passive drift through relationship source events/logs while preserving legacy `love` compatibility.
42. `src/restored/phone/phone-app-ecosystem-contract.js` now separates the planned phone OS/app-store catalog from the live phone app registry. Planned apps include BaeTalk-style messenger, Baegeum Gallery-style community, rankings, bank/pay, map, and online lobby candidates.
43. `src/restored/phone/app-store-view.js` now renders the smartphone-only Baegeum Store shell from the ecosystem catalog. It shows installed, locked, planned, and online-prep app rows without mutating save data or adding phone apps to bottom navigation.
44. `src/restored/phone/news-app-view.js`, `src/restored/phone/stock-app-view.js`, and `src/restored/phone/futures-app-view.js` now own the restored phone news, stock, and futures renderers. The HTML shell mounts returned view HTML and still owns market ticks, trades, and futures open/close handlers.
45. `docs/plans/restored-stock-market-system.md` now owns the restored market expansion boundary: Domestic, United States, Crypto Spot, and Crypto Leverage tabs, realistic virtual candle charts, DP-only prices, Baegeum Electronics as V0.1, and no live financial data or real-company branding in the first slice.
46. `src/restored/systems/market-contract.js` now owns the first pure Baegeum Electronics market contract: virtual OHLCV generation, snapshot summary, DP formatting, holding P/L, and buy/sell order previews without DOM, storage, timers, random outcomes, or live money mutation.
47. `docs/plans/restored-life-minigame-system.md` and `src/restored/jobs/life-job-contract.js` now own the first life-job minigame lane: convenience-store and fast-food deterministic shift scoring, won wage envelopes, condition effects, relationship hooks, and optional inventory bonuses without live HTML mutation.
48. `src/restored/jobs/life-job-place-view.js` and `src/restored/jobs/life-job-result-application.js` now connect the first live place panels for convenience-store and fast-food shifts. The restored HTML only mounts the panel and calls `completeLifeJobShift`; wages, condition changes, inventory grants, and relationship hooks still flow through restored job envelopes.
49. `src/restored/jobs/life-job-catalog.js` now owns the starter job catalog, keeping `src/restored/jobs/life-job-contract.js` under the file-size gate. `job:labor-office` is the third starter life-job contract and uses the same live place adapter through the existing `labor_office` place action. It pays more than fast-food, costs more energy, and can grant `work_gloves` as a high-grade inventory reward.
50. `src/restored/career/study-career-contract.js` now owns the first study-gated career lane: library self-study, university night classes, Baegeum office qualification, company shift wages, and promotion state. The restored HTML mounts it only inside Baegeum City job places through `completeStudyCareerAction()`.
51. `src/restored/career/study-career-summary-view.js` now owns the My Info education/career summary card. My Info shows credits, study hours, intelligence, current company level, next level, and qualification/promotion progress without adding new action buttons.
52. Company work is no longer a single generic button. `study-career-contract.js` defines `documents`, `overtime-report`, and `team-support` company shift presets, and the Baegeum City job surface renders those choices without duplicating wage or promotion formulas in HTML.
53. `src/restored/phone/stock-app-view.js` now renders the live phone stock app from the Baegeum Electronics market snapshot. The visible stock app is DP-only and no longer renders the legacy NASDAQ/TSLA/AAPL/NVDA table.
54. `src/restored/systems/market-order-application.js` now owns the local Baegeum Electronics one-share order application path. The live stock app can call `tradeRestoredBaegeumStock('buy'|'sell')`, update `markets.portfolio.holdings`, preserve orders through storage, and reflect holdings in total asset selectors without reviving legacy stock rows.
55. `src/restored/career/study-career-place-view.js` now guards locked company-shift toast buttons against nested double-quote `onclick` breakage. Locked company actions render safe single-quoted `showToast(...)` calls and the study/career smoke check covers the regression.
56. `src/restored/systems/news-cycle-contract.js` now owns the realistic-looking fictional phone news cycle. The live restored HTML creates cycle, crash, and AI-flash news through that contract, and `src/restored/phone/news-app-view.js` renders source-labeled article cards instead of flat legacy messages.
57. Life-job and study/career money effects now use `currency: "WON"` and render wages/tuition as `원`. DPA remains reserved for Dice City exchange/casino token flows.
58. Starter labor surfaces now use Korean job/task copy and preview expected won wage, energy, mental, time, and reputation effects before the player chooses a work preset. News copy is also guarded so ordinary work is described as won/cash income, not DP/DPA income.
59. The Baegeum job-street surface now has building-entry buttons for starter work, study, and company buildings. The life-job catalog covers convenience store, fast-food, labor office, PC room, flyer, delivery, parking, car wash, cleaning, factory, port, and market helper work, while `enterRestoredPlaceBuilding(actionId)` opens the selected building panel without adding bottom tabs.
60. Life-job completions now write local `jobHistory` and `jobStats` state. My Info renders a `life-job-history-card` with total shifts, total won income, latest job result, current same-job streak, and recent completed shifts.
61. Fixed part-time work now has a first local contract slice. Job panels expose `고정 알바 등록`, `fixedJobContract` stores one active job with reliability/attendance/streak/fixed-job income, matching shifts update it through the life-job result application, and My Info renders the fixed-job summary inside `life-job-history-card`.
62. Marathon stadium now has a first online-ready restored contract and local 2D preview. `src/restored/games/marathon-contract.js` owns 30-runner caps, checkpoints, ranking, result envelopes, and online packet vocabulary; `src/restored/games/marathon-stadium-view.js` mounts a local player plus 29 bot runners from the Baegeum street surface.
63. `특이점레이스` now has a separate public local lobby entry at `singularity-race.html`. It is not the Baegeum City page; it shows 30 runner slots, local readiness, lobby chat, and Drawing World-derived skin cards through `src/skins/drawing-world-adapter.js`.
64. Singularity Race now has a dev-only connected marathon room adapter in `src/restored/online/marathon-room-adapter.js`. The normal lobby remains local; `?devOnline=1` opens the connected-only gate, and the UI switches to `DEV ROOM` only after `join_result ok`.
65. Singularity Race now has dev-only pre-created lobby, room, spectator, admin, and notice chat channels in `src/restored/online/marathon-channel-adapter.js`. The public lobby and separate `singularity-race-admin.html?devOnline=1` page share the local dev chat log under `singularity-race:chat:v1`.
66. Restored assets now have a promoted `assets/restored/` folder structure for audio, images, source material, manifest batches, shared characters, and Singularity Race-specific art. Runtime use still goes through `src/restored/assets/asset-manifest.js`, not raw paths.
67. Singularity Race server transport now has a WebSocket/Firebase-style config boundary and a server-transport-backed room adapter shape. It still does not open public online by default; a connected transport snapshot plus server-provided room list must be injected before the connected lobby opens.
68. Singularity Race now has a local WebSocket-shaped dev server mock in `src/restored/online/marathon-websocket-dev-server-mock.js`. It rehearses connected transport, room list, join result, client packet ingest, server snapshot creation, and packet pressure limiting without opening a public port.
69. Singularity Race now uses `src/restored/games/marathon-trail-geometry.js` for the public course shape: one shared log-curve 2D trail, five save points, SVG path generation, pointer-to-progress estimation, and matching marathon-distance checkpoints. `singularity-race.html` renders all available runners on that single trail instead of separate horizontal lanes.
70. The standalone Singularity Race lobby now has local-only race feedback on the trail: a player focus ring, progress/next-save pill, checkpoint/skill/hit/respawn/finish cue labels, and reset behavior when filling the 30-runner local practice slots.
71. Singularity Race local practice now has a deterministic bot pack and compact standings strip. Local bots advance after practice starts, runner slots show current progress, and the standings strip keeps the leaders plus YOU visible without changing server authority.
72. Singularity Race admin now has a direct dev game entry. The lobby still exposes `admin-page-link`, and `singularity-race-admin.html?devOnline=1` now exposes `admin-direct-game-link` to `singularity-race.html?devOnline=1&adminLaunch=1`; that query makes the lobby auto-join the dev room and show `DEV ROOM`.
73. Singularity Race admin now has a dev room packet monitor. `singularity-race-admin.html?devOnline=1` imports the dev room transport, reads the room-scoped relay log without writing packets, and shows packet count, latest packet source, and relay guard state beside the separated admin/chat channels.
74. Singularity Race local practice now starts with all 30 runners on one shared rail. The local preview uses single-rail collision spacing so runners bump and stall instead of visually passing through each other, and `T` focuses the current chat input while `Enter` still submits through the channel transport.
75. Singularity Race now renders the lobby trail inside a large camera-followed track world. The SVG rail uses non-scaling strokes for consistent width, runner sprites no longer sit on dark translucent cards, and the skin picker exposes all playable presets with `baegeum-hood`, `gpichan`, `robot`, and `kaguya` first.
76. Singularity Race now uses a wider two-column lobby layout, a `7600x2600` track world, a thicker visible rail, same-progress side-by-side start formation, smoother 60ms local preview ticks, persistent runner DOM nodes, and slower local pacing aimed at an 8-10 minute party race.
77. Singularity Race local practice now uses an extra-wide 5x-style road surface, keeps all 30 runners in one same-progress start row, gates the race behind a local countdown, and replaces hard runner blocking with local-only soft pass pressure.
78. Singularity Race track camera now centers directly on the player in the large `7600x2600` world instead of anchoring the player near the left edge.
79. Singularity Race now uses a free 2D start paddock instead of a one-row start. Runners own `progress` plus `laneOffsetPx`, the start gate stays closed until a dev admin 10-second countdown signal, and the gate disappears on `GO`.
80. Singularity Race staging bots now request their own render pass when their paddock simulation moves, so the visible bot pack no longer appears frozen when the local player stops moving before the admin countdown.
81. Singularity Race player movement now separates staging forward speed from race forward speed. `Shift` visibly boosts forward progress, while `W/S` lateral movement is slightly slower so moving down no longer reads like the real speed control.
82. Singularity Race now has an anti-teleport display guard for bots and future remote players. Netcode owns the visual step/snap policy, and the lobby smooths non-player runner coordinates instead of drawing every target correction instantly.
83. Singularity Race anti-teleport follow-up now cleans stale runner visual caches when runner DOM nodes disappear and guards the smoothing/HUD tokens in the marathon contract check.
84. Singularity Race local collision now uses soft body pressure instead of ghost pass-through: close runners get speed drag, a collision glow, a tiny lane push, and a tiny forward/back separation while staying smooth.
85. Singularity Race road-wall access now uses a wider lane clamp so runners can move close to the visible road walls instead of stopping at a transparent inner buffer.
86. Singularity Race runner names now live inside each runner avatar as a foot-level nameplate, keeping the head area free for future HP bars and preventing sprint/interpolation from visually separating names from sprites.
87. Singularity Race dev online rehearsal now marks connected `state_snapshot` packets as server-owned and carries snapshot id, server tick/snapshot cadence, ping sample, and reconciliation metadata. This is still dev-only and does not expose public matchmaking.
88. Singularity Race admin is now a simplified future host/spectator camera page: Korean visible copy, room list, direct game/lobby links, whole-course camera, per-player watch list, countdown control, and separated chat channels instead of raw packet metrics.
89. Singularity Race player entry now follows a simple first-use loop: nickname plus skin selection, compact room list, room waiting view, then race screen. Dev protocol, packet, netcode, raw room id, and server-lock labels are hidden from normal players unless `?debug=1` is used.
90. Singularity Race race screen now isolates in-game UI: after room ready/game entry, the top lobby status, room waiting sidebar, and chat sidebar are hidden so the stadium surface is not overlapped by lobby panels.
91. Singularity Race lobby now shows only a simple room list before room entry. Lobby chat, participant count, ready count, quick entry, and notice/debug rows are hidden from the lobby screen; those surfaces belong to the room, race, admin, or debug views.
92. Singularity Race room waiting is now a simple `대기열`: normal players see runner slots, `맵 미리보기`, and chat only. Top status metrics, participant/ready counters, ready button, duplicate room card, channel tabs, badges, and explanatory copy are hidden from the queue screen.
93. Singularity Race now separates `mapPreview` from `race`. The normal player path is `profile -> lobby -> queue -> mapPreview -> queue`; the map preview button no longer starts the race, and admin/direct start remains the path into `race`.
94. Singularity Race player screen ids and short flow copy now live in `src/restored/games/singularity-race-flow.js`. The player page imports those constants/helpers so `profile`, `lobby`, `queue`, `mapPreview`, and `race` do not drift back into duplicated string checks.
95. Singularity Race runner display helpers now live in `src/restored/games/singularity-race-runner-view.js`. Runner avatars, queue slots, standings rows, checkpoint dots, action packet rows, skill labels, and action status labels are no longer hand-built inline in `singularity-race.html`.
96. Singularity Race track effect helpers now live in `src/restored/games/singularity-race-track.js`. The player focus ring, start gate, countdown badge, progress pill, and short track cue labels are separated from movement, collision, and camera math.
97. Singularity Race player script is split along the requested boundaries: `singularity-race-flow.js` for screen state/copy, `singularity-race-queue.js` for queue slots/chat rows, `singularity-race-track.js` for track effects, `singularity-race-local-sim.js` for local bots/start paddock, and `singularity-race-dev-online.js` for dev relay wrappers. `singularity-race.html` remains the controller shell.
98. Singularity Race race-control signaling now lives in `src/restored/games/singularity-race-control.js`. The player page and host page share the same dev-only start-countdown command shape, local storage key, broadcast channel name, and race-control phase labels.
99. Singularity Race lobby/queue/chat/track styling now follows a Drawing World-inspired paper-grid direction: light panels, compact chat, pale stadium field, and muted green-gray rails instead of black outer curbs.
100. Singularity Race skin picker now keeps the requested named set in the normal profile flow: `kaguya`, `singularity-fan`, `robot`, `gpichan`, `pepe-runner`, `moderator-armband`, `yalrkun`, `lakers-wile`, `sam-altman`, and `demis-hassabis`; casino/general-citizen presets remain excluded.

101. Singularity Race first-use profile screen now keeps the 12-skin picker compact on phone widths by using a denser mobile skin-card grid instead of a long one-column stack.
102. Singularity Race map preview is now a real whole-course overview: it hides runner/HUD overlays, disables the player-follow camera, and fits the full trail/save-point/finish schematic into the preview panel.
103. Singularity Race race screen is now stripped down to the stadium surface only while the in-game UI is being redesigned: lobby chrome, track header, bottom HUD cards, checkpoint strip, standings, packet rails, progress pill, map caption, and start-gate label are hidden in `race`.
104. Singularity Race phone-width race screen now has exactly three bottom controls over the clean stadium surface: `대기열 보기/닫기`, `채팅창 열기/닫기`, and disabled `플레이 시작 / 관리자 대기중`; queue and chat open as mutually exclusive overlays.
105. Singularity Race race screen now has PC-and-mobile auxiliary controls: a left circular `W/A/S/D` pad and right-side `스킬(E)` plus `채팅(T)` buttons. The touch/mouse pad feeds the same movement key state as the keyboard, and queue/chat overlays hide the movement controls while open.
106. Singularity Race local race progression now reaches the actual finish clamp at 100% instead of stopping at 96%. Local finish only rehearses a server-owned `race_finalized` preview packet, while `tools/smoke-singularity-race-progression.cjs` checks start-to-finish reachability, Shift+D sprint input, 30-runner bandwidth budget, degraded ping lane reduction, packet pressure blocking, anti-teleport smoothing, and bot movement while the player is stopped.
107. Singularity Race now has a first server-owned movement-state contract. `src/restored/online/marathon-server-state-contract.js` applies accepted `input_update` envelopes to server room participants, rejects stale input, prevents lateral-only input from increasing progress, stamps finish time, and emits server-owned runner snapshots. The WebSocket-shaped dev mock now starts a server-owned race, applies input during `racing`, and includes `movementAuthority: "server"` in snapshots.
108. Singularity Race connected display now consumes server-owned `state_snapshot` rows. `src/restored/games/singularity-race-dev-online.js` merges snapshot participants into runner display state, and `singularity-race.html` applies the newest snapshot to progress, lane offset, server sequence, race phase, standings, and camera rendering.
109. Singularity Race dev chat history now keeps the latest 500 local messages across lobby/race/admin refreshes. This is still development-only local history; public online chat must become server-owned, channel-scoped, paginated, and moderation-aware.
110. Singularity Race map preview now clears runner, HUD, gate, and minimap nodes at render time and sizes the track world to the preview panel, while the race screen locks to a full-viewport stadium surface with only in-game overlays and a top-right minimap.
111. Singularity Race race camera now has a first `soft-follow` road-rotation mode. It keeps the start straight stable, rotates the track world after the curve begins, counter-rotates runner sprites so names stay upright, and uses inverse camera math for mouse attack targeting.
112. Singularity Race camera math now lives in `src/restored/games/singularity-race-camera.js`, with `tools/smoke-singularity-race-camera.cjs` checking soft-follow rotation, fixed mode, counter-rotation, and inverse screen-to-track mapping.
113. Singularity Race hot movement loop now uses a lightweight `renderActionPreviewFrame()` path. Track rendering stays frequent, while HUD, standings, queue slots, chat, skin cards, channel tabs, and debug rails avoid full redraws during movement; the minimap now caches static SVG and moves only the player dot.
114. Singularity Race character rewards now have a future D/C/B/A/S grade layer on top of the existing rarity labels, and `tools/smoke-singularity-race-combat-full-race.cjs` guards a 30-runner start-to-finish race with checkpoint rewards, skills, mouse attacks, runner down, checkpoint respawn, and all runners finishing.
115. Singularity Race now has a 30-runner server-load smoke around the WebSocket-shaped dev mock. `tools/smoke-singularity-race-server-load.cjs` checks the 30-player packet budget, degraded ping lane choice, all 30 clients joining, server-owned snapshots, bounded packet logs, and every runner finishing on a scaled load-test course.
116. Singularity Race server cadence now has a dedicated loop contract. `src/restored/online/marathon-server-loop-contract.js` fixes the 20Hz server tick, 10Hz snapshot cadence, catch-up tick cap, and latest-input-per-participant coalescing so the future public transport does not apply noisy client frames directly.
117. Singularity Race now has a WebSocket-shaped dev loop harness. `src/restored/online/marathon-websocket-dev-loop.js` queues input envelopes, applies the 20Hz server loop to the dev mock, coalesces duplicate inputs inside a tick, emits due server-owned snapshots, and returns a stable next loop state.
118. Singularity Race player page now uses the dev loop harness behind `?devOnline=1`. Connected room join creates a same-room WebSocket-shaped dev mock with one local runner plus bot clients, starts it when the admin countdown opens, sends server-loop input internally, and renders periodic server-owned `state_snapshot` rows through the existing relay.
119. Singularity Race server loop now drops stale tick/snapshot backlog and initializes the in-page dev loop from the current browser time, preventing paused-tab or first-load `RangeError: Invalid array length` snapshot bursts.

Date: 2026-05-28
Observed: The reusable dev loop harness existed, but the player page still only displayed relay packets and did not run a deterministic server snapshot feed after connected join.
Changed: Wired `singularity-race.html` to create a same-room WebSocket-shaped dev server mock behind `?devOnline=1`, join 30 dev clients, emit an initial 30-runner server snapshot, start the dev server race when countdown finishes, and advance `advanceConnectedDevSnapshotFeed()` from the existing preview loop. The page now publishes server-owned snapshots into the dev room relay while keeping high-frequency player/bot inputs inside the server loop.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP checks returned 200 for `singularity-race.html?devOnline=1`, `singularity-race.html?devOnline=1&adminLaunch=1`, and `singularity-race-admin.html?devOnline=1`. Browser verification later reproduced and fixed an initial `RangeError: Invalid array length`; desktop and mobile reloads of `singularity-race.html?devOnline=1&adminLaunch=1` now report zero console errors.
Blocked: Real public online remains unavailable until a WebSocket/Firebase provider, backend room process, server chat persistence, auth, and moderation are chosen.
Next: Replace the dev relay with the real transport adapter boundary, keeping all position, attack, reward, respawn, finish, and ranking authority server-owned.
Do not: Store 30-runner high-frequency input packets in the relay log or render from local connected positions instead of server snapshots.

Date: 2026-05-28
Observed: The server cadence contract existed, but the WebSocket-shaped dev mock still needed a reusable loop harness so page/dev transport work can consume the same input queue and snapshot cadence.
Changed: Added `src/restored/online/marathon-websocket-dev-loop.js`, wired it into the marathon contract check, and refactored `tools/smoke-singularity-race-server-load.cjs` to drive 30 runners through that harness instead of duplicating the tick/snapshot loop inside the smoke.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check -- src/restored/online/marathon-websocket-dev-loop.js tools/check-restored-marathon-contract.cjs tools/smoke-singularity-race-server-load.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. The load smoke still reports 30 runners, 426 snapshots, 42600ms scaled finish time, 1881.6kbps server egress budget, 720 bounded packets, and 85 coalesced duplicate inputs.
Blocked: The player page still uses the local relay path for visible packets; the next slice should connect this harness to a deterministic in-page dev snapshot feed.
Next: Run the full project check, then wire the player page connected preview to consume periodic server-owned snapshots from the dev loop harness.
Do not: Recreate ad hoc tick loops in page code or tie server snapshot emission to render frequency.

Date: 2026-05-28
Observed: The 30-runner load smoke existed, but it was still coarse at one accepted input per second. A real connected room needs explicit server cadence so lag mitigation does not depend on browser render timing.
Changed: Added `src/restored/online/marathon-server-loop-contract.js` for 20Hz tick planning, 10Hz snapshot planning, catch-up tick caps, and input coalescing. Wired the loop contract into `tools/check-restored-marathon-contract.cjs` and changed `tools/smoke-singularity-race-server-load.cjs` to run a 20Hz input loop with 10Hz server snapshots, duplicate-input coalescing, and a bounded packet log.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check -- src/restored/online/marathon-server-loop-contract.js tools/check-restored-marathon-contract.cjs tools/smoke-singularity-race-server-load.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md package.json`, and `npm.cmd run check` passed. The 20Hz/10Hz load smoke reported 30 runners, 426 snapshots, 42600ms scaled finish time, 1881.6kbps server egress budget, 720 bounded packets, and 85 coalesced duplicate inputs.
Blocked: This is still a deterministic Node smoke, not real browser FPS or public network soak testing.
Next: Run the full check, then the next online slice should use this loop as the basis for a real periodic server snapshot transport path.
Do not: Tie server ticks to `requestAnimationFrame`, emit snapshots every render frame, or apply every duplicate client input directly.

Date: 2026-05-28
Observed: The next online-readiness risk was whether the WebSocket-shaped dev mock could carry a full 30-runner room through server-owned inputs and snapshots without packet pressure or packet-log growth becoming the bottleneck.
Changed: Added `tools/smoke-singularity-race-server-load.cjs` and wired it into `npm run check`. The smoke connects and joins 30 clients, starts a server-owned room, advances every runner from start to finish through accepted `input_update` packets, emits periodic `state_snapshot` packets, checks the documented 30-runner bandwidth budget, checks degraded ping lane selection, and verifies the dev server packet log stays bounded.
Verified: `node tools/smoke-singularity-race-server-load.cjs`, `node tools/check-size.cjs`, `git diff --check -- tools/smoke-singularity-race-server-load.cjs package.json docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. The load smoke reported 30 runners, 87 snapshots, 174000ms scaled finish time, 1881.6kbps server egress budget, and a bounded 240-packet dev log.
Blocked: This is still a deterministic scaled load smoke, not real browser FPS profiling or public network soak testing. The actual public server still needs a real transport loop and multi-client runtime profiling.
Next: Keep public-online work on the server snapshot loop/reconciliation path, then add an automated browser FPS/layout check once browser automation is available again.
Do not: Treat local dev mock finish times, local packet logs, or client-originated attack/skill packets as public race authority.

Date: 2026-05-28
Observed: The next risk was not another visual pass, but whether the current marathon contracts can survive future 30-runner combat, checkpoint skill rewards, and D-to-S character grades without causing finish or respawn regressions.
Changed: Added `RESTORED_MARATHON_CHARACTER_GRADES`, grade-gated checkpoint reward pools, and D/C/B/A/S validation to `src/restored/games/marathon-character-skill-contract.js`. Added `tools/smoke-singularity-race-combat-full-race.cjs` and wired it into `npm run check` so attack hits, down/respawn, skill usage, checkpoint rewards, and 30-runner finish reachability stay covered.
Verified: `node tools/smoke-singularity-race-combat-full-race.cjs`, `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- src/restored/games/marathon-character-skill-contract.js tools/smoke-singularity-race-combat-full-race.cjs package.json docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP checks returned 200 for `singularity-race.html?devOnline=1` and `singularity-race-admin.html?devOnline=1`.
Blocked: This is still deterministic contract smoke testing, not real 30-client browser or server load testing. Public online still needs server-owned attack, skill, reward, respawn, finish, ping, and reconciliation.
Next: Run the full `npm.cmd run check`, then keep the next optimization focused on a server snapshot loop/load harness rather than adding more UI.
Do not: Make D/S rewards, attack hits, skill charge use, respawn points, or finish order client-authoritative in public online.

Date: 2026-05-28
Observed: The 30-runner progression and netcode smoke checks passed, but the local 60 ms movement loop still called `renderAll()`, which can redraw chat, skins, slots, standings, and debug UI on every movement tick.
Changed: Added race render budget constants and `renderActionPreviewFrame()` to keep the hot path focused on track/runners while throttling HUD, standings, and queue slots. Cached the minimap static SVG so only the player dot moves during race frames. Added `tools/smoke-singularity-race-render-budget.cjs` and wired it into `npm run check`.
Verified: `node tools/smoke-singularity-race-render-budget.cjs`, `node tools/smoke-singularity-race-progression.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/smoke-singularity-race-render-budget.cjs package.json docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP check returned 200 and served the render-budget tokens for `singularity-race.html?devOnline=1&adminLaunch=1`.
Blocked: Real FPS/pixel QA remains blocked by the in-app browser Windows sandbox setup failure, so this is static/runtime-smoke confidence rather than captured-device profiling.
Next: Add D/C/B/A/S character grade catalog and a 30-runner attack/skill/down/respawn full-race smoke after the render-budget optimization is fully checked.
Do not: Put `renderAll()` back into the hot movement loop or make client-side attack/skill decisions authoritative for public online.

Date: 2026-05-28
Observed: The first road-follow camera slice worked but left rotation and inverse click math embedded inside `singularity-race.html`, increasing the chance of future camera/input spaghetti.
Changed: Added `src/restored/games/singularity-race-camera.js` for anchored race camera creation, soft-follow/fixed/road-follow target rotation, smoothing, and inverse screen-to-track mapping. Updated `singularity-race.html` to consume that module and added `tools/smoke-singularity-race-camera.cjs` to the full `npm run check` chain.
Verified: `node tools/smoke-singularity-race-camera.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-marathon-contract.cjs`, `git diff --check -- singularity-race.html src/restored/games/singularity-race-camera.js tools/smoke-singularity-race-camera.cjs package.json docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP check returned 200 for `singularity-race.html?devOnline=1&adminLaunch=1`.
Blocked: Browser screenshot/play QA remains blocked by the in-app browser Windows sandbox setup failure.
Next: Run the full project check, then manually reload the race page to feel-test camera rotation on the curve.
Do not: Put camera rotation math back into the HTML controller or rotate UI overlays with the track world.

Date: 2026-05-28
Observed: After the clean map-preview and in-game UI split, the next documented slice was the curved-track camera so the vertical finish section feels like the road is turning under the player.
Changed: Added `TRACK_CAMERA_MODE = "soft-follow"` to `singularity-race.html`, with tangent-based road rotation, per-frame smoothing/clamping, runner counter-rotation, full-viewport anchored race camera, and inverse screen-to-world coordinate conversion for mouse attacks.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP check returned 200 for `singularity-race.html?devOnline=1&adminLaunch=1`.
Blocked: Browser screenshot/play QA is still blocked by the in-app browser Windows sandbox setup failure, so the exact visual feel of the rotation still needs manual reload/testing.
Next: Run the full project check and HTTP page checks, then manually test the curve segment when browser control is available.
Do not: Rotate the UI overlays with the track world, or trust client-side camera math as online authority.

Date: 2026-05-28
Observed: The human clarified that map preview must show the whole map, not the character-follow camera, and that in-game must be only the game surface plus chat/mobile controls/minimap.
Changed: Hardened `singularity-race.html` so `mapPreview` renders no runners, start gate, progress pill, HUD, or minimap and uses preview-sized track world dimensions. The `race` screen now locks the page to a full viewport, removes the panel border/header/card layout from the play surface, and adds a top-right route minimap while keeping queue/chat/mobile controls as overlays.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html`, and `npm.cmd run check` passed. HTTP checks returned 200 for `singularity-race.html?devOnline=1`, `singularity-race.html?devOnline=1&adminLaunch=1`, and `singularity-race-admin.html?devOnline=1`; served HTML includes the new minimap and preview-size guards. Browser automation could not attach because the in-app browser setup failed twice with the same Windows sandbox spawn error.
Blocked: Visual browser screenshot QA is still blocked by the local browser automation failure; manual reload in the in-app browser is needed for pixel confirmation.
Next: Reload the player page and confirm `mapPreview` shows the whole route, then start the road-follow camera rotation slice after pointer/attack coordinate math is planned.
Do not: Let map preview reuse the player-follow camera, or put old status cards back onto the race screen.

Date: 2026-05-28
Observed: The human asked for chat records to keep remaining, and for the next real-online plan plus a road-follow camera plan for the curved track segment.
Changed: Raised Singularity Race dev chat retention to 500 messages in the chat transport, player page, and admin page; added a contract guard for latest-500 retention; documented real-online readiness blockers and the future curve-follow camera mode in the marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html singularity-race-admin.html src/restored/online/marathon-dev-chat-transport.js docs/plans/restored-marathon-stadium.md src/restored/README.md docs/ai-working-state.md`, and `npm.cmd run check` passed. HTTP checks returned 200 for `singularity-race.html?devOnline=1&adminLaunch=1` and `singularity-race-admin.html?devOnline=1`, with `messageLimit: 500` and the dev chat transport present on both pages.
Blocked: Camera rotation is planned but not yet implemented because it changes pointer-to-track math and needs visual QA. Public online is still blocked on a real WebSocket/Firebase transport and server-owned chat/state persistence.
Next: Verify chat history retention checks, then add the periodic server snapshot loop before implementing rotated camera rendering.
Do not: Treat local dev chat history as public persistence, rotate UI overlays with the track world, or let clients author authoritative race state.

Date: 2026-05-28
Observed: The server-owned movement contract existed, but connected race rendering still treated snapshots mostly as relay/debug packets.
Changed: Added `mergeSingularityServerSnapshotRunners()` to the dev-online helper module and wired `singularity-race.html` to apply initial and relayed `state_snapshot` packets into the connected runner display path.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/smoke-singularity-race-server-state.cjs`, and `node tools/smoke-singularity-race-progression.cjs` passed.
Blocked: The page still uses the dev room relay for visible connected packets; a real WebSocket/Firebase provider is not attached yet.
Next: Add the actual transport-backed snapshot loop or a deterministic in-page WS-dev harness so the connected UI receives periodic server snapshots instead of one-shot local relay rows.
Do not: Let client-owned progress, local finish, local collision, or local bot state become public online authority.

Date: 2026-05-28
Observed: The next online step was to stop treating connected movement as a packet log only and start proving server-owned position state before any public WebSocket/Firebase provider exists.
Changed: Added `src/restored/online/marathon-server-state-contract.js`, extended `input_update` envelopes to preserve normalized direction/mode, wired `singularity-race.html` connected input publishing to send that direction/mode, and updated `src/restored/online/marathon-websocket-dev-server-mock.js` so accepted input advances server-owned runner state during `racing`. Added `tools/smoke-singularity-race-server-state.cjs` to simulate a short server-owned race from start to finish.
Verified: `node tools/smoke-singularity-race-server-state.cjs` passed with server-owned finish at 120m, finish time 56000ms, last sequence 58, and `movementAuthority: "server"` in the snapshot. `node tools/check-restored-marathon-contract.cjs` and `node tools/check-size.cjs` passed.
Blocked: This is still a local dev mock, not a public socket. The player page does not yet render authoritative server movement snapshots into the connected race view.
Next: Feed server-owned `state_snapshot` rows into the connected race renderer with reconciliation so the player page can visually follow server authority instead of local movement when `?devOnline=1`.
Do not: Trust client progress, local collision, or local finish packets for connected ranking, rewards, or anti-cheat.

Date: 2026-05-27
Observed: The human asked Codex to keep running the game and self-verify what blocks starting at the line, avoiding ping problems, and reaching the finish.
Changed: Opened the race progress clamp from `96` to `100`, added `LOCAL_FINISH_PROGRESS`, changed local finish from a cosmetic "finish ready" cue to a local server-owned finalization rehearsal, added `createLocalFinishRanking()`, updated the local bot sim finish clamp, and added `tools/smoke-singularity-race-progression.cjs` for repeatable progression/netcode checks.
Verified: `node tools/smoke-singularity-race-progression.cjs` passed with normal run finish in 252 seconds, sprint finish in 91 seconds, 30-runner server egress at 1881.6 kbps, degraded lane on bad ping, and `rate_limited` spam blocking. `node tools/check-restored-marathon-contract.cjs` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?adminLaunch=1` confirmed race-only UI, exactly three bottom controls, no normal hidden debug/skin/chat residue, no mobile horizontal overflow, countdown signal to `GO`, Shift+D movement, bots moving while the player stops, chat overlay focus, queue overlay with 30 slots, and a saved mobile race screenshot at `C:/tmp/singularity-race-race-verify.png`.
Blocked: Real public online is still not enabled; final ranking and anti-cheat authority must move to the real server transport before public release.
Next: Add server-owned movement/reconciliation behind a real WebSocket/Firebase transport so the client sends only input and receives authoritative snapshots.
Do not: Let client-owned local progress, local bot state, or local finish ranking become public online authority.

Date: 2026-05-27
Observed: The human asked to add a mobile circular key plus chat-window and skill buttons, and wanted PC to have the same support.
Changed: Added `race-input-controls` to `singularity-race.html`: a circular directional pad, skill button, and chat shortcut button. Wired pointer down/up/cancel to the existing WASD action key state, routed the skill button through the same E-skill path, routed the chat shortcut through the race chat overlay, hid movement controls while queue/chat overlays are open, and guarded pointer capture so synthetic or unusual desktop pointer events do not break the controls. Updated the marathon plan and contract check.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed mobile 390px and PC 1366px show the circular pad, `스킬 E`, `채팅 T`, and the existing three bottom controls without horizontal overflow; synthetic pointer down/up on `W` toggled the held state; the chat shortcut opened the chat overlay, focused input, and hid movement controls.
Blocked: None.
Next: Tune final in-game HUD placement around these controls after the race HUD redesign direction is chosen.

Date: 2026-05-27
Observed: The human asked for a final mobile race-screen pass with only three buttons: a queue button, chat open/close, and play start with `관리자 대기중`.
Changed: Added `race-mobile-controls` to `singularity-race.html`, wired queue/chat toggles through `raceQueueOpen` and `raceChatOpen`, made queue/chat overlays mutually exclusive, kept the play-start status disabled for host/admin authority, and made race slot rendering populate the overlay when opened from the race screen. Updated the marathon plan and contract check to guard the new mobile control surface.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke at 390px width confirmed `screen: race`, no horizontal overflow, exactly 3 visible bottom buttons, labels `대기열 보기`, `채팅창 열기`, and `플레이 시작 / 관리자 대기중`, disabled play-start status, a 30-slot queue overlay, and a chat overlay that closes the queue and focuses chat input.
Blocked: None.
Next: Redesign the final in-game HUD on top of these three mobile controls without reviving the old bottom-card stack.

Date: 2026-05-27
Observed: The human said the race screen still showed unwanted UI under the stadium and asked to remove it before redesigning the in-game interface.
Changed: Updated `singularity-race.html` so `race` hides the track header, action HUD, checkpoint strip, standings, debug packet rail, runner slot grid, queue actions, progress pill, trail caption, and `START GATE` text while keeping the stadium surface and runner objects visible. Updated the marathon plan and contract check to guard the race-only surface.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke at 390px width confirmed `screen: race`, no horizontal overflow, a 372x826 stadium scene, hidden topbar/room/chat/header/action/checkpoint/standing/packet/slot/queue/progress/caption UI, and no start-gate text.
Blocked: None.
Next: Redesign the in-game HUD from a clean stadium-only baseline instead of patching the old bottom cards.

Date: 2026-05-27
Observed: The human pointed out that `맵 미리보기` was still showing a cropped player-follow view with runners and HUD instead of the whole map.
Changed: Updated `singularity-race.html` so `mapPreview` uses a full-panel course overview, hides runner avatars/effects/HUD, uses preview-specific trail stroke sizes, ignores race clicks outside the race screen, and resets the track camera to the origin for the overview. Updated the marathon plan and contract check to guard the overview behavior.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke at 390px width confirmed `screen: mapPreview`, no horizontal overflow, a 342x608 map scene, hidden runners/HUD, and `translate3d(0px, 0px, 0px)` camera transform while the full course was visible.
Blocked: None.
Next: Keep the race screen player-follow camera separate from the map-preview overview and tune map labels only if the final art style changes.

Date: 2026-05-27
Observed: The requested named skin set made the first-use profile picker longer on phone-sized screens because the mobile CSS still forced skin cards into one column.
Changed: Updated `singularity-race.html` so the profile skin picker keeps three columns on mobile, trims profile-card spacing on narrow screens, and preserves the simple nickname/skin/start flow.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/skins/singularity-race-skin-presets.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke at 390px width confirmed the first-use profile screen shows the 12 race skins in a compact grid without horizontal overflow.
Blocked: None.
Next: Move on to the next visible simplification or gameplay/networking cleanup after the skin/profile entry stays stable.

Date: 2026-05-27
Observed: The human wanted Kaguya, Robot, GPichan, and the existing/additional `특붕이` back, renamed several meme skins, requested a blue armband on `완장`, and asked to add Sam Altman and Hassabis.
Changed: Updated `src/skins/singularity-race-skin-presets.js` with the requested skin names and ids, added Kaguya/Robot/GPichan/Sam Altman/Hassabis, changed `초록 밈러너` to `페페`, changed `차트 망령` to `완장` with a blue armband overlay, changed `떡상 기도맨` to `얀르쿤`, changed `물린 고양이` to `레이커즈와일`, and made the profile picker show up to 12 prioritized race skins.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/skins/singularity-race-skin-presets.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed the profile picker shows 카구야, 특붕이, 로봇, 지피쨩, 페페, 완장, 얀르쿤, 레이커즈와일, 샘 올트먼, 허사비스, 두머, and 도지 러너 without horizontal overflow.
Blocked: None.
Next: Verify the updated profile picker visually and keep casino/general-citizen presets out of Singularity Race.

Date: 2026-05-27
Observed: The human wanted the lobby, queue background, chat window, and race track to reference `PEPEANT/-drawing-world`, and said the black outer rail did not match the road surface.
Changed: Restyled `singularity-race.html` with a light paper-grid body, white glass panels, brighter room/queue/chat cards, Drawing World-like compact chat bubbles, a pale stadium field, and muted green-gray SVG rails around the warm road surface. Added `src/skins/singularity-race-skin-presets.js` and switched the race page to original meme-style skins so old casino/general-citizen, robot, GPichan, and Kaguya choices no longer appear in the normal race picker.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/skins/singularity-race-skin-presets.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed the profile screen uses the light paper-grid style with the new race skin names and no old casino/robot/anime skin labels, and direct race entry shows the pale stadium with muted green-gray rails instead of black curbs.
Blocked: None.
Next: Tune the exact race skin pack art/names and add mobile joystick/chat-bubble controls later if the Drawing World reference systems become part of the playable race input.

Date: 2026-05-27
Observed: After the requested HTML split, the next duplicated boundary was admin start signaling: `singularity-race.html` and `singularity-race-admin.html` both owned race-control storage keys, broadcast names, command parsing, and countdown command creation.
Changed: Added `src/restored/games/singularity-race-control.js` for dev-only start-countdown command creation, parse/read/write, broadcast publish/open, acceptance checks, and phase labels. Updated the player and admin pages to consume that module, and updated the marathon contract check plus marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html singularity-race-admin.html src/restored/games/singularity-race-control.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed an injected race-control `start_countdown` moves the player page to `race`, shows countdown `10`, keeps the start gate visible, hides chat and room panels, fills the 30-runner pack even from a fresh profile state, and has no horizontal overflow. Admin page smoke confirmed the host page loads, exposes the countdown button, and writes a future `start_countdown` command through the shared key.
Blocked: None.
Next: The next useful split is either collision/soft-pass math or action packet publishing, whichever starts growing first.

Date: 2026-05-27
Observed: After runner display helpers were separated, the remaining spaghetti risk was that queue/chat, track effects, local bot simulation, and dev packet relay all still lived inside the large `singularity-race.html` script.
Changed: Added `src/restored/games/singularity-race-queue.js`, `src/restored/games/singularity-race-track.js`, `src/restored/games/singularity-race-local-sim.js`, and `src/restored/games/singularity-race-dev-online.js`; updated `singularity-race.html` to consume those helpers; removed the old track-effect helper boundary from the contract plan; and updated the marathon contract check to validate the new modules.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/restored/games/singularity-race-queue.js src/restored/games/singularity-race-track.js src/restored/games/singularity-race-local-sim.js src/restored/games/singularity-race-dev-online.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed mobile `profile -> lobby -> queue -> mapPreview -> queue`, lobby chat/metrics hidden, 30 queue slots, queue chat visible, map preview showing 30 runners with chat/slots hidden, and no horizontal overflow.
Blocked: Final Playwright readback for a simulated admin countdown timed out after the storage event was sent; the race-control listener code was not changed by this split and remains covered by source/contract checks, but that manual browser readback should be repeated when the browser MCP is responsive again.
Next: After validation, the next meaningful split is race-control/admin start signaling or collision math, depending on which part grows first.

Date: 2026-05-27
Observed: After the player flow split, the next spaghetti risk was repeated runner/slot/HUD DOM creation inside the large `singularity-race.html` script.
Changed: Added `src/restored/games/singularity-race-runner-view.js` for runner avatar updates, queue slot rows, standings rows, checkpoint dots, packet rows, skill names, action status labels, and a validation helper. Updated `singularity-race.html` to consume those helpers while leaving camera, collision, and netcode smoothing math in place. Updated the marathon contract check and marathon plan to guard the new runner-view boundary.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `npm.cmd run check` passed. Browser smoke confirmed `profile -> lobby -> queue -> mapPreview -> queue`, 30 queue slots, 30 runner avatars/nameplates in map preview, 30 runner avatars/nameplates in direct race entry, 5 standings rows, 5 checkpoint dots, hidden chat/room panels in race, and no horizontal overflow. The preferred browser runtime failed to start in this sandbox, so the smoke used the same in-app Playwright fallback.
Blocked: None.
Next: Keep the remaining gameplay math in `singularity-race.html` until a server snapshot/reconciliation adapter needs a cleaner state boundary; the next useful split is likely track effects or action packet publishing.

Date: 2026-05-27
Observed: Final browser verification passed for the simplified player flow, so the next root cleanup was preventing the same lobby/queue/map-preview/race strings from spreading through `singularity-race.html` again.
Changed: Added `src/restored/games/singularity-race-flow.js` for screen ids, flow order, compact Korean labels, and a validation helper. Updated `singularity-race.html` to import the flow module for screen setup, button labels, panel copy, and queue slot rendering. Updated the marathon contract check to import and validate the flow module, and refreshed the marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/restored/games/singularity-race-flow.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed `profile -> lobby -> queue -> mapPreview -> queue`, 30 queue slots, Korean flow copy/buttons, no horizontal overflow, and a simulated `start_countdown` signal moving the page into `race`.
Blocked: None.
Next: Split the remaining large `singularity-race.html` rendering/gameplay clusters only when they become risky; the most useful next target is runner rendering plus action HUD helpers, because those are the parts most likely to tangle with future server snapshots.

Date: 2026-05-27
Observed: The next root cleanup was that `맵 미리보기` still entered the actual race screen, while the internal player state still used a vague `room` name and kept a hidden ready/status-strip path.
Changed: Updated `singularity-race.html` so the normal waiting state is `queue`, added a separate `mapPreview` state, changed the map preview button to toggle `queue -> mapPreview -> queue`, removed the dead top status-strip DOM and stale render-metrics branch, and kept `race` entry for admin/direct start paths. Also changed remaining visible development/start/skill system messages in the player page to Korean. Guarded the new queue/map-preview split in the marathon contract check and refreshed the marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?resetProfile=1` confirmed `profile -> lobby -> queue`, no status-strip DOM, 30 queue slots, visible chat, hidden track scene, and no horizontal overflow. Clicking `맵 미리보기` moved to `screen: mapPreview`, showed the track scene, hid chat/slots/room panel/action HUD, did not start the race, then `대기열로 돌아가기` returned to `screen: queue`. A simulated admin `start_countdown` control moved to `screen: race` with the track scene and countdown visible while topbar, room panel, and chat stayed hidden.
Blocked: None.
Next: Run marathon checks, full check, and browser-smoke `profile -> lobby -> queue -> mapPreview -> queue`, plus admin countdown into `race`.
Do not: Use `room` as the normal player screen state or let `맵 미리보기` start the real race.

Date: 2026-05-27
Observed: The human said the room waiting view still had too much UI and should become a simple queue. The queue should not show `1/30`, ready counts, duplicate room cards, English/debug labels, or explanatory clutter; it should show slots, a map preview button, and chat only.
Changed: Updated `singularity-race.html` so `data-screen="room"` hides the topbar subtitle, status strip, room panel, queue copy, badges, and chat channel tabs. Moved `맵 미리보기` into the slot panel, changed the room title to `대기열`, made normal queue slots render all 30 slots with simple Korean labels, and removed visible English race cue/system text from the local collision/start-gate path. Guarded the queue-only UI shape in the marathon contract check and refreshed the marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?resetProfile=1` confirmed the profile-to-lobby-to-queue flow. Desktop `1480x900`, mobile portrait `390x844`, and mobile landscape `844x390` queue views had no horizontal overflow, showed 30 slots plus `맵 미리보기` and chat, hid the status strip, duplicate room panel, channel tabs, `참가자`, `준비 완료`, `방 대기실`, `1 / 30`, `READY`, `ROOM`, and `CHAT`, and the map preview button moved to the race/map screen without bringing back room or chat panels.
Blocked: None for the local queue UI trim.
Next: Run static checks and browser-smoke desktop/mobile queue layouts before moving on.
Do not: Put participant metrics, ready metrics, ready buttons, duplicate room cards, channel tabs, or English debug labels back into the normal `대기열` screen.

Date: 2026-05-27
Observed: The human said the lobby itself should have no chat and no participant or ready-complete metrics, only a simple room list.
Changed: Updated `singularity-race.html` so `data-screen="lobby"` hides the topbar subtitle, status strip, chat panel, quick-entry button, and notice box. The visible lobby action is now a single `입장` button on the room card, with debug-only transport/protocol controls still hidden unless explicitly enabled. Guarded the lobby-only simplification in the marathon contract check and refreshed the marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?resetProfile=1` confirmed `screen: lobby`, visible room panel, hidden status strip, hidden chat panel, hidden track panel, hidden quick-entry button, hidden notice, `입장` as the only visible room action, and no visible `참가자`, `준비 완료`, or `채팅` text.
Blocked: None for the local lobby simplification.
Next: Browser-smoke the profile-to-lobby screen and keep room waiting/chat separated from the lobby list.
Do not: Put chat, participant counters, ready-complete counters, quick-entry buttons, or packet/debug rows back into `data-screen="lobby"` for normal players.

Date: 2026-05-27
Observed: The human pointed out that the in-game view was still overlapped by the waiting-room sidebar and lobby chat, so the race screen did not feel separated from the lobby.
Changed: Added race-screen CSS separation in `singularity-race.html` so `data-screen=\"race\"` hides the topbar, room panel, and chat panel, makes the track panel occupy the full grid, and keeps only the in-game stadium surface visible. The room `준비하기` action now moves into the race screen instead of leaving the player in the waiting layout. Guarded the race-only separation in the marathon contract check.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke confirmed the second ready click moves to `screen: race`, with `.topbar`, `.room-panel`, and `.chat-panel` hidden, `.track-panel` visible, one full-width grid column, and zero captured console errors.
Blocked: None for the local UI split. Real server room state still needs backend transport later.
Next: Keep tuning the in-game HUD density separately from lobby screens.
Do not: Render room waiting controls or lobby chat sidebars inside `data-screen=\"race\"`.

Date: 2026-05-27
Observed: The human said the standalone Singularity Race page was too crowded because nickname, skin, lobby, room, race, chat, packet logs, netcode rows, and dev authority labels were all visible together.
Changed: Reworked `singularity-race.html` around a player-facing screen state: `profile`, `lobby`, `room`, and `race`. First entry now asks for nickname and skin, then shows a compact room list, then a room waiting view with participant/ready/chat, then the race view. Existing dev connected gate, packet rails, netcode budget, full skin grid, and action packet rail are still present but hidden behind `?debug=1`. Normal chat now hides system/dev messages and shows a short empty state instead of old internal relay messages.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?resetProfile=1` confirmed the first screen shows nickname/skin/start, the lobby, room, and race screens hide `Connected lobby gate`, `join_request`, `state_snapshot`, `net_lane`, `server_egress`, `SERVER LOCKED`, and `DEV ROOM`, race labels are Korean, mobile 390px lobby has no horizontal overflow, and captured console errors were 0.
Blocked: Real public online still needs the backend transport and server-owned room/session state. This loop only simplified the player UI over the existing dev adapter.
Next: Tune the exact mobile layout density, then connect the simplified room flow to real server-owned room/session state when transport work resumes.
Do not: Put protocol packet rows, raw netcode metrics, raw room ids, or server authority debug labels back into the normal player path.

Date: 2026-05-27
Observed: The human wanted the admin page simplified into a future host/spectator camera surface, with Korean UI and no visible raw `connection gate`, channel count, stored message, or room packet metric dashboard.
Changed: Reworked `singularity-race-admin.html` into a Korean 방장 페이지 with 방 목록, `게임 바로 보기`, lobby link, whole-course map camera, selectable player watch list, 10-second countdown control, and separated chat. The page still reads dev relay state internally but the visible operator UI is now room/camera/player focused. Updated the marathon contract check and plan to guard the host-page shape.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race-admin.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm.cmd run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race-admin.html?devOnline=1` confirmed the title `특이점레이스 방장 페이지`, visible `방 목록`, `전체 맵 감시카메라`, `플레이어 보기`, and `10초 카운트다운 시작`, with no visible old `connection gate` / `room packets` / `stored messages` / `visible channels` dashboard tokens in the current snapshot and zero captured console errors.
Blocked: This remains dev-only. Real room authority, host authentication, server-owned room start time, moderation, and true spectator camera feeds still need the backend transport.
Next: Browser-smoke `singularity-race-admin.html?devOnline=1`, then connect the host camera to real server snapshots when WebSocket/Firebase transport exists.
Do not: Reintroduce raw packet/channel/message metrics as the primary admin UI or let the dev host page become public online authority.

Date: 2026-05-27
Observed: The next online-ready slice was not public online; the current stage needed server-owned `state_snapshot`, ping measurement, and reconciliation before a real WebSocket/Firebase transport is attached.
Changed: Added ping sample and reconciliation helpers to the marathon netcode contract, stamped dev connected snapshots with `serverOwned`, snapshot id, server tick/snapshot cadence, ping sample, and reconciliation metadata, and made the WebSocket-shaped dev server mock emit the same server-owned snapshot shape. The lobby netcode HUD now shows server snapshot, ping sample, and reconciliation guard rows.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/restored/online/marathon-netcode-contract.js src/restored/online/marathon-room-adapter.js src/restored/online/marathon-websocket-dev-server-mock.js tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed. HTTP checks returned 200 for `singularity-race.html?devOnline=1` and `singularity-race-admin.html?devOnline=1`. Browser checks confirmed the netcode HUD rows `server_snapshot`, `ping_sample`, and `reconcile_guard`, admin auto-join produced a `state_snapshot` from `server:dev-adapter`, the admin room monitor saw the same server snapshot, and console errors were 0.
Blocked: The first Browser-runtime connection attempt timed out, but the Playwright browser surface verified the pages afterward.
Next: Use these server-owned dev snapshots as the handoff point for the real WebSocket/Firebase transport adapter; keep final race state, checkpoint rewards, and rankings server-owned.
Do not: Treat dev snapshots as public online authority or accept client-sent race finalization, checkpoint rewards, or authoritative positions.

Date: 2026-05-27
Observed: The human reported that runner names appeared detached while sprinting or moving fast, and asked whether names should sit above or below the character given future health bars.
Changed: Added `.runner-nameplate` inside each `.runner-avatar` in `singularity-race.html`, pinned under the runner's feet. The existing avatar image and the nameplate now share the same positioned parent so movement interpolation, sprinting, collision animation, and camera motion keep them together. The marathon plan now records that the head area is reserved for future health bars/status effects.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and HTTP 200 for `http://127.0.0.1:4173/singularity-race.html` passed before the final full check.
Blocked: The in-app browser connection reported no active Codex browser pane, so the live visual nameplate check still needs manual confirmation in the open browser.
Next: Open the race page, sprint with `Shift`, and confirm the foot-level nameplate remains attached. Add the future HP bar above the sprite, not above the nameplate.
Do not: Render runner names as a separate track overlay or place name text above the head where it will conflict with HP/status UI.

Date: 2026-05-27
Observed: The human said runners still could not approach the road walls because an invisible buffer seemed to block movement before the visible edge.
Changed: Increased `ROAD_LANE_HALF_WIDTH_PX` in `singularity-race.html` from the conservative inner lane to a near-wall clamp that matches the visible road surface more closely. Added a marathon contract check so the lane clamp cannot silently shrink back below the near-wall threshold. Updated the marathon plan to document that runners should reach close to the visible walls while their centers stay inside the road.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and HTTP 200 for `http://127.0.0.1:4173/singularity-race.html` passed before the final full check.
Blocked: The in-app browser automation timed out while trying to open the page from `about:blank`, so visual wall-distance tuning still needs a manual/live browser pass.
Next: Open `http://127.0.0.1:4173/singularity-race.html`, move with `W/S` to both wall sides, and tune `ROAD_LANE_HALF_WIDTH_PX` down slightly if sprites overlap the black wall too much or up slightly if a buffer is still visible.
Do not: Reintroduce a large invisible wall buffer or let runner centers leave the road surface in local preview.

Date: 2026-05-27
Observed: The human clarified that runner contact should still be felt; runners should not pass through each other too freely, but collision must stay smooth.
Changed: Added soft collision impulse constants and helpers in `singularity-race.html`. `resolveSingleRailCollisions()` now applies small lane and progress separation when runners overlap in progress and road position, while `calculateSoftPassPressure()` uses the same body radius for speed drag. Updated the marathon plan and contract guard so this soft-contact layer remains visible to future checks.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed. HTTP check for `http://127.0.0.1:4173/singularity-race.html` returned 200.
Blocked: In-app browser and fallback browser automation were unavailable/closed during this loop, so visual collision feel still needs a live browser pass by opening the game and starting the countdown. The implementation remains local/dev preview only; real online collision must be server-owned.
Next: Open `singularity-race.html`, start from the admin countdown or local race-control command, and tune `SOFT_COLLISION_LANE_PUSH_PX` / `SOFT_COLLISION_PROGRESS_PUSH` if contact feels too sticky or too ghost-like.
Do not: Reintroduce hard walls, remove soft collision impulses, or trust local collision order for public online results.

Date: 2026-05-27
Observed: The human asked to fix bugs and review whether anything was still missing after the ping/anti-teleport work.
Changed: Cleaned the runner render cleanup path so removed runners also clear their visual smoothing cache in one guarded branch. Strengthened `tools/check-restored-marathon-contract.cjs` so `smoothRunnerVisualPoint`, `runnerVisuals`, `resolveRestoredMarathonVisualStep`, and the `anti_teleport` HUD row cannot be accidentally removed without failing the marathon check.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs src/restored/online/marathon-netcode-contract.js docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed. Local HTTP checks returned 200 for `http://127.0.0.1:4173/singularity-race.html` and `http://127.0.0.1:4173/singularity-race-admin.html?devOnline=1`; the served admin page includes the start button, direct game link, race-control storage key, and `start_countdown` command, while the served game page includes the admin link, anti-teleport HUD token, visual smoothing import, and 60ms preview loop.
Blocked: The Codex in-app browser pane was not available during this follow-up, so the race-phase visual/admin-click browser sample still needs a live browser pass. Public online is still not implemented; current protection is local/dev display smoothing and packet-pressure rehearsal only.
Next: When the browser pane is available, run the admin countdown from `singularity-race-admin.html?devOnline=1`, watch `singularity-race.html` enter `GO`, and sample race-phase runner jumps/console errors. After that, continue toward server-owned snapshots and reconciliation.
Do not: Remove the smoothing cache/HUD guard, draw remote corrections directly to the screen, or treat the dev adapter as public matchmaking.

Date: 2026-05-27
Observed: The human said ping management is the top priority and asked to prevent AI/bot teleport-looking bugs or stutter before real online transport.
Changed: Added a netcode visual smoothing policy in `src/restored/online/marathon-netcode-contract.js` and wired `singularity-race.html` so non-player runner display positions move through that max-step/snap-cap guard. The netcode HUD now shows the anti-teleport limits, and the marathon plan records that future server snapshots must render through this smoothing layer.
Verified: Browser sampling on `http://127.0.0.1:4173/singularity-race.html` confirmed the gate-locked page showed the `anti_teleport` HUD row, kept 30 runners, had zero console errors, and moved sampled bot positions with max jump about 4.38px and no jumps above 90px over 24 samples. The later race-phase browser attempt lost the active Codex browser pane before completion, so race-start visual sampling still needs a follow-up browser pass. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html src/restored/online/marathon-netcode-contract.js docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed.
Blocked: This is still a local/dev visual guard. Real public online still needs server-owned snapshots, ping measurement, reconciliation, and a connected WebSocket/Firebase transport.
Next: Re-run a race-phase browser sample after the in-app browser pane is available, then keep moving toward authoritative server snapshots with this display guard in place.
Do not: Draw remote/server runner corrections directly to the screen, or send per-frame positions as the online fix.

Date: 2026-05-27
Observed: The human said the local runner felt too slow, `Shift` should be the real speed-up, and the current down-lane movement looked faster than forward running.
Changed: Tuned `singularity-race.html` movement constants so staging has quick forward movement for start positioning, race sprint is much faster than normal running, and lateral lane movement is toned down. Updated the marathon plan and contract guard for the staging sprint constant.
Verified: Browser reload of `http://127.0.0.1:4173/singularity-race.html` confirmed the local page still opens with 30 runners, gate locked, and zero console errors. The marathon contract guard now asserts race sprint is at least 2.5x normal run, staging sprint is at least 2x staging run, and lane sprint stays capped so `W/S` does not become the main speed control. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed.
Blocked: None for local feel tuning. Real connected rooms still need server-owned movement balance values.
Next: Tune exact public race duration later through server-owned movement balance once connected room snapshots exist.
Do not: Let lane movement become the main speed mechanic or treat these local constants as final public online balance.

Date: 2026-05-27
Observed: The human reported that Singularity Race bots appeared to stop whenever the player stopped, which made the staging area feel player-driven instead of independently simulated.
Changed: Updated `singularity-race.html` so local bot advancement returns a `botsMoved` signal and `advanceActionPreview()` renders when bots move even if the player is idle. Guarded the regression with `tools/check-restored-marathon-contract.cjs`.
Verified: Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed the gate-locked local page keeps 30 runners, has zero console errors, and moves idle non-player bot screen positions by roughly 10-30px over 1.4 seconds without player input. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/ai-working-state.md`, and `npm run check` passed.
Blocked: None for the local staging preview. Real online rooms still need server-owned bot/player snapshots and interpolation.
Next: Continue toward server-owned race start, input buffering, and movement authority after local staging feel is accepted.
Do not: Tie bot visibility updates to local player input, or treat local bot movement as public online authority.

Date: 2026-05-27
Observed: The human said the one-line start should be removed, 30 runners should freely occupy the wide start space, the path should stay blocked until the admin page starts a 10-second countdown, and WASD should move freely on the road instead of only along one line.
Changed: Reworked `singularity-race.html` from start-line formation to a broad start paddock. Local runners now have lateral road offsets, pre-start bot drift, free WASD staging movement, gate-locked skill/attack behavior, a visible `START GATE`, and a `10` second admin-start countdown via separated race-control local storage/broadcast. Added `경기 시작 10초 카운트다운` to `singularity-race-admin.html?devOnline=1`, recording a monitor packet while keeping the control dev-only. Updated the marathon plan and contract guard.
Verified: Browser smoke confirmed `singularity-race.html` shows 30 runners scattered across the start paddock, not one line: top spread about 332px, left spread about 482px, 11 visual row buckets, visible `START GATE`, `GATE LOCKED` phase/status, and zero console errors. Admin smoke on `singularity-race-admin.html?devOnline=1` confirmed the start button is enabled in `DEV ADMIN`; clicking it sends a fresh command, the game page reads `9` seconds remaining, shows `COUNTDOWN`, keeps the gate visible during countdown, then after about 10 seconds switches to `RACING`, removes the gate, and stays error-free. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `git diff --check -- singularity-race.html singularity-race-admin.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md` passed before the final full gate.
Blocked: This is still dev/local race-control rehearsal. Real public online must move the start command, countdown time, gate release, position reconciliation, and collision pressure to server authority.
Next: Run the full gate, then continue toward server-owned start countdown, input buffering, authoritative 2D road position snapshots, and real WebSocket/Firebase transport.
Do not: Reintroduce a one-row start formation, let keyboard/attack/skill start the countdown, or treat the local admin control signal as public online authority.

Date: 2026-05-27
Observed: The human said the Singularity Race camera should be centered on the player.
Changed: Updated `singularity-race.html` to use centered X/Y camera anchors for the track world, refreshed the marathon plan language, and guarded the centered camera constants in `tools/check-restored-marathon-contract.cjs`.
Verified: Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed the player center was within about 0px horizontally and 0.2px vertically of the track-scene center at start and after preview movement to `YOU 6%`, with zero captured console errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed.
Blocked: None for the local camera. Real connected rooms still need server-owned movement while camera remains client-side display only.
Next: Continue toward server-owned start countdown, input buffering, and authoritative soft-collision reconciliation when the visual feel is accepted.
Do not: Move the camera anchor back toward the left edge unless the user explicitly asks for a look-ahead camera mode.

Date: 2026-05-27
Observed: The human said the road was still too narrow, the start should fit all 30 runners, runner contact should feel like sliding through pressure instead of hard blocking, and the start line should count down before release.
Changed: Updated `singularity-race.html` with 580px / 460px non-scaling trail strokes, a one-row 30-runner same-progress start formation, a local `3-2-1-GO` countdown triggered by preview/input/skill/attack, and soft pass pressure that slows and offsets crowded runners without clamping progress. Updated the marathon plan and contract check so the wide road, one-row start, soft pass, and countdown stay guarded.
Verified: Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed 30 runner avatars in one start row, row top spread under 1px, scene width 967px with runner bounds x=348..1252, `7600x2600` track world, 580px outline and 460px surface strokes, countdown `3` before movement, `LOCAL PREVIEW` after countdown release, preview movement to `YOU 6%`, and zero captured console errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed.
Blocked: Collision, countdown authority, and start placement are still local/dev previews. Real online rooms must own these rules on the server before public multiplayer.
Next: If the visual feel is accepted, move toward server-owned start countdown, input buffering, and authoritative soft-collision reconciliation.
Do not: Reintroduce hard local body blocking, split the start into separate progress positions, or let client-side countdown/collision become public online authority.

Date: 2026-05-27
Observed: The human said the race view was still too narrow, runners should stand side-by-side on the same starting line, walking looked choppy, and the track should feel long enough for roughly a 10-minute one-off race with content.
Changed: Updated `singularity-race.html` so the lobby stacks room/chat controls on the left and gives the stadium a much wider viewport. Expanded the track world to `7600x2600`, widened rail strokes, set all local/dev runners to `START_LINE_PROGRESS`, added a start-stretch visual spread that keeps 30 runners side-by-side before fading into the trail, kept the start pack collision-free until the release zone, reduced local run/sprint progress rates to long-race pacing, lowered the preview jump, and changed runner rendering to persistent DOM nodes with `left/top` transitions and a 60ms local tick. Updated the marathon plan and contract guard.
Verified: Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed a 967px-wide stadium viewport, `7600x2600` track world, 30 transparent runners spread from x=23 to x=951 on the same y=313 start line, `YOU 4%` at start, 118px/92px rail strokes, preview movement to `YOU 7%` with the player still visible, smooth avatar transition CSS, and zero captured console errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and `npm run check` passed.
Blocked: This is still a local/dev visual and pacing model. Real online movement duration, start formation, collision, interpolation, and checkpoints must be owned by the server simulation later.
Next: Re-run full checks after doc guard updates, then tune the course pacing or start camera only if the human wants a different race duration feel.
Do not: Compress the full course into the first viewport, stagger the initial pack by progress, or let the client-side 8-10 minute pacing become online authority.

Date: 2026-05-27
Observed: The human reported that the Singularity Race sprites had an unwanted dark translucent background, the map felt too small, the rail width looked wider near the top, the camera needed to follow the player on a huge map, and key skins such as `gpichan`, `robot`, and `kaguya` were not visible.
Changed: Updated `singularity-race.html` to wrap the SVG trail, effects, and 30 runner sprites in a `track-world` sized for a larger map and move that world with a player-follow camera. Converted the track strokes to non-scaling SVG strokes for a constant visible rail width, removed framed dark avatar backgrounds in favor of transparent sprite layers, widened the single-rail spacing for the larger world, corrected pointer-to-progress aiming for the moved camera, and changed the skin picker to render all playable presets with featured race skins first. Updated the marathon plan and smoke contract guard.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, `git diff --check -- singularity-race.html tools/check-restored-marathon-contract.cjs docs/plans/restored-marathon-stadium.md docs/ai-working-state.md`, and browser smoke on `http://127.0.0.1:4173/singularity-race.html` passed. Browser smoke confirmed 30 transparent-background runner avatars, a 2800x1180 camera-followed track world, player kept visible after preview movement, fixed 54px/42px trail strokes, all 15 playable skin cards, featured `gpichan`/`robot`/`kaguya` skin ids, and zero captured console errors.
Blocked: This remains a local/dev visual and collision preview. Real online cameras, interpolation, server-owned collision, and authoritative positions still need backend simulation.
Next: Tune the race scene width/side-panel layout only if the human wants more runners visible in the viewport at once; otherwise continue toward server-owned movement/collision.
Do not: Reintroduce dark sprite cards, fit the whole marathon route into the small viewport, or treat the client camera/collision preview as online authority.

Date: 2026-05-27
Observed: The human clarified that when entering the stadium, everyone should run together on one rail, runners should collide instead of passing through each other, and chat should be opened with `T`.
Changed: Updated `singularity-race.html` so the local lobby starts with 30 runners, renders runner avatars directly on the trail centerline, applies local-only single-rail collision spacing and bump feedback, blocks player dash/run movement behind the nearest runner ahead, and focuses chat with `T`. Updated the marathon plan and smoke check to guard the no-pass rail and chat hotkey.
Verified: Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed 30 runner avatars, 30 runner slots, 5 standings rows, `T` focusing `#chat-input`, preview movement producing `BUMP` collision feedback, and zero captured console errors. `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and `node tools/check-restored-growth-architecture.cjs` passed before the final full gate.
Blocked: Collision is still local/dev preview. A real online room must resolve rail order, collision, stalls, and player positions on the server before rankings or rewards.
Next: Verify the lobby, then later move this no-pass rail rule into the server simulation when real WebSocket/Firebase transport exists.
Do not: Treat local collision order as authoritative online movement, send per-frame local positions as truth, or let chat/admin traffic share the race action packet lane.

Date: 2026-05-27
Observed: The human said to continue after the admin direct-entry page. The next useful operator slice was making the dev-only room packet lane visible from the separate admin page.
Changed: Added a read-only room packet monitor to `singularity-race-admin.html?devOnline=1`, including a packet metric, latest packet rows, and netcode relay guard status from `src/restored/online/marathon-dev-room-transport.js`. Updated the marathon plan and smoke check so the admin monitor remains guarded.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `npm run check`, `git diff --check`, and browser smoke passed. Browser smoke seeded the dev room through `singularity-race.html?devOnline=1&adminLaunch=1`, then confirmed `singularity-race-admin.html?devOnline=1` shows `DEV ADMIN`, room `room:singularity-race:dev-001`, 24 room packets, monitor rows for `join_request`, `join_result`, `state_snapshot`, relay guard `clear`, and zero console errors.
Blocked: The monitor reads local dev relay storage only. It is not production admin authentication, public matchmaking, persistent server history, or authoritative race control.
Next: Verify the page, then later replace this observer lane with authenticated server room telemetry once the real WebSocket/Firebase backend is chosen.
Do not: Let the admin page write authoritative race packets, merge admin chat with race action packets, or treat dev query flags as production admin auth.

Date: 2026-05-27
Observed: The human asked to confirm the admin page link and make the admin page able to enter the game directly.
Changed: Added a primary `게임 바로 입장` action to `singularity-race-admin.html?devOnline=1`, pointing at `singularity-race.html?devOnline=1&adminLaunch=1`. Updated `singularity-race.html` so `adminLaunch=1` automatically performs the existing dev room join flow. Updated the marathon plan and smoke check to guard the admin direct-launch path.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, and browser smoke passed. Browser smoke confirmed the lobby `admin-page-link`, the admin `admin-direct-game-link`, admin `DEV ADMIN` mode, direct launch URL, automatic `DEV ROOM`, `join_result ok`, joined room code, `SERVER LOCKED`, and zero captured console errors.
Blocked: This is still a dev-only shortcut. It does not authenticate real admin authority or expose public online.
Next: When real backend/auth is chosen, replace this query shortcut with server-authenticated admin session checks.
Do not: Treat `adminLaunch=1` as production admin auth or expose connected admin controls without server-side authority.

Date: 2026-05-27
Observed: The local single-trail preview had visual cues, but the 30-runner room still felt static unless the user pressed the coarse preview button.
Changed: Added local-only bot pack advancement after keyboard, skill, attack, or preview-button start; added a compact `race-standings` strip that shows the top local runners plus YOU; added local rank cue handling; and updated runner slots to show progress percent. Updated the marathon plan and smoke check to guard the standings/bot-pack layer.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and browser smoke on `http://127.0.0.1:4173/singularity-race.html` passed. Browser smoke confirmed 30 runners, five standings rows, bot progress changes after local practice starts, SAVE 1 clearing, next SAVE 2 display, focus ring, and zero captured console errors.
Blocked: Bot movement and standings are local/dev preview only. They do not create authoritative online movement, rank, checkpoint, finish, or reward state.
Next: Continue toward a connected runtime/back-end adapter after choosing provider/auth, or add more local race-feel polish without presenting it as public online.
Do not: Send per-frame local bot/player positions as authoritative online data or trust local standings for rankings/rewards.

Date: 2026-05-27
Observed: After the single-trail map landed, the next useful local preview slice was making progress, save points, and action results visible without changing online authority.
Changed: Added the `track-effects` overlay in `singularity-race.html` with a player focus ring, progress/next-save pill, and short local visual cues for checkpoint, skill, hit, respawn, and finish-preview moments. The preview advance button now runs checkpoint detection, checkpoint detection can catch multiple crossed saves, and filling 30 local runners resets the local action race state. Updated the marathon plan and smoke check to guard the visual race-feedback layer.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, and browser smoke on `http://127.0.0.1:4173/singularity-race.html` passed. Browser smoke confirmed 30 runners, one focus ring, `SAVE 1` cue after preview advancement, SAVE 1 cleared, next SAVE 2 shown, five trail labels, five save lines, and zero captured console errors.
Blocked: The feedback layer is cosmetic local/dev preview only. It does not replace server-owned checkpoint, hit, respawn, finish, ranking, or reward authority.
Next: Add real connected runtime delivery or a local backend process only after the WebSocket/Firebase provider and auth/session boundary are chosen.
Do not: Treat visual cues as authoritative online results or expose dev-only connected behavior without `?devOnline=1`.

Date: 2026-05-27
Observed: The human provided a sketch of the desired Singularity Race map: a log-scale style curved marathon stadium, one shared trail, five save points, and a finish at the upper end.
Changed: Added `src/restored/games/marathon-trail-geometry.js`, wired the marathon course checkpoints to that five-save geometry, and changed `singularity-race.html` to render an SVG log-curve trail with checkpoint ticks, labels, finish mark, pointer-to-progress attack aiming, and 30-runner placement on the same trail. Updated the marathon plan, restored README, and marathon smoke check so the geometry stays guarded.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, and `npm run check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed 3 trail paths, 5 save lines, labels 1-5 inside the scene, 30 filled runners on the shared trail, and zero captured console errors.
Blocked: The trail is still a local/dev preview. Real online authority, live ping measurement, reconciliation, and server-hosted snapshots are not connected yet.
Next: Add connected transport runtime wiring or a local backend process only after choosing the WebSocket/Firebase provider and auth/session boundary.
Do not: Split runners into lanes, make checkpoint/finish results client-authoritative, or bypass the dev-only connected gate.

Date: 2026-05-27
Observed: The human said to continue after the server transport boundary. The safest next online step was a local WebSocket-shaped server rehearsal, not public online or Firebase secrets.
Changed: Added `src/restored/online/marathon-websocket-dev-server-mock.js`. The mock creates connected `websocket` transport snapshots, exposes a server-backed room adapter, owns server-side join results and state snapshots, accepts only client-owned chat/input/skill/attack packets, rejects client-sent server-owned finalization packets, and applies the existing netcode packet-pressure guard. Updated marathon checks and docs.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: This does not open an actual WebSocket port, run on a deployed backend, authenticate sessions, persist room history, or perform server simulation/reconciliation yet.
Next: Wire a real local `ws://127.0.0.1` development transport or backend process behind this mock shape, then connect the dev-only lobby to it without exposing public matchmaking.
Do not: Treat the mock as public online, let clients send `state_snapshot`, `checkpoint_reward`, `respawn_notice`, `race_finalized`, rankings, or rewards as authority, or add API keys/secrets to client config.

Date: 2026-05-27
Observed: The human clarified that Singularity Race is still not public online; the next step is to plug a real WebSocket/Firebase-like server transport behind the existing dev adapter boundary.
Changed: Extended `src/restored/online/marathon-server-transport-contract.js` with provider config for `websocket` and `firebase`, auth-mode metadata, connected snapshot creation, capability flags, and rejection of embedded secret-like config keys. Added `src/restored/online/marathon-server-room-adapter.js` for the server-transport-backed room shape, so a connected lobby can open from an injected server transport snapshot and server room list while default/dev behavior stays unchanged. Updated the marathon contract check and docs.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: No actual WebSocket server, Firebase app config, auth session, deployment, or public room registry was added. Those require explicit backend configuration and secrets outside this client contract.
Next: Add a local WebSocket dev server mock that consumes this transport contract, or choose Firebase/WebSocket backend details and auth/session rules before wiring a real provider.
Do not: Put API keys/tokens/secrets in client config, expose the server-backed adapter as public matchmaking without a connected backend, or make client-owned checkpoint/attack/finish data authoritative.

Date: 2026-05-27
Observed: The human expects to provide many MP3 files, photos, and character illustrations, and asked to start the structure plus likely bug-risk design before the asset volume grows.
Changed: Created the promoted `assets/restored/` folder guide structure for audio, images, source files, and manifest batches. Expanded `docs/baegeum-city-v2-restored-asset-pipeline.md` with shared character packs, Singularity Race-specific art/audio folders, optional collection metadata, and a bug-prevention plan. Extended `src/restored/assets/asset-manifest.js` with character/race/skill/skin/stadium image roles, source/status validation, collection helpers, and raw-inbox protection. Updated the intake tool so `--collection=singularity-race` routes character, skill, skin, stadium, UI, and audio files into race-owned folders. Updated asset/intake checks and related docs.
Verified: `node tools/check-restored-asset-pipeline.cjs`, `node tools/check-restored-intake.cjs`, and `node tools/check-size.cjs` passed.
Blocked: No actual new MP3/image files were provided in this loop, so no runtime asset entries were promoted yet.
Next: When files arrive, put them in `assets/inbox/`, run `node tools/intake-restored-material.cjs "<file>" --role=<role> --collection=<collection> --id=<asset-id> --write`, then promote approved runtime copies into `assets/restored/` and register manifest entries.
Do not: Reference `assets/inbox/` from runtime code, load high-resolution source masters directly, skip source/status metadata, or put feature-specific Singularity Race art into shared character folders unless it is truly reusable.

Date: 2026-05-27
Observed: The human asked to keep going after the 30-runner ping/optimization pass. The useful next online-before-real-online step was to block packet spam in the dev room relay, not add more visible race features.
Changed: Extended `src/restored/online/marathon-netcode-contract.js` with a packet pressure report and relay accept/reject helper for action packets. Wired `src/restored/online/marathon-dev-room-transport.js` to reject per-client `input_update`, `skill_use`, `attack_action`, `checkpoint_reward`, and `respawn_notice` spam above the 20 Hz input budget plus burst allowance while leaving join/snapshot room packets alone. `singularity-race.html` now renders a `relay_guard` budget row after the dev room joins. Updated the marathon plan, roadmap, restored README, index, plans README, and marathon smoke check.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?devOnline=1` confirmed `relay_guard`, `join_result ok`, room packet rows, and zero captured console errors.
Blocked: This still does not measure real network RTT/loss or perform server reconciliation. A real backend must consume this guard and add ping sampling, authoritative snapshots, reconnect recovery, lag compensation, and abuse logging.
Next: Add a backend-facing WebSocket adapter or a local dev server mock that can run the same packet pressure guard outside the browser before rankings/rewards.
Do not: Let clients bypass relay rate limits, mix chat/admin traffic into the action packet lane, or trust high-rate client input for hits, checkpoints, finish time, rankings, or rewards.

Date: 2026-05-27
Observed: The human called out that 30-player online racing will be limited by ping and optimization more than by raw feature count.
Changed: Added `src/restored/online/marathon-netcode-contract.js` to lock the 30-runner network budget before a real server exists: 20 Hz input requests, 10 Hz compact server snapshots, per-player upstream/downstream estimates, server egress estimate, input coalescing, interpolation delay, and adaptive network lanes (`smooth`, `buffered`, `degraded`, `critical`). Wired `singularity-race.html` to render the budget in the lobby so packet pressure stays visible during testing. Updated the marathon check, restored README, roadmap, index, plans README, and marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed the visible netcode rows: `net_lane`, `input_budget`, `snapshot_budget`, and `server_egress`, with zero captured console errors.
Blocked: Real network measurement, server-side lane decisions, packet loss simulation, rewind/reconciliation, and websocket transport are still future backend work.
Next: When a backend is chosen, make the server consume this netcode contract for tick rate, snapshot cadence, interpolation hints, and rate limiting before adding rankings or rewards.
Do not: Let clients send per-frame positions, raise snapshot rate without budget checks, mix chat/admin traffic into the race action stream, or make high-ping clients authoritative for hits/checkpoints/finish time.

Date: 2026-05-27
Observed: The human asked to finish the Singularity Race online-before-real-online slice. The remaining blocker was a dev-only room packet relay that could rehearse delivery between same-origin clients without claiming public server authority.
Changed: Added `src/restored/online/marathon-dev-room-transport.js` for room-scoped join/input/skill/attack/snapshot packet relay using local dev storage plus same-origin broadcast updates. Wired `singularity-race.html?devOnline=1` so after `join_result ok`, connected key and mouse inputs publish server-shaped request envelopes to the room packet rail while the action HUD remains `SERVER LOCKED`. Updated the marathon check, roadmap, restored README, and marathon plan.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html?devOnline=1` confirmed `DEV ROOM`, relay packet count, visible `join_result`, `state_snapshot`, `input_update`, `skill_use`, and `attack_action` rows, `SERVER LOCKED` action status, and zero captured console errors.
Blocked: This is still not a real backend. Public multiplayer still needs authenticated WebSocket/session handling, server-owned movement simulation, attack/checkpoint validation, moderation, reconnect recovery, and persistent room history.
Next: Choose and implement the real backend boundary for WebSocket room delivery, or keep building local race feel without presenting it as public online.
Do not: Treat dev room relay packets as authoritative race truth, expose it without `?devOnline=1`, or let client-owned action/checkpoint/finish results feed rankings or rewards.

Date: 2026-05-27
Observed: The next Singularity Race loop was to make the local action preview visible enough to inspect before real WebSocket delivery.
Changed: Added the standalone lobby action HUD for current checkpoint character, skill charge state, HP, local/server-lock status, cleared checkpoint strip, and a server-shaped action packet rail. The lobby now pushes `skill_use`, `attack_action`, `checkpoint_reward`, and `respawn_notice` envelopes from the existing restored contracts, while connected mode still locks local action authority. Updated the marathon plan and marathon check so the HUD remains guarded.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed title `특이점레이스 로비`, no public admin tab, 5 checkpoint dots, HP `100 / 100`, visible `skill_use` and `attack_action` packet entries after `E` and track click, and zero captured console errors.
Blocked: Real multi-user movement, checkpoint reward seeds, attack hit validation, down/respawn, moderation, and admin authority still need a backend transport. The current action rail is a local protocol preview only.
Next: Add the first real server transport adapter or a dev server mock that actually broadcasts movement/chat packets between two browser clients.
Do not: Treat the local action packet rail as real online authority, trust client-owned attacks/checkpoints/respawns, or expose admin/player channel writes without server-authenticated roles.

Date: 2026-05-27
Observed: The human defined the next Singularity Race gameplay direction: WASD movement, Shift sprint, E skills, mouse attacks that stall the attacker, N-stage checkpoint character assignment, rare one-use skills, and checkpoint respawn after down/death.
Changed: Added pure action-race contracts: `src/restored/games/marathon-input-contract.js`, `src/restored/games/marathon-character-skill-contract.js`, and `src/restored/games/marathon-combat-contract.js`. Extended the server transport contract with `skill_use`, `attack_action`, `checkpoint_reward`, and `respawn_notice` packet types. Wired the standalone lobby to a local action preview so `E` can use the assigned skill and mouse clicks run the attack contract, while connected mode remains server-authoritative. Updated the marathon plan, roadmap, restored README, indexes, and checks.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed the lobby still hides the admin channel, E skill use writes a local system message and advances the runner, mouse track click can hit a runner through the attack contract, and captured browser errors were zero.
Blocked: WASD hold movement was added as a local feel preview, but real online movement, skill validation, attack hit validation, checkpoint character seeds, and respawns still need the server transport/room authority. The meme-style characters are original homage labels, not copied external IP assets.
Next: Promote the local action preview into a dedicated race scene with visible checkpoints, HP/skill charge state, and a server-shaped packet rail for skill/attack/respawn before real WebSocket delivery.
Do not: Make client-side random character rewards, rare skill charges, attack hits, deaths, respawn positions, or final race ranking authoritative.

Date: 2026-05-27
Observed: After the dev chat relay, the next online-ready boundary was to define the server-facing transport shape without pretending a backend exists.
Changed: Added `src/restored/online/marathon-server-transport-contract.js` for unavailable-by-default server transport snapshots and validated packet envelopes for hello, join, chat, input, state snapshot, race finalization, and disconnect notices. Wired it into the marathon contract check and updated the marathon plan, roadmap, restored README, and plan indexes.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: No real WebSocket endpoint, auth session, room registry, rate limit, moderation store, or cross-client history exists yet.
Next: Implement the first real server boundary only when the backend location and auth/session rules are chosen; until then, keep server transport unavailable by default.
Do not: Make the dev transport look like public matchmaking, or accept client-owned finish/chat authority as server truth.

Date: 2026-05-27
Observed: The next safe step after separate admin/channel UI was to stop having lobby/admin pages directly own the chat storage path before real server chat exists.
Changed: Added `src/restored/online/marathon-dev-chat-transport.js` as a dev-only same-origin chat relay around the existing channel contract. Updated `singularity-race.html` and `singularity-race-admin.html` to send, seed, save, and subscribe through that transport; the closed admin page now disables chat input until `?devOnline=1` opens the dev admin gate. Updated marathon docs, restored README, roadmap, and the marathon contract check.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke confirmed the dev lobby still hides the admin channel, the closed admin page has disabled chat controls, the dev admin page exposes lobby/room/spectator/admin/notice channels, and there were zero captured browser errors.
Blocked: The Codex in-app browser only exposed one active local tab during the smoke test, so simultaneous real-tab BroadcastChannel behavior is covered by the transport contract check rather than a two-visible-tab browser run. Real cross-client chat still needs a backend/WebSocket transport.
Next: Add the first server-shaped transport adapter for join/input/snapshot/chat delivery while keeping local dev transport behind the explicit dev gate.
Do not: Put lobby, spectator, room, and admin messages back into direct page-owned localStorage logic or expose admin chat without the dev/server authority gate.

Date: 2026-05-27
Observed: The human emphasized that admin pages must be separate and channel-separated, with an in-game way to check them, to avoid future lag or system coupling.
Changed: Added an in-lobby admin-page link to `singularity-race.html`, kept it pointing at the dev-gated `singularity-race-admin.html?devOnline=1`, and changed lobby chat startup to load the channel-contract initial message set by default instead of unchannelled legacy fallback messages.
Verified: `npm run check` and `git diff --check` passed. Browser smoke from `singularity-race.html` confirmed the in-game admin-page link opens `singularity-race-admin.html?devOnline=1`, the admin page shows `DEV ADMIN`, admin sees lobby/room/spectator/admin/notice tabs, the lobby still does not expose an admin tab, initial chat messages are stored with channel ids, and there were zero console errors.
Blocked: Real admin auth, server delivery, moderation, and cross-client chat history still require a backend transport.
Next: Keep replacing localStorage dev chat with server-owned channel delivery; admin controls must remain separate from player/observer channels.
Do not: Merge admin, spectator, room, and lobby messages into one untyped runtime feed.

Date: 2026-05-27
Observed: The human asked for a separate admin page, separate spectator channel, visible channels, and chat windows before real online work.
Changed: Added `src/restored/online/marathon-channel-adapter.js` for lobby/room/spectator/admin/system channels and message shape. Added `singularity-race-admin.html` as a dev-only admin surface, added chat channel tabs to `singularity-race.html`, and made the lobby/admin pages share local dev messages through `singularity-race:chat:v1`. Updated marathon docs, roadmap, restored README, and checks.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke confirmed the normal lobby has lobby/room/spectator/notice tabs without an admin tab, the dev lobby can write a spectator-channel message, the dev admin page opens `DEV ADMIN` with lobby/room/spectator/admin/notice tabs, admin can read the spectator channel, admin can write an admin-only message, and the public lobby cannot see the admin-only message. Console errors were zero on the checked pages.
Blocked: Real multi-user delivery, moderation, admin authentication, and server-owned chat history still need a backend transport.
Next: Replace localStorage dev chat with server-owned channel delivery once the real online transport exists.
Do not: Treat localStorage chat as real multiplayer, expose the admin channel without server-authenticated admin authority, or let players send admin-channel messages.

Date: 2026-05-27
Observed: The human asked to finish the next online-before-real-online loop: dev-only connected marathon room adapter plus connected-only lobby gate.
Changed: Added `src/restored/online/marathon-room-adapter.js` with unavailable-by-default and explicit `dev_mock` modes, room summaries, version-gated join, `join_request`, `join_result`, and `state_snapshot` packets. Wired `singularity-race.html` so default mode keeps the connected gate closed, while `?devOnline=1` enables the dev room join and disables local bot filling after server-owned room join. Updated the marathon plan, roadmap, restored README, index, and plans README.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke confirmed default `singularity-race.html` stays `LOCAL` with the connected gate closed and join disabled, while `singularity-race.html?devOnline=1` opens `DEV READY`, joins the dev room, switches to `DEV ROOM`, emits `join_request`, `join_result`, and `state_snapshot`, disables local bot filling, updates the room channel, and reports zero console errors.
Blocked: Real public matchmaking still needs a real backend/server adapter; this dev adapter is deterministic and query-gated only.
Next: Add a real transport-backed marathon server adapter or wire room chat delivery once backend authority exists.
Do not: Expose the dev connected adapter without `?devOnline=1`, trust local race finish times for online rankings, or present dev room state as public online matchmaking.

Date: 2026-05-27
Observed: The human clarified that opening `baegeum-city-v2-dice.html` was wrong for Singularity Race and asked for the correct server/page again.
Changed: Added `singularity-race.html` as a standalone one-page local lobby for `특이점레이스`, with room status, 30 runner slots, readiness, local chat, preview runners, online packet labels, and skin selection using the existing Drawing World skin adapter. Updated the marathon plan/index/plan README so future sessions point the human to the Singularity Race route instead of the Baegeum City restore.
Verified: `npm run check` and `git diff --check` passed. Browser smoke on `http://127.0.0.1:4173/singularity-race.html` confirmed the page title, 30/30 filled runner slots, ready state, local chat message, selected Drawing World skin persistence, 12 skin cards, 12 track preview sprites, responsive mobile layout without horizontal overflow, and zero console errors.
Blocked: Real connected rooms still need a server adapter; the new lobby is deliberately local preview and does not claim live matchmaking.
Next: Browser-verify `http://127.0.0.1:4173/singularity-race.html`, then add a connected-only server adapter when online authority is available.
Do not: Present the local lobby as real online matchmaking or route Singularity Race users to `baegeum-city-v2-dice.html`.

Date: 2026-05-27
Observed: The first marathon preview worked, but the user asked to keep building. The HTML shell was at the line limit, so further work needed to stay inside restored modules.
Changed: Kept HTML unchanged and improved `marathon-stadium-view.js` with one-minute strategic race ticks, a Next Split field, and a visible read-only online packet rail for `join_request`, `input_update`, `state_snapshot`, and checkpoint/finalization packets. Adjusted marathon stamina pacing so one sprint turn advances meaningfully without draining the runner to zero.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `npm run check`, and browser smoke passed. Browser smoke entered the stadium, clicked `sprint`, confirmed `1:00`, `516m / 42,195m`, `72%` stamina, visible `state_snapshot`, and no browser error logs.
Blocked: Real connected rooms still need a server adapter and connected-only lobby entry.
Next: Add a dev-only connected marathon room adapter or a local finish/medal result surface without trusting local results for online ranking.
Do not: Add more logic to `baegeum-city-v2-dice.html`, expose offline rooms as online, or make client finish times authoritative.

Date: 2026-05-27
Observed: The human approved building a large 2D online-ready marathon stadium and asked to avoid script/file sprawl while preparing online needs.
Changed: Added `docs/plans/restored-marathon-stadium.md`, a compact marathon contract, one local stadium preview view, a Baegeum place/catalog entry, HTML mounting from `marathon_stadium`, and a single smoke check wired into `npm run check`.
Verified: `node tools/check-restored-marathon-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, `npm run check`, and browser smoke on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` passed. Browser smoke entered guest mode, moved to Baegeum City, opened the marathon card, confirmed 30 runners, clicked `sprint`, saw progress update to 43m and stamina to 88%, and found no browser error logs.
Blocked: Real connected rooms still require a server adapter; the current stadium is local practice with online packet/authority vocabulary prepared.
Next: Add a connected-only marathon room adapter/mock test path or improve the local race with camera/finish pacing before live server work.
Do not: Show a fake offline online lobby, trust local finish times for online rankings, or split the first marathon system into many small protocol files.

Date: 2026-05-27
Observed: The next safe job-system slice after work history was fixed part-time reliability, not broader company or business jobs.
Changed: Added `src/restored/jobs/life-job-fixed-contract.js`, seeded and preserved `fixedJobContract`, exposed fixed-job registration from life-job panels, updated result application so matching shifts raise attendance/reliability, and documented the local-only boundary.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed. Browser smoke used the Chrome fallback because the in-app automation pane was unavailable; it registered fixed MacBurger work, completed two steady shifts, returned to My Info, and confirmed `2회`, `91,200원`, `고정 알바: 맥버거 알바`, `성실도 22`, and no browser error logs.
Blocked: In-app browser automation reported no active Codex pane, so the final UI smoke used the same browser plugin's Chrome surface instead.
Next: Add absence/missed-shift events or relationship trust/stability reactions that consume the fixed-job contract through an event boundary.
Do not: Trust local fixed-job reliability for online rankings or mutate partner state directly from job handlers.

Date: 2026-05-27
Observed: Short approval meant continuing the next safe job-system slice after building-entry verification. The next documented step was work history/streaks before fixed part-time contracts or broader company/business tiers.
Changed: Added persisted `jobHistory` and `jobStats` fields, recorded history when life-job result envelopes are applied, rendered the My Info work-history card through `src/restored/jobs/life-job-history-view.js`, and updated the life-minigame plan/checks.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-player-profile.cjs`, and `npm run check` passed. Browser smoke completed two fast-food shifts and confirmed My Info shows 2 shifts, 91,200원 total work income, a 2-shift streak, and saved `jobHistory/jobStats` with no page errors.
Blocked: None.
Next: Add fixed part-time contracts or work absence/reliability events on top of this history state.
Do not: Trust local `jobStats` for future online rankings or make work history mutate relationships outside the event boundary.

Date: 2026-05-27
Observed: The human asked for a simple but broad minigame/job system where each building can be entered. The existing implementation had real panels for only a few location actions, and Baegeum job-street cards were informational rows rather than entry points.
Changed: Expanded the starter life-job catalog, mapped additional building actions to job minigame panels, added Baegeum job-street entry buttons, added a thin restored building-entry router in the HTML shell, and let library/university/company entry actions reuse the study/career panel.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-restored-study-career-contract.cjs`, `node tools/check-restored-city-frontage-contract.cjs`, `npm run check`, and browser smoke passed. Browser smoke confirmed 12 Baegeum job-street entry buttons and working PC room, delivery, library, company, and factory building panels with no page errors.
Blocked: None.
Next: Add work history/streaks or fixed part-time contracts after the building-entry path is verified.
Do not: Add more permanent bottom nav tabs for every building or describe ordinary wages as DP/DPA.

Date: 2026-05-27
Observed: Short approval meant continuing the next safe job-system slice. The labor/career contracts were mostly corrected to won, but one phone-news job story still described work as a DP supply source, and live starter job buttons still looked too much like wage-only choices.
Changed: Replaced the remaining job-news DP wording with won/cash income wording, guarded that rule in the news-cycle smoke check, localized starter job names/tasks to Korean, and made life-job preset buttons preview wage, energy, mental, time, and reputation before applying effects.
Verified: `node tools/check-restored-news-cycle-contract.cjs`, `node tools/check-restored-life-job-contract.cjs`, `git diff --check`, and `npm run check` passed. Browser smoke confirmed the fast-food and labor-office panels show Korean job/task copy, won wages, and energy/mental/time/reputation previews without `DP`/`DPA` leakage.
Blocked: None.
Next: Keep building the labor loop with work history/streak or a dedicated fixed part-time contract before adding broader company or business tiers.
Do not: Describe ordinary labor, company wages, or study tuition as DP/DPA income.

Date: 2026-05-27
Observed: The user corrected the job-system direction: ordinary work income should be 원, not DP. The live job/career contracts still labeled wages and tuition as DP even though normal cash is separate from DPA.
Changed: Switched life-job wages, study tuition, and company wages from DP labels to won/cash labels in contracts, place views, smoke checks, and planning docs. Kept DPA reserved for Dice City exchange/casino token flows.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-restored-study-career-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, and `npm run check` pass. Browser smoke confirmed the fast-food life-job panel and study/career panel render `원` labels and do not leak `DP`/`DPA` labels in those wage/tuition surfaces.
Blocked: None.
Next: Keep the first labor loop focused on 맥버거, 편의점, and 물류/인력소 work before adding broader occupation tiers.
Do not: Rename ordinary wages to DPA/DP or mix casino token balances with normal cash income.

Date: 2026-05-27
Observed: The live phone news app existed, but market cycle updates still pushed flat legacy message strings into `newsHistory`, so the phone did not feel like a real in-world news app.
Changed: Added the pure restored news-cycle contract, wired the HTML market/crash/AI news paths through normalized news items, upgraded the phone news renderer to source-labeled article cards, added a news-cycle check to `npm run check`, and refreshed the phone/market planning docs.
Verified: `node tools/check-restored-news-cycle-contract.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, phone news app visibility, one structured news card, AI reporter source label, headline/impact text, and no captured page errors beyond the existing favicon 404.
Blocked: None.
Next: Connect later AI supercycle and market regime changes to the news contract through neutral event envelopes before adding more market classes.
Do not: Pull live external news data, use real-company branding, or let news cards mutate market, relationship, credit, or mental state directly.

Multimap safety remains verified:

1. Pre-multimap backup exists at `C:\Users\rneet\OneDrive\문서\baegeum-city-v2-backups\pre-multimap-20260526-114932`.
2. `src/data/map-registry.js` owns `baegeum-city` and `dice-city` ids, scene ids, draft keys, spawn ids, and world channels.
3. `src/data/world-editor-draft.js` now reads map-specific draft keys first, allows baegeum-only legacy fallback, and keeps dice-city isolated from legacy draft data.
4. The current editor has an `activeMapId` selector and can edit both `baegeum-city` and the separate `dice-city-v0` base map.
5. `dice-city-v0` contains road/spawn/building-shell/scenery base data plus copied blackjack, odd-even, and horse-track venue anchors with doors and signs. It does not contain moved originals or betting logic changes.
6. `src/data/map-transitions.js` owns the baegeum-city -> dice-city and dice-city -> baegeum-city bus-terminal `map_transition` objects.
7. `src/systems/map-transition-runtime.js` creates a `map_transition` action and `player_state_patch` that switches `mapId`, `sceneId`, `spawnId`, and `chatChannelId` together.
8. The bus-terminal interactions are playable in-game from baegeum-city to dice-city and back to baegeum-city.
9. `tools/smoke-casino-copy-contract.cjs` now guards that copied casino anchors do not delete or reuse the baegeum-city originals.
10. `src/scenes/city-startup.js` supports dev-only `?map=dice-city&spawn=dice-blackjack-casino-01` style verification starts.
11. Browser verification confirmed the copied dice blackjack venue door, interior entry, venue channel, and online room state.
12. `src/renderers/simple-scenery-renderer.js` renders dice-city trees, brush, streetlights, and billboards.
13. `dice-city` building shells are intentionally not converted into enterable casinos by runtime generation.
14. `src/data/baegeum-city-compact-layout.js` applies `baegeum-city-compact-layout-v2` to runtime/editor maps. The browser Iron Line map is compacted from height 5600 to 2800 by scaling y positions, object heights/radii, spawns, bus terminal anchor inputs, scenery, roads, and nav nodes together.
15. `src/data/city-district-contract.js` now defines `life_hub` for `baegeum-city` and `gambling_night` for `dice-city`, including allowed new building types, district ids, and `legacy_preserved` status for current baegeum casino originals.
16. Do not shrink `baegeum-city` further by changing only `height`. `tools/smoke-baegeum-map-shrink-readiness.cjs` still guards that any future shrink must keep roads, walls, spawn, terminal, scenery, and nav inside the target height.
17. `src/data/baegeum-city-urban-layout.js` applies `baegeum-city-urban-layout-v1` to runtime/editor baegeum maps. It mutes the ground away from battlefield green, removes red/blue base overlays and legacy `base-wall` objects, replaces them with `city-boundary` outer tunnel/wall objects, and removes battlefield scenery such as sandbags, barricades, and rubble.
18. The map editor build palette is now city-role aware. `baegeum-city` exposes a `도시` tab for infrastructure shells plus lifestyle/civic `building_shell` presets, while `dice-city` exposes casino/back-alley/nightlife `building_shell` presets.

Current bug-first economy/code-health audit state:

1. Phase 1 inventory is recorded in `docs/ai-code-health-inventory-2026-05-26.md`.
2. The first runtime-state facade repair is implemented in `src/systems/runtime-state-facade.js`.
3. `src/scenes/city-scene.js`, `src/ui/world-chat-panel.js`, `src/ui/mobile-action-controls.js`, `src/ui/exchange-atm-panel.js`, `src/ui/odd-even-table-panel.js`, `src/ui/player-status-hud.js`, `src/devices/phone/mammon-phone-shell.js`, `src/devices/phone/dis-preview.js`, `src/systems/interior-interaction-runtime.js`, and `src/systems/local-action-runtime.js` now use the facade, with `tools/smoke-runtime-state-facade.cjs` in `npm run check`.
4. Venue metadata persistence now writes through `writeStoredVenueMetadata` instead of bypassing normalization.
5. `src/systems/local-storage-diagnostics.js` now starts the persistence bug-hunt pass with read-only localStorage status inventory.
6. Economy, ledger, venue metadata, and world-editor draft readers now expose corrupt-storage status without changing their fallback behavior.
7. Money-affecting ledger effect failures now flow through `src/systems/local-ledger-effect.js`, so exchange ATM and odd-even bet reservation can report `missing_effect`, `missing_economy_record`, or `record_failed` instead of silently returning `false`.
8. `src/systems/game-action-master.js` now exposes payload clone failures with `payloadCloneStatus` and `payloadCloneReason` while preserving the safe `{}` fallback.
9. `src/data/economy-loop-contract.js` now keeps the money source/sink/exchange/transfer/betting/time/market/server-authority gaps visible and smoke-verified.
10. `WorldClock` now exports `WORLD_CLOCK_DEFAULT_MINUTES_PER_SECOND = 1`, and `tools/smoke-world-clock.cjs` guards that the official default stays 1 game minute per real second.
11. `src/systems/odd-even-round-runtime.js` creates local `bet_settled` and `bet_refunded` action envelopes, and `src/ui/odd-even-table-panel.js` now uses them for local result/refund testing.
12. `src/systems/odd-even-round-state.js` persists odd-even round close state under `baegeum-city:v2:odd-even-rounds`; reconnect recovery is still not implemented.
13. `src/systems/local-storage-workflow.js` summarizes diagnostics into `clean`, `stale`, `corrupt`, or `unavailable` and marks blocking stale state for economy, ledger, odd-even rounds, editor drafts, and venue metadata.

Horse-racing venue work is paused before gambling logic:

1. The horse-racing venue should preserve the provided visual draft as a map/interior layout.
2. The design includes a golden scoreboard, 5-lane track, grandstand seating, ticket/betting windows, and an always-available exchange ATM.
3. This slice must stay "Map Design Only"; no race simulation, odds settlement, payouts, rankings, or online authority behavior should be added until the round/ledger contract is documented.

Construction UX remains a paused work-queue slice:

1. Pinned construction presets are implemented.
2. Construction palette category folding is implemented.
3. Current categories are `고정`, `도시`, `건물`, `자연물`, `거리 시설`, and `광고/간판`.
4. World-object taxonomy now separates `building_shell` from `venue_anchor`.
5. Building shell cards are implemented as placement-only `빈 상가`, `빈 카지노`, and `골목 상가`, with 소형/기본/대형 size cycling.
6. Odd-even `bet_reserved` is implemented and smoke-verified; do not settle results yet.
7. The first 10-minute play loop is now the product north star for deciding whether new slices belong in v0.

Date: 2026-05-27
Observed: The human approved starting the stock-market direction after defining four market classes: Domestic, United States, Crypto Spot, and Crypto Leverage. The live restored app already has stock/futures phone views, but market ticks and trade handlers remain in the HTML shell and should not expand without a contract.
Changed: Added `docs/plans/restored-stock-market-system.md`, linked it from `docs/INDEX.md` and `docs/plans/README.md`, referenced it from the phone app ecosystem plan, and guarded it in `tools/check-restored-planning-kit.cjs`. The plan fixes Baegeum Electronics as V0.1, DP-only prices, virtual OHLCV candles, no live financial data, and a staged path for United States, Crypto Spot, and Crypto Leverage.
Verified: `node tools/check-restored-planning-kit.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: No market runtime code changed. Baegeum Electronics catalog fields, virtual candle generation, order/effect envelopes, and DP-only stock UI are still pending.
Next: Add a pure restored market contract/simulator for Baegeum Electronics before changing the live phone stock app or moving money through new handlers.
Do not: Implement all four markets at once, use real-company branding or live data, show KRW/USD in restored market UI, or add leverage outside the Crypto Leverage market.

Date: 2026-05-27
Observed: The stock-market plan called for a pure Baegeum Electronics simulator before any live phone UI or money mutation changed. The restored HTML still owns legacy stock/futures handlers, so the first code slice needed to stay isolated.
Changed: Added `src/restored/systems/market-contract.js` with the restored market contract version, four market ids, Baegeum Electronics metadata, deterministic virtual OHLCV generation, snapshot summaries, DP formatting, holding P/L quotes, and buy/sell order previews. Added `tools/check-restored-market-contract.cjs`, wired it into `npm run check`, and updated the stock-market plan.
Verified: `node tools/check-restored-market-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: The live phone stock app still renders the old catalog and the HTML still mutates cash for current stock trades. No UI wiring or save migration was attempted in this slice.
Next: Build a non-mutating phone stock-app adapter/view that can render the Baegeum Electronics snapshot and DP text from the market contract before replacing legacy trade handlers.
Do not: Wire the order preview to live cash, add market tabs, or rename the current saved stock fields until a save-compatible adapter exists.

Date: 2026-05-27
Observed: The Baegeum Electronics market contract existed, but the live phone stock app still showed legacy NASDAQ-style rows and KRW-formatted prices.
Changed: Rebuilt `src/restored/phone/stock-app-view.js` as a non-mutating Baegeum Electronics adapter. It now renders a DP-only Baegeum Securities ticker, virtual candle chart, Baegeum Electronics market row, and holding/P&L summary from `market-contract.js`. The stock app HTML label now says Market / 배금전자 instead of Market Cycle / NASDAQ, and checks now guard that the live adapter avoids legacy trade modal entry points and legacy symbols.
Verified: `node tools/check-restored-market-contract.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed the phone stock app opens to 배금전자, shows a DP price, renders one candle chart shell, has no legacy NASDAQ/TSLA/AAPL/NVDA symbols, and has no legacy `openTradeModal` buttons. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: Buy/sell still does not mutate DP or holdings. A market order application boundary and save-compatible holding state are still required before the buttons can become active.
Next: Add a market order application module that consumes `createRestoredMarketOrderPreview()` and returns state/effect envelopes for one-share buy/sell without putting formulas back into the HTML shell.
Do not: Add United States, Crypto Spot, Crypto Leverage, live financial data, or relationship/mental mutations before the Baegeum Electronics order loop is stable.

Date: 2026-05-27
Observed: The phone stock app showed Baegeum Electronics, but buy/sell was still disabled and no save-compatible market holding state existed.
Changed: Added `src/restored/systems/market-order-application.js` for local one-share buy/sell application, seeded and preserved `markets` state, added `getRestoredMarketPortfolioValue()` to total asset selectors, activated the phone stock app buy/sell buttons through `tradeRestoredBaegeumStock()`, and extended market/phone checks. Browser verification found and fixed a visible-price vs fill-price mismatch by sharing the Baegeum Electronics snapshot defaults between the phone view and order application.
Verified: `node tools/check-restored-market-contract.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed stock-app buy reduces DP, creates a saved `domestic:baegeum-electronics` holding with 1 share, appends an order, matches the visible 72,741 DP price to the filled order price, shows the 1-share portfolio row, then sell restores the holding to 0 and appends the second order. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: The order path is still local-prototype authority and only covers Baegeum Electronics. It does not yet add fees, ledger entries, market tabs, AI-event price advancement, relationship hooks, or online/server order authority.
Next: Add a small order-history display or move toward market snapshot advancement before adding United States/Crypto tabs.
Do not: Add the other three markets or leverage before the Baegeum Electronics order loop and saved holding display are stable.

Date: 2026-05-27
Observed: The human asked to add the other minigames and job experiences, including convenience store, pawnshop, and fast-food. Dice City gambling, pawnshop, and loan-office contracts already existed, while ordinary work minigames had no contract boundary yet.
Changed: Added `docs/plans/restored-life-minigame-system.md`, `src/restored/jobs/life-job-contract.js`, and `tools/check-restored-life-job-contract.cjs`. The new contract covers convenience-store and fast-food shifts with deterministic task decks, S/A/B/C/D/F scoring, DP wage envelopes, player condition effects, relationship hooks, and high-grade inventory bonus envelopes. It is wired into `npm run check` and the planning-kit guard.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: No live UI adapter was wired. Job results still need to flow through the existing action/effect ledger path before the restored HTML can mutate cash, energy, inventory, or relationship logs.
Next: Build a convenience-store UI adapter first, then fast-food, using `createRestoredLifeJobResult()` as the only wage/condition source.
Do not: Recreate job rewards as direct HTML cash buttons or mutate partner state directly from job minigame handlers.

Date: 2026-05-27
Observed: The life-job contract was isolated and the next smallest useful slice was to make supported house-front place buttons feel playable without growing the restored HTML into another reward formula hub.
Changed: Added `src/restored/jobs/life-job-place-view.js` for convenience-store and fast-food job panels, added `src/restored/jobs/life-job-result-application.js` for applying returned envelopes to the current restored state, wired `completeLifeJobShift()` in `baegeum-city-v2-dice.html`, added `burger_coupon` as a known consumable item, and added a `job_completed` relationship event path.
Verified: `node tools/check-restored-life-job-contract.cjs`, `node tools/check-restored-relationship-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Browser plugin verification could not access an active Codex browser pane, so no live click-through screenshot verification was completed in this slice.
Next: When browser access is available, visually verify house-front -> convenience-store/fast-food panels and shift buttons. Then choose either the labor-office adapter or pawnshop UI adapter as the next minigame surface.
Do not: Add another inline reward formula to `baegeum-city-v2-dice.html` or mutate partner state directly from a job button.

Date: 2026-05-27
Observed: The labor-office place already existed in the location navigation, but the life-job contract only covered convenience-store and fast-food work.
Changed: Split the starter job catalog into `src/restored/jobs/life-job-catalog.js`, added `job:labor-office`, mapped the `labor_office` place action in `src/restored/jobs/life-job-place-view.js`, made job result application read the title from the job contract, and added `work_gloves` as the labor-office high-grade reward item.
Verified: `node tools/check-restored-life-job-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Browser plugin verification remained unavailable, so the live in-app labor-office click path still needs visual verification.
Next: Browser-verify house-front -> labor-office panel. After that, the next safe minigame direction is a pure pawnshop UI adapter or a delivery-rush contract.
Do not: Add more job rewards directly inside the HTML shell or expand into pawnshop/debt state through the ordinary life-job contract.

Date: 2026-05-27
Observed: The human asked to add a library, university, and company grind path so the player studies, qualifies for work, earns DP, and advances through job levels.
Changed: Added `docs/plans/restored-study-career-system.md`, `src/restored/career/study-career-contract.js`, `src/restored/career/study-career-application.js`, `src/restored/career/study-career-place-view.js`, and `tools/check-restored-study-career-contract.cjs`. Restored initial/storage state now seeds `education` and `career`, Baegeum place catalog now includes library/university/company district places, and `baegeum-city-v2-dice.html` mounts the study/career panel under Baegeum City jobs.
Verified: `node tools/check-restored-study-career-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, bus travel to Baegeum City, visible library/university/company buttons, study-gated company unlock, and company shift display separating worked-level wage from promotion label. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: Company levels are still a compact deterministic lane; no university semester calendar, interview event, office minigame screen, resume UI, ranking integration, or relationship reaction has been added yet.
Next: Add a richer company-work choice view or My Info education/career summary before expanding into interviews, resumes, or ranking-by-job.
Do not: Bypass study gates, merge company level with wealth rank, add company wage formulas inside the HTML shell, or make university/company progression depend on online state.

Date: 2026-05-27
Observed: The new study/company loop was playable, but My Info did not yet show study credits, study hours, company level, or promotion progress, making the progression easy to miss.
Changed: Added `src/restored/career/study-career-summary-view.js`, expanded `tools/check-restored-study-career-contract.cjs` to validate it, and mounted a read-only `교육 / 커리어` card in My Info. The card renders credits, study hours, intelligence, current company level, next level, qualification status, and promotion progress without adding My Info action buttons.
Verified: `node tools/check-restored-study-career-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry and the My Info `교육 / 커리어` summary with current company level, next level, credits, study hours, intelligence, and promotion progress. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: No interview/resume UI, office minigame screen, semester calendar, job ranking, or relationship reaction was added.
Next: Add a richer company-work choice view or a small job-history/reputation selector before interviews, resumes, rankings, or relationship reactions.
Do not: Turn My Info into an action surface, bypass study gates, merge company level with wealth rank, or add company wage formulas inside the HTML shell.

Date: 2026-05-27
Observed: The company lane still had a single generic company work button, so it risked becoming a flat cash generator even though study gates and My Info summaries were in place.
Changed: Added company shift presets to `src/restored/career/study-career-contract.js`: `career:company-shift:documents`, `career:company-shift:overtime-report`, and `career:company-shift:team-support`. Rebuilt `study-career-place-view.js` so Baegeum City jobs shows a company work choice section, and updated `completeStudyCareerAction()` to route all company shift ids through `createRestoredCompanyShiftPresetResult()`.
Verified: `node tools/check-restored-study-career-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, `git diff --check`, and `npm run check` passed. Browser verification confirmed Baegeum City jobs shows 도서관 공부, 대학 야간강의, and the three company work choices; clicking 야근 보고서 updated cash, job title, and My Info education/career summary. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: No job history, job reputation, interview/resume UI, office minigame screen, or relationship reaction has been added yet.
Next: Add a small job-history/reputation selector or event log before expanding to interviews, resumes, rankings, or relationship reactions.
Do not: Add wage/progression formulas inside `baegeum-city-v2-dice.html`, bypass study gates, or turn My Info into an action surface.

Date: 2026-05-27
Observed: Post-backup structure verification passed static checks, but browser probing of the Baegeum City job surface showed locked company-shift buttons with nested double quotes in their inline `onclick` attributes. Those buttons could be parsed as broken attributes before showing the condition-failure toast.
Changed: Updated `src/restored/career/study-career-place-view.js` so disabled study/career buttons emit safe single-quoted `showToast(...)` calls with escaped payloads. The exact Korean UI labels were preserved, while the validation moved from brittle label matching to stable action-id checks plus a regression guard for broken `onclick="showToast("` output.
Verified: `node tools/check-restored-study-career-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed the locked company buttons render `showToast('회사 지원 조건 부족: 지능 48, 학점 8')`, clicking them shows the condition toast, and no page error appears. Console noise was limited to the existing Tailwind CDN warning and favicon 404.
Blocked: No broader structural bug was found in the checked stock, travel, Baegeum City job, study, or company-lock flows.
Next: If continuing structure hardening, add a focused smoke check for rendered HTML attributes from every extracted restored view module.
Do not: Reintroduce nested JSON double-quote payloads inside double-quoted inline HTML attributes.

## Next Loop Candidate

Recommended next autonomous loop:

Restored phone app ecosystem:

1. Keep planned apps in `phone-app-ecosystem-contract.js` until each has a view and gate.
2. Build BaeTalk partner DM and Baegeum Gallery community as separate apps; do not merge community posts with realtime chat.
3. Add install-state persistence to Baegeum Store only after the live registry and save contract can represent optional installs safely.
4. Move stock/futures action handlers only after their state/effect contract is documented.

Restored stock market system:

1. Start with the documented V0.1 slice: Baegeum Electronics in the Domestic tab.
2. Use `src/restored/systems/market-contract.js` as the source for Baegeum Electronics virtual candles, DP display, holding quote, and order previews.
3. The save-compatible one-share buy/sell order loop is now in place and browser-verified against the visible Baegeum Electronics DP price.
4. Next market slice should be either order-history display or market snapshot advancement. Do not add United States, Crypto Spot, or Crypto Leverage tabs until that V0.1 loop stays stable.

Restored life minigames:

1. Browser-verify the new convenience-store, fast-food, and labor-office panels once the in-app browser pane is reachable.
2. Keep feeding UI performance into `createRestoredLifeJobResult()` and consume returned effects instead of calculating wages in the HTML shell.
3. Use the new `job_completed` relationship event route for partner reactions to steady work.
4. Keep pawnshop/loan-office in the Dice City contract lane; do not mix collateral/debt state into ordinary job rewards.

Restored study/career lane:

1. Keep library, university, and company shifts inside `src/restored/career/`; do not add new wage or promotion formulas inline in the restored HTML.
2. Add a small job-history/reputation selector or event log before adding interviews, resumes, or rankings.
3. Keep company qualification tied to education credits and intelligence, with promotion state separate from wealth rank.
4. Route future partner/mental reactions through relationship events instead of having company or university buttons mutate relationship state directly.

Restored lover/relationship v2:

1. Add a deliberate date, DM, or confession surface that consumes the relationship event runtime instead of growing the old interaction modal.
2. Keep My Info as summary only; do not move the full partner list back out of the phone app.
3. Leave casino/loan/pawnshop reactions disconnected until the relationship event runtime has a non-modal date or DM loop.
4. Extract the next phone app renderer, likely news or stock, only after the relationship source-event slice stays stable.

Paused restored gambling replacement:

1. Pick the next replacement module or adapter: loan/debt state, slots, blackjack/roulette UI adapter planning, or pawnshop UI adapter planning.
2. Keep each module pure: rules, allowed inputs, output event/effect envelopes, and no DOM writes.
3. Add a smoke check before wiring any live HTML button to the module.
4. Keep the old odd-even/blackjack scripts playable only as reference. Do not continue the old settlement path as the future gambling architecture.

Paused city-role map-editor loop:

City role aware map-editor visual tuning:

1. Tune baegeum lifestyle blocks with the new role-filtered shells, without adding doors, interiors, economy, or online channels.
2. Tune dice-city casino/back-alley frontage with the new role-filtered shells, keeping copied venue anchors separate from `building_shell` objects.
3. Keep using `canPlaceNewBuildingType(typeId, mapId)` from `src/data/city-district-contract.js` for future editor presets.
4. Browser-verify editor palette switching between baegeum-city and dice-city after any visual tuning.
5. Preserve separate draft keys and keep baegeum casino originals as `legacy_preserved` until copied dice-city venues are stable.

If the human wants to shrink `baegeum-city` further, treat it as another relayout slice, not a numeric height edit:

1. Pick a target bottom boundary below 2800 and backup/export the current baegeum draft first.
2. Move or scale the baegeum spawn, bus terminal anchor, bottom roads, base walls, scenery, and nav nodes together.
3. Keep vendored Iron Line source untouched; apply project-owned layout transforms after vendor load.
4. Browser-verify spawn, terminal transition, minimap, NPC pathing, and editor loading.

Paused loops:

1. Multimap visual tuning can resume later from the city-role map-editor notes.
2. Horse-racing work is paused before round/ledger logic.
3. Construction UX is paused unless the human redirects back to map decoration work.
4. Git baseline still requires explicit `baseline 승인` before staging or committing.
5. Online lobby work should start from `docs/baegeum-city-v2-online-lobby-contract.md`: the lobby is an online-only gate, not an offline menu, and the next safe coding slice is a pure contract module plus smoke test before UI.

## Human-Approval Queue

- Installing `Q00/ouroboros` or running `ouroboros setup --runtime codex`.
- Any global Codex/WSL/home-directory configuration change.
- Large map draft format changes or schema migrations.
- Online authority, economy authority, or saved-data compatibility changes.

## Notes For The Next Agent

- The repository currently has many untracked files; do not treat untracked status as permission to delete or reset anything.
- Read `docs/ai-git-baseline-strategy.md` before staging, committing, deleting, moving, or mass formatting.
- `docs/INDEX.md` exists and should stay the document map, but avoid broad cleanup unless explicitly requested.
- `docs/ai-review-board.md` is the quick human-facing control panel for objective, risks, approval boundaries, and next safe action.
- Use the existing Korean project docs as the source of product truth.
- `docs/ai-agent-boot-packet.md` is now the portable first-message handoff for new AI sessions and other workspaces.
- `docs/ai-code-health-audit-plan.md` is now the active plan when the human asks to inspect spaghetti growth, whole-code bug patterns, or root causes.
- `docs/ai-code-health-inventory-2026-05-26.md` records the first audit inventory, completed runtime-state facade migration, and the first localStorage diagnostics tool.
- `docs/ai-spaghetti-bug-root-cause.md` explains why the spaghetti/bug pattern emerged and now fixes the next audit sequence around persistence, silent failures, and browser workflows.

## Loop Record

Date: 2026-05-27
Observed: The final phone-app rendering bottleneck was stock and futures. News, relationships, and app-store were already extracted, but stock rows, portfolio rows, chart bars, futures ticker, and futures position cards still rendered inline in `baegeum-city-v2-dice.html`.
Changed: Added `src/restored/phone/stock-app-view.js` and `src/restored/phone/futures-app-view.js`, rewired the restored HTML to mount returned view objects, preserved existing trade/close button entry points, kept futures margin-call mutation in the HTML shell, and updated docs/checks so news/stock/futures views stay extracted.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-phone-app-ecosystem.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, `npm run check`, and `Invoke-WebRequest http://127.0.0.1:4173/baegeum-city-v2-dice.html` passed. The restored HTML is now 1463 lines; new stock/futures phone view modules are under 100 lines each.
Blocked: In-app browser automation still could not attach because no active Codex browser pane was reported. Visual browser verification remains pending even though local HTTP and full static/project checks pass.
Next: Treat the core phone renderer extraction as complete. The next meaningful slice is a BaeTalk/date/confession surface through relationship events, or a separate stock/futures action-effect contract if market handlers need to move next.
Do not: Put news/stock/futures app rendering back into `baegeum-city-v2-dice.html`, add phone apps to bottom navigation, or move stock/futures action handlers without a separate contract.

Date: 2026-05-27
Observed: The phone app ecosystem next slice was renderer extraction. News still rendered cards inline in `baegeum-city-v2-dice.html`, while relationship and app-store views were already extracted.
Changed: Added `src/restored/phone/news-app-view.js`, delegated `renderNewsTab()` to `renderRestoredNewsListHtml(gameState)`, and extended phone app checks/docs so news stays a phone app view module. The restored HTML is now 1498 lines and stock/futures are the remaining inline phone renderers.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-phone-app-ecosystem.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, `npm run check`, and `Invoke-WebRequest http://127.0.0.1:4173/baegeum-city-v2-dice.html` all passed.
Blocked: In-app browser automation could not attach because no active Codex browser pane was reported, and the fallback Playwright target was closed before inspection. Visual browser verification is still pending when the app pane is available again.
Next: Extract the stock phone app renderer, then futures, before adding BaeTalk or Baegeum Gallery surfaces.
Do not: Put news back into inline HTML rendering, add phone apps to bottom navigation, or grow stock/futures UI before their renderers are split.

Date: 2026-05-27
Observed: Final verification found that the Dice City casino street still labeled baccarat as `계약 예정` even though the pure baccarat contract is now guarded.
Changed: Updated the casino street baccarat row copy in `src/restored/ui/place-surface-copy.js` from `계약 예정` to `계약 있음`.
Verified: `node tools/check-restored-city-frontage-contract.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest login, home-front navigation, bus stop, Dice City casino street, no captured browser errors, and baccarat shown as `계약 있음`.
Blocked: None.
Next: Continue with horse-racing as the next pure game contract, or start a UI adapter plan after the current contract layer is reviewed.
Do not: Treat casino street copy as authority; the contracts under `src/restored/games/` remain the source for game readiness.

Date: 2026-05-27
Observed: Blackjack, roulette, baccarat, pawnshop, and loan-office contracts were guarded, leaving slot machines as the next small Dice City game that needed a pure provided-result contract before animation.
Changed: Added `src/restored/games/slot-contract.js` with three-reel symbol normalization, jackpot / triple / pair / loss classification, payout projection, and restored gambling bet/result envelopes. Added `tools/check-restored-slot-contract.cjs`, wired it into the game-contract purity gate and `npm run check`, and documented `restored-slot-001`.
Verified: `node tools/check-restored-slot-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-restored-gambling-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Continue with horse-racing as the next pure game contract if the human keeps pushing Dice City game expansion.
Do not: Generate random slot outcomes, animate reels, or wire slot payouts to live UI before the adapter and authority boundary are explicitly guarded.

Date: 2026-05-27
Observed: Pawnshop and baccarat contracts were guarded, leaving Dice City's loan office as the next high-risk system that should not mutate cash/debt directly from UI.
Changed: Added `src/restored/games/loan-office-contract.js` with loan quotes, borrow envelopes, payment, delinquency, default, and local debt/cash effects. Added `tools/check-restored-loan-office-contract.cjs`, wired it into the game-contract purity gate and `npm run check`, and documented `restored-loan-office-001`.
Verified: `node tools/check-restored-loan-office-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-restored-gambling-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Continue with slots or horse-racing as the next pure game contract if the human keeps pushing Dice City game expansion.
Do not: Wire loan-office buttons to live cash, ledger, debt, partner emotion, or online state before the debt ledger boundary is explicitly guarded.

Date: 2026-05-27
Observed: The next safe Dice City gambling slice was baccarat, but only as a pure contract before any casino animation or live UI wiring.
Changed: Added `src/restored/games/baccarat-contract.js` with baccarat scoring, player / banker / tie bets, banker commission payout, tie refund behavior, and restored gambling bet/result envelopes. Added `tools/check-restored-baccarat-contract.cjs`, registered baccarat in the shared gambling game ids, wired it into the game-contract purity gate and `npm run check`, and documented `restored-baccarat-001`.
Verified: `node tools/check-restored-baccarat-contract.cjs`, `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-restored-gambling-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Continue with slots or loan/debt as the next pure replacement contract, or plan a UI adapter that consumes blackjack/roulette/baccarat contract output without inventing money logic.
Do not: Wire baccarat into live casino UI, add card animations, or generate random outcomes inside `src/restored/games/`.

Date: 2026-05-27
Observed: The human wanted the useful parts of the Baegeum City promo/design notes selected, with normal 원화 kept intact, betting chips renamed toward DPA, missing city buildings added, and the bottom tabs kept simple.
Changed: Added `src/restored/economy/dpa-token-contract.js` with `1 DPA = 1,000원` and a bridge to the current `chips` ledger field. Added Baegeum job/shop frontage places and rendered compact place-surface rows for 고시원, 편의점, 맥버거, 인력소, 디페이 ATM, 배금증권, 배금은행, 중고차 매장, plus Dice City 룰렛카지노, 바카라카지노, 경마장, and DPA 환전소. Kept bottom nav capped at five actions and made 상점가 open a frontage surface before the shop tab. Added `tools/check-restored-dpa-token-contract.cjs` and `tools/check-restored-city-frontage-contract.cjs`.
Verified: `node tools/check-restored-dpa-token-contract.cjs`, `node tools/check-restored-city-frontage-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, and `npm run check` passed. Browser verification confirmed 배금도시 상점가 shows 디페이 ATM/1 DPA = 1,000원/배금증권/배금은행/중고차 매장, and 다이스시티 카지노거리 shows 룰렛카지노/바카라카지노/경마장/DPA 환전소.
Blocked: None.
Next: If continuing visual redesign, add a dedicated city frontage/design-test surface or map scenery pass; if continuing systems, add baccarat or horse-racing pure contracts before animation.
Do not: Rename all money to DPA, add every building as a bottom tab, or wire DPA exchange to live casino cash mutation before the action/ledger path is guarded.

Date: 2026-05-27
Observed: The human wanted roulette, baccarat, horse racing, and other animated Dice City games, but asked to validate first so the expansion does not become another tangled inline script layer.
Changed: Added `tools/check-restored-game-contract-purity.cjs` and wired it into `npm run check`. The guard scans `src/restored/games/*-contract.js` for DOM/browser storage/timer/random dependencies, requires explicit contract versions and validation exports, and requires smoke-check coverage for each current game contract. Documented the anti-spaghetti gate in the gambling venues doc and recomposition guard list.
Verified: `node tools/check-restored-game-contract-purity.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add baccarat, horse racing, slots, or loan/debt as pure contracts first; build animation adapters or design-test pages only after each contract has a smoke check.
Do not: Put wheel/card/race animations, DOM writes, timers, storage, or random result generation into `src/restored/games/` contracts.

Date: 2026-05-27
Observed: The restored gambling replacement path had blackjack and roulette contracts, but Dice City's planned pawnshop still needed a pure collateral boundary before any UI or inventory wiring.
Changed: Added `src/restored/games/pawnshop-contract.js` with pawnshop quote math, pawn/redeem/forfeit envelopes, and local item/cash effects. Added `collateral_redeemed` to the shared restored gambling vocabulary, added `tools/check-restored-pawnshop-contract.cjs`, wired it into `npm run check`, and documented that pawnshop is not connected to live UI yet.
Verified: `node tools/check-restored-gambling-contract.cjs`, `node tools/check-restored-pawnshop-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Continue with loan/debt state, slots, or a UI adapter plan for blackjack/roulette/pawnshop.
Do not: Wire pawnshop buttons to live cash or inventory before the debt/collateral ledger and UI adapter boundary are explicitly guarded.

Date: 2026-05-27
Observed: Blackjack now had a reusable round contract, but Dice City's planned casino street also needs roulette as a separate replacement module instead of inheriting the old casino tab.
Changed: Added `src/restored/games/roulette-contract.js` with single-zero roulette numbers, color resolution, straight/outside/dozen/column bet normalization, payout projection, and bet/result envelopes through the restored gambling contract. Added `tools/check-restored-roulette-contract.cjs`, wired it into `npm run check`, and documented that roulette remains unconnected to live UI.
Verified: `node tools/check-restored-roulette-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add pawnshop collateral or loan/debt state as the next non-casino replacement module, or plan the eventual blackjack/roulette UI adapter.
Do not: Reuse the old casino tab as the long-term roulette runtime.

Date: 2026-05-27
Observed: Blackjack had pure scoring and result envelopes, but no reusable round state flow yet. Without that layer, the later UI hookup would have to re-invent shoe consumption, deal order, hit/stand transitions, and auto-settlement inside the screen code.
Changed: Added `src/restored/games/blackjack-round-contract.js` with deterministic shoe consumption, initial deal, hit, stand, auto-settle, and settled result-envelope creation. Added `tools/check-restored-blackjack-round-contract.cjs`, wired it into `npm run check`, and documented that the flow remains unconnected to both the standalone design page and live restored HTML.
Verified: `node tools/check-restored-blackjack-round-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add either the next replacement gambling module, such as roulette/pawnshop/loan, or a later UI adapter plan that maps `blackjack-design-test.html` controls onto the restored blackjack round contract.
Do not: Put blackjack card drawing or result settlement directly into UI handlers.

Date: 2026-05-27
Observed: With the restored gambling event contract in place, blackjack was the right first replacement game because the human already approved the standalone table design as the future candidate.
Changed: Added `src/restored/games/blackjack-contract.js` with pure scoring, ace downgrade, natural blackjack, bust, push, win/loss comparison, and blackjack bet/result envelopes that flow through the restored gambling contract. Added `tools/check-restored-blackjack-contract.cjs`, wired it into `npm run check`, and documented that it remains unconnected to both the design prototype and live restored HTML.
Verified: `node tools/check-restored-blackjack-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add either a blackjack shoe/round-state layer or the next replacement venue contract before any live UI wiring.
Do not: Attach the blackjack design page to live casino money before the restored gambling contract path is used.

Date: 2026-05-27
Observed: The restored gambling direction needed a contract before any live casino rewrite, otherwise blackjack, roulette, pawnshop, and loan-office work would each invent separate result vocabularies.
Changed: Added `src/restored/games/gambling-replacement-contract.js` with neutral events for venue visits, bets, wins, losses, refunds, debt, and collateral. Added effect vocabulary for event records, economy ledger bridge entries, relationship/emotion hooks, and online authority requests. Guarded it with `tools/check-restored-gambling-contract.cjs`, wired the check into `npm run check`, and updated the gambling/recomposition docs.
Verified: `node tools/check-restored-gambling-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Build the first replacement gambling module as a pure rules/event layer before connecting any live casino UI.
Do not: Let casino modules mutate partner emotions, cash, chips, debt, or collateral directly from UI handlers.

Date: 2026-05-27
Observed: After the standalone blackjack design pass, the next safe step was to keep that prototype from regressing while it stays disconnected from the live restored game.
Changed: Added `tools/check-blackjack-design-prototype.cjs` and wired it into `npm run check`. The check guards the Korean visible UI, circular chip/stack animation pieces, the documented future target `다이스시티 -> 카지노거리 -> 블랙잭카지노`, and the rule that the prototype is not connected yet.
Verified: `node tools/check-blackjack-design-prototype.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Keep `blackjack-design-test.html` as a standalone handoff page until the human explicitly asks to apply it in-game, then start from a restored gambling replacement contract.
Do not: Replace live casino behavior with this prototype before the betting/ledger/emotion/online boundary exists.

Date: 2026-05-27
Observed: The human liked `blackjack-design-test.html` enough to keep it as the future in-game blackjack candidate, but wanted no visible English, better chip visuals, and chip-click animation before later integration.
Changed: Reworked `blackjack-design-test.html` as a Korean-only visible prototype, redesigned the betting chips, added a table betting zone, and made clicked chips animate from the rail to the table stack. Recorded the future integration location as `다이스시티 -> 카지노거리 -> 블랙잭카지노` in the gambling venue document.
Verified: `git diff --check`, script parse check, `npm run check`, and browser smoke on `http://127.0.0.1:4173/blackjack-design-test.html` passed. Browser verification confirmed no captured runtime errors, no visible English UI labels from the old prototype, circular chip buttons, chip-click flight animation, table chip stacking, and a playable start/hit/stand/settle round.
Blocked: None.
Next: Browser-check the standalone prototype, then keep it disconnected until the human explicitly asks to apply it in-game.
Do not: Wire this prototype into `baegeum-city-v2-dice.html` before the restored gambling replacement contract exists.

Date: 2026-05-27
Observed: The human clarified that the existing gambling layer should be treated as a system to replace, not as the long-term base to extend.
Changed: Added the restored gambling replacement rule to `docs/baegeum-city-v2-gambling-venues.md`, updated the recomposition plan so gambling work starts from replacement contracts, and recorded the direction in this working state.
Verified: `git diff --check` and `npm run check` passed after the document-only update.
Blocked: None.
Next: Add a restored gambling replacement contract before touching roulette, blackjack, odd-even, pawnshop, or loan-office runtime behavior.
Do not: Keep expanding the old inline casino scripts as if they were the final gambling system.

Date: 2026-05-27
Observed: The human asked for a final bug pass and a check that the canonical docs still cover the conversation requirements before moving deeper into redesign.
Changed: Reconciled the restored recomposition, UI/online/ranking/chat roadmap, UI redesign, and ranking/job planning docs so they no longer describe the old fixed five-tab shell as current. The current docs now state that location-aware navigation is live, partner lists belong in the phone relationship app, My Info has carried inventory, and consumable use is owned by restored inventory modules.
Verified: `git diff --check`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, and `npm run check` passed. Browser smoke on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` verified home/outside/Dice City navigation, My Info inventory, capped energy-drink use, phone apps, relationship app placement, and zero captured runtime errors.
Blocked: None.
Next: Commit/push a backup when the human explicitly asks, or continue by moving shop purchases and phone app rendering toward restored action/effect modules.
Do not: Reintroduce permanent global tabs for news/stock/futures/relationships or put partner lists back into My Info.

Date: 2026-05-26
Observed: The previous inventory slice had display-only consumables, and the next safe step was to make energy drink usable without one-off My Info state mutation.
Changed: Added `src/restored/inventory/consumable-contract.js` for registered consumable effects, `src/restored/inventory/inventory-view.js` for the carried-item preview renderer, and wired the My Info `사용` button to `projectRestoredConsumableUse()`. Energy drink now consumes one item and restores `profile.stats.energy` by 20, capped at max. Updated restored inventory docs and module README.
Verified: `node tools/check-restored-player-profile.cjs`, `node tools/check-restored-growth-architecture.cjs`, `git diff --check`, `node tools/check-size.cjs`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed `에너지 드링크` showed `사용`, changed energy from `72/100` to `92/100`, removed the consumed item, and showed `에너지 +20`.
Blocked: None.
Next: Promote shop purchases and consumable use toward a restored ledger/action envelope when the restored economy path is ready.
Do not: Add direct per-item button mutations in HTML; new consumables should register effects in the inventory contract.

Date: 2026-05-26
Observed: The human wanted an inventory document and a My Info place to check bought items at once, especially convenience-store consumables like energy drinks, while excluding houses and real estate.
Changed: Added `docs/baegeum-city-v2-restored-inventory.md`, linked it from `docs/INDEX.md`, added `energy_drink` as the first restored consumable item, added `listRestoredInventoryItems()` to restored selectors, and rendered a compact My Info inventory panel. Consumables are shown in inventory but excluded from restored net-worth value preservation.
Verified: `node tools/check-restored-growth-architecture.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` bought `에너지 드링크` through the house-front convenience shop and confirmed My Info inventory showed `폴더폰` plus `에너지 드링크` with no real-estate item names.
Blocked: None.
Next: Move inventory use effects, gifting, or convenience-store item actions through the action/economy contracts before adding consume buttons.
Do not: Put real estate, cash, stocks, crypto/futures, or direct item mutation controls into the My Info inventory panel.

Date: 2026-05-26
Observed: The human pointed at the live DiceLand page as a stronger visual/game reference and suggested splitting Dice City into separate venues such as pawnshop, loan office, roulette casino, and blackjack casino.
Changed: Reworked the restored Dice City navigation from one generic casino tab into `카지노거리`, `전당포`, `사채업소`, `호텔`, and `이동`. Added casino-street place cards for 슬롯카지노, 블랙잭카지노, and 룰렛카지노, added restored place catalog entries for casino street, pawnshop, loan office, and hotel, and recorded the live DiceLand reference in the gambling venue document. Placeholder place buttons now safely route through exposed toast or existing tabs instead of failing on module-scoped handlers.
Verified: `npm run check` passed. Browser verification confirmed Dice City opens on `카지노거리`, shows 슬롯/블랙잭/룰렛 cards, and bottom navigation exposes 전당포 and 사채업소 place surfaces. The only browser noise remained the existing favicon 404/Tailwind CDN warning.
Blocked: None.
Next: Turn one separated venue into a real feature through a contract first: either blackjack panel extraction, roulette rules scaffold, pawnshop collateral contract, or loan/debt state contract.
Do not: Add direct cash/debt mutations from place buttons or copy DiceLand code/assets without a separate adoption/license decision.

Date: 2026-05-26
Observed: After location-aware navigation landed, browser verification exposed two UX bugs: the floating phone dock aligned to the viewport edge on desktop instead of the playable shell, and guest login could reopen at a previously saved outside/city location instead of starting inside the home.
Changed: Re-centered the phone dock inside the max-width playable shell, kept its hit target active through the pointer-events wrapper, made no-phone dock clicks jump directly to the house-front convenience shop, and reset restored guest entry to `home_inside` / `myinfo` on every start.
Verified: `npm run check` passed. Browser verification confirmed guest entry now starts at `우리집 안`, the bottom nav shows `내정보/집안/밖으로 나가기`, the phone dock sits above the app-width tab area, and no-phone dock access opens the 편의점 shop surface. Only the existing favicon 404/Tailwind CDN warning remained.
Blocked: None.
Next: Move the next real place action through a restored action/effect or ledger-compatible contract before changing cash, items, stats, or job state.
Do not: Let saved location override the home start, or wire fast-food/labor-office buttons to direct state mutation.

Date: 2026-05-26
Observed: The human approved starting the relationship phone-app migration. The previous code still rendered the full partner list as a My Info section while phone apps only covered news, stock, and futures.
Changed: Added the `relationships` phone app to `src/restored/phone/phone-app-contract.js`, moved the partner list DOM from My Info to `phone-app-relationships`, added `renderRelationshipPhoneApp`, and strengthened restored growth/profile/phone checks so the full partner list cannot move back into My Info silently.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-player-profile.cjs`, `node tools/check-restored-growth-architecture.cjs`, and full `npm run check` passed. Browser verification reloaded `baegeum-city-v2-dice.html`, entered as `Tester`, confirmed My Info has no `partner-list`, confirmed the phone grid shows `뉴스/주식/인연`, opened the `인연` app, confirmed `phone-partner-list` exists in the phone app, and saw zero console errors.
Blocked: None.
Next: Extract the relationship phone app renderer into `src/restored/phone/` or add the next small phone-app renderer extraction for news/stock without broad visual redesign.
Do not: Put the full lover list, partner DM, market apps, ranking, chat, or online lobby back into permanent bottom navigation or My Info.

Date: 2026-05-26
Observed: The human clarified that the lover list should move into the phone as an app, following the MammonCity2-style phone app flow where app icons open in-phone app screens for markets, chat, and relationship content.
Changed: Updated the restored roadmap, UI surface redesign plan, login/phone migration plan, recomposition plan, restored README, and planning checks so the partner/lover list is treated as a phone relationship app entry rather than a My Info section.
Verified: `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, full `npm run check`, and `git diff --check` passed. `git diff --check` only reported existing CRLF conversion warnings.
Blocked: None.
Next: Add the relationship/lover app id to `src/restored/phone/phone-app-contract.js`, then move the current partner list render path from My Info into the phone app stage.
Do not: Put the full lover list, partner DM, market apps, ranking, chat, or online lobby back into permanent bottom navigation or My Info.

Date: 2026-05-26
Observed: The human asked to re-check whether all markdown planning additions were present before starting the broader redesign. The planning README listed `restored-ui-surface-redesign.md` as a recommended draft, but the actual file was still missing.
Changed: Added `docs/plans/restored-ui-surface-redesign.md` as the pre-redesign checklist for the restored playable shell, linked it from `docs/INDEX.md`, `docs/plans/README.md`, the restored roadmap, recomposition plan, and `src/restored/README.md`, and strengthened `tools/check-restored-planning-kit.cjs` so the plan cannot silently disappear.
Verified: `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, full `npm run check`, and `git diff --check` passed. `git diff --check` only reported existing CRLF conversion warnings.
Blocked: None.
Next: Run planning-kit and full project checks, then begin redesign from phone renderer extraction or location-aware shell wiring.
Do not: Start broad visual redesign before the surface checklist and existing checks are green.

Date: 2026-05-26
Observed: The human identified My Info as the next readability bottleneck because it duplicated money and mixed identity, hunting, home travel, account, and relationship data.
Changed: Added `src/restored/player/profile-contract.js` for profile/job/residence/condition/core stats, added `profile` to restored initial/save/load state, and rewired My Info into a character sheet with core stats instead of duplicated cash/net-worth rows or always-visible hunting/home action buttons. Added `tools/check-restored-player-profile.cjs` to guard the profile contract and My Info boundaries.
Verified: `node tools/check-restored-player-profile.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, full `npm run check`, and `git diff --check` passed. Browser verification reloaded `baegeum-city-v2-dice.html`, logged in as `Tester`, confirmed the My Info stat grid, job/residence/condition/account fields, no visible hunting/home action buttons, no duplicated My Info money rows, and zero console errors.
Blocked: None yet.
Next: Run full check and browser-smoke the restored page, then continue with phone app extraction or location-aware navigation.
Do not: Put money summaries, hunting, or home travel back into My Info; those belong in the top bar, home surface, or outside-location actions.

Date: 2026-05-26
Observed: After the My Info slice was verified, the next small bottleneck was that phone app ids and device gates were still owned by the restored HTML.
Changed: Added `src/restored/phone/phone-app-contract.js` for news, stock, and futures app metadata plus phone/smartphone gates. Re-exported the app contract from the shell contract, rewired the phone tab to derive visible app buttons from the contract, and added `tools/check-restored-phone-app-contract.cjs`.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, full `npm run check`, and `git diff --check` passed. Browser verification reloaded `baegeum-city-v2-dice.html`, opened the phone tab with a folder phone, confirmed only `뉴스/주식` app buttons are visible, confirmed `코인선물` is hidden until smartphone ownership, and reported zero console errors.
Blocked: None yet.
Next: Verify folder-phone and smartphone button visibility, then continue with full phone renderer extraction.
Do not: Put news, stock, futures, rankings, chat, or online lobby back into global bottom navigation.

Date: 2026-05-26
Observed: The last restored loop removed visible save-code UI and left the next safe slice as a restored online adapter that returns `unavailable` by default before any Firebase, lobby, or phone-online work.
Changed: Added `src/restored/online/online-adapter-contract.js` with online status validation, an unavailable adapter, adapter snapshots, and a lobby guard. Re-exported online state helpers from `account/session-contract.js`, switched restored initial state to import online state from the online module, and guarded the adapter in `tools/check-restored-growth-architecture.cjs`. Updated restored roadmap, recomposition plan, login migration plan, and `src/restored/README.md`.
Verified: Initial `npm run check` was already green. After the change, `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, and full `npm run check` passed. Browser verification reloaded `baegeum-city-v2-dice.html`, confirmed guest login and online login pending are visible, confirmed save-code UI is absent, logged in as `Tester`, saw `Tester · OFFLINE`, and reported zero console errors.
Blocked: Real online login and online lobby remain intentionally unavailable. No Firebase or MammonCity2 runtime code was copied.
Next: Move phone app rendering and phone app gates under `src/restored/phone/`, keeping news, stock, futures, rankings, chat, and future online lobby inside the phone surface.
Do not: Enable lobby UI from offline state, copy Firebase config, or put phone apps back into the global bottom navigation.

Date: 2026-05-26
Observed: The human wanted to remove the data backup center/save-code UX and move the restored build toward a login home, while using `PEPEANT/MammonCity2` as the reference for home login, online systems, and phone UI.
Changed: Replaced the visible restored start screen controls with a local guest login home and disabled online login state. Removed the visible data backup center, save-code copy/restore buttons, and save-code modals from `baegeum-city-v2-dice.html`. Added `src/restored/account/session-contract.js`, added `account` and `online` to restored state/save domains, preserved saved phone ownership during load, and guarded that legacy save-code UI does not return to the HTML. Added `docs/plans/restored-login-home-online-phone-migration.md`, pinned MammonCity2 HEAD/reference notes, and updated roadmap/planning checks.
Verified: `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, `npm run check`, and `git diff --check` passed. Browser verification reloaded `baegeum-city-v2-dice.html`, confirmed guest login and disabled online login are visible, confirmed backup/save-code UI is not visible, logged in as `Tester`, reached the game screen, and saw zero console errors.
Blocked: Real online login/cloud save is still intentionally unavailable. MammonCity2 has no detected top-level license file in the intake, so it remains a reference/adoption candidate rather than direct runtime copy.
Next: Add a restored online adapter contract that returns `unavailable` by default, then move phone app rendering under `src/restored/phone/` before any Firebase or connected lobby work.
Do not: Reintroduce save-code backup UI in normal play, copy MammonCity2 Firebase config directly, or create a fake offline online lobby.

Date: 2026-05-26
Observed: After static catalog extraction passed, the next safe step was to lock the home/house-front/travel/three-city navigation contract before touching runtime tabs.
Changed: Added `src/restored/data/location-catalog.js` for `home_inside`, `home_front`, `travel`, `baegeum-city`, `dice-city`, and `seosan-city`. Added `src/restored/ui/location-nav-contract.js` with the planned context-specific actions such as `go_out`, `fast_food`, `labor_office`, city travel, and city-local place actions. Initial restored state now starts with `location.contextId = "home_inside"`, and save/load preserves future location state. Updated docs and restored growth checks to guard these contracts.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, `npm run check`, and `git diff --check` passed. Browser verification reloaded the restored page, clicked the start button, reached the game screen, and reported zero console errors.
Blocked: The visible runtime still uses the old playable shell; location-aware tabs are contracted but not wired to the UI yet.
Next: Adapt the shell/nav rendering to read `location-nav-contract.js`, starting with a reversible home-inside facade.
Do not: Replace the whole restored UI in one patch or add every location action as a permanent global tab.

Date: 2026-05-26
Observed: After the three-city home-start plan was guarded, the next documented bottleneck was static catalog ownership still living in the restored HTML.
Changed: Extracted restored rank, market, asset, and partner archetype data into `src/restored/data/`, rewired `src/restored/state/initial-state.js` to seed state from those catalogs, and changed `baegeum-city-v2-dice.html` to import rank/market/partner catalogs instead of owning those constants. Promoted `seosan-city` into the restored city and place catalogs. Updated restored docs and checks so the new catalogs, `seosan-city`, and HTML no-inline-catalog rule stay guarded.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, and `npm run check` passed. Browser verification reloaded `http://127.0.0.1:4173/baegeum-city-v2-dice.html`, clicked the restored start button, reached the game screen, and reported zero console errors.
Blocked: Runtime navigation is still the old playable shell; the location-aware home/house-front/city shell is planned but not implemented.
Next: Add `src/restored/data/location-catalog.js` and a location-nav contract smoke check before changing bottom navigation behavior.
Do not: Add new rank, asset, market, partner, city, or place data inline in `baegeum-city-v2-dice.html`.

Date: 2026-05-26
Observed: The human shifted the restored build plan toward starting inside the player's home, then expanding through house-front, Baegeum City, Dice City, and Seosan City with context-specific tabs.
Changed: Added `docs/plans/restored-three-city-home-navigation.md`, linked it from `docs/INDEX.md` and `docs/plans/README.md`, updated the restored UI/online roadmap and recomposition plan away from permanent global feature tabs, refreshed the feature-plan template and generator, and strengthened planning checks around `home_inside`, `home_front`, and `seosan-city`. Split the planning-kit checker so the size check no longer warns about a long `main` function.
Verified: `node tools/check-size.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, `node tools/check-restored-planning-kit.cjs`, `npm run check`, and `git diff --check` passed. `git diff --check` only reported existing CRLF normalization warnings for touched files.
Blocked: No runtime UI or gameplay changed, so browser verification is not expected for this planning slice.
Next: Keep the next coding step small: extract restored static catalogs, then add a location navigation contract before changing the playable shell.
Do not: Implement the three-city home-start UI directly as more inline buttons in `baegeum-city-v2-dice.html`, and do not turn every place into a permanent bottom tab.

Date: 2026-05-26
Observed: The human asked to catch bugs first and, if the current work was done, move to the next step.
Changed: Ran the full check first, then created `docs/plans/restored-ranking-job-system.md` as the next planning draft. The plan defines phone-based ranking boards, local preview snapshots, job/occupation board ids, starter job candidates, online authority boundaries, and the rule that job rank must not merge with wealth rank. Linked the plan from `docs/INDEX.md` and strengthened `tools/check-restored-planning-kit.cjs` so the concrete plan stays present.
Verified: Initial `npm run check`, `node tools/check-restored-planning-kit.cjs`, final `npm run check`, and `git diff --check` passed.
Blocked: No runtime UI or gameplay changed, so browser verification is not expected for this planning slice.
Next: Extract restored static catalogs for ranks, assets, markets, and partner archetypes before any ranking/job UI implementation.
Do not: Implement rankings or jobs inside `baegeum-city-v2-dice.html`; do not show fake global rankings while offline.

Date: 2026-05-26
Observed: The human clarified that features should not be built first; the project needs a planning script or draft foundation first, and rankings should include jobs/occupations.
Changed: Added `docs/plans/README.md`, `docs/templates/restored-feature-plan-template.md`, `tools/create-restored-feature-plan.cjs`, and `tools/check-restored-planning-kit.cjs`. Added `npm run plan:restored` so future restored features can generate a planning draft before implementation. Updated the restored ranking roadmap to include job boards such as `jobRank`, `jobIncome`, and `jobReputation`, and strengthened roadmap checks to guard job ranking language.
Verified: `node tools/check-restored-planning-kit.cjs`, `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs`, generated job-ranking draft preview, `node tools/check-size.cjs`, and `npm run check` passed.
Blocked: No runtime UI or gameplay changed, so browser verification is not expected for this planning-tool slice.
Next: Generate a concrete `restored-ranking-job-system` plan before any ranking or job implementation, then continue catalog extraction.
Do not: Implement job rankings directly in `baegeum-city-v2-dice.html` or merge job rank with wealth rank.

Date: 2026-05-26
Observed: The human asked to prepare the overall UI/design improvement plan plus future online expansion, ranking system, and chat expansion before more restored features are added.
Changed: Added `docs/baegeum-city-v2-restored-ui-online-ranking-chat-roadmap.md` with UI surfaces, phone-first design draft, online authority rules, ranking split between local rank and online boards, and chat expansion from partner DM to public channels. Linked it from `docs/INDEX.md`, referenced it from `src/restored/README.md` and the recomposition plan, and added `tools/check-restored-ui-online-ranking-chat-roadmap.cjs` to guard the roadmap through `npm run check`.
Verified: `node tools/check-restored-ui-online-ranking-chat-roadmap.cjs` and `npm run check` passed.
Blocked: No runtime UI changed, so browser verification is not expected for this docs/guard slice.
Next: Extract static catalogs for ranks, assets, markets, and partner archetypes before implementing ranking, chat, relationship, online, or illustration behavior.
Do not: Put news, stocks, futures, rankings, or chat back into bottom navigation; do not add fake offline lobby or client-authoritative online rankings.

Date: 2026-05-26
Observed: The human asked to make the project ready so that when they provide material, Codex can immediately receive it and turn it into usable project inputs.
Changed: Added `docs/baegeum-city-v2-restored-intake.md`, `assets/inbox/README.md`, and `refs/intake/README.md`. Added `tools/intake-restored-material.cjs`, which classifies provided files/URLs into asset, GitHub reference, or note intake cards and emits manifest/reference candidates. Added `tools/check-restored-intake.cjs`, linked the intake doc and reference intake index, added `npm run intake`, and wired intake checks into `npm run check`. Updated the asset pipeline so `assets/inbox/` is quarantine and excluded from runtime asset-manifest coverage until promotion.
Verified: `node tools/intake-restored-material.cjs --help`, asset sample classification, GitHub sample classification, `node tools/check-restored-intake.cjs`, `node tools/check-restored-asset-pipeline.cjs`, `node tools/check-reference-systems.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: No runtime UI changed, so no browser verification was needed for this slice.
Next: When the human provides a file/link, place raw files in `assets/inbox/` or create a `refs/intake/` card, then promote approved material into asset manifest or restored catalogs.
Do not: Reference `assets/inbox/` from runtime code or copy GitHub/open-source code/assets into runtime folders before review.

Date: 2026-05-26
Observed: The human clarified that the blackjack request was not to wire blackjack into the active restored game, but to create a separate design-test prototype.
Changed: Reverted the in-progress restored-game blackjack hookup from this session and added standalone `blackjack-design-test.html` with its own table UI, chips, deal/hit/stand/double controls, shoe, bankroll, result feed, and local-only round logic. The active `baegeum-city-v2-dice.html` gameplay remains intentionally unconnected to this prototype.
Verified: Local server returned `http://127.0.0.1:4173/blackjack-design-test.html` 200. Browser verification loaded the standalone page, placed a 1,000-chip bet, dealt a round, stood, settled to READY, and reported no console errors. `git diff --check` and `npm run check` passed.
Blocked: Direct `file://` navigation for the test page was blocked by the in-app browser URL policy, so verification used the existing local static server.
Next: Tune the standalone blackjack design, pacing, or rules in `blackjack-design-test.html` only.
Do not: Wire the standalone blackjack prototype into `baegeum-city-v2-dice.html` unless the human explicitly asks for game integration.

Date: 2026-05-26
Observed: The human identified selectors as the next bottleneck: total asset, rank, phone ownership, and smartphone ownership calculations needed to move out of `baegeum-city-v2-dice.html` before catalog extraction.
Changed: Added `src/restored/state/selectors.js` with restored total asset, stock value, ownership value, rank, rank index, phone, and smartphone selectors. Updated `baegeum-city-v2-dice.html` to import and call those selectors instead of owning local calculation functions. Strengthened `tools/check-restored-growth-architecture.cjs` so these selector functions cannot move back into the HTML, and updated restored docs/README to record the live selector module.
Verified: `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-asset-pipeline.cjs`, and `npm run check` passed. Browser verification reloaded `http://127.0.0.1:4173/baegeum-city-v2-dice.html`, clicked start, confirmed the game screen, rank/total asset rendering, and the no-phone phone tab gate with zero console errors.
Blocked: Pre-existing working-tree changes were present before this slice: `baegeum-city-v2-dice.html` already had blackjack UI/module rollback edits and `src/restored/games/blackjack-game.js` was already deleted. This slice did not restore or reverse those unrelated changes.
Next: Extract static catalogs for ranks, assets, markets, and partner archetypes so selectors and UI stop depending on HTML-owned catalog constants.
Do not: Add new rank/asset/market/partner data inline in `baegeum-city-v2-dice.html`, or mix blackjack repair into the catalog extraction slice.

Date: 2026-05-26
Observed: The human asked to create the extra tools needed before the fundamental redesign, especially how mp3 files and image folders should be classified and reorganized.
Changed: Added `docs/baegeum-city-v2-restored-asset-pipeline.md` with target audio/image/source folders, asset id rules, mp3/image role taxonomy, source/license expectations, and verification rules. Added `src/restored/assets/asset-manifest.js` with current legacy mp3/png/svg assets registered by id. Added `tools/check-restored-asset-pipeline.cjs` and wired it into `npm run check` so tracked asset files under `assets/` must be registered before use. Linked the asset pipeline from `docs/INDEX.md` and recorded the manifest in restored recomposition docs and `src/restored/README.md`.
Verified: `node tools/check-restored-asset-pipeline.cjs`, `node tools/check-restored-growth-architecture.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: No files were moved yet; the current asset manifest references legacy locations until a deliberate migration is approved.
Next: Extract restored selectors/catalogs or start moving future new art/audio through the manifest id flow before connecting illustration/conversation systems.
Do not: Add direct mp3/image paths to `baegeum-city-v2-dice.html`, or copy GitHub/open-source assets into `assets/` before source/license review.

Date: 2026-05-26
Observed: The human asked to finish the first live restored split and to pin GitHub open-source reference links so they can be shown quickly later. The active target remains `baegeum-city-v2-dice.html`, and the next safe split was restored state/storage.
Changed: Moved the live restored initial state into `src/restored/state/initial-state.js` and save/load plus cash-only save-code helpers into `src/restored/state/storage.js`. Updated `baegeum-city-v2-dice.html` to run as a module, import those helpers, and expose inline-handler functions back onto `window` so the existing buttons keep working. Strengthened `tools/check-restored-growth-architecture.cjs` so the restored HTML cannot re-own `INITIAL_STATE` or direct storage writes. Added `refs/github-reference-systems.md`, pinned `https://github.com/PEPEANT/MammonCity2`, listed it in `refs/open-source-candidates.md`, and added `tools/check-reference-systems.cjs` to `npm run check`.
Verified: `node tools/check-restored-growth-architecture.cjs`, `node tools/check-reference-systems.cjs`, `npm run check`, and `git diff --check` passed. Browser verification reloaded `http://127.0.0.1:4173/baegeum-city-v2-dice.html`, clicked the start button, opened the game screen, switched to the phone tab, and showed no console errors except the existing Tailwind CDN warning.
Blocked: The next live split is still pending: selectors/catalogs for rank, phone ownership, assets, stocks, crypto, and partners remain inside the HTML.
Next: Extract restored selectors (`totalAsset`, `rank`, `hasPhone`, `hasSmartPhone`) and then static catalogs for ranks/assets/markets before expanding AI conversation.
Do not: Add more inline state/storage/catalog data to `baegeum-city-v2-dice.html`, or import MammonCity2 code/assets before a license and structure review.

Date: 2026-05-26
Observed: The human asked to start recomposition now because future AI lovers/NPCs may roam through cities, and the restored HTML would become a bottleneck if UI, city, casino, ownership, and dialogue keep growing in one place.
Changed: Added `docs/baegeum-city-v2-restored-recomposition-plan.md` and linked it from `docs/INDEX.md`. Added pre-split contracts for `src/restored/actors/actor-contract.js`, `src/restored/data/place-catalog.js`, and `src/restored/ui/shell-contract.js`, then updated the restored architecture check so AI actor location, city/place actor slots, phone-app UI shell boundaries, bottom nav ids, and line budgets are guarded before live extraction begins.
Verified: `node tools/check-restored-growth-architecture.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: Live behavior is still mostly inside `baegeum-city-v2-dice.html`; this slice intentionally creates the recomposition rails before moving runtime code.
Next: Run the restored architecture check and `npm run check`, then start the first live extraction with restored `initial-state` and `storage` modules.
Do not: Split the whole restored HTML at once or add new inline AI/dialogue/casino systems before state/storage are extracted.

Date: 2026-05-26
Observed: The human wants the restored build to grow toward AI lovers, branching conversation, gambling, ownership, emotion, and illustrations, and asked to put the fundamental design/script structure into Markdown before coding more.
Changed: Added `docs/baegeum-city-v2-restored-growth-architecture.md` and linked it from `docs/INDEX.md`. The document records current structural risks in the 1371-line single HTML, a `src/restored/` module plan, script splitting rules, relationship/emotion state, conversation branching, gambling/ownership event flow, illustration manifest rules, and the next extraction order. Added the first real guardrail scripts/modules: `src/restored/README.md`, `src/restored/data/city-catalog.js`, `src/restored/state/save-contract.js`, and `tools/check-restored-growth-architecture.cjs`; `npm run check` now runs the restored architecture check.
Verified: `node tools/check-restored-growth-architecture.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Full code split was not performed yet; the new guardrails intentionally create the safe starting line before moving live state out of the HTML.
Next: Start with `src/restored/state/initial-state.js` and `storage.js`, then extract partner/asset catalogs before expanding AI conversation.
Do not: Add more large inline script to `baegeum-city-v2-dice.html` for new lover/dialogue/illustration systems.

Date: 2026-05-26
Observed: The human clarified that news, stocks, and crypto futures feel like phone apps, not main bottom navigation tabs, and that they should be invisible before buying a phone.
Changed: Reworked `baegeum-city-v2-dice.html` bottom navigation to only show `내정보`, `휴대폰`, `부동산`, `도박`, and `상점`. Moved 뉴스/주식/코인선물 into the new 휴대폰 tab as app views. No-phone state now shows only a phone purchase prompt; app buttons are hidden with the phone shell. Folder phone unlocks 뉴스 and 주식, while 스마트폰 unlocks 코인선물.
Verified: `npm run check` passed, `git diff --check` reported no whitespace errors, and browser verification showed the five bottom tabs, `tab-phone` activation, no-phone locked prompt, hidden phone app shell, and zero console errors.
Blocked: Automated temporary purchase verification was not completed because the browser read-only evaluation context did not allow the planned localStorage backup access; runtime app-unlock behavior is implemented but not persisted-tested in this loop.
Next: Manually or safely browser-test buying 폴더폰/스마트폰 through the shop, then tune the phone app visuals if needed.
Do not: Put 뉴스, 주식, or 코인선물 back into the main bottom navigation unless the human explicitly reverses this phone-app direction.

Date: 2026-05-26
Observed: The human rejected a smaller redesign and explicitly asked to use the provided Dice City V10.5 HTML wholesale, only retitling it as 배금도시 V2.
Changed: Added `baegeum-city-v2-dice.html` as the active single-file restored game, changed visible Dice City branding to 배금도시 V2, gave it the separate localStorage key `baegeum_city_v2_dice_restore`, and made root `index.html` redirect to it. Existing modular city-core/editor files were preserved.
Verified: `npm run check` passed, `git diff --check` reported no whitespace errors, the local server returned `/health` 200, and browser verification loaded `index.html` into `baegeum-city-v2-dice.html`, showed title `배금도시 V2 (Safe Restore)`, clicked `배금도시 시작`, opened the game screen on `tab-myinfo`, and had zero console errors.
Blocked: The restored build intentionally bypasses the previous ledger/action/server-authority architecture and uses the original local single-file money mutations. This is accepted as the current product pivot, but it should not be confused with the paused online-ready city-core.
Next: Tune copy, balance, save/restore, and mobile polish inside `baegeum-city-v2-dice.html` as the active playable build.
Do not: Delete the previous modular city-core, editor, docs, or vendor sources unless the human gives a separate explicit cleanup request.

Date: 2026-05-26
Observed: The human pointed out that signs, entrances, buildings, and phone apps still feel like shells because the game does not prove which ones actually work.
Changed: Added `docs/baegeum-city-v2-feature-affordance-audit.md`, `src/systems/city-feature-audit.js`, and `src/devices/phone/phone-app-catalog.js`. The settings panel now shows building/app audit counts, DIS non-wired buttons are disabled instead of pretending to work, and `npm run check` includes `tools/smoke-city-feature-audit.cjs`.
Verified: Pending in this loop.
Blocked: The audit intentionally reports many baegeum-city lifestyle buildings as functionless because they are still placement-only `building_shell` objects. This is a product gap, not a smoke-test failure.
Next: Promote one lifestyle building, preferably convenience store or fast food, from visual shell to a real interaction slice with entrance/action/effect/save behavior.
Do not: Hide missing app/building functionality with nicer art, or attach money/door/channel fields directly to `building_shell` without the owning interaction/ledger contract.

Date: 2026-05-26
Observed: The human asked to compress baegeum-city vertically and make it a clearer lifestyle/infrastructure city before continuing gameplay systems.
Changed: Updated `baegeum-city` compact relayout to height `2800`, added layout-owned infrastructure building shells and sign labels for 집, 고급집, 편의점, 패스트푸드점, 자동차매장, 주유소, 백화점, 물류센터, 경찰서, 부동산, 주식시장, 버스정류장, and 시외버스터미널. Added a `도시` build palette group and matching baegeum-only infrastructure presets while preserving all as non-enterable `building_shell` objects with no doors, interiors, economy, venue channels, or online metadata.
Verified: `node tools/check-size.cjs`, `node tools/smoke-city-district-contract.cjs`, `node tools/smoke-world-editor-build-palette.cjs`, `node tools/smoke-baegeum-map-shrink-readiness.cjs`, `node tools/smoke-baegeum-city-urban-layout.cjs`, `npm run check`, and `git diff --check` passed. Browser navigation to `index.html?map=baegeum-city&infra-layout=20260526` and `editor.html?infra-layout=20260526` loaded with zero console errors.
Blocked: Browser click automation was limited to navigation/console in this session, so build-card opening was verified by smoke tests rather than a live click capture. Infrastructure buildings are visual/collision shells only; no store, vehicle, stock, home, or bus gameplay is attached.
Next: Visually tune baegeum-city block spacing in the editor/browser if needed, then continue with clean/stale browser workflow or the first ledger-backed lifestyle slice.
Do not: Convert infrastructure shells into enterable venues or add economy behavior without a separate interaction/ledger contract.

Date: 2026-05-26
Observed: The next spaghetti/root-cause risk was that browser workflow failures could still be caused by stale localStorage rather than current gameplay code.
Changed: Added `src/systems/local-storage-workflow.js` and `tools/smoke-local-storage-workflow.cjs`; `npm run check` now guards clean/stale/corrupt/unavailable classification and blocking stale state for economy, ledger, odd-even round state, editor drafts, and venue metadata.
Verified: `node tools/smoke-local-storage-workflow.cjs`, `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/check-size.cjs`, `npm run check`, and `git diff --check` passed.
Blocked: Browser workflow has not yet been rerun with intentionally stale storage after this module; no reset UI was added.
Next: Browser-run the first economy loop with the workflow summary, then choose food purchase ledger or stat/time tick.
Do not: Add reset buttons, payouts, rankings, stock, transfers, or hunger ticks before contracts.

Date: 2026-05-26
Observed: The first economy loop had local reserve and settlement/refund envelopes, but the table UI still did not close rounds or persist duplicate-close state.
Changed: Added `src/systems/odd-even-round-state.js`, wired 홀짝 테이블 result/refund buttons to `bet_settled`/`bet_refunded`, persisted local round state under `baegeum-city:v2:odd-even-rounds`, and added localStorage diagnostics coverage. Browser testing also exposed and fixed a UI bug where `requestAnimationFrame` timestamps overwrote the odd-even hint text.
Verified: `node tools/smoke-odd-even-round-state.cjs`, `node tools/smoke-odd-even-table-panel.cjs`, `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/check-size.cjs`, and `npm run check` passed. Browser verification on `index.html?map=dice-city&spawn=dice-odd-even-casino-01&odd-even-close=20260526b` entered 홀짝카지노, sat at the table, reserved 10 chips, refunded the round, showed `환불 완료: 10칩 반환.`, kept HUD chips at 30, showed `다음 라운드`, and had zero console errors.
Blocked: Full reconnect recovery and server-authority settlement are still not implemented.
Next: Run clean/stale localStorage workflows, then decide whether the next contract slice is food purchase ledger or stat/time tick.
Do not: Add player-to-player transfer, stock trading, rankings, random online results, or hunger ticks before their contracts exist.

Date: 2026-05-26
Observed: The human asked to restart design, not by deleting work, but by reconsidering what must be fixed before the game grows further.
Changed: Added `docs/baegeum-city-v2-system-redesign-baseline.md` and linked it from `docs/INDEX.md`. The new baseline narrows the product back to one first playable loop: baegeum-city lifestyle prep, bus transfer to dice-city, casino exchange, odd-even reserve, settlement/refund, ledger/HUD check, phone/DIS readback, and return. It also defines data owners and economy/time/online/UI gates, and explicitly blocks stock trading, player transfer, food purchase, hunger ticks, job income, race payout, and admin payout until their contracts exist.
Verified: `git diff --check`, `node tools/check-size.cjs`, and `npm run check` passed.
Blocked: None.
Next: Connect odd-even UI to the existing settlement/refund envelopes with duplicate-close protection, then run clean/stale localStorage browser workflows.
Do not: Treat the redesign restart as permission to rewrite maps, delete existing work, or add broad economy features before the first loop closes.

Date: 2026-05-26
Observed: The previous audit found a dangerous time-contract mismatch: docs said 1 real second equals 6 game minutes while the code default was 1 game minute per real second. The next economy gap was that odd-even could reserve chips but had no local action envelope for settlement or refund.
Changed: Added `WORLD_CLOCK_DEFAULT_MINUTES_PER_SECOND = 1`, updated world-clock/economy docs to make the slower default official, and added `tools/smoke-world-clock.cjs`. Added `bet_settled` and `bet_refunded` action types plus `src/systems/odd-even-round-runtime.js`, which can close reserved odd-even rounds through `bet_settled` or `bet_refunded` ledger effects. Updated the economy loop contract status for settlement/refund to partial and documented that UI/persistence/reconnect recovery are still not connected.
Verified: `node tools/smoke-world-clock.cjs`, `node tools/smoke-odd-even-round-runtime.cjs`, `node tools/smoke-economy-loop-contract.cjs`, `node tools/smoke-game-action-master.cjs`, `node tools/check-size.cjs`, and `npm run check` passed.
Blocked: Odd-even table UI still only reserves bets; it does not yet call the settlement/refund envelopes or prevent duplicate close by persisted round state.
Next: Connect odd-even table UI to settlement/refund with duplicate-close protection, then browser-check HUD/ledger state.
Do not: Add player-to-player transfer, stock trading, food purchase, hunger ticks, or online authority behavior before the owning ledger/effect contracts exist.

Date: 2026-05-26
Observed: The human asked to inspect the game fundamentally before complete design, specifically whether online money transfer, grind income, exchange rate, economic loops, and time-driven systems were missing or tangled.
Changed: Added `src/data/economy-loop-contract.js` and `tools/smoke-economy-loop-contract.cjs` to make the current economy loop gaps explicit and testable. Added `docs/baegeum-city-v2-economy-loop-contract.md`, linked it from `docs/INDEX.md`, and linked it from the Economy Master next-doc list. The contract confirms current ATM exchange and bet reservation while keeping player transfer, food purchase, stat ticks, market orders, time-driven economy, and settlement gaps visible.
Verified: `node tools/smoke-economy-loop-contract.cjs`, `node tools/check-size.cjs`, and `npm run check` passed.
Blocked: None.
Next: Close the odd-even lifecycle gap with `bet_reserved -> bet_settled | bet_refunded` before adding player transfers, stock trading, hunger ticks, or food purchase loops.
Do not: Use `economy.update()` for production money changes, implement player-to-player transfers without server authority, or let client UI decide gambling results in an online-ready path.

Date: 2026-05-26
Observed: The next documented spaghetti repair target was `src/systems/game-action-master.js`, where an unclonable action/effect payload could still become `{}` without a visible reason.
Changed: Added `GAME_PAYLOAD_CLONE_STATUSES` plus `payloadCloneStatus` and `payloadCloneReason` to created actions/effects. Successful payloads report `ok`; circular objects, `BigInt`, and other unclonable payloads keep the old safe `{}` fallback but now report `clone_failed` with a reason. Strengthened `tools/smoke-game-action-master.cjs` with circular and `BigInt` failure cases.
Verified: `node tools/smoke-game-action-master.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Start the clean/stale localStorage browser workflow pass.
Do not: Add payouts, rankings, reset UI, or broad refactors in this observability slice.

Date: 2026-05-26
Observed: The construction list could still appear visually tangled with the right editor panel because the build palette section was authored inside the panel, even though it was styled like a floating surface.
Changed: `syncBuildControls` now mounts the build palette section under `body` as a true floating bottom sheet. The CSS centers it in the canvas area, adds internal scrolling, and keeps the narrow-screen layout above the bottom editor panel. Added a smoke guard that the editor build entry owns this floating mount behavior.
Verified: `node tools/smoke-editor-entry.cjs`, `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `editor.html?build-popup-fix=20260526` showed `buildSection` parent `BODY`, `data-floating=true`, a bottom-center popup separate from the right panel, and zero console errors.
Blocked: None.
Next: If the human wants, tune the mobile/narrow-width build sheet visually after another browser resize pass.
Do not: Put the construction card list back inside the right control panel or change draft/building schema for this UI-only fix.

Date: 2026-05-26
Observed: The editor still showed old Iron Line war labels such as ally-base style markers because city maps could still feed `safeZones`, `baseExitPoints`, or `base-wall` data into the original renderer.
Changed: Removed baegeum urban `baseExitPoints`, removed dice-city terminal `safeZones`, changed dice-city edge walls from `base-wall` to `city-boundary`, and strengthened smoke guards so combat overlay/base labels cannot reappear in the visible city map data.
Verified: `node tools/smoke-baegeum-city-urban-layout.cjs`, `node tools/smoke-dice-city-venues.cjs`, `node tools/smoke-map-transition-interaction.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `editor.html?war-label-fix=20260526b` and `index.html?map=dice-city&war-label-fix=20260526` showed no ally/enemy base labels and zero console errors.
Blocked: None yet.
Next: Run targeted map-layout/venue smokes, full `npm run check`, then browser-verify editor/runtime console state.
Do not: Reuse Iron Line combat fields for bus terminals, spawn protection, or city boundary visuals.

Date: 2026-05-26
Observed: The human asked for a spaghetti/bug test and root-cause redesign pass. The existing audit docs pointed to silent money-affecting ledger failures as the next bug-hunt target.
Changed: Added `src/systems/local-ledger-effect.js` and `tools/smoke-local-ledger-effect.cjs`. Exchange ATM and odd-even reservation now use the shared helper so ledger application failures expose `missing_effect`, `missing_economy_record`, or `record_failed` instead of disappearing as `false`. Added empty favicon links to `index.html` and `skin-lab.html` so favicon 404 noise does not mask real browser errors. Updated the audit docs with the new root-cause state and next target.
Verified: `node tools/smoke-local-ledger-effect.cjs`, `node tools/smoke-exchange-atm-panel.cjs`, `node tools/smoke-odd-even-table-panel.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `index.html?code-health=ledger-effect-2` showed zero console errors.
Blocked: None for this observability repair.
Next: Make `src/systems/game-action-master.js` payload clone fallback observable, then run a clean/stale localStorage browser workflow pass.
Do not: Add payouts, rankings, reset buttons, broad refactors, staging, commits, deletion, moves, or mass formatting in this audit slice.

Date: 2026-05-26
Observed: The next documented autonomous slice was city-role-aware map-editor presets, so future baegeum lifestyle blocks and dice risk/nightlife blocks do not get mixed in the same build palette.
Changed: Added role metadata to building shell presets, added baegeum-only `building-home-shell` and `building-civic-shell`, added dice-only `building-loan-shell` and `building-motel-shell`, and filtered the editor build palette with `canPlaceNewBuildingType(typeId, mapId)`. Existing cards remain placement-only `building_shell` objects with no doors, interiors, economy, online channels, or venue metadata.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `editor.html?role-presets=20260526` showed baegeum-city cards `building-shop-shell`, `building-home-shell`, `building-civic-shell`; after switching to dice-city it showed `building-casino-shell`, `building-alley-shell`, `building-loan-shell`, `building-motel-shell`; console logs had zero errors.
Blocked: None for role-aware preset filtering.
Next: Tune baegeum lifestyle blocks or dice-city casino/back-alley frontage visually, without converting `building_shell` cards into venues.
Do not: Add doors, interiors, economy, online channels, or betting settlement to these placement-only building cards.

Date: 2026-05-26
Observed: The human said the city ground was too dark/green and looked like a battlefield, and asked to remove the old enemy/ally base walls before turning the edges into city outskirts/tunnels/walls.
Changed: Added `baegeum-city-urban-layout-v1`, applied it after baegeum draft/compact loading, added `city-boundary` tunnel/wall rendering in both runtime and editor, removed combat capture/safe-zone/base-wall/scenery marks from the baegeum city view, and added a smoke guard for the new city reskin contract.
Verified: `node tools/smoke-baegeum-city-urban-layout.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `index.html` showed the muted city ground, bus terminal, city edge props, and zero console errors. Browser verification on `editor.html` showed no city-boundary collision warnings and zero console errors.
Blocked: None for this visual city-reskin slice.
Next: Continue city district tuning with lifestyle buildings/outer streets, or tune the bus terminal/tunnel placement visually in a separate map-design slice.
Do not: Edit vendored Iron Line source, reintroduce red/blue combat zones into baegeum-city, or use `base-wall` for new city outskirts.

Date: 2026-05-26
Observed: The human approved moving from multimap mechanics into the world-structure plan: `baegeum-city` should become the life/hub city and `dice-city` should become the gambling/night/risk city.
Changed: Added `docs/baegeum-city-v2-city-district-contract.md` and `src/data/city-district-contract.js`. Added `cityRoleId` to the map registry, wired a new smoke guard into `npm run check`, and linked the new role/district/buildingType contract from the docs index, multimap contract, map-editor doc, and world-object doc.
Verified: `node tools/smoke-city-district-contract.cjs`, `node tools/smoke-map-registry.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. The new guard confirms baegeum can add lifestyle/civic buildings, dice can add casinos/loan/pawn/motel/nightlife buildings, and current baegeum casinos are `legacy_preserved` rather than new-placement permission.
Blocked: None for the role/district/buildingType contract.
Next: Split future map-editor building presets by city role without adding doors/interiors/economy.
Do not: Add new baegeum casino presets, add dice home/police/stock-market presets, delete original baegeum casinos, or attach gambling/economy behavior in the same slice.

Date: 2026-05-26
Observed: The human approved starting the real `baegeum-city` vertical shrink. Directly editing `height` would still cut roads/spawn/terminal, and editing `vendor/iron-line` would break the fixed vendor-source guard.
Changed: Backed up the relevant files to `C:\Users\rneet\OneDrive\문서\baegeum-city-v2-backups\pre-baegeum-relayout-20260526-134456`. Added `src/data/baegeum-city-compact-layout.js`, a project-owned compact relayout that scales baegeum y coordinates from height 5600 to 4600. Wired it into the game runtime and world editor after draft application, so old 5600 baegeum drafts are compacted in memory without deleting localStorage. Updated the shrink-readiness smoke guard to verify the compact map and bus terminal fit.
Verified: `node tools/check-size.cjs`, `node tools/smoke-baegeum-map-shrink-readiness.cjs`, `node tools/smoke-map-transition-interaction.cjs`, `node tools/smoke-world-editor-map-selector.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `index.html` showed the compact baegeum spawn at `x 562 / y 4101`, nearby `다이스시티로 이동 (시외버스터미널)`, then `E` switched to `dice-city`, `world:dice-city`, and the return terminal with zero console errors. Browser verification on `editor.html` showed separate draft keys for `baegeum-city` and `dice-city`, selector switching, and zero console errors.
Blocked: None for the 4600-height compact relayout.
Next: If the human wants more map-size work, run a separate relayout pass below 4600; otherwise return to dice-city casino-street tuning and copied venue visual checks.
Do not: Edit vendored Iron Line source, clear user drafts, or shrink below 4600 without a new relayout pass.

Date: 2026-05-26
Observed: The human asked whether `baegeum-city` vertical shrink should happen now. Runtime/editor pages load the vendored Iron Line browser map first, and that map is 8200x5600 after `map01-custom-layout.js`. Its lower road points reach y=5600, base-wall content reaches y=5588, and the player spawn is y=4992. The fallback `src/data/city-map.js` also has bottom roads/walls at its own height limit.
Changed: Added `tools/smoke-baegeum-map-shrink-readiness.cjs` and wired it into `npm run check`. The guard loads the actual browser Iron Line map, computes bottom bounds for roads, obstacles, scenery, nav nodes, safe zones, base exits, and spawns, and asserts that height-only shrink is currently not safe.
Verified: `node tools/smoke-baegeum-map-shrink-readiness.cjs` passed and reported `shrinkablePixelsWithoutRelayout: 0` for both the browser map and fallback map.
Blocked: No safe height-only shrink exists right now. A real shrink requires a coordinated baegeum-city relayout, not changing `height` alone.
Next: Either continue dice-city casino-street tuning, or if shrinking is still the priority, run a dedicated baegeum relayout slice that moves spawn/terminal/roads/nav/scenery together.
Do not: Edit vendored Iron Line dimensions, delete lower map content, shrink map height, or clear drafts as a shortcut.

Date: 2026-05-26
Observed: Dice-city already had scenery data, but non-baegeum maps were not drawing scenery, so extra street props would not show in the actual city view.
Changed: Added `src/renderers/simple-scenery-renderer.js` for non-original maps and wired it into `WorldRenderer`. Tuned `dice-city-v0` with a casino frontage road, one red-toned casino-street terrain patch, extra streetlights, and additional billboards around the copied blackjack, odd-even, and horse-track venues. Added `tools/smoke-simple-scenery-renderer.cjs` and wired it into `npm run check`.
Verified: `node tools/smoke-simple-scenery-renderer.cjs`, `node tools/smoke-dice-city-venues.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html?map=dice-city&spawn=dice-blackjack-casino-01` showed the dice-city street props rendering, kept `nearby: 블랙잭카지노 (dice-blackjack-casino-01-front)`, entered with `E` into `chat: venue:dice-blackjack-casino-01`, and had zero console errors.
Blocked: Visual screenshot shows the casino street is improved but not final; some billboard/sign overlap remains near the copied blackjack casino.
Next: Adjust billboard/sign placement around the copied blackjack casino, then browser-verify odd-even or horse-track copied entry.
Do not: Delete source casinos, shrink baegeum-city, add betting settlement, or convert `building_shell` objects into venues in the next slice.

Date: 2026-05-26
Observed: The casino-copy contract was safe, but browser verification was still awkward because dice-city copied venues had no direct dev spawn near their doors.
Changed: Added `src/scenes/city-startup.js` so startup URLs can choose a map and spawn target, e.g. `?map=dice-city&spawn=dice-blackjack-casino-01`. Wired `CityGame` to use the startup map before creating the player, added `tools/smoke-city-startup-query.cjs`, and included it in `npm run check`.
Verified: `node tools/smoke-city-startup-query.cjs`, `node tools/smoke-dice-city-venues.cjs`, and `node tools/check-size.cjs` passed. Browser verification on `http://127.0.0.1:4173/index.html?map=dice-city&spawn=dice-blackjack-casino-01` showed `scene: 다이스시티 v0`, `chat: world:dice-city`, `nearby: 블랙잭카지노 (dice-blackjack-casino-01-front)`, then after pressing `E`: `scene: 블랙잭카지노`, `mode: venue_lobby`, `chat: venue:dice-blackjack-casino-01`, `room: venue:dice-blackjack-casino-01`, with zero console errors.
Blocked: None for the copied blackjack entry path. Odd-even and horse-track copied entries are covered by data smoke tests but not yet individually browser-verified.
Next: Run full `npm run check`; then tune dice-city casino-street layout/sign placement or browser-verify the other copied entries.
Do not: Delete source casinos, shrink baegeum-city, add betting settlement, or turn `building_shell` objects into venues in the next slice.

Date: 2026-05-26
Observed: The human restated the casino relocation rule: moving casinos must mean backing up and copying first, not deleting or directly moving source buildings.
Changed: Added `tools/smoke-casino-copy-contract.cjs` and wired it into `npm run check`. The new smoke guard verifies that `bg-blackjack-casino`, `bg-odd-even-casino`, and `bg-horse-track` still exist in baegeum-city, while their dice-city copies use separate object ids, door ids, venue channels, and online room ids. It also confirms copies keep the Korean signs, game types, and proven interior scene ids. Updated multimap and gambling-venue docs with the guardrail.
Verified: `node tools/smoke-casino-copy-contract.cjs`, `node tools/smoke-dice-city-venues.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Browser walk/entry verification for an individual copied dice-city venue is still pending because there is no safe debug spawn directly near a dice-city copied venue yet.
Next: Browser-verify at least one copied dice-city venue entry path, either by manual movement from the terminal or by adding a narrow dev-only spawn helper first.
Do not: Delete source casinos, reuse source channels for dice-city, shrink baegeum-city, or add betting settlement in this migration slice.

Date: 2026-05-26
Observed: Multimap transition was stable one way, but dice-city still had no safe return path, which made later casino-street verification awkward and risked testing from a trapped state.
Changed: Added `transition:dice-to-baegeum-bus-terminal` as a second `map_transition` object using the same v0 constraints: no fare, no ticket item, no schedule, and no online room handoff. Updated runtime/interaction/mobile smoke tests and docs so both directions use the same PC `E` / mobile `ACTION` candidate structure.
Verified: `node tools/smoke-map-transition-runtime.cjs`, `node tools/smoke-map-transition-interaction.cjs`, `node tools/smoke-mobile-action-controls.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html` pressed `E` from baegeum-city to dice-city and saw `scene: 다이스시티 v0`, `chat: world:dice-city`, `nearby: 배금시티로 이동 (시외버스터미널)`, then pressed `E` back and saw `scene: Iron Line 원본 도시맵`, `chat: world:baegeum-city`, `nearby: 다이스시티로 이동 (시외버스터미널)`, with zero console errors.
Blocked: The copied dice-city venues still need direct browser walk/entry visual verification, and the casino street layout is still rough.
Next: Browser-verify at least one dice-city copied venue entry path, then tune casino-street layout in the editor/runtime without moving or deleting baegeum-city originals.
Do not: Add bus fares, tickets, schedules, online room handoff, betting settlement, map shrinking, or casino deletion in the next slice.

Date: 2026-05-26
Observed: The human restated the multimap editor contract and highlighted the map-switch risk: if the current draft is dirty, switching `activeMapId` could discard unsaved edits or make the user think the wrong city was saved.
Changed: Added a dirty-switch guard to the map editor. `activeMapId` switching is blocked when the current editor history is unsaved, and the UI tells the user to save before switching maps. Documented the rule in the map-editor and multimap contract docs. Strengthened `tools/smoke-world-editor-map-selector.cjs` so dirty baegeum edits block switching to dice-city, while saved drafts can switch and still write map-specific draft keys.
Verified: `node tools/smoke-world-editor-map-selector.cjs`, `node tools/smoke-world-editor-draft-contract.cjs`, `node tools/smoke-editor-entry.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` placed a bench to make the baegeum draft dirty, attempted to switch to dice-city, and confirmed the selector stayed on `baegeum-city` with `저장 안 된 변경이 있습니다. 저장 후 맵을 전환하세요.` and zero console errors.
Blocked: None for the editor map-switch guard.
Next: Continue with return terminal or dice-city casino-street visual verification.
Do not: Change draft schema, delete legacy draft fallback, or make dice-city read legacy drafts.

Date: 2026-05-26
Observed: The next multimap slice was casino copy mode. The bus-terminal transition already reached `dice-city`, while dice-city still had only base roads, scenery, and placement-only building shells.
Changed: Added three copied venue anchors to `dice-city-v0`: `bg-dice-blackjack-casino-01`, `bg-dice-odd-even-casino-01`, and `bg-dice-horse-track-01`. Each copied venue keeps a new dice-city channel set with `world:dice-city`, reuses the proven base interior scene, and leaves baegeum-city originals untouched. Added `tools/smoke-dice-city-venues.cjs` and kept the transition smoke test focused on preventing `building_shell` auto-conversion. Also changed the settings-panel map debug label to show `mapId / mapVersion` so dice-city is not displayed as only the shared map version.
Verified: `node tools/smoke-city-hud-map-label.cjs`, `node tools/smoke-dice-city-venues.cjs`, `node tools/smoke-map-transition-interaction.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html` used the terminal action button and showed `scene: 다이스시티 v0`, `chat: world:dice-city`, and zero console errors; after the HUD label fix, browser reload showed `map: baegeum-city / baegeum-city-v2-map-001`.
Blocked: Browser entry into an individual dice venue still needs visual verification when movement/camera setup is convenient; there is still no return transition from dice-city to baegeum-city.
Next: Choose return terminal or casino-street visual tuning.
Do not: Delete or move baegeum-city originals, shrink baegeum-city, add betting settlement, or make building shells auto-enterable.

Date: 2026-05-26
Observed: The human clarified the teleport contract: `from: baegeum-city`, `object: intercity-bus-terminal`, `targetMapId: dice-city`, `targetSpawnId: dice-terminal-arrival`.
Changed: Added `objectId: intercity-bus-terminal` and readable `from` to the bus-terminal transition contract, rendered the terminal in baegeum-city, added a `map_transition` interaction candidate for PC `E` and mobile `ACTION`, and wired the transition to rebuild the runtime map, collision, camera, NPCs, player state, and chat channel for `dice-city`. Terminal placement now anchors to the current runtime map `playerSpawn`, not a brittle fixed coordinate. Also fixed a latent risk where dice-city `building_shell` obstacles would have been converted into enterable casinos automatically.
Verified: `node tools/smoke-map-transition-runtime.cjs`, `node tools/smoke-map-transition-interaction.cjs`, `node tools/smoke-mobile-action-controls.cjs`, `node tools/smoke-city-core.cjs`, `node tools/smoke-state-protocol.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html` showed `nearby: 다이스시티로 이동 (시외버스터미널)`, then after pressing `E`: `scene: 다이스시티 v0`, `position: x 520 / y 2620`, `chat: world:dice-city`, and zero console errors.
Blocked: There is no return transition from dice-city back to baegeum-city yet, and no casino venue has been copied into dice-city yet.
Next: Plan the dice-city casino copy slice without deleting baegeum-city originals.
Do not: Add fare/ticket/schedule systems, online matching, casino movement/deletion, or map shrinking in this slice.

Date: 2026-05-26
Observed: Draft storage separation, active map selector, and `dice-city-v0` were already verified, but runtime/player contracts still had the old single `world:city` default and no bus-terminal transition object.
Changed: Changed the runtime default world channel to `world:baegeum-city`, added per-map `playerState` fields (`mapId`, `sceneId`, `spawnId`, `worldChannelId`, `chatChannelId`), added `src/data/map-transitions.js`, added `src/systems/map-transition-runtime.js`, added `map_transition` action/interaction types, and updated docs to reject the legacy `world:city` channel in new contracts.
Verified: `node tools/smoke-state-protocol.cjs`, `node tools/smoke-map-transition-runtime.cjs`, `node tools/smoke-city-core.cjs`, `node tools/smoke-local-action-runtime.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html` showed `chat: world:baegeum-city`, `mode: city`, `map: baegeum-city-v2-map-001`, and zero console errors.
Blocked: The bus-terminal transition is currently contract/state-patch only; there is not yet an in-game terminal object, interaction prompt, or actual runtime map reload to dice-city.
Next: Add the in-game bus-terminal interaction and use the verified transition envelope to switch the runtime to `dice-city` without adding fare/ticket/schedule systems.
Do not: Shrink baegeum-city, move/delete casinos, add bus fees/tickets/schedules, or connect online matching in the next slice.

Date: 2026-05-26
Observed: The next multimap blocker was that `dice-city` existed only in the registry and editor selector, with no separate base map data to load.
Changed: Added `src/data/dice-city-map.js` as a separate `dice-city-v0` base map containing roads, spawn points, empty building shells, walls, scenery, safe zone, and nav nodes. Wired the world editor to load both `baegeum-city` and `dice-city` base maps. Strengthened the editor map selector smoke test so dice-city becomes selectable only when a base map exists, saves to its own draft key, and never reads baegeum legacy draft data.
Verified: `node tools/smoke-world-editor-map-selector.cjs`, `node tools/smoke-editor-entry.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` showed `dice-city` selectable, draft key `baegeum-city-v2-world-editor-draft:dice-city`, contract map `dice-city-v0-map-001`, and zero console errors.
Blocked: Runtime map switching is not implemented yet; dice-city is editor-ready but not reachable in-game.
Next: Add the baegeum-city bus-terminal `map_transition` contract and minimal teleport/state switch.
Do not: Move/delete casinos, shrink baegeum-city, add fare/ticket/schedule systems, or add online room matching in the transition slice.

Date: 2026-05-26
Observed: The next multimap blocker was that the editor had no visible `activeMapId`, so later dice-city work could still accidentally save into the wrong draft path.
Changed: Added an editor active-map selector and split map selection/load/save/reset helpers into `src/tools/baegeum-world-editor-maps.js`. The selector defaults to `baegeum-city`, shows its draft key, keeps `dice-city` disabled until `dice-city-v0` exists, and routes save/reset/read through the selected map id. Added `tools/smoke-world-editor-map-selector.cjs` and wired it into `npm run check`.
Verified: `node tools/smoke-world-editor-map-selector.cjs`, `node tools/smoke-editor-entry.cjs`, `node tools/smoke-world-editor-draft-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` showed `배금시티` selected, `다이스시티 (준비 전)` disabled, the baegeum draft key visible, and zero console errors.
Blocked: `dice-city-v0` base map does not exist yet, so dice-city remains intentionally disabled in the editor.
Next: Create the separate `dice-city-v0` base map data module, then enable dice-city in the editor with separate draft storage.
Do not: Shrink baegeum-city, move/delete casinos, or add bus-terminal transitions in the same slice.

Date: 2026-05-26
Observed: The human clarified the core multimap risk: one `cityMap` plus one `WORLD_EDITOR_DRAFT_KEY` would mix `baegeum-city` and `dice-city` editor saves.
Changed: Connected `world-editor-draft` to the map registry so map-specific draft keys are read first, baegeum-city alone can fall back to the legacy draft key, and dice-city cannot read legacy draft data. Changed the current editor save path to the default baegeum-city map-specific draft key and made reset clear both baegeum map-specific and legacy fallback drafts. Expanded localStorage diagnostics so baegeum-city, dice-city, and legacy world-editor drafts are listed separately.
Verified: `node tools/smoke-map-registry.cjs`, `node tools/smoke-world-editor-draft-contract.cjs`, `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/smoke-editor-entry.cjs`, `node tools/check-size.cjs`, and `npm run check` passed.
Blocked: None.
Next: Add an editor `activeMapId` selector and wire load/save/reset through the selected map before creating `dice-city-v0`.
Do not: Create the dice-city map, shrink baegeum-city, move/delete casinos, or add map transitions before the editor active-map selector is implemented and verified.

Date: 2026-05-26
Observed: The human asked to start the multimap contract before creating `dice-city`, adding bus-terminal transitions, shrinking the current map, or moving casino buildings.
Changed: Added `docs/baegeum-city-v2-multimap-contract.md` and linked it from `docs/INDEX.md`. Added `src/data/map-registry.js` with `baegeum-city` and `dice-city` map configs, map-specific draft keys, split world chat channels, and a baegeum-only legacy draft fallback. Added `tools/smoke-map-registry.cjs` and wired it into `npm run check`.
Verified: `node tools/smoke-map-registry.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Make `src/data/world-editor-draft.js` accept map-specific draft keys from `map-registry`, preserving baegeum legacy fallback and keeping dice-city isolated from legacy draft data.
Do not: Create the dice-city map, add map transitions, shrink the current map, delete/move casinos, or change saved-data compatibility before draftKey separation is implemented and verified.

Date: 2026-05-26
Observed: The human approved the first pre-multimap safety step before splitting `baegeum-city` and `dice-city`, shrinking the current map, or moving casino buildings.
Changed: Created a full project zip backup outside the workspace at `C:\Users\rneet\OneDrive\문서\baegeum-city-v2-backups\pre-multimap-20260526-114932`, copied raw in-app browser Local Storage LevelDB files read-only, and exported casino/building coordinates plus venue/interior metadata to `casino-building-coordinates-pre-multimap-20260526-114932.json`. Direct browser JSON localStorage export was blocked by `ERR_BLOCKED_BY_CLIENT`, so the raw LevelDB backup and report were preserved instead.
Verified: `backup-manifest.json` was regenerated with SHA-256 hashes, the project zip opened successfully, and the zip contains 366 entries. The source workspace was not staged, committed, deleted, moved, or reset.
Blocked: Direct automated browser localStorage JSON export is blocked in this session; raw LevelDB backup exists as the recovery source.
Next: Draft the multimap contract for `baegeum-city` and `dice-city`, including mapId, sceneId, draftKey separation, bus-terminal transition object, and casino relocation copy plan.
Do not: Shrink the map, delete or move casino buildings, alter draft schema, or implement map transitions before the multimap contract is written.

Date: 2026-05-26
Observed: The persistence bug-hunt pass still had world-editor draft storage as a silent fallback candidate: corrupt `baegeum-city-v2-world-editor-draft-v0` storage became `null` without a status object, which could make stale browser editor data look like a clean missing draft.
Changed: Added `inspectWorldEditorDraftStorage()` in `src/data/world-editor-draft.js` and made `readWorldEditorDraft()` delegate to it so existing fallback behavior stays `null`. Strengthened `tools/smoke-world-editor-draft-contract.cjs` to cover `ok`, `missing`, `corrupt`, unchanged corrupt raw storage, and the existing null fallback.
Verified: `node tools/smoke-world-editor-draft-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification loaded `index.html` and `editor.html` with zero console errors.
Blocked: None.
Next: Expose one money-affecting ledger effect failure path, preferably `src/ui/exchange-atm-panel.js` before odd-even, without changing successful exchange behavior.
Do not: Add payouts, rankings, reset UI, feature slices, schema migrations, or broad refactors before the first ledger-effect failure path is observable.

Date: 2026-05-26
Observed: The persistence bug-hunt pass still had venue metadata as a silent fallback candidate: corrupt `baegeum-city-v2-venue-metadata-v1` storage became `[]` without a status object, which could make stale browser data look like a clean city-editor state.
Changed: Added `inspectStoredVenueMetadata()` in `src/data/gambling-venues.js` and made `readStoredVenueMetadata()` delegate to it so existing fallback behavior stays `[]`. Strengthened `tools/smoke-venue-metadata-storage.cjs` to cover `ok`, `missing`, `corrupt`, unchanged corrupt raw storage, and the existing empty fallback.
Verified: `node tools/smoke-venue-metadata-storage.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/index.html` loaded `배금도시 v2`, showed `mode: city`, and had zero console errors.
Blocked: None.
Next: Add a read-status path for `src/data/world-editor-draft.js`, preserving `readWorldEditorDraft()` fallback behavior and not clearing local data.
Do not: Add reset buttons, feature slices, schema migrations, or broad refactors before world-editor draft status reporting is verified.

Date: 2026-05-26
Observed: The boot packet loop now starts after source-level `BaegeumCity` access was centralized and the read-only localStorage inventory exists. The money-adjacent readers still needed their own status path so corrupt JSON would not look like a clean money/chip reset during debugging.
Changed: Added `inspectPlayerEconomyStorage()` and `inspectEconomyLedgerStorage()` so economy and ledger storage can report `ok`, `missing`, `missing_storage`, or `corrupt` while `readPlayerEconomy()` and `readEconomyLedger()` preserve their existing fallback behavior. Strengthened the player economy and economy ledger smoke checks and updated the audit docs to move the next target to map/editor draft or venue metadata read-status.
Verified: `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/smoke-player-economy.cjs`, `node tools/smoke-economy-ledger.cjs`, `node tools/smoke-runtime-state-facade.cjs`, `node tools/check-size.cjs`, `git diff --check`, `rg -n "window\\.BaegeumCity|globalThis\\.window\\?\\.BaegeumCity" src`, and `npm run check` passed. The `rg` command returned no source hits.
Blocked: No code blocker. Staging/committing still requires explicit human approval because there is no baseline commit.
Next: Add read-status helpers for either `src/data/world-editor-draft.js` or `src/data/gambling-venues.js`, then keep moving into silent-failure observability.
Do not: Add reset buttons, feature slices, staging, commits, deletion, moves, or broad refactors before the next narrow audit repair or explicit approval.

Date: 2026-05-26
Observed: The boot packet loop found the documented next action had already advanced past direct `BaegeumCity` migration; `rg "window\\.BaegeumCity" src` returned no source matches. The next root-cause risk was stale or corrupt localStorage state hiding behind silent fallbacks.
Changed: Added `src/systems/local-storage-diagnostics.js` with read-only inventory/status checks for world-editor draft, venue metadata, player economy, economy ledger, current skin keys, and legacy Drawing World skin fallback. Added `tools/smoke-local-storage-diagnostics.cjs` and wired it into `npm run check`. Updated the code-health inventory, root-cause plan, audit plan, review board, and working state so the next loop targets money-adjacent read-status rather than more facade migration.
Verified: `node tools/smoke-local-storage-diagnostics.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add one read-status path for corrupt player economy or economy ledger storage, without adding reset buttons yet.
Do not: Clear user data, add reset UI, add feature slices, or broad refactors before status reporting is verified.

Date: 2026-05-26
Observed: `src/scenes/city-scene.js` was the last source file publishing runtime state by directly touching `window.BaegeumCity`, and `src/devices/phone/dis-preview.js` still had a `globalThis.window?.BaegeumCity` read that was not caught by the narrower search.
Changed: Migrated `city-scene` runtime publication and player-state publication to `patchRuntimeState()`. Migrated DIS preview runtime reads to `getRuntimeState()`. Strengthened `tools/smoke-runtime-state-facade.cjs` to guard city scene and DIS preview. Updated code-health docs so the next pass starts stale localStorage status inventory instead of more facade work.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-phone-dis.cjs`, `node tools/smoke-city-core.cjs`, and `node tools/check-size.cjs` passed before final full check.
Blocked: None.
Next: Add a read-only localStorage status inventory for economy, ledger, world-editor draft, venue metadata, and skin.
Do not: Add reset buttons, feature slices, or broad refactors before status reporting is verified.

Date: 2026-05-26
Observed: The human asked to re-plan around spaghetti symptoms, whole-code bug symptoms, and root causes after the current repair sequence. Current inventory shows direct `window.BaegeumCity` use has narrowed to scene-owned publication in `src/scenes/city-scene.js`; the broader remaining risks are stale localStorage, silent fallbacks, browser-only workflows, hub-file pressure, and no Git baseline.
Changed: Updated `docs/ai-spaghetti-bug-root-cause.md` from a facade-migration plan into a post-facade bug-hunt sequence: finish one scene publication boundary, then audit runtime sync, persistence, silent failures, semantic browser workflows, and hub-file pressure with a bug record template. Updated the review board and working-state notes to point at this sequence.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-phone-dis.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None for planning. Staging/committing still requires explicit human approval.
Next: Repair one `src/scenes/city-scene.js` runtime publication shape through `patchRuntimeState()`, then start the persistence/silent-failure bug hunt.
Do not: Add feature slices, broad refactors, staging, commits, deletion, moves, or mass formatting before the next narrow audit repair or explicit approval.

Date: 2026-05-26
Observed: The phone shell remained the last read-heavy non-scene consumer of `window.BaegeumCity`.
Changed: Migrated `src/devices/phone/mammon-phone-shell.js` runtime context reads to `getRuntimeState()` and strengthened `tools/smoke-runtime-state-facade.cjs` so the phone shell cannot read `window.BaegeumCity` directly again.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-phone-dis.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. `Invoke-WebRequest` confirmed `index.html` returns HTTP 200 with phone markup.
Blocked: In-app Playwright browser was locked by another session, so console-level browser verification was not available in this loop.
Next: Treat `src/scenes/city-scene.js` as the remaining runtime-global owner and repair its publication boundary narrowly.
Do not: Change scene flow, player-state modes, or gameplay behavior while doing the publication-boundary cleanup.

Date: 2026-05-26
Observed: Runtime facade migration had cleared chat, mobile controls, exchange, odd-even, interior ATM, and local action publication; `src/ui/player-status-hud.js` was still publishing the economy API by writing `window.BaegeumCity` directly.
Changed: Migrated `publishEconomyApi()` to `patchRuntimeState()` and strengthened `tools/smoke-runtime-state-facade.cjs` to assert the player status HUD no longer writes `window.BaegeumCity` directly. The remaining direct runtime global surface is now `src/devices/phone/mammon-phone-shell.js` reads and `src/scenes/city-scene.js` scene-owned publication.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-player-economy.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Migrate the read-heavy `src/devices/phone/mammon-phone-shell.js` runtime reads through the facade with smoke coverage.
Do not: Migrate scene ownership or add gameplay/feature slices in the same broad change.

Date: 2026-05-26
Observed: The facade migration had cleared ATM, odd-even, mobile action, chat, and interior interaction paths, leaving `src/systems/local-action-runtime.js` as the smallest remaining direct publish write.
Changed: Migrated local action publication to `patchRuntimeState()` and strengthened `tools/smoke-runtime-state-facade.cjs` to assert `local-action-runtime` no longer writes `window.BaegeumCity` directly. The direct runtime global surface is now limited to `city-scene` and `mammon-phone-shell`.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-local-action-runtime.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Migrate the read-heavy `src/devices/phone/mammon-phone-shell.js` runtime reads through the facade with smoke coverage.
Do not: Migrate scene ownership or economy HUD publication in the same broad change.

Date: 2026-05-26
Observed: The root-cause audit plan was in place, and `src/ui/odd-even-table-panel.js` was the remaining low-risk UI surface still reading `window.BaegeumCity?.game` and `window.BaegeumCity?.economy` directly.
Changed: Migrated `src/ui/odd-even-table-panel.js` to `getRuntimeGame()` and `getRuntimeEconomy()`, confirmed `src/devices/phone/mammon-phone-shell.js` now reads runtime through `getRuntimeState()`, expanded `tools/smoke-runtime-state-facade.cjs` to guard both paths against direct global reads, and reconciled the audit plan, inventory, review board, and working state. The remaining direct source global is now `src/scenes/city-scene.js`.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-odd-even-table-panel.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: No code blocker. The repository still has no baseline commit, so staging or committing remains approval-only.
Next: Migrate one `src/scenes/city-scene.js` runtime publication shape through `patchRuntimeState()` with smoke and browser verification.
Do not: Add feature slices, horse-racing betting, venue editor UI, broad refactors, staging, commits, deletion, moves, or mass formatting before the next narrow audit repair or explicit approval.

Date: 2026-05-26
Observed: The human asked to restart the plan around spaghetti symptoms, whole-code bug symptoms, and root cause instead of continuing feature growth.
Changed: Added `docs/ai-spaghetti-bug-root-cause.md` and linked it from `docs/INDEX.md`. The document separates symptoms from causes: shared runtime globals, stale local persistence, hub-file pressure, silent fallbacks, smoke-only verification, and no Git baseline.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None for the analysis document. The no-baseline Git state still requires explicit human approval before staging or committing.
Next: Use the root-cause document before the next repair loop, then migrate the read-heavy `src/devices/phone/mammon-phone-shell.js` runtime reads through the facade with one smoke assertion.
Do not: Add feature slices, horse-racing betting, venue editor UI, broad refactors, staging, commits, deletion, moves, or mass formatting before the next narrow audit repair or explicit approval.

Date: 2026-05-26
Observed: The docs already intended the interior ATM interaction path to use the runtime facade, but `src/systems/interior-interaction-runtime.js` still had one direct `window.BaegeumCity.exchangeAtm` read.
Changed: Reconciled the code with the documented facade migration by importing `getRuntimeExchangeAtm()` and using it in the interior ATM bridge. Strengthened `tools/smoke-runtime-state-facade.cjs` with a regression assertion for this system file.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-interior-interaction-runtime.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Migrate the `src/systems/local-action-runtime.js` publish write through `patchRuntimeState()` with a narrow smoke assertion.
Do not: Migrate all remaining scene, phone, odd-even, and HUD globals in one broad refactor.

Date: 2026-05-26
Observed: The runtime-state facade already existed, and `src/ui/exchange-atm-panel.js` plus the interior ATM interaction path still had direct `window.BaegeumCity` access while using the same game/economy bridge pattern as other migrated UI.
Changed: Migrated exchange ATM open/render/exchange paths to `getRuntimeGame()`, `getRuntimeEconomy()`, and `patchRuntimeState()`. Migrated the interior ATM lookup to `getRuntimeExchangeAtm()`. Strengthened `tools/smoke-runtime-state-facade.cjs` to assert these files no longer read `window.BaegeumCity` directly.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-exchange-atm-panel.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Migrate `src/systems/local-action-runtime.js` through the runtime facade with smoke coverage.
Do not: Expand this into a broad migration of scene ownership, phone shell, player HUD, or gameplay behavior in the same loop.

Date: 2026-05-26
Observed: The code-health loop had the runtime-state facade v0 in place for `world-chat-panel`, and `mobile-action-controls` was still reading `window.BaegeumCity?.game` directly.
Changed: Migrated `src/ui/mobile-action-controls.js` to `getRuntimeGame()` and expanded `tools/smoke-runtime-state-facade.cjs` so both migrated UI files are guarded against direct `window.BaegeumCity` reads. Updated the audit inventory, audit plan, review board, and working state so the next loop targets remaining direct runtime read/write paths.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-mobile-action-controls.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Migrate one remaining direct runtime read/write path, preferably `src/systems/local-action-runtime.js` or `src/systems/interior-interaction-runtime.js`, with one smoke assertion.
Do not: Add gameplay, horse-racing betting, venue editor UI, staging, committing, deleting, moving, or broad refactoring before the next repair pass is verified.

Date: 2026-05-26
Observed: The code-health loop has the first runtime-state facade repair in place, and the venue metadata editor needed to prove it does not bypass the new storage normalizer.
Changed: Routed `src/tools/baegeum-city-editor.js` persistence through `writeStoredVenueMetadata` and strengthened `tools/smoke-venue-metadata-storage.cjs` to assert the editor does not write raw venue metadata directly.
Verified: `node tools/smoke-runtime-state-facade.cjs`, `node tools/smoke-venue-metadata-storage.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None for this repair. The no-baseline Git state still requires explicit human approval before staging or committing.
Next: Continue the audit with one more small facade migration, preferably `src/ui/odd-even-table-panel.js`.
Do not: Add new gameplay, broad refactors, staging, commits, deletion, moves, or mass formatting before approval or the next narrow audit repair.

Date: 2026-05-26
Observed: The first runtime-state facade repair is now present: `src/systems/runtime-state-facade.js` centralizes small `window.BaegeumCity` access helpers, and `src/ui/world-chat-panel.js` imports `getRuntimeGame` instead of reading the global directly.
Changed: Reconciled the active priority and next loop candidate so the next audit repair is no longer "create the facade" but "migrate one more low-risk UI surface through the facade."
Verified: `node tools/smoke-runtime-state-facade.cjs`, `git diff --check`, `npm run check`, and browser verification on `http://127.0.0.1:4173/index.html` passed with the world chat panel present and zero console errors.
Blocked: None.
Next: Migrate `src/ui/mobile-action-controls.js` through `runtime-state-facade.js` with a narrow smoke assertion.
Do not: Migrate every `window.BaegeumCity` caller in one broad refactor.

Date: 2026-05-26
Observed: The boot packet pointed to the active loop, and the current working state pauses feature growth for a bug-first code-health audit.
Changed: Added `docs/ai-code-health-inventory-2026-05-26.md`, linked it from `docs/INDEX.md`, and recorded the first audit inventory for large files, `window.BaegeumCity`, localStorage keys, and silent catches. Updated the audit plan and working state so the next loop starts with a runtime-state facade repair.
Verified: Inventory commands completed and `git diff --check` passed before final full check.
Blocked: None.
Next: Add a tiny runtime-state facade and migrate one small UI surface with smoke coverage.
Do not: Add new gameplay, horse-racing betting, venue editor UI, staging, committing, deleting, or broad refactoring before the first facade repair is verified.

Date: 2026-05-26
Observed: The boot-packet loop started from construction UX editability, but the local working state later advanced to a bug-first code-health audit. The completed construction sub-slice remained local and did not alter venue metadata or runtime economy.
Changed: Added a `building_shell` size action in the editor action strip. The action cycles selected placement-only buildings through 소형/기본/대형 by updating `w/h` and `collision.w/h` only, preserving the object center and avoiding doors, channels, interiors, economy, venue id, game type, or online room id fields.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and browser verification on `http://127.0.0.1:4173/editor.html` passed. Browser check placed a `골목 상가`, selected it in `건물` mode, showed `크기 기본`, changed it to `크기 대형`, and had zero console errors.
Blocked: None. Full `npm run check` later passed during the code-health audit documentation loop.
Next: Follow the active code-health audit plan before more feature growth unless the human explicitly redirects.
Do not: Mutate `building_shell` cards into venue anchors or stage/commit/delete/move files without approval.

Date: 2026-05-26
Observed: The human redirected from feature growth to a root-cause audit for spaghetti-like code growth and bug patterns. Current signals include a no-baseline Git state, large hub files, direct `window.BaegeumCity` reads/writes, multiple localStorage-backed state islands, silent catch paths, and smoke-heavy verification.
Changed: Added `docs/ai-code-health-audit-plan.md`, linked the code-health inventory from `docs/INDEX.md`, and moved the next loop candidate from inventory toward the smallest runtime-state facade repair.
Verified: `git diff --check` and `npm run check` passed.
Blocked: None for documentation. Actual baseline commit still requires explicit human approval.
Next: Create a tiny runtime-state facade around `window.BaegeumCity`, migrate one low-risk UI file, add or update one smoke check, then run `npm run check`.
Do not: Add new feature slices, broad refactors, staging, commits, deletion, moves, or mass formatting before the audit pass or explicit human approval.

Date: 2026-05-26
Observed: The next feature slice needed to start venue metadata editing without mutating placement-only `building_shell` cards.
Changed: Added normalized venue metadata storage helpers in `src/data/gambling-venues.js`, added `tools/smoke-venue-metadata-storage.cjs`, and wired it into `npm run check`. Stored drafts now keep only editable venue-owned fields; channels, online room IDs, doors, and building rects remain derived from the base venue contract.
Verified: `node tools/smoke-venue-metadata-storage.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None for the data guardrail. UI for editing venue metadata is still a later slice.
Next: Add the editor UI that calls the venue metadata helpers when returning to construction UX, or continue the current horse-racing slice with browser verification/round-contract documentation.
Do not: Convert `building_shell` cards into enterable venues or store online/channel ownership inside editor building cards.

Date: 2026-05-26
Observed: The human provided a horse-racing stadium HTML mockup and wanted it treated as a design draft, not as a prompt for unrelated redesign or immediate gambling logic.
Changed: Added a map-design-only horse-racing interior: golden scoreboard, 5-lane track, grandstand seating, ticket/betting windows, and the standard exchange ATM. Added renderer delegation and a smoke test so the draft sections stay present.
Verified: `node tools/smoke-horse-racing-interior.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `index.html?spawn=horse-track` entered the venue, showed the scoreboard/track/grandstand/betting windows/exchange ATM, and had zero console errors.
Blocked: None.
Next: Decide whether the next safe slice is visual tuning for the horse-racing interior or a documented horse-race round contract.
Do not: Add race results, payout settlement, ranking changes, or real betting loops before the round/ledger/server-authority boundary is written.

Date: 2026-05-26
Observed: The next feature candidate was to verify the `building_shell` editor placement contract end to end after the baseline strategy was documented.
Changed: Strengthened the build palette smoke test so building shell placement now passes through `createWorldEditorDraft`, stays on the obstacle layer, keeps `building:*` IDs through draft creation, remains non-destructible, and carries no doors, channels, interiors, game type, venue id, or online room id. Split the smoke test into small helpers so the size gate has no long-function warning.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/smoke-world-editor-draft-contract.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Choose venue metadata editing as a separate `venue_anchor` slice; baseline commit still needs explicit human approval.
Do not: Mix venue entry, interiors, economy, online state, staging, committing, deleting, or moving files into the next feature loop without approval.

Date: 2026-05-26
Observed: The Git baseline strategy and review board already describe the no-commit/no-tracked-files state, but the first-read operating rules and boot-packet source list did not yet point future agents to the baseline strategy before git operations.
Changed: Linked `docs/ai-git-baseline-strategy.md` from `AGENTS.md`, added it to the boot packet source-of-truth list, and added a next-agent note to read it before staging, committing, deleting, moving, or mass formatting.
Verified: `git diff --check` and `npm run check` passed.
Blocked: Creating an actual baseline commit still requires explicit human approval.
Next: Verify the building-shell draft/runtime contract, or wait for `baseline 승인` before staging and committing the initial project baseline.
Do not: Stage, commit, delete, move, or mass-format files without explicit human approval.

Date: 2026-05-26
Observed: The documented next governance slice was a Git baseline strategy. `master` has no commits, `git ls-files` is empty, and `git status --short --untracked-files=all` shows the project as untracked.
Changed: Added the observed Git state to `docs/ai-git-baseline-strategy.md` and kept it linked from `docs/INDEX.md`. No files were staged, committed, deleted, or moved.
Verified: `git status --short`, `git diff --check`, and `npm run check` passed.
Blocked: Creating an actual baseline commit requires explicit human approval.
Next: Either verify the building-shell draft/runtime contract, or wait for `baseline 승인` before staging and committing the initial project baseline.
Do not: Stage, commit, delete, move, or mass-format files without explicit human approval.

Date: 2026-05-26
Observed: Boot packet state pointed to construction UX. Placement-only `building-shop-shell` already existed, and the next safe feature action was to expand building-card variants without crossing into venue metadata.
Changed: Added `building-casino-shell` and `building-alley-shell` as placement-only `building_shell` presets. Updated build-palette smoke coverage so all building cards use `building:*` IDs and carry no venue, interior, economy, or game metadata.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `editor.html` showed the `building` group has `building-shop-shell`, `building-casino-shell`, and `building-alley-shell`, with zero console errors.
Blocked: None.
Next: Follow the documented governance loop and define the git baseline strategy for the many untracked files, unless the human redirects back to feature work.
Do not: Attach doors, channels, interiors, economy, or online state to building cards in the same slice.

Date: 2026-05-26
Observed: The human asked what fundamental thing might be missing. Current docs had many feature tracks, but no compact product north star for the first 10 minutes of play.
Changed: Added `docs/baegeum-city-v2-first-play-loop.md`, linked it from `docs/INDEX.md`, and updated the review board and working state so future loops judge features against the first play loop before adding scope.
Verified: `git diff --check` and `npm run check` passed.
Blocked: None.
Next: Define the git baseline strategy for the many untracked files before broad feature work.
Do not: Stage, commit, delete, or move files without explicit human approval.

Date: 2026-05-26
Observed: The human asked to start the next runtime step after the DiceLand-style exchange ATM. The safe scope was odd-even betting reservation only, with no result settlement.
Changed: Added `bet_reserved` as a GameAction type, created `createOddEvenBetReserveEnvelope`, and wired the odd-even table start button to reserve chips through `economy_ledger_entry`. The panel now enables only after a valid 홀/짝 selection and enough chips, then locks the local reservation to avoid duplicate starts.
Verified: `node tools/smoke-odd-even-table-panel.cjs`, `node tools/smoke-local-action-runtime.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser reload of `index.html` had the hidden odd-even panel present, the start button disabled before table seating, and zero console errors.
Blocked: No settlement clock/round authority exists yet, so results, refunds, payouts, and rankings remain intentionally disconnected.
Next: Add a tiny local odd-even round state contract before any result UI: `round_pending`, `round_closed`, `settled`, and one ledger entry per transition.
Do not: Add random win/loss payouts or rankings before round-state and server-authority boundaries are documented.

Date: 2026-05-26
Observed: The human wanted the exchange booth to follow the original DiceLand ATM-style design and be present inside gambling venues, not only at a separate chip exchange building.
Changed: Added `exchange-atm` props to gambling interiors, rendered them as ATM objects, made interior interaction open the exchange panel instead of directly changing money, and wired 10/50/100 chip cash-in/cash-out buttons through `exchange_chips` plus `economy_ledger_entry`.
Verified: `npm run check` passed, including the new `smoke-exchange-atm-panel.cjs` and updated interior interaction smoke. Browser reload of `index.html` had no console errors.
Blocked: Browser page globals are isolated from the inspection scope, so deep runtime state was verified through smoke tests rather than direct in-browser game object mutation.
Next: Connect odd-even betting to `bet_reserved` only, now that chips can be acquired safely through the ATM path.
Do not: Implement random results, payout settlement, or ranking changes before bet reservation is separately verified.

Date: 2026-05-26
Observed: Boot packet default priority pointed to map-editor stability, but the human clarified the map editor is already being worked on. In-game docs identified the next safe runtime slice as odd-even table UI gated by `table_seated`.
Changed: Added a small odd-even table panel that appears only when seated at an odd-even casino table. The panel allows 홀/짝 and 10/50/100 chip selection but does not start bets or write ledger entries. Confirmed DiceLand vendor has reusable exchange/roulette references.
Verified: `npm run check` passed. Browser verification confirmed the odd-even panel is hidden in `venue_lobby`, appears in `table_seated`, keeps the start button disabled, and has no console errors.
Blocked: None.
Next: Wire the odd-even start button to `bet_reserved` only, with no result settlement yet.
Do not: Implement win/loss results, random settlement, or ranking updates before the bet reservation path is documented and verified.

## Loop Log

Date: 2026-05-27
Observed: The phone ecosystem catalog existed, but `app_store` was still only planned and there was no store screen to show planned apps safely inside the phone.
Changed: Added `src/restored/phone/app-store-view.js`, promoted `app_store` to the smartphone-only live phone registry, wired the restored HTML to create the dynamic store app view, and updated the phone ecosystem/contract checks plus docs. The store renders installed, locked, planned, and online-prep rows without save mutation.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-phone-app-ecosystem.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification confirmed folder phone hides store/futures, smartphone shows store/futures, the Baegeum Store renders installed/planned/online-prep rows, and no captured browser errors were present.
Blocked: News, stock, and futures still render inside `baegeum-city-v2-dice.html`; BaeTalk, Baegeum Gallery, rankings, bank/pay, map, and online lobby remain catalog-only.
Next: Run the phone checks, full `npm run check`, and browser-verify folder-phone versus smartphone store gates; then extract news/stock/futures renderers before adding messenger/community UI.
Do not: Add planned apps to bottom navigation or make optional install state persistent until the save contract owns it.

Date: 2026-05-27
Observed: The live phone registry was separated from bottom navigation, but only the relationship app renderer was extracted. News, stock, and futures still render in the restored HTML, and planned apps such as messenger, app store, and virtual community had no explicit catalog boundary.
Changed: Added `src/restored/phone/phone-app-ecosystem-contract.js`, `docs/plans/restored-phone-app-ecosystem.md`, and `tools/check-restored-phone-app-ecosystem.cjs`. The plan separates live apps from planned app-store candidates and defines BaeTalk-style messenger, Baegeum Store, relationships, Baegeum Gallery-style community, rankings, bank/pay, map, and online lobby boundaries.
Verified: `node tools/check-restored-phone-app-ecosystem.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: No live app-store, messenger, or community UI has been wired yet. Planned apps must not enter the live phone registry until each has a small app view.
Next: Add a small Baegeum Store phone app shell that reads the ecosystem catalog, then extract news/stock/futures renderers before expanding BaeTalk or Baegeum Gallery.
Do not: Add planned apps directly to bottom navigation or the live registry without a view and gate.

Date: 2026-05-27
Observed: Relationship logs were visible in the phone app, but no live action wrote them and legacy modal actions still mutated `p.love` directly.
Changed: Added `src/restored/systems/relationship-event-runtime.js` for walk encounter, interest, call, AI talk, gift, intimacy, marriage, and passive drift events. Wired the restored HTML relationship handlers through `commitRelationshipAction()`, preserved legacy `love` compatibility, kept My Info summary-only, and extended relationship/growth checks plus docs.
Verified: `node tools/check-restored-relationship-contract.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, My Info relationship summary, phone relationship app switching, empty partner/log states, and no captured browser errors.
Blocked: Dedicated date, DM, confession, and inventory/economy-envelope gift surfaces are still pending. Casino, loan, pawnshop, stock, and job reactions remain intentionally disconnected.
Next: Add a deliberate phone date/DM/confession surface that consumes the relationship event runtime before casino/loan/pawnshop reactions.
Do not: Reintroduce direct `p.love` mutation, move the full partner list back into My Info, or let casino/loan/pawnshop handlers mutate relationship state directly.

Date: 2026-05-27
Observed: The phone relationship app could show partner cards from the v2 contract, but it had no visible place for `relationshipLogs`, so the next event slice would have nowhere to land in UI.
Changed: Added `relationshipLogs` to restored initial state and storage merge, expanded `src/restored/phone/relationship-app-view.js` to render recent relationship logs, mounted `phone-relationship-log-list` in the restored HTML, and updated relationship/phone/growth checks plus docs.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-relationship-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, phone relationship app switching, empty partner state, empty relationship-log state, no My Info `partner-list`, and no captured browser errors.
Blocked: No live source event creates relationship logs yet; DM/date/confession surfaces remain pending.
Next: Wire one safe source event, preferably a local job/date event, to create a relationship log before casino, loan, pawnshop, or gift reactions.
Do not: Let casino, loan, pawnshop, stock, or gift handlers directly mutate affection/trust/stability/risk or write private relationship logs without the event boundary.

Date: 2026-05-27
Observed: The phone relationship app still rendered its partner cards inline in `baegeum-city-v2-dice.html` after My Info started reading the v2 relationship contract.
Changed: Added `src/restored/phone/relationship-app-view.js`, delegated `renderRelationshipPhoneApp()` to that renderer, updated the phone/relationship checks, and refreshed the restored relationship/recomposition/UI planning docs.
Verified: `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-restored-relationship-contract.cjs`, `node tools/check-restored-planning-kit.cjs`, `node tools/check-restored-growth-architecture.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, My Info relationship summary, no My Info `partner-list`, phone relationship app switching, empty partner state, and no captured browser errors.
Blocked: Relationship logs, DM/date surfaces, and source-event wiring are still pending.
Next: Add relationship log rendering or wire one safe job/date relationship event before casino, loan, pawnshop, or gift reactions.
Do not: Put partner cards back inline in the restored HTML or move the full partner list back into My Info.

Date: 2026-05-27
Observed: The relationship v2 contract existed, but My Info and the phone relationship badge still counted only legacy `isLover` values.
Changed: Added `src/restored/ui/relationship-summary-view.js`, wired My Info to render a compact relationship summary card from the v2 contract, and made the phone relationship badge use the same summary label. Extended the relationship check to guard the summary view and My Info DOM boundary.
Verified: `node tools/check-restored-relationship-contract.cjs`, `node tools/check-restored-player-profile.cjs`, `node tools/check-restored-phone-app-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, `relationship-summary-card`, no My Info `partner-list`, the phone partner-list still present, and no captured browser errors.
Blocked: Full phone partner-card extraction, relationship logs, and source-event wiring are still pending.
Next: Extract the phone relationship app renderer under `src/restored/phone/`, then connect one safe job/date relationship event.
Do not: Put the full partner list back into My Info or mutate affection/trust/stability/risk directly from casino, stock, loan, pawnshop, gift, or job handlers.

Date: 2026-05-27
Observed: The next documented relationship slice was a pure contract before UI, so the live restored HTML should stay untouched.
Changed: Added `src/restored/systems/relationship-contract.js` with legacy `love` migration, relationship stage inference, affection/trust/stability/risk clamping, confession readiness checks, summary selectors, and relationship log envelopes. Added `tools/check-restored-relationship-contract.cjs`, wired it into `npm run check`, and updated the relationship/recomposition docs.
Verified: `node tools/check-restored-relationship-contract.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: Live My Info and phone relationship UI are not connected to the new contract yet.
Next: Add My Info relationship summary selectors/UI or extract the phone relationship app renderer under `src/restored/phone/`.
Do not: Mutate partner state directly from casino, stock, loan, pawnshop, gift, or job handlers.

Date: 2026-05-27
Observed: The human identified the lover/relationship system as a key next step, but explicitly asked to plan it first instead of implementing everything at once.
Changed: Added `docs/plans/restored-lover-relationship-system.md`, linked it from `docs/INDEX.md` and `docs/plans/README.md`, and guarded it through `tools/check-restored-planning-kit.cjs`. The plan keeps My Info as social/emotional summary tabs, keeps full partner flow inside the phone relationship app, and requires relationship changes to consume events rather than direct casino/stock/loan/pawnshop/job mutations.
Verified: `node tools/check-restored-planning-kit.cjs`, `git diff --check`, and `npm run check` passed.
Blocked: None.
Next: Add a pure `src/restored/systems/relationship-contract.js` with migration, stage, clamp, selector, and relationship-log helpers before UI wiring.
Do not: Put the full partner list back into My Info, mutate partner state from money/gambling handlers, or make AI-generated dialogue a hard dependency.

Date: 2026-05-26
Observed: The human wanted to move past verification and redesign the lobby so it only works after online connection, using Iron Line as a reference without copying the combat game.
Changed: Added `docs/baegeum-city-v2-online-lobby-contract.md` and linked it from `docs/INDEX.md`. The contract defines online-only lobby gates, allowed state flow, minimum session/room data, Iron Line concepts to reuse, concepts to reject, and the next safe implementation slice.
Verified: `git diff --check` and `npm.cmd run check` passed.
Blocked: Browser automation for localhost was blocked by the client in the previous verification attempt, so the next implementation should rely on smoke tests first and browser-check only when the app tab is available.
Next: Add a pure `online-lobby-contract` data module and smoke test before building any lobby UI.
Do not: Build a fake offline lobby, copy Iron Line combat/team/loadout systems, or allow city entry before `join_result.ok` and version checks.

Date: 2026-05-26
Observed: Boot packet state pointed to construction UX. Pinned presets, category folding, and the `building_shell` taxonomy were already documented, leaving placement-only building card v0 as the next safe map-editor slice.
Changed: Added `빈 상가` as a build preset under the new `건물` group. Placed building cards create `objectLayer: "obstacle"`, `kind: "building"`, `objectKind: "building_shell"` objects with `building:0001` IDs, without venue entry, interiors, economy, or online behavior.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` confirmed the `건물` group, `빈 상가` card, `빈 상가 배치 중` state, successful placement, draft item `building:0001`, `objectKind: "building_shell"`, and no doors/channels/interior/economy fields or console errors.
Blocked: None.
Next: Follow the current next loop candidate: define a git baseline strategy for the many untracked files, or continue feature work with building-card variants/venue metadata if the human redirects.
Do not: Attach entry/interior/economy behavior to building cards in the same slice.

Date: 2026-05-26
Observed: The human asked to start the restored prototype from inside the home, make the bottom tabs change by location, and keep the phone UI above those tabs instead of as a fixed bottom tab.
Changed: Added location-aware bottom navigation for `home_inside`, `home_front`, transit, and the initial three cities. The playable restored HTML now starts from home actions, moves outside to fast food/labor/convenience/bus/home actions, opens city routes from the bus stop, and exposes the phone through a floating dock. Added `src/restored/ui/place-surface-copy.js` so place copy stays outside the HTML shell, and updated shell/growth/phone checks to enforce phone-dock plus location-nav wiring.
Verified: `npm run check` passed. Browser verification on `http://127.0.0.1:4173/baegeum-city-v2-dice.html` confirmed guest entry, home tabs, outside tabs, bus stop city tabs, Dice City tabs, and no runtime errors beyond the existing favicon 404/Tailwind CDN warning.
Blocked: None.
Next: Refine the visual design of the home/place surfaces and begin moving real actions into the new place shells through ledger/action contracts.
Do not: Reintroduce fixed bottom tabs for phone/news/stock/futures, or attach new economy effects to place buttons without the documented ledger/action flow.

Date: 2026-05-26
Observed: The human asked for a fundamental check before continuing. Current docs pointed to building card v0, but the missing safety rail was the taxonomy that prevents a visual building card from becoming an accidental venue/economy object.
Changed: Updated `docs/baegeum-city-v2-world-object-system.md` with object-layer, object-kind, capability, static-map, runtime-state, and event-ledger boundaries. Building card v0 is now explicitly `building_shell` placement only, not `venue_anchor`.
Verified: `git diff --check` and `npm run check` passed.
Blocked: None.
Next: Add placement-only building card v0 using the `building_shell` boundary.
Do not: Attach doors, channels, interiors, economy, or online state to building cards in the same slice.

Date: 2026-05-26
Observed: Boot packet directed the loop to construction UX. Category groups already existed visually, but their open/closed state was not owned by editor state, so the palette behavior was harder to verify or preserve across future re-renders.
Changed: Added explicit build category open-state helpers, wired category toggle state into `baegeum-world-editor.js`, and expanded the build palette smoke test to cover default collapse and category reopening.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, `git diff --check`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` confirmed `고정` starts open, `자연물/거리 시설/광고/간판` start collapsed, `자연물` opens on click, and there are zero console errors.
Blocked: First `npm run check` attempts hit transient OneDrive/module visibility errors around odd-even files; rerunning the specific smoke and then the full check passed with the files present.
Next: Continue with placement-only building card v0, without venue/interior/economy behavior.
Do not: Change saved-map contracts, runtime economy, online authority, or public blog state in this slice.

Date: 2026-05-26
Observed: The human asked whether the autonomous loop was missing a more fundamental control structure. The boot packet starts new agents correctly, but the human still needed a one-page way to review objective, verification, risks, approval boundaries, and next safe action.
Changed: Added `docs/ai-review-board.md`, linked it from `docs/INDEX.md`, and added it to the next-agent notes.
Verified: `git diff --check` passed. `npm run check` first saw a transient missing-module state for `src/ui/odd-even-table-panel.js`, then passed on rerun with the file present.
Blocked: No git baseline exists yet; the repository still has many untracked files, so future agents need extra care when reviewing diffs.
Next: Continue either placement-only building card v0, reconcile stale odd-even state notes, or define the separate git baseline strategy.
Do not: Install external Ouroboros, change global Codex setup, or alter saved-data/economy/online contracts without approval.

Date: 2026-05-26
Observed: Work queue and map-editor docs pointed to construction UX. The previous map-editor loop already added pinned presets, leaving category folding as the smallest local follow-up. Runtime odd-even reservation remains queued separately.
Changed: Added editor-only preset categories and changed the build palette from `고정` plus `전체` to `고정`, `자연물`, `거리 시설`, and `광고/간판` collapsible groups. The `고정` group stays open and category groups start collapsed.
Verified: `node tools/smoke-world-editor-build-palette.cjs`, `node tools/check-size.cjs`, and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` confirmed the four groups, no console errors, opening `자연물`, and selecting `활엽수` hides the list and shows `활엽수 배치 중`.
Blocked: None.
Next: Add building card v0 as placement-only construction UX, or return to the queued runtime `bet_reserved` slice if the human points back to in-game economy.
Do not: Add venue entry/interior/economy behavior while adding building cards.

Date: 2026-05-26
Observed: The next documented safe slice was construction UX. Pinned presets were smaller than category folding and did not touch saved draft/runtime contracts.
Changed: Added pinned build preset metadata for streetlight, billboard, and bench. The build palette now renders a `고정` group above the full `전체` group. Added a build palette smoke check.
Verified: `node tools/check-size.cjs`, `node tools/smoke-world-editor-build-palette.cjs`, `node tools/smoke-editor-entry.cjs`, `git diff --check`, `npm run check`, and browser verification of `editor.html` showing `고정`/`전체`, pinned cards `가로등/광고판/벤치`, and zero console errors.
Blocked: None.
Next: Continue construction UX with category grouping/collapse.
Do not: Change draft schema or add building cards before the category/palette path is stable.

Date: 2026-05-26
Observed: Boot packet loop pointed to the remaining map-editor selection safety work. Return-to-original needed a concrete original-map baseline and browser verification.
Changed: Added the `원위치` selection action, kept the editor reset baseline in `state.originalMap`, and exposed a small read-only debug snapshot hook for future editor checks.
Verified: `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` dragged `a-tree-1` from x=1030 to x=1750, then `원위치` returned it to x=1030/y=2060.
Blocked: None.
Next: Continue with construction UX: grouped build categories or pinned presets.
Do not: Change draft schema, saved-data compatibility, or runtime gameplay contracts for this UI-only slice.

Date: 2026-05-26
Observed: The next documented map-editor slice was selection actionbar safety. Coordinate lock and return-to-original were already present, leaving layer lock as the smallest safe remaining action.
Changed: Added layer lock state for scenery/obstacle layers, wired a `레이어잠금` actionbar button, made layer locks block movement and coordinate input, and added a pure smoke check for selection/layer lock behavior. Trimmed one blank line in `src/renderers/world-renderer.js` so the existing 300-line gate remains green.
Verified: `git diff --check` and `npm run check` passed. Browser verification on `http://127.0.0.1:4173/editor.html` confirmed `좌표잠금` changes to `잠금해제`, `레이어잠금` changes to `레이어해제`, X/Y inputs are disabled while locked, and there are zero console errors.
Blocked: None.
Next: Continue with construction UX: grouped build categories or pinned presets.
Do not: Change draft schema, saved-data compatibility, or runtime gameplay contracts for this UI-only slice.

Date: 2026-05-26
Observed: Boot packet and work queue pointed to map-editor stability. `npm run check` was green before new work.
Changed: Validation report rows now render as buttons when their targets can be resolved. Clicking a report item selects the matching scenery, obstacle, or road point and centers the editor camera on it.
Verified: `node tools/check-size.cjs`, `node tools/smoke-world-editor-draft-contract.cjs`, `node tools/smoke-editor-entry.cjs`, `git diff --check`, `npm run check`, and browser load of `http://127.0.0.1:4173/editor.html` with zero console errors.
Blocked: None.
Next: Continue map-editor stability with selection actionbar utility work or deeper saved-vs-current diff details.
Do not: Install external Ouroboros or change schema/global config without human approval.

Date: 2026-05-26
Observed: map editor already had draft contracts, ID prefix validation, and pre-save validation report.
Changed: added saved-vs-current draft comparison for object add/delete/edit, road point changes, and map size changes in the editor work history panel.
Verified: `npm run check` passed, and browser check on `editor.html` showed `오브젝트 추가 1` after placing a bench.
Blocked: none.
Next: selection actionbar utility work from the map-editor track.
Do not: rewrite the draft schema for this slice.

Date: 2026-05-26
Observed: return-to-original action already existed, while coordinate lock was still missing from the actionbar.
Changed: added session-local coordinate lock for selected scenery/building objects; locked selections disable X/Y inputs and ignore drag movement without changing draft schema.
Verified: covered by the later selection lock smoke test and browser check in the layer-lock loop.
Blocked: none.
Next: continue with layer lock or construction-list category UX.
Do not: persist lock state into saved map drafts.
