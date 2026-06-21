# DR1.T2 UI 변경 보고서 — 시각 시스템 적용

**일자**: 2026-06-21
**범위**: layout.tsx (next/font) + globals.css :root 토큰 갱신 + 마이크로 요소 + 헤더 변경

## 변경 파일

### `app/layout.tsx`
- `Newsreader` / `JetBrains_Mono` `next/font/google` 등록 → CSS 변수 `--font-newsreader` / `--font-jetbrains-mono` 자동 노출.
- `<html>` className에 `${newsreader.variable} ${jetbrainsMono.variable}` 적용.

### `app/globals.css`
**`:root` 변수 갱신 (D-026 SSOT)**:
- 색: `--ink #1a1a1a`, `--paper #f4ead7`, `--paper-soft #fcf3e4`, `--heat #d36b2c` 유지, `--gold #b9872c` 유지
- **신규**: `--accent-green #2a6d57`, `--user-chip-bg = var(--ink)`, `--user-chip-fg #ffffff`
- **폰트 변수**:
  - `--font-body`: Pretendard chain (시스템 fallback)
  - `--font-display`: Newsreader chain
  - `--font-mono`: JetBrains Mono chain
- **호환 별칭**: `--mono`/`--serif`가 새 변수로 매핑 (기존 클래스가 `var(--mono)`/`var(--serif)` 사용 → 자연 전환)

**body**: `font-family: var(--font-body)` (Pretendard chain 자동 적용)

**신규 클래스**:
- 헤더: `.brand-line`, `.brand-dot`, `.brand-name`, `.brand-sep`, `.brand-recipe`, `.autosave-pill`, `.autosave-dot`, `.cook-mode-btn`
- 입력: `.build-input-aux`, `.aux-chip`, `.build-input-trailing`, `.send-btn`, `.send-count`
- 아바타: `.chef-avatar`, `.chat-bubble-body-wrap`
- **수정**: `.chat-bubble`(flex gap), `.bubble-user .bubble-body`(검정 user chip), `.build-input`(radius 10, padding 14/16/12)

### `components/BuildMode.tsx`
- `<ChatBubble role="chef">` 분기 — 좌측 `<span class="chef-avatar">셰</span>` + `<div class="chat-bubble-body-wrap">` 안에 speaker + body. user 분기는 기존 그대로 (오른쪽 정렬).
- `<div className="build-input-actions">` 재구조화:
  - 좌측 `.build-input-aux` — `+ 사진` / `⏵ 음성` disabled 시그널 + `↶ 직전 취소` (prevSnapshot 있을 때만 실 작동) + `샘플`
  - 우측 `.build-input-trailing` — `pendingUserCount > 0`일 때 `{N}개 수정` 카운트 + 원형 주황 `.send-btn`(↑ / 전송 중 시 …)
- `aux-chip`은 시각상 통일 (disabled 시그널은 cursor only로 구분)

### `app/page.tsx`
- 헤더 `brand-block`:
  - 기존 eyebrow `PAIR-COOKING IDE` 제거
  - 신규 `<span class="brand-line">` — `• vibe recipe · {recipeState.name} · {초안|완성}` 패턴
  - h1 / p 그대로 (시각상 백업)
- 헤더 `status-cluster`:
  - 기존 3-pill (auth:armed / recipe:linked / mode.mode) 제거
  - 신규 `<span class="autosave-pill">` (녹 점 + "자동 저장됨")
  - 신규 `<button class="cook-mode-btn">쿡 모드 →</button>` (canCook 조건부 활성)
- dev-shelf (auth/recipe_id 디버그 패널) 그대로 보존 — *접힌 상태*

## 디자인 시스템 매핑 (스크린샷 → 코드)

| 스크린샷 요소 | 본 구현 |
|--------------|--------|
| 0001 헤더 `• vibe recipe \| 들기름 두부김치 · 초안` | `.brand-line` (점 + name + recipe + draft status) |
| 0001 우측 `자동 저장됨` + `쿡 모드 →` | `.autosave-pill` + `.cook-mode-btn` |
| 0001 pair-chef 아바타 (셰) | `.chef-avatar` 28px 원 + `셰` 한 글자 |
| 0001 사용자 칩 검정 박스 + 흰 글자 | `.bubble-user .bubble-body { background: var(--user-chip-bg); color: var(--user-chip-fg); }` |
| 0001 입력 박스 좌하단 `+ 사진` `i 음성` | `.build-input-aux` 안 `.aux-chip` (disabled 시그널) |
| 0001 입력 박스 우하단 원형 주황 ↑ | `.send-btn` (36px round, `var(--heat)`, ↑ 아이콘) |
| 0001 옵션 칩 입력 위 row | 기존 `.option-chips` 그대로 (LatestEmbeds 안, D-021 옵션 칩 정합) |
| 0002 색 5종 | `:root` 변수 5색 + 보조 토큰 |
| 0002 폰트 3종 | next/font + CSS 변수 chain |

## 헌법 매핑

| ADR | 본 변경 적용 |
|-----|-------------|
| D-002 | 임베드/diff 정신 무변 — 사용자 칩 *시각* 변경만 |
| D-021 | 4-요소 패턴 그대로. *시각 디자인 시스템* 정의 추가 (D-026이 SSOT) |
| D-022 | 인터랙티브 칩 X / +/-는 그대로 작동 — 시각 토큰만 갱신 |
| D-023 | 직전 취소 동작 그대로 — aux-chip 안에 배치 |
| D-024/D-025 | Plan/Context 카드 시각 그대로 (`var(--paper)`/`var(--panel)` 토큰 자동 반영) |
| TASTE §6 | 디자인 톤 *잠정 → 확정* 명문화 (DR1.T4) |

## 잔존 위험 (DR1.T3 inspector 인계)

- **R-DR1-1**: 기존 `--mono`/`--serif` 사용처가 새 변수 chain으로 자동 전환 — 호환 별칭으로 처리. 직접 hex 사용은 본 사이클 새로 추가 X.
- **R-DR1-2**: `.status-pill` 등 dead 클래스가 globals.css에 잔존 — 본 사이클 비범위 (DR2/cleanup).
- **R-DR1-3**: Pretendard 미설치 환경은 시스템 fallback (`-apple-system` 등)으로 자연 표시. 디자인 의도 *유사*. 정식 등록은 다음 사이클.
- **R-DR1-4**: `aux-chip` 4종(사진/음성/직전 취소/샘플) 중 *작동하는 건 직전 취소/샘플*뿐. 시각 일치를 위해 같은 클래스 사용 — 사용자가 disabled 시그널을 인지할 수 있게 cursor 분기.
- **R-DR1-5**: 모바일에서 `.cook-mode-btn` + `.autosave-pill`이 헤더 한 줄에 못 들어갈 수 있음. `.command-header` 3-col grid는 그대로라 모바일 1-col 시 자동 wrap.

## 자동 검증
- `npm run typecheck` → **PASS**
- `npm test` → **6/6 PASS**
- dev SSR 마커:
  - `brand-line`, `brand-dot`, `brand-name` ✅
  - `autosave-pill`, `autosave-dot`, `cook-mode-btn` ✅
  - `chef-avatar`, `send-btn`, `aux-chip` ✅
  - 텍스트 "vibe recipe", "자동 저장됨", "쿡 모드" ✅
