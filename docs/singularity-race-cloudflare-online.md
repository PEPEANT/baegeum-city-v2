# Singularity Race Cloudflare Online

Conclusion: the public online slice uses Cloudflare Workers + Durable Objects for the fixed public room and short-code user rooms in Singularity Race only.

## Scope

- One fixed public room: `room:singularity-race:public-001`.
- User-created rooms use the same Durable Object class with IDs like `room:singularity-race:user:<CODE>`, where `<CODE>` is a random six-character short code.
- Runner cap: 50.
- Spectator cap: 32.
- Client input budget: 10 Hz or lower.
- Server snapshot cadence: 10 Hz by default, matching the current 100 ms server tick.
- Chat is server-delivered and rate-limited.
- No common engine, city economy, item market, login, billing, or full multi-room matchmaking in this slice. User rooms now have a minimal lobby directory so active short-code rooms can be selected from the player page, but broader matchmaking, search, ranking, and cross-game routing remain out of scope.

## Files

- `workers/singularity-race-worker.js`: Cloudflare Worker entry and `SingularityRaceRoom` Durable Object.
- `wrangler.toml`: Worker + Durable Object binding.
- `src/restored/online/singularity-race-cloudflare-client.js`: browser WebSocket client used when `?online=cloudflare` is present, or by default on the public deployment hosts.
- `tools/smoke-singularity-race-cloudflare-online.cjs`: static contract guard for the online slice.

## Player URL

After deploying the Worker, open the game with:

```text
singularity-race.html?online=cloudflare&serverUrl=wss://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/ws
```

On the current public deployment hosts, the player page also defaults to the public Worker when opened without query parameters. This keeps shared links like `/singularity-race` or Cloudflare Pages preview links from falling back to a disconnected local mode.

Current public Worker:

```text
https://singularity-race-online.rneetn.workers.dev
wss://singularity-race-online.rneetn.workers.dev/ws
```

Current public player/dev-admin URLs:

```text
https://singularity-race-client.pages.dev/singularity-race
https://singularity-race-client.pages.dev/singularity-race?online=cloudflare&serverUrl=wss%3A%2F%2Fsingularity-race-online.rneetn.workers.dev%2Fws
https://singularity-race-client.pages.dev/singularity-race-admin?online=cloudflare&serverUrl=wss%3A%2F%2Fsingularity-race-online.rneetn.workers.dev%2Fws
```

On localhost, the client defaults to:

```text
ws://127.0.0.1:8787/ws
```

## Server Rules

