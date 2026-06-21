# FP.T3 UI 변경 보고서

**일자**: 2026-06-20
**범위**: FingerprintCard 신설 + page.tsx 통합 + globals.css 토큰 추가

## 신규 파일

### `components/FingerprintCard.tsx`

```ts
export type FingerprintCardProps = {
  authToken: string;
  refreshNonce: number;
};
```

- "use client" 컴포넌트. fetch `/api/fingerprint` (D-019 SSOT).
- 상태 머신 4종: `idle | loading | ready | error`.
- `useEffect`로 authToken 또는 refreshNonce 변경 시 재페치. AbortController로 in-flight 취소.
- `data: Fingerprint | null` 분기:
  - null + totalRuns=0 + traits=0 → cold-start 안내 ("아직 부엌 지문이 없어. 한 번 요리하고 기록하면 여기 쌓이기 시작해.") — TASTE.md §4 톤 정합.
  - traits.length=0 + totalRuns>0 → "조리 기록은 쌓였지만 아직 뚜렷한 경향은 안 보여" — D-017 임계(N≥3 + 0.6) 미달 케이스.
  - traits 있음 → `<ul>` 목록. 각 trait에 label + confidence 백분율 + 증거 횟수.
- **confidence 표시 (D-020)**: `Math.round(trait.confidence * 100)`% — D-017 단순 비율 공식과 정합.

## 변경 파일

### `app/page.tsx`

- `import FingerprintCard` 추가.
- `fingerprintNonce: number` state 신설.
- Postmortem `onSaved` 콜백 확장 — `setFingerprintNonce((n) => n + 1)`로 카드 재페치 트리거 → **용접 가시성**. Postmortem 저장(=Cook→Postmortem→RuntimeLog→Fingerprint 갱신) 직후 사용자가 변화를 즉시 본다.
- `<aside className="runtime-inspector">` 안에 `<FingerprintCard>`가 최상단. 기존 session.state 메트릭은 그 아래 `inspector-head-sub`로 강등.

### `app/globals.css`

- 신규 클래스: `.fingerprint-card` (테두리·패딩·panel 배경), `.inspector-head-sub` (margin only), `.fp-trait-list`, `.fp-trait-row`, `.fp-trait-label`, `.fp-trait-meta`, `.fp-confidence`.
- 기존 토큰 재사용: `--line`, `--panel`, `--mono`, `--run`, `--muted` 등. 새 색 도입 0.

## 검증

- `npm run typecheck` → exit 0
- `npm test` → 6/6 통과 (기존 lib 단위 테스트 회귀 0)

## D-008 용접 테스트 재확인

- "FingerprintCard를 떼어내도 다음 BUILD가 작동하는가?" — Y (BuildContext는 코드 흐름에 영향 없음). 카드는 *데이터 용접*의 필수 입력이 아니다.
- 그러나 `refreshNonce` 회로로 **사용자 인식의 용접**은 박혔다: Postmortem 저장 → fingerprintNonce++ → 카드 재페치 → 사용자가 자신의 부엌 지문이 변화하는 것을 본다. 전환 비용 가시화의 메커니즘이 코드 레벨에 존재.
- §4의 BLOCK 트리거(데이터 용접 강제)는 위반 없음. PASS.

## 잔존 위험 / FP.T4 inspector에게 인계

- **R-FP-5**: `refreshNonce` 초기값 0. 마운트 시 첫 fetch는 authToken 존재 시 1회 실행 — 의도된 동작. cold-start 사용자가 처음 진입 시 빈 카드 → cold-start 메시지 표시.
- **R-FP-6**: `isSuccessPayload`는 `hasOwnProperty("fingerprint")`로 분기. 200 응답이 `{ fingerprint: null }`을 보내면 success로 통과(의도). 400/401/429/502는 `error` 필드만 있으므로 fail 분기.
- **R-FP-7**: 동시 다중 요청 처리 — AbortController로 이전 요청 취소. 마지막 응답만 setState.
- **R-FP-8**: SSR 안전 — 컴포넌트 "use client", `useEffect` 내부에서만 fetch. 서버 렌더 시 idle.
