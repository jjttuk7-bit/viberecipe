# AD.T2 UI 변경 보고서 — 사용자 직접 수정 + 에디트 히스토리

**일자**: 2026-06-21
**범위**: `components/BuildMode.tsx` 본문 보강 + `app/globals.css` 신규 토큰

## 신규 모델

### Mutation (D-022)
```ts
type Mutation =
  | { kind: "ingredient_remove"; index: number; name: string }
  | { kind: "tool_remove"; index: number; name: string }
  | { kind: "gauge_change"; group: "taste" | "texture"; key, from, to };
```

### Snapshot (D-023)
```ts
type Snapshot = {
  recipeState: RecipeState | null;
  lastDiff: SplitDiff | null;
  lastResponse: EngineResponse | null;
  messages: Message[];
  stage: Stage;
};
```

## 흐름 (D-022 B+ 채택)

```
사용자 칩 ✕ 클릭 (또는 게이지 +/− 클릭)
   │
   ▼
applyMutation(m)
   ├─ setPrevSnapshot(takeSnapshot())  ← undo 대상 1단계 저장
   ├─ next = mutateRecipe(state, m)    ← 클라 즉시 mutate (B+의 'i')
   ├─ onRecipeStateChange(next)         ← UI 즉각 반영
   └─ setMessages(prev => [..., { role: 'user', content: describeMutation(m) }])
                                        ← 자동 user 메시지 (B+의 'ii')
                                        ← "재료에서 '계란' 뺐어", "매운맛 5 → 6" 등 TASTE §4 톤

   │ 사용자가 추가 mutation 또는 자유 텍스트 입력 후 "전송"
   ▼
submit(text?)
   ├─ canSubmit: text 있거나 pendingUserCount > 0 (mutation 대기 메시지)
   ├─ setPrevSnapshot(takeSnapshot())  ← LLM 호출 직전 또 다른 스냅샷
   ├─ baseMessages = text 있으면 push, 없으면 그대로
   ├─ wireMessages = baseMessages.slice(-8)  ← ENGINE.md §3 정합
   └─ fetch('/api/recipe', { messages: wireMessages, ... })
                                        ← LLM이 사용자 mutation을 *공식 처리* (B+의 'iii')
                                        ← LLM이 재조정된 new_state 반환 가능
   │ LLM 응답 도착
   ▼
   setLastDiff(splitDiff(prev, new_state))  ← LLM 응답으로 인한 수정만 modified diff
   setMessages(prev => [...prev, { role: 'assistant', content: msg }])
                                        ← 클라 무한 누적 (D-023)
```

## 변경 파일

### `components/BuildMode.tsx`

신규 함수:
- `mutateRecipe(state, m)` — Mutation의 immutable 적용
- `describeMutation(m)` — TASTE §4 톤 메시지 생성
- `applyMutation(m)` — 스냅샷 + mutate + 메시지 자동 추가
- `undoLast()` — prevSnapshot 복원
- `takeSnapshot()` — 현재 상태 캡처
- `canSubmit(text)` — text 빈 채로도 pendingUserCount > 0이면 전송 가능

신규 state:
- `historyExpanded: boolean` — "더 이전 보기" 펼침 토글
- `prevSnapshot: Snapshot | null` — 1단계 undo

UI 변경:
- `submit` 함수 — `messages.slice(-8)`만 wire에 보내고, 클라 messages는 무한 누적
- `visibleMessages` — 펼침 토글에 따라 최근 4 assistant turn 또는 전체
- `<ArtifactCard>` — ingredients 칩에 ✕ / tools 항목에 ✕
- `<GaugesCard>` — 각 row에 +/- 버튼 (0~10 한계)
- `<LatestEmbeds>` — onMutate prop 추가, editable prop 추가
- "직전 취소" 버튼 — `prevSnapshot` 있을 때만 활성, undoLast 호출
- "더 이전 보기" / "최근만 보기" 토글 버튼
- "전송 (N개 수정)" — pendingUserCount > 0일 때 카운트 표시

props 시그니처 확장:
- `onRecipeStateChange: (state: RecipeState | null) => void` (null 받기 가능 — undo 복원 위해)

### `app/globals.css`

