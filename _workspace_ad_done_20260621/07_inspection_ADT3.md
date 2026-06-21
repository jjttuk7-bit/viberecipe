# AD.T3 정합성 검증 — weld-trace 보고서

**검증 절차**: weld-trace 스킬 (5+1 라인 + 5 경계면 + cold-start + D-008/D-022/D-023 강제)
**일자**: 2026-06-21
**최종 판정**: **PASS (결함 0건)**

---

## 트레이스한 용접 라인

| 라인 | 시작 | 종착 | 본 사이클 변경 | 판정 |
|------|------|------|--------------|------|
| Line 1 | `/api/recipe` 호출 | `lib/prompt.ts` 시스템 프롬프트 | **변경 없음** (요청 body 4 필드 + slice(-8) 유지) | **회귀 0** |
| Line 2 | CookMode 핫픽스 | cook_runs.step_events | 변경 없음 | **회귀 0** |
| Line 3 | Cook 종료 | Postmortem | 변경 없음 | **회귀 0** |
| Line 4 | Postmortem 제출 | save_cook_run RPC | 변경 없음 | **회귀 0** |
| Line 5 | Line 4 결과 → 다음 BUILD Line 1 | buildContext.fetchBuildContext | 변경 없음 | **회귀 0** |
| Line 6 (FP 사이클) | fingerprints → FingerprintCard | 변경 없음 | **회귀 0** |
| **신설 *서브 라인***: 사용자 mutation → user 메시지 누적 → 다음 Line 1 입력 | applyMutation | `/api/recipe.messages` | **추가 (D-022)** | **PASS** |

### 신설 서브 라인 트레이스 (D-022)

```
사용자 칩 ✕ 클릭
   │
   ▼
applyMutation(m) — BuildMode.tsx
   ├─ takeSnapshot() → prevSnapshot                      ← D-023 undo 1단계
   ├─ mutateRecipe(state, m) → next                       ← immutable patch
   ├─ onRecipeStateChange(next)                            ← page.tsx setRecipeState
   └─ setMessages(prev => [..., { role:'user', content: describeMutation(m) }])
                                                          ← TASTE §4 톤 자동 메시지

   │ 사용자가 "전송" (또는 자동 user 메시지 누적 후)
   ▼
submit(text?) → /api/recipe POST
   ├─ wireMessages = messages.slice(-8)                    ← ENGINE.md §3 정합
   ├─ current_state = recipeState                          ← mutation 반영된 상태
   └─ stage = stage                                        ← GAD-7: mutation은 stage 미변경

   │ 백엔드 처리
   ▼
/api/recipe (라우트 변경 0)
   ├─ enforceRateLimit / authenticateRequest               ← 무변경
   ├─ fetchBuildContext({ recipeId, userId })              ← Line 1 그대로
   ├─ buildSystemPrompt({ stage, buildContext, current_state })
   │                                                       ← LLM이 mutation 메시지를 일반 user 메시지로 처리
   └─ callEngineWithRetry → EngineResponseSchema           ← D-004 / D-014 무변경
                                                          ← LLM이 *재조정된* new_state 반환 가능
   │ 응답
   ▼
splitDiff(prev, new_state) → SplitDiff                     ← D-001 / D-002 *코드*가 diff
setLastDiff / onRecipeStateChange / onStageChange          ← 정상 갱신
```

**판정**: 신설 서브 라인이 *기존 Line 1*을 그대로 활용. 백엔드 무손상. PASS.

---

## 경계면 비교

| 경계 | 송신 | 수신 | 일치 | 판정 |
|------|------|------|------|------|
| A: 시스템 프롬프트 ↔ Zod | lib/prompt.ts | lib/schema | 본 사이클 미변경 | **회귀 0** |
| B: API 응답 ↔ 클라 사용 | `/api/recipe` 응답 `{ engineResponse, parsedAt }` | BuildMode `payload.engineResponse` | 변경 0 | **PASS** |
| **B': 클라 요청 body ↔ RequestBodySchema** | BuildMode submit body `{ messages, recipe_id, current_state, stage }` | RequestBodySchema.parse | **mutation 메시지 추가됨**. body shape 그대로 — *messages 배열 안의 user 메시지 1개 추가*만 영향. RequestBodySchema는 role/content만 검증 → 통과 | **PASS** |
| C: Zod ↔ Supabase | 본 사이클 미변경 | 미변경 | — | **회귀 0** |
| D: StepEvent ↔ runtime.ts | 본 사이클 미변경 | 미변경 | — | **회귀 0** |
| E: Fingerprint traits ↔ 사용처 | 본 사이클 미변경 | 미변경 | — | **회귀 0** |

