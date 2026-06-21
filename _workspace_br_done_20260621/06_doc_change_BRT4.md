# BR.T4 문서 동기화 보고서

**일자**: 2026-06-21
**범위**: ADR D-021 등재 + 4 문서 동기화

## ADR 등재 (DECISIONS.md)

| ADR | 제목 | 결정 요지 |
|-----|------|----------|
| **D-021** | BUILD UX 표면 — 채팅 + 옵션 칩 + 임베드 카드/게이지 | BuildMode UI를 4-요소 패턴(채팅 인터페이스 + 5-stage progress + 임베드 산출물·게이지·스텝·수정 칩 + 옵션 칩)으로 SSOT. 직전 2026-06-18 IDE 풍 패턴 SUPERSEDED. D-002 메타포 함정 사례 학습 보존. |

핵심: 본 ADR은 *코드 + UX 양쪽의 §1.3/D-002/D-003 정신 복원*. 직전 사이클이 *코딩 메타포의 문법*(terminal-bar, compile-grid 등)을 화면에 박은 *문법 동일시 오류*를 사례로 명시.

## TASTE.md §6 신규 등재

신규 섹션 "UX 톤과 표면 (D-021 사이클 등재)":
- BUILD 화면 페어 셰프 톤 (cold-start 인사 문구 + 칩 vs 자유 텍스트 동일 경로)
- 디자인 톤 잠정 — 라이트 페이퍼 + 황색 강조 (GBR-1=B). v3 다크 톤 통일은 별도 사이클 결정.
- 코딩 메타포 *문법* 화면 박기 금지 원칙 명문화.

D-009 살아있는 문서 정신 정합 — 사용자 결정(GBR-1=B, GBR-2=A)을 원칙으로 일반화.

## MAP.md 갱신

- 마지막 갱신: 2026-06-20 → 2026-06-21
- `components/BuildMode.tsx` 본문 갱신: "재작성 (BR 사이클, D-021) ... 대화형 — pair-chef 채팅 버블 + 5-stage progress + 옵션 칩 + 임베드 ..."
- DECISIONS.md ADR 범위: D-001~D-020 → D-001~D-021 (D-021 라인 추가)
- 현재 상태 요약 섹션 갱신: BR 사이클 완료 표기 + 다음 큰 작업(P2)에 D-003a 실제 분기 / dead CSS 정리 / v3 다크 톤 통일 검토 추가

## SESSION.md 세션 5 신설

최신이 위로. 동기/한 일/남은 제약/막힌 것/메모 5 섹션. 동기에 사용자 스크린샷 경로 + 직전 사이클의 D-002 함정 명시.

## CLAUDE.md §9 변경 이력

2026-06-21 라인 한 줄 추가:
> BUILD 리디자인 — components/BuildMode.tsx 풀 재작성(채팅 + 5-stage progress + 옵션 칩 + 임베드 ArtifactCard/GaugesCard/StepsCard/ModifiedChips/Warnings), app/globals.css 신규 40+ 클래스, ADR D-021 등재(2026-06-18 IDE 풍 SUPERSEDED), TASTE.md §6 신규 등재. welding-inspector BR.T3 PASS 결함 0. /api/recipe 인터페이스 변경 0.

## ROADMAP.md

- 본 작업이 직접 매핑되는 P1/P2 항목은 *없음*. 헌법 *정신 복원* 작업이라 ROADMAP 체크박스 영향 0.
- P2 후보로 *추가 등재 검토*: D-003a 실제 분기 / dead CSS 정리 / v3 다크 톤 통일 — 사용자 합의 시 P2 항목으로 추가.
- 본 사이클은 ROADMAP 갱신 생략 (체크박스 0). SESSION.md / MAP.md의 *다음 큰 작업* 섹션에만 명시.

## 본 사이클 산출물 (_workspace/)

| 파일 | 작성자 |
|------|--------|
| `_workspace/00_input/request.md` | 오케스트레이터 |
| `_workspace/02_welding_review_BRT1.md` | welding-architect 절차 (constitution-check 5단계) |
| `_workspace/02b_user_decision_BRT1.md` | 사용자 결정 — GBR-1=B / GBR-2=A |
| `_workspace/05_ui_change_BRT2.md` | ui-builder 절차 |
| `_workspace/07_inspection_BRT3.md` | welding-inspector 절차 (weld-trace 5+1라인 + 5경계면) |
| `_workspace/06_doc_change_BRT4.md` | 본 보고서 |

## 검증

- typecheck: PASS
- npm test: 6/6 PASS (회귀 0)
- welding-inspector BR.T3: 결함 0건
- dev 서버 SSR 마커 9종 매치
