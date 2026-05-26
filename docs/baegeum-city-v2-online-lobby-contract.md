# 배금도시 v2 온라인 로비 계약

결론: 배금도시 v2의 로비는 오프라인 메뉴가 아니라, 온라인 연결과 방 참가가 성공했을 때만 열리는 관문이어야 한다.

## 목적

로비의 역할은 게임 시작 화면이 아니라 온라인 세션 검증이다. 플레이어가 도시로 들어가기 전에 서버 연결, 계정/닉네임, 방 선택, 참가 타입, 맵 버전, 권한을 확인해야 한다.

이 계약은 Iron Line의 로비/룸 구조를 참고하되, 전투 슬롯/팀/무기/전술 코드는 가져오지 않는다. 배금도시는 도시, 카지노, 채팅, 경제 서버 권위를 위해 필요한 뼈대만 가져온다.

## 핵심 원칙

- 로비는 `onlineConnected === true`가 되기 전에는 열리지 않는다.
- 오프라인 개발 시작은 별도 dev 경로로만 남기고, 실제 로비 UI와 섞지 않는다.
- 방 목록, 방 참가, 관전자 참가, 방 phase는 서버 또는 온라인 세션 어댑터가 소유한다.
- 클라이언트는 로비에서 돈, 칩, 랭킹, 도박 결과를 확정하지 않는다.
- `mapVersion`, `venueSchemaVersion`, `economyVersion`이 맞지 않으면 온라인 입장을 막는다.
- 로비 방 ID와 인게임 `world/venue/table/spectator/admin` 채널 ID는 분리하되, 입장 후 서로 연결 가능해야 한다.

## Iron Line에서 참고할 부분

가져올 만한 개념:

- `hello -> join -> join_result` 핸드셰이크
- `roomId`, `playerId`, `nickname`, `participantType`
- `phase: lobby | playing | ended`
- 플레이어 정원 초과 또는 진행 중 방의 관전자 전환
- 방 목록 카드와 관전자 입장 버튼
- 연결 끊김 후 ghost participant 정리
- host/authority 재선정 개념

가져오지 말아야 할 것:

- 전투 팀 슬롯, 병과, 무기, 전차/드론 상태
- 50vs50 전투 phase
- 전투 command packet
- 전투 worldState 전체 구조
- Iron Line 로비 UI 전체 디자인

## 상태 흐름

```text
disconnected
-> connecting
-> connected_no_session
-> lobby_room_list
-> lobby_joining
-> lobby_room
-> entering_city
-> city_online

disconnect 중:
city_online
-> disconnected_grace
-> reconnected | expired
```

로비가 표시되는 구간은 `lobby_room_list`, `lobby_joining`, `lobby_room`뿐이다.

## 최소 데이터

```js
onlineConnection = {
  status: "disconnected | connecting | connected | disconnected_grace | expired",
  serverTimeMs: 0,
  clientId: "",
  lastError: ""
}
```

```js
onlineLobbySession = {
  roomId: "",
  playerId: "",
  nickname: "",
  participantType: "player | spectator | admin",
  phase: "lobby | playing | ended",
  mapId: "baegeum-city",
  spawnId: "baegeum-main-spawn",
  mapVersion: "baegeum-city-v2-map-001",
  venueSchemaVersion: "venue-schema-001"
}
```

```js
onlineRoomSummary = {
  roomId: "room:baegeum:0001",
  displayName: "배금시티 1번 방",
  phase: "lobby",
  mapId: "baegeum-city",
  players: 0,
  maxPlayers: 16,
  spectators: 0,
  maxSpectators: 32,
  locked: false
}
```

## 입장 게이트

도시 온라인 입장은 아래 조건을 모두 만족해야 한다.

- 연결 상태가 `connected`다.
- `onlineLobbySession.roomId`가 있다.
- `participantType`이 허용된 값이다.
- 서버가 `join_result.ok === true`를 반환했다.
- 서버/클라이언트 `mapVersion`이 일치한다.
- 서버/클라이언트 `venueSchemaVersion`이 일치한다.
- 초기 `playerState.mapId`, `sceneId`, `spawnId`, `worldChannelId`가 방 설정과 일치한다.

실패하면 도시로 보내지 않고 로비에서 이유를 보여준다.

## 첫 구현 순서

1. `online-lobby-contract` 순수 데이터 모듈과 smoke test를 만든다.
2. 연결 상태가 없으면 로비 버튼/패널이 열리지 않게 한다.
3. 임시 서버 어댑터는 fake success가 아니라 `unavailable`을 반환하게 한다.
4. 온라인 연결 성공 mock은 dev query나 test helper에서만 허용한다.
5. 방 목록 UI는 읽기 전용 카드부터 만든다.
6. `join_result`가 성공해야만 `playerState.mode = city`로 진입한다.
7. 그 다음에 채팅/위치 동기화/관전자 모드를 붙인다.

## 리스크

- 오프라인 로비와 온라인 로비를 같은 UI로 만들면 나중에 서버 권위가 깨진다.
- 방 ID 없이 `world:baegeum-city`만 쓰면 여러 방 채팅과 플레이어 위치가 섞인다.
- 맵 버전 체크 없이 입장하면 위치, 입구, 충돌, 미니맵이 서로 어긋난다.
- 관전자와 플레이어 상태를 초기에 나누지 않으면 도박 테이블 참가 권한이 꼬인다.
- 방 참가 실패를 조용히 무시하면 유령 플레이어와 중복 참가가 생긴다.

## 다음 코딩 슬라이스

가장 안전한 다음 코딩 작업은 기능 UI가 아니라 `src/data/online-lobby-contract.js` 같은 순수 계약 모듈과 smoke test다.

그 다음에야 로비 UI를 붙인다. 이 순서를 지키면 온라인 로비가 오프라인 시작 버튼처럼 변질되는 것을 막을 수 있다.
