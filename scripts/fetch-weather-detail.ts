// 판랑 사막투어(10/6 오전)와 래디슨 리조트(10/6~10/8) 날씨를 최신 예보로 시간별 분석해 src/data/weatherDetail.json 에 쓴다.
// `npm run weather:detail` — 출발 전까지 하루 한 번 다시 돌리면 최신 예보로 바뀐다. (Open-Meteo·JTWC, 키 필요 없음)
// 비 확률은 앙상블(ECMWF 51개·GFS 31개) 중 3시간 동안 0.5mm 이상 내린 비율, 나머지(기온·체감·자외선·바람·천둥 지표)는 Open-Meteo 기본 모델.
import { writeFileSync } from "node:fs";
import resort from "../src/data/resortWeather.json";

const TZ = "Asia/Bangkok"; // 베트남과 같은 UTC+7
const POINTS = {
  hotel: { name: "베스트웨스턴 (나트랑 시내)", lat: 12.22493, lng: 109.20087 },
  dune: { name: "남끄엉 사구 (판랑)", lat: 11.5162854, lng: 109.0000748 },
  radisson: { name: "래디슨 블루 (캄란)", lat: 12.048057, lng: 109.206573 },
} as const;
type PointKey = keyof typeof POINTS;
const SEA = { lat: 12.048, lng: 109.225 }; // 바이다이 앞바다 — 바다 모델 격자는 해안에서 조금 떨어진 곳으로 잡혀요
const NHA_TRANG = { lat: 12.24, lng: 109.19 };
const START = "2026-10-06";
const END = "2026-10-08";
const HOURLY =
  "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,uv_index,cape";

type Series = Record<string, (number | null)[]> & { time: string[] };
interface Forecast {
  hourly: Series;
  daily: { time: string[]; sunrise: string[]; sunset: string[]; uv_index_max: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url.slice(0, 80)}`);
  return (await res.json()) as T;
}

const forecastUrl = (p: { lat: number; lng: number }) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&hourly=${HOURLY}` +
  `&daily=sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(TZ)}&start_date=${START}&end_date=${END}`;
const ensembleUrl = (p: { lat: number; lng: number }) =>
  `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${p.lat}&longitude=${p.lng}&hourly=precipitation` +
  `&models=ecmwf_ifs025,gfs025&timezone=${encodeURIComponent(TZ)}&start_date=${START}&end_date=${END}`;
const marineUrl = () =>
  `https://marine-api.open-meteo.com/v1/marine?latitude=${SEA.lat}&longitude=${SEA.lng}` +
  `&hourly=wave_height,wave_period,sea_surface_temperature&timezone=${encodeURIComponent(TZ)}&start_date=${START}&end_date=${END}`;

/** 앙상블 멤버를 모델별(ECMWF / GFS)로 나눈다 */
function splitMembers(hourly: Series): { e: number[][]; g: number[][] } {
  const e: number[][] = [];
  const g: number[][] = [];
  for (const [key, values] of Object.entries(hourly)) {
    if (key === "time") continue;
    const series = (values as (number | null)[]).map((v) => v ?? 0);
    if (/ecmwf/.test(key)) e.push(series);
    else if (/gfs|gefs|ncep/.test(key)) g.push(series);
  }
  return { e, g };
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const sumRange = (s: number[], from: number, len: number) => s.slice(from, from + len).reduce((a, b) => a + b, 0);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};
const r1 = (v: number) => Math.round(v * 10) / 10;

function blockStats(members: number[][], from: number, len: number, thr = 0.5) {
  const sums = members.map((m) => sumRange(m, from, len));
  return { p: pct(sums.filter((s) => s >= thr).length, sums.length), mm: r1(median(sums)) };
}

function dayStats(members: number[][], dayStart: number) {
  const sums = members.map((m) => sumRange(m, dayStart, 24));
  return {
    p1: pct(sums.filter((s) => s >= 1).length, sums.length),
    p10: pct(sums.filter((s) => s >= 10).length, sums.length),
    p20: pct(sums.filter((s) => s >= 20).length, sums.length),
    mm: r1(median(sums)),
  };
}

function codeEmoji(code: number): string {
  if (code >= 95) return "⛈️";
  if (code >= 80) return "🌦️";
  if (code >= 51) return "🌧️";
  if (code >= 45) return "🌫️";
  if (code >= 2) return "⛅";
  return "☀️";
}

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
};

