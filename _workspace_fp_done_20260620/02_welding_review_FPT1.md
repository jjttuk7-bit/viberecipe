# FP.T1 헌법 사전 가드 — FingerprintCard 신설

**검증 절차**: constitution-check 스킬 5단계 (CLAUDE.md §1 → §4 → §7 → 데이터 영속 → 결정)
**일자**: 2026-06-20

---

## 헌법 검증 결과

- **결정**: **NEED_USER_DECISION** (회색 영역 2건 — GFP-1 데이터 페치 경로 / GFP-3 confidence 노출 정밀도)
- **검토 ADR**: D-007, D-008, D-009, D-015, D-017
- **충돌 내역**: 없음 (모든 후보가 헌법 안). 단 두 회색 영역에서 D-009(임의 결정 금지) 회피를 위해 사용자 확인 필요.
- **재설계 권고**: GFP-1·GFP-3 사용자 결정 후 PASS-with-conditions로 전환.

---

## Step 1: §1 제품 철학 검증

| 철학 | 적용 | 결과 |
|---|---|---|
| ①요리는 런타임 | Fingerprint는 여러 CookRun의 누적 → 런타임 결과의 환원 | PASS |
| ②답변이 아니라 diff | 컴포넌트는 상태 표시(읽기 전용). diff 영역 아님 | N/A |
| ③한 턴에 한 단계 | UI 컴포넌트 단일 추가, 점진 빌드 영향 없음 | N/A |
| ④베끼려면 전부를 베껴야 | Fingerprint 데이터 자체가 D-008 용접의 산출물. UI는 그 가시화 | PASS |

## Step 2: §4 용접 구조 테스트 — 핵심 게이트

> "이 기능을 떼어내도 다른 단계가 여전히 완전한가?"

- **데이터 용접 측면**: FingerprintCard를 떼어내도 Cook→Postmortem→RuntimeLog→Fingerprint→BUILD 주입 흐름은 코드 레벨에서 그대로 작동. 즉 카드는 *데이터 용접*의 필수 입력이 아니다.
- **§4 강제 규칙 3종 점검**:
  - BUILD 시작 시 RuntimeLog/Fingerprint 조회 → 이미 `lib/buildContext.ts`가 강제. 카드 신설은 무관.
  - COOK 핫픽스가 step_events에 기록 → 무관.
  - POSTMORTEM 없이 COOK 종료 불가 → 무관.
- **카드의 의미**: ROADMAP "전환 비용 가시화"는 *심리적 lock-in*이지 *데이터 용접*이 아니다. §4의 BLOCK 트리거는 데이터 용접만 다룬다 → **카드는 §4 게이트에 걸리지 않음**.
- **§5 TASTE 해자 정합**: D-007("Fingerprint MVP 필수")은 데이터 모델 포함을 강제하지만 UI 노출까지는 미명시. 그러나 노출 없이는 사용자가 해자 자산을 인지 못 함 → MVP 가치 전달 누락. UI 노출은 D-007 정신의 자연스러운 확장.

**판정**: 게이트 위반 없음. PASS.

## Step 3: §7 불변 결정 (D-001~D-018) 매핑

| ADR | 적용 시그널 | 결과 |
|-----|-----------|------|
| D-001 LLM diff | LLM 미사용 | N/A |
| D-002 splitDiff | 생성/수정 분리 미적용 (단순 표시) | N/A |
| D-003 점진 빌드 | UI 추가, 빌드 파이프라인 무관 | N/A |
| D-004 자동 재시도 | API 호출 시 502 처리 — D-013 패턴 재사용 권고 | **적용** |
| D-005 timer_sec | 무관 | N/A |
| D-006 핫픽스 격리 | 무관 | N/A |
| **D-007 Fingerprint MVP** | UI 노출이 MVP 가치 전달 | **PASS — 정신적 정합** |
| **D-008 용접 게이트** | 데이터 용접의 필수 입력 아님(위 Step 2) | 위반 없음 |
| **D-009 임의 결정 금지** | 노출 정밀도/형식은 TASTE.md에 없는 도메인 판단 | **NEED_USER_DECISION 트리거** |
| D-010 공급/반직관적 | 무관 | N/A |
| D-011 풀셸 | 새 라우트 신설 시 ratelimit 패턴 재사용 | 적용 |
| D-013 BuildContext 502 | 새 GET 라우트 채택 시 1회 재시도 후 502 패턴 재사용 | **권고** |
| **D-015 인증 경계** | Bearer JWT → anon 검증 → service-role 조회. `authenticateRequest` 재사용 강제 | **적용 강제** |
| D-016 hotfix 카테고리 | 무관 | N/A |
| **D-017 confidence 공식** | 0.6~1.0 범위, 소수 둘째 자리. 노출 정밀도 결정에 직접 영향 | **적용** |
| D-018 timer 알림 | 무관 | N/A |

