# PC.T3 UI 변경 보고서 — Plan 가시화 + Context 메타

**일자**: 2026-06-21
**범위**: `lib/stagePlan.ts` 신설 + `components/BuildMode.tsx` 보강 + `app/globals.css` 신규 클래스

## 신규 파일: `lib/stagePlan.ts` (D-024 SSOT)

`StagePlan` 타입 + `STAGE_PLANS: Record<Stage, StagePlan>`:
- `concept`: required `[name, concept]`
- `base`: required `[ingredients]`, optional `[tools, time_min]`
- `taste`: required `[taste]`, optional `[texture]`
- `steps`: required `[steps]`
- `done`: required *full 8필드*

추가:
- `FIELD_LABELS: Record<RecipeField, string>` — 사용자 친화 한글 라벨
- `isFieldFilled(state, field)` — `recipeState[field] !== undefined` (배열은 length > 0). 부분 채움은 *전체 객체 존재*로 확정.

SSOT 강제: `RecipeField = keyof RecipeState`로 컴파일러가 schema 변경 시 본 모듈 갱신 강제.

## BuildMode 보강

### 응답 wrapper 처리 (D-025)
```ts
type ContextUsed = {
  cold_start: boolean;
  known_issues_count: number;
  traits_applied: Array<{ key: string; label: string; confidence: number }>;
};

type RecipeSuccessPayload = {
  engineResponse: EngineResponse;
  parsedAt?: string;
  context_used?: ContextUsed;
};
```

- `lastContext: ContextUsed | null` state 추가
- submit 성공 시 `setLastContext(payload.context_used ?? null)`
- `Snapshot`에도 `lastContext` 포함 — undo로 복원

### LatestEmbeds 구조
임베드 최상단에 *두 메타 카드 먼저*:
```
<LatestEmbeds>
  <StagePlanCard stage={stage} recipeState={recipeState} />
  {context && <ContextMetaCard context={context} />}
  {showArtifact && <ArtifactCard ... />}
  {showGauges && <GaugesCard ... />}
  ...
</LatestEmbeds>
```

### StagePlanCard
- 헤더: "이번 단계 합의 항목" + `stage::{stage}`
- 리스트:
  - required 필드 → ✓ (filled) / ○ (empty), 한글 라벨 (재료 / 맛 / 스텝 …)
  - optional 필드 → 동일 + "선택" 배지
- 사용자가 *이 단계에서 무엇을 합의해야 하는지* 항상 보임

### ContextMetaCard
- 헤더: "이 응답이 참고한 것"
- 분기:
  - cold_start || (no issues && no traits) → 메타 empty 상태 메시지 (TASTE §4 톤)
  - 그 외: known_issues_count + traits_applied 칩 (label + confidence 백분율)
- 임베드의 *해자 가시화* 다음 단계 — D-019 FingerprintCard와 보완

## globals.css 신규 클래스

| 그룹 | 클래스 |
|------|--------|
| Plan | `.plan-card`, `.plan-head`, `.plan-title`, `.plan-stage`, `.plan-list`, `.plan-row`, `.plan-marker`, `.plan-label`, `.plan-optional`, `.plan-filled`, `.plan-empty`, `.plan-required`, `.plan-optional` (수식자) |
| Context | `.context-meta-card`, `.meta-head`, `.meta-title`, `.meta-empty`, `.meta-rows`, `.meta-row`, `.meta-label`, `.meta-val`, `.meta-trait-chips`, `.meta-trait-chip` |
| 모바일 | `.meta-row` 1열로 |

기존 토큰 재사용: `--paper`, `--panel`, `--line`, `--ink`, `--muted`, `--mono`, `--gold`, `--run`. 신규 색 도입 0.

## 헌법 매핑

| 헌법 / ADR | 적용 |
|------------|------|
| §1.3 한 턴 한 단계 | StagePlanCard가 *어디까지 합의했는지* 항상 시각화. 강화 |
| D-001 | LLM 응답 contract 변경 0. context_used는 *서버가* 응답 wrapper에 채움 |
| D-002 | 임베드 안 메타 카드 — 산출물/게이지/스텝과 다른 *상태 메타* 영역 |
| D-003 | STAGES 5단계 + STAGE_PLANS 필드 매핑 — 점진 빌드 시각화 강화 |
| D-007 | Fingerprint 가치 전달 강화 — *어떤 trait*이 이번 응답에 적용됐는지 명시 |
| D-008 용접 | 데이터 흐름 변경 0. *해자의 결과*를 사용자에 환원 |
| D-014 stage TASTE 분기 | lib/prompt.ts와 lib/stagePlan은 *목적 분리 SSOT 2개* — 시스템 프롬프트와 UI plan 정의가 같은 stage 개념을 별도 활용 |
| D-020 confidence 백분율 | meta-trait-chip의 `Math.round(c * 100) + "%"` — D-020 정합 |
| D-021 | 임베드 4-요소 패턴 *확장* — 산출물 카드 앞에 두 메타 카드 |
| D-022/D-023 | 무영향 — 사용자 mutation/undo 흐름 그대로 |

## 잔존 위험 (PC.T4 inspector 인계)

- **R-PC-1 해소**: `lib/stagePlan.ts`가 `keyof RecipeState`로 schema와 컴파일 결합. SSOT 표류 강제 차단.
- **R-PC-2 해소**: `context_used`는 optional 필드. 무이면 ContextMetaCard 미렌더 (`{context ? <ContextMetaCard ... /> : null}`).
- **R-PC-3**: traits_applied의 label이 부정 표현일 수 있음 — 본 사이클 그대로 노출. 다음 사이클에서 완곡 표현 검토 (TASTE §6 후속).
- **R-PC-4**: 서버는 BuildContext 최초 조회 시점 정보 그대로 wrapper에 기록 — D-013 1회 재시도 영향 없음.
- **R-PC-5 해소**: 부분 채움(taste 6축 중 일부만)은 *taste 객체 존재*로 filled 판정. 부분 시각화는 다음 사이클.

## 자동 검증
- `npm run typecheck` → **PASS** (exit 0)
- `npm test` → **6/6 PASS** (회귀 0)
- SSR: 초기 진입은 `lastResponse=null` → LatestEmbeds 미렌더 → plan/context 카드도 미렌더 (의도된 동작 R-AD-6 정합)
