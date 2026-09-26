"use client";

import { useState } from "react";
import ranking from "@/data/cityRanking.json";
import type { BlogPost } from "@/lib/guideTypes";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

interface RankedHotel {
  id: string;
  name: string;
  localName: string;
  rating: string;
  perNight: string;
  total: string;
  breakfast: string;
  breakfastScore: number;
  breakfastDetail: string;
  kids: string;
  location: string;
  lateCheckout: string;
  pros: string[];
  cons: string[];
  links: { label: string; url: string }[];
  blogPosts: BlogPost[];
  verdict: string;
  scores: Record<Criterion, number>;
  scoreNotes: Record<Criterion, string>;
  // 최종 후보 재조사(찜한 날짜·객실 기준)에서 채워지는 값
  alert?: string;
  roomReview?: string;
  childPolicy?: string;
  priceCompare?: { channel: string; room: string; dates: string; price: string; breakfast: string; cancel: string; source: string }[];
  priceVerdict?: string;
  cancellation?: string;
  lateArrival?: string;
  recentIssues?: string;
  breakfastUpdate?: string;
}

type Criterion = "access" | "condition" | "breakfast" | "price" | "kids";
type SortKey = "total" | Criterion;

const WEIGHTS = ranking.weights as Record<Criterion, number>;
const CRITERIA: { key: Criterion; label: string; icon: string }[] = [
  { key: "access", label: "접근성·위치", icon: "📍" },
  { key: "condition", label: "호텔 상태", icon: "🏨" },
  { key: "breakfast", label: "조식", icon: "🍳" },
  { key: "price", label: "가격", icon: "💰" },
  { key: "kids", label: "아이 시설", icon: "🧒" },
];
const totalScore = (h: RankedHotel) =>
  CRITERIA.reduce((sum, c) => sum + (h.scores?.[c.key] ?? 0) * (WEIGHTS[c.key] ?? 0), 0);

// 사용자가 아고다 찜 목록으로 정한 최종 후보 (찜한 객실·날짜·가격)
interface Finalist {
  id: string;
  agoda: string;
  stars: number;
  room: string;
  size: string;
  beds: string;
  view: string;
  nights: number;
  price: number;
  cancel: string;
  cancelBy: string | null;
  alt?: string;
  note?: string;
}
const FINALISTS = (ranking.finalists?.items ?? []) as Finalist[];
const FINAL = new Map(FINALISTS.map((f) => [f.id, f]));

const ALL = ranking.hotels as unknown as RankedHotel[];
// 최종 후보가 있으면 그 호텔들만 순위에 넣고, 나머지는 아래에 접어 둔다
const RANKED = FINAL.size > 0 ? ALL.filter((h) => FINAL.has(h.id)) : ALL;
const DROPPED = FINAL.size > 0 ? ALL.filter((h) => !FINAL.has(h.id)) : [];
function sortHotels(list: RankedHotel[], key: SortKey): RankedHotel[] {
  const val = (h: RankedHotel) => (key === "total" ? totalScore(h) : h.scores[key]);
  // 동점이면 종합 점수 순
  return [...list].sort((a, b) => val(b) - val(a) || totalScore(b) - totalScore(a));
}
const PENDING = ranking.pending as string[];

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;
const perNight = (f: Finalist) => `1박 약 ${(f.price / f.nights / 10000).toFixed(1)}만원`;

function ScoreBadge({ value, label }: { value: number; label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1 rounded-xl bg-accent-soft px-2.5 py-1 font-bold whitespace-nowrap text-accent">
      {label && <span className="text-[12px]">{label}</span>}
      <span className="text-[17px] tabular-nums">{Number.isInteger(value) ? value.toFixed(1) : value.toFixed(2).replace(/0$/, "")}</span>
      <span className="text-[11px] text-ink-3">/5</span>
    </span>
  );
}

function imageSearch(h: RankedHotel, extra: string) {
  const q = `${h.localName.split(" (")[0]} Nha Trang ${extra}`.trim();
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}

