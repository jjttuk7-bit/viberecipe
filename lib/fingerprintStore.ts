// 단건 Fingerprint 조회 헬퍼.
//
// 용접 구조 — §4 / D-007 / D-008:
//   Fingerprint 는 Cook→Postmortem→RuntimeLog→Fingerprint→다음 BUILD 의 종착이자
//   재시작점. 본 함수는 그 종착 데이터를 *표시* 목적으로 클라에 노출하는 단일
//   진입점이다 (D-019 신규 SSOT).
//
// lib/buildContext.ts 와의 분리 이유:
//   - buildContext 는 runtime_logs + fingerprints 결합 조회(BUILD 입력 묶음).
//   - 본 함수는 fingerprints 단건. 호출 빈도/실패 정책/응답 shape 모두 다름.
//   - 같은 SELECT 가 두 곳에 박혀 있어 보이나, 컨텍스트가 다른 두 SSOT 라
//     중복이 아닌 *목적 분리*다 (D-019 가 SSOT 를 본 함수로 못박음).
//
// 인증:
//   - service-role 로 RLS 우회. 호출자(/api/fingerprint)가 user_id 검증을 끝낸
//     뒤에만 호출한다 (R4 cross-tenant 가드, D-015 정합).
import "server-only";
import {
  FingerprintSchema,
  type Fingerprint,
} from "@/lib/schema";
import { supabaseServerServiceRoleClient } from "@/lib/supabase";

// 라우트에서 호출.
//
//   try {
//     fp = await fetchFingerprintForUser(userId);
//   } catch (e1) {
//     try { fp = await fetchFingerprintForUser(userId); } // D-013 패턴 1회 재시도
//     catch (e2) { return 502; }
//   }
//
// 데이터 없음(첫 사용자)은 정상 경로 — null 반환. 502 가 아니다.
export async function fetchFingerprintForUser(
  userId: string,
): Promise<Fingerprint | null> {
  const supabase = supabaseServerServiceRoleClient();

  const { data, error } = await supabase
    .from("fingerprints")
    .select("user_id, total_runs_all_recipes, traits")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[fingerprintStore] fingerprints 조회 실패: ${error.message}`,
    );
  }
  if (data === null) return null;

  // jsonb traits 는 unknown — FingerprintSchema 가 최종 안전화 (jsonb 위변조 가드).
  // 위반 시 ZodError 로 throw → 라우트의 1회 재시도 루프에 잡힘.
  return FingerprintSchema.parse({
    user_id: data.user_id,
    total_runs_all_recipes: data.total_runs_all_recipes,
    traits: data.traits ?? [],
  });
}
