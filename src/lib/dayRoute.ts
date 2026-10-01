// 하루 일정의 장소를 순서대로 이어 '그날 동선'을 구글 지도 길찾기 링크로 만든다.
// 아침에 일어난 숙소(전날 숙소)에서 출발해 그날 마지막 장소까지. 새벽 비행 구간(06시 전)·배달은 빼고,
// 숙소 안 식당·수영장은 숙소로 본다. 구글 지도는 경유지를 9곳까지 받아서 넘으면 링크를 나눈다.
import restaurantsData from "@/data/restaurants.json";
import { findPlace, type PlaceMatch } from "./placeMatch";
import { getPlan } from "./plans";
import type { Day } from "./types";

export interface RouteStop {
  name: string;
  lat: number | null;
  lng: number | null;
  query: string;
}

export interface DayRoute {
  stops: RouteStop[];
  url: string;
}

/** 출발 + 경유 9 + 도착 */
const MAX_POINTS = 11;

const short = (name: string) => name.replace(/\s*\(.*$/, "").trim();

const HOTEL_WORDS: [string, RegExp][] = [
  ["①", /베스트|마벨라/],
  ["②", /래디슨/],
  ["③", /쉐라톤/],
];
const HOTEL_NAME: Record<string, string> = { "①": "베스트웨스턴", "②": "래디슨 블루", "③": "쉐라톤" };
const HOTELS: RouteStop[] = (getPlan("D").confirmed ?? []).map((h) => ({
  name: HOTEL_NAME[h.leg] ?? short(h.name),
  lat: h.lat,
  lng: h.lng,
  query: "",
}));
const LEGS = (getPlan("D").confirmed ?? []).map((h) => h.leg);

function hotelOf(text: string): RouteStop | null {
  const leg = HOTEL_WORDS.find(([, re]) => re.test(text))?.[0];
  const i = leg ? LEGS.indexOf(leg) : -1;
  return i >= 0 ? HOTELS[i] : null;
}

const meters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
// 숙소에서 100m 안이면 숙소로 (래디슨 선라이즈 0m · 쉐라톤 1층 피자포피스 34m). 골드코스트몰(쉐라톤에서 약 200m)은 따로 간다
const insideHotel = (s: RouteStop) =>
  s.lat === null || s.lng === null
    ? null
    : (HOTELS.find((h) => h.lat !== null && h.lng !== null && meters(h.lat, h.lng, s.lat!, s.lng!) <= 100) ?? null);

// 좌표가 없는 장소(과일 가이드의 65번 과일가게 등)는 맛집 탭의 같은 가게 좌표를 쓴다 — 이름 검색은 옆 가게가 잡힐 수 있다
const norm = (s: string) => short(s).replace(/\s/g, "");
function toStop(p: PlaceMatch): RouteStop {
  const name = short(p.name).replace(/ & 골드코스트몰$/, "");
  if (p.lat !== null && p.lng !== null) return { name, lat: p.lat, lng: p.lng, query: p.query };
  const same = restaurantsData.restaurants.find((r) => typeof r.lat === "number" && norm(r.name) === norm(p.name));
  return { name, lat: same?.lat ?? null, lng: same?.lng ?? null, query: p.query };
}
const point = (s: RouteStop) => (s.lat !== null && s.lng !== null ? `${s.lat},${s.lng}` : s.query);

function routeUrl(stops: RouteStop[]): string {
  const [origin, ...rest] = stops;
  const destination = rest.pop() as RouteStop;
  const params = new URLSearchParams({ api: "1", origin: point(origin), destination: point(destination), travelmode: "driving" });
  if (rest.length) params.set("waypoints", rest.map(point).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** prevLodging: 전날 숙소(그날 아침 출발지). 첫날(한국 출발)은 동선이 없다 */
export function dayRoutes(day: Day, prevLodging: string | null): DayRoute[] {
  if (!prevLodging) return [];
  const stops: RouteStop[] = [];
  const start = hotelOf(prevLodging);
  if (start) stops.push(start);
  for (const item of day.items) {
    if (item.time && item.time < "06:00") continue;
    if (/배달/.test(item.title)) continue;
    const p = findPlace(item);
    if (!p || p.kind === "delivery") continue;
    const base = p.kind === "hotel" ? (hotelOf(p.name) ?? toStop(p)) : toStop(p);
    const stop = insideHotel(base) ?? base;
    if (!point(stop)) continue;
    const last = stops[stops.length - 1];
    if (last && point(last) === point(stop)) {
      // 같은 곳에 이어지는 다른 장소(케이블카 탑승장 → 빈원더스)는 이름만 붙인다
      if (!last.name.includes(stop.name) && !HOTELS.includes(last)) stops[stops.length - 1] = { ...last, name: `${last.name} · ${stop.name}` };
      continue;
    }
    stops.push(stop);
  }
  if (stops.length < 2) return [];
  const routes: DayRoute[] = [];
  for (let i = 0; i < stops.length - 1; i += MAX_POINTS - 1) {
    const chunk = stops.slice(i, i + MAX_POINTS);
    if (chunk.length >= 2) routes.push({ stops: chunk, url: routeUrl(chunk) });
  }
  return routes;
}
