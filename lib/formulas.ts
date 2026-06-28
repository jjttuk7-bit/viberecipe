// lib/formulas.ts — L2 지식 팩 (교체 가능). 첫 팩 = K-Food Formula.
//
// VISION.md 층위 아키텍처 + CLAUDE.md §1.5 가드레일:
//   "책은 팩이지 플랫폼이 아니다." 코어(L1: schema/엔진)는 요리권 무관.
//   이 파일은 *데이터 모듈*이다 — 이탈리안/일식/베이킹 팩으로 교체·추가 가능.
//   prompt.ts 는 activePack 을 받아 시스템 프롬프트에 주입한다.
//
// 데이터 출처: 유케이 『K-Food Formula Kitchen』(12 공식). 본 v1 은 책에서
// *실제로 확인된* 부분만 담는다. 미확인 공식의 정확 비율은 비워 두고(지어내지 않음),
// 셰프는 재료-맛 역할 맵 + 공식 논리로 합리적으로 보정한다.

export type KnowledgePack = {
  id: string;
  title: string;
  /** 한 줄 철학 — 셰프 행동의 북극성. */
  doctrine: string;
  /** 재료 → 맛 역할. 조절("더 매콤")의 근거가 된다. */
  ingredientRoles: { ingredient: string; role: string }[];
  /** 조리 동작 어휘. */
  moves: string[];
  /** 공식 카테고리 (KR/EN). */
  formulas: { ko: string; en: string }[];
  /** 계량 기준. */
  measuring: string[];
  /** 실전 비율이 확인된 공식 예. (미확인은 넣지 않는다.) */
  knownRatios: { name: string; ratio: string; tip?: string }[];
};

export const KFOOD_PACK: KnowledgePack = {
  id: "kfood",
  title: "K-Food Formula",
  doctrine:
    "공식이 기준(기본)을 만들고, 사용자가 입맛으로 완성한다. 기본은 셰프가 먼저 깔고, 추가·조절만 사용자에게 묻는다.",
  ingredientRoles: [
    { ingredient: "간장", role: "짠맛·감칠맛" },
    { ingredient: "고추장", role: "매운맛·단맛" },
    { ingredient: "고춧가루", role: "매운맛(칼칼함)" },
    { ingredient: "된장", role: "구수함·깊은맛" },
    { ingredient: "식초", role: "새콤함(맛을 밝게)" },
    { ingredient: "설탕", role: "단맛(균형)" },
    { ingredient: "참기름·참깨", role: "고소함(마무리 향)" },
    { ingredient: "마늘·대파", role: "향(베이스)" },
  ],
  moves: [
    "무침(toss)",
    "볶음(stir-fry)",
    "조림(simmer)",
    "국/찌개(soup·stew)",
    "구이(grill)",
    "전(pan-fry)",
  ],
  formulas: [
    { ko: "간장양념", en: "Soy Seasoning" },
    { ko: "고추장양념", en: "Gochujang" },
    { ko: "나물무침", en: "Namul" },
    { ko: "간장조림", en: "Soy Simmer" },
    { ko: "매운조림", en: "Spicy Simmer" },
    { ko: "된장국", en: "Doenjang Soup" },
    { ko: "김치찌개", en: "Kimchi Stew" },
    { ko: "비빔양념", en: "Bibim Sauce" },
    { ko: "불고기양념", en: "Korean Marinade" },
    { ko: "전 반죽", en: "Jeon Batter" },
    { ko: "빠른 피클", en: "Quick Pickle" },
    { ko: "마무리", en: "Finishing Touch" },
  ],
  measuring: ["1큰술(T) = 15ml", "1작은술(t) = 5ml", "종이컵 = 180ml"],
  knownRatios: [
    {
      name: "김치찌개",
      ratio: "김치 1컵 : 김치국물 ½컵 : 다진마늘 1t : 설탕 1t : 물 2컵",
      tip: "너무 시면 설탕 조금 더 + 오래 끓이기.",
    },
  ],
};

// 현재 활성 팩 (교체 지점). 다른 요리권 팩을 만들면 여기서 바꾼다.
export const ACTIVE_PACK: KnowledgePack = KFOOD_PACK;

// 시스템 프롬프트에 주입할 한식 지식 섹션 문자열.
export function renderKnowledgePack(pack: KnowledgePack): string {
  const roles = pack.ingredientRoles
    .map((r) => `${r.ingredient}=${r.role}`)
    .join(" / ");
  const cats = pack.formulas.map((f) => f.ko).join("·");
  const ratios = pack.knownRatios
    .map((r) => `- ${r.name}: ${r.ratio}${r.tip ? ` (${r.tip})` : ""}`)
    .join("\n");
  return [
    `## 지식 팩 — ${pack.title}`,
    pack.doctrine,
    "",
    "### 재료-맛 역할 (조절의 근거)",
    roles,
    "→ \"더 매콤\"=고추장·고춧가루↑ / \"더 깊게\"=된장·간장↑ / \"느끼함↓\"=식초 약간 / \"싱거움\"=간장(짠맛만 말고 감칠맛도 같이).",
    "",
    `### 조리 동작\n${pack.moves.join(" · ")}`,
    `### 12 공식 카테고리\n${cats}`,
    `### 계량\n${pack.measuring.join(" / ")}`,
    "### 확인된 실전 비율 (있는 것만)",
    ratios,
    "",
    "규율: 위 재료-맛 역할에 **근거**해 조절을 설명한다(예: \"더 매콤하게 = 고추장 한 술 추가\"). 확인 안 된 공식의 정확 비율을 *지어내지 말고*, 공식 논리로 합리적으로 잡는다.",
  ].join("\n");
}
