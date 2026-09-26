"use client";

import { useState } from "react";
import data from "@/data/legStays.json";
import { card } from "./ui";

// 사용자가 정한 숙소 동선(① 시내 → ② 래디슨 블루 캄란 → ③ 시내)에 맞춘 구간별 호텔 비교

interface RouteStep {
  leg: string;
  place: string;
  dates: string;
  status: "확정" | "비교 중";
  pick?: string;
}
interface PairHotel {
  id: string;
  name: string;
  localName: string;
}
interface PairRow {
  label: string;
  values: string[];
}
interface Candidate {
  id: string;
  name: string;
  localName: string;
  isNew: boolean;
  walk: string;
  facilities: string;
  room: string;
  price: string;
  kids: string;
  risks: string;
  score: number;
  scoreWhy: string;
  /** 목록에 보여 줄 대표 가격 한 줄 */
  priceShort?: string;
}
interface Claim {
  claim: string;
  verdict: "맞음" | "틀림" | "일부 맞음" | "확인 불가";
  evidence: string;
  fix: string;
}
interface Extra {
  title: string;
  summary: string;
  items?: { name: string; pickup: string; price: string; note: string }[];
  tips?: string;
}
interface Leg {
  id: string;
  title: string;
  dates: string;
  focus: string[];
  finalPick: string;
  /** 최종 추천 호텔 id (점수 1위와 다를 수 있음) */
  pickId?: string;
  pair: { hotels: PairHotel[]; rows: PairRow[]; verdict: string };
  ranking: Candidate[];
  scoreMethod: string;
  bookingTips: string;
  claims: Claim[];
  extra?: Extra;
}
interface Transfer {
  leg: string;
  how: string;
  time: string;
  fare: string;
  source: string;
}
interface Plan {
  sameHotelTwice: string;
  transfers: Transfer[];
  radisson: string;
  budget: string;
  dayFlow: string;
}

const ROUTE = (data.route ?? []) as RouteStep[];
const LEGS = (data.legs ?? []) as unknown as Leg[];
const PLAN = (data.plan ?? null) as Plan | null;

const VERDICT_STYLE: Record<Claim["verdict"], string> = {
  맞음: "bg-primary-soft text-primary-ink",
  "일부 맞음": "bg-surface-2 text-ink-2",
  틀림: "bg-accent-soft text-accent",
  "확인 불가": "bg-surface-2 text-ink-3",
};

