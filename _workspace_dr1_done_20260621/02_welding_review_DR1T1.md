# DR1.T1 헌법 사전 가드 — 시각 시스템 적용

**검증 절차**: constitution-check 5단계
**일자**: 2026-06-21
**사용자 정책**: architect 권고 자동 채택

## 헌법 검증 결과
- **결정**: **PASS-with-recommendations**. 회색 영역 3건(GDR-1~3) 모두 architect 권고 자동 채택.
- **검토 ADR**: D-002 / D-021 / D-022 / D-024 / D-025 (모두 *시각 표면* 영향 없음 — 동작 무손상)
- **신규 ADR 후보**: **D-026** 디자인 시스템 SSOT (색 5종 + 폰트 3종 + 마이크로 요소 정책)

## Step 1: §1 제품 철학
- ① / ④ : 시각 변경, 데이터 흐름 무관 — PASS
- ② 답변이 아니라 diff : 마이크로 요소(사용자 칩 검정/원형 전송) 변경 — diff 정신 무관 — PASS
- ③ 한 턴 한 단계 : stage progress / Plan 카드 그대로 — PASS

## Step 2: §4 용접 게이트
- 데이터 용접 5+1 라인: 변경 0 — 회귀 0
- 임베드 *층위*(D-021/D-024/D-025): *시각만* 변경, 구조 무손상
- §4 BLOCK 트리거: 위반 0

## Step 3: §7 ADR 매핑
| ADR | 영향 | 결과 |
|-----|------|------|
| D-002 | 시각만, 카드/diff 분리 정신 무손상 | PASS |
| D-021 | 4-요소 패턴 *시각 디자인 시스템* 정의 추가. 결과 섹션 보강 | 결과 보강 |
| D-022/D-023 | mutation/undo 흐름 무관 | PASS |
| D-024/D-025 | Plan/Context 카드 *시각만* 변경 | PASS |
| TASTE §6 | *잠정* → *확정* 보강 (디자인 톤 명문화) | 보강 |

## Step 4: 데이터 영속
- localStorage / API 키 / rate limit : 변경 0

---

## 회색 영역 결정

### GDR-1: 색 토큰 SSOT

**채택**: `app/globals.css`의 `:root` 변수 통합 갱신. 5색 + 보조 토큰.
- `--paper`: `#f4ead7` (스크린샷 베이지에 맞춰 기존 `#fff8ec`보다 약간 더 따뜻)
- `--ink`: `#1a1a1a` (검정 강화)
- `--heat`: `#d36b2c` (주황 강조 유지)
- `--gold`: `#b9872c` 유지
- `--paper-soft`: `#fcf3e4` (현재 panel) — 카드 배경
- **신규 `--accent-green`**: `#2a6d57` — live 인디케이터, "자동 저장됨" 점
- **신규 `--user-chip-bg`**: `var(--ink)` (검정), `--user-chip-fg`: `#ffffff`

### GDR-2: 폰트 3종 등록 방식

| 폰트 | 등록 방식 | 이유 |
|------|----------|------|
| **Newsreader** | `next/font/google` | Google Fonts에 있음. 정식 next 최적화. |
| **JetBrains Mono** | `next/font/google` | 위와 동일. |
| **Pretendard** | CSS `font-family` chain + 시스템 fallback | Google Fonts 미등록. CDN 의존성 추가는 위험 + next/font/local로 등록은 별도 패키지 필요. 본 사이클은 *시스템 폰트 chain*으로 시작 — Pretendard 설치된 환경은 자동 적용. 정식 등록은 다음 사이클. |

CSS 변수:
- `--font-body`: `var(--font-pretendard), "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
- `--font-display`: `var(--font-newsreader), "Newsreader", Georgia, "Times New Roman", serif`
- `--font-mono`: `var(--font-jetbrains-mono), "JetBrains Mono", "Cascadia Mono", Consolas, monospace`

### GDR-3: pair-chef 아바타 표현

**채택**: 채팅 버블 좌상단에 작은 원 (28px 정도) + 한 글자 "셰". `--paper-soft` 배경 + `--ink` 테두리.
- 본 작업은 시각 시그널 — *데이터 변경 0*

### GDR-4 (architect 권고 자동 채택): 헤더 *자동 저장됨* / *쿡 모드 →*

- `자동 저장됨`: 본 사이클은 *static 텍스트* + `--accent-green` 점. 실제 자동 저장 기능은 P2 영속 사이클까지 *시그널만*.
- `쿡 모드 →` 버튼: 우상단. `mode === "cook" || canCook`일 때 활성. 클릭 = `setMode("cook")`. 기존 pipeline-rail의 cook 버튼과 동일 동작 — 헤더에서도 가능.

---

## 신규 ADR 후보 (DR1.T4 등재)

### D-026. 디자인 시스템 SSOT — 색 5종 + 폰트 3종 + 마이크로 요소

`app/globals.css :root` 변수가 SSOT. 모든 컴포넌트는 *변수만* 참고, 하드코드 hex 금지.

**색 토큰**:
- `--paper` `#f4ead7` — 메인 배경
- `--paper-soft` `#fcf3e4` — 카드 배경
- `--ink` `#1a1a1a` — 강조 텍스트, 사용자 칩 배경
- `--heat` `#d36b2c` — 주황 액센트, 원형 전송 버튼
- `--gold` `#b9872c` — 황색 보조 (인터랙티브 강조)
- `--accent-green` `#2a6d57` — live / 자동 저장됨 인디케이터
- `--user-chip-bg` = `var(--ink)`, `--user-chip-fg` = `#ffffff`

**폰트 토큰**:
- `--font-body`: Pretendard chain
- `--font-display`: Newsreader chain
- `--font-mono`: JetBrains Mono chain

**마이크로 요소 규칙**:
- 사용자 칩: 검정 배경 + 흰 글자 + 오른쪽 정렬
- pair-chef 버블: 좌측 아바타 (28px 원, "셰" 한 글자) + paper-soft 배경
- 전송 버튼: 우하단 원형 32px, `--heat` 배경 + 흰 ↑
- 입력 박스: 좌하단 보조 액션 (`+ 사진`, `i 음성`) disabled 시그널

---

## 인계
- schema/엔진/라우트 변경 **N**
- UI 변경 **Y** — globals.css + layout.tsx (font) + BuildMode.tsx + page.tsx
- TASTE 보강 **Y** — §6 *잠정→확정*
- 새 ADR **Y** — D-026
