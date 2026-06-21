# BR.T2 UI 변경 보고서 — BuildMode 리디자인

**일자**: 2026-06-21
**범위**: `components/BuildMode.tsx` 풀 재작성 + `app/globals.css` 신규 토큰 추가

## 변경 파일

### `components/BuildMode.tsx` (재작성)

구조:
```
<section panel build-bench>
  <section-head bench-head> (eyebrow + h2 + muted + badge)
  <ol stage-progress>      ← D-003 5-stage 진행 시각화 (concept→base→taste→steps→done)
  <div chat-scroll>        ← 대화 영역
    pair-chef cold-start greeting (클라 상수, 백엔드 미전송)
    messages.map() — user/chef 버블 분기
      latest assistant ↓
        <ArtifactCard>     ← D-002 생성 카드 (name/concept/ingredients/tools/time)
        <GaugesCard>       ← TASTE §1 6+5축 게이지
        <StepsCard>        ← D-005 timer_sec 표시
        <ModifiedChips>    ← D-002 수정 표시
        <Warnings>         ← engineResponse.warnings
        <option-chips>     ← engineResponse.options 1~3개, 칩 클릭 = quickSend
    typing-indicator (busy)
    alert (error)
  <div build-input>        ← textarea + 샘플 + 전송
    placeholder: "답하거나, 칩을 탭하거나, '알아서 다 해줘'" (D-003a 시그널)
```

핵심 로직 변경:
- `submit(text?)`: 인자로 옵션 칩 빠른 전송 처리. setInput 비동기 문제 회피.
- `lastAssistantIdx`로 *최신* assistant 메시지에만 임베드 표시 (R-BR-1 과거 누적 방지).
- `loadFixture`: 기존 샘플 로드 분리 함수로 추출.
- Enter 키 = 전송, Shift+Enter = 줄바꿈 (Form behavior).
- `scrollRef`로 메시지 추가/응답 도착 시 자동 스크롤.

데이터 인터페이스 변경 0:
- `/api/recipe` POST body shape 그대로 (`messages` / `recipe_id` / `current_state` / `stage`)
- `splitDiff(prev, next.new_state)` 호출 그대로
- 응답 병합 (`{ ...recipeState, ...new_state }`) 그대로
- props 시그니처 그대로 (`authToken`, `recipeId`, `recipeState`, `onRecipeStateChange`, `onStageChange`, `stage`)

### `app/globals.css` (신규 토큰 추가)

추가 위치: `.commit-body` 다음, `@media (max-width: 860px)` 직전.

신규 클래스 (40개):
- 컨테이너: `.build-bench`
- Stage progress: `.stage-progress`, `.stage-pill`, `.stage-done`/`.stage-active`/`.stage-pending`, `.stage-marker`, `.stage-label`
- 채팅: `.chat-scroll`, `.chat-bubble`, `.bubble-chef`/`.bubble-user`, `.bubble-speaker`, `.bubble-body`, `.bubble-text`, `.typing-indicator`, `.chat-alert`
- 입력: `.build-input`, `.build-input textarea`, `.build-input-actions`
- 산출물 카드: `.artifact-card`, `.artifact-title`, `.artifact-concept`, `.artifact-chips`, `.artifact-chip`, `.artifact-meta`
- 게이지: `.gauges-card`, `.gauges-group-title`, `.gauges-grid`, `.gauge-row`, `.gauge-label`, `.gauge-track`, `.gauge-fill`, `.gauge-val`
- 스텝: `.steps-card`, `.step-row`, `.step-index`, `.step-text`, `.step-timer`
- 수정: `.modified-chips`, `.modified-chip`
- 옵션: `.option-chips`, `.option-chip`
- 경고: `.warning-card`, `.warning-row`

모바일 반응 추가:
- stage-progress: 가로 스크롤
- chat-scroll: 높이 축소 (440/320)
- gauges-grid: 1열
- chat-bubble: max-width 100%

