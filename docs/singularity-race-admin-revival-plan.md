# Singularity Race Public Admin Revival Plan

Conclusion: public admin can return, but only as a Worker-authenticated control console. It must not behave like a player client, reuse the dev localStorage transport, or directly mutate client phase.

## Purpose

This plan restores `singularity-race-admin.html?online=cloudflare` as a minimal public operations console for the one fixed Cloudflare room.

The previous failure was not mainly a UI button bug. The dev admin plane used `localStorage` plus `BroadcastChannel`, while the public game plane used Cloudflare Worker and Durable Object over HTTP/WebSocket. Those planes do not talk across devices, so public admin commands could never reliably reach the Worker.

## Current Rule

- User page: player entry, player chat, first-player temporary host fallback.
- Public admin page: room status and authenticated Worker commands only.
- Worker: single authority for phase, entry state, start, reset, map, and room summary.
- Dev admin: stays local and uses existing `?devOnline=1` localStorage/BroadcastChannel rehearsal.
- Public admin: uses only Worker HTTP endpoints with `ADMIN_TOKEN`.

## Authentication

Use `adminToken` for v0.1:

- Worker secret: `ADMIN_TOKEN`
- Accepted client transport: `Authorization: Bearer <token>` or `X-Admin-Token: <token>`
- Optional page query: `?adminToken=<token>` only to hold it in memory for that page session
- Do not store admin tokens in repo, localStorage, chat logs, or public docs
- Missing or wrong token returns `401`

Cloudflare Access can replace this later, but v0.1 should keep the token contract small.

## Minimal Console Scope

Allowed in this first implementation:

- `GET /admin/state`: detailed public room state
- `POST /admin/open`: return the room to lobby/open-entry state
- `POST /admin/close`: close entry for the current round without deleting the page
- `POST /admin/start`: request Worker-owned countdown
- `POST /admin/reset`: reset to lobby and clear active round
- `POST /admin/map`: set next map id while not racing
- Public admin UI: status, players, spectators, phase, map, refresh, open/close, start, reset, map select, user link

Current implementation slice:

- Worker owns `entryOpen`, `mapId`, phase, countdown, reset, and room summary for the fixed public room.
- Public admin commands use Worker HTTP `/admin/*` endpoints and require `ADMIN_TOKEN`.
- Public admin state is read from `/admin/state` when a token is present, otherwise from public `/rooms` only.
- `open`, `close`, and `map` are lobby/finished-only commands. `reset` is the hard recovery command and may disconnect active sockets.
- The first-player host fallback remains available for simple public play if no admin console is used.
- Cloudflare secret setup and deployment are separate from repo code changes; do not put the token in the repository or chat.

Deferred:

- kick
- bots
- spectator/observer page
- live admin camera
- item grants
- rank edits
- mid-race intervention
- map voting/rematch controls

## Worker Endpoint Rules

All admin endpoints must:

- verify `ADMIN_TOKEN` before changing state
- return JSON with `{ ok, reason? }`
- validate phase before action
- never trust client-provided phase
- broadcast the changed state to connected users when relevant
- not require Durable Object storage writes to succeed

State transitions:

```text
open/reset -> lobby
start -> countdown -> racing
close -> entry closed or lobby closed for joins
map -> lobby-only map change
```

## Admin Page Rules

Public admin page must:

- never join as a player
- never create a WebSocket player participant
- never use `operator=1`
- never write public state through localStorage or BroadcastChannel
- read public state from Worker `/rooms` or `/admin/state`
- send commands only through Worker `/admin/*`
- keep `?devOnline=1` behavior separate
- show token missing/invalid status instead of silently enabling buttons

The user entry button may show or copy the public user URL, but it must not navigate the admin page into the game as the admin.

## Verification Scenarios

1. No token: `/admin/start` returns `401`.
2. Wrong token: `/admin/start` returns `401`.
3. Correct token and empty lobby: `/admin/start` returns a server-owned validation error such as `no_players`.
4. One player joined, correct token: `/admin/start` broadcasts `start_countdown` to the user page.
5. `/admin/reset` returns the room to lobby and user page reflects lobby.
6. `/admin/map` changes map in lobby and user page room summary reflects it.
7. `?devOnline=1` admin still uses the dev local room path.
8. `?online=cloudflare` admin does not call dev localStorage command publishers.
9. `npm run check:singularity-race` passes.
10. Browser test: one user page plus one public admin page see the same room status.

## Do Not

- Do not re-enable public admin by only removing disabled buttons.
- Do not make the admin page a room participant.
- Do not let the admin page directly set race phase in client state.
- Do not mix dev localStorage room registry with public Worker room state.
- Do not add kick, bots, observer camera, or rank edits in the first revival slice.
