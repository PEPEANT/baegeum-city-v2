# 배금도시 v2 Game Action / Effect Master

결론: 모든 플레이어 행동은 `GameAction`으로 요청하고, 실제 상태 변화는 `GameEffect` 목록으로만 적용한다.

## 목적

`Interaction Master`는 “무엇을 누를 수 있는가”를 정한다. 하지만 누른 뒤에 현금, 칩, 인벤토리, 채널, 플레이어 상태, 오브젝트 상태가 어디서 바뀌는지 정하지 않으면 기능마다 따로 바뀌면서 꼬인다.

그래서 흐름을 아래처럼 고정한다.

```text
PC E / 모바일 ACTION
-> InteractionCandidate
-> GameAction
-> validate
-> GameEffect[]
-> ledger / playerState / worldObjectState / UI 적용
```

## 현재 구현

현재 기준 모듈:

```text
src/systems/game-action-master.js
src/systems/local-action-runtime.js
src/systems/interior-interaction-runtime.js
```

현재 버전:

```text
game-action-001
game-effect-001
game-action-envelope-001
```

## Payload Clone Observability

Current action/effect payload cloning keeps the old safe fallback behavior but no longer fails silently.

When a payload can be cloned, actions and effects include:

```js
payloadCloneStatus: "ok",
payloadCloneReason: null
```

When a payload cannot be cloned, such as a circular object or `BigInt`, the payload still falls back to `{}` for prototype safety, but the action/effect also includes:

```js
payloadCloneStatus: "clone_failed",
payloadCloneReason: "..."
```

This is diagnostics-only. UI and economy code should continue reading `payload`, while bug-hunt tools can inspect the clone status.

## GameAction

플레이어가 요청한 행동이다. 클라이언트는 결과를 직접 확정하지 않고 action을 만든다.

```js
{
  schemaVersion: "game-action-001",
  id: "req:chip-exchange-001",
  requestId: "req:chip-exchange-001",
  type: "exchange_chips",
  actorId: "player:local",
  source: "mobile_action",
  interactionId: "use:chip-counter-001",
  targetId: "object:chip-counter-001",
  payload: { cash: -10000, chips: 10 },
  context: {
    scene: null,
    channelId: "venue:chip-exchange-01",
    venueId: null,
    tableId: null,
    mapVersion: "baegeum-city-v2-map-001"
  },
  createdAt: "2026-05-26T00:00:00.000Z"
}
```

## GameEffect

행동으로 인해 바뀌는 결과다. 하나의 action은 여러 effect를 만들 수 있다.

```js
{
  schemaVersion: "game-effect-001",
  id: "effect:req:chip-exchange-001:economy_ledger_entry:target",
  type: "economy_ledger_entry",
  actionId: "req:chip-exchange-001",
  targetId: null,
  payload: {
    entryType: "chip_exchange",
    deltas: { cash: -10000, chips: 10 }
  },
  authority: "local-prototype"
}
```

## Action 타입

```text
enter_venue      건물/실내 입장
leave_venue      실내/건물 나가기
sit_table        카지노 테이블 착석
leave_table      테이블 나가기
exchange_chips   현금/칩 교환
bet_reserved     베팅 칩 예약
bet_settled      예약된 베팅 정산
bet_refunded     예약된 베팅 환불
buy_item         편의점 음식, 입장권 등 구매
drive_vehicle    차량 운전
use_item         일반 아이템 사용
```

현재 코드 기준 `bet_reserved`는 베팅 칩 예약을 의미한다. `bet_settled`와 `bet_refunded`는 예약된 홀짝 라운드를 닫는 action envelope이며, 홀짝 테이블 UI의 로컬 테스트 정산/환불 버튼이 이 envelope만 사용한다.

## Effect 타입

```text
player_state_patch       playerState 변경
economy_ledger_entry     현금/계좌/칩/아이템 ledger 기록
world_object_state_patch 문 잠김, 차량 소유, 테이블 점유 같은 오브젝트 상태 변경
chat_channel_change      채팅 채널 변경
ui_message               안내 메시지 표시
```

## 핵심 규칙

- `requestId`는 중복 실행 방지 키다. 모바일 터치 두 번, E 연타, 온라인 재전송이 와도 같은 `requestId`는 한 번만 처리한다.
- 돈/칩/아이템은 직접 바꾸지 않고 `economy_ledger_entry` effect를 통해 기존 `Economy Ledger`로 간다.
- 위치/모드/테이블 상태는 `player_state_patch` effect로 간다.
- 문/자동차/테이블 점유 상태는 `world_object_state_patch` effect로 간다.
- 온라인 전환 뒤에는 클라이언트가 action만 보내고, 서버가 effect를 확정한다.
- 현재 `enter_venue`, `leave_venue`는 로컬 런타임에서 action envelope를 만들고, 기존 입장/퇴장 화면 전환을 유지한다.
- 현재 도박장 실내 `환전 ATM` 근처에서는 ATM 패널만 열고, 환전 버튼을 누를 때 `exchange_chips` action을 만든다.
- 칩교환은 10/50/100칩 단위의 `cash -> chips`, `chips -> cash`를 지원하며 ledger 적용이 실패하면 action history에 커밋하지 않는다.
- 현재 카지노 테이블은 `sit_table`, `leave_table` action으로 `venue_lobby`와 `table_seated`를 오간다.
- 현재 홀짝카지노 테이블 UI는 `table_seated` 상태에서만 표시되고, 시작 버튼은 `bet_reserved` action과 `economy_ledger_entry` effect를 만든다.
- 결과/환불 버튼은 `src/systems/odd-even-round-runtime.js`의 `bet_settled` 또는 `bet_refunded` envelope로만 닫는다.
- `src/systems/odd-even-round-state.js`는 같은 `roundId`의 중복 정산/중복 환불을 로컬 저장소에서 막는다.

## 다음 구현 기준

1. 홀짝 정산/환불 UI는 브라우저에서 ledger/HUD 일치까지 확인한다.
2. clean/stale localStorage 검사에서 action history, ledger, odd-even round state를 함께 본다.
3. 차량은 `drive_vehicle` action과 `license:driver`, `vehicle_key:*` 조건으로 붙인다.
