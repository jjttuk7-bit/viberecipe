# PC.T1 헌법 사전 가드 — Plan 가시화 + Context 투명성

**검증 절차**: constitution-check 5단계
**일자**: 2026-06-21
**사용자 정책**: architect 권고 자동 채택 (NEED_USER_DECISION 회피, 위험 큰 결정만 묻기)

## 헌법 검증 결과
- **결정**: **PASS-with-recommendations** — 회색 영역 5건(GPC-1~5) 모두 architect 권고 자동 채택. 위험 큰 결정 없음.
- **검토 ADR**: D-001 / D-002 / D-003 / D-007 / D-008 / D-014 / D-021 / D-022 / D-023
- **충돌 내역**: 없음.
- **신규 ADR 후보**: **D-024** (Plan 가시화 SSOT) / **D-025** (Context 투명성 응답 wrapper)

## Step 1: §1 제품 철학

| 철학 | 본 사이클 적용 | 결과 |
|---|---|---|
| ① 요리는 런타임 | UX 메타 표시. Cook 흐름 영향 0 | PASS |
| ② 답변이 아니라 diff | Plan/Context 카드는 *상태 메타* 시각화. 채팅 본문 변화 없음 | PASS |
| ③ 한 턴에 한 단계 | Plan 가시화가 §1.3의 *직접 시각화* — 단계 진행이 *항상 보이는* 상태 | PASS (강화) |
| ④ 베끼려면 전부를 베껴야 | Context 메타 카드가 *해자의 결과*(known_issues/traits)를 사용자에게 환원 → D-007 가치 전달 강화 | PASS (강화) |

## Step 2: §4 용접 게이트

- 데이터 용접 5+1 라인: 본 사이클은 *읽기* 메타 노출만. 라우트는 응답 wrapper에 *서버가* `context_used`를 채움. LLM 응답 contract 무손상. 회귀 0.
- §4 강제 규칙 3종: BUILD 시 BuildContext 조회 → 이미 강제. 본 사이클은 그 *결과를 노출*만 → §4 정신 *강화*.
- "이 기능을 떼어내도 다른 단계가 여전히 완전한가?" — Y (메타 노출만). §4 BLOCK 트리거 위반 0.

**판정**: PASS. *데이터 흐름은 무손상* + *해자 가치의 사용자 환원* 강화.

## Step 3: §7 불변 결정 매핑

| ADR | 적용 시그널 | 결과 |
|-----|-----------|------|
| **D-001** | LLM 응답 contract 변경 0. `context_used`는 *서버가* 응답 wrapper에 추가 — LLM이 *생성*하지 않음 | 위반 0 |
| **D-002** | Plan 카드는 *상태 메타*. Context 카드는 *해자 메타*. 둘 다 임베드의 자연 확장 | 정합 |
| **D-003** | Plan 가시화가 *한 턴 한 단계*의 직접 시각화. stage별 *남은 결정* 노출 | 강화 |
| D-004 | 무관 | — |
| D-005 | timer_sec은 steps stage의 필수 필드 — Plan에 포함 | 정합 |
| D-006~D-008 | 데이터 용접 영향 0 | PASS |
| **D-007** | Context 메타가 *해자 자산*(fingerprint traits)을 사용자에게 환원 — D-019 가시화의 자연 확장 | 강화 |
| D-009 | Plan/Context UI 표현은 TASTE.md에 없는 판단 — 단 본 사이클은 *권고 자동 채택* 정책으로 진행 (architect 책임) | 정책 정합 |
| D-011~D-015 | 라우트 인증/rate limit 변경 0 | — |
| D-016~D-020 | Cook/Fingerprint 사이드 무관 | — |
| **D-021** | 4-요소 패턴 *확장* — 임베드 다음에 *상태 메타* 카드 추가. 결과 섹션 보강 필요 | 결과 보강 |
| D-022 | Plan 가시화 안에 *어떤 필드가 편집 가능*인지도 표시 가능 | 자연 통합 |
| D-023 | 무관 | — |

## Step 4: 데이터 영속

- localStorage 사용? **N**
- API 키 노출? **N**
- rate limit 누락? **N** (라우트 변경 0, wrapper만 보강)

---

## 회색 영역 결정 (architect 권고 자동 채택)

### GPC-1: stage별 "필수 필드" SSOT 위치

**채택**: 신규 모듈 `lib/stagePlan.ts`.
- `StagePlan` 타입: `{ stage: Stage, required: (keyof RecipeState)[], optional: (keyof RecipeState)[] }`
- `STAGE_PLANS: Record<Stage, StagePlan>` — 5 stage 모두 정의
- 클라/서버 어디서든 import 가능. `lib/schema`의 `RecipeStateSchema`를 type 차원에서 참조.

stage별 필수 필드 정의:
- `concept`: required `[name, concept]`
- `base`: required `[ingredients]`, optional `[tools, time_min]`
- `taste`: required `[taste]`, optional `[texture]`
- `steps`: required `[steps]`
- `done`: required `[name, concept, ingredients, taste, texture, tools, time_min, steps]` (full)

