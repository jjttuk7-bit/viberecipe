# P1B.T1 NEED_USER_DECISION 답변

**일자**: 2026-06-15
**결정자**: 사용자 (유케이)

## 채택 결과 (7건 모두 architect 권고대로)

| GB | 채택 | 신규 ADR | 작업 영역 |
|----|------|---------|----------|
| GB-1 핫픽스 카테고리 5종 | **A** TASTE §3 4종(짜다/싱겁다/탄다/묽다) + 기타(자유) = 5종 | **D-016** | T4 CookMode 핫픽스 UI + lib/schema.ts에 enum 추가 검토 |
| GB-2 Postmortem 평가 분류 | **A** PRD §3 3단(좋음/그냥/망함) 유지 | 불필요 | T4 Postmortem UI |
| GB-3 Fingerprint confidence 계산 | **A** 단순 빈도 N/5 — 관찰 N≥3 + 동일 trait 비율 ≥0.6 → confidence=비율값. 3회 미만은 trait 미생성 | **D-017** | T2 lib/fingerprint.ts |
| GB-4 timer 알림 권한 거부 UX | **C** 요청 + Wake Lock 강제 fallback + 인페이지 비주얼(흔들림+수이광키스ан) | **D-018** | T4 CookMode |
| GB-5 Wake Lock 미지원 폴백 | **B** 명시 안내 + 통과 (도움 모드 폴백) | 불필요 | T4 CookMode |
| GB-6 completed=true && outcome=null refine 위치 | **A** Zod refine(CookRunSchema) + SQL CHECK 둘 다 | 불필요 (§4 직접 구현) | T2 schema-architect refine + T3 migration 0002 |
| GB-7 authenticateRequest 추출 위치 | **A** lib/auth.ts 신설 | 불필요 (D-015 §결과 구체화) | T3 engine-builder lib/auth.ts 신설 |

## 트랜잭션 방식 (architect 보고서 본문 박힘)
**A. RPC 함수** (`supabase/migrations/0002_save_cook_run.sql`, plpgsql, SECURITY DEFINER) — B(클라 보상)는 R5 직접 위반이라 후보 제외.

## 작업 인계

### schema-architect
1. `lib/schema.ts`에 HotfixCategorySchema 추가 (`["salty","bland","burnt","watery","other"]` 5종 enum)
2. `lib/schema.ts`의 CookRunSchema에 refine 추가 — completed=true && outcome===null → 검증 실패
3. `supabase/migrations/0002_run_constraint.sql` 신설:
   - cook_runs CHECK 제약: `completed=true ⇒ outcome is not null`
   - Postgres RPC 함수 `save_cook_run(p_cook_run, p_runtime_log, p_fingerprint)` — cook_runs INSERT + runtime_logs UPSERT + fingerprints UPSERT 단일 트랜잭션 + SECURITY DEFINER + RLS

### engine-builder (T2 + T3)
- T2: `lib/runtime.ts` 본문 (StepEvent 4종 exhaustive switch, hotfix category 5종 처리, D-012 정렬). `lib/fingerprint.ts` 본문 (confidence = 단순 빈도 N/5, N≥3+비율≥0.6 게이트).
- T3: `lib/auth.ts` 신설 (`authenticateRequest` 추출 — /api/recipe + /api/run 공유). `/api/run` 본문 — RPC `save_cook_run` 호출로 트랜잭션 강제. P0 가드 + D-015 인증 + R12~R15 가드 + R5 RPC 채택.

### ui-builder (T4)
- `CookMode.tsx` 본문 — 핫픽스 UI 5종(GB-1) + timer Notifications + Wake Lock 강제(GB-4) + Wake Lock 미지원 명시 안내(GB-5)
- `Postmortem.tsx` 본문 — 3단(GB-2) + 실패 스텝 핀포인트 + 닫기 차단(§4 강제)
- D-006 강제: props에 setRecipeState 시그니처 0건

### welding-inspector (T5)
- weld-trace 5라인(Line 2/3/4 핵심) + 경계 D(StepEvent exhaustive) + R5 트랜잭션 가드 검증
- Postmortem 닫기 차단 + 핫픽스 카테고리 5종 ↔ lib/schema enum 매핑

### doc-taste-scribe (T6)
- ADR D-016(핫픽스 카테고리), D-017(confidence 공식), D-018(timer 알림 UX) 등재
- TASTE.md §5 #3 해소 (Fingerprint trait 임계 confidence) + §3 5번째 카테고리 명시화
- MAP.md / SESSION.md / CLAUDE.md §9 / 06_doc_change_P1BT6.md

## 회귀 가드 (architect 식별 R12~R19 + P0 R1~R11 모두 적용)
- R3 (UPSTASH catch 0건)
- R4 (service-role 오용 — 인증 통과 후에만)
- **R5 (트랜잭션 분리) — RPC 채택으로 회피**
- R9 (라우트 안 z.object/z.enum 0건)
- R10 (BuildContext 매개변수 누락 0)
- R12~R15 (D-004 1회 + slice + warnings + 전체 상태)
