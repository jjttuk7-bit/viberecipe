"use client";

import { useState } from "react";
import type { CookRun, Outcome, StepEvent } from "@/lib/schema";

type PostmortemProps = {
  authToken: string;
  recipeId: string | null;
  userId: string | null;
  startedAt: string | null;
  events: StepEvent[];
  stepCount: number;
  onSaved: () => void;
};

const OUTCOMES: Array<{ value: NonNullable<Outcome>; label: string }> = [
  { value: "good", label: "PASS" },
  { value: "meh", label: "WARN" },
  { value: "failed", label: "FAIL" },
];

export default function Postmortem({
  authToken,
  recipeId,
  userId,
  startedAt,
  events,
  stepCount,
  onSaved,
}: PostmortemProps): React.ReactElement {
  const [outcome, setOutcome] = useState<NonNullable<Outcome> | null>(null);
  const [failedStep, setFailedStep] = useState("0");
  const [failedNote, setFailedNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    Boolean(authToken && recipeId && userId && startedAt && outcome) &&
    (outcome !== "failed" || failedStep.length > 0);

  async function submit(): Promise<void> {
    if (!canSubmit || !recipeId || !userId || !startedAt || !outcome) return;
    setBusy(true);
    setStatus(null);

    const finalEvents = [...events];
    if (outcome === "failed") {
      finalEvents.push({
        step_index: Number.parseInt(failedStep, 10),
        type: "failed_here",
        note: failedNote.trim() || undefined,
        timestamp: new Date().toISOString(),
      });
    }

    const run: CookRun = {
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      user_id: userId,
      started_at: startedAt,
      completed: true,
      outcome,
      step_events: finalEvents,
    };

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(run),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "저장 실패");
      }
      setStatus("저장됐습니다. 다음 BUILD부터 이 기록이 회귀 방지에 쓰입니다.");
      onSaved();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel report-bench" aria-label="postmortem">
      <div className="section-head bench-head">
        <div>
          <span className="eyebrow">POSTMORTEM</span>
          <h2>run.report()</h2>
          <p className="muted">CookRun을 RuntimeLog와 Fingerprint로 커밋합니다.</p>
        </div>
        <span className="badge">skip:false</span>
      </div>

      {!recipeId || !userId ? (
        <div className="alert">
          저장하려면 Supabase JWT와 기존 recipe_id가 필요합니다.
        </div>
      ) : null}

      <div className="report-grid">
        <div className="result-panel">
          <div className="terminal-bar">
            <span>run.result</span>
            <span>{outcome ?? "uncommitted"}</span>
          </div>
          <div className="outcome-grid">
            {OUTCOMES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`result-button result-${item.value}`}
                aria-pressed={outcome === item.value}
                onClick={() => setOutcome(item.value)}
              >
                <span>{item.label}</span>
                <small>{item.value}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="trace-panel">
          <div className="terminal-bar">
            <span>stack.trace.pin</span>
            <span>{outcome === "failed" ? "required" : "standby"}</span>
          </div>
          {outcome === "failed" ? (
            <div className="stack trace-body">
              <label>
                failed_step_index
                <select
                  value={failedStep}
                  onChange={(event) => setFailedStep(event.target.value)}
                >
                  {Array.from({ length: stepCount }, (_, index) => (
                    <option key={index} value={index}>
                      step {index}
                    </option>
                  ))}
                </select>
              </label>
              <input
                value={failedNote}
                onChange={(event) => setFailedNote(event.target.value)}
                placeholder="예: 여기서 탔음"
              />
            </div>
          ) : (
            <div className="trace-body muted">
              FAIL 결과를 선택하면 실패 스텝을 RuntimeLog에 핀으로 남깁니다.
            </div>
          )}
        </div>

        <div className="commit-panel">
          <div className="terminal-bar">
            <span>commit.target</span>
            <span>save_cook_run RPC</span>
          </div>
          <div className="commit-body">
            <div className="metric-row">
              <span>step_events</span>
              <strong>{events.length}</strong>
            </div>
            <div className="metric-row">
              <span>completed</span>
              <strong>true</strong>
            </div>
            <button type="button" onClick={submit} disabled={!canSubmit || busy}>
              {busy ? "committing..." : "commit run report"}
            </button>
            {status ? <div className="alert">{status}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
