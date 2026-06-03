# 특이점 레이스 — 자유 이동 프로토타입 구현 브리프

> 대상: 이 작업을 넘겨받을 다른 AI / 개발자
> 작성 기준: 코드 직접 확인 (추측 아님). 모든 단언에 파일·라인 근거 있음.
> 선행 문서: 원인 분석은 본 문서 1장에 요약. 더 깊은 근거는 각 라인 링크 참조.

---

## Product Name vs Engine Identity Decision (2026-06-03)

Public players and most AI sessions may call the mode `특이점레이스` / Singularity Race, but the reusable future engine must not be designed as a rail-only race engine.

The reusable target is a **destination-based 2D PvP arena**: players fight, body-block, use skills, and move freely in top-view 2D while also trying to reach a destination or finish zone.

Non-negotiable direction:

- The future reusable authority state is `{ x, y, vx, vy }`.
- `progress`, `destinationDistance`, finish rate, ranking, and route percent are derived outputs from position.
- Do not make `progress` the movement authority again in the reusable PvP/arena core.
- The current live v0.1 can remain a progress/lane event race, but it is not the reusable movement engine.
- Baegeum City reuse should depend on the future free-position arena core, not on the current rail/lane coordinate authority.

Short handoff phrase: **the name is Singularity Race, but the reusable engine identity is goal-race PvP arena; position is x/y, progress is derived.**

---

## Current Prototype Tuning Note (2026-06-03)

`free-race-prototype.html`은 현재 v2.1 탑뷰 손맛 검증장이다. 여전히 단독 실행 파일이며, 본게임/Worker와 연결하지 않는다.

- 권위 상태는 `{ x, y, vx, vy }`이고, `progressPercent`/`laneOffsetPx`는 위치에서 파생한다.
- 느린 이동감을 줄이기 위해 탑뷰 8방향 가속을 올리고, 프레임당 고정 마찰 대신 초당 드래그 기반으로 바꿨다.
- 상시 중력, 점프, 착지, 횡스크롤식 바닥/구덩이는 넣지 않는다. 중력은 향후 별도 구간/이벤트 설계가 승인될 때만 추가한다.
- 몸싸움은 그려지는 반경보다 살짝 작은 `PLAYER_COLLISION_RADIUS`와 더 약한 임펄스를 쓴다.
- 압력판은 예전처럼 `PLAYER_RADIUS`만큼 사각형을 부풀리지 않고, `pressureContactPoint()`와 `isPlayerStandingOnPad()`로 탑뷰 중심 접점 기준 판정을 쓴다.
- 코스 밖 반응은 clamp가 아니라 감속/최고속도 제한으로만 처리한다. `OFF_COURSE_DRAG`는 일반 이동 드래그보다 커야 하고, `OFF_COURSE_MAX_SPEED`는 일반 최고속도보다 낮아야 한다.
- 닫힌 문 충돌은 좌/우 한 방향만 막지 말고 충돌 법선 방향 속도만 제거한다.
- `tools/smoke-free-race-prototype.cjs`는 old `circleInsideRect` / `rect.x - PLAYER_RADIUS` 방식이 돌아오지 않게 막는다.

---

## 0. 한 줄 목표

기존 게임([singularity-race.html](../singularity-race.html))과 서버([workers/singularity-race-worker.js](../workers/singularity-race-worker.js))는 **건드리지 말고**, 별도 단독 HTML 프로토타입에서 탑뷰 `(x, y) + 속도` 기반 2D 자유 이동을 구현한다. `progress`(순위용 스칼라)는 이동의 **입력이 아니라 위치에서 파생되는 출력**으로 만든다. 손맛(자유 이동·역주행·몸싸움·협동 발판)을 먼저 검증하는 것이 전부다. 상시 중력/점프는 이번 범위가 아니며, 중력은 향후 특정 구간 설계가 승인될 때만 별도로 붙인다.

이것이 검증되면 이후 단계(본 게임/서버 이식)를 별도로 결정한다. **이번 작업 범위는 프로토타입 1개 파일까지다.**

---

## 1. 근본 원인 (왜 별도 프로토타입이 필요한가)