신규/수정 클래스:
- `.artifact-chip` 수정 — chip-text + chip-remove 분기 패딩 조정
- `.chip-text` 신규 — 칩 본문 inline-flex
- `.chip-remove` 신규 — ✕ 버튼, hover에 heat-soft 톤
- `.tools-line`, `.tool-chip` 신규 — 도구 칩 + ✕
- `.artifact-meta` — align-items: center 추가
- `.gauge-row` 수정 — grid 4열 (label/track/val/buttons)
- `.gauge-buttons`, `.gauge-btn` 신규 — +/- 버튼, hover에 gold tint
- `.history-toggle` 신규 — "더 이전 보기" 토글
- 모바일 반응 — `.gauge-row` 4열 유지하되 gap 줄임

## 헌법 매핑 (정합)

| 헌법 / ADR | 본 사이클 적용 |
|------------|---------------|
| §1.3 한 턴 한 단계 | mutation = 한 turn (사용자 action). LLM 응답 = 다음 turn |
| D-001 | LLM 여전히 new_state 반환. *코드*가 diff. RecipeState 출처 (a) LLM (b) 사용자 mutate 둘 다 |
| D-002 | 생성=카드, 수정=diff. 사용자 본인 수정은 modified diff 미생성 (GAD-6) |
| D-003 | 사용자 수정은 stage 변경 트리거 아님 (GAD-7). LLM 응답만이 stage 갱신 |
| D-005 timer_sec | 본 사이클 비편집 (steps 비범위, GAD-2=A) |
| D-007/D-008 용접 | 데이터 영속 변경 0. 클라 메모리 내 히스토리만 |
| D-021 | 임베드의 의미 *읽기 전용 → 인터랙티브*로 확장 |
| D-022 (신규) | 본 사이클이 *적용 대상* |
| D-023 (신규) | 본 사이클이 *적용 대상* |
| TASTE §4 친구 톤 | describeMutation의 메시지 표현 |

## 잔존 위험 / 가드 (AD.T3 inspector 인계)

- **R-AD-1**: 클라 messages 메모리 무한 누적 — 일반 BUILD 세션 수십 turn 이내, 1MB 미만. 세션 새로고침 시 손실은 명시 (P2 영속 사이클까지).
- **R-AD-2**: 자동 user 메시지가 LLM 헷갈리게 할 위험 — 본 사이클은 *일반 user 메시지로 처리*. 현재 시스템 프롬프트가 *어떤 종류*라도 받아도 자연 처리(ENGINE.md §3). 다음 사이클에서 시그널 강화 검토 (예: `[user-edit]` prefix).
- **R-AD-3**: 클라 mutate vs LLM 응답 race — `editable = !busy` 가드로 *LLM 호출 중* mutation 잠금. LLM 응답 도착 = LLM이 SSOT (덮어씀).
- **R-AD-4**: undo의 의미 명확 — `prevSnapshot`은 *직전 1 큰 변경* (mutation 단발 또는 submit 1회). 즉 사용자가 mutation 5번 하면 *그 사이* undo는 각 단계 X, 직전 1개만. 본 사이클 의도된 동작. 다중 undo는 다음 사이클.
- **R-AD-5**: 비편집 필드(name/concept/steps/time_min)는 그대로. UI에 *편집 가능 여부* 시각 시그널은 본 사이클 미적용 — hover 상태로 자연 추론 (칩 옆 ✕, 게이지 옆 +/-). 다음 고도화 사이클 검토.
- **R-AD-6**: SSR HTML로 *인터랙티브 마커 검증 불가* — recipeState=null 초기 상태에서는 ArtifactCard/GaugesCard 미렌더 → chip-remove/gauge-btn 마커 안 나타남. *샘플 로드 또는 LLM 응답 후*에만 임베드 렌더. 의도된 동작.

## 자동 검증

- `npm run typecheck` → **PASS** (exit 0)
- `npm test` → **6/6 PASS** (회귀 0)
- SSR 마커 (기본 진입):
  - `build-bench`, `stage-progress`, `직전 취소` 표시 ✅
  - chip-remove/gauge-btn은 recipeState 채워진 후 동적 렌더 (별도 hand-test 권고)

## 다음 단계 인계

- **AD.T3 inspector**: weld-trace + 회귀 점검 + D-022/D-023 헌법 적용 검증
- **AD.T4 scribe**: D-022 / D-023 ADR 정식 등재 + D-001/D-002/D-021 결과 섹션 보강 + TASTE.md §6 mutation 표현 형식 등재
