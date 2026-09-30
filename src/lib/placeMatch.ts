// 일정 항목 제목에서 그 일정에 가는 장소(식당·시장·투어·마사지·숙소·공항)를 찾는다.
// 일정 카드는 찾은 장소의 정보를 펼쳐 보여 주고, 구글 지도 길찾기(현재 위치 → 그곳)를 붙인다.
// 규칙: 'A → B' 는 도착지 B부터 보고, 그다음 제목 전체에서 일정 분류(식사면 식당)에 맞는 곳을 고른다.

import { GUIDE } from "@/data/guide";
import restaurantsData from "@/data/restaurants.json";
import spasData from "@/data/spas.json";
import { getPlan } from "./plans";
import type { Category, PlanItem } from "./types";

export type PlaceKind =
  | "restaurant" // 맛집 탭 식당 (메뉴판 포함)
  | "meal" // 쉐라톤 근처 끼니 식당
  | "delivery" // 래디슨 저녁 배달
  | "spa"
  | "shop" // 시장·마트·야시장
  | "fruit" // 과일가게 (맛집 탭 과일 가이드와 같은 카드)
  | "activity" // 빈원더스·사막투어
  | "hotel" // 확정 숙소 ①②③
  | "place"; // 지도 장소 (공항 등)

export interface PlaceMatch {
  kind: PlaceKind;
  /** 원본 자료의 id (숙소는 ①②③) */
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  /** 좌표가 없을 때 쓰는 구글 지도 검색어 ('' 이면 길찾기 없음) */
  query: string;
}

interface Entry extends PlaceMatch {
  aliases: string[];
}

/** 띄어쓰기·기호를 빼고 비교한다 ("힐 스파" = "힐스파", "Pizza 4P's" = "pizza4ps") */
const norm = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s'’`·.,:;!?&()\-–—]/g, "");
const HANGUL = /[가-힣]/;

// 이 말 하나만으로는 어느 가게인지 알 수 없어서 별칭으로 쓰지 않는다
const STOP = new Set(
  [
    "나트랑", "냐짱", "캄란", "깜란", "판랑", "혼째", "베트남", "시내", "호텔", "리조트", "골드코스트", "빈펄",
    "해변", "공항", "시장", "마트", "식당", "카페", "마사지", "스파", "해산물", "쌀국수", "한식", "배달",
    "그랩", "픽업", "아이", "아기", "어린이", "키즈", "가족",
    "nhatrang", "camranh", "vietnam", "khanhhoa", "hotel", "resort", "restaurant", "cafe", "spa",
  ].map(norm),
);

/**
 * 이름에서 비교할 별칭을 만든다. 괄호 안은 '(골드코스트점)', '(구매·대여 정리)' 같은 설명이라 쓰지 않고,
 * 현지 이름은 localName 으로 본다. firstWord 는 가게 이름에만 — 지도 탭과 같은 규칙 ("피자포피스 쉐라톤점" → 피자포피스)
 */
function aliasesOf(name: string, localName = "", extra: string[] = [], firstWord = false): string[] {
  const out = new Set<string>();
  const add = (raw: string) => {
    const a = norm(raw);
    if (a.length >= (HANGUL.test(a) ? 2 : 4) && !STOP.has(a)) out.add(a);
  };
  const base = name.replace(/\([^)]*\)/g, " ").trim();
  add(base);
  if (firstWord) add(base.split(/\s+/)[0] ?? "");
  add(localName.split(/[,(–—·/]/)[0] ?? "");
  extra.forEach(add);
  return [...out];
}

// 확정 숙소는 부르는 이름이 여러 가지라 직접 적는다 (예전 이름 '마벨라' 포함)
const HOTEL_WORDS: Record<string, string[]> = {
  "①": ["베스트웨스턴", "마벨라", "Best Western", "Marvella"],
  "②": ["래디슨", "Radisson"],
  "③": ["쉐라톤", "Sheraton"],
};

// 지도 장소는 이름이 길거나 제각각이라 지도 탭(NearbyMap)처럼 키워드로 찾는다.
// 같은 곳의 투어·쇼핑 자료가 있으면 그쪽(요금·팁이 있는 카드)으로 연결한다.
// 세 번째 칸: 길찾기를 다른 장소로 (빈원더스는 그랩으로 케이블카 탑승장까지 가니까)
const PLACE_KEYWORDS: [placeId: string, words: string[], routeVia?: string][] = [
  ["dam-market", ["담시장", "Chợ Đầm"]],
  ["night-market", ["야시장", "Chợ Đêm"]],
  ["lotte-mart", ["롯데마트"]],
  ["vinwonders", ["빈원더스", "VinWonders"], "vinwonders-pier"],
  ["vinwonders-pier", ["케이블카역", "케이블카 탑승장"]],
  ["nam-cuong-dunes", ["사막", "Nam Cương"]],
  ["cam-ranh-airport", ["캄란국제공항", "캄란공항"]],
  ["po-nagar", ["포나가르"]],
];

