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

- The Worker tags the first player as the temporary public-room host for this v2 loop.
- Public admin is disabled for the v2 public loop. `singularity-race-admin` remains a dev/test page only; public `/admin/*` Worker routes return `public_admin_disabled` and the public admin UI does not call open/reset/start endpoints.
- The first player who joins the public room becomes the temporary room host. The host's normal user page may send `start_request`; the Worker validates host ownership, lobby phase, and room population before starting countdown. Other players see the waiting state and cannot start the race.
- The host start request sends a server-owned 10-second countdown. The client only requests start; it does not decide the start time.
- During countdown/racing, new player and spectator joins are blocked with `room_join_closed`. Mid-race spectator entry is intentionally deferred until the simpler public loop is stable.
- Durable Object storage persists countdown phase across alarm wakeups, then resets the fixed public room to lobby when the last socket leaves.
- Map vote, rematch, final ranking authority, checkpoint reward authority, and moderation tools remain future work.
- Clients may send input, chat, attack, and skill packets.
- Clients must not decide final ranking, rewards, room capacity, or server snapshots.
- Worker movement must use the same input movement helper as client prediction before advancing progress/lane. Legacy PC `direction` frames still project onto the current race trail tangent/normal, while mobile frames may carry `intent.forward` and `intent.lateral` so phone joystick input cannot become reverse progress on curved or vertical route sections. Run/sprint progress speeds must stay aligned with the client prediction constants (`0.58` run, `0.76` sprint), held mobile input must stay at or below the 10 Hz input budget, and map obstacle collision must flow through `src/restored/games/singularity-race-obstacle-contract.js` on both client prediction and Worker movement. The Worker must not treat every nonzero direction as forward progress, use raw `direction.y` as lane movement, run faster than the client prediction, or leave obstacle hitboxes client-only, because those mismatches cause rubber-banding on curves, vertical track segments, and collisions.
- Client snapshots still render the local participant as `you`; the snapshot merge must preserve local prediction for that normalized runner id so 5 Hz snapshots ease toward server authority instead of snapping the player back every packet.

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
