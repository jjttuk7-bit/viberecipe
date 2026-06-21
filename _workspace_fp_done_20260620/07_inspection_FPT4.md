# FP.T4 정합성 검증 — weld-trace 보고서

**검증 절차**: weld-trace 스킬 (5 라인 + 5 경계면 + cold-start + D-008 회귀)
**일자**: 2026-06-20
**최종 판정**: **PASS (결함 0건)**

---

## 트레이스한 용접 라인

| 라인 | 시작 | 종착 | 본 사이클 변경 | 판정 |
|------|------|------|--------------|------|
| Line 1 | `/api/recipe` 호출 | `lib/prompt.ts` known_issues/Fingerprint 주입 | 변경 없음 | **회귀 0 / PASS** |
| Line 2 | `CookMode` 핫픽스 핸들러 | `cook_runs.step_events` | 변경 없음 | **회귀 0 / PASS** |
| Line 3 | `CookMode` 종료 | `Postmortem` 진입 | 변경 없음 | **회귀 0 / PASS** |
| Line 4 | `Postmortem` 제출 | `save_cook_run` RPC (cook_runs + runtime_logs + fingerprints) | 변경 없음 | **회귀 0 / PASS** |
| Line 5 | Line 4 결과 → 다음 BUILD Line 1 | `buildContext.fetchBuildContext` | 변경 없음 | **회귀 0 / PASS** |
| **Line 6 (신설 가시화 가지)** | `fingerprints` 테이블 | `FingerprintCard` UI | 신규 | **PASS** |

### Line 6 (신설) 트레이스

```
fingerprints 테이블 (Supabase)
   │  service-role select (R4 통과 후)
   ▼
lib/fingerprintStore.ts:fetchFingerprintForUser
   │  FingerprintSchema.parse (jsonb 안전화)
   ▼
app/api/fingerprint/route.ts (GET)
   │  enforceRateLimit("fingerprint") → authenticateRequest → 200 { fingerprint }
   │  실패 → D-013 패턴 1회 재시도 → 502
   ▼
components/FingerprintCard.tsx (fetch + AbortController)
   │  state: idle | loading | ready | error
   ▼
사용자 시야 (runtime-inspector aside)
```

**Line 6 의 의미**: 데이터 *용접*의 필수 입력 아님(읽기 전용). 단 `Postmortem.onSaved` → `setFingerprintNonce((n)=>n+1)` → 카드 재페치 회로가 박혀, Line 4 직후 Line 6 이 자동 갱신된다. **용접 가시성**의 코드 강제.

---

## 경계면 비교

| 경계 | 송신 | 수신 | 일치 | 판정 |
|------|------|------|------|------|
| A: 시스템 프롬프트 ↔ Zod | `lib/prompt.ts` | `lib/schema.RecipeState` | 본 사이클 미변경 | **회귀 0** |
| B: API 응답 ↔ 클라 사용 | `app/api/fingerprint/route.ts` `200 { fingerprint: Fingerprint \| null }` | `FingerprintCard` `payload.fingerprint` (`isSuccessPayload` 가드) | **YES** | **PASS** |
| C: Zod ↔ Supabase | `FingerprintSchema { user_id, total_runs_all_recipes, traits[] }` | `fingerprints` 테이블 `user_id uuid PK / total_runs_all_recipes integer / traits jsonb` | **YES (3/3 컬럼 매핑, updated_at은 audit 컬럼)** | **PASS** |
| D: StepEvent ↔ runtime.ts | 본 사이클 미변경 | 미변경 | — | **회귀 0** |
| E: Fingerprint traits ↔ 사용처 | `lib/fingerprint.ts` `recomputeFingerprint` 출력 | (기존) `lib/prompt.ts` 주입 / (신규) `FingerprintCard` 표시 | **YES (key/label/confidence/evidence_run_ids 4 필드 모두 UI 도달)** | **PASS** |

### 경계 C 상세 (신설 SELECT)

`lib/fingerprintStore.ts:fetchFingerprintForUser` 의 SELECT:
```sql
select user_id, total_runs_all_recipes, traits from fingerprints where user_id = ? limit 1
```
- `user_id uuid PK` ↔ `UuidSchema` — match
- `total_runs_all_recipes integer not null default 0 check (>= 0)` ↔ `z.number().int().min(0)` — match
- `traits jsonb not null default '[]'::jsonb` ↔ `z.array(TraitSchema)` (jsonb → FingerprintSchema.parse 로 안전화) — match
- `updated_at timestamptz` (audit) ↔ 스키마 부재 — 정상 (audit-only 패턴)

### 경계 E 상세 (UI 도달 확인)

| `TraitSchema` 필드 | `FingerprintCard` 사용처 |
|--------------------|-------------------------|
| `key: string` | `<li key={trait.key}>` |
| `label: string` | `<div className="fp-trait-label">{trait.label}</div>` |
| `confidence: 0~1` | `Math.round(trait.confidence * 100) + "%"` (D-020) |
| `evidence_run_ids: uuid[]` | `증거: {trait.evidence_run_ids.length}회 조리` |

4/4 도달. 누락 0.

---

## D-019 SSOT 강제 — 클라 직접 supabase 호출 검증

`Grep("supabase|@supabase", components/**/*.tsx + app/**/*.tsx)` → 매치 3건:
- `app/api/fingerprint/route.ts` (서버 라우트 — 정상)
- `app/api/recipe/route.ts` (서버 라우트 — 정상)
- `app/api/run/route.ts` (서버 라우트 — 정상)

