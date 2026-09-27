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

/** 예약을 마친 숙소 (확정 플랜에서 숙소 고르기 대신 보여 줌) */
export interface ConfirmedStay {
  leg: string;
  name: string;
  localName: string;
  address: string;
  lat: number;
  lng: number;
  period: string;
  checkInOut: string;
  room: string;
  kids: string;
  tips: string[];
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
  confirmed?: ConfirmedStay[];
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
  // 2026-09-27 예약 확정: ① 마벨라 3박 → ② 래디슨 블루 캄란 2박 → ③ 쉐라톤 2박
  {
    id: "D",
    name: "플랜 D · 확정 숙소 (마벨라 → 래디슨 블루 → 쉐라톤)",
    tagline: "✅ 예약 확정 — 시내 남쪽 3박 → 캄란 리조트 2박 → 시내 중심 2박",
    stays: ["마벨라 3박", "래디슨 블루 2박", "쉐라톤 2박"],
    moves: 2,
    pros: [
      "마벨라는 빈원더스 케이블카역이 가까워요",
      "판랑 사막은 래디슨 가는 날 캄란 픽업으로 (가깝고 추가요금 없음)",
      "마지막 2박 쉐라톤은 롯데마트·야시장·마사지 도보권, 출국 전까지 방 사용",
    ],
    cons: ["짐 이동 2번 (10/6, 10/8)", "마벨라에서 담시장·야시장은 그랩 (약 13분)"],
    extra: "이동: 10/4 새벽 공항→마벨라 약 50분 · 10/6 마벨라→래디슨 약 40분 · 10/8 래디슨→아이리조트→쉐라톤 · 10/9 밤 쉐라톤→공항 약 50분",
    areas: [],
    confirmed: [
      {
        leg: "①",
        name: "베스트 웨스턴 프리미어 마벨라 나트랑",
        localName: "Best Western Premier Marvella Nha Trang",
        address: "102B Trần Phú, Nha Trang",
        lat: 12.22493,
        lng: 109.20087,
        period: "10/3(토) 체크인 → 10/6(화) 체크아웃 · 3박 (실제 입실 10/4 새벽 2~3시)",
        checkInOut: "체크인 14:00 · 체크아웃 12:00 · 24시간 프런트 · 18시까지 레이트 체크아웃 받은 사례 (2026-08)",
        room: "셋이면 디럭스 킹 34㎡나 디럭스 트윈 36㎡(침대 붙여 달라고 요청). 욕실 벽이 유리라 블라인드를 내려서 써요",
        kids: "만 5세 미만 숙박 무료 · 5세 이하 조식 무료 · 유아침대 없음 · 31층 인피니티풀 아이 구역(06~19시, 그늘 없음) · 키즈클럽 09~21시",
        tips: [
          "rsvn@bwpremiermarvella.com 으로 '10/4 02:00 도착, 노쇼 처리 금지' 메일 보내고 답장 받기 (새벽 입실 실제 후기는 못 찾음)",
          "31층 루프탑 풀 운영 여부 확인 (2026-05 공사 후기, 9월에는 정상 운영)",
          "조식은 5층 Marvellous(06~10시)가 가짓수 많고 쌀국수가 더 맛있어요. 조식 시간엔 엘리베이터가 붐벼요",
          "공항 픽업은 호텔 4인승 야간 40만동, 그랩 약 35만~43만동",
        ],
      },
      {
        leg: "②",
        name: "래디슨 블루 리조트 캄란",
        localName: "Radisson Blu Resort Cam Ranh",
        address: "Bãi Dài, Cam Lâm, Khánh Hòa (캄란 롱비치)",
        lat: 12.0969,
        lng: 109.1956,
        period: "10/6(화) 체크인 → 10/8(목) 체크아웃 · 2박",
        checkInOut: "체크인 15:00 (23:00까지) · 체크아웃 12:00 · 체크아웃 뒤에도 짐 보관·수영장·비치 이용, 2층 헬스장 샤워실 24시간",
        room: "12세 미만 1명은 기존 침대 무료 · 디럭스·이그제큐티브는 아이 최대 1명 · 엑스트라베드 유료 (유아침대 무료는 3세 이하)",
        kids: "조식 5세 이하 무료 · 키즈클럽(색칠·주방놀이, 4살 취향 후기) · 레인포레스트 워터파크 키즈 슬라이드 키 90cm 이상 09:30~17:30",
        tips: [
          "시내 셔틀: 리조트→시내 09:15 무료 · 11:15 유료(1인 5.5만동) / 시내→리조트 16:00 무료 · 21:00 유료 — 골드코스트 서문(맥도날드 옆), 24시간 전 예약",
          "공항 셔틀 무료 (08:30·11:00·17:00·22:00대)",
          "리조트 안 식당이 적어요. 저녁은 K10 해산물거리 랑짜이·타오티엔(그랩 5분)이나 깜란 스푼(한식)",
          "모벤픽 워터파크 무료 이용은 후기가 엇갈려요 — 프런트에 확인",
        ],
      },
      {
        leg: "③",
        name: "쉐라톤 나트랑 호텔 & 스파",
        localName: "Sheraton Nha Trang Hotel & Spa",
        address: "26-28 Trần Phú, Nha Trang",
        lat: 12.2462559,
        lng: 109.1958797,
        period: "10/8(목) 체크인 → 10/10(토) 체크아웃 · 2박 (10/9 밤 22시쯤 공항으로)",
        checkInOut: "체크인 15:00 · 2박이라 10/9 밤 출발 전까지 방을 써요 · 짐 보관 가능",
        room: "게스트룸 킹 오션뷰 33㎡ (킹 1개에 셋) · 침대가드 요청 가능 (유아침대 대신)",
        kids: "만 5세 이하 조식 무료 · 6층 인피니티풀 + 유아풀(0.3m) · 무료 키즈클럽 09~19시 · 놀이터",
        tips: [
          "롯데마트 골드코스트 도보 4분, 야시장 12분, 해변 1분, 담시장 18분(그랩 5분)",
          "가까운 마사지: 타이니 키즈&패밀리 스파 도보 7분(놀이방), 그랜드스파 11분(21:45 무료 공항 조인샌딩)",
          "10/9 출국: 힐스파 2인 90분 이상이면 공항 샌딩 무료(카톡 사전 신청) 또는 그랩 7인승 약 41만~43만동",
          "10/8 체크인 전에 도착하면 짐만 맡기고 롯데마트부터",
        ],
      },
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
