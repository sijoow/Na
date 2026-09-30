"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { GUIDE } from "@/data/guide";
import restaurantsData from "@/data/restaurants.json";
import spasData from "@/data/spas.json";
import { formatShort } from "@/lib/date";
import { estimateAirport, estimateGrab, formatFare } from "@/lib/fare";
import type { Place } from "@/lib/guideTypes";
import { getPlan } from "@/lib/plans";
import type { Day, TripState } from "@/lib/types";
import type { MapCircle } from "./MapView";
import { card } from "./ui";

// 날짜별로 그날 묵는 호텔을 기준으로, 그날 일정 장소 · 아이랑 갈 맛집 · 가족 마사지가
// 어디에 있고 얼마나 걸리는지(도보/그랩 시간·요금) 지도와 목록으로 보여 준다

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[280px] animate-pulse rounded-3xl bg-surface-2" />,
});

type Area = "city" | "camranh" | "other";
type SpotKind = "plan" | "food" | "spa";
interface Spot {
  id: string;
  kind: SpotKind;
  placeKind: Place["kind"];
  name: string;
  localName: string;
  area: Area;
  lat: number;
  lng: number;
  note: string;
  tags: string[];
  /** 그날 일정에서 몇 시에 가는지 (일정 장소만) */
  time?: string;
}

const HOTELS = (getPlan("D").confirmed ?? []).map((h) => ({
  ...h,
  id: `hotel-${h.leg}`,
  short: h.name.includes("래디슨") ? "래디슨 블루" : h.name.includes("쉐라톤") ? "쉐라톤" : "베스트웨스턴",
  area: (h.name.includes("래디슨") ? "camranh" : "city") as Area,
}));
type Hotel = (typeof HOTELS)[number];

/** 그날 숙소 칸 이름으로 호텔 찾기 (플랜 D 확정 숙소) */
// 그날 숙소 칸 이름으로 호텔 찾기 (예전 이름 '마벨라'로 적힌 일정도 인식)
const HOTEL_WORDS: Record<string, string[]> = { "①": ["베스트", "마벨라"], "②": ["래디슨"], "③": ["쉐라톤"] };
function hotelForDay(day: Day): Hotel | undefined {
  return HOTELS.find((h) => (HOTEL_WORDS[h.leg] ?? [h.short]).some((w) => day.lodging.includes(w)));
}

// 일정 제목에 이 단어가 있으면 그 장소를 그날 지도에 표시
const PLAN_KEYWORDS: [string, string][] = [
  ["담시장", "dam-market"],
  ["야시장", "night-market"],
  ["빈원더스", "vinwonders-pier"],
  ["롯데마트", "lotte-mart"],
  ["사막", "nam-cuong-dunes"],
  ["포나가르", "po-nagar"],
  ["공항", "cam-ranh-airport"],
];
/** 지도에 함께 그리면 너무 멀어지는 곳(사막·공항)은 목록에만 */
const MAP_MAX_M = 20000;

const firstSentence = (t: string) => {
  const s = t.split(/(?<=[요다]\.)\s/)[0] ?? t;
  return s.length > 80 ? `${s.slice(0, 78)}…` : s;
};

