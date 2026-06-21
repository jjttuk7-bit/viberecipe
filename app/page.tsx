"use client";

import { useMemo, useState } from "react";
import BuildMode from "@/components/BuildMode";
import CookMode from "@/components/CookMode";
import Postmortem from "@/components/Postmortem";
import FingerprintCard from "@/components/FingerprintCard";
import type { RecipeState, Stage, StepEvent } from "@/lib/schema";

type Mode = "build" | "cook" | "postmortem";

// 인증 토큰 / recipe_id는 로그인 사이클까지 빈 값. Vercel 배포 후 실제 로그인 흐름이
// 세션 컨텍스트로 주입할 예정. 그 전까지 BUILD/COOK/POSTMORTEM API 호출은 401.
const authToken = "";
const recipeId = "";

export default function HomePage(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("build");
  const [stage, setStage] = useState<Stage>("concept");
  const [recipeState, setRecipeState] = useState<RecipeState | null>(null);
  const [cookStartedAt, setCookStartedAt] = useState<string | null>(null);
  const [cookEvents, setCookEvents] = useState<StepEvent[]>([]);
  const [fingerprintNonce, setFingerprintNonce] = useState(0);

  const userId = useMemo(() => readJwtSub(authToken), [authToken]);
  const canCook = Boolean(recipeState?.steps?.length);
  // cold-start 추측 — BuildMode의 hero 분기와 동일한 의미: recipeState 부재 + 시작 stage
  const isFirstEntry = recipeState === null && stage === "concept";

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

        {!isFirstEntry ? (
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
        ) : (
          <span aria-hidden="true" />
        )}
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

      {!isFirstEntry ? (
        <aside className="page-footer-aside">
          <FingerprintCard
            authToken={authToken}
            refreshNonce={fingerprintNonce}
          />
        </aside>
      ) : null}
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
