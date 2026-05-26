# Restored Login Home, Online, And Phone Migration

Conclusion: the restored build should retire visible save-code backup UI and make the first screen an account/login home, while MammonCity2 stays pinned as the reference for login shell, online system shape, and phone UI migration.

## Reference Anchor

- Reference repository: `https://github.com/PEPEANT/MammonCity2`
- Observed HEAD on 2026-05-26: `856c7c6ec5ea2192f3c595dda97a11f9df6067f8`
- Local intake card: `refs/intake/github-mammoncity2.md`
- First useful reference files: `index.html`, `game.html`, `admin.html`, `js/devices/phone/phone-session.js`, `js/devices/phone/phone-app-registry.js`, `js/devices/phone/phone-shell-ui.js`, `js/devices/phone/phone-router.js`, `js/systems/ranking-service.js`
- Import policy: reference first. No top-level license file was detected during intake, and Firebase config/auth behavior must not be copied into the restored runtime without a separate adoption decision.

## Product Decision

The old data backup center and save-code restore flow were useful scaffolding, but they no longer fit the product direction. The player should meet:

```text
login home
-> guest/local account session
-> home_inside
-> phone and online services only through account/device gates
```

The normal player UI should not show a save-code backup center. Treat the old screen as the legacy save-code backup center, and keep only hidden migration helpers until account-backed saves are stable.

## Login Home V0

Initial login home should be practical, not a marketing landing page.

- Show `Baegeum City V2`, a player-name input, guest login, and disabled online login status.
- Guest login creates a local account session.
- Online login remains unavailable until the online adapter contract can report a real connected state.
- Entering the game starts inside `home_inside`.
- Top bar and my-info surface show account name and online status.

## State Contract

Account state should live outside the HTML:

```js
{
  account: {
    mode: "signed_out | guest | local | online",
    provider: "none | local_guest | future_provider",
    playerId: "",
    displayName: "",
    legacySaveCodeVisible: false
  },
  online: {
    status: "unavailable | connecting | connected | disconnected | error",
    provider: "none",
    clientId: "",
    lobbyEnabled: false
  }
}
```

Rules:

- `lobbyEnabled` is only valid when online status is `connected`.
- Guest/local account can play offline.
- Online account can add leaderboard, chat, cloud save, and public profile later.
- Save-code UI is hidden unless a deliberate dev/migration flag turns it on.

## Phone Migration

MammonCity2's phone should guide the restored phone system, but not by dropping global scripts into the game.

Use as reference:

- phone session normalization
- installed app registry
- route stack and app home/back behavior
- phone shell/stage UI structure
- DIS/news/stocks-style app separation
- app launcher to app stage/window flow for relationship, partner DM, market, and online apps

Adapt into restored modules:

```text
src/restored/account/
src/restored/online/
src/restored/phone/
src/restored/phone/apps/
```

The existing rule still holds: news, stocks, futures, rankings, chat, and online lobby are phone apps, not global bottom tabs.
The relationship/lover list is also a phone app. My Info may show a compact relationship summary, but tapping relationship content should open the phone app stage where partner list, partner DM, call/message/gift/date actions, and later AI dialogue live.

## Online Migration

Do not import Firebase wiring directly into the restored build yet.

Safe order:

1. Local guest account session.
2. Read-only online status adapter returning `unavailable`. Current status: `src/restored/online/online-adapter-contract.js`.
3. Dev-only connected mock for tests.
4. Phone app entry for online lobby after connected state.
5. Ranking snapshots and chat delivery after server authority rules exist.
6. Cloud save/profile only after account migration is explicit.

## UI Direction

The login home should feel like a compact game console:

- dark focused background
- small account controls
- one primary entry action
- visible online status without fake connectivity
- no backup-code controls in normal play

The in-game account panel should stay small. The main emotional/UI work should remain for home, partner dialogue, phone apps, and casino surfaces.

## Implementation Order

1. Remove visible backup center and save-code modals from `baegeum-city-v2-dice.html`.
2. Add `src/restored/account/session-contract.js`.
3. Add `account` and `online` to restored initial/save state.
4. Keep legacy save-code helpers in `src/restored/state/storage.js` only for migration coverage.
5. Split phone app rendering under `src/restored/phone/`.
6. Add restored online adapter contract. Current status: implemented and guarded.
7. Import MammonCity2 concepts module by module only after license/adoption and Firebase boundaries are recorded.

## Verification

- `npm run check`
- Browser smoke: load `baegeum-city-v2-dice.html`, guest login, verify game screen opens, no backup center is visible, no console errors.
- Storage smoke: buying a phone remains saved after load.

## Do Not

- Do not show save-code backup UI in normal play.
- Do not copy Firebase config or anonymous-auth behavior into runtime by default.
- Do not create a fake online lobby while offline.
- Do not put phone apps back into permanent bottom navigation.
- Do not copy MammonCity2 files into runtime without a documented adoption decision.
