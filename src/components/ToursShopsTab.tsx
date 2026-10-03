"use client";

import { useState } from "react";
import { GUIDE } from "@/data/guide";
import type { ActivityInfo, PriceRow, ShopInfo, ShopKind } from "@/lib/guideTypes";
import { ExchangeSection } from "./FoodSouvenirSections";
import { AddOnList, HowToBox } from "./HowToBox";
import { activityPhoto, Photo, placePhoto } from "./Photo";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

const SHOP_KIND: Record<ShopKind, string> = {
  market: "🧺 시장",
  mall: "🏬 쇼핑몰",
  "brand-store": "👕 브랜드 매장",
  mart: "🛒 마트",
  "night-market": "🌙 야시장",
  street: "🚶 거리 상점",
  fruit: "🥭 과일가게",
};

type Section = "tours" | "shops" | "exchange";
type GoTab = "dam" | "souvenir" | "pharmacy";

// 기념품·약국·담시장은 따로 탭으로 옮겼다 (사진·시세가 많아서)
const MOVED: { tab: GoTab; label: string }[] = [
  { tab: "dam", label: "🧺 담시장" },
  { tab: "souvenir", label: "🎁 기념품" },
  { tab: "pharmacy", label: "💊 약국 쇼핑" },
];

export default function ToursShopsTab({ onGo }: { onGo: (tab: GoTab) => void }) {
  const [section, setSection] = useState<Section>("tours");
  const { activitiesNote, shoppingSummary } = GUIDE;
  // 과일가게는 맛집 탭의 과일 가이드에서 보여 준다
  const shops = GUIDE.shops.filter((s) => s.kind !== "fruit");
  // 마사지는 따로 '마사지·스파' 탭에서 보여 준다
  const activities = GUIDE.activities.filter((a) => a.id !== "massage");

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-wrap items-center gap-2 px-4 py-3`}>
        <p className="w-full text-[14px] font-semibold text-ink-3 sm:w-auto sm:pr-1">쇼핑은 탭을 따로 만들었어요</p>
        {MOVED.map((m) => (
          <button key={m.tab} type="button" onClick={() => onGo(m.tab)} className={`${btn.soft} min-h-10 px-3.5 text-[14px]`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex max-w-full overflow-x-auto rounded-2xl bg-surface-3/60 p-1 no-scrollbar md:inline-flex">
        {(
          [
            ["tours", "🎟️ 투어"],
            ["shops", "👕 아이 옷"],
            ["exchange", "💱 환전"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`press min-h-11 flex-1 shrink-0 rounded-xl px-4 text-[15px] font-bold whitespace-nowrap md:flex-none md:px-5 ${
              section === id ? "bg-surface text-ink shadow-sm" : "text-ink-3"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "tours" &&
        (activities.length === 0 ? (
          <Empty text="투어 가격과 예약 방법을 조사하고 있어요. 조사가 끝나면 여기에 표시돼요." />
        ) : (
          <>
            {activitiesNote && (
              <details className="rounded-2xl bg-surface px-5 py-4">
                <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💡 가격·예약 조사 메모 (펼치기)</summary>
                <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-3">{activitiesNote}</p>
              </details>
            )}
            <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
              {activities.map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </div>
          </>
        ))}

      {section === "exchange" && <ExchangeSection />}

      {section === "shops" &&
        (shops.length === 0 ? (
          <Empty text="아이 옷 살 곳과 가격대를 조사하고 있어요. 조사가 끝나면 여기에 표시돼요." />
        ) : (
          <>
            {shoppingSummary && (
              <section className={`${card} p-5 md:p-6`}>
                <p className="text-[15px] font-semibold text-ink-3">아이 옷 쇼핑 요약</p>
                <p className="mt-2 text-[16px] leading-relaxed whitespace-pre-line text-ink">{shoppingSummary}</p>
              </section>
            )}
            <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
              {shops.map((s) => (
                <ShopCard key={s.id} shop={s} />
              ))}
            </div>
          </>
        ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className={`${card} p-10 text-center text-ink-3`}>{text}</div>;
}

function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <table className="w-full text-[14px] max-sm:block">
      <tbody className="max-sm:block">
        {rows.map((r, i) => (
          <tr key={`${r.item}-${i}`} className="border-t border-line align-top max-sm:flex max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-3 max-sm:py-2.5">
            <td className="py-2 pr-3 text-ink-2 max-sm:w-full max-sm:p-0">{r.item}</td>
            <td className="py-2 pr-2 font-semibold tabular-nums max-sm:min-w-0 max-sm:p-0 max-sm:text-[15px]">{r.price}</td>
            <td className="py-2 text-right text-[12px] max-sm:ml-auto max-sm:p-0">
              {r.source.startsWith("http") ? (
                <a href={r.source} target="_blank" rel="noopener noreferrer" className="text-ink-4 underline">
                  출처
                </a>
              ) : (
                <span className="text-ink-4">{r.note}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ActivityCard({ activity: a }: { activity: ActivityInfo }) {
  const [showPosts, setShowPosts] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  return (
    <article className={`${card} p-5 md:p-6`}>
      {(activityPhoto(a.id) ?? placePhoto(a.placeId)) && (
        <div className="mb-4">
          <Photo photo={activityPhoto(a.id) ?? placePhoto(a.placeId)} alt={a.name} />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{a.name}</h3>
        {a.day && (
          <span className="shrink-0 rounded-lg bg-primary-soft px-2 py-1 text-[13px] font-bold text-primary-ink">
            {a.day}
          </span>
        )}
      </div>
      <div className="mt-3 rounded-2xl bg-surface-2 p-4">
        <p className="text-[13px] font-semibold text-ink-3">우리 가족 (성인 2 + 4살) 예상</p>
        {(() => {
          const [head, ...rest] = a.priceSummary.split(" / ");
          return (
            <>
              <p className="mt-0.5 text-[18px] leading-snug font-bold tracking-tight">{head}</p>
              {rest.length > 0 && (
                <ul className="mt-2 space-y-1 text-[14px] leading-snug text-ink-2">
                  {rest.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              )}
            </>
          );
        })()}
      </div>

      {a.recommendation && (
        <div className="mt-4 rounded-2xl bg-primary-soft p-4">
          <p className="text-[14px] font-bold text-primary-ink">👍 추천 예약 방법</p>
          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{a.recommendation}</p>
        </div>
      )}
      {a.howTo && a.howTo.length > 0 && <HowToBox title="📱 예약 방법" steps={a.howTo} texts={a.messages ?? []} />}
      {a.addOns && a.addOns.length > 0 && <AddOnList addOns={a.addOns} />}
      {a.kidTips && (
        <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
          <b className="text-ink">🧒 4살 아이 팁</b> {a.kidTips}
        </p>
      )}

      {(a.prices.length > 0 || a.booking.length > 0) && (
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          aria-expanded={showDetail}
          className="press mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-line text-[15px] font-semibold text-ink-2"
        >
          {showDetail ? "접기 ▲" : "요금표 · 예약처 비교 보기 ▼"}
        </button>
      )}
      {showDetail && (
        <>
        {a.prices.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-[14px] font-bold text-ink-2">요금</p>
            <PriceTable rows={a.prices} />
          </div>
        )}

        {a.booking.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[14px] font-bold text-ink-2">예약 방법 비교</p>
            <ul className="space-y-2">
              {a.booking.map((b, i) => (
                <li key={`${b.channel}-${i}`} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="font-bold">{b.channel}</span>
                    <span className="min-w-0 text-[14px] font-semibold text-primary-ink tabular-nums">{b.price}</span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{b.how}</p>
                  {b.url && (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[13px] text-ink-3 underline"
                    >
                      바로가기 ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        </>
      )}

      {a.blogPosts.length > 0 && (
        <div className="mt-4">
          <button type="button" className={`${btn.secondary} w-full`} onClick={() => setShowPosts((v) => !v)}>
            블로그 후기 {a.blogPosts.length}개 {showPosts ? "접기" : "보기"}
          </button>
          {showPosts && (
            <ul className="-mx-3 mt-2">
              {a.blogPosts.map((p, i) => (
                <BlogPostRow key={`${p.url}-${i}`} post={p} />
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}


export function ShopCard({ shop: s }: { shop: ShopInfo }) {
  const [showPosts, setShowPosts] = useState(false);
  const mapUrl =
    s.lat !== null && s.lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.localName} Nha Trang`)}`;
  return (
    <article className={`${card} p-5 md:p-6`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink-3">
        <span>{SHOP_KIND[s.kind]}</span>
        {s.nearDay && <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-primary-ink">{s.nearDay}</span>}
      </div>
      <h3 className="mt-1 text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{s.name}</h3>
      <p className="text-[13px] text-ink-3">
        {s.localName} · {s.hours}
      </p>

      {/* 맨 위: 품목별 흥정 목표가 → 흥정할 때 쓰는 말 */}
      {s.quickPrices && s.quickPrices.length > 0 && (
        <div className="mt-3 rounded-2xl bg-primary-soft p-4">
          <p className="text-[15px] font-bold text-primary-ink">{s.quickTitle ?? "가격 한눈에"}</p>
          <ul className="mt-1 divide-y divide-line">
            {s.quickPrices.map((q) => (
              <li key={q.item} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[15px] font-semibold text-ink">{q.item}</span>
                  <span className="text-[15px] font-bold text-primary-ink tabular-nums">{q.target}</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                  시세 {q.price}
                  {q.note && ` · ${q.note}`}
                </p>
              </li>
            ))}
          </ul>
          {s.quickNote && <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{s.quickNote}</p>}
        </div>
      )}
      {s.phrases && s.phrases.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface-2 p-4">
          <p className="text-[15px] font-bold text-ink">🗣️ {s.kind === "fruit" ? "과일 살 때 쓰는 말" : "흥정할 때 쓰는 말"}</p>
          <ol className="mt-2 space-y-2.5">
            {s.phrases.map((p) => (
              <li key={p.vi}>
                <p className="text-[16px] leading-snug font-bold text-ink">{p.say}</p>
                <p className="text-[13px] leading-snug font-semibold text-primary-ink">{p.vi}</p>
                <p className="text-[13px] leading-snug text-ink-2">{p.ko}</p>
              </li>
            ))}
          </ol>
          {s.phraseNote && <p className="mt-3 text-[13px] leading-relaxed text-ink-2">💡 {s.phraseNote}</p>}
        </div>
      )}
      {s.howTo && s.howTo.length > 0 && (
        <HowToBox
          title="📱 주문 방법"
          steps={s.howTo}
          texts={s.messages ?? (s.message ? [{ label: "💬 카톡 주문 문구 (복사해서 보내기)", text: s.message }] : [])}
        />
      )}

      <p className="mt-3 text-[15px] leading-relaxed text-ink">{s.what}</p>

      {s.priceTable.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[14px] font-bold text-ink-2">가격대</p>
          <PriceTable rows={s.priceTable} />
        </div>
      )}
      {s.tips && (
        <p className="mt-4 rounded-2xl bg-surface-2 p-4 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
          💡 {s.tips}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <a className={btn.soft} href={mapUrl} target="_blank" rel="noopener noreferrer">
          구글 지도에서 보기
        </a>
        {s.blogPosts.length > 0 && (
          <button type="button" className={btn.secondary} onClick={() => setShowPosts((v) => !v)}>
            후기 {s.blogPosts.length}개 {showPosts ? "접기" : "보기"}
          </button>
        )}
      </div>
      {showPosts && (
        <ul className="-mx-3 mt-2">
          {s.blogPosts.map((p, i) => (
            <BlogPostRow key={`${p.url}-${i}`} post={p} />
          ))}
        </ul>
      )}
    </article>
  );
}