export default function RankingTab() {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const HOTELS = sortHotels(RANKED, sortKey);
  return (
    <div className="space-y-5">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">나트랑 시내 호텔 순위</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">
          {FINAL.size > 0 ? `최종 후보 ${FINAL.size}곳 비교 순위` : "접근성·호텔 상태 중심 추천 순위"}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          블로그 후기와 예약 사이트 평점을 토대로 항목별 5점 만점으로 매겼어요. 종합 점수 비중은{" "}
          {CRITERIA.map((c) => `${c.label} ${Math.round((WEIGHTS[c.key] ?? 0) * 100)}%`).join(" · ")}예요.{" "}
          {FINAL.size > 0
            ? `가격·객실은 아고다 찜 목록 기준이고, ${ranking.finalists?.updatedAt ?? ""} 같은 날짜로 다시 조사했어요.`
            : "가격은 2026-09-25 예약 사이트 조회 기준 참고가예요."}
        </p>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {([["total", "🏆 종합"], ...CRITERIA.map((c) => [c.key, `${c.icon} ${c.label}`])] as [SortKey, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                aria-pressed={sortKey === key}
                className={`press min-h-10 shrink-0 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap ${
                  sortKey === key ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        {ranking.finalists?.recommendation && (
          <div className="mt-3 rounded-2xl bg-primary-soft p-4">
            <p className="text-[14px] font-bold text-primary-ink">👍 이 날짜·객실 기준 추천</p>
            <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">
              {ranking.finalists.recommendation}
            </p>
          </div>
        )}
        {ranking.finalists?.deadlines && (
          <details className="mt-2 rounded-2xl bg-accent-soft px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-bold text-accent">📅 무료 취소 마감일 · 언제 결정할지</summary>
            <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink">{ranking.finalists.deadlines}</p>
          </details>
        )}
        {ranking.finalists?.caveats && (
          <details className="mt-2 rounded-2xl bg-surface-2 px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💡 가격 비교의 한계 · 예약 전 확인할 것</summary>
            <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{ranking.finalists.caveats}</p>
          </details>
        )}
        {PENDING.length > 0 && (
          <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-[14px] font-semibold text-accent">
            🔄 조사 중: {PENDING.join(" · ")} — 끝나면 순위에 합쳐져요
          </p>
        )}
      </section>

      {/* 한눈에 보기 */}
      <section className={`${card} overflow-hidden`}>
        <ol>
          {HOTELS.map((h, i) => (
            <li key={h.id} className="border-t border-line first:border-0">
              <a href={`#rank-${h.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 md:px-5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold ${
                    i === 0 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold">{h.name}</span>
                  {FINAL.has(h.id) ? (
                    <FinalLine f={FINAL.get(h.id)!} />
                  ) : (
                    <span className="mt-0.5 block text-[13px] text-ink-3">{h.perNight}</span>
                  )}
                </span>
                <ScoreBadge value={sortKey === "total" ? totalScore(h) : h.scores[sortKey]} />
              </a>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {HOTELS.map((h, i) => (
          <HotelCard key={h.id} hotel={h} rank={i + 1} />
        ))}
      </div>

      {DROPPED.length > 0 && (
        <details className={`${card} px-5 py-4`}>
          <summary className="cursor-pointer text-[15px] font-bold text-ink-2">
            찜 목록에서 뺀 호텔 {DROPPED.length}곳 ({DROPPED.map((h) => h.name.split(" (")[0]).join(" · ")})
          </summary>
          <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {sortHotels(DROPPED, "total").map((h) => (
              <HotelCard key={h.id} hotel={h} rank={null} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// 최종 후보 한 줄 요약: 찜한 객실 · 박수·총액 · 취소 조건 (아고다 찜 기준)
function FinalLine({ f }: { f: Finalist }) {
  const refundable = f.cancelBy !== null;
  return (
    <>
      <span className="mt-0.5 block text-[13px] text-ink-3">
        {f.room} · {f.nights}박 <b className="font-semibold text-ink-2 tabular-nums">{won(f.price)}</b> ({perNight(f)})
      </span>
      <span
        className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[12px] font-bold ${
          refundable ? "bg-primary-soft text-primary-ink" : "bg-accent-soft text-accent"
        }`}
      >
        {refundable ? `✓ ${f.cancel.split(" · ")[0]}` : `⚠️ ${f.cancel}`}
      </span>
    </>
  );
}

// 호텔 카드 안의 '아고다 찜' 상자
function FinalBox({ f }: { f: Finalist }) {
  return (
    <div className="mt-3 rounded-2xl border border-primary/30 bg-primary-soft p-4">
      <p className="text-[13px] font-bold text-primary-ink">
        💙 아고다 찜 · {ranking.finalists?.dates.split(" · ")[0]} ({f.nights}박)
      </p>
      <p className="mt-1 text-[16px] font-bold tracking-tight">
        {f.room} <span className="text-[14px] font-medium text-ink-2">{f.size}</span>
      </p>
      <p className="text-[13px] text-ink-2">
        {f.beds} · {f.view} · 조식 포함 · 아고다 {f.agoda}
      </p>
      <p className="mt-2 text-[18px] font-bold tracking-tight tabular-nums">
        {won(f.price)} <span className="text-[13px] font-medium text-ink-3">{f.nights}박 세금 포함 · {perNight(f)}</span>
      </p>
      <p className={`mt-1 text-[13px] font-semibold ${f.cancelBy ? "text-primary-ink" : "text-accent"}`}>
        {f.cancelBy ? "✓" : "⚠️"} {f.cancel}
      </p>
      {f.alt && <p className="mt-1 text-[13px] text-ink-3">다른 찜 객실: {f.alt}</p>}
      {f.note && <p className="mt-1 text-[13px] text-ink-3">{f.note}</p>}
    </div>
  );
}

function HotelCard({ hotel: h, rank }: { hotel: RankedHotel; rank: number | null }) {
  const [open, setOpen] = useState(false);
  return (
    <article id={`rank-${h.id}`} className={`${card} p-5 md:p-6 ${rank === 1 ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-lg px-2 py-1 text-[13px] font-bold ${rank === 1 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          {rank === null ? "후보 제외" : `${rank}위`}
        </span>
        <ScoreBadge value={totalScore(h)} label="종합" />
      </div>
      <h3 className="mt-2 text-[20px] leading-snug font-bold tracking-tight">{h.name}</h3>
      <p className="text-[13px] text-ink-3">{h.localName}</p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{h.rating}</p>
      {FINAL.has(h.id) && <FinalBox f={FINAL.get(h.id)!} />}
      {h.alert && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3.5 text-[14px] leading-relaxed font-medium text-ink">
          <b className="text-accent">⚠️ 예약 전 확인</b> {h.alert}
        </p>
      )}

      {FINAL.has(h.id) ? (
        <p className="mt-2 text-[13px] text-ink-3">🍳 조식: {h.breakfast}</p>
      ) : (
        <div className="mt-3 rounded-2xl bg-surface-2 p-4">
          <p className="text-[18px] font-bold tracking-tight">{h.perNight}</p>
          <p className="mt-0.5 text-[14px] text-ink-2">{h.total}</p>
          <p className="mt-0.5 text-[13px] text-ink-3">조식: {h.breakfast}</p>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {CRITERIA.map((c) => (
          <li key={c.key}>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-24 shrink-0 font-semibold text-ink-2">
                {c.icon} {c.label}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(h.scores[c.key] / 5) * 100}%` }} />
              </span>
              <span className="w-7 shrink-0 text-right font-bold tabular-nums">{h.scores[c.key]}</span>
            </div>
            <p className="mt-0.5 pl-[6.5rem] text-[12px] leading-snug text-ink-3 max-sm:pl-0">{h.scoreNotes[c.key]}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[15px] leading-relaxed font-medium text-ink">{h.verdict}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[13px] font-bold text-primary-ink">좋아요</p>
          <ul className="space-y-1 text-[14px] text-ink-2">
            {h.pros.map((p, i) => (
              <li key={i}>· {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[13px] font-bold text-danger">아쉬워요</p>
          <ul className="space-y-1 text-[14px] text-ink-2">
            {h.cons.map((c, i) => (
              <li key={i}>· {c}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-line text-[15px] font-semibold text-ink-2"
      >
        {open ? "접기 ▲" : "자세히 보기 (조식·위치·체크인·후기) ▼"}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
          {h.roomReview && <InfoBlock title="🛏️ 찜한 객실 실제 후기" body={h.roomReview} />}
          {h.childPolicy && <InfoBlock title="🧒 4살 숙박·조식 규정" body={h.childPolicy} />}
          <div className="rounded-2xl bg-primary-soft p-4">
            <p className="font-bold text-primary-ink">🍳 조식 (아이 기준)</p>
            <p className="mt-1 whitespace-pre-line text-ink">{h.breakfastUpdate || h.breakfastDetail}</p>
          </div>
          {h.priceCompare && h.priceCompare.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-ink">💰 같은 날짜 가격 비교</p>
              {h.priceVerdict && <p className="mb-2 text-ink-2">{h.priceVerdict}</p>}
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {h.priceCompare.map((c, i) => (
                  <li key={`${c.channel}-${i}`} className="px-3 py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-semibold">{c.channel}</span>
                      <span className="text-[13px] font-bold tabular-nums">{c.price}</span>
                    </div>
                    <p className="text-[12px] text-ink-3">
                      {c.room} · {c.dates} · 조식 {c.breakfast} · {c.cancel}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {h.cancellation && <InfoBlock title="↩️ 취소 규정" body={h.cancellation} />}
          <InfoBlock title="🕑 새벽 입실·체크아웃·짐보관" body={h.lateArrival || h.lateCheckout} />
          {h.recentIssues && <InfoBlock title="⚠️ 2026년 최근 이슈" body={h.recentIssues} />}
          <p>
            <b className="text-ink">🧒 아이 시설</b> <span className="text-ink-2">{h.kids}</span>
          </p>
          <p>
            <b className="text-ink">📍 위치</b> <span className="text-ink-2">{h.location}</span>
          </p>
          {h.blogPosts.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-ink-2">블로그 후기</p>
              <ul className="-mx-3">
                {h.blogPosts.map((p, i) => (
                  <BlogPostRow key={`${p.url}-${i}`} post={p} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a className={btn.soft} href={imageSearch(h, "breakfast buffet")} target="_blank" rel="noopener noreferrer">
          🍳 조식 사진 보기
        </a>
        <a className={btn.secondary} href={imageSearch(h, "hotel room")} target="_blank" rel="noopener noreferrer">
          📷 호텔 사진
        </a>
        {h.links.slice(0, 2).map((l, i) => (
          <a key={i} className={btn.secondary} href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label} ↗
          </a>
        ))}
      </div>
    </article>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-bold text-ink">{title}</p>
      <p className="mt-0.5 whitespace-pre-line text-ink-2">{body}</p>
    </div>
  );
}
