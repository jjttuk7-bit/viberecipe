# PC.T4 정합성 검증 — weld-trace 보고서

**검증 절차**: weld-trace 5+1 라인 + 5 경계면 + 신규 경계
**일자**: 2026-06-21
**최종 판정**: **PASS (결함 0건)**

---

## 트레이스한 용접 라인

| 라인 | 변경 | 판정 |
|------|------|------|
| Line 1 (`/api/recipe` → systemPrompt) | 라우트 [1]~[4] 동일. [5]에서 *응답 wrapper에 context_used 추가*만 (BuildContext 정보 변환 노출) | **회귀 0** |
| Line 2 (Cook 핫픽스) | 변경 없음 | **회귀 0** |
| Line 3 (Cook → Postmortem) | 변경 없음 | **회귀 0** |
| Line 4 (Postmortem → RPC) | 변경 없음 | **회귀 0** |
| Line 5 (Line 4 → 다음 Line 1) | 변경 없음 | **회귀 0** |
| Line 6 (Fingerprint 가시화) | FingerprintCard 변경 0. 단 본 사이클 ContextMetaCard가 *같은 fingerprint trait*를 BUILD 화면에서도 노출 — 보완 관계 | **회귀 0 / 강화** |

### Line 1 상세 회귀

`app/api/recipe/route.ts`의 [1]~[4] (rate limit / 요청 검증 / 인증 / BuildContext 조회)는 100% 동일. [5] 변경은 *응답 객체 마지막 줄 한 줄*:

```diff
  return withRateLimitHeaders(
    jsonResponse(200, {
      engineResponse,
      parsedAt: new Date().toISOString(),
+     context_used: {
+       cold_start: buildContext.cold_start,
+       known_issues_count: buildContext.runtime_log?.known_issues.length ?? 0,
+       traits_applied: buildContext.fingerprint?.traits.map(...) ?? [],
+     },
    }),
    gate,
  );
```

`buildContext`는 [4]에서 *이미* 조회된 객체. *추가 DB 조회 없음*. 부수 효과 0. callEngineWithRetry / EngineResponseSchema / D-004 재시도 흐름 무영향.

---

## 경계면 비교

| 경계 | 본 사이클 변경 | 판정 |
|------|--------------|------|
| A: 시스템 프롬프트 ↔ Zod | 변경 0 | **회귀 0** |
| B: API 응답 ↔ 클라 사용 | **확장**: 응답 wrapper에 context_used 추가. 클라가 optional로 처리 | **PASS** |
| C: Zod ↔ Supabase | 변경 0 | **회귀 0** |
| D: StepEvent ↔ runtime.ts | 변경 0 | **회귀 0** |
| E: Fingerprint traits ↔ 사용처 | **확장**: 기존(BuildContext → systemPrompt) + (BuildContext → 응답 wrapper → ContextMetaCard) 두 경로 모두 같은 `trait.{key,label,confidence}` 사용 | **PASS** |
| **F (신설): StagePlan ↔ RecipeState** | `lib/stagePlan.ts`의 `RecipeField = keyof RecipeState` — 컴파일러 강제 결합 | **PASS** |
| **G (신설): context_used wrapper ↔ ContextMetaCard** | 클라 타입 `ContextUsed` vs 서버 응답 객체 — 필드 4개(cold_start/known_issues_count/traits_applied[key,label,confidence]) 일치 | **PASS** |

### 경계 B 상세

서버 응답 (`route.ts:128-143`):
```ts
{
  engineResponse: EngineResponse,
  parsedAt: string,
  context_used: {
    cold_start: boolean,
    known_issues_count: number,
    traits_applied: Array<{ key: string; label: string; confidence: number }>,
  }
}
```

클라 타입 (`BuildMode.tsx`):
```ts
type ContextUsed = {
  cold_start: boolean;
  known_issues_count: number;
  traits_applied: Array<{ key: string; label: string; confidence: number }>;
};

type RecipeSuccessPayload = {
  engineResponse: EngineResponse;
  parsedAt?: string;
  context_used?: ContextUsed;  // optional — 과거 응답 호환
};
```

`isRecipeSuccessPayload` 가드는 여전히 `"engineResponse" in payload`로 통과. `parsedAt`/`context_used` optional — *없어도* success로 처리. **backward-compatible**.

### 경계 F 상세 (신설)

`lib/stagePlan.ts`:
```ts
import type { RecipeState, Stage } from "@/lib/schema";
export type RecipeField = keyof RecipeState;
export type StagePlan = {
  stage: Stage;
  required: RecipeField[];
  optional: RecipeField[];
};
```

`STAGE_PLANS`의 모든 필드는 `RecipeField` 타입 — `keyof RecipeState` 정의에 의해 schema 변경 시 *컴파일러 강제 갱신*. SSOT 표류 차단.

