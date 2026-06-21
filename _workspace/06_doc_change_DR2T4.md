# DR2.T4 문서 동기화 보고서

## ADR 등재
**D-027 2-pane 레이아웃 — 임베드 공간 분리** (D-021 *구조* 재해석):
- 4-요소 공간 매핑: 채팅(좌) / stage-progress(상단 stretch) / 임베드 두 곳 분리(옵션칩+Warnings 좌 / 산출물+메타+ModifiedChips 우 sticky) / 모드 전환(헤더 버튼)
- pipeline-rail / runtime-inspector 제거 — 헤더 버튼 + 자동 진입으로 대체
- state 끌어올림 회피 — BuildMode가 두 영역 모두 렌더
- 빈 상태(idle) UX TASTE §4 친구 톤

## D-021 결과 섹션 추가 보강
*공간 분리* 단락 — 임베드 *층위*(D-024/D-025 의 메타/산출물 2층)는 유지하되 *위치*가 두 패널로 분리.

## MAP.md
- 마지막 갱신: 세션 8 → 세션 9
- DECISIONS.md ADR 범위: D-001~D-026 → D-001~D-027
- app/page.tsx 본문 갱신 (pipeline-rail/runtime-inspector 제거)
- components/BuildMode.tsx 본문 갱신 (풀 재작성, 2-pane, 신규 하위 컴포넌트)
- 현재 상태 요약에 *디자인 사이클 2 (DR2) 완료* 신규 라인

## SESSION.md 세션 9 신설

## CLAUDE.md §9 한 줄 추가

## 검증
- typecheck PASS
- 6/6 test PASS
- welding-inspector DR2.T3 결함 0
- SSR 마커 8종 PASS (build-canvas / chat-side / recipe-side / recipe-canvas / canvas-eyebrow / canvas-empty-msg / "RECIPE · 대기" / "왼쪽에서 대화로 시작...")