const FOOD_SPOTS: Spot[] = restaurantsData.restaurants
  .filter((r) => r.lat !== null && r.lng !== null)
  .map((r) => ({
    id: `food-${r.id}`,
    kind: "food",
    placeKind: "food",
    name: r.name,
    localName: r.localName,
    area: r.area as Area,
    lat: r.lat as number,
    lng: r.lng as number,
    note: firstSentence(r.kidFriendly),
    tags: [r.hours.split(/[(,]/)[0].trim()].filter((t) => t.length > 0 && t.length < 30),
  }));
// 쉐라톤(조식 불포함) 근처에서 따로 찾은 아침·끼니 식당
const MEAL_SPOTS: Spot[] = restaurantsData.nearSheraton.spots.map((m) => ({
  id: `meal-${m.id}`,
  kind: "food",
  placeKind: "food",
  name: m.name,
  localName: m.localName,
  area: "city",
  lat: m.lat,
  lng: m.lng,
  note: firstSentence(m.kid),
  tags: [m.meal === "아침" ? "🍳 아침" : m.meal],
}));
const SPA_SPOTS: Spot[] = spasData.shops
  .filter((s) => s.lat !== null && s.lng !== null)
  .map((s) => ({
    id: `spa-${s.id}`,
    kind: "spa",
    placeKind: "spa",
    name: s.name,
    localName: s.localName,
    area: s.area as Area,
    lat: s.lat as number,
    lng: s.lng as number,
    note: "",
    tags: s.tags.slice(0, 3),
  }));

function planSpots(day: Day): Spot[] {
  const seen = new Set<string>();
  const out: Spot[] = [];
  for (const item of day.items) {
    // 괄호 안(예: "담시장 도보 5분")은 곁들인 설명이라 빼고 찾는다
    const title = item.title.replace(/\([^)]*\)/g, "");
    for (const [word, placeId] of PLAN_KEYWORDS) {
      if (!title.includes(word) || seen.has(placeId)) continue;
      const p = GUIDE.places.find((x) => x.id === placeId);
      if (!p) continue;
      seen.add(placeId);
      out.push({
        id: `plan-${placeId}`,
        kind: "plan",
        placeKind: p.kind,
        name: p.name,
        localName: p.localName,
        area: "other",
        lat: p.lat,
        lng: p.lng,
        note: item.title,
        tags: [],
        time: item.time,
      });
    }
    // 일정 제목에 식당·마사지샵 이름(첫 단어)이 있으면 그 가게도 그날 일정 장소로
    for (const s of [...FOOD_SPOTS, ...MEAL_SPOTS, ...SPA_SPOTS]) {
      const key = s.name.split(/[\s(]/)[0];
      if (key.length < 2 || !title.includes(key) || seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ ...s, kind: "plan", note: item.title, time: item.time });
    }
  }
  // 그날 공항 이동을 호텔 픽업·샌딩으로 예약했으면 공항 항목에도 표시 (그랩 요금 대신)
  const pickup = day.items.find((it) => /호텔 픽업|샌딩으로/.test(it.title));
  return out.map((s) => (s.id === "plan-cam-ranh-airport" && pickup ? { ...s, note: `${s.note} · ${pickup.title}` } : s));
}

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// 도로·걷는 길은 직선의 약 1.3배, 아이랑 분당 80m / 그랩은 시내 평균 시속 20km + 대기 2분 (먼 구간은 시속 45km)
const WALK_LIMIT_MIN = 15;
const roadKm = (m: number) => (m * 1.3) / 1000;
const walkMin = (m: number) => Math.round((roadKm(m) * 1000) / 80);
const driveMin = (m: number) => {
  const km = roadKm(m);
  return Math.round(km > 15 ? (km / 45) * 60 + 5 : (km / 20) * 60 + 2);
};
const WALK_10MIN_RADIUS_M = (10 * 80) / 1.3;

type Filter = "all" | SpotKind;
const FILTERS: [Filter, string][] = [
  ["all", "전체"],
  ["plan", "📍 그날 일정"],
  ["food", "🍜 맛집"],
  ["spa", "💆 마사지"],
];

