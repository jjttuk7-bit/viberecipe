"use client";

import { useEffect, useState } from "react";
import type { Fingerprint } from "@/lib/schema";

// FingerprintCard — 부엌 지문 프로필 (D-007/D-019 가시화).
//
// 용접 의미: 본 카드는 Cook→Postmortem→RuntimeLog→Fingerprint 의 *종착 데이터*를
// 사용자에게 환원해 전환 비용을 보여준다. 데이터 용접의 필수 입력은 아니지만
// (떼어내도 다음 BUILD 는 작동), D-007 "Fingerprint MVP 필수" 의 가치 전달이다.
//
// 페치: GET /api/fingerprint (D-019 SSOT). authToken 또는 refreshNonce 가 바뀔
// 때마다 다시 가져온다. refreshNonce 는 부모(page.tsx)가 Postmortem 저장 직후
// 증가시켜 새 Fingerprint 가 즉시 반영되게 한다 (용접 가시성).
//
// confidence 표현: D-017 의 단순 비율 공식과 정합하는 백분율 표시 (D-020).

export type FingerprintCardProps = {
  authToken: string;
  refreshNonce: number;
};

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: Fingerprint | null }
  | { kind: "error"; message: string };

type SuccessPayload = { fingerprint: Fingerprint | null };
type ErrorPayload = { error?: string; message?: string };

export default function FingerprintCard({
  authToken,
  refreshNonce,
}: FingerprintCardProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  useEffect(() => {
    const trimmed = authToken.trim();
    if (trimmed.length === 0) {
      setState({ kind: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ kind: "loading" });

    fetch("/api/fingerprint", {
      method: "GET",
      headers: { Authorization: `Bearer ${trimmed}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | SuccessPayload
          | ErrorPayload;
        if (!response.ok || !isSuccessPayload(payload)) {
          const errorPayload = payload as ErrorPayload;
          throw new Error(
            errorPayload.message ?? errorPayload.error ?? "조회 실패",
          );
        }
        setState({ kind: "ready", data: payload.fingerprint });
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setState({ kind: "error", message: (e as Error).message });
      });

    return () => controller.abort();
  }, [authToken, refreshNonce]);

  return (
    <section className="fingerprint-card" aria-label="kitchen fingerprint">
      <div className="inspector-head">
        <span className="eyebrow">KITCHEN FINGERPRINT</span>
        <h2>kitchen.fingerprint()</h2>
      </div>
      <div className="stack">{renderBody(state)}</div>
    </section>
  );
}

function renderBody(state: LoadState): React.ReactElement {
  switch (state.kind) {
    case "idle":
      return (
        <div className="context-note">
          AUTH TOKEN을 입력하면 부엌 지문이 표시됩니다.
        </div>
      );
    case "loading":
      return (
        <div className="metric-row">
          <span>fingerprint.load</span>
          <strong>loading...</strong>
        </div>
      );
    case "error":
      return (
        <div className="context-note">
          부엌 지문을 불러오지 못했어요: {state.message}
        </div>
      );
    case "ready":
      return renderReady(state.data);
  }
}

function renderReady(data: Fingerprint | null): React.ReactElement {
  const totalRuns = data?.total_runs_all_recipes ?? 0;
  const traits = data?.traits ?? [];

  if (totalRuns === 0 && traits.length === 0) {
    return (
      <>
        <div className="metric-row">
          <span>total_runs_all_recipes</span>
          <strong>0</strong>
        </div>
        <div className="context-note">
          아직 부엌 지문이 없어. 한 번 요리하고 기록하면 여기 쌓이기 시작해.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="metric-row">
        <span>total_runs_all_recipes</span>
        <strong>{totalRuns}</strong>
      </div>
      <div className="metric-row">
        <span>traits.detected</span>
        <strong>{traits.length}</strong>
      </div>
      {traits.length === 0 ? (
        <div className="context-note">
          조리 기록은 쌓였지만 아직 뚜렷한 경향은 안 보여. 몇 번 더 기록하면
          나타날 수 있어.
        </div>
      ) : (
        <ul className="fp-trait-list">
          {traits.map((trait) => (
            <li key={trait.key} className="fp-trait-row">
              <div className="fp-trait-label">{trait.label}</div>
              <div className="fp-trait-meta">
                <span className="fp-confidence">
                  신뢰도 {Math.round(trait.confidence * 100)}%
                </span>
                <span className="fp-evidence">
                  증거: {trait.evidence_run_ids.length}회 조리
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function isSuccessPayload(
  payload: SuccessPayload | ErrorPayload,
): payload is SuccessPayload {
  return Object.prototype.hasOwnProperty.call(payload, "fingerprint");
}