export default function LegStays() {
  if (LEGS.length === 0) {
    return <div className={`${card} p-10 text-center text-ink-3`}>구간별 숙소 비교를 정리하고 있어요.</div>;
  }
  return (
    <div className="space-y-5">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">우리 숙소 동선</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">구간별로 가장 좋은 숙소</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          구간마다 중요한 곳(담시장·사막투어 / 롯데마트·담시장·마사지)에 <b>걸어서 갈 수 있으면 가산점</b>을 주고, 호텔 상태·아이
          시설과 함께 매겼어요. {data.updatedAt} 조사·검증 기준이에요.
        </p>
        <ol className="mt-4 space-y-2">
          {ROUTE.map((s) => (
            <li key={s.leg} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-extrabold text-page">
                {s.leg}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{s.place}</span>
                <span className="block text-[13px] text-ink-3">{s.dates}</span>
                {s.pick && <span className="mt-0.5 block text-[13px] font-semibold text-primary-ink">👍 추천: {s.pick}</span>}
              </span>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold ${
                  s.status === "확정" ? "bg-primary-soft text-primary-ink" : "bg-accent-soft text-accent"
                }`}
              >
                {s.status}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {LEGS.map((leg) => (
        <LegSection key={leg.id} leg={leg} />
      ))}

      {PLAN && <PlanSection plan={PLAN} />}
    </div>
  );
}

function LegSection({ leg }: { leg: Leg }) {
  return (
    <section className={`${card} p-5 md:p-6`}>
      <h3 className="text-[20px] leading-snug font-bold tracking-tight">{leg.title}</h3>
      <p className="text-[13px] text-ink-3">{leg.dates}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {leg.focus.map((f) => (
          <li key={f} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-ink-2">
            📍 {f}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-primary-soft p-4">
        <p className="text-[14px] font-bold text-primary-ink">👍 최종 추천</p>
        <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{leg.finalPick}</p>
      </div>

      {/* 고르신 두 곳 비교 */}
      <div className="mt-5">
        <p className="text-[16px] font-bold">
          고르신 두 곳 비교 · {leg.pair.hotels.map((h) => h.name.split(" (")[0]).join(" vs ")}
        </p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-2 gap-px bg-line text-[13px] font-bold">
            {leg.pair.hotels.map((h) => (
              <div key={h.id} className="bg-surface-2 px-3 py-2">
                {h.name.split(" (")[0]}
                <span className="block text-[11px] font-medium text-ink-3">{h.localName}</span>
              </div>
            ))}
          </div>
          {leg.pair.rows.map((row) => (
            <div key={row.label} className="border-t border-line">
              <p className="bg-surface px-3 pt-2 text-[12px] font-bold text-ink-3">{row.label}</p>
              <div className="grid grid-cols-2 gap-px bg-line">
                {row.values.map((v, i) => (
                  <p key={i} className="bg-surface px-3 pt-1 pb-2 text-[13px] leading-snug text-ink-2">
                    {v}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-2xl bg-surface-2 p-3 text-[14px] leading-relaxed text-ink">{leg.pair.verdict}</p>
      </div>

      {/* 대안 포함 전체 순위 */}
      <div className="mt-5">
        <p className="text-[16px] font-bold">걸어서 가산점 포함 추천 순위</p>
        {leg.scoreMethod && <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{leg.scoreMethod}</p>}
        <ol className="mt-2 space-y-2">
          {leg.ranking.map((c, i) => (
            <CandidateRow key={c.id} c={c} rank={i + 1} picked={c.id === leg.pickId} />
          ))}
        </ol>
      </div>

      {leg.extra && (
        <div className="mt-5 rounded-2xl border border-line p-4">
          <p className="text-[15px] font-bold">{leg.extra.title}</p>
          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{leg.extra.summary}</p>
          {leg.extra.items && leg.extra.items.length > 0 && (
            <ul className="mt-2 divide-y divide-line">
              {leg.extra.items.map((it) => (
                <li key={it.name} className="py-2 text-[13px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold text-ink">{it.name}</span>
                    <span className="font-bold tabular-nums">{it.price}</span>
                  </div>
                  <p className="text-ink-3">
                    {it.pickup}
                    {it.note ? ` · ${it.note}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {leg.extra.tips && <p className="mt-2 text-[13px] leading-relaxed text-ink-3">💡 {leg.extra.tips}</p>}
        </div>
      )}

      {leg.bookingTips && (
        <details className="mt-4 rounded-2xl bg-accent-soft px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-bold text-accent">📝 예약할 때 요청·확인할 것</summary>
          <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink">{leg.bookingTips}</p>
        </details>
      )}
      {leg.claims.length > 0 && (
        <details className="mt-2 rounded-2xl bg-surface-2 px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">🔍 검증 결과 ({leg.claims.length}개 항목)</summary>
          <ul className="mt-2 space-y-2">
            {leg.claims.map((c, i) => (
              <li key={i} className="text-[13px] leading-snug">
                <span className={`mr-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold ${VERDICT_STYLE[c.verdict]}`}>
                  {c.verdict}
                </span>
                <span className="font-semibold text-ink">{c.claim}</span>
                <span className="block text-ink-3">{c.verdict === "맞음" ? c.evidence : c.fix || c.evidence}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function CandidateRow({ c, rank, picked }: { c: Candidate; rank: number; picked: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-2xl border ${picked ? "border-primary ring-1 ring-primary" : "border-line"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3 text-left active:bg-surface-2"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold ${
            rank === 1 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"
          }`}
        >
          {rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">
            {c.name}
            {c.isNew && <span className="ml-1.5 rounded bg-accent-soft px-1 py-0.5 text-[11px] font-bold text-accent">NEW</span>}
            {picked && (
              <span className="ml-1.5 rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">👍 최종 추천</span>
            )}
          </span>
          <span className="mt-0.5 block text-[13px] text-ink-2">🚶 {c.walk}</span>
          <span className="mt-0.5 block text-[13px] font-semibold text-ink">💰 {c.priceShort || c.price}</span>
        </span>
        <span className="shrink-0 rounded-xl bg-accent-soft px-2 py-1 text-[15px] font-bold text-accent tabular-nums">
          {c.score.toFixed(2).replace(/0$/, "")}
        </span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-line px-3 py-3 text-[13px] leading-relaxed">
          {[
            ["🏨 시설", c.facilities],
            ["🛏️ 객실", c.room],
            ["💰 가격 자세히", c.priceShort ? c.price : ""],
            ["🧒 아이", c.kids],
            ["⚠️ 주의", c.risks],
            ["📊 점수 근거", c.scoreWhy],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <p key={k}>
                <b className="text-ink">{k}</b> <span className="text-ink-2">{v}</span>
              </p>
            ))}
          <p className="text-[12px] text-ink-4">{c.localName}</p>
        </div>
      )}
    </li>
  );
}

function PlanSection({ plan }: { plan: Plan }) {
  return (
    <section className={`${card} p-5 md:p-6`}>
      <h3 className="text-[20px] leading-snug font-bold tracking-tight">🧳 이동·예산·래디슨 블루</h3>
      {plan.transfers.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {plan.transfers.map((t, i) => (
            <li key={i} className="px-3 py-2.5 text-[13px]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-bold text-ink">{t.leg}</span>
                <span className="font-semibold tabular-nums">{t.fare}</span>
              </div>
              <p className="text-ink-2">
                {t.how} · {t.time}
              </p>
            </li>
          ))}
        </ul>
      )}
      {[
        ["🏝️ 래디슨 블루 리조트 캄란 (10/6~10/8, 확정)", plan.radisson],
        ["🔁 같은 호텔에 두 번 묵는다면", plan.sameHotelTwice],
        ["💰 숙박비 합계", plan.budget],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="mt-4">
            <p className="text-[15px] font-bold">{k}</p>
            <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{v}</p>
          </div>
        ))}
      {plan.dayFlow && (
        <details className="mt-4 rounded-2xl bg-surface-2 px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">📅 이 숙소 동선에 맞춘 날짜별 흐름 (제안)</summary>
          <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{plan.dayFlow}</p>
        </details>
      )}
    </section>
  );
}
