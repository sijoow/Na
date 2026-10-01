// 앱에 모은 장소를 구글 내 지도(My Maps)에 올릴 KML 파일로 내보낸다. `npm run maps:export`
// 파일 하나가 내 지도의 레이어 하나가 된다 (exports/google-maps/1~4_*.kml).
// 일정 레이어는 data/trip.json(앱 DB와 같게 맞춘 파일) 기준이라, 휴대폰에서 일정을 바꿨으면 `npm run db:pull` 뒤에 실행한다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import foodSouvenir from "../src/data/foodSouvenir.json";
import kidsPlaces from "../src/data/kidsPlaces.json";
import mapGuide from "../src/data/mapGuide.json";
import restaurants from "../src/data/restaurants.json";
import spas from "../src/data/spas.json";
import toursShopping from "../src/data/toursShopping.json";
import { findPlace } from "../src/lib/placeMatch";
import { getPlan } from "../src/lib/plans";
import { parseTripJson } from "../src/lib/validate";

const OUT = "exports/google-maps";

interface Pin {
  name: string;
  lat: number;
  lng: number;
  /** 구글 지도 검색어 (가게 이름 + 주소) */
  query: string;
  lines: string[];
  color: string;
}

// 내 지도 기본 아이콘 색 (KML 색은 aabbggrr)
const COLOR = {
  hotel: "ff0051e6", // 빨강
  plan: "ff00a5ff", // 주황
  food: "ff2bbf00", // 초록
  spa: "ffb0279c", // 보라
  nail: "ffb469ff", // 분홍
  shop: "ffd18802", // 파랑
  sight: "ff7f7f00", // 청록
  kids: "ff00d7ff", // 노랑
};

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const short = (s: unknown) => String(s ?? "").split(" · ")[0].trim();
const text = (label: string, v: unknown, max = 220) => {
  if (typeof v !== "string" || !v.trim()) return [];
  const t = v.trim().replace(/\s+/g, " ");
  return [`${label}: ${t.length > max ? `${t.slice(0, max)}…` : t}`];
};
const mapsLink = (p: Pin) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query || `${p.lat},${p.lng}`)}`;

function kml(title: string, pins: Pin[]): string {
  const colors = [...new Set(pins.map((p) => p.color))];
  const styles = colors
    .map(
      (c) =>
        `<Style id="c${c}"><IconStyle><color>${c}</color><scale>1</scale><Icon><href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href></Icon></IconStyle></Style>`,
    )
    .join("\n    ");
  const marks = pins
    .map((p) => {
      // 내 지도는 설명의 HTML 태그를 지우므로 줄바꿈 있는 일반 텍스트로 (링크는 자동으로 눌러져요)
      const desc = xml([...p.lines, `구글 지도: ${mapsLink(p)}`].join("\n"));
      return `    <Placemark>
      <name>${xml(p.name)}</name>
      <description>${desc}</description>
      <styleUrl>#c${p.color}</styleUrl>
      <Point><coordinates>${p.lng},${p.lat},0</coordinates></Point>
    </Placemark>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${xml(title)}</name>
    ${styles}
${marks}
  </Document>
