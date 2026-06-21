# 작업 요청 — BUILD 리디자인 (대화 UX 복원)

**일자**: 2026-06-21
**범위**: `components/BuildMode.tsx` 풀 리디자인 + `app/globals.css` 보강
**참조 자산**: v3 prototype 스크린샷 (`D:/projects/programs/draft/local_capture/dist/data/captures/20260621_060311_capture.png`)

## 헌법 근거 / 문제 의식
2026-06-18 키친 IDE 리디자인이 *코딩 메타포 문법 자체*(terminal-bar / compile-grid / commit/artifact rows)를 화면에 박았다. 이는 D-002가 경계하는 함정의 거꾸로 적용 — *메타포의 문법*은 가져왔지만 *그 문법이 풀던 문제*("페어 프로그래밍처럼 한 줄씩 합의하며 짓는다")는 UX에서 사라졌다.

v3 prototype은 이 *문제*를 정확히 풀고 있었다:
- pair-chef ↔ 사용자 대화 버블 (§1.3 + §2 plan mode)
- 사용자 답변 칩 (ENGINE.md `options` 1~3개)
- 산출물 카드(생성) 대화 안 임베드 (D-002)
- 게이지 시각화 대화 안 임베드 (TASTE §1)
- 상단 stage progress (`concept ✓ → base ✓ → taste(active) → steps → done`) (D-003)
- "답하거나, 칩을 탭하거나, '알아서 다 해줘'" 입력 (D-003a 탈출구)

## 작업 범위
1. `components/BuildMode.tsx` 풀 리디자인 — 대화 인터페이스로 복원
2. `app/globals.css` 보강 — 대화 버블 / 칩 / 임베드 카드 / 게이지 시각화 CSS 토큰
3. `app/page.tsx`는 BuildMode 호출부만 영향 — runtime-inspector / pipeline-rail / FingerprintCard 슬롯은 보존
4. 신규 ADR 후보: BUILD UX 표면 = 채팅+칩+임베드 패턴 (D-002 일반화 원칙의 UI 사례)

## 비범위 (out of scope)
- CookMode / Postmortem UX 재정렬 (별도 사이클)
- 로그인 UI / 세션 영속 (D-015 P2 이월)
- recipe row 생성/저장 API
- D-003a 즉시 빌드 *실제 분기 로직*은 ROADMAP P2 — 본 사이클은 UI 슬롯만
- 버전 타임라인 (state 3/4 드롭다운) — ROADMAP P2 `recipe_versions`

## 회색 영역 후보 (architect 정리 대상)
- 디자인 톤 — v3 다크/황색 vs 현재 라이트 페이퍼 톤 vs BUILD 패널만 다크
- 상단 stage progress UI — 기존 `pipeline-rail`(4-모드 전환)과 어떻게 공존
- "알아서 다 해줘" 칩 — 본 사이클에서 disabled vs 활성(P2 작업 분리)
- 헤더의 raw JWT/recipe_id 입력 — 채팅 UI와 어떻게 공존(MVP 작업용 디버그 패널로 격리?)

## 불변
- `/api/recipe` 요청/응답 계약 변경 0
- `lib/diff.ts:splitDiff` 호출 인터페이스 변경 0
- `lib/schema.ts` 변경 0
- FingerprintCard / CookMode / Postmortem 변경 0
- typecheck + npm test 회귀 0
