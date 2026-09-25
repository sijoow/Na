// 숙소 동선 플랜 A/B/C — 숙소는 최대 3곳.
// 플랜을 바꾸면 지금 일정은 planDays 에 보관하고, 바꿀 플랜의 보관 일정(없으면 초안)을 불러온다.

import type { StayArea } from "./guideTypes";
import { createPlanDays } from "./seed";
import { chooseStay } from "./trip";
import type { Day, PlanId, TripState } from "./types";

export interface PlanArea {
  area: StayArea;
  title: string;
  period: string;
  nights: string[];
  defaultLabel: string;
  hint: string;
  /** 다른 구간의 대안(예: 시내 대신 빈펄 섬) */
  alternativeOf?: StayArea;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  stays: string[];
  moves: number;
  pros: string[];
  cons: string[];
  extra: string;
  areas: PlanArea[];
}

const N3 = ["2026-10-03"];
const CITY2 = ["2026-10-04", "2026-10-05"];
const CITY3 = ["2026-10-03", "2026-10-04", "2026-10-05"];
const RESORT3 = ["2026-10-06", "2026-10-07", "2026-10-08"];
const RESORT6 = ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];

export const PLANS: Plan[] = [
  {
    id: "A",
    name: "플랜 A · 공항 0.5박 + 시내 + 캄란",
    tagline: "새벽엔 가까운 데서 바로 자고, 시내 관광 → 리조트 휴식",
    stays: ["공항 근처 0.5박", "시내 2박", "캄란 3박"],
    moves: 2,
    pros: ["새벽 도착 후 10~15분이면 잠들 수 있음", "시내 관광(담시장·빈원더스·머드)이 가까움", "마지막은 공항 15분 리조트"],
    cons: ["짐을 2번 옮김 (10/4 오전, 10/6)", "숙소 3곳 예약 관리"],
    extra: "추가 이동: 10/4 오전 공항→시내 40분",
    areas: [
      { area: "arrival", title: "① 도착 첫날 · 공항 근처 (0.5박)", period: "10/3(토) 체크인 → 10/4(일) · 1박 (실제 입실 새벽 1~2시)", nights: N3, defaultLabel: "공항 근처 호텔 (새벽 도착 0.5박)", hint: "잠만 자고 아침 먹고 시내로 — 공항 10~15분, 24시간 프런트, 조식 좋은 곳." },
      { area: "city", title: "② 나트랑 시내 (2박)", period: "10/4(일) 체크인 → 10/6(화) · 2박", nights: CITY2, defaultLabel: "시내 호텔", hint: "담시장·야시장·빈원더스 케이블카역·머드온천과 가까운 곳. 이른 체크인/짐 보관 확인." },
      { area: "island", title: "②-B 빈원더스 섬 리조트 (시내 대신)", period: "10/4(일) → 10/6(화) · 2박 — 시내와 둘 중 하나", nights: CITY2, defaultLabel: "시내 호텔", hint: "빈원더스 바로 옆, 투숙객 보트 24시간. 대신 시내 갈 때마다 배+Grab.", alternativeOf: "city" },
      { area: "resort", title: "③ 캄란 리조트 (3박)", period: "10/6(화) 체크인 → 10/9(금) · 3박", nights: RESORT3, defaultLabel: "캄란 리조트", hint: "판랑 사막·공항과 가까움. 10/10 01:35 출발 — 레이트 체크아웃·공항 셔틀 확인." },
    ],
  },
  {
    id: "B",
    name: "플랜 B · 시내 3박 + 캄란 3박",
    tagline: "숙소 2곳, 짐은 딱 한 번만 옮겨요",
    stays: ["시내 3박", "캄란 3박"],
    moves: 1,
    pros: ["짐 이동 1번 (10/6)", "시내 관광 3일 내내 가까움", "숙소 예약이 단순"],
    cons: ["새벽 1시에 공항→시내 40분 이동 (아이 피곤)", "심야 Grab 요금이 조금 비쌈"],
    extra: "추가 이동: 10/4 새벽 공항→시내 40분 (심야)",
    areas: [
      { area: "city", title: "① 나트랑 시내 (3박)", period: "10/3(토) 체크인 → 10/6(화) · 3박 (실제 입실 10/4 새벽 2시쯤)", nights: CITY3, defaultLabel: "시내 호텔", hint: "10/3 날짜로 예약하고 새벽 도착을 꼭 미리 알리기 · 24시간 프런트 확인. 목록 가격은 2박 기준이라 1박 더 붙어요." },
      { area: "island", title: "①-B 빈원더스 섬 리조트 (시내 대신)", period: "10/3(토) → 10/6(화) · 3박 — 시내와 둘 중 하나", nights: CITY3, defaultLabel: "시내 호텔", hint: "섬 리조트도 새벽 입도 가능(하버 리셉션·보트 24시간) — 객실 도착은 새벽 3시쯤.", alternativeOf: "city" },
      { area: "resort", title: "② 캄란 리조트 (3박)", period: "10/6(화) 체크인 → 10/9(금) · 3박", nights: RESORT3, defaultLabel: "캄란 리조트", hint: "판랑 사막·공항과 가까움. 10/10 01:35 출발 — 레이트 체크아웃·공항 셔틀 확인." },
    ],
  },
  {
    id: "C",
    name: "플랜 C · 캄란 리조트 6박",
    tagline: "숙소 1곳, 짐 이동 없음 — 시내는 다녀오기",
    stays: ["캄란 리조트 6박"],
    moves: 0,
    pros: ["짐 이동 0번 · 아이 컨디션 관리 최고", "공항 10~15분 (도착·출국 모두)", "판랑 사막이 가까움 · 리조트 시설 매일 이용"],
    cons: ["시내 관광 날(10/4·10/5·10/6·10/8)마다 Grab 왕복 약 40분씩", "야시장·저녁 시내 일정 후 늦게 복귀"],
    extra: "추가 이동: 시내 왕복 4번 (Grab 1회 약 33~50만동 ≈ 1.7~2.6만원)",
    areas: [
      { area: "resort", title: "① 캄란 리조트 (6박)", period: "10/3(토) 체크인 → 10/9(금) · 6박 (실제 입실 10/4 새벽 1시쯤)", nights: RESORT6, defaultLabel: "캄란 리조트", hint: "10/3 날짜로 예약하고 새벽 도착 미리 알리기. 목록 가격은 3박 기준이라 6박이면 약 2배예요." },
    ],
  },
];