`components/*.tsx` 매치 0건, `app/page.tsx` 매치 0건 → **클라이언트 직접 supabase 호출 0건**. D-019 SSOT 강제 통과.

---

## D-015 인증 경계 회귀 점검

| 점검 항목 | 결과 |
|----------|------|
| `/api/fingerprint` 가 `authenticateRequest` 사용 | YES (route.ts:24) |
| service-role 호출 전 user_id 검증 완료 | YES (route.ts: authResult.userId 확정 후 [3] fetchFingerprintForUser 진입) |
| 토큰 부재/검증 실패 시 401 | YES (`authenticateRequest` 위임) |
| anon 클라 검증 후 service-role 호출 | YES (lib/auth.ts → fingerprintStore service-role) |

R4 가드 (cross-tenant) 통과.

---

## D-011 rate limit 강제 점검

| 점검 항목 | 결과 |
|----------|------|
| `enforceRateLimit("fingerprint")` 사용 | YES (route.ts:21) |
| 신규 prefix 가 `recipe`/`run` 과 분리됨 | YES (`viberecipe:fingerprint` prefix) |
| 429 응답에 `X-RateLimit-*` 헤더 부착 | YES (`enforceRateLimit` 위임) |

---

## D-013 502 패턴 회귀 점검

| 점검 항목 | 결과 |
|----------|------|
| 1차 fetch 실패 시 1회 재시도 | YES (route.ts:35-45) |
| 2차 실패 시 502 응답 | YES (`fingerprint_fetch_failed`) |
| 무한 루프 차단 | YES (정확히 2회) |
| 데이터 없음(첫 사용자) 은 502 아님 | YES (`null` 정상 응답) |

---

## cold-start 검증

| 시나리오 | 동작 |
|---------|------|
| authToken 부재 | `FingerprintCard` idle → "AUTH TOKEN을 입력하면..." 안내 |
| authToken 있음 + fingerprints row 없음 | 200 `{ fingerprint: null }` → `renderReady(null)` → "아직 부엌 지문이 없어..." cold-start 메시지 |
| authToken 있음 + row 있음 + traits=[] (totalRuns>0) | 메트릭 + "조리 기록은 쌓였지만 아직 뚜렷한 경향은 안 보여" 안내 |
| authToken 있음 + row 있음 + traits 있음 | 메트릭 + traits 목록 (label + confidence% + 증거 횟수) |
| 502 (조회 2회 실패) | error state → "부엌 지문을 불러오지 못했어요..." |

**모든 분기가 명시적 UX 텍스트로 처리됨.** §4 cold-start 정신 정합.

---

## D-008 게이트 재확인

> "이 기능을 떼어내도 다른 단계가 여전히 완전한가?"

- **데이터 용접 측면**: FingerprintCard 를 제거해도 Cook→Postmortem→RuntimeLog→Fingerprint→BUILD 흐름은 그대로. 카드는 *데이터 용접*의 필수 입력이 아니다.
- **§4 BLOCK 트리거**: 데이터 용접 강제 규칙 3종(BUILD 시작 시 조회 / 핫픽스 step_events 기록 / Postmortem 없이 종료 불가) 위반 0.
- **인식적 용접**: `refreshNonce` 회로로 Postmortem 저장 ↔ 카드 갱신이 코드 레벨에서 연결. D-007 가치 전달 구조가 박혀 있다 (제거 시 사용자가 자기 부엌 지문의 변화를 즉시 못 봄).

**판정**: §4 BLOCK 위반 없음. 데이터 용접의 *표시* 가지로 작동. PASS.

---

## P0 회귀 검증 (셸 부트스트랩 보호 항목)

| ID | 점검 항목 | 결과 |
|----|---------|------|
| A | `/api/*` rate limit | 신규 라우트도 적용 ✅ |
| B | `ANTHROPIC_API_KEY` 서버 격리 | 본 사이클 무관, 회귀 0 |
| C | `lib/env.ts` server-only | 신규 `fingerprintStore.ts` 도 `"server-only"` 선언 ✅ |
| D | localStorage 금지 | 컴포넌트는 fetch만, localStorage 사용 0 ✅ |
| E | SSOT (스키마 라우트 로컬 정의 0) | `route.ts` 안 z.object 신규 정의 0 — `FingerprintSchema` 만 import ✅ |

---

## 자동 검증

- `npm run typecheck` → **exit 0**
- `npm test` → **6/6 통과** (기존 단위 테스트 회귀 0)

---

## 결함 목록

**없음.**

미세 메모:
- M-FP-1: `void FingerprintSchema` 한 줄 보존 (route.ts:65). P1 첫 묶음의 `void BuildContextSchema` 패턴과 정합 — SSOT import 사실을 컴파일러에 보존. 의도된 마찰.

---

## doc-taste-scribe 에 인계 (FP.T5)

- 새 ADR 등재 2건:
  - **D-019**: Fingerprint 클라 노출 SSOT — `GET /api/fingerprint` + `lib/fingerprintStore.ts`. 클라 직접 supabase-js 조회 금지.
  - **D-020**: Fingerprint trait confidence 노출 형식 — 백분율 (D-017 단순 비율 공식 정합). TASTE.md §5 신규 원칙 등재.
- ROADMAP P1 마지막 항목 [x] 체크.
- MAP.md: 신규 `lib/fingerprintStore.ts` / `app/api/fingerprint/route.ts` / `components/FingerprintCard.tsx` 등재.
- SESSION.md 세션 4 / CLAUDE.md §9 변경 이력 한 줄 추가.
