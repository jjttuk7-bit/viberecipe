-- 0002_run_constraint.sql — P1.B Cook 사이드 사이클
--
-- 두 가지 역할:
--   1. cook_runs CHECK 제약 — "POSTMORTEM 없이 COOK 종료 불가"의 데이터 레벨 2차 차단
--      (1차 차단은 lib/schema.ts:CookRunSchema.refine — Zod 검증)
--      §4 강제 규칙 + GB-6 A안 (P1.B user decision).
--   2. Postgres RPC 함수 save_cook_run — D-008 트랜잭션 원자성 강제 (R5 가드)
--      cook_runs INSERT + runtime_logs UPSERT + fingerprints UPSERT를
--      단일 plpgsql 함수 안에서 묶음. 분리된 .insert/.upsert 호출 시 R5 위반.
--
-- 새 테이블 0건이므로 별도 RLS 정책 추가 없음 (0001_init.sql의 정책이 그대로 적용).
-- RPC 함수는 SECURITY DEFINER + 내부에서 auth.uid() 매칭으로 R4(service-role 오용) 방어.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. cook_runs CHECK 제약 — completed=true ⇒ outcome IS NOT NULL
-- ─────────────────────────────────────────────────────────────────────────
--
-- 의미: completed가 false면 outcome은 NULL 허용 (Postmortem 미진입 진행 중 상태).
--       completed가 true면 outcome은 반드시 'good'/'meh'/'failed' 중 하나.
-- 0001_init.sql의 기존 CHECK(outcome in ('good','meh','failed'))는 NULL을 허용 →
-- 본 제약과 함께 작동하여 "completed=true && outcome=NULL"만 정확히 차단.

alter table public.cook_runs
  add constraint cook_runs_completed_outcome_check
  check ((completed = false) or (outcome is not null));

-- ─────────────────────────────────────────────────────────────────────────
-- 2. 보조 인덱스 — Cook 사이드 빈번 조회 경로
-- ─────────────────────────────────────────────────────────────────────────
--
-- 0001_init.sql에 runtime_logs(user_id), cook_runs(recipe_id, user_id), recipes(user_id) 인덱스가
-- 이미 있음. fingerprints는 PK가 user_id이므로 별도 인덱스 불필요.
-- 추가 인덱스: runtime_logs를 recipe_id로 빠른 lookup (PK가 이미 recipe_id이므로 자동 처리됨).
-- cook_runs(recipe_id, user_id) 복합 인덱스 — rebuildRuntimeLog가 특정 레시피의 사용자 CookRun을
-- 가져올 때 사용.

