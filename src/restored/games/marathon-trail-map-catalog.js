export const RESTORED_MARATHON_TRAIL_MAP_IDS = Object.freeze({
  BASIC: "baegeum-city",
  SQUARE: "singularity-square-sprint",
  MAZE: "singularity-maze-run"
});

export const RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID = RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC;

export const RESTORED_MARATHON_TRAIL_SAVE_POINTS = Object.freeze([
  Object.freeze({ index: 1, progressPercent: 28 }),
  Object.freeze({ index: 2, progressPercent: 58 }),
  Object.freeze({ index: 3, progressPercent: 88 })
]);

export const RESTORED_MARATHON_TRAIL_MAP_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC,
    label: "기본 스타디움",
    shortLabel: "기본",
    description: "균형 검증용 기본 지그재그 스타디움 코스.",
    savePoints: RESTORED_MARATHON_TRAIL_SAVE_POINTS,
    controlPoints: Object.freeze([
      point(6, 88), point(88, 88), point(96, 80), point(96, 72),
      point(24, 72), point(14, 64), point(26, 56), point(78, 54),
      point(90, 46), point(86, 38), point(24, 38), point(14, 30),
      point(16, 24), point(92, 24), point(96, 16), point(98, 10)
    ])
  }),
  Object.freeze({
    id: RESTORED_MARATHON_TRAIL_MAP_IDS.SQUARE,
    label: "네모 스프린트",
    shortLabel: "네모",
    description: "외곽 사각형을 크게 도는 박스형 속도 코스.",
    savePoints: RESTORED_MARATHON_TRAIL_SAVE_POINTS,
    controlPoints: Object.freeze([
      point(6, 88), point(94, 88), point(94, 12), point(10, 12),
      point(10, 72), point(82, 72), point(82, 32), point(98, 10)
    ])
  }),
  Object.freeze({
    id: RESTORED_MARATHON_TRAIL_MAP_IDS.MAZE,
    label: "미로 런",
    shortLabel: "미로",
    description: "짧은 복도와 되돌림이 많은 단일 정답 미로 코스.",
    savePoints: RESTORED_MARATHON_TRAIL_SAVE_POINTS,
    controlPoints: Object.freeze([
      point(6, 90), point(34, 90), point(34, 80), point(12, 80),
      point(12, 66), point(48, 66), point(48, 84), point(74, 84),
      point(74, 70), point(92, 70), point(92, 54), point(60, 54),
      point(60, 42), point(28, 42), point(28, 30), point(54, 30),
      point(54, 18), point(78, 18), point(78, 34), point(44, 34),
      point(44, 22), point(96, 22), point(98, 10)
    ])
  })
]);

function point(x, y) {
  return Object.freeze({ x, y });
}
