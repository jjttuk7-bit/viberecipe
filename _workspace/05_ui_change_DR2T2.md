# DR2.T2 UI 재구성 보고서

## 변경 파일

### `app/page.tsx`
- `pipeline` 배열 + `<nav.pipeline-rail>` 제거
- `<section.workbench>` → `<section.mode-stage>` (단순화)
- `<aside.runtime-inspector>` 제거 — session 메트릭은 dev-shelf로 흡수, FingerprintCard는 `<aside.page-footer-aside>`로 이동

### `components/BuildMode.tsx` 풀 재작성
- 신규: `<RecipeCanvas>` 컴포넌트 — 우측 sticky 산출물 패널 (산출물 + 메타 + 변경 표식 + 빈 상태)
- 신규: `<StagePlanCardMini>` / `<ContextMetaCardMini>` — Plan/Context 카드 *축소 변종* (RecipeCanvas 하단 메타 블록)
- 구조: `<section.build-bench> > <stage-progress> + <build-canvas grid> > <chat-side> + <recipe-side>`
- LatestEmbeds 제거 — 옵션 칩 / Warnings만 *최신 chef 버블 안* 인라인 렌더
- 사용자 mutation (D-022) — RecipeCanvas의 ingredients 칩 / tools 칩 / gauge +/- 버튼이 직접 호출. 흐름 무변
- D-023 undo / messages 무한 누적 / submit slice(-8) — 모두 무변

### `app/globals.css`
신규 클래스 30+종:
- `.mode-stage`, `.page-footer-aside`
- `.build-canvas` (2-col grid), `.chat-side`, `.recipe-side` (sticky)
- `.recipe-canvas`, `.recipe-canvas-empty`
- `.canvas-head`, `.canvas-eyebrow`, `.canvas-head-right`, `.canvas-modified`
- `.canvas-live`, `.canvas-live-dot`, `.canvas-live-idle`
- `.canvas-title` (Newsreader), `.canvas-concept`, `.canvas-meta`
- `.canvas-empty-msg`
- `.canvas-section`, `.canvas-section-label`
- `.gauges-card-inner`
- `.canvas-steps`, `.canvas-step`, `.canvas-step-index` (검정 원 번호), `.canvas-step-text`, `.canvas-step-timer`
- `.canvas-meta-block` (dashed top border)
- `.plan-card-mini`, `.context-meta-card-mini` (축소 변종)
- `.warning-inline`

수정:
- `.build-bench` — 외곽 테두리/배경 제거 (panel 효과 해제 — 부모 .panel과 중복 회피)
- 모바일: `.build-canvas` 1-col stack, `.recipe-side` position static

## 헌법 매핑

| ADR | 본 사이클 |
|-----|----------|
| D-001 / D-002 | 흐름 무변 — `splitDiff(prev, new_state)` 그대로 |
| D-003 | stage-progress가 build-bench 상단 stretch (양 패널 위) |
| D-021 | 4-요소 패턴 *구조* 재해석 — D-027이 그 SSOT |
| D-022 | mutation 흐름 동일, *위치만* recipe-side로 이동 |
| D-023 | 클라 messages 누적 / undo prevSnapshot — 전혀 무변 |
| D-024 / D-025 | Plan/Context 카드 → RecipeCanvas 하단 *메타 블록* mini 변종 |
| D-026 | 색·폰트 토큰 자연 적용 (canvas-title은 Newsreader, canvas-eyebrow는 JetBrains Mono) |

## 잔존 위험
- R-DR2-1 해소: 항상 최신 RecipeState 노출 (빈 상태는 dedicated empty 카드)
- R-DR2-2 해소: ModifiedChips → `.canvas-modified` 헤더 옆 작은 칩 (live 다음)
- R-DR2-3 해소: Warnings → 최신 chef 버블 안 인라인 (사용자 시야 자연 진입)
- R-DR2-4 해소: pipeline-rail 제거. Cook 종료 시 onFinish 콜백이 setMode("postmortem") 자동 — 변경 0
- dead CSS: `.pipeline-rail`, `.pipeline-node`, `.node-*`, `.runtime-inspector`, `.workbench`, `.ide-grid` — globals.css 잔존, cleanup 사이클 위임

## 자동 검증
- typecheck PASS
- npm test 6/6 PASS (회귀 0)
- SSR 마커 PASS: build-canvas / chat-side / recipe-side / recipe-canvas / canvas-eyebrow / canvas-empty-msg / "RECIPE · 대기" / "왼쪽에서 대화로 시작..."
