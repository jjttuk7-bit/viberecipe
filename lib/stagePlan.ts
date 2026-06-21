// lib/stagePlan.ts — Stage별 *필수/선택* 필드 SSOT (D-024).
//
// 헌법 정합:
//   - §1.3 한 턴 한 단계 — 각 stage가 *어떤 필드를 합의해야 하는지* 명시. Plan 가시화의 기준.
//   - D-003 점진 빌드 — concept→base→taste→steps→done 5단계 각각의 *필수 필드*.
//   - D-014 stage별 TASTE 분기 — 본 모듈은 *필드 명세*, lib/prompt.ts는 *TASTE 원칙 인용*. 두 SSOT는 *목적 분리*.
//
// SSOT 강제:
//   - `keyof RecipeState`를 직접 사용 — lib/schema의 RecipeState 변경 시 컴파일러가 본 모듈 강제 갱신 트리거.
//   - lib/prompt.ts / 라우트는 본 모듈을 참고만, *재정의 금지* (R-PC-1 가드).

import type { RecipeState, Stage } from "@/lib/schema";

export type RecipeField = keyof RecipeState;

export type StagePlan = {
  stage: Stage;
  required: RecipeField[];
  optional: RecipeField[];
};

// Stage별 plan — D-024 SSOT.
//
// `done`은 *full* — 빌드 완성 시점의 모든 필드 확정 기대.
// `taste`의 texture는 optional — TASTE.md §1 식감은 *조리법 선택*의 입력이라 *모든 요리에 필수는 아님*.
// `base`의 tools/time_min은 optional — concept만으로 부분 합의 가능, 도구/시간은 선호로 추가.
export const STAGE_PLANS: Record<Stage, StagePlan> = {
  concept: {
    stage: "concept",
    required: ["name", "concept"],
    optional: [],
  },
  base: {
    stage: "base",
    required: ["ingredients"],
    optional: ["tools", "time_min"],
  },
  taste: {
    stage: "taste",
    required: ["taste"],
    optional: ["texture"],
  },
  steps: {
    stage: "steps",
    required: ["steps"],
    optional: [],
  },
  done: {
    stage: "done",
    required: [
      "name",
      "concept",
      "ingredients",
      "taste",
      "texture",
      "tools",
      "time_min",
      "steps",
    ],
    optional: [],
  },
};

// 사용자 친화 라벨 — Plan UI용. TASTE.md §4 친구 톤.
export const FIELD_LABELS: Record<RecipeField, string> = {
  name: "이름",
  concept: "컨셉",
  ingredients: "재료",
  taste: "맛",
  texture: "식감",
  tools: "도구",
  time_min: "시간",
  steps: "스텝",
};

// 필드가 *확정*인지 판정. recipeState[field] !== undefined이면 확정 (Zod의 optional 정의 활용).
// 부분 확정(예: taste 6축 중 일부만 채움)은 *전체 객체 존재*로 확정 판정 — 부분 시각화는 다음 사이클.
export function isFieldFilled(
  state: RecipeState | null,
  field: RecipeField,
): boolean {
  if (state === null) return false;
  const value = state[field];
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
