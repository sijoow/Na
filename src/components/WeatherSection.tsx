"use client";

import { useEffect, useState } from "react";
import weather from "@/data/weather.json";
import { BlogPostRow } from "./ReviewsTab";
import { card } from "./ui";

const TRIP_DATES = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
const SPOTS = [
  { name: "나트랑 시내", lat: 12.2388, lng: 109.1967 },
  { name: "캄란", lat: 12.05, lng: 109.2083 },
];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

interface ForecastDay {
  date: string;
  code: number;
  tMax: number;
  tMin: number;
  rain: number;
  prob: number | null;
}

function codeEmoji(code: number): string {
  if (code >= 95) return "⛈️";
  if (code >= 80) return "🌦️";
  if (code >= 51) return "🌧️";
  if (code >= 45) return "🌫️";
  if (code >= 2) return "⛅";
  return "☀️";
}

function label(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${m}/${d} (${WEEKDAY[new Date(y, m - 1, d).getDay()]})`;
}

type Forecast = { status: "loading" } | { status: "error" } | { status: "ok"; spots: { name: string; days: ForecastDay[] }[] };

/** Open-Meteo 16일 예보에서 여행 날짜만 뽑아 보여준다 (키 필요 없음). */
function LiveForecast() {
  const [fc, setFc] = useState<Forecast>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const url =
      "https://api.open-meteo.com/v1/forecast?" +
      `latitude=${SPOTS.map((s) => s.lat).join(",")}&longitude=${SPOTS.map((s) => s.lng).join(",")}` +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max" +
      "&forecast_days=16&timezone=Asia%2FBangkok";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: unknown) => {
        const list = (Array.isArray(json) ? json : [json]) as {
          daily: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            precipitation_sum: number[];
            precipitation_probability_max: (number | null)[];
          };
        }[];
        const spots = list.map((loc, i) => ({
          name: SPOTS[i].name,
          days: loc.daily.time
            .map((date, j) => ({
              date,
              code: loc.daily.weather_code[j],
              tMax: loc.daily.temperature_2m_max[j],
              tMin: loc.daily.temperature_2m_min[j],
              rain: loc.daily.precipitation_sum[j],
              prob: loc.daily.precipitation_probability_max[j],
            }))
            .filter((d) => TRIP_DATES.includes(d.date)),
        }));
        if (!cancelled) setFc({ status: "ok", spots });
      })
      .catch(() => {
        if (!cancelled) setFc({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={`${card} p-5 md:p-6`}>
      <p className="text-[15px] font-semibold text-ink-3">여행 날짜 실시간 예보 (Open-Meteo)</p>
      {fc.status === "loading" && <p className="mt-3 text-ink-3">예보를 불러오는 중…</p>}
      {fc.status === "error" && <p className="mt-3 text-ink-3">예보를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>}
      {fc.status === "ok" &&
        (fc.spots.every((s) => s.days.length === 0) ? (
          <p className="mt-3 text-[15px] text-ink-2">
            아직 예보 범위(16일) 밖이에요. 출발 2주 전부터 날짜별 예보가 여기에 나와요.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {fc.spots.map((s) => (
              <div key={s.name}>
                <p className="mb-2 text-[14px] font-bold text-ink-2">{s.name}</p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                  {s.days.map((d) => (
                    <div key={d.date} className="min-w-[88px] shrink-0 rounded-2xl bg-surface-2 p-3 text-center">
                      <p className="text-[13px] font-semibold text-ink-3">{label(d.date)}</p>
                      <p className="my-1 text-2xl" aria-hidden>
                        {codeEmoji(d.code)}
                      </p>
                      <p className="text-[14px] font-bold tabular-nums">
                        {Math.round(d.tMin)}~{Math.round(d.tMax)}°
                      </p>
                      <p className="text-[13px] text-primary-ink tabular-nums">
                        {d.prob !== null ? `비 ${d.prob}%` : ""} {d.rain > 0 ? `${d.rain}mm` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[13px] text-ink-3">날짜가 멀수록 예보가 자주 바뀌어요. 출발 3~4일 전 예보부터 믿을 만해요.</p>
          </div>
        ))}
    </section>
  );
}

export default function WeatherSection() {
  const { stats, events } = weather;
  const nhaTrang2025 = stats.lastYear.filter((d) => d.place.includes("나트랑"));

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary-soft p-5 md:p-6">
        <p className="text-[15px] font-bold text-primary-ink">한 줄 결론</p>
        <p className="mt-1 text-[17px] leading-relaxed font-semibold text-ink">
          일정이 통째로 틀어질 위험은 낮아요. 10년간 이 기간에 태풍이 나트랑 가까이 온 적이 없고, 올해는 강한 엘니뇨라 베트남
          기상청이 10월 비를 평년보다 20~40% 적게 봐요. &lsquo;오전엔 야외, 저녁엔 실내&rsquo;만 지키면 충분해요.
        </p>
      </section>

      <LiveForecast />

      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">📈 2026년 10월 예상 날씨 (계절 전망)</p>
        <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2 break-words">{events.outlook2026}</p>
      </section>

      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">작년(2025) 같은 기간 나트랑 실제 날씨</p>
        <ul className="mt-2 divide-y divide-line">
          {nhaTrang2025.map((d) => (
            <li key={d.date} className="flex items-start gap-3 py-2.5">
              <span className="w-16 shrink-0 text-[14px] font-bold tabular-nums">{label(d.date).replace("2025", "")}</span>
              <span className="w-20 shrink-0 text-[14px] tabular-nums text-ink-2">
                {Math.round(d.tMin)}~{Math.round(d.tMax)}°
              </span>
              <span className="min-w-0 text-[14px] text-ink-2">
                <b className={d.rainMm >= 1 ? "text-primary-ink" : "text-ink"}>{d.rainMm}mm</b> · {d.rainTiming}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">최근 10년({stats.decade.years}) 10/3~10/10 통계</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {stats.decade.perPlace.map((p) => (
            <div key={p.place} className="rounded-2xl bg-surface-2 p-4">
              <p className="text-[16px] font-bold">{p.place}</p>
              <p className="mt-1 text-[14px] text-ink-2">
                비 온 날 {p.rainDayPct}% · 폭우(20mm↑) {p.heavyRainDayPct}%
              </p>
              <p className="text-[14px] text-ink-2">
                평균 {p.avgTMin}~{p.avgTMax}° · 하루 평균 비 {p.avgDailyRainMm}mm
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3 break-words">{p.rainByTimeOfDay}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{stats.insight}</p>
      </section>

      <details className={`${card} p-5 md:p-6`}>
        <summary className="cursor-pointer text-[16px] font-bold">🌀 태풍·홍수 기록 (2016~2025)</summary>
        <ul className="mt-3 space-y-3">
          {events.storms.map((s, i) => (
            <li key={i} className="text-[14px] leading-relaxed">
              <b>
                {s.year} · {s.name}
              </b>{" "}
              <span className="text-ink-3">{s.dates}</span>
              <br />
              <span className="text-ink-2">{s.impact}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{events.insight}</p>
      </details>

      <details className={`${card} p-5 md:p-6`}>
        <summary className="cursor-pointer text-[16px] font-bold">⛴️ 케이블카·배 운휴 기록 · 🌊 바다</summary>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2 break-words">{events.disruptions}</p>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2 break-words">{stats.sea}</p>
      </details>

      <details className={`${card} p-5 md:p-6`} open>
        <summary className="cursor-pointer text-[16px] font-bold">☔ 비 오는 날 Plan B</summary>
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{events.planB}</p>
      </details>


      {events.blogExperiences.length > 0 && (
        <section className={`${card} px-2 py-4 md:px-3`}>
          <p className="mb-1 px-3 text-[16px] font-bold">10월 초 다녀온 사람들 후기</p>
          <ul>
            {events.blogExperiences.map((p, i) => (
              <BlogPostRow key={`${p.url}-${i}`} post={{ ...p, summary: `${p.tripDates ? `[${p.tripDates}] ` : ""}${p.summary}` }} />
            ))}
          </ul>
        </section>
      )}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4 break-words">출처: {stats.source}</p>
    </div>
  );
}