/** JTWC 서태평양 안내문에서 열대저기압·요란 요약 */
async function typhoon() {
  const url = "https://www.metoc.navy.mil/jtwc/products/abpwweb.txt";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    // 줄바꿈·연속 공백을 한 칸으로 (원문은 줄 끝에 공백이 붙어 있어 'NEAR  18.6N'처럼 두 칸이 됨)
    const text = (await res.text()).replace(/\s+/g, " ");
    const issued = text.match(/ABPW10 PGTW (\d{2})(\d{2})(\d{2})/);
    const storms = [...text.matchAll(/AT \w+ \d{4}Z, ([A-Z ]+?) (\d+W) \(([A-Z-]+)\) WAS LOCATED NEAR ([\d.]+)([NS]) ([\d.]+)([EW])[^.]*?TRACKED (\w+) AT (\d+) KNOTS/g)].map((m) => {
      const lat = Number(m[4]) * (m[5] === "S" ? -1 : 1);
      const lng = Number(m[6]) * (m[7] === "W" ? -1 : 1);
      const DIR: Record<string, string> = { NORTH: "북", SOUTH: "남", EAST: "동", WEST: "서" };
      const track = m[8].replace(/WARD$/, "").replace(/NORTH|SOUTH|EAST|WEST/g, (w) => DIR[w]) + "쪽";
      return { kind: m[1].trim(), id: m[2], name: m[3], lat, lng, track, knots: Number(m[9]), distanceKm: haversineKm(NHA_TRANG, { lat, lng }) };
    });
    const disturbance = /TROPICAL DISTURBANCE SUMMARY: NONE/.test(text.split("2. SOUTH PACIFIC")[0]) ? "없음" : "있음 — 원문 확인";
    const when = issued ? `${issued[1]}일 ${issued[2]}:${issued[3]} UTC (한국 ${(Number(issued[2]) + 9) % 24}시)` : "확인 못 함";
    const list = storms.length
      ? storms.map((s) => `${s.id}(${s.name}) ${s.lat}°N ${s.lng}°E — 나트랑에서 약 ${s.distanceKm.toLocaleString("ko-KR")}km, ${s.track}으로 이동`).join(" / ")
      : "없음";
    const far = storms.every((s) => s.distanceKm > 1500);
    return {
      issued: when,
      storms,
      disturbance,
      text:
        `JTWC 서태평양 안내 ${when}: 열대저기압 ${list}. 남중국해 포함 서태평양의 새 열대 요란 ${disturbance}.` +
        (far && disturbance === "없음" ? " 여행 기간 나트랑·캄란에 영향을 줄 태풍은 없어요." : " 원문을 확인하세요."),
      source: url,
    };
  } catch {
    return { issued: "확인 못 함", storms: [], disturbance: "확인 못 함", text: "JTWC 안내를 불러오지 못했어요.", source: url };
  }
}

