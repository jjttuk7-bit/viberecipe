# 작업 요청 — FingerprintCard 신설 (P1 마무리)

**일자**: 2026-06-20
**범위**: `components/FingerprintCard.tsx` 신설 — 부엌 지문 프로필 노출 (전환 비용 가시화).
**근거**: ROADMAP P1 마지막 항목.

## 헌법 컨텍스트
- CLAUDE.md §5 "취향 해자(TASTE)" — Fingerprint는 두 번째 DNA
- D-007 Fingerprint MVP 필수 (집단 지성은 P2)
- D-008 RuntimeLog/Fingerprint는 다음 BUILD에 주입되는 용접의 종착점이자 재시작점
- ROADMAP P1 표기: "부엌 지문 프로필 노출 (전환 비용)"

## 현재 상태 (관련 코드)
- `lib/fingerprint.ts`: `recomputeFingerprint(userId, runtimeLogs): Fingerprint` 구현됨
- `lib/schema.ts`: Fingerprint = { user_id, total_runs_all_recipes, traits[] }, Trait = { key, label, confidence, evidence_run_ids[] }
- `app/api/run/route.ts`: COOK 종료 시 Fingerprint 재계산 + RPC 저장 (응답 미반환)
- `app/api/recipe/route.ts`: BuildContext 내부에서 Fingerprint 조회 (응답에 노출 안 됨)
- `app/page.tsx`: `runtime-inspector` aside에 "부엌 지문 inspector" 자리만 있음 (현재는 메타 정보만 표시)
- 데이터 페치 경로 부재 — 현재 어떤 API도 Fingerprint를 클라에 반환하지 않음

## 작업 범위
1. UI 컴포넌트: `components/FingerprintCard.tsx` 신설
2. 데이터 페치 경로 합의 (신규 GET 라우트 vs 기존 라우트 응답 확장 vs 클라 직접 supabase)
3. `app/page.tsx` runtime-inspector 슬롯에 통합
4. Cold start(데이터 없음) UX 명시
5. 문서 동기화

## 비범위 (out of scope)
- 로그인 UI / 세션 영속 (D-015 P2 이월)
- recipe row 생성 API
- 집단 부엌 지성 (P3)