function keywordEntry([placeId, words, routeVia]: (typeof PLACE_KEYWORDS)[number]): Entry | null {
  const place = GUIDE.places.find((p) => p.id === placeId);
  if (!place) return null;
  const route = GUIDE.places.find((p) => p.id === routeVia) ?? place;
  const aliases = aliasesOf("", "", words);
  const at = { lat: route.lat, lng: route.lng, query: route.localName, aliases };
  const activity = GUIDE.activities.find((a) => a.placeId === placeId);
  if (activity) return { kind: "activity", id: activity.id, name: activity.name, ...at };
  const keys = words.map(norm);
  const shop = GUIDE.shops.find((s) => keys.some((k) => norm(`${s.name}${s.localName}`).includes(k)));
  if (shop) return { kind: "shop", id: shop.id, name: shop.name, ...at, lat: shop.lat ?? route.lat, lng: shop.lng ?? route.lng };
  return { kind: "place", id: place.id, name: place.name, ...at };
}

// 같은 점수면 앞에 있는 쪽 (맛집 탭 식당 > 쉐라톤 끼니 식당)
const ENTRIES: Entry[] = [
  ...(getPlan("D").confirmed ?? []).map<Entry>((h) => ({
    kind: "hotel",
    id: h.leg,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    query: `${h.localName} ${h.address}`,
    aliases: aliasesOf("", "", HOTEL_WORDS[h.leg] ?? [h.name]),
  })),
  // 과일가게는 같은 이름의 맛집(예: 65번 과일가게)보다 먼저 — 1kg 시세·과일 살 때 쓰는 말이 있는 카드
  ...GUIDE.shops
    .filter((s) => s.kind === "fruit")
    .map<Entry>((s) => ({
      kind: "fruit",
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      query: `${s.localName}, ${s.address.split(" (")[0]}`,
      aliases: aliasesOf(s.name, s.localName),
    })),
  ...restaurantsData.restaurants.map<Entry>((r) => ({
    kind: "restaurant",
    id: r.id,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    query: `${r.localName} Nha Trang`,
    aliases: aliasesOf(r.name, r.localName, [], true),
  })),
  ...restaurantsData.nearSheraton.spots.map<Entry>((m) => ({
    kind: "meal",
    id: m.id,
    name: m.name,
    lat: m.lat,
    lng: m.lng,
    query: `${m.localName} Nha Trang`,
    aliases: aliasesOf(m.name, m.localName, [], true),
  })),
  { kind: "delivery", id: "radisson-delivery", name: "래디슨 저녁 배달", lat: null, lng: null, query: "", aliases: aliasesOf("", "", ["배달K"]) },
  ...spasData.shops.map<Entry>((s) => ({
    kind: "spa",
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    query: `${s.localName} Nha Trang`,
    aliases: aliasesOf(s.name, s.localName, [], true),
  })),
  ...PLACE_KEYWORDS.map(keywordEntry).filter((e): e is Entry => e !== null),
  ...GUIDE.shops.filter((s) => s.kind !== "fruit").map<Entry>((s) => ({
    kind: "shop",
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    query: `${s.localName} Nha Trang`,
    aliases: aliasesOf(s.name, s.localName),
  })),
  ...GUIDE.activities.map<Entry>((a) => {
    const via = PLACE_KEYWORDS.find(([id]) => id === a.placeId)?.[2];
    const p = GUIDE.places.find((x) => x.id === (via ?? a.placeId));
    return { kind: "activity", id: a.id, name: a.name, lat: p?.lat ?? null, lng: p?.lng ?? null, query: p?.localName ?? "", aliases: aliasesOf(a.name) };
  }),
];

// 일정 분류별로 먼저 고를 장소 종류 (식사 일정에 호텔 이름이 섞여 있어도 식당을 고른다)
const PREFER: Record<Category, PlaceKind[]> = {
  food: ["fruit", "restaurant", "meal", "delivery"],
  shopping: ["shop"],
  activity: ["activity", "spa", "place"],
  sightseeing: ["place", "activity", "shop"],
  rest: ["spa", "hotel"],
  move: [],
  etc: [],
};

function best(text: string, prefer: PlaceKind[]): { entry: Entry; preferred: boolean } | null {
  const t = norm(text);
  let hit: Entry | null = null;
  let top = 0;
  for (const e of ENTRIES) {
    for (const a of e.aliases) {
      if (!t.includes(a)) continue;
      // 긴 이름일수록 정확하고, 일정 분류에 맞는 종류면 크게 앞선다
      const score = a.length + (prefer.includes(e.kind) ? 100 : 0);
      if (score > top) {
        hit = e;
        top = score;
      }
    }
  }
  return hit ? { entry: hit, preferred: top >= 100 } : null;
}