**이유**: lib/schema의 SSOT 정신 정합. lib/prompt.ts나 라우트가 *임의 재정의* 못 하게 단일 출처.

### GPC-2: Context 노출 방식

**채택**: 응답 wrapper에 `context_used` 메타 필드 추가. *서버가* 채움. LLM 응답 contract 변경 0.

응답 형식:
```ts
// 200 응답
{
  engineResponse: EngineResponse,  // 기존
  parsedAt: string,                 // 기존
  context_used: {                   // 신규
    cold_start: boolean,
    known_issues_count: number,
    traits_applied: Array<{ key: string; label: string; confidence: number }>
  }
}
```

**이유**: D-001 LLM 응답 contract 무손상 (`EngineResponseSchema` 변경 0). 서버가 `buildContext`에서 이미 들고 있는 정보를 *응답 wrapper에 노출만*. RequestBodySchema 영향 0.

### GPC-3: Plan/Context 카드 UI 위치

**채택**: `BuildMode` 패널 내 *2가지 카드를 임베드와 같은 층위에* 배치.
- StagePlanCard: 현재 stage의 required/optional 필드 + 각 필드의 *확정 여부* (체크 ✓ / 미정 ○)
- ContextMetaCard: cold_start 표시 + known_issues_count + traits_applied 칩들

배치: `<LatestEmbeds>` 안 또는 외부의 *최상단* (대화 흐름 위), 또는 *임베드 안*. **권고**: `<LatestEmbeds>` 시작 부분 (산출물 카드 직전). 사용자가 *대답*을 받기 전에 *현재 plan + 응답이 본 컨텍스트*를 먼저 본다.

**이유**: 페어 프로그래밍의 IDE plan/context 패널 메타포 — 위쪽에 위치.

### GPC-4: 신규 ADR

**채택**: D-024 (Plan 가시화) + D-025 (Context 투명성) 각각 등재. 통합 ADR 1개는 *서로 독립* 기능이라 부적합 (Plan은 frontend SSOT, Context는 라우트 응답 확장).

### GPC-5: cold_start UI 톤

**채택**: cold_start=true일 때 ContextMetaCard에 "이번이 첫 시작 — 학습된 컨텍스트 없음" 안내 (TASTE.md §4 친구 톤). traits_applied=[]일 때도 비슷하게.

---

## 잔존 위험 / 가드 (PC.T4 inspector 인계)

- **R-PC-1**: `stagePlan.ts`가 `lib/schema`의 RecipeState 타입과 *분리 정의*되면 SSOT 표류 위험. 권고: `keyof RecipeState`를 직접 import해서 컴파일러가 일치 강제.
- **R-PC-2**: 응답 wrapper 확장이 *과거 클라*(예: 캐싱된 fetch)와 호환 — 신규 필드 추가는 backward-compatible. 단 *클라가 신규 필드 의존*하면 신구 wrapper 응답 모두 처리 가능해야. `context_used`는 optional로 두고 *없으면 ContextMetaCard 미렌더* 정책.
- **R-PC-3**: `traits_applied` 노출 시 *fingerprint trait의 label*이 그대로 표시됨 — 사용자에게 부정 인식 가능성 ("타는 문제가 반복되는 편"). TASTE.md §4 톤 정합한가 → 본 사이클 *그대로 노출*. 다음 사이클에서 *완곡 표현* 검토.
- **R-PC-4**: 응답 wrapper에 메타 필드 추가 시 *서버의 BuildContext 조회 시점*과 *LLM 응답 도착 시점* 사이의 BuildContext 변경 가능성 — 본 사이클은 *최초 조회한 context*를 wrapper에 그대로 기록. 정합.
- **R-PC-5**: Plan 가시화의 필드 *확정 판정* 기준 — 본 사이클은 `recipeState[field] !== undefined`로 판정. taste 6축 중 일부만 채워진 부분 확정 케이스는 *taste 전체 객체 존재*로 판정 (Zod의 `optional()` 정의 활용). 부분 채움 시각화는 다음 사이클.

---

## 다음 에이전트에게 인계

- **schema 변경 필요**: **N** (lib/schema.ts 무변)
- **엔진 변경 필요**: **Y (경량)** — `app/api/recipe/route.ts`의 200 응답 wrapper에 `context_used` 객체 추가. `EngineResponseSchema`/`RequestBodySchema` 무변.
- **UI 변경 필요**: **Y** — `lib/stagePlan.ts` 신설, `components/BuildMode.tsx` 보강 (StagePlanCard + ContextMetaCard), `app/globals.css` 보강
- **TASTE 컨설팅 필요**: cold_start / traits_applied 안내 문구 — 본 사이클은 *클라 상수*로 박음, TASTE.md §6 보강
- **새 ADR 후보**: D-024 (Plan 가시화 SSOT) + D-025 (Context 투명성 응답 wrapper)
