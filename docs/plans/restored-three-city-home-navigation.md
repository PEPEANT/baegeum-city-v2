# Three City Home Navigation

Conclusion: the restored build should start inside the player's home, use location-aware tabs, and grow outward from home to house-front, Baegeum City, Dice City, and Seosan City instead of exposing every feature as a permanent global tab.

## Feature Identity

- Feature id: `restored:navigation:three-city-home-navigation`
- Title: Three City Home Navigation
- Domain: navigation
- Primary surface: shell
- Related docs:
  - `docs/baegeum-city-v2-restored-recomposition-plan.md`
  - `docs/baegeum-city-v2-restored-ui-online-ranking-chat-roadmap.md`
  - `docs/templates/restored-feature-plan-template.md`

## Current Baseline

- Current playable behavior: the restored HTML starts at a main screen and then shows global tabs.
- Current target: keep the game playable while planning a future shell where the first real scene is inside the player's house.
- Current files involved later: `baegeum-city-v2-dice.html`, `src/restored/ui/shell-contract.js`, future `src/restored/data/location-catalog.js`, and future `src/restored/app/navigation.js`.
- Current status: rank, asset, market, partner, city, place, location, and location-nav contracts are separated; runtime navigation is not rewritten yet.

## Intended Player Loop

```text
game start
-> player wakes/starts inside home
-> bottom tabs show myinfo / home / go_out
-> go_out changes location to home_front
-> home_front tabs show nearby places and bus stop
-> bus stop opens city travel
-> city choice changes available place tabs
-> player returns home or moves to another city
```

## Initial World Shape

First cities:

- `baegeum-city`: life hub, jobs, home, relationships, daily shops, phone-based systems.
- `dice-city`: gambling hub, casino risk, hotel/nightlife, high-risk money events.
- `seosan-city`: expansion hub for jobs, port/factory/farm/fishery themes, slower long-term progression.

First location contexts:

- `home_inside`: private start scene.
- `home_front`: the first outside scene, effectively the player's immediate neighborhood.
- `baegeum-city`: broader daily-life city.
- `dice-city`: gambling city.
- `seosan-city`: future work/industry city.
- `travel`: bus stop or transit selector.

## Location-Aware Tabs

Home inside:

```text
myinfo / home / go_out
```

House front:

```text
fast_food / labor_office / convenience_store / bus_stop / go_home
```

Baegeum City examples:

```text
city_home / job_places / shops / relationships / bus_stop
```

Dice City examples:

```text
casino / exchange / hotel / nightlife / bus_stop
```

Seosan City examples:

```text
port / factory / market / dorm_or_station / bus_stop
```

Rule: location tabs are not permanent global tabs. They are derived from the current location context.

## UI Surface Plan

- Top bar impact: show current city and current location context.
- Bottom nav impact: replace fixed feature tabs with context tabs after the navigation contract exists.
- Phone app impact: phone remains an item/app surface, not a global tab.
- Home surface impact: home becomes the first playable shell and can host rest, phone, relationship calls, inventory, and save actions.
- Outside surface impact: house front becomes the first place where jobs, food, shops, and travel can unlock.
- Travel surface impact: bus stop selects Baegeum City, Dice City, or Seosan City.
- Mobile constraints: keep each context to roughly three to five visible actions.

## State And Catalog Plan

Future state shape:

```js
{
  location: {
    cityId: "baegeum-city",
    contextId: "home_inside",
    placeId: "home:inside",
    previousContextId: null
  },
  unlockedCityIds: ["baegeum-city", "dice-city", "seosan-city"]
}
```

Catalog candidates:

- `src/restored/data/city-catalog.js`: already owns `baegeum-city`, `dice-city`, and `seosan-city`.
- `src/restored/data/location-catalog.js`: context and start-location state definitions.
- `src/restored/ui/location-nav-contract.js`: visible actions by context.
- `src/restored/app/navigation.js`: future runtime transition helpers.

Minimum location action shape:

```js
{
  id: "go_out",
  label: "밖으로 나가기",
  targetContextId: "home_front",
  gate: null,
  surface: "navigation"
}
```

## Economy And Ownership Impact

- Fast food can later become a food/cash sink.
- Labor office can later become the first job entry point.
- Convenience store can later connect to item ownership.
- Dice City casino actions must keep using event/ledger boundaries.
- Navigation itself should not change cash, inventory, or relationship state.

## Relationship And Emotion Impact

- Home inside can host private partner calls and relationship scenes later.
- House front can host chance encounters.
- City context can determine which partners can appear or call.
- Actor roaming should use location context before dialogue branches expand.
- Navigation transitions should produce context, not direct emotion changes.

## Ranking And Job Impact

- Labor office is the natural entry point for starter jobs.
- Job rankings from `docs/plans/restored-ranking-job-system.md` should read job events, not navigation clicks.
- Seosan City can later own job-heavy boards such as factory, port, delivery, or market work.
- Baegeum City can own daily-life job boards.
- Dice City can own casino-staff or nightlife job boards only after casino systems are stable.

## Chat Impact

- Phone chat remains inside the phone surface.
- Public city chat should depend on current city when online exists.
- Partner DM may mention current location later.
- No online/public chat should unlock just because a city tab exists.

## Online Authority

- Offline behavior: local navigation and local unlocked-city list.
- Online behavior: future server may validate room/city entry, but not needed for the first offline plan.
- Server-owned decisions later: online room membership, public city chat channel, online ranking snapshots.
- Dev-mock behavior: navigation can be tested locally without fake online lobby.
- Version gates: online city entry should follow `docs/baegeum-city-v2-online-lobby-contract.md`.

## Asset Intake

- Required images: optional home background, house-front background, city icons.
- Required audio: optional home ambience and city ambience.
- Source or license notes: all city/home images go through `assets/inbox/` first.
- Manifest ids: use future `image:location:<context-id>` or agreed city/location id family.
- Fallback behavior: text-only location surfaces are acceptable for the first implementation.

## Implementation Order

1. Keep this plan as planning only.
2. Keep existing static catalogs separated from the restored HTML.
3. Keep `seosan-city` guarded in the restored city/place catalogs.
4. Keep location catalog for `home_inside`, `home_front`, travel, and city contexts guarded.
5. Keep location-nav contract and smoke coverage guarded.
6. Adapt UI shell to read nav actions from current location.
7. Move phone apps under phone/internal surfaces.
8. Browser-verify start inside home, go outside, return home, and travel context.

## Verification Plan

- Narrow check: future location-nav smoke should assert house, house-front, three city ids, and no global place-tab explosion.
- Full check: `npm run check`.
- Browser check: only after runtime navigation changes.
- Manual play notes: start in house, leave house, visit house-front, open bus stop, see Baegeum/Dice/Seosan choices.

## Do Not

- Do not implement this directly as more inline buttons in `baegeum-city-v2-dice.html`.
- Do not put every place into the permanent bottom nav.
- Do not remove current restored gameplay until the replacement shell is verified.
- Do not unlock phone apps globally without phone ownership gates.
- Do not make Seosan City a casino clone; keep it as a job/industry expansion city.
- Do not connect online city travel before online authority contracts exist.
