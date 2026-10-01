"use client";

// 10/5 빈원더스 티켓 — 어떤 상품을 살까 (상품 비교) + 어디서 살까 (구매처 비교) + 101cm 아이 표 전략 + 현장 매표소.
// 상품·구매처 비교는 src/data/vinwondersTickets.json (2026-10-01 조사).

import { useState } from "react";
import data from "@/data/vinwondersTickets.json";
import { toggleChecklistItem } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { CopyBlock } from "./HowToBox";
import { Photo, placePhoto } from "./Photo";
import { btn, card } from "./ui";

interface Channel {
  id: string;
  name: string;
  url: string;
  adult: string;
  child: string;
  code: string;
  voucher: string;
  entry: string;
  cancel: string;
  confirm: string;
  pay: string;
  rating: string;
  pros: string[];
  cons: string[];
  howTo: string[];
  /** 우리 가족 추천 순위 (1이 추천) */
  rank?: number;
}

/** 우리 가족 기준 판단: 바꿀 때만 / 필요 없음 / 일정과 안 맞음 / 외국인 불가 */
type ProductMark = "maybe" | "skip" | "no" | "local";

interface OtherProduct {
  /** 공식 사이트 상품 이름 그대로 */
  name: string;
  short: string;
  mark: ProductMark;
  adult: string;
  child: string;
  /** 추천 상품 대비 어른 1장 차액 */
  diff: string;
  includes: string;
  verdict: string;
}

interface ProductGuide {
  title: string;
  checkedAt: string;
  scope: string;
  pick: {
    name: string;
    nameEn: string;
    why: string[];
    includes: string[];
    prices: { who: string; list: string; sale: string; wow5: string }[];
    totals: { how: string; total: string; note: string; best?: boolean }[];
    totalsNote: string;
    child: string;
    lunchSwitch: string;
    steps: string[];
    checks: string[];
  };
  others: OtherProduct[];
  notSold: string[];
}

interface Alternative {
  id: string;
  name: string;
  time: string;
  cost: string;
  costDetail: string;
  kid: string;
  /** 조심할 점 */
  watch: string;
  deadline: string;
  url: string;
  /** 추천 */
  pick: boolean;
}

interface TicketBriefing {
  checkedAt: string;
  summary: string;
  recommendation: string;
  /** 빈원더스 대신 갈 곳 (10/5 비교) */
  alternatives: { title: string; note: string; rows: Alternative[]; verdict: string };
  /** 어떤 상품을 살까 (10/5 공식 판매 상품 비교) */
  products: ProductGuide;
  /** 우리 상황 (어른 2장 미리 · 아이는 현장 판정) */
  plan: { label: string; value: string }[];
  /** 101cm 아이 표 전략 */
  kid: { title: string; points: string[]; table: { case: string; under: string; over: string }[] };
  channels: Channel[];
  onsite: { price: string; queue: string; tips: string[] };
  unverified: string[];
  sources: string;
}

const T = data as TicketBriefing;
const CHECK_ID = "bk-vinwonders";

