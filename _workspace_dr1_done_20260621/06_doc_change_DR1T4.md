# DR1.T4 문서 동기화 보고서

**일자**: 2026-06-21
**범위**: ADR D-026 등재 + TASTE.md §6 *확정* 보강 + MAP/SESSION/CLAUDE.md §9 갱신

## ADR 등재

**D-026 디자인 시스템 SSOT** — 색 5종 + 폰트 3종 + 마이크로 요소 정책. globals.css `:root`가 SSOT. 임의 hex 금지 (D-009 정합).
- 색 토큰: --paper #f4ead7 / --paper-soft #fcf3e4 / --ink #1a1a1a / --heat #d36b2c / --gold #b9872c + 신규 --accent-green #2a6d57 + --user-chip-bg/fg
- 폰트 토큰: --font-body(Pretendard chain) / --font-display(Newsreader chain) / --font-mono(JetBrains Mono chain)
- Newsreader / JetBrains Mono는 next/font/google. Pretendard는 시스템 fallback (정식 등록 다음 사이클)
- 마이크로 요소 규칙: 사용자 칩 검정/흰 / pair-chef "셰" 아바타 / 원형 주황 ↑ 전송 / 보조 액션 시그널 / 헤더 brand-line + autosave-pill + cook-mode-btn

## TASTE.md §6 보강 (*잠정 → 확정*)

기존 "디자인 톤 (잠정)" 단락 통합 재작성:
- "디자인 톤 (확정 — D-026 등재)"
- 색 5종 명시
- 폰트 3종 명시
- 원칙 4개 (코딩 메타포 문법 금지 / 문제 해결 패턴만 / SSOT 변수만 / 다크 톤은 별도 사이클)

## MAP.md 갱신

- 마지막 갱신: 세션 7 → 세션 8
- `app/layout.tsx` 본문 갱신 (next/font/google 등재)
- DECISIONS.md ADR 범위: D-001~D-025 → D-001~D-026
- 현재 상태 요약 섹션에 "디자인 사이클 1 (DR1) 완료" 신규 라인

## SESSION.md 세션 8 신설

최신이 위로. 동기 / 한 일 / 남은 제약 / 막힌 것 / 메모 5 섹션.
- 동기: 사용자 디자인 스크린샷 3종 + 분리 정책 (DR1/DR2/DR3)
- 한 일: DR1.T1~T4 4단 절차 + 권고 자동 채택
- 남은 제약: DR2 2-pane / DR3 cold-start / Pretendard 정식 등록 / dead CSS / 모바일 헤더 wrap / 다른 고도화 축 / OpenAI+로그인(마지막)

## CLAUDE.md §9 갱신

2026-06-21 라인 한 줄 추가 (디자인 사이클 1).

## 본 사이클 산출물 (_workspace/)

| 파일 | 작성자 |
|------|--------|
| `_workspace/00_input/request.md` | 오케스트레이터 |
| `_workspace/02_welding_review_DR1T1.md` | welding-architect (constitution-check 5단계, 권고 자동 채택) |
| `_workspace/05_ui_change_DR1T2.md` | ui-builder |
| `_workspace/07_inspection_DR1T3.md` | welding-inspector (weld-trace 5+1 라인 + 7 경계 회귀 0) |
| `_workspace/06_doc_change_DR1T4.md` | 본 보고서 |

## 검증

- typecheck: PASS
- npm test: 6/6 PASS (회귀 0)
- welding-inspector DR1.T3: 결함 0
- SSR 마커 9종 모두 매치 (brand-line, brand-dot, brand-name, autosave-pill, autosave-dot, cook-mode-btn, chef-avatar, send-btn, aux-chip, 텍스트 "vibe recipe", "자동 저장됨", "쿡 모드")
- /api/recipe·schema·EngineResponseSchema 변경 0
- 데이터 용접 5+1 라인 회귀 0
