import type { ActivityInfo, BlogTopic, Guide, GrabTip, Leg, Place, ShopInfo, StayOption } from "@/lib/guideTypes";
import mapGuide from "./mapGuide.json";
import { CITY_NOTE, CITY_STAYS } from "./staysCity";
import arrivalVinpearl from "./staysArrivalVinpearl.json";
import { RESORT_STAYS } from "./staysResort";
import toursShopping from "./toursShopping.json";
import foodSouvenir from "./foodSouvenir.json";
import type { FoodGuide, SouvenirGuide } from "@/lib/guideTypes";

export const FOOD: FoodGuide = foodSouvenir.food as FoodGuide;
export const SOUVENIR: SouvenirGuide = foodSouvenir.souvenir as SouvenirGuide;

/** 조사 원문처럼 긴 가격 설명을 표용 한 줄로 줄이고, 원문은 priceDetail 로 보관 */
function firstClause(text: string, max = 40): string {
  const t = text.replace(/^\[[^\]]*\]\s*/, "").trim();
  const cut = t.search(/\s\(|\.\s|\[/);
  const head = (cut > 0 ? t.slice(0, cut) : t).trim();
  return head.length > max ? `${head.slice(0, max)}…` : head;
}
function compact(s: StayOption): StayOption {
  if (s.perNight.length < 60 && s.total.length < 60) return s;
  return {
    ...s,
    perNight: firstClause(s.perNight),
    total: firstClause(s.total),
    breakfast: firstClause(s.breakfast, 30),
    rating: s.rating.split(" — ")[0],
    priceDetail: `1박: ${s.perNight}\n\n총액: ${s.total}\n\n조식 요금: ${s.breakfast}`,
  };
}

// 조사 결과로 채우는 참고 데이터 (조사 완료 후 갱신)
export const GUIDE: Guide = {
  updatedAt: "2026-09-24",
  exchangeRate: mapGuide.exchangeRate,
  places: mapGuide.places as Place[],
  legs: mapGuide.legs as Leg[],
  grabTips: mapGuide.grabTips as GrabTip[],
  vinwondersAccess: mapGuide.vinwondersAccess,
  blogTopics: mapGuide.blogTopics as BlogTopic[],
  stays: [
    ...(arrivalVinpearl.arrival as StayOption[]).map(compact),
    ...CITY_STAYS,
    ...(arrivalVinpearl.vinpearl.map((s) => ({ ...s, area: "island" })) as StayOption[]).map(compact),
    ...RESORT_STAYS,
  ],
  staysNote:
    CITY_NOTE +
    "\n캄란 리조트 가격은 2026-09-24 밤 구글 호텔에서 성인 2명 + 4세 아이 1명으로 조회한 실시간 값이에요 (세금 포함, 원화). 사이트·시점마다 달라지고 최저가 보장은 아니에요. 아이 무료 조건은 호텔에 '성인 2 + 4세 기존 침대'로 직접 문의하면 더 쌀 수 있어요. 1만동 ≈ 550원 기준.",
  activities: toursShopping.activities as ActivityInfo[],
  activitiesNote: toursShopping.activitiesNote,
  shops: toursShopping.shops as ShopInfo[],
  shoppingSummary: toursShopping.shoppingSummary,
};

// 숙소 구역별 숙박 날짜 (고른 숙소 이름을 이 날들의 '숙소' 칸에 넣는다)
export const STAY_AREAS = {
  arrival: {
    title: "① 도착 첫날 · 공항 근처 (0.5박)",
    period: "10/3(토) 체크인 → 10/4(일) 체크아웃 · 1박 (실제 입실 10/4 새벽 1~2시)",
    nights: ["2026-10-03"],
    defaultLabel: "공항 근처 호텔 (새벽 도착 0.5박)",
    hint: "잠만 자고 아침 먹고 시내로 — 공항 10~15분, 24시간 프런트, 조식 좋은 곳. 10/3 날짜로 예약하고 새벽 도착을 미리 알려 두세요.",
  },
  city: {
    title: "② 나트랑 시내 (2박)",
    period: "10/4(일) 체크인 → 10/6(화) 체크아웃 · 2박",
    nights: ["2026-10-04", "2026-10-05"],
    defaultLabel: "시내 호텔",
    hint: "담시장·대성당·야시장, 빈원더스 선착장, 머드온천(북쪽)과 가까운 곳. 10/4 낮에 도착하니 이른 체크인/짐 보관 확인.",
  },
  island: {
    title: "②-B 빈원더스 섬 리조트 (시내 대신 고를 때)",
    period: "10/4(일) 체크인 → 10/6(화) 체크아웃 · 2박 — 시내 호텔과 둘 중 하나만 선택",
    nights: ["2026-10-04", "2026-10-05"],
    defaultLabel: "시내 호텔",
    hint: "빈원더스 바로 옆 · 투숙객 스피드보트 24시간(30분 간격, 7~15분). 대신 담시장·머드온천 갈 때마다 배+Grab 이동. 만 4세는 대부분 추가요금(나트랑베이 51만동/박 조식 포함) — 메리어트만 3인 조식 요금이 바로 나와요. 빈원더스 가족 1일권(성인2+아이1) 약 290만동 ≈ 15.2만원.",
  },
  resort: {
    title: "③ 캄란 리조트 (3박)",
    period: "10/6(화) 체크인 → 10/9(금) 체크아웃 · 3박",
    nights: ["2026-10-06", "2026-10-07", "2026-10-08"],
    defaultLabel: "캄란 리조트",
    hint: "판랑 사막투어·공항과 가까운 쪽. 10/10 01:35 출발 — 레이트 체크아웃(18시)·체크아웃 후 시설 이용·공항 셔틀을 같이 보세요.",
  },
} as const;
