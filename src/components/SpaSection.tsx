"use client";

import { useState } from "react";
import data from "@/data/spas.json";
import type { BlogPost, PriceRow } from "@/lib/guideTypes";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

type SpaArea = "city" | "camranh" | "other";

export interface SpaShop {
  id: string;
  rank: number;
  name: string;
  localName: string;
  area: SpaArea;
  address: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  rating: string;
  priceSummary: string;
  menu: PriceRow[];
  /** 한눈에 보는 특징 (예: 키즈 마사지, 가족룸, 무료 픽업, 공항 드랍, 샤워·짐보관) */
  tags: string[];
  kids: string;
  pickup: string;
  shower: string;
  payment: string;
  booking: string;
  distance: string;
  pros: string[];
  cons: string[];
  whyRecommend: string;
  bestFor: string;
  latestReviewDate: string;
  blogPosts: BlogPost[];
  /** 마사지 후보 샵만 — 카드 맨 위의 가격 정책 · 예약 방법 */
  policy?: SpaPolicy;
  /** 네일 전문샵 — 마사지 목록에는 안 나오고 💅 네일아트 탭에만, 순위는 네일끼리 */
  kind?: "nail";
}

interface PolicyRow {
  label: string;
  text: string;
}
interface SpaPolicy {
  price: PolicyRow[];
  book: PolicyRow[];
}

/** 일정의 마사지 칸에서 볼 때: 그 날짜의 우리 예약 요약과 카톡 문구 (lib/spaSlots) */
export interface SpaSlotInfo {
  when: string;
  total: string;
  message?: string;
}

const SHOPS = [...(data.shops as SpaShop[])].sort((a, b) => a.rank - b.rank);
const AREA_LABEL: Record<SpaArea, string> = { city: "🏙️ 시내", camranh: "🏝️ 캄란", other: "📍 기타" };

type Filter = "all" | "city" | "camranh" | "departure" | "nail";
const FILTERS: [Filter, string][] = [
  ["all", "전체"],
  ["city", "🏙️ 시내"],
  ["camranh", "🏝️ 캄란"],
  ["departure", "✈️ 출국 전 샤워"],
  ["nail", "💅 네일아트"],
];
// 출국 전: 공항 드랍 + 샤워가 둘 다 되는 곳
const isDeparture = (s: SpaShop) => s.tags.some((t) => t.startsWith("✈️")) && s.tags.some((t) => t.startsWith("🚿"));
const isNailShop = (s: SpaShop) => s.kind === "nail";
// 네일 탭: 네일 전문샵(네일 순위대로) + 네일이 괜찮은 스파(💅 칩)
const matches = (s: SpaShop, f: Filter) =>
  f === "nail"
    ? isNailShop(s) || s.tags.some((t) => t.startsWith("💅"))
    : !isNailShop(s) && (f === "all" || (f === "departure" ? isDeparture(s) : s.area === f));

function mapUrl(s: SpaShop) {
  return s.lat !== null && s.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.localName} Nha Trang`)}`;
}
const photoUrl = (s: SpaShop) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${s.localName} Nha Trang ${isNailShop(s) ? "nail" : "spa"}`)}`;

