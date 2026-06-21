# FP.T1b 사용자 결정 — 회색 영역 해소

**일자**: 2026-06-20
**결정자**: 유케이 (리더 권고와 동일)

## GFP-1: 데이터 페치 경로
- **채택**: **A** — 신규 `GET /api/fingerprint`
- **결과**: D-019 후보 등재 (Fingerprint 클라 노출은 GET /api/fingerprint SSOT, 클라 직접 supabase 조회 금지)
- **구현 인계**: engine-builder가 `app/api/fingerprint/route.ts` 신설. `enforceRateLimit("fingerprint")` + `authenticateRequest` + service-role로 단건 조회 + D-013 1회 재시도 후 502.

## GFP-3: confidence 노출 정밀도
- **채택**: **B** — 백분율 "75%"
- **결과**: D-020 후보 등재 (Fingerprint trait confidence 노출 형식 = 백분율, D-017 단순 비율 공식 정합). TASTE.md §5 신규 원칙 등재.
- **구현 인계**: ui-builder가 `Math.round(confidence * 100) + "%"` 형식으로 표시.

## GFP-2 (NEED_USER 아님)
- A (안내 문장 + 빈 메트릭) 권고 그대로 채택 — TASTE.md §4 톤 적용.

## 후속 가드
- R-FP-2: 신규 rate limit 버킷 `"fingerprint"` 추가. `lib/ratelimit.ts` 확장 필요 여부 확인.
- D-019/D-020은 FP.T5 doc 사이클에서 정식 등재.
