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

On localhost, the client defaults to:

```text
ws://127.0.0.1:8787/ws
```

## Server Rules

- The first player in the room becomes the temporary host.
- Host start sends a server-owned 10-second countdown.
- Durable Object storage persists countdown phase across alarm wakeups, then resets the fixed public room to lobby when the last socket leaves.
- Map vote, rematch, final ranking authority, checkpoint reward authority, and moderation tools remain future work.
- Clients may send input, chat, attack, and skill packets.
- Clients must not decide final ranking, rewards, room capacity, or server snapshots.

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