create index if not exists cook_runs_recipe_user_idx
  on public.cook_runs (recipe_id, user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RPC 함수 save_cook_run — D-008 트랜잭션 묶음 (R5 가드 핵심)
-- ─────────────────────────────────────────────────────────────────────────
--
-- 입력 (jsonb 3종 — lib/schema.ts의 CookRun / RuntimeLog / Fingerprint와 1:1 매핑):
--   p_cook_run   : { id, recipe_id, user_id, started_at, completed, outcome, step_events }
--   p_runtime_log: { recipe_id, total_runs, known_issues }
--   p_fingerprint: { user_id, total_runs_all_recipes, traits }
--
-- 동작:
--   ① cook_runs INSERT (id가 충돌하면 에러 — Cook 1회당 1행)
--   ② runtime_logs UPSERT on recipe_id
--   ③ fingerprints UPSERT on user_id
--   세 작업 모두 함수 본문 내부에서 실행되므로 단일 트랜잭션 — 하나라도 실패하면 전체 롤백.
--
-- 보안:
--   - SECURITY DEFINER — RLS 우회를 위해 필요 (BUILD가 user_id 매칭 후 호출하므로 안전)
--   - 단 함수 내부에서 auth.uid() = (p_cook_run->>'user_id')::uuid를 검증하여 R4 가드.
--   - p_cook_run의 user_id가 호출자(auth.uid())와 다르면 즉시 raise exception.
--   - p_runtime_log/p_fingerprint의 user_id도 동일하게 매칭 검증.
--
-- 권한:
--   authenticated 롤에만 execute 허용. anon은 호출 불가.

create or replace function public.save_cook_run(
  p_cook_run jsonb,
  p_runtime_log jsonb,
  p_fingerprint jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid;
  v_run_user uuid;
  v_fingerprint_user uuid;
begin
  -- R4 가드: 호출자 신원 확정
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  -- 입력 신원 일관성 검증 — CookRun.user_id와 Fingerprint.user_id 모두 호출자와 일치해야 함.
  -- (RuntimeLogSchema에는 user_id 필드 0건 — DB 컬럼은 RLS용으로 0001_init.sql에 존재.
  --  본 함수가 v_caller로 강제 채움.)
  v_run_user := (p_cook_run ->> 'user_id')::uuid;
  v_fingerprint_user := (p_fingerprint ->> 'user_id')::uuid;

  if v_run_user is null then
    raise exception 'cook_run.user_id is required' using errcode = '22023';
  end if;
  if v_run_user <> v_caller then
    raise exception 'forbidden: cook_run.user_id does not match auth.uid()'
      using errcode = '42501';
  end if;
  if v_fingerprint_user is null or v_fingerprint_user <> v_caller then
    raise exception 'forbidden: fingerprint.user_id does not match auth.uid()'
      using errcode = '42501';
  end if;

  -- recipe ownership 검증 — 본 함수가 RLS를 우회하므로 호출자가 해당 레시피의 소유자인지 직접 확인.
  if not exists (
    select 1 from public.recipes r
    where r.id = (p_runtime_log ->> 'recipe_id')::uuid
      and r.user_id = v_caller
  ) then
    raise exception 'forbidden: recipe not owned by caller'
      using errcode = '42501';
  end if;

  -- cook_run.recipe_id와 runtime_log.recipe_id 일치 검증
  if (p_cook_run ->> 'recipe_id')::uuid <> (p_runtime_log ->> 'recipe_id')::uuid then
    raise exception 'mismatch: cook_run.recipe_id and runtime_log.recipe_id'
      using errcode = '22023';
  end if;

  -- ① cook_runs INSERT
  insert into public.cook_runs (
    id, recipe_id, user_id, started_at, completed, outcome, step_events
  )
  values (
    (p_cook_run ->> 'id')::uuid,
    (p_cook_run ->> 'recipe_id')::uuid,
    v_run_user,
    (p_cook_run ->> 'started_at')::timestamptz,
    (p_cook_run ->> 'completed')::boolean,
    p_cook_run ->> 'outcome',
    coalesce(p_cook_run -> 'step_events', '[]'::jsonb)
  );

  -- ② runtime_logs UPSERT on recipe_id
  insert into public.runtime_logs (
    recipe_id, user_id, total_runs, known_issues, updated_at
  )
  values (
    (p_runtime_log ->> 'recipe_id')::uuid,
    v_caller,
    coalesce((p_runtime_log ->> 'total_runs')::integer, 0),
    coalesce(p_runtime_log -> 'known_issues', '[]'::jsonb),
    now()
  )
  on conflict (recipe_id) do update set
    total_runs = excluded.total_runs,
    known_issues = excluded.known_issues,
    updated_at = now()
  where public.runtime_logs.user_id = v_caller;

  -- ③ fingerprints UPSERT on user_id
  insert into public.fingerprints (
    user_id, total_runs_all_recipes, traits, updated_at
  )
  values (
    v_caller,
    coalesce((p_fingerprint ->> 'total_runs_all_recipes')::integer, 0),
    coalesce(p_fingerprint -> 'traits', '[]'::jsonb),
    now()
  )
  on conflict (user_id) do update set
    total_runs_all_recipes = excluded.total_runs_all_recipes,
    traits = excluded.traits,
    updated_at = now();
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. 권한 — authenticated만 execute 가능
-- ─────────────────────────────────────────────────────────────────────────

revoke all on function public.save_cook_run(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_cook_run(jsonb, jsonb, jsonb) to authenticated;
