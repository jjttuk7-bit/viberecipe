# DR2.T3 정합성 검증 — weld-trace

**최종 판정**: **PASS 결함 0**

## 라인 회귀
| 라인 | 본 사이클 | 판정 |
|------|----------|------|
| Line 1~6 / 신설 mutation 서브 | 변경 0 (요청 body / 응답 wrapper / 데이터 흐름 모두 무변) | **회귀 0** |

## 경계
| 경계 | 변경 | 판정 |
|------|------|------|
| A: 프롬프트 ↔ Zod | 0 | 회귀 0 |
| B: API 응답 ↔ 클라 | 0 (context_used optional 그대로) | 회귀 0 |
| B': 클라 body ↔ RequestBodySchema | 0 | 회귀 0 |
| C: Zod ↔ Supabase | 0 | 회귀 0 |
| D: StepEvent ↔ runtime.ts | 0 | 회귀 0 |
| E: Fingerprint traits ↔ 사용처 | FingerprintCard 위치만 이동 (page-footer-aside), 데이터 흐름 0 | 회귀 0 |
| F: StagePlan ↔ RecipeState keyof | 0 | 회귀 0 |
| G: context_used wrapper ↔ ContextMetaCardMini | 위치만 *recipe-side 하단 메타 블록*으로 이동, 필드 매핑 0 변경 | 회귀 0 |
| **H (신설)**: 우측 RecipeCanvas ↔ 좌측 mutation 콜백 | `applyMutation(m)`이 같은 BuildMode state를 갱신. RecipeCanvas는 props만 받음 (단방향) | PASS |

## 사용자 mutation / undo 무손상
- mutation: ArtifactCard 안 chip-remove (재료/도구) + gauge +/- 버튼 모두 `onMutate` 호출. RecipeCanvas로 위치 이동만, 함수 흐름 동일.
- undo: prevSnapshot 캡처/복원 모두 BuildMode 안. 변경 0.
- 옵션 칩: 최신 chef 버블 안에 인라인 렌더. submit(opt) 호출 흐름 동일.
- Warnings: 최신 chef 버블 안 인라인 (warning-inline).

## D-027 적용 검증
| 결정 | 적용 |
|------|------|
| 임베드 *공간 위치* 분리 | chat-side(채팅+옵션+경고) / recipe-side(산출물+메타) |
| 메타(plan/context) → recipe-side 하단 | canvas-meta-block 안 mini 변종 |
| ModifiedChips → recipe-side 헤더 옆 | canvas-modified 칩 |
| 옵션 칩 → 채팅 안 잔존 | 최신 chef 버블 안 인라인 |
| pipeline-rail 제거 | 헤더 쿡 모드 버튼 + Cook 종료 자동 진입 |
| runtime-inspector 분리 | FingerprintCard → page-footer-aside, session 메트릭 → dev-shelf |
| state 끌어올림 회피 | BuildMode가 두 영역 모두 렌더, state 단일 출처 |

## D-021 결과 섹션 추가 보강 필요
- "4-요소 패턴의 *공간 분리* (D-027)": 임베드가 *대화 옆 우측 sticky 패널*로 이동. 채팅에는 옵션 칩 + Warnings 인라인만. 메타는 RecipeCanvas 하단 *메타 블록* mini 변종.

## P0 회귀
A~E 5점검 모두 변경 0 ✅

## 자동 검증
- typecheck PASS
- 6/6 test PASS
- SSR 마커 8종 모두 매치 + 빈 상태 안내 텍스트 노출

## 결함
**없음.**

미세 메모:
- M-DR2-1: dead CSS — `.pipeline-rail`, `.pipeline-node`, `.node-*`, `.runtime-inspector`, `.workbench`, `.ide-grid`, `.command-grid` 등. 별도 cleanup 사이클.
- M-DR2-2: hand-test 권고 — 샘플 채우기 → 우측 RecipeCanvas에 큰 제목 + 재료 칩 + 단계 카드 노출 확인.