(async () => {
  const fc = {} as Record<PointKey, Forecast>;
  for (const k of Object.keys(POINTS) as PointKey[]) fc[k] = await getJson<Forecast>(forecastUrl(POINTS[k]));
  const ens = {
    dune: splitMembers((await getJson<{ hourly: Series }>(ensembleUrl(POINTS.dune))).hourly),
    radisson: splitMembers((await getJson<{ hourly: Series }>(ensembleUrl(POINTS.radisson))).hourly),
  };
  const sea = (await getJson<{ hourly: Series; latitude: number; longitude: number }>(marineUrl()));
  const ty = await typhoon();

  const idx = (series: Series, t: string) => series.time.indexOf(t);
  const at = (k: PointKey, t: string) => {
    const h = fc[k].hourly;
    const i = idx(h, t);
    const v = (name: string) => Number(h[name][i] ?? 0);
    return {
      temp: Math.round(v("temperature_2m")),
      feels: Math.round(v("apparent_temperature")),
      humidity: Math.round(v("relative_humidity_2m")),
      uv: r1(v("uv_index")),
      wind: Math.round(v("wind_speed_10m")),
      gust: Math.round(v("wind_gusts_10m")),
      cloud: Math.round(v("cloud_cover")),
      rainProb: Math.round(v("precipitation_probability")),
      rainMm: r1(v("precipitation")),
      code: v("weather_code"),
      cape: Math.round(v("cape")),
    };
  };

  // ── 10/6 사막투어 (06~12시) ──
  const day6 = "2026-10-06";
  const desertRows = (
    [
      ["06:00", "조식 · 06:45 체크아웃", "hotel"],
      ["07:00", "HT나트랑 차량 출발", "hotel"],
      ["08:00", "판랑으로 이동 중", "dune"],
      ["09:00", "지프 · 모래썰매", "dune"],
      ["10:00", "지프 · 모래썰매 → 10:15 씻기", "dune"],
      ["11:00", "래디슨으로 이동 중", "dune"],
      ["12:00", "래디슨 도착 · 점심", "radisson"],
    ] as const
  ).map(([time, what, where]) => {
    const w = at(where, `${day6}T${time}`);
    return { time, what, where: POINTS[where].name, emoji: codeEmoji(w.code), ...w };
  });
  const iDay6E = idx(fc.radisson.hourly, `${day6}T00:00`); // 앙상블도 같은 날짜·시간축 (00시 시작)
  const duneBlocks = [
    { time: "06~09", what: "출발·이동", ...blockPair(ens.dune, iDay6E + 6) },
    { time: "09~12", what: "사구 지프·썰매", ...blockPair(ens.dune, iDay6E + 9) },
  ];
  const onDune = desertRows.filter((r) => r.time === "09:00" || r.time === "10:00");
  const uvMax = Math.max(...desertRows.filter((r) => r.time >= "09:00" && r.time <= "11:00").map((r) => r.uv));
  const feelsMax = Math.max(...onDune.map((r) => r.feels));
  const gustMax = Math.max(...onDune.map((r) => r.gust));
  const duneRainHi = Math.max(duneBlocks[1].e, duneBlocks[1].g);
  const thunderMorning = desertRows.some((r) => r.code >= 95);
  const sunrise = fc.dune.daily.sunrise[0].slice(11);

  const desertVerdict =
    (duneRainHi < 20 && !thunderMorning
      ? `사구에 있는 09~12시 비 확률은 ECMWF ${duneBlocks[1].e}%·GFS ${duneBlocks[1].g}%라 거의 걱정 없어요.`
      : duneRainHi < 50
        ? `사구 시간(09~12시) 비 확률이 ECMWF ${duneBlocks[1].e}%·GFS ${duneBlocks[1].g}%예요. 소나기가 지나갈 수 있으니 출발 전 레이더를 보세요.`
        : `사구 시간(09~12시) 비 확률이 ECMWF ${duneBlocks[1].e}%·GFS ${duneBlocks[1].g}%로 높아요. HT나트랑에 출발 시간 조정을 물어보세요.`) +
    ` 09~10시 기온 ${Math.min(...onDune.map((r) => r.temp))}~${Math.max(...onDune.map((r) => r.temp))}°C, 체감 최고 ${feelsMax}°C, 자외선 최고 ${uvMax}예요.` +
    (gustMax >= 30 ? ` 돌풍이 ${gustMax}km/h까지 불어 모래가 날릴 수 있어요.` : ` 바람은 돌풍 ${gustMax}km/h 이하로 약해 모래 날림은 적은 편이에요.`);

  const desertTips = [
    `해 뜨는 시각 ${sunrise} — 출발(07:00) 때 이미 밝고, 09시면 햇볕이 강해져요.`,
    uvMax >= 8
      ? `자외선이 ${uvMax}로 '매우 강함'이에요. 아이는 챙 넓은 모자·선글라스·얇은 긴소매, 선크림은 출발 전과 사구 도착 때 두 번 발라요.`
      : `자외선 ${uvMax} — 모자·선크림·선글라스는 꼭 챙겨요.`,
    `체감 ${feelsMax}°C — 물은 한 사람 500ml 이상, 아이는 지프에서 내릴 때마다 한 모금씩 마시게 해요.`,
    "햇볕 받은 모래는 오전에도 금방 뜨거워져요. 아이는 맨발 대신 샌들·아쿠아슈즈를 신기고 썰매 탈 때만 벗겨요.",
    gustMax >= 25
      ? "모래가 날릴 수 있어요. 아이 눈을 가릴 선글라스나 물안경, 입을 가릴 손수건을 챙겨요."
      : "모래가 눈에 들어갈 수 있으니 휴대폰·카메라는 지퍼백에 넣어요.",
    "사구에는 그늘이 없어요. 천둥이 들리거나 먹구름이 다가오면 바로 차로 돌아가요.",
  ];

  // ── 리조트 10/6~10/8 (3시간 칸) ──
  const labelsByDay = new Map<string, Map<string, { what: string; ecmwf: number; gfs: number }>>();
  for (const d of resort.byDay) {
    const date = d.date.slice(0, 10);
    labelsByDay.set(date, new Map((d.blocks ?? []).map((b) => [b.time, b])));
  }
  const seaAt = (t: string) => {
    const i = idx(sea.hourly, t);
    return { wave: Number(sea.hourly.wave_height[i] ?? 0), sst: Number(sea.hourly.sea_surface_temperature[i] ?? 0) };
  };

  const resortDays = (
    [
      ["2026-10-06", "10/6(화) 사구 → 래디슨 도착", [12, 15, 18, 21]],
      ["2026-10-07", "10/7(수) 리조트 데이", [6, 9, 12, 15, 18, 21]],
      ["2026-10-08", "10/8(목) 체크아웃 → 쉐라톤", [6, 9, 12]],
    ] as const
  ).map(([date, label, starts]) => {
    const i0 = idx(fc.radisson.hourly, `${date}T00:00`);
    const labels = labelsByDay.get(date);
    const blocks = starts.map((h) => {
      const time = `${String(h).padStart(2, "0")}~${String(h + 3).padStart(2, "0")}`;
      const hours = [0, 1, 2].map((k) => at("radisson", `${date}T${String(h + k).padStart(2, "0")}:00`));
      const seas = [0, 1, 2].map((k) => seaAt(`${date}T${String(h + k).padStart(2, "0")}:00`));
      const pair = blockPair(ens.radisson, i0 + h);
      const thunder = hours.some((x) => x.code >= 95) || (Math.max(...hours.map((x) => x.cape)) >= 1500 && Math.max(pair.e, pair.g) >= 40);
      const prev = labels?.get(time);
      return {
        time,
        what: prev?.what ?? "",
        ...pair,
        prevE: prev?.ecmwf ?? null,
        prevG: prev?.gfs ?? null,
        temp: `${Math.min(...hours.map((x) => x.temp))}~${Math.max(...hours.map((x) => x.temp))}`,
        feelsMax: Math.max(...hours.map((x) => x.feels)),
        uvMax: Math.max(...hours.map((x) => x.uv)),
        gustMax: Math.max(...hours.map((x) => x.gust)),
        wave: r1(Math.max(...seas.map((x) => x.wave))),
        thunder,
        emoji: codeEmoji(Math.max(...hours.map((x) => x.code))), // 기본 모델 날씨 — 화면은 앙상블 비 확률로 아이콘을 다시 고른다
      };
    });
    const dE = dayStats(ens.radisson.e, i0);
    const dG = dayStats(ens.radisson.g, i0);
    const di = fc.radisson.daily.time.indexOf(date);
    const daytime = blocks.filter((b) => Number(b.time.slice(0, 2)) >= 6 && Number(b.time.slice(0, 2)) < 18);
    const good = daytime.filter((b) => Math.max(b.e, b.g) < 30 && !b.thunder).map((b) => `${b.time}시`);
    // 21시 이후는 자는 시간이라 '피할 시간'에서 뺀다
    const avoid = blocks
      .filter((b) => Number(b.time.slice(0, 2)) < 21 && (Math.max(b.e, b.g) >= 60 || b.thunder))
      .map((b) => `${b.time}시${b.thunder ? "(천둥 가능)" : ""}`);
    const sstDay = r1(median(Array.from({ length: 24 }, (_, h) => seaAt(`${date}T${String(h).padStart(2, "0")}:00`).sst)));
    const waveDay = r1(Math.max(...Array.from({ length: 12 }, (_, h) => seaAt(`${date}T${String(h + 6).padStart(2, "0")}:00`).wave)));
    const notes = [
      good.length ? `물놀이 좋은 시간: ${good.join(", ")} (비 확률 30% 미만)` : "비 확률 30% 미만인 낮 시간이 없어요 — 비가 그친 틈을 노려요.",
      avoid.length ? `피할 시간: ${avoid.join(", ")} — 실내·낮잠·배달로` : "비 확률 60% 넘는 시간대가 없어요.",
      fc.radisson.daily.uv_index_max[di] >= 8
        ? `자외선 최고 ${r1(fc.radisson.daily.uv_index_max[di])} — 11~14시 물놀이는 그늘·래시가드 필수`
        : `자외선 최고 ${r1(fc.radisson.daily.uv_index_max[di])}`,
      waveDay < 0.8
        ? `파도는 낮 동안 최고 ${waveDay}m(앞바다 기준)로 잔잔한 편 — 아이는 물가에서 발만, 어른이 꼭 옆에`
        : `파도가 낮 동안 최고 ${waveDay}m(앞바다 기준) — 아이 바다 입수는 피하고 수영장으로`,
    ];
    return {
      date,
      label,
      tMax: Math.round(fc.radisson.daily.temperature_2m_max[di]),
      tMin: Math.round(fc.radisson.daily.temperature_2m_min[di]),
      uvMax: r1(fc.radisson.daily.uv_index_max[di]),
      sunrise: fc.radisson.daily.sunrise[di].slice(11),
      sunset: fc.radisson.daily.sunset[di].slice(11),
      sst: sstDay,
      waveMax: waveDay,
      ecmwf: dE,
      gfs: dG,
      blocks,
      notes,
    };
  });

  function blockPair(m: { e: number[][]; g: number[][] }, from: number) {
    const e = blockStats(m.e, from, 3);
    const g = blockStats(m.g, from, 3);
    return { e: e.p, g: g.p, mm: e.mm };
  }

  const now = new Date();
  const fmt = (d: Date, tz: string) =>
    new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

  const out = {
    fetchedAt: `${fmt(now, "Asia/Seoul")} (한국 시간)`,
    method:
      "비 확률: Open-Meteo 앙상블 — ECMWF 51개·GFS 31개 예보 중 3시간 동안 0.5mm 이상 내린 비율(앞 ECMWF / 뒤 GFS), mm는 ECMWF 중앙값. 기온·체감·자외선·바람·천둥 지표(CAPE)는 Open-Meteo 기본 모델, 파도·수온은 Open-Meteo 바다 모델(바이다이 앞바다 격자). '천둥 가능'은 천둥 날씨 코드가 있거나, 대기 불안정(CAPE 1500 이상)과 비 확률 40% 이상이 겹친 칸이에요.",
    seaGrid: `${r1(sea.latitude)}°N ${r1(sea.longitude)}°E (해안에서 떨어진 앞바다 값이라 해변 물가는 이보다 잔잔해요)`,
    desert: {
      date: day6,
      sunrise,
      verdict: desertVerdict,
      stats: { feelsMax, uvMax, gustMax, rainE: duneBlocks[1].e, rainG: duneBlocks[1].g },
      rows: desertRows,
      blocks: duneBlocks,
      tips: desertTips,
    },
    resort: resortDays,
    typhoon: ty,
    sources: [
      "https://open-meteo.com/en/docs (예보)",
      "https://open-meteo.com/en/docs/ensemble-api (앙상블)",
      "https://open-meteo.com/en/docs/marine-weather-api (바다)",
      ty.source,
    ],
  };
  writeFileSync("src/data/weatherDetail.json", JSON.stringify(out, null, 2) + "\n");
  console.log("저장: src/data/weatherDetail.json", out.fetchedAt);
  console.log("사막:", desertVerdict);
  for (const d of resortDays) console.log(d.label, `| 1mm ${d.ecmwf.p1}%/${d.gfs.p1}% · 10mm ${d.ecmwf.p10}%/${d.gfs.p10}% · 20mm ${d.ecmwf.p20}%/${d.gfs.p20}%`, "|", d.blocks.map((b) => `${b.time} ${b.e}/${b.g}%${b.thunder ? "⚡" : ""}`).join("  "));
  console.log("태풍:", ty.text);
})();