const noParens = (s: string) => s.replace(/\([^)]*\)/g, " ");
const toMatch = (e: Entry): PlaceMatch => ({ kind: e.kind, id: e.id, name: e.name, lat: e.lat, lng: e.lng, query: e.query });

/** 장소와, 그 장소를 'A → B' 의 도착지(to)에서 찾았는지 제목(title)에서 찾았는지 */
function locate(item: Pick<PlanItem, "title" | "category">): { place: PlaceMatch; via: "to" | "title" } | null {
  const prefer = PREFER[item.category] ?? [];
  // 'A → B' 는 도착지부터 (뒤 구간부터, ' · ' 앞 이름만 본다)
  for (const seg of item.title.split("→").slice(1).reverse()) {
    const hit = best(noParens(seg.split(" · ")[0]), prefer);
    if (hit) return { place: toMatch(hit.entry), via: "to" };
  }
  // 괄호(현지 이름·곁들인 설명)를 뺀 제목 → 전체 제목 순으로, 일정 분류에 맞는 곳을 먼저
  const plain = best(noParens(item.title), prefer);
  const full = plain?.preferred ? plain : best(item.title, prefer);
  const hit = full?.preferred ? full : (plain ?? full);
  return hit ? { place: toMatch(hit.entry), via: "title" } : null;
}

export function findPlace(item: Pick<PlanItem, "title" | "category">): PlaceMatch | null {
  return locate(item)?.place ?? null;
}

/** 구글 지도 길찾기 — 출발지를 비워 두면 폰의 현재 위치에서 출발한다 */
export function directionsUrl(p: PlaceMatch): string | null {
  const dest =
    p.lat !== null && p.lng !== null ? `${p.lat},${p.lng}` : p.query ? encodeURIComponent(p.query) : null;
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${dest}` : null;
}

// 숙소 안 식당(래디슨 선라이즈 등) — 확정 숙소 좌표에서 200m 안이면 숙소처럼 길찾기를 붙이지 않는다
const HOTEL_SPOTS = ENTRIES.filter((e) => e.kind === "hotel");
const insideHotel = ({ kind, lat, lng }: PlaceMatch) =>
  kind !== "hotel" &&
  lat !== null &&
  lng !== null &&
  HOTEL_SPOTS.some((h) => h.lat !== null && h.lng !== null && Math.abs(h.lat - lat) < 0.002 && Math.abs(h.lng - lng) < 0.002);

export interface PlaceLink {
  place: PlaceMatch;
  /** 이 일정에 붙일 길찾기 주소 (없으면 null) */
  route: string | null;
  /** 이 일정을 누르면 장소 정보를 펼치는지 */
  info: boolean;
}

/**
 * 하루 일정에서 같은 장소 버튼이 겹치지 않게 나눈다.
 * - 이동 일정(A → B): 🧭 B 길찾기만 (그때 실제로 가니까)
 * - 방문 일정: 장소 정보는 그날 처음 나오는 일정에만. 길찾기는 그날 그곳으로 가는 이동이 앞에 없을 때만
 * - 머무는 숙소 안(조식·수영장), 이미 와 있는 '○○ 도착', 비행 구간, 배달에는 길찾기를 붙이지 않는다
 */
export function linkDayPlaces(items: PlanItem[]): Map<string, PlaceLink> {
  const routed = new Set<string>();
  const shown = new Set<string>();
  const out = new Map<string, PlaceLink>();
  for (const item of items) {
    const found = locate(item);
    if (!found) continue;
    const { place, via } = found;
    const url = directionsUrl(place);
    const isMove = item.category === "move";
    const arrived = via === "title" && /도착/.test(item.title);
    // 비행기·케이블카처럼 정해진 길로 가는 구간은 길찾기가 필요 없다
    const fixedRoute = /항공|·\s*케이블카\s*(\(|$)/.test(item.title);
    const noRoute =
      !url || arrived || fixedRoute || /배달/.test(item.title) || (via === "title" && (place.kind === "hotel" || insideHotel(place)));
    const route = !noRoute && ((isMove && via === "to") || !routed.has(url)) ? url : null;
    // 길찾기를 붙였거나 이미 도착한 곳은, 그날 뒤 일정에서 다시 붙이지 않는다
    if (url && (route || arrived)) routed.add(url);
    const key = `${place.kind}:${place.id}`;
    const info = !isMove && !shown.has(key);
    if (info) shown.add(key);
    if (route || info) out.set(item.id, { place, route, info });
  }
  return out;
}