`FIELD_LABELS`도 `Record<RecipeField, string>` — 누락 필드 컴파일 에러.

### 경계 G 상세 (신설)

서버 traits 정보 출처: `lib/schema.TraitSchema` (`key`, `label`, `confidence`, `evidence_run_ids`). 본 사이클은 *evidence_run_ids 제외*하고 3 필드만 wrapper로 노출 (UI에서 evidence_run_ids 미사용). FingerprintCard와 보완 — D-019/D-020 정합.

---

## D-024 적용 검증

| D-024 결정 | 본 사이클 적용 |
|----------|---------------|
| 1. lib/stagePlan.ts 신설 SSOT | `STAGE_PLANS: Record<Stage, StagePlan>` 5 stage 모두 정의 |
| 2. RecipeField = keyof RecipeState 강제 | 컴파일 결합 |
| 3. FIELD_LABELS Record 전체 누락 컴파일 에러 | 8 필드 모두 라벨 정의 |
| 4. isFieldFilled로 확정 판정 | undefined / 빈 배열 모두 미확정 |
| 5. UI 표시 위치: 임베드 최상단 | LatestEmbeds 시작 부분 StagePlanCard |

**판정**: PASS.

## D-025 적용 검증

| D-025 결정 | 본 사이클 적용 |
|----------|---------------|
| 1. 응답 wrapper에 context_used 메타 추가 | `route.ts` 200 응답 객체에 신설 필드 |
| 2. 서버가 채움, LLM 응답 contract 변경 0 | EngineResponseSchema 무수정. buildContext 정보 변환 |
| 3. 4 메타 필드 (cold_start, known_issues_count, traits_applied[3]) | 모두 wrapper에 노출 |
| 4. 클라 optional 처리 | `context_used?: ContextUsed` + `{context ? ... : null}` |
| 5. cold_start UI 톤 | TASTE §4 친구 톤 — "이번이 첫 시작 — 학습된 컨텍스트 없음 (맹탕 모드)" |

**판정**: PASS.

---

## D-008 게이트 재확인

- Plan/Context 카드를 떼어내도 Cook→Postmortem→RuntimeLog→Fingerprint→다음 BUILD 흐름은 그대로. *데이터 용접*의 필수 입력 아님.
- 단 본 사이클은 *해자 가치의 사용자 환원* 강화 — D-007 정신의 자연 확장.
- §4 BLOCK 트리거 위반 0.

---

## P0 회귀 검증

| ID | 점검 항목 | 결과 |
|----|---------|------|
| A | `/api/*` rate limit | 변경 0 ✅ |
| B | API 키 격리 | 변경 0 ✅ |
| C | server-only | 변경 0 ✅ |
| D | localStorage 금지 | 변경 0 ✅ |
| E | SSOT | lib/stagePlan은 schema와 keyof 강제 결합 — SSOT 표류 0 ✅ |

---

## 자동 검증

- `npm run typecheck` → **exit 0**
- `npm test` → **6/6 PASS** (회귀 0)
- 라우트 응답 wrapper 확장 — 과거 클라와 backward-compatible

---

## 결함 목록

**없음.**

미세 메모:
- M-PC-1: ContextMetaCard의 traits_applied 칩이 *부정 표현*("타는 문제가 반복되는 편") 그대로 노출 — R-PC-3 그대로 명시. 다음 사이클에서 *완곡 표현* TASTE §6 보강 검토.
- M-PC-2: Plan 카드의 *부분 확정*(taste 6축 일부만 채움 등) 시각화는 본 사이클 비범위. 다음 사이클에서 `partial` status 도입 검토.
- M-PC-3: SSR 시점에 lastResponse=null이라 plan/context 카드도 미렌더 (R-AD-6 정합). hand-test는 *샘플 채우기* 또는 *첫 LLM 응답 후*에 가능.

---

## PC.T5 scribe 인계

- **새 ADR**:
  - **D-024** Plan 가시화 — lib/stagePlan.ts SSOT + StagePlanCard
  - **D-025** Context 투명성 — 응답 wrapper context_used + ContextMetaCard
- **D-021 결과 섹션 보강**: 4-요소 패턴 *확장* — 임베드 안 첫 두 카드는 *Plan + Context 메타*, 그 뒤가 산출물/게이지/스텝. 임베드 영역의 *층위*(메타 → 산출물)
- **MAP.md**: lib/stagePlan.ts 신설 라인 + BuildMode 본문 갱신 + ADR 범위 D-001~D-025
- **SESSION.md 세션 7** 신설
- **CLAUDE.md §9** 한 줄 추가
- **TASTE.md §6 보강 검토**: cold_start / 빈 컨텍스트 안내 문구의 톤 (선택)