export default function VinWondersTicketTab({
  state,
  update,
}: {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}) {
  const check = state.checklist.find((c) => c.id === CHECK_ID);
  const photo = placePhoto("vinwonders") ?? placePhoto("vinwonders-pier");
  const channels = [...T.channels].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const officialUrl = T.channels.find((c) => c.id === "official")?.url;
  return (
    <div className="space-y-4">
      <section className={`${card} overflow-hidden`}>
        {photo && <Photo photo={photo} alt="빈원더스 나트랑" className="aspect-[21/9]" />}
        <div className="p-5 md:p-6">
          <p className="text-[15px] font-bold text-primary-ink">🎢 10/5(월) 빈원더스 티켓 · 어디서 살까</p>
          <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">{T.recommendation}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{T.summary}</p>
          {check && (
            <label className="press mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-primary-soft px-4">
              <input
                type="checkbox"
                checked={check.checked}
                onChange={() => update((s) => toggleChecklistItem(s, CHECK_ID))}
                aria-label="빈원더스 어른 표 구매 완료"
              />
              <span className="text-[15px] font-bold text-primary-ink">
                {check.checked ? "어른 2장 구매 완료 ✓" : "어른 2장 사면 체크 (준비물 탭 예약 목록과 같이 바뀌어요)"}
              </span>
            </label>
          )}
        </div>
      </section>

      <AlternativesSection a={T.alternatives} />

      <PickSection g={T.products} url={officialUrl} />

      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">📌 우리 상황</h3>
        <dl className="mt-2 divide-y divide-line">
          {T.plan.map((p) => (
            <div key={p.label} className="flex gap-3 py-2 text-[14px] leading-snug">
              <dt className="w-20 shrink-0 font-semibold text-ink-3">{p.label}</dt>
              <dd className="min-w-0 text-ink">{p.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">📏 {T.kid.title}</h3>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink">
          {T.kid.points.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-3 bg-surface-2 text-[12px] font-bold text-ink-3">
            <span className="p-2">선택</span>
            <span className="p-2">100cm 미만 판정</span>
            <span className="p-2">100cm 이상 판정</span>
          </div>
          {T.kid.table.map((r) => (
            <div key={r.case} className="grid grid-cols-3 border-t border-line text-[13px] leading-snug">
              <span className="p-2 font-semibold text-ink">{r.case}</span>
              <span className="p-2 text-ink-2">{r.under}</span>
              <span className="p-2 text-ink-2">{r.over}</span>
            </div>
          ))}
        </div>
      </section>

      <OthersSection g={T.products} />

      <section className="space-y-3">
        <h3 className="px-1 text-[19px] font-bold tracking-tight">🛒 구매처 비교 ({channels.length}곳)</h3>
        {channels.map((c) => (
          <ChannelCard key={c.id} c={c} />
        ))}
      </section>

      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">🏪 케이블카역 현장 매표소</h3>
        <dl className="mt-2 divide-y divide-line">
          {(
            [
              ["가격", T.onsite.price],
              ["줄", T.onsite.queue],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex gap-3 py-2 text-[14px] leading-snug">
              <dt className="w-12 shrink-0 font-semibold text-ink-3">{label}</dt>
              <dd className="min-w-0 text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink">
          {T.onsite.tips.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      </section>

      {T.unverified.length > 0 && (
        <details className={`${card} p-5`}>
          <summary className="cursor-pointer text-[15px] font-bold text-ink-2">🤔 확인 못 한 것 ({T.unverified.length})</summary>
          <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-2">
            {T.unverified.map((u) => (
              <li key={u}>• {u}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        {T.checkedAt} 기준 · {T.sources}
      </p>
    </div>
  );
}

/** 🔁 빈원더스 대신 갈 곳 — 10/5 대안 코스 가격·아이·마감 비교 (접어 두고 펼쳐 봐요) */
function AlternativesSection({ a }: { a: TicketBriefing["alternatives"] }) {
  return (
    <details className={`${card} p-5`}>
      <summary className="cursor-pointer text-[17px] font-bold">🔁 {a.title}</summary>
      <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-[14px] leading-relaxed font-semibold text-primary-ink">{a.verdict}</p>
      <ul className="mt-3 space-y-3">
        {a.rows.map((r) => (
          <li key={r.id} className={`rounded-2xl p-4 ${r.pick ? "ring-2 ring-accent" : "bg-surface-2"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[16px] font-bold text-ink">
                {r.pick && <span className="mr-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] text-white">추천</span>}
                {r.name}
              </span>
              <span className="text-[16px] font-bold text-primary-ink tabular-nums">{r.cost}</span>
            </div>
            <dl className="mt-2 space-y-1.5 text-[13px] leading-relaxed">
              {(
                [
                  ["⏰", r.time],
                  ["💵", r.costDetail],
                  ["🧒", r.kid],
                  ["⚠️", r.watch],
                  ["📅", r.deadline],
                ] as const
              ).map(([icon, text]) => (
                <div key={icon} className="flex gap-2">
                  <dt className="shrink-0">{icon}</dt>
                  <dd className="min-w-0 text-ink-2">{text}</dd>
                </div>
              ))}
            </dl>
            {r.url && (
              <a className="mt-2 inline-block text-[13px] font-semibold text-primary-ink underline" href={r.url} target="_blank" rel="noopener noreferrer">
                상품·요금 보기 ↗
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-4">{a.note}</p>
    </details>
  );
}

/** 🎫 이 상품을 사세요 — 상품 이름·가격표·결제 금액·사는 순서 */
function PickSection({ g, url }: { g: ProductGuide; url?: string }) {
  const p = g.pick;
  return (
    <section className={`${card} p-5 ring-2 ring-accent md:p-6`}>
      <p className="text-[14px] font-bold text-accent">🎫 {g.title} · 이 상품을 사세요</p>
      <h3 className="mt-1.5 text-[19px] leading-snug font-bold tracking-tight break-keep">{p.name}</h3>
      <p className="mt-1 text-[12px] leading-snug text-ink-3">{p.nameEn}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{g.scope}</p>

      <ul className="mt-3 space-y-1.5 text-[14px] leading-relaxed text-ink">
        {p.why.map((w) => (
          <li key={w}>👍 {w}</li>
        ))}
      </ul>

      <div className="mt-3 rounded-2xl bg-surface-2 p-3">
        <p className="text-[14px] font-bold text-ink-2">들어 있는 것</p>
        <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-ink">
          {p.includes.map((x) => (
            <li key={x}>✓ {x}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[15px] font-bold">💵 10/5 가격 (공식 사이트)</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-surface-2 text-[12px] font-bold text-ink-3">
          <span className="p-2">구분</span>
          <span className="p-2">판매가</span>
          <span className="p-2">WOW5 (5%)</span>
        </div>
        {p.prices.map((r) => (
          <div
            key={r.who}
            className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-line text-[13px] leading-snug"
          >
            <span className="p-2 font-semibold text-ink">{r.who}</span>
            <span className="p-2 text-ink">
              {r.sale}
              {r.list && <s className="block text-[11px] text-ink-4">{r.list}</s>}
            </span>
            <span className="p-2 text-ink-2">{r.wow5 || "—"}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[15px] font-bold">🧾 어른 2장 결제 금액 (한 번에 주문)</p>
      <ul className="mt-2 space-y-2">
        {p.totals.map((x) => (
          <li key={x.how} className={`rounded-2xl p-3 ${x.best ? "bg-primary-soft" : "bg-surface-2"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-[14px] font-bold text-ink">
                {x.best && <span className="mr-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] text-white">최저</span>}
                {x.how}
              </span>
              <span className="text-[15px] font-bold text-primary-ink tabular-nums">{x.total}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{x.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{p.totalsNote}</p>

      <div className="mt-3 rounded-2xl bg-primary-soft p-3 text-[14px] leading-relaxed text-ink">
        <b className="text-primary-ink">👶 아이 표</b> {p.child}
      </div>
      <div className="mt-2 rounded-2xl bg-surface-2 p-3 text-[14px] leading-relaxed text-ink">
        <b>🍽️ 점심을 뷔페로 바꾸면</b> {p.lunchSwitch}
      </div>

      <div className="mt-4 rounded-2xl bg-accent-soft p-4">
        <p className="text-[15px] font-bold text-accent">📱 사는 순서</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
          {p.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <CopyBlock label="📋 상품 이름 복사 (목록에서 찾을 때)" text={p.name} />
      </div>

      <div className="mt-3 rounded-2xl border border-line p-3">
        <p className="text-[14px] font-bold text-danger">⚠️ 결제 전에 꼭 보기</p>
        <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-ink">
          {p.checks.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      </div>

      {url && (
        <a className={`${btn.primary} mt-4 w-full`} href={url} target="_blank" rel="noopener noreferrer">
          공식 예매 열기 (10/5 · 성인 2) ↗
        </a>
      )}
      <p className="mt-2 text-[12px] text-ink-4">{g.checkedAt}</p>
    </section>
  );
}

const MARK: Record<ProductMark, { label: string; cls: string }> = {
  maybe: { label: "🔁 점심 바꿀 때만", cls: "bg-primary-soft text-primary-ink" },
  skip: { label: "➖ 필요 없음", cls: "bg-surface-2 text-ink-3" },
  no: { label: "✖ 일정과 안 맞음", cls: "bg-surface-2 text-ink-3" },
  local: { label: "⛔ 외국인 못 삼", cls: "bg-danger-soft text-danger" },
};

/** 📋 10/5에 파는 다른 상품 — 왜 안 사는지 */
function OthersSection({ g }: { g: ProductGuide }) {
  return (
    <section className={`${card} p-5`}>
      <h3 className="text-[17px] font-bold">📋 10/5에 파는 다른 상품 ({g.others.length}개)</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
        어른 1장 가격 · 괄호 안은 추천 상품(1,050,000동)과의 차이예요. 우리 일정(08:00~16:30 · 만 3세 101cm) 기준으로 판단했어요.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {g.others.map((o) => (
          <OtherRow key={o.name} o={o} />
        ))}
      </ul>
      <details className="mt-3 rounded-2xl bg-surface-2 p-3">
        <summary className="cursor-pointer text-[14px] font-bold text-ink-2">
          🚫 목록에 보여도 10/5엔 못 사는 상품 (가격 없음)
        </summary>
        <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-2">
          {g.notSold.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function OtherRow({ o }: { o: OtherProduct }) {
  const m = MARK[o.mark];
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${m.cls}`}>{m.label}</span>
        <span className="text-[15px] font-bold text-ink">{o.short}</span>
      </div>
      <p className="mt-1 text-[14px] font-semibold text-primary-ink tabular-nums">
        {o.diff ? `어른 ${o.adult} (${o.diff})` : `아이 ${o.child}`}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink">{o.verdict}</p>
      <details className="mt-1">
        <summary className="cursor-pointer text-[12px] text-ink-3">포함 내용 · 공식 이름</summary>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{o.includes}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-4">{o.name}</p>
        {o.diff && o.child && <p className="mt-0.5 text-[12px] text-ink-3">아이(100~140cm) {o.child}</p>}
      </details>
    </li>
  );
}

function ChannelCard({ c }: { c: Channel }) {
  const [open, setOpen] = useState(c.rank === 1);
  const top = c.rank === 1;
  const rows: [string, string][] = [
    ["아이 표", c.child],
    ["할인", c.code],
    ["바우처", c.voucher],
    ["입장", c.entry],
    ["취소", c.cancel],
    ["확정", c.confirm],
    ["결제", c.pay],
    ["평점", c.rating],
  ];
  return (
    <article className={`${card} p-5 ${top ? "ring-2 ring-accent" : ""}`}>
      {c.rank !== undefined && (
        <span
          className={`rounded-lg px-2 py-0.5 text-[13px] font-bold ${top ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}
        >
          {top ? "추천" : `${c.rank}순위`}
        </span>
      )}
      <h4 className="mt-1.5 text-[19px] leading-snug font-bold tracking-tight">{c.name}</h4>
      <p className="mt-1 text-[16px] leading-snug font-bold text-primary-ink">어른 {c.adult}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press mt-2 inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3 text-[13px] font-semibold text-ink-2"
      >
        {open ? "접기 ▲" : "조건 자세히 ▼"}
      </button>
      {open && (
        <>
          <dl className="mt-3 divide-y divide-line rounded-2xl bg-surface-2 px-3">
            {rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex gap-3 py-2 text-[13px] leading-snug">
                  <dt className="w-14 shrink-0 font-semibold text-ink-3">{label}</dt>
                  <dd className="min-w-0 text-ink">{value}</dd>
                </div>
              ))}
          </dl>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[13px] leading-relaxed sm:grid-cols-2">
            <ul className="rounded-2xl bg-primary-soft p-3 text-ink">
              {c.pros.map((p) => (
                <li key={p}>👍 {p}</li>
              ))}
            </ul>
            <ul className="rounded-2xl bg-accent-soft p-3 text-ink">
              {c.cons.map((x) => (
                <li key={x}>⚠️ {x}</li>
              ))}
            </ul>
          </div>
          {c.howTo.length > 0 && (
            <div className="mt-3 rounded-2xl bg-surface-2 p-3">
              <p className="text-[14px] font-bold text-ink-2">📱 사는 법</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
                {c.howTo.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
      {c.url && (
        <a className={`${btn.soft} mt-3`} href={c.url} target="_blank" rel="noopener noreferrer">
          구매 페이지 열기 ↗
        </a>
      )}
    </article>
  );
}
