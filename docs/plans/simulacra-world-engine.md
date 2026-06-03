# Simulacra World Common Engine Plan

Conclusion: `시뮬라크월드`는 지금 당장 대공사로 만드는 새 게임이 아니라, 여러 파생 게임이 같은 계정, 저장, 채팅, 스마트폰, 경제, 운영 경계를 공유하게 만드는 상위 껍데기다.

## Why Now

Singularity Race가 단독 HTML, 로비, 관리자, 관전자, 채팅, 서버 리허설을 빠르게 얻으면서 같은 문제가 반복될 수 있다. 다음 기능을 바로 추가하면 달리기, 드로잉, 도시 생활, 운영 페이지가 서로 다른 방식으로 계정, 저장, 채팅, 방 상태를 들고 가서 스파게티가 된다.

그래서 다음 분기점은 기능 추가가 아니라 공통 엔진 경계 확정이다.

## Engine Shape

`시뮬라크월드`는 아래 순서로만 확장한다.

1. 공통 모듈 계약을 먼저 둔다.
2. 파생 게임은 작은 등록 정보로만 붙인다.
3. 실제 UI/런타임 이동은 나중에 한 화면씩 한다.
4. 외부 참고 프로젝트는 통째로 복사하지 않고 역할만 흡수한다.

Target flow:

```text
simulacra-world shell
  -> common modules
  -> game module interface
  -> Singularity Race / Drawing World / future games
```

## Common Modules

현재 확정할 공통 모듈 목록:

- `choice-system`: 선택지, 결과, 조건 분기.
- `smartphone-ui`: 스마트폰 런처, 앱 화면, 모바일 우선 조작.
- `job-system`: 알바, 직업, 작업 결과.
- `money-dpay-ledger`: 돈, DPay, 칩, 거래 기록.
- `npc-affinity`: NPC 호감도, 관계, 기억 이벤트.
- `stock-market`: 주식/코인 시세와 가상 시장 이벤트.
- `save-system`: 프로필, 저장, 복구, 마이그레이션.
- `chat-channel`: 로비/방/관전자/공지 채팅 채널과 기록.
- `asset-registry`: 캐릭터, 스킨, mp3, 일러스트 등록.
- `online-room-admin`: 방, 관전자, 방장/관리자, 운영 감시 경계.

## Derived Game Registry

### 1. Singularity Race

Status: `active`

첫 번째 파생 게임이다. 지금 구현된 로비, 대기열, 경기장, 관리자/관전자, dev server rehearsal은 그대로 살린다. 단, 앞으로 공통 엔진으로 옮길 때는 아래 경계를 지킨다.

- Owns: 레이스 입력, 트랙 렌더, 카메라, 공격/스킬, 체크포인트, 서버 권위 레이스 상태.
- Consumes: 저장, 채팅, 스킨/자산, 온라인 방/관리자.
- Do not move yet: 실제 `singularity-race.html` 런타임을 한 번에 엔진으로 이사하지 않는다.

### 2. Drawing World

Status: `candidate`

두 번째 파생 게임 후보이다. `PEPEANT/-drawing-world`는 스킨, 귀여운 캐릭터 감성, 스마트폰/소셜/드로잉 흐름을 참고한다. 다만 지금 단계에서는 참고 후보로만 등록한다.

- Owns later: 드로잉 루프, 캔버스 도구, 그림 공유.
- Useful references: 스킨 카드, 캐릭터 분위기, 소셜 UI.
- Do not copy: 전체 런타임, 저장 구조, 화면 구조를 바로 섞지 않는다.

### 3. Iron Line Ops Reference

Status: `reference`

`PEPEANT/Iron-Line---2D-Tank-Prototype`은 파생 게임으로 흡수하지 않는다. 관리자/운영 참고 레이어로만 둔다.

- Allowed reference: 방 목록, 관전자 관리, 운영 감시 카메라, 방장 도구.
- Forbidden import: 탱크 전투 루프, 지휘/전술 AI, 전투 UI를 시뮬라크월드 코어로 가져오는 것.

## Small First Implementation

이번 단계에서 할 일은 아래까지만이다.

- `src/restored/engine/simulacra-world-game-module-contract.js`를 만든다.
- `src/restored/engine/simulacra-world-shell.js`가 registry를 읽어 작은 shell snapshot과 launch guard를 만든다.
- `archive/diagnostics/simulacra-world.html`은 shell snapshot만 읽는 작은 진단 화면이다.
- 공통 모듈 id 목록을 고정한다.
- Singularity Race를 첫 active 파생 게임으로 등록한다.
- Drawing World를 candidate로 등록한다.
- Iron Line을 ops reference로 등록한다.
- 검증 도구로 이 순서와 역할이 깨지지 않게 막는다.

## Anti-Spaghetti Rules

- 공통 엔진은 “모든 코드를 모으는 큰 파일”이 아니다.
- 파생 게임은 엔진 모듈을 소비하지만, 서로의 내부 런타임을 직접 호출하지 않는다.
- 돈, 칩, DPay, 인벤토리, 저장은 기존 documented ledger/action/save 계약을 우선한다.
- 온라인 방/관전자/관리자 권한은 게임별 임시 UI가 아니라 공통 운영 경계에서 커진다.
- 새 파생 게임을 추가할 때는 먼저 registry에 `active`, `candidate`, `reference` 중 하나로 등록한다.

## Next Safe Slice

다음 구현은 아직 대규모 분리가 아니다. 현재 `archive/diagnostics/simulacra-world.html`은 `createSimulacraWorldShellSnapshot()`을 읽어서 등록된 파생 게임 목록만 보여준다. 다음 안전 단계는 Singularity Race의 프로필/채팅/스킨/방장 기능 중 하나만 골라 공통 엔진 모듈로 옮기는 것이다.
