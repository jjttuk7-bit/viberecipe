// /api/fingerprint — Fingerprint 단건 조회 라우트 (D-019).
//
// 용접 / 헌법:
//   - §4 / D-007 / D-008 — Fingerprint 노출은 용접의 *종착 데이터*를 사용자에
//     환원하는 가시화 지점. 데이터 용접의 필수 입력은 아니나(읽기 전용), 부엌
//     지문을 보여 전환 비용을 가시화한다는 D-007 정신의 자연 확장이다.
//   - D-019 (FP.T5 에서 정식 등재) — 본 라우트가 클라의 단일 Fingerprint 조회
//     경로. 클라가 supabase-js 로 직접 조회하는 것을 SSOT 로 금지한다.
//
// 패턴 재사용 (P1 첫 묶음 ADR 그대로):
//   - D-011 / R-FP-2 — enforceRateLimit("fingerprint") 신규 버킷.
//     /recipe·/run 버킷을 잡아먹지 않도록 분리.
//   - D-015 — authenticateRequest SSOT 재사용. 인증 통과 후에만 service-role 호출(R4).
//   - D-013 패턴 — 조회 실패는 1회 재시도 후 502. 무한 루프 금지.
import {
  FingerprintSchema,
  type Fingerprint,
} from "@/lib/schema";
import { enforceRateLimit, withRateLimitHeaders } from "@/lib/ratelimit";
import { authenticateRequest } from "@/lib/auth";
import { fetchFingerprintForUser } from "@/lib/fingerprintStore";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  // [1] rate limit — 신규 버킷.
  const gate = await enforceRateLimit(request, "fingerprint");
  if (!gate.ok) return gate.response;

  // [2] 인증 — D-015 SSOT.
  const authResult = await authenticateRequest(request);
  if (!authResult.ok) {
    return withRateLimitHeaders(authResult.response, gate);
  }
  const userId = authResult.userId;

  // [3] 조회 — D-013 패턴 (1회 재시도 후 502).
  let fingerprint: Fingerprint | null;
  try {
    fingerprint = await fetchFingerprintForUser(userId);
  } catch {
    try {
      fingerprint = await fetchFingerprintForUser(userId);
    } catch {
      return withRateLimitHeaders(
        jsonResponse(502, {
          error: "fingerprint_fetch_failed",
          message: "부엌 지문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
        }),
        gate,
      );
    }
  }

  return withRateLimitHeaders(
    jsonResponse(200, { fingerprint }),
    gate,
  );
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

void FingerprintSchema;
