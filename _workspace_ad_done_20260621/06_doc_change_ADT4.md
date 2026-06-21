# AD.T4 문서 동기화 보고서

**일자**: 2026-06-21
**범위**: ADR D-022 + D-023 신규 등재 + D-001/D-002/D-021 결과 섹션 보강 + TASTE.md §6 보강 + 4 문서 갱신

## 신규 ADR 등재

| ADR | 제목 | 결정 요지 |
|-----|------|----------|
| **D-022** | 사용자 직접 수정 — RecipeState의 두 번째 출처 | RecipeState 값 출처 (a) LLM new_state / (b) 사용자 mutate. B+ 흐름(즉시 시각 mutate + user 메시지 자동 생성 + 다음 turn LLM 공식 처리). 본 사이클 편집 필드 4종(ingredients/tools/taste/texture). 사용자 본인 수정은 modified diff 미표시, stage 진행 미트리거. |
| **D-023** | 에디트 히스토리 — 클라 messages 무한 누적 + 1단계 undo | 클라 messages 무한 누적, 백엔드 wire는 slice(-8). 초기 진입 최근 4 assistant turn + "더 이전 보기" 펼침. prevSnapshot 1개로 1단계 undo. 영속은 ROADMAP P2 `recipe_versions` 이월. |

## 기존 ADR 결과 섹션 보강 (본문 무수정)

- **D-001 결과 보강**: "RecipeState 출처 2개 (2026-06-21 명시화, D-022 등재 동반)" — 한 단락. (a) LLM (b) 사용자 mutate. diff 계산은 여전히 코드. 본문 원칙 위반 0.
- **D-002 결과 보강**: "사용자 본인 수정 표시 정책" — 한 단락. modified diff는 LLM 응답 출처만. `splitDiff` 호출은 prev → LLM new_state 비교만.
- **D-021 결과 보강**: "임베드의 의미 확장" — 한 단락. 읽기 전용 → 인터랙티브로 확장 (GAD-2=A 범위 4필드). 비편집 필드는 그대로 읽기 전용. D-022가 mutate 흐름 SSOT.

## TASTE.md §6 보강

신규 하위 섹션 "사용자 직접 수정 — 자동 user 메시지 표현 (D-022 사이클 등재)":
- mutation 종류 3종(재료 삭제 / 도구 삭제 / 게이지 변경) 표 + 예시
- 원칙: 변화량 직관 표현, 짧고 평어, 향후 확장 패턴 명시
- 백엔드 systemPrompt 변경 없이 자연 처리. 시그널 강화는 다음 사이클.

## MAP.md 갱신

- 마지막 갱신: 2026-06-21 (세션 5) → 2026-06-21 (세션 6)
- `components/BuildMode.tsx` 본문 보강: "재작성(BR 사이클, D-021) + 보강(AD 사이클, D-022/D-023)" + 신규 모델/함수 명시
- DECISIONS.md ADR 범위: D-001~D-021 → D-001~D-023 (D-022/D-023 라인 추가, D-001/D-002/D-021 결과 보강 메모)
- 현재 상태 요약 섹션 재작성:
  - "고도화 사이클 1 완료 (2026-06-21 세션 6)" 신규 라인
  - 다음 큰 작업: 다른 고도화 축 / 비편집 필드 / 다중 undo / OpenAI+로그인(마지막)
  - 사용자 명시 우선순위 ("API/로그인은 마지막") 반영

## SESSION.md 세션 6 신설

최신이 위로. 동기 + 한 일 + 남은 제약 + 막힌 것 + 메모 5 섹션.
- 동기: 5축 중 ①·③ 첫 사이클 선택 + 사용자 명시 "API/로그인 마지막"
- 한 일: AD.T1~T4 4단 절차 요약
- 남은 제약: hand-test 권고 / 다른 고도화 축 / 비편집 필드 / mutation 시그널 강화 / 다중 undo·영속 / OpenAI+로그인 (마지막)
- 메모: B+ race 가드 / mutation 시그널 LLM 처리 / 데이터 용접 강제 규칙 무영향

## CLAUDE.md §9 갱신

2026-06-21 라인 추가:
> 고도화 사이클 1 — 사용자 직접 수정(D-022) + 에디트 히스토리(D-023). 임베드 인터랙티브 확장 + Mutation 모델 + B+ 흐름 + 1단계 undo. D-001/D-002/D-021 결과 섹션 보강. TASTE §6 mutation 표현 등재. welding-inspector AD.T3 PASS 결함 0. /api/recipe·schema 변경 0.

## ROADMAP.md

- 본 사이클 작업이 ROADMAP 체크박스에 직접 매핑되는 P1/P2 항목 *없음* — 본 작업은 *헌법 정신의 고도화*. ROADMAP 갱신 생략.
- P2 후보 *추가 등재 검토* (사용자 합의 시):
  - 다른 고도화 축 ②/④/⑤
  - 비편집 필드 편집 확장
  - 다중 undo / 영속 (`recipe_versions`)

## 본 사이클 산출물 (_workspace/)

| 파일 | 작성자 |
|------|--------|
| `_workspace/00_input/request.md` | 오케스트레이터 |
| `_workspace/02_welding_review_ADT1.md` | welding-architect 절차 (constitution-check 5단계) |
| `_workspace/02b_user_decision_ADT1.md` | 사용자 결정 — GAD-1=B+ / GAD-2=A / 나머지 권고 자동 채택 |
| `_workspace/05_ui_change_ADT2.md` | ui-builder 절차 |
| `_workspace/07_inspection_ADT3.md` | welding-inspector 절차 (weld-trace 5+1 라인 + 신설 서브 라인) |
| `_workspace/06_doc_change_ADT4.md` | 본 보고서 |

## 검증

- typecheck: PASS
- npm test: 6/6 PASS (회귀 0)
- welding-inspector AD.T3: 결함 0건
- /api/recipe 인터페이스: 변경 0
- schema: 변경 0
- 데이터 용접 5+1 라인: 회귀 0
