# Singularity Race Cloudflare Online

Conclusion: the first public online slice is a single Cloudflare Workers + Durable Objects room for Singularity Race only.

## Scope

- One fixed room: `room:singularity-race:public-001`.
- Runner cap: 50.
- Spectator cap: 32.
- Client input budget: 10 Hz or lower.
- Server snapshot cadence: 5 Hz by default, with the client contract allowing up to 8 Hz later.
- Chat is server-delivered and rate-limited.
- No common engine, city economy, item market, login, billing, or multi-room matchmaking in this slice.

## Files

- `workers/singularity-race-worker.js`: Cloudflare Worker entry and `SingularityRaceRoom` Durable Object.
- `wrangler.toml`: Worker + Durable Object binding.
- `src/restored/online/singularity-race-cloudflare-client.js`: browser WebSocket client used only when `?online=cloudflare` is present.
- `tools/smoke-singularity-race-cloudflare-online.cjs`: static contract guard for the online slice.

## Player URL

After deploying the Worker, open the game with:

```text
singularity-race.html?online=cloudflare&serverUrl=wss://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/ws
```

Current public Worker:

```text
https://singularity-race-online.rneetn.workers.dev
wss://singularity-race-online.rneetn.workers.dev/ws
```

Current public player/dev-admin URLs:

```text
https://singularity-race-client.pages.dev/singularity-race?online=cloudflare&serverUrl=wss%3A%2F%2Fsingularity-race-online.rneetn.workers.dev%2Fws
https://singularity-race-client.pages.dev/singularity-race-admin?online=cloudflare&serverUrl=wss%3A%2F%2Fsingularity-race-online.rneetn.workers.dev%2Fws
```

On localhost, the client defaults to:

```text
ws://127.0.0.1:8787/ws
```

## Server Rules

- The Worker does not assign public start authority to players. Public players can join, chat, move inside the bounded start paddock/start rail after admin in-game entry opens, and continue from that server-tracked position when the gate opens, but they cannot start the countdown.
- Public admin is available only as an `ADMIN_TOKEN`-authenticated minimal Worker console. `singularity-race-admin.html?online=cloudflare&adminToken=...` may call `/admin/state`, `/admin/create`, `/admin/deactivate`, `/admin/open`, `/admin/close`, `/admin/start`, `/admin/reset`, and `/admin/map` against the same fixed public room. The page treats `adminToken` as a one-time handoff, stores it only in tab-scoped `sessionStorage`, and removes it from the address bar. Without the token, the page may read `/rooms` but cannot mutate room state.
- The public admin page must never join as a player, create `operator=1` links, or write public room state through localStorage/BroadcastChannel. Dev admin remains separate through `?devOnline=1`.
- The Durable Object remains one fixed backend room, but public visibility is gated by `roomActive`. A fresh Worker state and `/admin/deactivate` return `roomActive:false`, `/rooms` shows no joinable public room, and player/spectator WebSocket joins are rejected with `room_not_created`. `/admin/create` flips the same fixed room to `roomActive:true`, keeps `entryOpen:false`, and makes the user page show the public room.
- Public room in-game entry starts closed by default after `/admin/create`. Players may still join the public waiting queue while `entryOpen:false`; the admin console uses `/admin/open` to move waiting players into the in-game start rail.
- After players join the queue, the user page shows an admin in-game-entry wait state. After `/admin/open`, connected players enter the race screen/start rail and wait for admin start. While waiting they may move laterally/backward/forward inside the start paddock, but progress is clamped before the start gate. Only authenticated `/admin/start` may start the Worker-owned 10-second countdown. At least one player must be present, `entryOpen` must be true, phase must be lobby/finished, and the client never decides the gate-open time.
- Player `start_request`/`start_race` packets are rejected with `admin_start_required`.
- During countdown/racing, new player joins are blocked with `room_join_closed`, while spectator joins remain allowed when spectator capacity is available. `entryOpen:false` must not block lobby/queue joins; it only blocks admin start and in-game start-rail entry.
- Durable Object storage persists countdown phase across alarm wakeups, then resets the fixed public room to lobby when the last socket leaves. A finished/reset room keeps entry closed until the admin explicitly opens the next round.
- Map vote, rematch, final ranking authority, checkpoint reward authority, and moderation tools remain future work.
- Clients may send input, chat, attack, and skill packets. Public `attack_action` packets are server-decided by the Worker: the client may send aim intent, but the Worker ignores client-origin positions, uses the runner sessions' current `progressPercent + laneOffsetPx`, applies cooldown, and publishes stun/slow state through `state_snapshot`. Public basic attacks are impact/stun only for now and do not reduce HP.
- Clients must not decide final ranking, rewards, room capacity, or server snapshots.
- Public Worker movement is last-intent ticked: accepted `input_update` packets store normalized intent/direction only, then a 100 ms Durable Object server tick advances from the latest fresh input for up to 550 ms. Packet arrival cadence must not be the movement clock. The same tick loop owns pre-race paddock movement during lobby `entryOpen:true` and countdown, using the start-gate clamp until the room phase becomes `racing`.
- Worker movement must use the same input movement helper as client prediction before advancing progress/lane. Legacy PC `direction` frames still project onto the current race trail tangent/normal, while mobile frames carry signed `intent.forward` and `intent.lateral` so phone joystick input can move forward, backward, and sideways consistently on curved or vertical route sections. Run/sprint progress speeds must stay aligned with the client prediction constants (`0.58` run, `0.76` sprint), backward progress must use the shared slow-backward multiplier, held mobile input must be pumped independently from the render loop while staying at or below the 10 Hz input budget, and map obstacle collision must flow through `src/restored/games/singularity-race-obstacle-contract.js` on both client prediction and Worker movement. The Worker must not treat every nonzero direction as forward progress, use raw `direction.y` as lane movement, run faster than the client prediction, or leave obstacle hitboxes client-only, because those mismatches cause rubber-banding on curves, vertical track segments, and collisions.
- Client snapshots still render the local participant as `you`; the snapshot merge must preserve local prediction for that normalized runner id so 5 Hz snapshots ease toward server authority instead of snapping the player back every packet.
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
