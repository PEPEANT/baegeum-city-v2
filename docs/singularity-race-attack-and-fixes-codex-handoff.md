# 특이점레이스 — 공격/아이템/넷코드 후속 작업 (Codex 핸드오프)

Latest status 2026-06-03: `item:sword` is now implemented. Base attack is still punch/kick; sword is a separate collectible/use item with direct `race-sword-pickup` track drops, a CSS sword icon, `useSwordItem()`, and `is-sword-attacking` slash visuals. Public Worker HP authority for sword remains a future server-authority slice.

> 대상: 이 작업을 이어받을 Codex/개발자
> 작성: 코드 직접 확인 기준. 라인은 이동할 수 있으니 **심볼/문자열 이름으로 앵커**하고 라인은 힌트로만.
> 범위: 기존 게임 [singularity-race.html](../singularity-race.html)(약 13k줄 모놀리스) + [workers/singularity-race-worker.js](../workers/singularity-race-worker.js). 이 게임이 **첫 배포 대상**.

---

## 0. 작업 규율 (반드시)

- **곧 (x,y) 좌표계 대규모 재작성 예정** → 지금은 *깊게 재설계하지 말고* 작고 안전한 변경만. 화려한 시스템(업그레이드 트리 등)은 재작성 이후로 미룬다.
- **클라·서버 짝 맞추기**: 이동/공격/속도처럼 서버 권위가 관여하는 값은 [singularity-race.html](../singularity-race.html)과 [worker](../workers/singularity-race-worker.js) **양쪽을 같은 값으로** 바꿔야 함(안 그러면 보정이 고무줄됨).
- **검증 게이트**: 변경마다 `npm run check` **반드시 green 유지**.
- **lock 토큰 깨지 말 것**: [tools/check-restored-marathon-contract.cjs](../tools/check-restored-marathon-contract.cjs) (line ~82)가 `singularity-race.html`에 특정 문자열 존재를 강제함 (예: `runner-attack-lunge`, `runner-attack-swipe`, `runner-hit-burst`, `runner-hit-recoil`, `BASIC_ATTACK_COOLDOWN_MS`, `performBasicAttack` 등). 키프레임/심볼 **이름을 바꾸지 말고** 내용만 바꿀 것.
- 작게 커밋하고, 각 변경 후 오너가 직접 플레이로 확인할 수 있게.

---

## 1. 이미 완료됨 (Claude, 다시 하지 말 것)

**기본공격 모션: 칼 휘두름 → 펀치↔킥 (순수 CSS + JS 1줄)**
- `.runner-avatar.is-attacking img` → 키프레임 `runner-attack-lunge`(이름 유지, 내용은 주먹 잽).
- `.runner-attack-swipe` → 칼 호에서 **주먹(너클)** 비주얼로 교체 + 트레일 모션선.
- 추가 키프레임 `runner-attack-kick`, `runner-attack-kick-strike` + `.is-attack-kick` 변형(발 모양/낮은 위치).
- JS: 렌더 className에 `attacking && attackVisualId % 2 === 1 ? "is-attack-kick" : ""` 추가 → **공격할 때마다 펀치↔킥 교대**.
- 적용 범위: [singularity-race.html](../singularity-race.html)만. 워커·로직 무관. 스모크 green 확인됨.

---

## 2. 남은 작업 (원인 + 접근)

### A. 사거리 ↑ + 거대화 더 크게 (가장 싸고 체감 큼, 먼저 권장)
- 사거리: 기본공격은 클라/서버 공유 `singularity-race-basic-attack-range.js` 픽셀 캡슐 판정으로 관리. 현재 기준은 118px forward reach / 54px radius / 18px rear grace.
- 거대화: `SINGULARITY_RACE_RED_PILL_SIZE_SCALE` ([src/restored/games/singularity-race-item-contract.js](../src/restored/games/singularity-race-item-contract.js), 현재 1.7)로 상향 완료. 필요시 이후 플레이 감각 기준으로 `selfSizeScale`/렌더 상한만 재확인.

### B. (완료 — 1번 참고)

### C. 칼 휘두르기를 박스 드랍 아이템으로 분리 + 기본공격 재정의 (구조, 신중)
- 현재 기본공격은 facing 방향 근접타. 칼(휘두름)을 **별도 아이템**으로 빼려면: 아이템 풀에 신규 itemId 추가 + 사용 시 기존 칼 호 비주얼(`runner-attack-swipe` 키프레임 원본은 git 히스토리에 있음) 재사용.
- **재작성 예정이므로 최소 구현만.**