export default function NearbyMap({ state }: { state: TripState }) {
  const days = state.days.filter((d) => hotelForDay(d) && d.items.length > 0 && !d.title.includes("출국 —"));
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const day = days.find((d) => d.id === dayId) ?? days[0];
  const hotel = day ? hotelForDay(day) : undefined;

  // (React Compiler가 알아서 메모이제이션하므로 직접 useMemo를 쓰지 않는다)
  const list = (() => {
    if (!day || !hotel) return [];
    const plan = planSpots(day);
    const planIds = new Set(plan.map((p) => p.id));
    const near = [...FOOD_SPOTS, ...MEAL_SPOTS, ...SPA_SPOTS].filter((s) => s.area === hotel.area && !planIds.has(s.id));
    return [...plan, ...near]
      .filter((s) => filter === "all" || s.kind === filter)
      .map((s) => ({ ...s, m: distanceM(hotel, s) }))
      // 그날 일정 장소는 시간 순, 맛집·마사지는 가까운 순
      .sort(
        (a, b) =>
          (a.kind === "plan" ? 0 : 1) - (b.kind === "plan" ? 0 : 1) ||
          (a.kind === "plan" ? (a.time ?? "").localeCompare(b.time ?? "") : a.m - b.m),
      );
  })();

  const places: Place[] = (() => {
    if (!hotel) return [];
    const toPlace = (s: { id: string; name: string; localName: string; lat: number; lng: number }, kind: Place["kind"]): Place => ({
      id: s.id,
      name: s.name.split(" (")[0],
      localName: s.localName,
      kind,
      lat: s.lat,
      lng: s.lng,
      address: "",
      note: "",
      source: "",
    });
    return [toPlace(hotel, "lodging-area"), ...list.filter((s) => s.m <= MAP_MAX_M).map((s) => toPlace(s, s.placeKind))];
  })();

  const circles: MapCircle[] = hotel
    ? [{ center: [hotel.lat, hotel.lng], radiusM: WALK_10MIN_RADIUS_M, color: "#0a8ea0" }]
    : [];

  if (!day || !hotel) {
    return (
      <div className={`${card} p-8 text-center text-ink-3`}>
        확정 숙소 일정(플랜 D)으로 바꾸면 날짜별 주변 지도가 나와요. 홈 → 플랜 D를 눌러 주세요.
      </div>
    );
  }

  const select = (id: string) => {
    setSelectedId(id);
    document.getElementById(`near-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="space-y-4">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">날짜별 동선 체크</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">
          {formatShort(day.date)} · 🏨 {hotel.short}에서 어디까지 얼마
        </h2>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {days.map((d) => {
            const h = hotelForDay(d);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDayId(d.id);
                  setSelectedId(null);
                }}
                aria-pressed={d.id === day.id}
                className={`press min-h-12 shrink-0 rounded-2xl px-3 text-left ${
                  d.id === day.id ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
                }`}
              >
                <span className="block text-[14px] font-bold">{formatShort(d.date)}</span>
                <span className="block text-[11px] opacity-80">{h?.short}</span>
              </button>
            );
          })}
        </div>

        {/* 그날 일정 한눈에 */}
        <details className="mt-3 rounded-2xl bg-surface-2 px-4 py-3" open>
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">
            📅 {day.title} ({day.items.length}개)
          </summary>
          <ol className="mt-2 space-y-1 text-[13px]">
            {day.items.map((it) => (
              <li key={it.id} className="flex gap-2">
                <span className="w-11 shrink-0 font-semibold text-ink-3 tabular-nums">{it.time || "--:--"}</span>
                <span className="min-w-0 text-ink-2">{it.title}</span>
              </li>
            ))}
          </ol>
        </details>

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`press min-h-10 shrink-0 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap ${
                filter === k ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
          점선 원은 호텔에서 아이랑 걸어서 10분 거리예요. 도보 {WALK_LIMIT_MIN}분이 넘으면 그랩 시간·요금으로 보여 줘요. 요금은 Grab 공식 요금표(2026-07)에 수수료를 더한 어림값이고, 앱 사전견적이 실제 요금이에요. 해외카드는 4% 수수료가 붙으니 현금 결제를 추천해요.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="h-[45vh] min-h-[280px] md:h-[48vh] md:min-h-[320px] lg:h-[calc(100dvh-9rem)]">
            <MapView
              places={places}
              highlightIds={[]}
              paths={[]}
              circles={circles}
              selectedPlaceId={selectedId ?? hotel.id}
              onSelectPlace={select}
            />
          </div>
        </div>

        <ol className={`${card} divide-y divide-line self-start overflow-hidden`}>
          {list.map((s) => {
            const w = walkMin(s.m);
            const walk = w <= WALK_LIMIT_MIN;
            const km = roadKm(s.m);
            const fareText =
              s.id === "plan-cam-ranh-airport" && /픽업|샌딩/.test(s.note)
                ? "예약한 픽업·샌딩 차량"
                : s.id === "plan-cam-ranh-airport"
                ? `그랩 7인승 공항 고정요금 ${formatFare(estimateAirport(7, s.time !== undefined && s.time < "06:00"))}`
                : s.id === "plan-nam-cuong-dunes"
                  ? "사막투어 차량 (투어 요금에 포함)"
                  : `그랩 4인승 ${formatFare(estimateGrab(km, driveMin(s.m), 4))}`;
            return (
              <li
                key={s.id}
                id={`near-${s.id}`}
                className={`scroll-mt-28 px-4 py-3 ${selectedId === s.id ? "bg-primary-soft" : s.kind === "plan" ? "bg-accent-soft/40" : ""}`}
              >
                <button type="button" onClick={() => select(s.id)} className="flex w-full items-start gap-3 text-left">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[16px]">
                    {s.kind === "food" ? "🍜" : s.kind === "spa" ? "💆" : "📍"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-snug font-bold">
                      {s.time && <span className="mr-1 text-[12px] font-bold text-accent tabular-nums">{s.time}</span>}
                      {s.name}
                    </span>
                    {s.note && <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{s.kind === "food" ? "🧒 " : ""}{s.note}</span>}
                    {!walk && (
                      <span className="mt-0.5 block text-[12px] font-semibold text-ink-2 tabular-nums">🚕 {fareText}</span>
                    )}
                    {s.tags.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                            {t}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    {walk ? (
                      <>
                        <span className="block text-[14px] font-bold text-primary-ink tabular-nums">🚶 {w}분</span>
                        <span className="block text-[11px] text-ink-4">걸어서 · 무료</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-[14px] font-bold text-ink tabular-nums">🚕 {driveMin(s.m)}분</span>
                        <span className="block text-[11px] text-ink-4">그랩</span>
                      </>
                    )}
                    <span className="block text-[11px] text-ink-4 tabular-nums">
                      {s.m < 1000 ? `${Math.round(s.m / 10) * 10}m` : `${(s.m / 1000).toFixed(1)}km`}
                    </span>
                  </span>
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${hotel.lat},${hotel.lng}&destination=${s.lat},${s.lng}&travelmode=${walk ? "walking" : "driving"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 ml-11 inline-block text-[12px] font-semibold text-ink-3 underline"
                >
                  {walk ? "걷는 길 보기" : "차로 가는 길 보기"} ↗
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
