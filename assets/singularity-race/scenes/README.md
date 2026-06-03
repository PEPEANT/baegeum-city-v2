# 레이어 장면(Layered Scenes) 정리 규칙

배경·조명·글자·단상처럼 **여러 겹으로 그린 한 화면**을 모아두는 곳.
캐릭터(스킨)는 코드가 맨 위에 얹으므로 이미지에 넣지 않는다.

## 폴더 구조

```
assets/singularity-race/scenes/<scene-name>/
  background.png   # 맨 뒤 (하늘/벽 등)
  lights.png       # 조명 (스포트라이트 빛) — 투명 PNG
  title.png        # 글자/배너 ("2027 AGI" 등) — 투명 PNG
  podium.png       # 단상 — 투명 PNG
```

- 뒤→앞 순서: `background → lights → title → podium → (캐릭터) → (이름표)`
- 캐릭터/이름표는 코드가 그림. 이미지에 넣지 말 것.
- 두 가지 레이어 방식 (`layered-scene.js`의 `placement`로 지정):
  - **cover**: 배경처럼 화면을 꽉 채움 (background)
  - **placed**: 글자·단상처럼 제 비율 그대로 특정 위치에 얹는 스프라이트 (title, podium)
- 배경 외 나머지는 **투명 배경 PNG**. 크기는 제각각이어도 됨(placed가 비율 유지).

## 새 장면 추가하는 법 (3단계)

1. 위 4개 파일을 `assets/singularity-race/scenes/<scene-name>/`에 넣는다.
2. `src/restored/assets/asset-manifest.js`에 4개 id 등록:
   - `image:race:singularity-race:scene-<scene>-background` (role: `background`)
   - `image:race:singularity-race:scene-<scene>-lights` (role: `ui`)
   - `image:race:singularity-race:scene-<scene>-title` (role: `ui`)
   - `image:race:singularity-race:scene-<scene>-podium` (role: `stadium`)
3. `src/restored/ui/layered-scene.js`의 장면 레지스트리에 `<scene-name>` 항목 추가
   (레이어 id 매핑 + `aspectRatio` + 캐릭터가 설 `podiumAnchor`).

## 캐릭터 위치(`podiumAnchor`)

단상 위에 발을 딛는 지점. 장면 컨테이너 기준 백분율.
- `bottom`: 단상보다 캐릭터가 **뜨면 낮추고**, **파묻히면 높인다**.
- `left`: 보통 `50%` (중앙).

## 아이템 등 다른 디자인은?

레이어 장면이 아닌 단일 이미지(아이템 아이콘, 스킨 등)는 이 폴더가 아니라
역할별 컨벤션을 따른다 — `assets/singularity-race/items/`, `.../skins/` 식으로
만들고 동일하게 매니페스트에 `image:item:...`, `image:skin:...`으로 등록한다.
