# BR.T3 정합성 검증 — weld-trace 보고서

**검증 절차**: weld-trace 스킬 (5 라인 + 5 경계면 + cold-start + D-008 회귀)
**일자**: 2026-06-21
**최종 판정**: **PASS (결함 0건)**

---

## 트레이스한 용접 라인

| 라인 | 시작 | 종착 | 본 사이클 변경 | 판정 |
|------|------|------|--------------|------|
| Line 1 | `/api/recipe` 호출 | `lib/prompt.ts` known_issues/Fingerprint 주입 | 변경 없음 | **회귀 0 / PASS** |
| Line 2 | `CookMode` 핫픽스 핸들러 | `cook_runs.step_events` | 변경 없음 | **회귀 0 / PASS** |
| Line 3 | `CookMode` 종료 | `Postmortem` 진입 | 변경 없음 | **회귀 0 / PASS** |
| Line 4 | `Postmortem` 제출 | `save_cook_run` RPC | 변경 없음 | **회귀 0 / PASS** |
| Line 5 | Line 4 결과 → 다음 BUILD Line 1 | `buildContext.fetchBuildContext` | 변경 없음 | **회귀 0 / PASS** |
| Line 6 (FP 사이클) | `fingerprints` → FingerprintCard | 변경 없음 | **회귀 0 / PASS** |

### Line 1 BuildMode 측 호출부 회귀 점검

