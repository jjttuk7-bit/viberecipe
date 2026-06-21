# 작업 요청 — 고도화 사이클 2: Plan 가시화 + Context 투명성 (②+④)

**일자**: 2026-06-21
**선언**: 사용자 "진 진행" — architect 권고 자동 채택, 사용자 추가 결정 묻지 않음. 결과 보고 후 조정 요청 가능.

## 동기
페어 프로그래밍의 두 가지 *수준 높음* 축:
- **② Plan 가시화**: stage 안에서 *확정 vs 미정*이 명시. 사용자가 *어디까지 합의했고 어디가 남았는지* 항상 본다. Claude Code TaskList 메타포.
- **④ Context 투명성**: 응답이 *왜* 이 방향으로 왔는지 보임. known_issues / fingerprint traits / cold_start가 *해자의 결과*인데 백엔드만 알고 사용자는 모름 → "전환 비용 가시화"의 다음 단계.

## 본 사이클 범위

### ② Plan 가시화
- 각 stage의 *필수 필드 명세* SSOT — 새 모듈 `lib/stagePlan.ts`
- BuildMode에 "stage plan" 미니 카드 — 현재 stage의 필드 *확정/미정* 표시
- 사용자가 *바로 어디로 갈지* 알 수 있음

### ④ Context 투명성
- `/api/recipe` 응답 wrapper에 `context_used` 메타 필드 추가 — *서버가 채움*, LLM 응답 contract 변경 0
- 형식: `{ cold_start, known_issues_count, traits_applied }`
- BuildMode에 작은 컨텍스트 메타 카드 — 대화 상단 또는 stage progress 옆

## 헌법 영향
- 신규 ADR 후보: **D-024** (Plan 가시화 — stage별 필수 필드 SSOT) / **D-025** (Context 투명성 — 응답 wrapper)
- 기존 ADR 영향:
  - D-001/EngineResponseSchema: **변경 0** (LLM 응답 contract 무손상)
  - D-021 결과 섹션 보강: 4-요소 패턴에 *Plan 가시화 카드* + *Context 메타 카드* 추가 또는 임베드 확장
  - D-014 (TASTE stage 분기): 영향 없음 (시스템 프롬프트는 동일)

## 비범위
- D-022 비편집 필드 확장 (name/concept/steps/time_min) — 다른 사이클
- D-023 다중 undo / 영속 — 다른 사이클
- ⑤ Slash command — 다른 사이클
- OpenAI 전환 / 로그인 — 사용자 명시 "마지막"

## architect 권고 자동 채택 정책
이 사이클은 사용자가 *빠른 진행*을 명시. architect가 회색 영역을 정리하되 *모든 권고 자동 채택* — NEED_USER_DECISION 없음. 결과 보고 시 사용자가 조정 요청 가능. 위험 큰 결정(D-001 등 핵심 ADR 영향)이 있으면 그때만 묻기.

## 불변
- LLM 응답 contract (`EngineResponseSchema`) 변경 0
- `RequestBodySchema` 변경 0
- `lib/schema.ts` 변경 0
- 데이터 용접 5+1 라인 회귀 0
- typecheck + npm test 회귀 0
