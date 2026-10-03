import detail from "@/data/weatherDetail.json";
import { card } from "./ui";

// 사막투어(10/6 오전)·래디슨 리조트(10/6~10/8) 최신 예보 상세 — `npm run weather:detail` 로 다시 받는다.

type Block = (typeof detail.resort)[number]["blocks"][number];

/** 앙상블 비 확률(두 모델 중 높은 값)과 천둥 지표로 칸의 아이콘·색을 고른다 */
function tone(b: Block) {
  const hi = Math.max(b.e, b.g);
  if (b.thunder && hi >= 40) return { icon: "⛈️", cls: "bg-accent-soft text-ink" };
  if (hi >= 60) return { icon: "🌦️", cls: "bg-accent-soft text-ink" };
  if (hi >= 30) return { icon: "⛅", cls: "bg-surface text-ink-2" };
  return { icon: "☀️", cls: "bg-primary-soft text-primary-ink" };
}

/** 10/2 조회값과 비교한 화살표 (두 모델 중 높은 값 기준, 10%p 넘게 바뀐 경우만) */
function trend(b: Block) {
  if (b.prevE === null || b.prevG === null) return null;
  const now = Math.max(b.e, b.g);
  const before = Math.max(b.prevE, b.prevG);
  if (Math.abs(now - before) < 10) return <span className="text-ink-3">10/2와 비슷</span>;
  return now > before ? (
    <span className="text-danger">10/2보다 ↑ ({before}%→{now}%)</span>
  ) : (
    <span className="text-primary-ink">10/2보다 ↓ ({before}%→{now}%)</span>
  );
}

const uvLabel = (uv: number) => (uv >= 11 ? "위험" : uv >= 8 ? "매우 강함" : uv >= 6 ? "강함" : uv >= 3 ? "보통" : "약함");

export default function WeatherDetail() {
  const { desert, resort, typhoon } = detail;
  return (
    <section className={`${card} p-5 md:p-6`}>
      <p className="text-[15px] font-semibold text-ink-3">🔎 최신 예보 상세 — 사막투어 · 리조트 (시간별)</p>
      <p className="mt-1 text-[13px] text-ink-3">{detail.fetchedAt} 조회 · 출발 전까지 하루 한 번 갱신해요</p>

      {/* ── 10/6 사막투어 ── */}
      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <p className="text-[16px] font-bold text-ink">🏜️ 10/6(화) 판랑 남끄엉 사구 — 07:00 출발 · 09:00 지프</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{desert.verdict}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[12px] font-semibold">
          <span className="rounded-full bg-surface px-2.5 py-1">🌅 해 뜨는 시각 {desert.sunrise}</span>
          <span className="rounded-full bg-surface px-2.5 py-1">🌡️ 체감 최고 {desert.stats.feelsMax}°</span>
          <span className="rounded-full bg-surface px-2.5 py-1">
            🕶️ 자외선 {desert.stats.uvMax} ({uvLabel(desert.stats.uvMax)})
          </span>
          <span className="rounded-full bg-surface px-2.5 py-1">💨 돌풍 최고 {desert.stats.gustMax}km/h</span>
          <span className="rounded-full bg-surface px-2.5 py-1">
            ☔ 사구 비 {desert.stats.rainE}% / {desert.stats.rainG}%
          </span>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-xl bg-surface">
          {desert.rows.map((r) => (
            <li key={r.time} className="flex items-start gap-3 px-3 py-2.5">
              <span className="w-11 shrink-0 text-[14px] font-bold tabular-nums">{r.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">
                  {r.emoji} {r.what}
                </span>
                <span className="block text-[12px] leading-relaxed text-ink-3 tabular-nums">
                  {r.temp}° (체감 {r.feels}°) · 자외선 {r.uv} · 바람 {r.wind}·돌풍 {r.gust}km/h · 구름 {r.cloud}%
                </span>
              </span>
              <span
                className={`shrink-0 rounded-lg px-2 py-0.5 text-[12px] font-bold tabular-nums ${r.rainProb >= 30 ? "bg-accent-soft text-ink" : "bg-primary-soft text-primary-ink"}`}
              >
                비 {r.rainProb}%
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[12px] text-ink-3">
          칸마다 &lsquo;비 %&rsquo;는 그 시각 기본 모델 확률이에요. 3시간 앙상블 확률은 위쪽 &lsquo;사구 비&rsquo;(ECMWF / GFS)를 보세요.
        </p>
        <p className="mt-3 text-[13px] font-bold text-accent">사막에서 챙길 것</p>
        <ul className="mt-1 space-y-1 text-[14px] leading-relaxed text-ink-2">
          {desert.tips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>

      {/* ── 래디슨 10/6~10/8 ── */}
      <p className="mt-5 text-[16px] font-bold text-ink">🏝️ 래디슨 블루 (캄란) — 3시간 칸별</p>
      <div className="mt-2 space-y-3">
        {resort.map((d) => (
          <div key={d.date} className="rounded-2xl bg-surface-2 p-4">
            <p className="text-[15px] font-bold text-ink">{d.label}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px] font-semibold">
              <span className="rounded-full bg-surface px-2.5 py-1">
                🌡️ {d.tMin}~{d.tMax}°
              </span>
              <span className="rounded-full bg-surface px-2.5 py-1">
                🕶️ 자외선 최고 {d.uvMax} ({uvLabel(d.uvMax)})
              </span>
              <span className="rounded-full bg-surface px-2.5 py-1">
                ☔ 하루 1mm↑ {d.ecmwf.p1}%/{d.gfs.p1}% · 10mm↑ {d.ecmwf.p10}%/{d.gfs.p10}%
              </span>
              <span className="rounded-full bg-surface px-2.5 py-1">🌊 파도 {d.waveMax}m · 수온 {d.sst}°</span>
              <span className="rounded-full bg-surface px-2.5 py-1">
                🌅 {d.sunrise} · 🌇 {d.sunset}
              </span>
            </div>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {d.blocks.map((b) => {
                const t = tone(b);
                return (
                  <li key={b.time} className={`rounded-xl px-3 py-2 text-[12px] leading-snug ${t.cls}`}>
                    <span className="text-[13px] font-bold tabular-nums">
                      {t.icon} {b.time}시
                    </span>{" "}
                    {b.what}
                    {b.thunder && <span className="ml-1 rounded bg-surface px-1 font-bold text-danger">⚡천둥 가능</span>}
                    <span className="block tabular-nums">
                      비 {b.e}% / {b.g}% · {b.mm}mm · {trend(b)}
                    </span>
                    <span className="block text-ink-3 tabular-nums">
                      {b.temp}° (체감 {b.feelsMax}°) · 자외선 {b.uvMax} · 돌풍 {b.gustMax}km/h · 파도 {b.wave}m
                    </span>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-2">
              {d.notes.map((n) => (
                <li key={n}>👉 {n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-line px-4 py-3 text-[13px] leading-relaxed text-ink-2">🌀 {typhoon.text}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] font-semibold text-ink-3">어떻게 계산했나요?</summary>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-3">{detail.method}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-3">바다 격자: {detail.seaGrid}</p>
      </details>
    </section>
  );
}