- The Worker does not assign public start authority to players. Public players can join, chat, move inside the bounded start paddock/start rail after admin in-game entry opens, and continue from that server-tracked position when the gate opens, but they cannot start the countdown.
- Public admin is available only as an `ADMIN_TOKEN`-authenticated minimal Worker console. `singularity-race-admin.html?online=cloudflare&adminToken=...` may call `/admin/state`, `/admin/create`, `/admin/deactivate`, `/admin/open`, `/admin/close`, `/admin/start`, `/admin/reset`, `/admin/map`, and `/admin/narration` against the same fixed public room. The page treats `adminToken` as a one-time handoff, stores it only in tab-scoped `sessionStorage`, and removes it from the address bar. Without the token, the page may read `/rooms` but cannot mutate room state.
- The public admin page must never join as a player, create `operator=1` links, or write public room state through localStorage/BroadcastChannel. Dev admin remains separate through `?devOnline=1`.
- The Durable Object remains one fixed backend room, but public visibility is gated by `roomActive`. A fresh Worker state and `/admin/deactivate` return `roomActive:false`, `/rooms` shows no joinable public room, and player/spectator WebSocket joins are rejected with `room_not_created`. `/admin/create` flips the same fixed room to `roomActive:true`, keeps `entryOpen:false`, and makes the user page show the public room.
- Public room in-game entry starts closed by default after `/admin/create`. Players may still join the public waiting queue while `entryOpen:false`; the admin console uses `/admin/open` to move waiting players into the in-game start rail.
- User-room creation is player-page scoped. The player page may send an optional typed `displayName` to `POST /rooms/create`; a blank room-name input falls back to the creator nickname-based default. The response returns a short code, room id, and one host token to the creator. The browser stores that host token only in tab-scoped `sessionStorage`.
- `/rooms` remains backward-compatible as a single selected-room summary, and `includeUserRooms=1` on the public room adds `rooms`/`userRooms` directory arrays for active non-closed user rooms that still have at least one connected player/host. Directory entries are compact summaries for cards and do not include participant snapshots. The player page must keep selected-room status fetches separate from room-directory fetches: the directory is always requested from `room:singularity-race:public-001&includeUserRooms=1`, even while the selected room is a user room. The fixed public room is an internal directory/admin anchor and should not render as a normal player lobby card or selected-room title. Zero-player user rooms are treated as stale/ghost cards and hidden from the player directory.
- User-room host controls are room-scoped and live inside the queue action area instead of a floating room-panel overlay. The queue view shows the room open/start/cancel actions inline; the race staging view shows only a compact top-center start button, and racing/countdown hides host controls from the track. `POST /rooms/host/open`, `/rooms/host/start`, and `/rooms/host/end` require `X-Host-Token` for the selected room and must not grant global admin authority. Host start still requires an active lobby/finished phase, at least one player, and `entryOpen:true`. If the host player disconnects while the user room is still in the lobby/queue phase, the Worker closes the room with `host_disconnected`.
- Queue slots and in-race nameplates preserve the Worker `host` marker and label that runner as `방장`, so participants can see who owns the room before and during a race.
- User-room creation is rate-limited by a registry Durable Object path through the fixed public room. The current guard is 60 seconds per host client/IP key and 12 active user rooms at once; old records are refreshed from each room summary before creating a new room.
- User-room lifecycle is now status-based: `open` -> `results_finalized` -> `closed` -> `deleted`. Unstarted idle user rooms are deleted automatically, finalized rooms auto-close after a short result display window, and closed rooms auto-delete after their result TTL. Closed/deleted rooms reject joins, chat, start, and open commands.
- Race results are server-finalized once. When the 30 second finish window expires, the Worker creates `resultSnapshot` with room code, rankings, finish deltas, DNF progress, total players, and finalization time, then emits it in `race_finished` and room summaries. Clients must render result panels, result-card PNG saving, Web Share, and text-copy fallback from that snapshot instead of recalculating rankings at room close.
- User-room host end is allowed before or after `resultSnapshot` exists. Before final results, `/rooms/host/end` is a confirmed room cancel: it closes the room, clears the host token, disconnects participants, and auto-deletes later without creating a client-side ranking. After final results, it closes the room while keeping the server `resultSnapshot` briefly for save/share until the auto-delete TTL removes the room from the active registry.
- After players join the queue, the user page shows an admin in-game-entry wait state. After `/admin/open`, connected players enter the race screen/start rail and wait for admin start. While waiting they may move laterally/backward/forward inside the start paddock, but progress is clamped before the start gate. Only authenticated `/admin/start` may start the Worker-owned 10-second countdown. At least one player must be present, `entryOpen` must be true, phase must be lobby/finished, and the client never decides the gate-open time.
- Authenticated `/admin/narration` is presentation-only and may broadcast `narration_start` only while the public room is active, has at least one player, has in-game entry open, and is still before the race countdown/racing phase. Clients reuse the existing local narration overlay from the server packet; narration must not become movement, ranking, item, reward, or finish authority.
- Player `start_request`/`start_race` packets are rejected with `admin_start_required`.
- During countdown/racing, new player joins are blocked with `room_join_closed`, while spectator joins remain allowed when spectator capacity is available. `entryOpen:false` must not block lobby/queue joins; it only blocks admin start and in-game start-rail entry. A user room that is still `phase:"lobby"` remains joinable and visible after the host opens entry, so late players can enter until the host/admin actually starts countdown.
- Durable Object storage persists countdown phase across alarm wakeups, then resets the fixed public room to lobby when the last socket leaves. A finished/reset room keeps entry closed until the admin explicitly opens the next round.
- Race finish no longer waits forever for every connected player. The first finisher starts a Worker-owned fixed 30 second finish window, even when that finisher is the only current player, so the countdown is always visible before finalization. The Worker persists and snapshots `raceStartedAtMs`, `finishWindowStartedAtMs`, `finishWindowEndsAtMs`, remaining time, and finished/player counts; it sets a Durable Object alarm at the window end so AFK or stuck runners cannot keep the room in `racing`. When the window expires, the Worker emits `race_finished` with `finish_window_expired`, unfinished runners stay DNF, and the client result list sorts finishers before DNF progress order.
- Map vote, rematch, final ranking authority, checkpoint reward authority, and moderation tools remain future work.
- Clients may send input, chat, attack, and skill packets. Public `attack_action` packets are server-decided by the Worker: the client may send aim intent, but the Worker ignores client-origin positions, uses the runner sessions' current `progressPercent + laneOffsetPx`, applies cooldown, and publishes stun/slow state through `state_snapshot`. The client also consumes server-owned `attack_action` and `skill_use` packets as short attacker/target visuals before the next snapshot, so public hits do not look invisible. Public basic attacks are impact/stun only for now, do not reduce HP, and use the shared `singularity-race-basic-attack-range.js` pixel capsule contract: 118px forward reach, 54px contact radius, and 18px rear grace after converting each runner to trail-world pixels.
- Clients must not decide final ranking, rewards, room capacity, or server snapshots.
- Public Worker movement is last-intent ticked: accepted `input_update` packets store normalized intent/direction only, then a 100 ms Durable Object server tick advances from the latest fresh input for up to 550 ms. Packet arrival cadence must not be the movement clock. The same tick loop owns pre-race paddock movement during lobby `entryOpen:true` and countdown, using the start-gate clamp until the room phase becomes `racing`.
- Worker movement must use the same input movement helper as client prediction before advancing progress/lane. Legacy PC `direction` frames still project onto the current race trail tangent/normal, while mobile frames carry signed `intent.forward` and `intent.lateral` so phone joystick input can move forward, backward, and sideways consistently on curved or vertical route sections. The live player control scheme has no Shift/mobile sprint speed lift: base progress speed is `0.64%/s`, sprint packets are normalized to that same speed, and lane movement is `134px/s`. Backward progress must use the shared slow-backward multiplier, held mobile input must be pumped independently from the render loop while staying at or below the 10 Hz input budget, and map obstacle collision must flow through `src/restored/games/singularity-race-obstacle-contract.js` on both client prediction and Worker movement. The Worker must not treat every nonzero direction as forward progress, use raw `direction.y` as lane movement, run faster than the client prediction, or leave obstacle hitboxes client-only, because those mismatches cause rubber-banding on curves, vertical track segments, and collisions.
- Client snapshots still render the local participant as `you`; the snapshot merge must preserve local prediction for that normalized runner id so 10 Hz snapshots ease toward server authority instead of snapping the player back every packet.
- Durable Object storage is helpful but not allowed to become a hard public-room dependency. If free-tier storage row writes or alarms are temporarily unavailable, the Worker must catch the error, keep `/rooms` and WebSocket joins alive, and use the in-memory room state plus a countdown timer fallback for the active one-room v0.1 loop.
- Public loading must not depend on a perfectly fast Worker response. The player page should render the lobby/profile shell first, then refresh the public room summary through `/rooms` in the background. If `/rooms` is slow or fails, the UI must show a visible server-check/retry state instead of a blank page or silent stale lobby. The manual room refresh button in Cloudflare mode must retry `/rooms`, not reload the whole page.

## Verification

Run:

```text
npm run check:singularity-race
node tools/smoke-singularity-race-cloudflare-online.cjs
```

Deploy rehearsal, once Cloudflare login exists:

```text
npx wrangler dev
npx wrangler deploy
```

Do not paste account tokens or API secrets into the repo or chat.
