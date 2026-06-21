"use client";

import { useMemo, useState } from "react";
import BuildMode from "@/components/BuildMode";
import CookMode from "@/components/CookMode";
import Postmortem from "@/components/Postmortem";
import FingerprintCard from "@/components/FingerprintCard";
import type { RecipeState, Stage, StepEvent } from "@/lib/schema";

type Mode = "build" | "cook" | "postmortem";

export default function HomePage(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("build");
  const [authToken, setAuthToken] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [stage, setStage] = useState<Stage>("concept");
  const [recipeState, setRecipeState] = useState<RecipeState | null>(null);
  const [cookStartedAt, setCookStartedAt] = useState<string | null>(null);
  const [cookEvents, setCookEvents] = useState<StepEvent[]>([]);
  const [fingerprintNonce, setFingerprintNonce] = useState(0);

  const userId = useMemo(() => readJwtSub(authToken), [authToken]);
  const canCook = Boolean(recipeState?.steps?.length);

  return (
    <main className="ide-shell">
      <header className="command-header">
        <div className="brand-block">
          <span className="brand-line">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-name">vibe recipe</span>
            {recipeState?.name ? (
              <>
                <span className="brand-sep">·</span>
                <span className="brand-recipe">
                  {recipeState.name} · {stage === "done" ? "완성" : "초안"}
                </span>
              </>
            ) : null}
          </span>
        </div>

        <details className="dev-shelf" aria-label="dev credentials">
          <summary>
            <span className="dev-shelf-label">dev</span>
          </summary>
          <div className="dev-shelf-body">
            <div className="field command-field">
              <label htmlFor="auth-token">AUTH TOKEN</label>
              <input
                id="auth-token"
                value={authToken}
                onChange={(event) => setAuthToken(event.target.value)}
                placeholder="Bearer JWT"
              />
            </div>
            <div className="field command-field">
              <label htmlFor="recipe-id">RECIPE ID</label>
              <input
                id="recipe-id"
                value={recipeId}
                onChange={(event) => setRecipeId(event.target.value)}
                placeholder="uuid"
              />
            </div>
          </div>
        </details>

        <div className="status-cluster" aria-label="session state">
          <span className="autosave-pill">
            <span className="autosave-dot" aria-hidden="true" />
            자동 저장됨
          </span>
          <button
            type="button"
            className="cook-mode-btn"
            disabled={!canCook}
            onClick={() => setMode("cook")}
            aria-label="쿡 모드 진입"
          >
            쿡 모드 →
          </button>
        </div>
      </header>

      <section className="mode-stage" aria-label="active mode">
        {mode === "build" ? (
          <BuildMode
            authToken={authToken}
            recipeId={recipeId.trim() || null}
            recipeState={recipeState}
            onRecipeStateChange={setRecipeState}
            stage={stage}
            onStageChange={setStage}
          />
        ) : null}
        {mode === "cook" ? (
          <CookMode
            recipe={recipeState}
            onFinish={({ startedAt, events }) => {
              setCookStartedAt(startedAt);
              setCookEvents(events);
              setMode("postmortem");
            }}
          />
        ) : null}
        {mode === "postmortem" ? (
          <Postmortem
            authToken={authToken.trim()}
            recipeId={recipeId.trim() || null}
            userId={userId}
            startedAt={cookStartedAt}
            events={cookEvents}
            stepCount={recipeState?.steps?.length ?? 0}
            onSaved={() => {
              setFingerprintNonce((n) => n + 1);
              setMode("build");
            }}
          />
        ) : null}
      </section>

      <aside className="page-footer-aside">
        <FingerprintCard
          authToken={authToken}
          refreshNonce={fingerprintNonce}
        />
      </aside>
    </main>
  );
}

function readJwtSub(token: string): string | null {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(window.atob(normalized)) as { sub?: unknown };
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}
