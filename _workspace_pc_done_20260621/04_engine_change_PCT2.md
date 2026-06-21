# PC.T2 백엔드 변경 보고서 — /api/recipe 응답 wrapper 확장

**일자**: 2026-06-21
**범위**: `app/api/recipe/route.ts` 한 곳 — 200 응답 wrapper에 `context_used` 메타 추가

## 변경 내용

기존:
```ts
return withRateLimitHeaders(
  jsonResponse(200, {
    engineResponse,
    parsedAt: new Date().toISOString(),
  }),
  gate,
);
```

신규:
```ts
const contextUsed = {
  cold_start: buildContext.cold_start,
  known_issues_count: buildContext.runtime_log?.known_issues.length ?? 0,
  traits_applied:
    buildContext.fingerprint?.traits.map((t) => ({
      key: t.key,
      label: t.label,
      confidence: t.confidence,
    })) ?? [],
};
return withRateLimitHeaders(
  jsonResponse(200, {
    engineResponse,
    parsedAt: new Date().toISOString(),
    context_used: contextUsed,
  }),
  gate,
);
```

## 헌법 / ADR 정합

| 영역 | 영향 | 결과 |
|------|------|------|
| `EngineResponseSchema` | **변경 0** — LLM 응답 contract 무손상 | D-001 위반 0 |
| `RequestBodySchema` | **변경 0** | — |
| `lib/schema.ts` | **변경 0** | — |
| 인증 / rate limit | **변경 0** | D-011 / D-015 회귀 0 |
| BuildContext 흐름 | *그대로 사용* — 본 사이클은 *응답 노출만* | D-008 / D-013 회귀 0 |
| Trait 정보 노출 | confidence 백분율 표시 위치는 클라 책임 | D-020 정합 |

## 클라 호환성

- *과거 클라*(예: 캐싱된 fetch)는 `context_used` 무시 — backward-compatible.
- *신규 클라*는 `context_used`가 *없을 가능성*(예: 502 등 에러 케이스)에 대비. 본 사이클 UI는 *200 응답 + context_used 존재* 조건에서만 ContextMetaCard 렌더.

## 잔존 위험

- **R-PC-4 (architect 식별)**: 본 변경은 *최초 BuildContext 조회*의 정보를 그대로 wrapper에 기록. 만약 LLM 재시도(D-004) 중간에 BuildContext가 변경되더라도 (불가능 — 호출 1회) 그대로. 정합.
- **R-PC-3**: `traits_applied`의 label이 부정 표현일 수 있음 — 본 사이클은 그대로 노출. 다음 사이클에서 완곡 표현 검토.

## 자동 검증

- `npm run typecheck` → **exit 0**
- `npm test` → 별도 (PC.T4 inspector 단계)