새 BuildMode의 `/api/recipe` 호출 (BuildMode.tsx submit 함수):
```ts
fetch("/api/recipe", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken.trim()}` },
  body: JSON.stringify({
    messages: nextMessages,    // 최대 8개 slice
    recipe_id: recipeId,
    current_state: recipeState,
    stage,
  }),
});
```

비교 대상 (`app/api/recipe/route.ts:RequestBodySchema`):
```ts
{
  messages: z.array(...).max(8),
  recipe_id: z.string().uuid().nullable(),
  current_state: RecipeStateSchema.nullable(),
  stage: StageSchema,
}
```

**4/4 필드 일치** + 길이 제약 일치 + 헤더 일치. 회귀 0.

---

## 경계면 비교

| 경계 | 송신 | 수신 | 일치 | 판정 |
|------|------|------|------|------|
| A: 시스템 프롬프트 ↔ Zod | `lib/prompt.ts` | `lib/schema` | 본 사이클 미변경 | **회귀 0** |
| B: API 응답 ↔ 클라 사용 | `/api/recipe` `200 { engineResponse, parsedAt }` | BuildMode `payload.engineResponse` (`isRecipeSuccessPayload` 가드) | YES (인터페이스 무손상) | **PASS** |
| C: Zod ↔ Supabase | 본 사이클 미변경 | 미변경 | — | **회귀 0** |
| D: StepEvent ↔ runtime.ts | 본 사이클 미변경 | 미변경 | — | **회귀 0** |
| E: Fingerprint traits ↔ 사용처 | 본 사이클 미변경 | 미변경 | — | **회귀 0** |

### 경계 B 상세 (새 UI ↔ 기존 API)

- 요청 body: `{ messages, recipe_id, current_state, stage }` — 변경 0
- 응답 success: `{ engineResponse: EngineResponse, parsedAt: string }` — 변경 0
- 응답 error: `{ error?, message? }` (401/400/429/502) — 변경 0
- BuildMode가 사용하는 응답 필드:
  - `engineResponse.message` — chat bubble 본문
  - `engineResponse.new_state` — `splitDiff(recipeState, new_state)` + 병합 → `onRecipeStateChange`
  - `engineResponse.stage` — `onStageChange`
  - `engineResponse.options` — 옵션 칩
  - `engineResponse.warnings` — Warnings 임베드
  - `engineResponse.change_log` — *미사용* (응답 계약상 존재하나 UI 비노출, 회귀 아님 — D-002의 `change_log`는 LLM 자율 영역)

`EngineResponseSchema` 정의된 6 필드 중 5 사용 + 1 미사용. 미사용 필드는 본 사이클 의도 — change_log는 응답 메시지 텍스트에 이미 자연어로 녹아 있다는 ENGINE.md §4 정신.

---

## D-008 게이트 재확인

> "이 기능을 떼어내도 다른 단계가 여전히 완전한가?"

- **데이터 용접 측면**: BuildMode UI 리디자인을 제거(이전 IDE 풍으로 되돌림)해도 Cook→Postmortem→RuntimeLog→Fingerprint→다음 BUILD 흐름은 그대로. UI 표면은 *데이터 용접*의 필수 입력이 아님.
- **§4 BLOCK 트리거**: 강제 규칙 3종 위반 0.
- **§1.3 정신적 용접**: 본 리디자인은 *대화로 합의*하는 §1.3 정신을 *UI에 복원*한다. 직전 IDE 풍이 정신을 *약화*했다면 본 사이클은 *복원*. 헌법 *위반* 아니라 *복원*.

**판정**: §4 BLOCK 위반 없음. PASS.

---

## D-002 의도 적용 검증

| D-002 원칙 | 본 사이클 적용 |
|------------|---------------|
| 생성(없던 필드 채워짐) = 산출물 카드 | `<ArtifactCard>` (name/concept/ingredients/tools/time_min), `<StepsCard>`, `<GaugesCard>` |
| 수정(있던 값 변경) = diff | `<ModifiedChips>` (modified 필드 칩 표시) |
| splitDiff가 created/modified 분리 | `setLastDiff(splitDiff(recipeState, new_state))` 호출 그대로, UI가 두 배열을 다른 컴포넌트로 분기 렌더 |

**판정**: D-002 정신이 코드 + UX 양쪽에서 작동.

---

## D-003 점진 빌드 시각화 검증

- STAGES 5단계 (concept→base→taste→steps→done) 배열 정의
- 현재 stage index 기준 done/active/pending 3 status 분기
- `.stage-pill.stage-done` (체크 ✓ + run 색), `.stage-active` (◎ + gold border), `.stage-pending` (○ + muted 색)
- pair-chef 메시지의 `engineResponse.stage` → `onStageChange` → 다음 빌드 호출 시 `stage` body 필드로 전달 → 백엔드 `lib/prompt.ts`가 stage별 TASTE 분기 (D-014)

**판정**: D-003 점진 빌드 UI 가시화 + D-014 stage 분기 연결 일관.

---

## D-003a 시그널 검증 (실제 분기는 P2)

- `INPUT_PLACEHOLDER = "답하거나, 칩을 탭하거나, '알아서 다 해줘'"`
- 사용자가 "알아서 다 해줘" 입력 시 → 일반 user 메시지로 전송 (백엔드 미분기)
- ROADMAP P2 진입 시 lib/prompt.ts 또는 라우트에서 키워드 감지 → 즉시 빌드 분기 추가 한 곳만 손대면 됨

**판정**: UI 시그널만 박힘. 실제 분기는 ROADMAP P2 합의 항목이라 정합.

---

## TASTE.md §1·§4 정합 검증

| TASTE 원칙 | 본 사이클 적용 |
|-----------|---------------|
| §1 맛 6축 (매운맛/짠맛/단맛/신맛/감칠맛/기름짐) | `TASTE_LABELS` 매핑 + `<GaugeGroup title="맛">` |
| §1 식감 5축 (바삭/부드러움/쫄깃/국물/걸쭉) | `TEXTURE_LABELS` 매핑 + `<GaugeGroup title="식감">` |
| §1 게이지는 *조절축* / 변화량이 직관적 | `.gauge-fill width: ${(v/10)*100}%` + 숫자 raw 값 표시 — 변화량 시각화는 modified-chip 보조 |
| §4 친구지 선생 톤 | `COLD_START_GREETING` 본문 — "냉장고에 뭐 있어? ... 같이 빌드해보자. ... 한 단계씩 갈게." |
| §4 칭찬 인플레이션 금지 | 클라 UI 자체 칭찬 0, 모든 칭찬은 LLM 책임 |

**판정**: TASTE §1·§4 정합. 신규 임의 판단 없음.

---

## P0 회귀 검증

| ID | 점검 항목 | 결과 |
|----|---------|------|
| A | `/api/*` rate limit | 라우트 변경 0 ✅ |
| B | `ANTHROPIC_API_KEY` 서버 격리 | 라우트 변경 0 ✅ |
| C | `lib/env.ts` server-only | 변경 0 ✅ |
| D | localStorage 금지 | BuildMode는 useState만, localStorage 사용 0 ✅ |
| E | SSOT | BuildMode 안 z.object 정의 0, `EngineResponse`/`RecipeState`/`Stage`/`Taste`/`Texture` 모두 `@/lib/schema` import ✅ |

---

## 자동 검증

- `npm run typecheck` → **exit 0**
- `npm test` → **6/6 PASS** (회귀 0)
- dev 서버 hot-reload 후 `curl http://127.0.0.1:3100/` SSR 마커 매치:
  - `stage-progress`, `stage-pill` ✅
  - `chat-scroll`, `chat-bubble`, `bubble-chef`, `bubble-text` ✅
  - `build-bench`, `build-input` ✅
  - cold-start 인사 본문 "냉장고에 뭐 있어" ✅
  - stage 라벨 "컨셉", "맛·식감" ✅

---

## 결함 목록

**없음.**

미세 메모:
- M-BR-1: 직전 IDE 풍 CSS 클래스 12종(compile-bench/compile-grid/prompt-surface/prompt-editor/compiler-output/state-inspector/output-line/artifact-list/diff-kind 외)이 dead. 별도 정리 사이클로 위임 — 본 사이클 범위 좁히기 위함 (R-BR-7).
- M-BR-2: `change_log` 응답 필드는 UI 비노출 (LLM 자율 영역, 메시지 텍스트에 녹아 있음). ENGINE.md §4 정합으로 의도된 동작.

---

## doc-taste-scribe에 인계 (BR.T4)

- **새 ADR 등재**: 
  - **D-021**: BUILD UX 표면 = 채팅+옵션 칩+임베드 카드/게이지. §1.3 / D-002 / D-003 UI 적용 사례. 직전 2026-06-18 키친 IDE 리디자인을 **SUPERSEDED** 처리 (D-002 메타포 함정 사례로 남김).
- **TASTE.md §6 신규 등재** (살아있는 문서 정신):
  - BUILD UX 톤 = 라이트 페이퍼 톤 + 따뜻한 황색(--gold) 강조. v3 다크 톤은 별도 사이클 결정.
- **MAP.md 갱신**:
  - `components/BuildMode.tsx` 본문 갱신 — IDE 풍 → 대화형 (D-021).
  - `app/globals.css` BUILD MODE 신규 토큰 40개 + dead 클래스 12종 메모.
- **SESSION.md 세션 5 신설**.
- **CLAUDE.md §9 변경 이력** 한 줄 추가.
- **ROADMAP.md**: 본 작업이 직접 매핑되는 P1/P2 항목 없음 — 헌법 정신 복원 작업. 메모만 남길지 검토.
