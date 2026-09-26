"use client";

import { useState } from "react";
import data from "@/data/spas.json";
import type { BlogPost, PriceRow } from "@/lib/guideTypes";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

type SpaArea = "city" | "camranh" | "other";

interface SpaShop {
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
}

const SHOPS = [...(data.shops as SpaShop[])].sort((a, b) => a.rank - b.rank);
const AREA_LABEL: Record<SpaArea, string> = { city: "🏙️ 시내", camranh: "🏝️ 캄란", other: "📍 기타" };

type Filter = "all" | "city" | "camranh" | "departure";
const FILTERS: [Filter, string][] = [
  ["all", "전체"],
  ["city", "🏙️ 시내"],
  ["camranh", "🏝️ 캄란"],
  ["departure", "✈️ 출국 전 샤워"],
];
// 출국 전: 공항 드랍 + 샤워가 둘 다 되는 곳
const isDeparture = (s: SpaShop) => s.tags.some((t) => t.startsWith("✈️")) && s.tags.some((t) => t.startsWith("🚿"));

function mapUrl(s: SpaShop) {
  return s.lat !== null && s.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.localName} Nha Trang`)}`;
}
const photoUrl = (s: SpaShop) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${s.localName} Nha Trang spa`)}`;

export default function SpaSection() {
  const [filter, setFilter] = useState<Filter>("all");
  if (SHOPS.length === 0) {
    return (
      <div className={`${card} p-10 text-center text-ink-3`}>
        가족 마사지·스파를 조사하고 있어요. 조사가 끝나면 여기에 표시돼요.
      </div>
    );
  }
  const list = SHOPS.filter((s) =>
    filter === "all" ? true : filter === "departure" ? isDeparture(s) : s.area === filter,
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
        {data.tips && (
          <details className="mt-3 rounded-2xl bg-surface-2 px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💡 이용 팁 (팁 금액·예약·아이 주의점)</summary>
            <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{data.tips}</p>
          </details>
        )}
      </section>

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

function SpaCard({ shop: s }: { shop: SpaShop }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${card} p-5 md:p-6 ${s.rank === 1 ? "ring-2 ring-accent" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span className={`rounded-lg px-2 py-0.5 ${s.rank === 1 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          추천 {s.rank}
        </span>
        <span className="text-ink-3">{AREA_LABEL[s.area]}</span>
        {s.bestFor && <span className="min-w-0 text-ink-3">· {s.bestFor}</span>}
      </div>
      <h3 className="mt-1.5 text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{s.name}</h3>
      <p className="text-[13px] text-ink-3">{s.localName}</p>
      {s.rating && <p className="mt-1 text-[13px] font-medium text-ink-2">⭐ {s.rating}</p>}

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