</kml>
`;
}

/** 같은 좌표(약 10m 안)·같은 이름은 하나만 */
function dedupe(pins: Pin[]): Pin[] {
  const seen = new Set<string>();
  return pins.filter((p) => {
    const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    const n = p.name.replace(/\s|\(.*?\)/g, "");
    if (seen.has(k) || seen.has(n)) return false;
    seen.add(k);
    seen.add(n);
    return true;
  });
}

const hasLL = <T extends { lat?: unknown; lng?: unknown }>(x: T): x is T & { lat: number; lng: number } =>
  typeof x.lat === "number" && typeof x.lng === "number";

// ── 1. 우리 일정: 확정 숙소 + 날짜별 일정에 들어간 장소 ──
const trip = parseTripJson(readFileSync("data/trip.json", "utf8"));
if (!trip.ok) throw new Error(trip.error);
const plan = getPlan("D");
const planPins: Pin[] = (plan.confirmed ?? []).map((s) => ({
  name: `${s.leg} ${s.name}`,
  lat: s.lat,
  lng: s.lng,
  query: `${s.localName.replace(/^정식 이름\s*/, "")} ${s.address}`,
  lines: [`🏨 ${s.period}`, `주소: ${s.address}`, ...text("체크인", s.checkInOut)],
  color: COLOR.hotel,
}));
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const visits = new Map<string, { pin: Pin; when: string[] }>();
for (const day of trip.state.days) {
  const d = new Date(`${day.date}T00:00:00`);
  const label = `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`;
  for (const item of day.items) {
    if (item.category === "move") continue;
    const p = findPlace(item);
    if (!p || p.lat === null || p.lng === null || p.kind === "hotel") continue;
    const key = `${p.kind}:${p.id}`;
    const v = visits.get(key) ?? {
      pin: { name: p.name, lat: p.lat, lng: p.lng, query: p.query, lines: [], color: COLOR.plan },
      when: [],
    };
    v.when.push(`${label} ${item.time} ${item.title}`);
    visits.set(key, v);
  }
}
for (const { pin, when } of visits.values()) {
  pin.name = `[${when[0].split(" ")[0]}] ${pin.name}`;
  pin.lines = ["📅 우리 일정", ...when];
  planPins.push(pin);
}

// ── 2. 맛집: 맛집 탭 + 쉐라톤 근처 끼니 + 음식 가이드 ──
const foodPins: Pin[] = dedupe([
  ...restaurants.restaurants.filter(hasLL).map((r) => ({
    name: `${r.rank}. ${r.name}`,
    lat: r.lat,
    lng: r.lng,
    query: `${short(r.localName).split(" / ")[0]} ${short(r.address).replace(/^1호점:\s*/, "").split(" / ")[0]}`,
    lines: [...text("주소", r.address), ...text("영업", r.hours), ...text("평점", r.rating), ...text("꼭 먹을 것", r.mustOrder), ...text("아이", r.kidFriendly)],
    color: COLOR.food,
  })),
  ...restaurants.nearSheraton.spots.filter(hasLL).map((m) => ({
    name: `${m.name} (쉐라톤 근처)`,
    lat: m.lat,
    lng: m.lng,
    query: `${short(m.localName)} ${short(m.address)}`,
    lines: [...text("주소", m.address), ...text("끼니", m.meal), ...text("영업", m.opens), ...text("걸어서", m.walk), ...text("아이", m.kid)],
    color: COLOR.food,
  })),
  ...foodSouvenir.food.spots.filter(hasLL).map((f) => ({
    name: f.name,
    lat: f.lat,
    lng: f.lng,
    query: `${short(f.localName)} ${short(f.address)}`,
    lines: [...text("주소", f.address), ...text("영업", f.hours), ...text("가격", f.priceRange), ...text("아이", f.kidFriendly)],
    color: COLOR.food,
  })),
]);

// ── 3. 마사지·네일 ──
const spaPins: Pin[] = spas.shops.filter(hasLL).map((s) => {
  const nail = (s as { kind?: string }).kind === "nail";
  return {
    name: `${nail ? "💅" : "💆"} ${s.name}`,
    lat: s.lat,
    lng: s.lng,
    query: `${short(s.localName)} ${short(s.address).split(" (")[0]}`,
    lines: [...text("주소", s.address), ...text("영업", s.hours), ...text("평점", s.rating), ...text("가격", s.priceSummary), ...text("예약", s.booking), ...text("아이", s.kids, 160)],
    color: nail ? COLOR.nail : COLOR.spa,
  };
});

// ── 4. 쇼핑·관광·아이랑 갈 곳 ──
const etcPins: Pin[] = dedupe([
  ...toursShopping.shops.filter(hasLL).map((s) => ({
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    query: `${short(s.localName)} ${short(s.address)}`,
    lines: [...text("주소", s.address), ...text("영업", s.hours), ...text("살 것", s.what)],
    color: COLOR.shop,
  })),
  ...foodSouvenir.souvenir.places.filter(hasLL).map((s) => ({
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    query: short(s.localName),
    lines: [...text("영업", s.hours), ...text("팁", s.tips)],
    color: COLOR.shop,
  })),
  ...kidsPlaces.places.filter(hasLL).map((k) => ({
    name: `👶 ${k.name}`,
    lat: k.lat,
    lng: k.lng,
    query: short(k.localName),
    lines: [...text("아이랑", k.fitText), ...text("언제", k.when), ...text("가격", k.price)],
    color: COLOR.kids,
  })),
  ...mapGuide.places.filter(hasLL).map((p) => ({
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    query: `${short(p.localName)} ${short(p.address)}`,
    lines: [...text("주소", p.address), ...text("메모", p.note)],
    color: COLOR.sight,
  })),
]);

mkdirSync(OUT, { recursive: true });
const layers: [string, string, Pin[]][] = [
  ["1_우리일정_숙소.kml", "1. 우리 일정 · 숙소", planPins],
  ["2_맛집.kml", "2. 맛집", foodPins],
  ["3_마사지_네일.kml", "3. 마사지 · 네일", spaPins],
  ["4_쇼핑_관광_아이랑.kml", "4. 쇼핑 · 관광 · 아이랑 갈 곳", etcPins],
];
for (const [file, title, pins] of layers) {
  writeFileSync(`${OUT}/${file}`, kml(title, pins), "utf8");
  console.log(`${file}: ${pins.length}곳`);
}