export default function SpaSection() {
  const [filter, setFilter] = useState<Filter>("all");
  if (SHOPS.length === 0) {
    return (
      <div className={`${card} p-10 text-center text-ink-3`}>
        가족 마사지·스파를 조사하고 있어요. 조사가 끝나면 여기에 표시돼요.
      </div>
    );
  }
  const list = SHOPS.filter((s) => matches(s, filter)).sort(
    (a, b) => Number(isNailShop(b)) - Number(isNailShop(a)) || a.rank - b.rank,
  );
  return (
    <div className="space-y-4">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">가족 마사지·스파 추천</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">4살 아이와 같이 받을 수 있는 곳</h2>
        {data.summary && (
          <ul className="mt-3 space-y-2.5 rounded-2xl bg-primary-soft p-4 text-[14px] leading-relaxed text-ink">
            {data.summary.split("\n").map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`press min-h-10 shrink-0 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap ${
                filter === key ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filter === "nail" && (
          <p className="mt-3 rounded-2xl bg-accent-soft p-4 text-[14px] leading-relaxed text-ink">
            💅 엄마 젤아트 + 아이 키즈네일 기준이에요. 키즈네일은 모두 램프로 굳히는 젤이라 1~2주면 떨어져요.
            수성·필오프 매니큐어인지는 어느 가게도 밝히지 않았고, 만 4살이 되는지는 오드리네일 깜란점만 메뉴에
            적혀 있어요. 나머지는 카톡으로 &lsquo;만 4살, 키 100cm&rsquo;를 먼저 물어보세요.
          </p>
        )}
        {data.tips && (
          <details className="mt-3 rounded-2xl bg-surface-2 px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💡 이용 팁 (팁 금액·예약·아이 주의점)</summary>
            <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{data.tips}</p>
          </details>
        )}
      </section>

      {data.deals && filter !== "nail" && <DealsSummary />}

      {list.length === 0 ? (
        <div className={`${card} p-8 text-center text-ink-3`}>이 조건에 맞는 곳이 없어요.</div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
          {list.map((s) => (
            <SpaCard key={s.id} shop={s} />
          ))}
        </div>
      )}
      {data.updatedAt && (
        <p className="px-1 text-[12px] text-ink-4">
          {data.updatedAt} 블로그·구글 리뷰 기준이에요. 가격과 아이 가능 여부는 예약할 때 카톡으로 한 번 더 확인하세요.
        </p>
      )}
    </div>
  );
}

export function SpaCard({ shop: s, slot }: { shop: SpaShop; slot?: SpaSlotInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${card} p-5 md:p-6 ${s.rank === 1 ? "ring-2 ring-accent" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span className={`rounded-lg px-2 py-0.5 ${s.rank === 1 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          {isNailShop(s) ? "💅 네일" : "추천"} {s.rank}
        </span>
        <span className="text-ink-3">{AREA_LABEL[s.area]}</span>
        {s.bestFor && <span className="min-w-0 text-ink-3">· {s.bestFor}</span>}
      </div>
      <h3 className="mt-1.5 text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{s.name}</h3>
      <p className="text-[13px] text-ink-3">{s.localName}</p>
      {s.rating && <p className="mt-1 text-[13px] font-medium text-ink-2">⭐ {s.rating}</p>}

      {(slot || s.policy) && <SpaPlanBox slot={slot} policy={s.policy} />}

      {s.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <li key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-ink-2">
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 rounded-2xl bg-surface-2 p-4">
        <p className="text-[13px] font-semibold text-ink-3">가격</p>
        <p className="mt-0.5 text-[16px] leading-snug font-bold tracking-tight">{s.priceSummary}</p>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-ink">{s.whyRecommend}</p>
      <p className={`mt-2 text-[14px] leading-relaxed text-ink-2 ${open ? "" : "line-clamp-3"}`}>
        <b className="text-ink">🧒 아이</b> {s.kids}
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-line text-[15px] font-semibold text-ink-2"
      >
        {open ? "접기 ▲" : "자세히 보기 (메뉴·픽업·예약·후기) ▼"}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
          {DEALS[s.id] && <ShopDeals deal={DEALS[s.id]} />}
          {s.menu.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-ink-2">메뉴·가격</p>
              <ul className="divide-y divide-line">
                {s.menu.map((m, i) => (
                  <li key={`${m.item}-${i}`} className="py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-ink-2">{m.item}</span>
                      <span className="font-semibold tabular-nums">{m.price}</span>
                    </div>
                    {(m.note || m.source.startsWith("http")) && (
                      <p className="mt-0.5 text-[12px] text-ink-3">
                        {m.note}{" "}
                        {m.source.startsWith("http") && (
                          <a href={m.source} target="_blank" rel="noopener noreferrer" className="text-ink-4 underline">
                            출처
                          </a>
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {[
            ["🚐 픽업·드랍", s.pickup],
            ["🚿 샤워·짐보관", s.shower],
            ["💳 결제·팁", s.payment],
            ["📱 예약", s.booking],
            ["📍 위치", `${s.address}${s.distance ? ` — ${s.distance}` : ""}`],
            ["🕑 영업", s.hours],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <p key={k}>
                <b className="text-ink">{k}</b> <span className="text-ink-2">{v}</span>
              </p>
            ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[13px] font-bold text-primary-ink">좋아요</p>
              <ul className="space-y-1 text-ink-2">
                {s.pros.map((p, i) => (
                  <li key={i}>· {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[13px] font-bold text-danger">아쉬워요</p>
              <ul className="space-y-1 text-ink-2">
                {s.cons.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
          {s.blogPosts.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-ink-2">블로그 후기</p>
              <ul className="-mx-3">
                {s.blogPosts.map((p, i) => (
                  <BlogPostRow key={`${p.url}-${i}`} post={p} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a className={btn.soft} href={mapUrl(s)} target="_blank" rel="noopener noreferrer">
          구글 지도
        </a>
        <a className={btn.secondary} href={photoUrl(s)} target="_blank" rel="noopener noreferrer">
          📷 가게 사진
        </a>
      </div>
    </article>
  );
}

// 마사지 후보 샵: (일정에서 볼 때) 우리 예약 → 가격 정책 → 예약 방법 → (일정에서 볼 때) 카톡 문구 복사
function SpaPlanBox({ slot, policy }: { slot?: SpaSlotInfo; policy?: SpaPolicy }) {
  const [copied, setCopied] = useState(false);
  const copy = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      window.prompt("아래 문구를 복사하세요", message);
    }
  };
  const rows = (title: string, list: PolicyRow[]) => (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      <dl className="mt-2 space-y-2 text-[14px] leading-relaxed">
        {list.map((r) => (
          <div key={r.label}>
            <dt className="text-[13px] font-bold text-primary-ink">{r.label}</dt>
            <dd className="text-ink-2">{r.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  return (
    <div className="mt-3 space-y-3">
      {slot && (
        <div className="rounded-2xl bg-accent-soft p-4">
          <p className="text-[13px] font-bold text-accent">📌 우리 일정에서</p>
          <p className="mt-1 text-[15px] leading-snug font-bold text-ink">{slot.when}</p>
          <p className="mt-1 text-[15px] leading-snug font-bold text-primary-ink">예상 {slot.total}</p>
        </div>
      )}
      {policy && rows("💸 가격 정책", policy.price)}
      {policy && rows("📱 예약 방법", policy.book)}
      {slot?.message && (
        <details className="rounded-2xl border border-line px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💬 카톡 예약 문구 (복사해서 보내기)</summary>
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{slot.message}</p>
          <button
            type="button"
            onClick={() => slot.message && copy(slot.message)}
            className="press mt-2 min-h-10 rounded-xl bg-ink px-4 text-[14px] font-semibold text-page"
          >
            {copied ? "복사했어요 ✓" : "문구 복사"}
          </button>
        </details>
      )}
    </div>
  );
}

// ── 예약 경로별 가격·혜택 (카톡 사전예약·해피아워·마이리얼트립·구글리뷰 등, 2026-09-27 조사·검증) ──
interface DealChannel {
  channel: string;
  discount: string;
  familyTotal: string;
  conditions: string;
  source: string;
}
interface ShopDeal {
  name: string;
  area: string;
  channels: DealChannel[];
  freeTransfer: string;
  bestWay: string;
}
const DEALS = (data.deals?.shops ?? {}) as Record<string, ShopDeal>;

function DealsSummary() {
  const [copied, setCopied] = useState(false);
  const deals = data.deals;
  if (!deals) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deals.message);
      setCopied(true);
    } catch {
      window.prompt("아래 문구를 복사하세요", deals.message);
    }
  };
  return (
    <section className={`${card} p-5 md:p-6`}>
      <p className="text-[15px] font-semibold text-ink-3">💸 어디서 예약하면 싸고 편할까</p>
      <h2 className="mt-1 text-[20px] leading-snug font-bold tracking-tight">예약 경로별 가격·혜택 비교 결과</h2>
      <div className="mt-3 rounded-2xl bg-primary-soft p-4">
        <p className="text-[14px] font-bold text-primary-ink">10/9 쉐라톤 → 마사지 → 공항</p>
        <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{deals.pick109}</p>
      </div>
      <div className="mt-2 rounded-2xl bg-surface-2 p-4">
        <p className="text-[14px] font-bold text-ink-2">캄란 (래디슨에서, 선택)</p>
        <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{deals.pickCamRanh}</p>
      </div>
      <details className="mt-2 rounded-2xl border border-line px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-bold text-ink-2">📱 카톡 예약 문구 (복사해서 보내기)</summary>
        <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{deals.message}</p>
        <button type="button" onClick={copy} className="press mt-2 min-h-10 rounded-xl bg-ink px-4 text-[14px] font-semibold text-page">
          {copied ? "복사했어요 ✓" : "문구 복사"}
        </button>
      </details>
      <p className="mt-2 text-[12px] text-ink-4">샵마다 경로별 가격은 아래 카드의 &lsquo;자세히 보기&rsquo;에 있어요. ({deals.updatedAt} 조사·검증)</p>
    </section>
  );
}

function ShopDeals({ deal }: { deal: ShopDeal }) {
  return (
    <div className="rounded-2xl bg-primary-soft p-4">
      <p className="font-bold text-primary-ink">💸 예약 경로별 가격·혜택</p>
      <p className="mt-1 text-ink">{deal.bestWay}</p>
      <ul className="mt-2 divide-y divide-primary/20">
        {deal.channels.map((c, i) => (
          <li key={`${c.channel}-${i}`} className="py-2 text-[13px]">
            <p className="font-bold text-ink">{c.channel}</p>
            <p className="text-ink-2">
              <b>혜택</b> {c.discount}
            </p>
            <p className="text-ink-2">
              <b>우리 가족 총액</b> {c.familyTotal}
            </p>
            <p className="text-ink-3">{c.conditions}</p>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[13px] text-ink-2">
        <b>🚐 무료 픽업·샌딩</b> {deal.freeTransfer}
      </p>
    </div>
  );
}