export const getPlan = (id: PlanId | undefined): Plan => PLANS.find((p) => p.id === (id ?? "A")) ?? PLANS[0];

/**
 * 플랜 전환: 지금 일정은 보관하고, 바꿀 플랜의 보관 일정(없으면 초안)을 불러온다.
 * 숙소 칸 이름은 불러온 일정 그대로 (고른 숙소 반영은 화면에서 chooseStay 로 이어서 처리).
 */
export function applyPlan(state: TripState, next: PlanId): TripState {
  const current = state.planId ?? "A";
  if (current === next) return state;
  const saved = { ...(state.planDays ?? {}), [current]: state.days };
  const days = saved[next] ?? createPlanDays(next);
  delete saved[next];
  return { ...state, planId: next, planDays: saved, days };
}

/** 플랜 전환 + 이미 고른 숙소 이름을 새 플랜의 숙박 날짜에도 채워 넣기 */
export function switchPlanState(
  state: TripState,
  id: PlanId,
  stays: readonly { id: string; name: string }[],
): TripState {
  let n = applyPlan(state, id);
  for (const a of getPlan(id).areas) {
    const chosenId = n.stayChoices?.[a.area];
    const opt = chosenId ? stays.find((o) => o.id === chosenId) : undefined;
    if (opt) n = chooseStay(n, a.area, opt.id, opt.name, a.nights);
  }
  return n;
}

/** 플랜의 날짜별 일정 (지금 플랜이면 현재 일정, 아니면 보관본 또는 초안) — 미리보기용 */
export function planDaysFor(state: TripState, id: PlanId): Day[] {
  if ((state.planId ?? "A") === id) return state.days;
  return state.planDays?.[id] ?? createPlanDays(id);
}