## Step 4: 데이터 영속 검증

- localStorage 사용? → **N** (Supabase fingerprints 테이블에서만 조회)
- API 키 클라이언트 노출 위험? → **N** (단 GFP-1 후보 C 채택 시 supabase anon URL/key를 클라에 노출해야 함 → 정책 검토 트리거)
- `/api/*` rate limit 누락? → 새 GET 라우트 신설 시 `enforceRateLimit("fingerprint")` 적용 필수

---

## 회색 영역 결정 후보

### GFP-1: 데이터 페치 경로

| 후보 | 설명 | 헌법 정합 | 권고 |
|------|------|----------|------|
| **A** | 신규 `GET /api/fingerprint` 라우트. Bearer JWT → `authenticateRequest` → service-role로 `fingerprints` 단건 조회 → 응답. | D-015 SSOT / D-011 rate limit / D-013 502 패턴 모두 재사용 | **★ 권고** |
| B | `/api/recipe` 또는 `/api/run` 응답에 Fingerprint 추가 | SSOT 어긋남 — BUILD/COOK 동작과 표시 의도가 같은 응답에 섞임. 표시만 보고 싶을 때(예: 첫 진입) 호출할 수 없음 | 비권고 |
| C | 클라가 `@supabase/supabase-js` anon으로 직접 조회 | D-015 위반 — anon 클라 검증을 클라에 분산 + RLS 단독 의존. 클라 번들에 anon URL/key 노출 필요 | **비권고 (헌법 약화)** |

**architect 권고**: **A**. P1 첫 묶음에서 확립한 인증·rate limit·502 패턴을 그대로 재사용해 ADR 표류 0건. 응답 shape는 `{ fingerprint: Fingerprint | null }` (null=데이터 없음). BuildContext의 `cold_start` 필드는 *BUILD 입력 묶음*용이라 단순 조회 응답에는 도입 안 함.

### GFP-2: cold-start UX (데이터 없음 표시)

| 후보 | 설명 | TASTE 정합 |
|------|------|----------|
| **A** | "아직 부엌 지문이 없어. 한 번 요리하고 기록하면 쌓이기 시작해" 같은 안내 문장 + 빈 메트릭 | TASTE.md §4 "친구지 선생이 아니다" 톤 정합 |
| B | 메트릭만 `0` 표시 + traits 영역 비움 | 정보는 정확하나 *전환 비용 가시화* 의도 약화 |

**architect 권고**: **A**. 이것이 ROADMAP "전환 비용 가시화"의 cold-start 표현. *D-009 임의 결정 영역 진입하지 않음* — TASTE.md §4 톤 가이드 적용으로 충분. (NEED_USER 항목 아님)

### GFP-3: confidence 노출 정밀도

| 후보 | 표현 | 함정/장점 |
|------|------|----------|
| A | 정확한 수치 "0.75" | 사용자가 *과학적 정확성* 기대 → "왜 50% 미만은 안 보이지?"식 표현 함정 |
| **B** | 백분율 "75%" | A보다 직관적. D-017 단순 비율 공식과 자연 일치 |
| C | 명목 등급 "강함/중간/약함" 3단 | 함정 최소. 단 3단 컷오프(0.6~0.75 / 0.75~0.9 / 0.9~1.0?)가 또 TASTE 판단 필요 |
| D | 백분율 + 단순 게이지 바 | B + 시각적 강도. confidence 0.6=60% 시작이 *그래프상* 어색할 수 있음 |

**architect 권고 (참고)**: **B**. D-017 공식 단순성과 일치 + 사용자에 직관적 + 추가 cutoff 결정 없음. 단 이것은 **D-009 영역**(TASTE.md에 없는 도메인 판단) — *임의 채택 금지*. 사용자 결정 필요.

---

## 용접 다이어그램

