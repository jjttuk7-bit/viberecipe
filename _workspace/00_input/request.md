# DR2 — 2-pane 레이아웃 (좌 채팅 / 우 sticky 산출물)

**일자**: 2026-06-21
**근거**: 사용자 0001 디자인 스크린샷 + DR1 후 "아직 이대론데" 피드백 — *2-pane*이 디자인 인상의 핵심.

## 분석 (스크린샷 0001)
- **좌측**: 대화 영역 (pair-chef ↔ user 채팅 + 옵션 칩 + 입력 박스)
- **우측 (sticky)**: 작성 중 레시피 카드
  - 상단 `RECIPE · 작성 중` 라벨 + `• live` 인디케이터
  - 큰 제목 (들기름 두부김치) — Newsreader serif
  - 메타 `2인분 · 약 12분 · 쉬움`
  - 재료 섹션 — 둥근 outline 칩들
  - 단계 섹션 — 번호 ① ② + 텍스트
- pipeline-rail 없음 — 헤더 `쿡 모드 →` 버튼이 모드 전환
- runtime-inspector 없음 — Fingerprint는 별도 위치 검토

## 핵심 결정 (D-021 4-요소 패턴 *구조* 재해석)
기존 임베드(LatestEmbeds 안 7종)를 *어디로 옮길지*:
- **산출물 카드들** (ArtifactCard/GaugesCard/StepsCard) → **우측 recipe-pane**
- **상태 메타** (StagePlanCard/ContextMetaCard) → 우측 recipe-pane 상단 작게 (또는 좌측 채팅 위)
- **수정/경고** (ModifiedChips/Warnings) → 우측 패널 안 (변경 표식)
- **옵션 칩** → **좌측 채팅 안** 유지 (LLM 응답에 직접 작용)

## 신규 ADR 후보
**D-027** 2-pane 구조 — 임베드 분리 정책 (대화/산출물). 메타(plan/context)는 산출물 패널 상단. 옵션 칩만 채팅에 잔존.

## 본 사이클 범위
1. `app/page.tsx`: `.ide-grid` 단순화 — pipeline-rail / runtime-inspector 제거 (또는 작은 영역 이전)
2. `components/BuildMode.tsx`: 좌 chat-side / 우 recipe-side 두 영역 렌더 (state 한 곳에 유지)
3. 신규 컴포넌트: `<RecipeCanvas>` (산출물 + 메타 카드)
4. FingerprintCard 처리 — 페이지 하단 또는 우측 패널 *접힌* 형태
5. globals.css 신규 클래스 — `.build-canvas`, `.chat-side`, `.recipe-side`, `.recipe-canvas`, `.canvas-head`, `.canvas-title`, `.canvas-meta` 등

## 불변
- `/api/recipe` 인터페이스 0
- 데이터 용접 5+1 라인 회귀 0
- D-022 mutation / D-023 undo 동작 0
- D-024 Plan / D-025 Context 데이터 흐름 0 (위치만 변경)
- schema 변경 0

## 정책
권고 자동 채택. 위험 큰 결정만 묻기. 결과 보고 후 조정.
