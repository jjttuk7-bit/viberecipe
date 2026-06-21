# FP.T2 engine 변경 보고서

**일자**: 2026-06-20
**범위**: 신규 GET `/api/fingerprint` + fetch 헬퍼

## 신규 파일

| 파일 | 역할 |
|------|------|
| `lib/fingerprintStore.ts` | `fetchFingerprintForUser(userId): Promise<Fingerprint \| null>`. service-role 단건 조회. `FingerprintSchema.parse`로 jsonb 안전화. throw → 라우트의 1회 재시도 루프 |
| `app/api/fingerprint/route.ts` | GET 핸들러. `enforceRateLimit("fingerprint")` → `authenticateRequest` → `fetchFingerprintForUser` (D-013 패턴 1회 재시도 후 502) → `200 { fingerprint }` |

## 패턴 재사용 (변경 없음)

- D-011 — `enforceRateLimit("fingerprint")` 신규 버킷. `lib/ratelimit.ts`의 prefix 시스템이 그대로 동작(코드 변경 0).
- D-015 — `authenticateRequest` SSOT 재사용. 인증 통과 *후*에만 service-role 호출(R4 가드).
- D-013 — BuildContext 1회 재시도 후 502 패턴을 fetchFingerprintForUser에도 적용.

## SSOT 분리 근거

`lib/buildContext.ts`도 `fingerprints` 조회를 한다. 두 곳에 같은 SELECT가 박혀 보이나:

- `buildContext`는 runtime_logs + fingerprints **결합 조회** (BUILD 입력 묶음). 실패는 502, 데이터 없음은 cold_start=true.
- `fingerprintStore`는 단건 조회 + 단순 응답. 실패는 502, 데이터 없음은 null.

목적 / 응답 shape / 호출 빈도가 다르므로 *목적 분리 SSOT* 2개. D-019(FP.T5 등재 예정)가 본 함수를 클라 노출의 단일 출처로 명문화.

## 응답 계약

```ts
// 200
{ fingerprint: Fingerprint | null }  // null = 첫 사용자(cold-start), 502 아님

// 401
{ error: "missing_authorization" | "missing_token" | "invalid_token", message: string }

// 429
{ error: "rate_limited", retry_after_sec, message }

// 502
{ error: "fingerprint_fetch_failed", message: "부엌 지문을 불러오지 못했어요..." }
```

## 변경 안 한 파일

- `lib/schema.ts` — Fingerprint/Trait 스키마 그대로 사용. 변경 0.
- `lib/buildContext.ts` — BUILD 경로 SSOT. 본 변경은 표시 경로 별도 SSOT 신설. 기존 코드 영향 0.
- `app/api/recipe/route.ts` / `app/api/run/route.ts` — 무관. 변경 0.

## 잔존 위험 (FP.T4 inspector에게 인계)

- 본 라우트가 jsonb `traits`를 `FingerprintSchema.parse`로 안전화한다. 만약 DB에 schema 위반 데이터(예: 구버전 trait 구조)가 있으면 `parse` ZodError → 1회 재시도 → 502. 사용자 UX는 명확 (재시도 안내).
- `void FingerprintSchema` 보존 — 라우트가 import 사실을 컴파일러에 보존(SSOT 가시화).
