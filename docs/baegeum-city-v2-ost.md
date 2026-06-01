# 배금도시 v2 OST

결론: 현재 OST는 `PEPEANT/dis-site`의 `RECLAIM_2.5` BGM 세 곡을 원본 파일명 그대로 가져와 설정 패널에서만 수동 재생한다.

## Current Behavior

- OST 파일 위치: `assets/audio/ost/reclaim-2.5`
- 재생 UI 위치: 게임 화면 오른쪽 상단 설정 패널 안
- 자동 재생 없음: 브라우저 정책과 플레이 화면 단순화를 위해 사용자가 `OST 재생`을 눌러야 시작한다.
- 곡이 끝나면 다음 곡으로 넘어간다.
- 특이점레이스는 별도 feature-owned BGM을 쓴다. 파일은 `assets/restored/audio/singularity-race/bgm/` 아래에 두고, `src/restored/assets/asset-manifest.js`의 `audio:bgm:singularity-race:*` id로만 참조한다.
- 특이점레이스 BGM도 브라우저 자동재생 정책을 따른다. 첫 클릭/터치/키 입력 후 런처/프로필/로비/대기열/맵 미리보기용 2곡 플레이리스트(`modern-future-world`, `atlas-futuristic`)를 재생한다. `squid-wake`는 일반 로비 BGM에서 제외하고 입장 게이트가 열릴 때, 대기열에 들어갈 때, 개발방에 입장할 때의 신호음으로만 한 번 재생한다. 관리자가 경기 시작을 누르면 대기/입장 음악을 정지하고 `countdown-bell` 10초 SFX에 맞춰 카운트다운한다. 카운트다운이 끝나 게이트가 열리면 `dont-stop-me` 경기 시작 음악으로 전환한다. 실패하면 다음 사용자 제스처에서 다시 시도한다.

- Singularity Race SFX lives under `assets/restored/audio/singularity-race/sfx/` and is wired only to race feedback events (attack, item pickup, item use/throw, item hit, reward skill, finish, podium applause) plus local UI cues (`ui-tap`, `ui-confirm`, `ui-toggle`, `ui-deny`) on the player/admin pages. It stays out of the shared OST button.

## Imported Tracks

- `bgm_0.mp3`
- `bgm_1.mp3`
- `bgm_2.mp3`

## Rules

- OST 버튼은 메인 HUD에 따로 빼지 않는다.
- 새 음악을 추가할 때는 `assets/audio/ost/VENDOR.md`에 출처를 먼저 남긴다.
- 온라인 도박/도시 기능과 분리해서, OST는 클라이언트 로컬 연출로만 둔다.
- feature-owned 음악은 공용 OST 버튼에 섞지 말고, 해당 기능 문서와 asset manifest에 출처/상태를 남긴다.
