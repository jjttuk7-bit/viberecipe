# DR2.T1 — D-021 4-요소 패턴 *구조* 재해석

## 결정 (architect, 권고 자동 채택 정책)
**D-027 후보**: 임베드의 *공간 위치*를 두 패널로 분리.

### 분리 매핑
| 요소 | 기존 위치 | 새 위치 |
|------|----------|--------|
| 채팅 버블 (chef ↔ user) | chat-scroll | **chat-side** (좌측) |
| 옵션 칩 (`engineResponse.options`) | LatestEmbeds 안 | **chat-side** 안 *최신 chef 버블 아래* (그대로) |
| StagePlanCard (D-024) | LatestEmbeds 안 | **recipe-side 상단** (메타 영역) |
| ContextMetaCard (D-025) | LatestEmbeds 안 | **recipe-side 상단** (메타 영역) |
| ArtifactCard | LatestEmbeds 안 | **recipe-side 본문** (큰 제목 + 재료 칩) |
| GaugesCard | LatestEmbeds 안 | **recipe-side 본문** |
| StepsCard | LatestEmbeds 안 | **recipe-side 본문** (번호 + 텍스트) |
| ModifiedChips (D-002) | LatestEmbeds 안 | **recipe-side 헤더 옆** 또는 *변경 표식* (작게) |
| Warnings | LatestEmbeds 안 | **recipe-side 하단** 또는 *최신 chef 버블 아래* |

### 4-요소 패턴 재정의 (D-027)
1. **대화 흐름** (좌): pair-chef ↔ user 채팅 + 옵션 칩 + 입력 박스
2. **stage progress** — *대화 흐름 상단* (좌측 패널 상단)
3. **임베드** = 우측 *recipe-side* 패널. 메타(plan/context) + 산출물(name/concept/ingredients/tools/time/taste/texture/steps) + 변경 표식
4. **모드 전환** — 헤더 `쿡 모드 →` 버튼이 담당

### pipeline-rail / runtime-inspector 처리
- **pipeline-rail (4-모드 전환)**: 제거. 헤더 `쿡 모드 →` 버튼 + Cook 종료 시 Postmortem 자동 진입으로 충분. LEARN은 이미 disabled placeholder.
- **runtime-inspector**: 분리 — `<FingerprintCard>`는 *페이지 하단 또는 chat-side 하단* 작게. session 메트릭(authToken 파싱/recipe_id 표시 등)은 dev-shelf 안으로 흡수.

### 구현 전략 — state 끌어올리기 vs 두 영역 한 컴포넌트
**채택**: BuildMode가 *두 영역 모두 렌더*. state 끌어올림 비용 회피. state 단일 출처 유지.
- BuildMode `<section.build-canvas>` 안에 `<div.chat-side>` + `<div.recipe-side>` grid 2-col.
- 신규 컴포넌트 `<RecipeCanvas>` (산출물 패널) — BuildMode 안에서 호출, mutation/state는 props로 전달.

### globals.css 신규 클래스
- `.build-canvas` — grid 2-col 컨테이너
- `.chat-side` / `.recipe-side` — 두 패널
- `.recipe-canvas` — 우측 패널 안 sticky 카드
- `.canvas-head` (RECIPE · 작성 중 + live)
- `.canvas-title` (Newsreader 큰 제목)
- `.canvas-meta` (메타 영역)
- `.canvas-section` (재료/단계 등 섹션)
- `.canvas-section-label` (재료 / 단계)
- `.canvas-step` / `.canvas-step-index`
- 모바일: 1-col으로 stack

### 모바일 처리
0002의 모바일 버전은 1-col stack — `.build-canvas` `@media (max-width: 860px) { grid-template-columns: 1fr }`.

### 헌법 정합
- D-001 / D-002 / D-022 / D-023 / D-024 / D-025 모두 *위치만 이동*, 데이터 흐름 0 변경 — PASS.
- D-021 *결과 섹션*에 *임베드 분리 정책* 추가 명시화 (D-027 등재 동반).
- §4 데이터 용접: 변경 0.
- D-007 Fingerprint: FingerprintCard 위치 이동 (chat-side 하단), 데이터 흐름 0.

### 잔존 위험
- **R-DR2-1**: 임베드를 *대화 밖*으로 옮기면 *최신 응답의 산출물* 표시 시점이 달라짐 — 클라가 `recipeState` 누적이라 *항상 최신 상태* 노출. 정합.
- **R-DR2-2**: ModifiedChips는 *LLM 응답으로 인한 수정*만 표시인데 그 위치를 *우측 패널 어디에*? recipe-canvas 헤더 옆 작게 (live 다음).
- **R-DR2-3**: Warnings는 *조리 안전 등* 즉시 인지가 중요 — *좌측 최신 chef 버블 아래* 또는 *우측 패널 하단*. 권고: **우측 패널 하단 + 옅은 heat 톤** (사용자 시야에 들어옴).
- **R-DR2-4**: pipeline-rail 제거 시 *POSTMORTEM 모드 진입*은? — Cook 종료 시 `onFinish` 콜백이 setMode("postmortem") 자동 (page.tsx 기존 로직). 변경 0.