기존 토큰 재사용:
- `--paper`, `--panel`, `--line`, `--line-strong`, `--ink`, `--muted`, `--mono`, `--serif`, `--gold`, `--heat`, `--heat-soft`, `--run`, `--charcoal`
- 공유 클래스: `.panel`, `.section-head`, `.bench-head`, `.eyebrow`, `.muted`, `.badge`, `.alert`, `.ghost` (button), `.terminal-bar`(미사용으로 전환)

## Dead CSS (별도 정리 사이클로 위임)

직전 2026-06-18 IDE 풍 BuildMode가 쓰던 다음 클래스는 본 사이클에서 *사용 안 함*:
- `.compile-bench`, `.compile-grid`, `.prompt-surface`, `.prompt-editor`, `.compiler-output`, `.state-inspector`, `.output-line`, `.artifact-list`, `.diff-kind`, `.diff-kind.created`, `.diff-kind.modified`, `.state-inspector .recipe-list`

CSS 보존 이유:
- 다른 컴포넌트(CookMode/Postmortem)에서 *공유 클래스*만 grep 매치 (terminal-bar, recipe-list pre 등) — 단 `recipe-list pre`는 BuildMode 외 사용처 없음.
- 본 사이클 범위 좁히기 위해 dead CSS 제거는 다음 cleanup 사이클로 위임.
- CSS 미사용은 typecheck/test/build 영향 0 (Next.js가 unused warning 미발생).

## 헌법 적용 매핑 (정합 확인)

| 헌법 항목 | 본 변경 적용 위치 |
|----------|------------------|
| §1.2 답변이 아니라 diff | LatestEmbeds 안 ArtifactCard/GaugesCard/StepsCard/ModifiedChips 임베드 |
| §1.3 한 턴 한 단계 | stage-progress UI + chat 흐름의 한 사이클 단위 |
| §2 plan mode 점진 커밋 | STAGES 배열 + 외층 pipeline-rail과 내층 stage-progress 층위 분리 |
| D-002 생성=카드/수정=diff | ArtifactCard (생성) + ModifiedChips (수정) 분리 |
| D-003 점진 빌드 | stage-progress의 status 분기 (done/active/pending) |
| D-003a 즉시 빌드 시그널 | INPUT_PLACEHOLDER 문구 ("답하거나, 칩을 탭하거나, '알아서 다 해줘'") |
| D-005 timer_sec | StepsCard의 `.step-timer` 표시 |
| TASTE §1 6+5축 | TASTE_LABELS / TEXTURE_LABELS 매핑 + GaugesGroup |
| TASTE §4 톤 | pair-chef cold-start greeting 클라 상수 |

## 잔존 위험 (BR.T3 inspector 인계)

- **R-BR-1 해소**: `lastAssistantIdx` 분기로 *최신*에만 임베드. 과거 메시지 임베드 누적 없음.
- **R-BR-2 해소**: `lastResponse.options.length > 0` 분기. 0개일 때 input만으로 진행 가능.
- **R-BR-3 해소**: `EngineResponseSchema` 옵션 max(15) 보장 — 칩 UI `padding 4px 12px`로 오버플로 없음 (대략 15자 = 폭 120px 이내).
- **R-BR-4 해소**: GaugesGrid `grid-template-columns: repeat(2, ...)` + 모바일 1열. 11축 모두 표시.
- **R-BR-5 해소**: 칩 클릭 = `submit(opt)` → 동일 user 메시지 전송 경로. user 메시지 본문이 동일 (시각 차이 없음 의도된 동작).
- **R-BR-6 신규**: pair-chef cold-start greeting은 *클라 상수*. 백엔드 messages 배열에 들어가지 않음 → 백엔드의 "맹탕 모드"(cold_start=true) 판정에 영향 없음. 단 사용자가 greeting을 *기억하고 답*하는 흐름은 백엔드가 모름 — 백엔드는 user 첫 입력만 받음. 이는 D-008 cold_start의 의도된 동작과 정합.
- **R-BR-7 신규**: dead CSS (compile-bench 등) 정리는 별도 사이클. CSS 빌드 size 약간 증가 (수십 KB 미만 추정).

## 자동 검증

- `npm run typecheck` → **PASS** (exit 0)
- `npm test` → **6/6 PASS** (회귀 0)