```
┌────────────────────────────────────────────────────────────┐
│ 기존 용접 (변경 없음)                                       │
│ Cook ─→ Postmortem ─→ /api/run RPC ─→ runtime_logs        │
│                                          │                  │
│                                          ▼                  │
│                                   recomputeFingerprint     │
│                                          │                  │
│                                          ▼                  │
│                                   fingerprints 테이블       │
│                                          │                  │
│                                          ▼                  │
│                                   fetchBuildContext        │
│                                          │                  │
│                                          ▼                  │
│                                   다음 BUILD systemPrompt   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 신설 가지 (FP.T2 + FP.T3)                                   │
│ fingerprints 테이블                                         │
│         │                                                   │
│         ▼                                                   │
│ GET /api/fingerprint (신설, GFP-1=A 권고)                   │
│         │                                                   │
│         ▼                                                   │
│ FingerprintCard (신설, app/page.tsx runtime-inspector 슬롯) │
└────────────────────────────────────────────────────────────┘
```

- **입력 데이터**: 인증된 사용자의 `fingerprints` row (없으면 null)
- **송신 → 수신**: Supabase → 신규 GET 라우트 → 클라 컴포넌트
- **다음 단계의 *데이터* 필수 입력으로 작동?**: N (표시 전용)
- **cold-start 케이스 처리 명시?**: Y (GFP-2 권고 A — TASTE.md §4 톤 적용)

**§4 용접 의미 메모**: 본 카드는 *데이터 용접*의 필수 노드가 아니라 *사용자 인식의 가시화* — D-007 Fingerprint MVP 가치 전달의 자연 확장. D-008 게이트 위반 아님.

---

## 다음 에이전트에게 인계

- **schema 변경 필요**: **N** — `FingerprintSchema`/`TraitSchema` 그대로 사용. 응답 shape `{ fingerprint: Fingerprint | null }`는 라우트 로컬 z.object로 충분(또는 미정의도 OK — 명시화 권고).
- **엔진 변경 필요**: **Y (GFP-1=A 채택 시)**
  - 신설 `app/api/fingerprint/route.ts` — GET 핸들러
  - 패턴 재사용: `enforceRateLimit("fingerprint")` → `authenticateRequest` → service-role로 `fingerprints` 단건 조회 → `FingerprintSchema.safeParse` → 응답
  - 실패 시 D-013 1회 재시도 후 502 패턴 적용 권고
- **UI 변경 필요**: **Y**
  - 신설 `components/FingerprintCard.tsx` — Fingerprint 표시 (total_runs, traits, cold-start 안내)
  - `app/page.tsx` runtime-inspector aside에 통합 (현재 placeholder 자리)
  - GFP-3 사용자 결정에 따라 confidence 노출 형식 결정
- **TASTE 컨설팅 필요**: **부분 Y** — GFP-3 confidence 노출 형식이 D-009 영역. 사용자 결정 시 TASTE.md §5 "Fingerprint 노출 정밀도" 신규 원칙 등재 가능성.
- **새 ADR 후보**:
  - **D-019 후보 (GFP-1 결정 시)**: Fingerprint 클라 노출은 `GET /api/fingerprint`를 SSOT로 한다. 클라 직접 supabase 조회 금지. (B/C 비채택 명시)
  - **D-020 후보 (GFP-3 결정 시)**: confidence 노출 형식 = {A|B|C|D 중 사용자 채택}. D-017 단순 비율 공식과의 정합 명시.

---

## 잔존 위험 / 가드

- **R-FP-1**: 새 GET 라우트의 응답에 `fingerprint.user_id` 외 사용자 식별자가 포함되면 안 됨 (이미 자기 자신 데이터이므로 무의미하지만 일관성). FingerprintSchema 그대로 응답하면 자동 통과.
- **R-FP-2**: rate limit key가 `recipe`/`run`과 별개 버킷이어야 함 (조회 라우트가 BUILD/COOK 호출을 잡아먹지 않게). `enforceRateLimit("fingerprint")` 신규 키 권고.
- **R-FP-3**: SSR 사용 금지 — page.tsx가 `"use client"`이므로 카드도 클라이언트 컴포넌트. authToken을 props로 받아 fetch.
- **R-FP-4**: traits 배열이 길어질 가능성 (P3 trait 후보 확장 시). 본 사이클은 4 후보(burnt/salty/bland/watery)뿐이라 상한 가드 불필요. 단 UI는 N 무관하게 렌더링 가능해야 함(스크롤 또는 wrap).
