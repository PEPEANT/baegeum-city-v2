# 배금도시 v2 경제 루프 계약

결론: 지금 배금도시 v2의 경제는 장부 안전장치는 생겼지만, 돈이 생기고 사라지는 반복 루프는 아직 계약 단계다. 다음 기능은 이 문서를 기준으로 `source -> sink -> exchange -> bet -> settlement -> ranking` 흐름을 닫아야 한다.

## 목적

이 문서는 완전 설계 이전에 놓치기 쉬운 경제 질문을 고정한다.

- 돈은 어디서 생기는가?
- 돈은 어디서 사라지는가?
- 현금과 칩 환율은 누가 정하는가?
- 플레이어끼리 돈을 보내면 어떤 제한과 기록이 필요한가?
- 시간 이벤트가 경제, 인터넷, 주식, 노가다에 어떤 영향을 주는가?
- 베팅 예약 뒤 결과/환불/랭킹까지 장부가 닫히는가?

## 현재 코드 기준

- 시작 잔고는 `cash: 100000`, `bank: 0`, `chips: 0`이다.
- 환전 ATM은 `1칩 = 1,000원`, 선택 단위 `10/50/100칩`을 쓴다.
- 환전은 `chip_exchange` ledger entry로 기록된다.
- 홀짝카지노는 `bet_reserved`로 칩을 예약하고, 로컬 테스트 UI에서 `bet_settled` 또는 `bet_refunded`로 라운드를 닫을 수 있다.
- `src/systems/odd-even-round-runtime.js`는 예약된 홀짝 라운드를 정산/환불 action envelope로 만든다.
- `src/systems/odd-even-round-state.js`는 같은 `roundId`가 두 번 닫히지 않도록 로컬 라운드 상태를 저장한다.
- 재접속 복구와 서버 권위 정산은 아직 연결되지 않았다.
- `WorldClock`은 반복 이벤트를 감지하지만, 노가다 보상, 배고픔 감소, 주식 변동, 상점 영업에는 아직 연결되지 않았다.
- 현재 공식 시간 속도는 실제 1초 = 게임 내 1분이다.
- 유저 간 송금 ledger type은 아직 없다.

## 루프 축

| 축 | 현재 상태 | 필요한 다음 계약 |
| --- | --- | --- |
| 돈 생성 | 시작 현금, future `cash_grant` | 노가다/알바/퀘스트 보상 기준 |
| 돈 소멸 | 거의 없음 | 음식, 교통비, 임대료, 수수료, 벌금 |
| 환전 | 고정 1칩 = 1,000원 | 수수료, 매입/매도가 차이, 일일 한도 |
| 베팅 | 예약, 로컬 정산/환불 UI, 중복 닫기 방지 구현 | 재접속 복구, 서버 권위 정산, 랭킹 집계 |
| 송금 | 없음 | 서버 권위, 수수료, 한도, 감사 로그 |
| 시간 | 표시/이벤트 감지 | 경제 tick, 뉴스, 주식, NPC 스케줄 |
| 시장 | DIS 미리보기만 있음 | 주식 가격 tick, 주문 ledger |

## 계약 파일

현재 코드 가드는 `src/data/economy-loop-contract.js`가 소유한다.

이 파일은 아래를 명시한다.

- 현재 구현된 경제 primitive
- 구현은 아니지만 ledger type은 준비된 항목
- 새로운 ledger type 없이는 진행하면 안 되는 항목
- ATM 환율 정책
- 서버 권위가 필요한 항목

검증은 `tools/smoke-economy-loop-contract.cjs`가 담당한다.

## 금지 규칙

- 카지노/주식/송금/상점 UI가 `economy.update()`로 잔고를 직접 바꾸면 안 된다.
- 베팅 결과는 클라이언트 UI가 확정하면 안 된다.
- 현금으로 카지노 베팅을 직접 걸면 안 된다. 현금은 먼저 칩으로 바뀌어야 한다.
- 유저 간 돈거래는 localStorage만으로 구현하면 안 된다.
- 시간 이벤트가 돈/랭킹/주식 결과를 확정할 때 클라이언트 시간을 권위로 쓰면 안 된다.
- 음식 구매처럼 돈과 아이템이 동시에 바뀌는 행동은 두 entry로 흩어지면 안 된다. 원자적 ledger type이 필요하다.

## 다음 구현 순서

1. 라운드 정산/환불 후 ledger projection과 HUD가 일치하는지 브라우저에서 확인한다.
2. clean/stale localStorage 브라우저 워크플로우로 오래된 경제/라운드 저장값과 코드 버그를 분리한다.
3. 편의점 음식 구매를 위해 `item_purchased` 또는 동등한 원자적 purchase entry를 설계한다.
4. 배고픔/에너지 감소를 `WorldClock` tick에 연결할지, 별도 stat effect로 둘지 결정한다.
5. 플레이어 간 송금은 서버 권위 계약 전까지 구현하지 않는다.

## 다음 문서

- `baegeum-city-v2-economy-ledger.md`: ledger entry type과 적용 규칙
- `baegeum-city-v2-world-clock.md`: 시간 이벤트와 서버 시간 기준
- `baegeum-city-v2-online-state-protocol.md`: 온라인 상태/채널/서버 권위
