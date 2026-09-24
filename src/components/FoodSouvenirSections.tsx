"use client";

import { useState } from "react";
import exchange from "@/data/exchange.json";
import { FOOD, SOUVENIR } from "@/data/guide";

const EXCHANGE = exchange;
import type { FoodSpot } from "@/lib/guideTypes";
import { toggleSouvenir } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { dishPhoto, groupPhoto, Photo } from "./Photo";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card, ProgressBar } from "./ui";

const FOOD_KIND: Record<string, string> = {
  pho: "🍜 쌀국수",
  seafood: "🦐 해산물",
  vietnamese: "🥢 베트남 요리",
  bbq: "🔥 숯불구이",
  cafe: "☕ 카페",
  dessert: "🥭 디저트·과일",
  korean: "🇰🇷 한식",
  western: "🍔 양식",
  street: "🥖 길거리 음식",
  "resort-area": "🏝️ 관광지 안 식사",
};

function mapUrl(name: string, lat: number | null, lng: number | null) {
  return lat !== null && lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Nha Trang`)}`;
}

export function FoodSection() {
  return (
    <div className="space-y-5">
      {FOOD.summary && (
        <section className={`${card} p-5 md:p-6`}>
          <p className="text-[15px] font-semibold text-ink-3">날짜별 먹거리 동선</p>
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink">{FOOD.summary}</p>
        </section>
      )}

      <section>
        <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">꼭 먹어볼 음식</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FOOD.mustTry.map((d, i) => (
            <div key={`${d.dish}-${i}`} className={`${card} p-4`}>
              {dishPhoto(d.dish) && (
                <div className="mb-3">
                  <Photo photo={dishPhoto(d.dish)} alt={d.dish} className="aspect-[4/3]" />
                </div>
              )}
              <p className="text-[17px] font-bold tracking-tight">{d.dish}</p>
              <p className="mt-1 text-[14px] text-ink-2">{d.desc}</p>
              <p className="mt-2 text-[14px] text-primary-ink">🧒 {d.kidOk}</p>
              <p className="mt-1 text-[13px] text-ink-3">
                {d.price} · {d.where}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">가게</h3>
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {FOOD.spots.map((s) => (
            <FoodSpotCard key={s.id} spot={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FoodSpotCard({ spot: s }: { spot: FoodSpot }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${card} p-5`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span className="text-ink-3">{FOOD_KIND[s.kind] ?? s.kind}</span>
        {s.nearDay && (
          <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-primary-ink break-words">{s.nearDay}</span>
        )}
      </div>
      <h4 className="mt-1 text-[19px] leading-snug font-bold tracking-tight">{s.name}</h4>
      <p className="text-[13px] text-ink-3 break-words">
        {s.localName}
        {s.hours && ` · ${s.hours}`}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{s.menu}</p>
      <p className="mt-1 text-[14px] font-semibold text-primary-ink">우리 가족 한 끼 {s.priceRange}</p>
      {s.kidFriendly && <p className="mt-1 text-[14px] text-ink-2">🧒 {s.kidFriendly}</p>}
      {open && s.tips && (
        <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
          💡 {s.tips}
        </p>
      )}
      {open && s.blogPosts.length > 0 && (
        <ul className="-mx-3 mt-2">
          {s.blogPosts.map((p, i) => (
            <BlogPostRow key={`${p.url}-${i}`} post={p} />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <a className={`${btn.soft} min-h-11 px-4 text-[14px]`} href={mapUrl(s.localName || s.name, s.lat, s.lng)} target="_blank" rel="noopener noreferrer">
          지도
        </a>
        <button type="button" className={`${btn.secondary} min-h-11 px-4 text-[14px]`} onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : `팁·후기 ${s.blogPosts.length}개`}
        </button>
      </div>
    </article>
  );
}

export function SouvenirSection({
  state,
  update,
}: {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}) {
  const bought = new Set(state.boughtSouvenirs ?? []);
  const groups = [...new Set(SOUVENIR.items.map((i) => i.group))];
  const done = SOUVENIR.items.filter((i) => bought.has(i.name)).length;
  const total = SOUVENIR.items.length;

  return (
    <div className="space-y-5">
      <section className={`${card} space-y-3 p-5 md:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-ink-3">기념품 쇼핑리스트</p>
            <p className="mt-1 text-[24px] font-bold tracking-tight">
              {done}/{total} 샀어요
            </p>
          </div>
        </div>
        <ProgressBar value={total ? Math.round((done / total) * 100) : 0} />
        {SOUVENIR.summary && (
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{SOUVENIR.summary}</p>
        )}
      </section>

      {SOUVENIR.customs && (
        <details className="rounded-3xl bg-danger-soft p-5">
          <summary className="cursor-pointer text-[16px] font-bold text-danger">⚠️ 한국 입국 반입 금지·주의 (꼭 읽기)</summary>
          <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line break-words text-ink">{SOUVENIR.customs}</p>
        </details>
      )}

      {groups.map((g) => {
        const items = SOUVENIR.items.filter((i) => i.group === g);
        return (
          <section key={g} className={`${card} px-4 pt-4 pb-2 md:px-5`}>
            {groupPhoto(g) && (
              <div className="mb-3">
                <Photo photo={groupPhoto(g)} alt={g} className="aspect-[21/9]" />
              </div>
            )}
            <h3 className="mb-1 text-[18px] font-bold tracking-tight">{g}</h3>
            <ul>
              {items.map((it, i) => {
                const checked = bought.has(it.name);
                return (
                  <li key={`${it.name}-${i}`} className="border-t border-line first:border-0">
                    <label className="flex cursor-pointer items-start gap-3 py-3">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        onChange={() => update((s) => toggleSouvenir(s, it.name))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[16px] font-semibold ${checked ? "text-ink-4 line-through" : "text-ink"}`}>
                          {it.name}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-primary-ink">
                          {it.price} · {it.where}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">
                          {it.qtyTip}
                          {it.note && ` · ${it.note}`}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {SOUVENIR.places.length > 0 && (
        <section>
          <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">어디서 사나요</h3>
          <div className="grid items-start gap-3 lg:grid-cols-2">
            {SOUVENIR.places.map((p, i) => (
              <div key={`${p.name}-${i}`} className={`${card} p-5`}>
                <p className="text-[18px] font-bold tracking-tight">{p.name}</p>
                <p className="text-[13px] text-ink-3 break-words">
                  {p.localName} · {p.hours}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{p.tips}</p>
                <a className={`${btn.soft} mt-3 min-h-11 px-4 text-[14px]`} href={mapUrl(p.localName || p.name, p.lat, p.lng)} target="_blank" rel="noopener noreferrer">
                  지도
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function ExchangeSection() {
  const x = EXCHANGE;
  return (
    <div className="space-y-4">
      <section className={`${card} p-5 md:p-6`}>
        {groupPhoto("__exchange__") && (
          <div className="mb-4">
            <Photo photo={groupPhoto("__exchange__")} alt="베트남 동 지폐" className="aspect-[21/9]" />
          </div>
        )}
        <p className="text-[15px] font-semibold text-ink-3">금은방 환전 평균 ({x.asOf})</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="text-[14px] font-semibold text-ink-3">100달러</p>
            <p className="mt-0.5 text-[22px] font-bold tracking-tight">{x.average.usd100}</p>
            <p className="mt-1 text-[13px] text-ink-3">{x.average.usd100Note}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="text-[14px] font-semibold text-ink-3">원화 10만원 (5만원권)</p>
            <p className="mt-0.5 text-[22px] font-bold tracking-tight">{x.average.krw100k}</p>
            <p className="mt-1 text-[13px] text-ink-3">{x.average.krw100kNote}</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">✈️ {x.airportCompare}</p>
      </section>

      <p className="rounded-3xl bg-danger-soft p-5 text-[14px] leading-relaxed text-ink">
        <b className="text-danger">⚠️ 꼭 확인</b> {x.warning}
      </p>

      <div className="grid items-start gap-3 lg:grid-cols-3">
        {x.shops.map((s) => (
          <section key={s.name} className={`${card} p-5`}>
            <p className="text-[18px] font-bold tracking-tight">{s.name}</p>
            <p className="text-[13px] text-ink-3">
              {s.location} · {s.hours}
            </p>
            <ul className="mt-2 space-y-1.5">
              {s.rates.map((r, i) => (
                <li key={i} className="text-[14px]">
                  <span className="text-ink-3">{r.date}</span>{" "}
                  <a href={r.source} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline decoration-line underline-offset-2">
                    {r.text}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className={`${card} p-5`}>
        <p className="mb-2 text-[16px] font-bold">💡 환전 팁</p>
        <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-2">
          {x.tips.map((t, i) => (
            <li key={i}>· {t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