### 경계 B' 상세 (신설)

mutation 자동 user 메시지 예시:
- `{ role: "user", content: "재료에서 '계란' 뺐어" }` — RequestBodySchema 통과 (string)
- `{ role: "user", content: "매운맛 5 → 6" }` — RequestBodySchema 통과
- `{ role: "user", content: "'팬' 도구는 빼고 가자" }` — RequestBodySchema 통과

RequestBodySchema (`route.ts:RequestBodySchema`):
```ts
messages: z.array(
  z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  }),
).max(8)
```

mutation 메시지는 모두 `string` 본문이라 통과. 8 max도 클라가 slice(-8)로 보장. **경계 위반 0**.

---

## D-022 적용 검증 (신규 ADR)

| D-022 결정 | 본 사이클 적용 |
|----------|---------------|
| 1. RecipeState 출처 (a)/(b) | LLM 응답은 `engineResponse.new_state` → onRecipeStateChange. 사용자 mutate는 mutateRecipe → onRecipeStateChange. 둘 다 같은 setter로 흘러감 |
| 2-i. 클라 즉시 시각 mutate | mutateRecipe 호출 후 즉시 onRecipeStateChange — UI 즉각 반영 |
| 2-ii. user 메시지 자동 생성 | describeMutation으로 메시지 본문 생성, setMessages로 push |
| 2-iii. 사용자 전송 시 LLM 공식 처리 | submit이 messages.slice(-8) wire — mutation 메시지가 자동 포함됨 |
| 3. 사용자 본인 수정의 modified diff 미표시 | applyMutation은 setLastDiff 호출 안 함. LLM 응답으로 인한 splitDiff만 modified 생성 |
| 4. 편집 가능 필드 범위 | ArtifactCard ingredients/tools / GaugesCard taste/texture (GAD-2=A) |
| 5. stage 진행 미트리거 | applyMutation은 onStageChange 호출 안 함 (GAD-7) |
| 6. 모든 mutation은 user 메시지 흔적 | describeMutation이 인간 가독 텍스트 → messages 누적 |

**판정**: D-022 결정 6개 항목 모두 코드로 구현. PASS.

## D-023 적용 검증 (신규 ADR)

| D-023 결정 | 본 사이클 적용 |
|----------|---------------|
| 1. 클라 messages 무한 누적 | setMessages([...baseMessages, assistant]) — slice 안 함 |
| 2. 백엔드 호출은 slice(-8) | `wireMessages = baseMessages.slice(-8)` — 한 줄 |
| 3-i. 초기 진입 4 assistant turn만 | `VISIBLE_ASSISTANT_LIMIT = 4`, visibleMessages 계산 |
| 3-ii. "더 이전 보기" 펼침 | history-toggle 버튼 + setHistoryExpanded |
| 4. 직전 되돌리기 1단계 | prevSnapshot 1개. setPrevSnapshot(takeSnapshot())은 mutation 직전 + submit 직전 |
| 5. 영속 X | useState만, localStorage 사용 0 |

**판정**: D-023 결정 5개 항목 모두 코드로 구현. PASS.

---

## D-001 / D-002 / D-021 결과 섹션 보강 필요 명시

본 사이클이 *기존 ADR의 결과 섹션*을 보강해야 할 항목들 (AD.T4 scribe 인계):

- **D-001**: RecipeState 출처가 (a) LLM new_state 또는 (b) 사용자 직접 수정 두 가지. *diff 계산은 여전히 코드*. 본문 위반 0.
- **D-002**: 사용자 본인 수정은 modified diff 미표시. LLM 응답으로 인한 수정만 표시.
- **D-021**: 4-요소 패턴 중 *임베드의 의미* — 읽기 전용 → 인터랙티브. ArtifactCard의 ingredients/tools 칩 + GaugesCard의 +/- 버튼이 그 적용.