### D. 기본공격 업그레이드 형태 (확장 — 재작성 이후 권장)

### #1. 아이템 2개 동시 보유 안 됨
- 원인: 단일 슬롯 `state.action.currentItemId` + 픽업 게이트 `if (!state.action.currentItemId)` (`finalizeRaceItemRoulette`, ~8638)가 이미 보유 시 드롭.
- 접근: `currentItemId`(1칸) → 배열/큐(최대 2). `useRaceItem`에서 큐 소비, 게이트를 `length < 2`로, UI 슬롯 2칸.

### #2. 자동차 탑승 시 자동차 스킨 안 나옴
- 원인: `.runner-avatar.is-riding`는 파란 오라(drop-shadow)뿐. 실제 차 비주얼(`car-body/window/wheel`)은 `.race-item-icon.is-turbo-car`(룰렛 아이콘)에만 있음.
- 접근: `.runner-avatar.is-riding`에 차체 오버레이(`::after` 또는 마크업) 추가하거나 탑승 중 아바타 이미지 스왑. 렌더의 `riding` 플래그는 이미 있음(~11521).

### #3. 자동차: 박스 드랍 + E 사용
- 원인: 터보카는 **이미 루트 풀에 있음**([item-contract](../src/restored/games/singularity-race-item-contract.js), `TURBO_CAR weight 8`) — 드물어서 못 본 것 + #2 때문에 안 보임. E키는 `useActionSkill`(보상 스킬, ~8133)에 묶여 아이템 사용(`useRaceItem`, ~8662, 버튼 `#race-skill-button`)과 분리됨.
- 접근: (a) weight 8→14 상향. (b) E 핸들러를 "보유 아이템 있으면 `useRaceItem()` 먼저, 없으면 `useActionSkill()`"로 분기.

### #4. 채팅에 순위 표시 (닉네임#N)
- 원인: 채팅 줄이 `displayName`만 사용. 순위 미연결.
- 접근: `getRaceRunnerRankLabels()`(~11513, 러너별 순위 Map)로 발신자(senderId→러너) 순위를 가져와 `displayName + "#" + rank` 렌더. 시스템/관전 메시지 제외.

### #5. 순위방/관전 캐릭터 잔상·끊김
- 원인: 원격 보간(`resolveConnectedRemoteVisualRunner`/`sampleConnectedRemoteInterpolation`, ~9828)은 있으나 **서버 스냅샷 간격 200ms**([worker](../workers/singularity-race-worker.js) `SERVER_SNAPSHOT_INTERVAL`/line ~32)이 듬성해 보간점 부족. 아바타 `left/top`에 CSS transition 있으면 이중적용 잔상.
- 접근: 스냅샷 200ms→100ms(틱과 동일), `connectedRemoteInterpolationDelayMs`를 스냅샷 간격의 ~1.5~2배로, 아바타 위치 CSS transition 제거.

### 이동: 시작/정지 끊김·늦은 멈춤 (넷코드)
- 원인: `SERVER_TICK_INTERVAL_MS=100`, `INPUT_STALE_MS=550`(서버가 마지막 입력 코스팅), 클라 펌프 `CONNECTED_INPUT_PUMP_INTERVAL_MS=100`, 보정 correctionFactor 작음. 멈춤 입력 도달 지연 + 보정 당김 = "살짝 더 가다 멈춤".
- 접근: 키 떼면 즉시 정지 입력 전송(이미 keyup 1회 전송 있음, ~8149 확인), 스냅샷/보정 튜닝. **재작성에서 근본 해결되므로 과투자 금지.**

### 기본공격 뒤로 공격 불가 (방향 입력 부재)
- 원인: 버튼/키 공격은 event 없이 `facing`만 사용(`resolveBasicAttackAim` no-event 분기, ~8315). `facing`은 A/D(좌우)만 갱신, W/S(앞뒤) 미반영(`recordMovementInput`, ~10504). 서버는 전송된 aim 실행(`fallbackAimX` 거의 안 탐). 뒤 타겟 판정·서버 처리는 이미 존재.
- 접근: "뒤로 공격" 입력 추가(예: S 누른 상태 공격 → `aim.x = -1`, 또는 뒤 공격 버튼/롱프레스) → 그 aim을 `createRestoredMarathonAttackEnvelope`로 전송. 판정/서버는 그대로.

---

## 3. 권장 순서

A(사거리+거대화) → #5(끊김) → #1(아이템 2칸) → #2(자동차 스킨) → #3(E·드랍) → #4(채팅 순위) → 뒤로공격 → C/D(재작성 이후).