현재 게임은 플레이어 "위치"를 `(x, y)`가 아니라 **1차원 곡선 좌표(curvilinear)** 두 스칼라로 들고 있다:

- `progress` (코스 중심선 위 위치, 범위 `2.5 ~ 100`) — [singularity-race.html:5346-5347](../singularity-race.html#L5346-L5347)
- `laneOffsetPx` (중심선 기준 좌우 오프셋, 범위 `±232`)

그리고 이 좌표계가 **클라·서버 양쪽의 권위 데이터**다:

- 입력을 트랙 접선/법선에 투영해 `forward`/`lateral`로 분해 — [singularity-race-movement-vector.js:37-50](../src/restored/games/singularity-race-movement-vector.js#L37-L50)
- 서버가 `session.progressPercent` + `session.laneOffsetPx`를 권위로 저장·전진·clamp — [worker:1162-1166](../workers/singularity-race-worker.js#L1162-L1166)
- 전투 조준 좌표마저 `(progress, laneOffset)`에서 파생 — [worker:1078-1079](../workers/singularity-race-worker.js#L1078-L1079)

→ **"위치 = progress"이므로, 코스 밖으로 떨어짐(중력)·자유 배회·역주행·협동 발판은 이 좌표계에 표현 자체가 불가능하다.** 상수 튜닝(레인 폭 ±232 확대, 후진 0.45→1.0)으로는 절대 도달 못 한다. 좌표계를 뒤집어야 한다.

> 부수 결함(프로토타입과 무관, 참고용): 곡선 구간에서 데드밴드 0.08이 투영 후 축에 걸려 역주행이 죽음([movement-vector.js:112-114](../src/restored/games/singularity-race-movement-vector.js#L112-L114)); 온라인 끊김은 예측-서버 스냅 보정([prediction.js:185](../src/restored/games/singularity-race-prediction.js#L185)) 때문. 이번 프로토타입에서는 둘 다 자연히 사라진다(투영 후 데드밴드 없음, 단독 실행이라 네트워크 없음).

---

## 2. 좌표계 뒤집기 설계 (핵심 개념)

### 현재 (뒤집기 전)
```
입력(forward/lateral) → progress, laneOffset 직접 조종 → 위치는 progress에서 파생
```

### 목표 (뒤집기 후)
```
입력(2D 가속) → 속도 v(vx,vy) → 위치 P(x,y)  ← 권위
              ↘ 마찰/충돌이 P,v에 직접 작용
progress = P를 코스 경로에 투영한 결과 (순위 표시용으로만 읽음, 파생)
```

핵심 불변식:
- **위치 `P=(x,y)`와 속도 `v=(vx,vy)`가 유일한 권위 상태다.** 다른 모든 값은 여기서 파생.
- `progress`는 절대 직접 쓰지 않는다. 매 프레임 `deriveProgress(P)`로 계산만 한다.
- 이렇게 하면 순위/관전/내레이션이 의존하는 `progress` 인터페이스는 **그대로 살아남는다**(값의 출처만 바뀜).

---

## 3. progress 파생식 (이미 존재함 — 이걸 정밀화해서 쓴다)

**중요: 위치→progress 역변환 함수가 코드에 이미 있다.** 단지 이동 경로에서 안 쓰일 뿐이다:

- [estimateRestoredMarathonTrailProgressFromPoint(x, y, mapId)](../src/restored/games/marathon-trail-geometry.js#L131-L140) — 코스를 1% 간격으로 훑어 가장 가까운 점의 progress를 반환(무차별 탐색).

코스 경로는 폴리라인(`trail.segments`, 각 세그먼트에 `start/end/length/startDistance`, 전체 `totalLength`)으로 정의돼 있다 — [marathon-trail-geometry.js:173-205](../src/restored/games/marathon-trail-geometry.js#L173-L205). 프로토타입에서는 위 무차별 탐색 대신 **세그먼트 수직 투영**으로 정밀화하라(연속적이고 좌우 부호까지 나옴):

```
deriveProgress(P, course):
  best = { distSq: Infinity }
  for each segment [A, B] in course.segments:
    AB   = B - A
    t    = clamp( dot(P - A, AB) / dot(AB, AB), 0, 1 )   # 세그먼트 위 투영 비율
    foot = A + t * AB                                      # 발(수선의 발)
    distSq = lengthSq(P - foot)
    if distSq < best.distSq:
      along  = segment.startDistance + t * segment.length  # 시작선부터의 거리
      normal = perp(normalize(AB))                          # (-AB.y, AB.x)
      lateral = dot(P - foot, normal)                       # 부호 있는 좌우 오프셋
      best = { distSq, along, lateral }

  progressPercent = best.along / course.totalLength * 100   # 0~100, 순위용
  laneOffset      = best.lateral                            # 부호 = 어느 쪽 / 코스 이탈 거리
  return { progressPercent, laneOffset }
```

- `progressPercent`: 순위/HUD 표시에만 쓴다. **단조 증가를 보장하지 않아도 된다**(역주행하면 줄어드는 게 정상). 순위는 "최대 도달 progress"를 따로 기억하면 됨.
- `laneOffset`: 절댓값이 코스 폭을 넘으면 "코스 밖" 판정에 쓸 수 있음. 현재 v2.1은 감속 정도만 쓰고, 중력/지형 구간은 향후 별도 설계 훅으로 남긴다.

프로토타입은 의존성 최소화를 위해 **자체 폴리라인 코스**(예: 간단한 S자 6~8개 control point)를 정의해도 되고, 기존 [marathon-trail-geometry.js](../src/restored/games/marathon-trail-geometry.js)를 import해 같은 코스를 써도 된다. 권장: 처음엔 자체 코스로 단독 실행, 손맛 확인 후 기존 코스 연결.

---

## 4. 프로토타입 파일 사양

### 파일
- 신규 1개: `free-race-prototype.html` (저장소 루트)
- **단독 실행** — 외부 서버/네트워크/빌드 불필요, 브라우저로 바로 열림
- 기존 게임 파일/서버/모듈을 **수정 금지**. import는 read-only로만(원하면 geometry 모듈 재사용 가능).

### 반드시 포함
1. **월드 상태**: 플레이어마다 `{ x, y, vx, vy }`. 이것이 현재 탑뷰 프로토타입의 유일한 권위.
2. **입력**: 키보드(WASD/화살표) + 가능하면 모바일 가상 조이스틱. 입력은 위치가 아니라 **가속도/힘**으로 작용(`v += a * dt`). 8방향 자유.
3. **탑뷰 물리 적분 루프**: 고정 timestep(예: dt=1/60) 권장. `v += inputAcceleration*dt; v *= drag; P += v*dt`. `requestAnimationFrame`로 누적 시간 소비(spiral-of-death 방지: dt 상한 clamp).
4. **지형/중력 보류**: 상시 중력, 점프, 착지, 횡스크롤식 구덩이/경사는 v2.1에 넣지 않는다. 코스 밖(`|laneOffset| > 코스폭`) 반응은 감속 정도만 허용하고, 중력은 향후 특정 구간 설계가 승인될 때 별도 훅으로 추가한다.
5. **progress 파생**: 3장 `deriveProgress(P, course)`를 매 프레임 호출. HUD에 `progress %`와 부호 있는 `laneOffset` 표시.
6. **역주행 가능**: 뒤로 가면 progress가 줄어드는 것을 화면으로 확인 가능해야 함(페널티 0). "최대 도달 progress"는 별도 표시.
7. **렌더**: 코스 폴리라인 + 플레이어 + 속도 벡터(디버그) + progress/lane HUD. canvas 또는 SVG 무관.
8. **2-바디 테스트 훅(협동/몸싸움 대비)**: 플레이어 2개(1P 키보드, 2P 봇 또는 두 번째 키셋)를 띄워 원-원 충돌 임펄스(밀어내기) 1종을 넣어, 몸싸움·"동시에 두 발판 밟기" 류 협동 설계가 좌표상 가능한지 눈으로 확인.

### 비목표 (이번에 하지 말 것)
- 서버/netcode/예측-보정/멀티 룸 — **전부 제외**. 단독 로컬만.
- 본 게임([singularity-race.html](../singularity-race.html)) 이식·수정 — 제외.
- 아이템·스킬·내레이션·관전 — 제외.
- 멋진 아트/맵 에디터 — 제외. 손맛 검증이 목적.

---

## 5. 합격 기준 (이게 되면 성공)

- [ ] 플레이어가 8방향으로 막힘 없이 자유 이동(레인 ±232 벽 없음).
- [ ] 뒤로/역주행이 전진과 동일한 속도로 됨(0.45 페널티 없음). progress가 실제로 감소.
- [ ] 상시 중력/점프 없이 탑뷰 이동으로만 작동. 중력 구간은 아직 구현하지 않음.
- [ ] `progress %`가 위치에서 파생되어 HUD에 정상 표시(직접 조종 아님).
- [ ] 코스를 한참 벗어나도 `deriveProgress`가 NaN/튐 없이 안정적으로 가까운 progress를 반환.
- [ ] 플레이어 2명 충돌 시 서로 밀려남(몸싸움 손맛). 협동 발판 류가 좌표상 가능함을 확인.
- [ ] 한 파일, 더블클릭으로 실행. 콘솔 에러 0.

---

## 6. 재사용 vs 새로 짜기

| 항목 | 권장 |
|---|---|
| 코스 폴리라인 정의 | 처음엔 자체 정의(간단 S자). 손맛 확인 후 [marathon-trail-geometry.js](../src/restored/games/marathon-trail-geometry.js) 코스 연결 가능 |
| 위치→progress 투영 | 3장 공식으로 **새로 정밀 구현**. 기존 [estimateRestoredMarathonTrailProgressFromPoint](../src/restored/games/marathon-trail-geometry.js#L131-L140)는 무차별 1% 탐색이라 패턴 참고용으로만 |
| 입력 분해(forward/lateral 투영) | **버리기**. 프로토타입은 2D 가속을 직접 쓰므로 트랙 투영·데드밴드(0.08) 불필요 |
| 탑뷰 물리 적분 | 새로 구현(단순 오일러 + 드래그로 충분). 중력 적분은 향후 특정 구간 설계 때 별도 추가 |

---

## 7. 위험 / 하지 말 것 (중요)

- **기존 모놀리스를 한 번에 2D로 뜯어고치지 말 것.** [singularity-race.html](../singularity-race.html)은 ~13k줄 인라인 스크립트이고 서버 권위까지 곡선 좌표에 묶여 있어, 한 번에 갈아엎으면 "다 부수고 못 살리는" v1 실패 패턴을 반복한다. 이번엔 **단독 프로토타입에서 손맛만 증명**한다.
- progress를 다시 입력으로 쓰지 말 것. 위치가 권위, progress는 파생 — 이 방향을 절대 뒤집지 말 것.
- 네트워크/서버를 끌어들이지 말 것. 손맛이 먼저다.

---

## 부록 A. 핵심 코드 위치 (확인용)

| 내용 | 위치 |
|---|---|
| progress 범위 상수 | [singularity-race.html:5346-5347](../singularity-race.html#L5346-L5347) |
| 후진 0.45배 페널티 | [singularity-race.html:5333](../singularity-race.html#L5333), [10030-10034](../singularity-race.html#L10030-L10034) |
| 입력 트랙 투영 + 데드밴드 0.08 | [movement-vector.js:37-50, 112-114](../src/restored/games/singularity-race-movement-vector.js#L37-L50) |
| 서버 권위(progress/lane 저장) | [worker:1162-1166](../workers/singularity-race-worker.js#L1162-L1166) |
| 전투 조준이 progress에서 파생 | [worker:1078-1079](../workers/singularity-race-worker.js#L1078-L1079) |
| 코스 폴리라인 빌드/세그먼트 | [marathon-trail-geometry.js:173-205](../src/restored/games/marathon-trail-geometry.js#L173-L205) |
| **위치→progress 역변환(기존)** | [marathon-trail-geometry.js:131-140](../src/restored/games/marathon-trail-geometry.js#L131-L140) |
| 클라 예측 + 서버 스냅 보정 | [prediction.js:65-101, 185](../src/restored/games/singularity-race-prediction.js#L65-L101) |