본 ADR 본문은 변경 안 함. 결과 섹션 한 줄 또는 두 줄 추가만.

---

## D-008 게이트 재확인

> "이 기능을 떼어내도 다른 단계가 여전히 완전한가?"

- 사용자 직접 수정과 에디트 히스토리를 *떼어내도* Cook→Postmortem→RuntimeLog→Fingerprint→다음 BUILD 흐름은 그대로 작동. 데이터 용접 위반 0.
- 그러나 본 사이클의 *진정한 가치*는 §1.3 합의 정신의 *UI 강화* — 페어 프로그래밍 감각 자체. 헌법 정신 *복원* 측면이라 §4 강제 규칙 BLOCK 트리거에 걸리지 않음.

**판정**: PASS.

---

## P0 회귀 검증

| ID | 점검 항목 | 결과 |
|----|---------|------|
| A | `/api/*` rate limit | 라우트 변경 0 ✅ |
| B | API 키 서버 격리 | 변경 0 ✅ |
| C | server-only | 변경 0 ✅ |
| D | localStorage 금지 | BuildMode useState만 (R-AD-1: 세션 새로고침 시 손실 명시) ✅ |
| E | SSOT | z.object 추가 0, schema import만 ✅ |

---

## TASTE.md §1·§4 정합 검증

| TASTE 원칙 | 본 사이클 적용 |
|-----------|---------------|
| §1 맛 6축 / 식감 5축 | GaugeGroup이 모든 축 +/- 버튼 노출. 0~10 한계 클램프 |
| §1 게이지를 다룰 때 — 변화량이 직관적 | mutation 메시지가 "5 → 7" 형식으로 변화량 명시 |
| §4 친구지 선생 톤 | describeMutation 표현: "재료에서 'X' 뺐어" / "매운맛 5 → 7" — 평어, 단호 없음 |
| §4 칭찬 인플레이션 금지 | mutation 메시지에 칭찬 0 |
| §6 (D-021 등재) BUILD UX 톤 | 본 사이클이 §6 정신의 자연 확장 — 채팅+stage+*인터랙티브* 임베드+옵션 |

---

## 자동 검증

- `npm run typecheck` → **exit 0**
- `npm test` → **6/6 PASS** (회귀 0)
- dev 서버 SSR 마커:
  - `build-bench`, `stage-progress`, `직전 취소` 텍스트 ✅
  - chip-remove / gauge-btn / tool-chip / history-toggle 마커는 *recipeState 채워진 후*만 동적 렌더 — 의도된 동작 (R-AD-6)

---

## 결함 목록

**없음.**

미세 메모:
- M-AD-1: AD.T2의 모든 mutation 흐름은 hand-test 권고 — 샘플 로드 → 재료 ✕ → 게이지 +/- → "전송 (N개 수정)" 카운트 → 응답 도착 → 직전 취소 동작. SSR로는 못 잡는 인터랙티브 영역.
- M-AD-2: 자동 user 메시지의 LLM 처리 품질은 *시스템 프롬프트가 어떻게 받아들이는가*에 의존. ENGINE.md §3 일반 user 메시지 처리 정책으로 자연 흡수. 만약 LLM이 "재료에서 'X' 뺐어"를 *지시*로 처리하지 않고 *확인 요청*으로 처리한다면 사용자 mutation의 의도가 *재확인*되는 부드러운 합의 흐름. TASTE §4 친구 톤과 정합.

---

## AD.T4 scribe 인계

- **새 ADR 등재**:
  - **D-022**: 사용자 직접 수정 — RecipeState의 두 번째 출처 + GAD-1=B+ / GAD-2=A / GAD-6~7 권고 채택
  - **D-023**: 에디트 히스토리 — 클라 messages 무한 누적 + 1단계 undo + 영속 P2 이월
- **기존 ADR 결과 섹션 보강**:
  - D-001: 출처 2개 명시 한 줄
  - D-002: 사용자 본인 수정 표시 안 함 명시 한 줄
  - D-021: 임베드 의미 인터랙티브 확장 명시 한 줄
- **TASTE.md §6 보강**: mutation 자동 메시지 형식 4종 (재료 삭제 / 도구 삭제 / 게이지 +/-)
- **MAP.md / SESSION.md / CLAUDE.md §9** 갱신
