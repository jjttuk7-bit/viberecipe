# PC.T5 문서 동기화 보고서

**일자**: 2026-06-21
**범위**: ADR D-024 + D-025 등재, D-021 결과 섹션 *임베드 2층위* 명시화, MAP/SESSION/CLAUDE.md §9 갱신

## ADR 등재

| ADR | 제목 | 결정 요지 |
|-----|------|----------|
| **D-024** | Plan 가시화 — stage별 필수/선택 필드 SSOT | `lib/stagePlan.ts` 신설. STAGE_PLANS 5 stage. `RecipeField = keyof RecipeState` 컴파일 결합. UI: StagePlanCard가 임베드 최상단에 합의 항목 + 확정/미정 표시. |
| **D-025** | Context 투명성 — /api/recipe 응답 wrapper에 context_used | 서버가 BuildContext 메타 변환 노출. EngineResponseSchema 변경 0. UI: ContextMetaCard가 cold_start + known_issues_count + traits_applied 칩 표시. cold_start UI 톤은 TASTE §4 친구. |

## D-021 결과 섹션 추가 보강

신규 단락 "임베드의 층위 확장":
- 4-요소 패턴 중 *임베드*는 두 층위로 분리:
  - (1) **상태 메타**: StagePlanCard(D-024) + ContextMetaCard(D-025)
  - (2) **산출물 메타**: ArtifactCard / GaugesCard / StepsCard / ModifiedChips / Warnings
- 옵션 칩은 응답 직접 작용 (임베드 끝).

## MAP.md 갱신

- 마지막 갱신: 2026-06-21 (세션 6) → 2026-06-21 (세션 7)
- 라이브러리 섹션: `lib/stagePlan.ts` 신설 라인 (D-024 SSOT 명시)
- 앱 섹션: `app/api/recipe/route.ts` 본문 보강 — 응답에 context_used 추가
- 컴포넌트 섹션: `components/BuildMode.tsx` 본문 — 임베드 2층위 + lastContext state + Snapshot 확장
- DECISIONS.md ADR 범위: D-001~D-023 → D-001~D-025
- 현재 상태 요약 섹션에 "고도화 사이클 2 완료 (2026-06-21 세션 7)" 신규 라인

## SESSION.md 세션 7 신설

최신이 위로. 동기 / 한 일 / 남은 제약 / 막힌 것 / 메모 5 섹션.
- 동기: ② + ④ 묶음, 사용자 명시 "API/로그인 마지막" 정책 유지
- 한 일: PC.T1~T5 5단 절차 요약. *권고 자동 채택* 정책 명시.
- 남은 제약: hand-test 권고 / R-PC-3 부정 표현 완곡화 / 부분 채움 시각화 / context_used를 /api/run에도 확장 / 다음 고도화 축들 / OpenAI+로그인(마지막)
- 메모: 권고 자동 채택 정책 / lib/stagePlan과 lib/prompt 목적 분리 SSOT 2개 / wrapper 패턴 /api/run에도 적용 가능

## CLAUDE.md §9 갱신

2026-06-21 라인 한 줄 추가:
> 고도화 사이클 2 — Plan 가시화(D-024) + Context 투명성(D-025). lib/stagePlan.ts 신설(stage별 required/optional 필드 SSOT, RecipeField=keyof RecipeState 컴파일 결합). /api/recipe 응답 wrapper에 context_used 추가. 임베드 최상단에 StagePlanCard + ContextMetaCard. D-021 결과 섹션에 임베드 2층위 명시화. welding-inspector PC.T4 PASS 결함 0.

## 본 사이클 산출물 (_workspace/)

| 파일 | 작성자 |
|------|--------|
| `_workspace/00_input/request.md` | 오케스트레이터 |
| `_workspace/02_welding_review_PCT1.md` | welding-architect 절차 (권고 자동 채택 정책) |
| `_workspace/04_engine_change_PCT2.md` | engine-builder 절차 |
| `_workspace/05_ui_change_PCT3.md` | ui-builder 절차 |
| `_workspace/07_inspection_PCT4.md` | welding-inspector 절차 (weld-trace 5+1 라인 + 신규 경계 F/G) |
| `_workspace/06_doc_change_PCT5.md` | 본 보고서 |

## 검증

- typecheck: PASS
- npm test: 6/6 PASS (회귀 0)
- welding-inspector PC.T4: 결함 0건
- /api/recipe 인터페이스: *요청* 변경 0, *응답에 context_used optional 필드 추가* — backward-compatible
- EngineResponseSchema / RequestBodySchema / lib/schema.ts 변경 0
- 데이터 용접 5+1 라인 회귀 0
