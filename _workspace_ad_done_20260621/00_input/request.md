# 작업 요청 — 고도화 사이클 1: 사용자 직접 수정 + 에디트 히스토리 (①·③)

**일자**: 2026-06-21
**범위 키워드**: "진짜 바이브 코딩처럼 작동하는 수준 높은 설계로의 고도화"

## 동기 (사용자 직역)
> "다른 작업인 진짜 바이브 코딩처럼 바이브 레시피가 작동되고 수준이 높은 진행이 가능한 설계로의 고도화... api나 로그인은 마지막에 해도 돼"

페어 프로그래밍의 핵심은 *사용자가 주도하면 LLM이 합의*하는 양방향 흐름. 현재 BUILD는 LLM 단방향(`engineResponse.new_state` → 클라 mutate). 사용자가 *직접* 손을 댈 수 없다 — 임베드 카드는 모두 *읽기 전용*. 또 messages 8턴 슬라이스 후 *이전 합의*는 사라져 사용자가 "어디까지 왔는지" 못 본다.

## 본 사이클 범위 (사용자 합의: 5축 중 ①·③)

### ① 사용자 직접 수정 (편집 가능 임베드)
- 임베드 카드(재료/게이지/스텝/도구/시간/concept/name)를 *부분적*으로 사용자가 직접 수정/삭제 가능하게.
- 수정 흐름의 *의미*가 헌법 차원 결정 (D-022 후보):
  - **A 직접 패치**: 클라가 즉시 RecipeState를 mutate. user 메시지 없음. LLM은 다음 turn에서 변경 인지.
  - **B 메시지 우회**: 수정 = "재료에서 X 뺐어" user 메시지 자동 생성 → 다음 fetch에서 LLM이 처리.
  - **C 혼합**: 클라 즉시 mutate + user 메시지 자동 추가.
- D-001 ("LLM이 new_state, 코드가 diff") 재해석 필요 — 이제 *사용자도* new_state 생성 가능한가.

### ③ 에디트 히스토리 (직전 되돌리기 + 더 보기)
- 클라 messages 무한 누적 (백엔드 호출은 여전히 8턴 슬라이스 — ENGINE.md §3 정합).
- "더 이전 보기" 펼치기 UI — 사용자가 *이전 합의*를 다시 확인.
- "직전으로 돌리기" 1단계 — RecipeState 스냅샷 + lastDiff 되돌림. 클라 메모리 내.
- 영속 저장(`recipe_versions` 테이블)은 ROADMAP P2 항목, 본 사이클 비범위.

## 헌법 영향 (architect 정리 필요)

신규 ADR 후보:
- **D-022**: 사용자 직접 수정 — RecipeState mutate의 두 번째 출처
- **D-023**: 에디트 히스토리 — 클라 messages 누적 + RecipeState 스냅샷

영향 받을 가능성 있는 기존 ADR:
- D-001: 결과 섹션에 사용자 패치 케이스 추가 명시
- D-002: 사용자 직접 수정도 *수정*인가 → modified diff 표시 여부
- D-003 / D-014: 사용자가 *stage 진행 없이* 임의 필드를 수정할 때 stage state 보존 방식
- D-021: 임베드 카드가 인터랙티브해지면 4-요소 패턴 (채팅+stage+임베드+옵션) 중 임베드의 의미 확장

## 비범위
- OpenAI 전환 / 로그인 베이스 인증 (사용자 명시: "마지막에")
- `recipe_versions` 영속 저장
- 다른 고도화 축 ② Plan 가시화 / ④ Context 투명성 / ⑤ Slash command — 별도 사이클
- Cook/Postmortem 인터랙티브화

## 회색 영역 후보 (architect 정리 대상)
- **GAD-1 수정 흐름의 의미**: A 직접 패치 vs B 메시지 우회 vs C 혼합
- **GAD-2 편집 가능 필드 범위**: name/concept/ingredients/taste/texture/tools/time_min/steps 중 본 사이클 어디까지
- **GAD-3 게이지 수정 UI**: 드래그 vs +/- 버튼 vs 인라인 숫자
- **GAD-4 에디트 히스토리 표시 방식**: 무한 스크롤 vs "더 이전 보기" 펼침 vs 사이드 패널
- **GAD-5 직전 되돌리기 단계 수**: 1단계만 vs N단계 vs 무제한
- **GAD-6 수정의 *수정 여부 표시***: D-002 modified diff를 사용자 수정에도 적용? (보통은 *내가 했으니* 표시 불필요)
- **GAD-7 stage 진행**: 사용자가 *재료만* 수정하고 다시 LLM 응답을 받으면 stage는 어디로? (현재 stage 유지 vs 재평가)

## 불변
- `/api/recipe` 요청/응답 *계약* 변경 0 (단 messages 배열 내 *사용자 자동 user 메시지*가 늘어날 수는 있음 — GAD-1 B/C 선택 시)
- `lib/schema.ts` RecipeState 스키마 변경 0
- `lib/diff.ts:splitDiff` 인터페이스 변경 0
- CookMode/Postmortem/FingerprintCard 변경 0
- typecheck + npm test 회귀 0
