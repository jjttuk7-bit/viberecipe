# AD.T1b 사용자 결정

**일자**: 2026-06-21
**결정자**: 유케이 (architect 권고와 동일)

## GAD-1: 수정 흐름 → B+
- 즉시 시각 mutate + user 메시지 자동 생성
- §1.3 합의 정신 + 즉각 반응 동시 만족

## GAD-2: 편집 가능 필드 범위 → A
- ingredients + tools + taste + texture (4개)
- steps/concept/name/time_min은 다음 고도화 사이클

## GAD-3~7 (architect 권고 그대로 채택)
- GAD-3 게이지: +/- 버튼 (0~10 정수 step)
- GAD-4 히스토리: 클라 무한 누적, 초기 최근 4 assistant turn, "더 이전 보기" 펼침
- GAD-5 직전 되돌리기: 1단계, 클라 메모리 내
- GAD-6 사용자 수정의 modified diff 표시: 안 함
- GAD-7 stage 진행: 사용자 수정은 stage 변경 트리거 아님

## 자동 user 메시지 표현 (TASTE §4 친구 톤)
- 재료 삭제: `"재료에서 'X' 뺐어"`
- 재료 양 변경: `"X 양을 'A'에서 'B'로 바꿨어"`
- 매운맛 게이지: `"매운맛을 5에서 7로 올렸어"` / `"매운맛 5 → 7"` (5 → 7 짧은 형태도 가능)
- 도구 삭제: `"'X' 도구는 빼고 가자"`
- 도구 추가는 본 사이클 비범위 (사용자 자유 입력으로 자연 처리)

## D-022 / D-023 ADR (AD.T4에서 등재)
- D-022 사용자 직접 수정 — RecipeState의 두 번째 출처
- D-023 에디트 히스토리 — 클라 messages 누적 + RecipeState 스냅샷 1개

## 영향 받는 기존 ADR 결과 섹션 보강
- D-001: "RecipeState 출처 (a)/(b)" 명시
- D-002: "사용자 본인 수정은 modified diff 미표시" 명시
- D-021: "임베드의 의미 — 인터랙티브로 확장" 명시
