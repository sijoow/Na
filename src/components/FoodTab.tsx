"use client";

import { useState } from "react";
import data from "@/data/restaurants.json";
import type { BlogPost } from "@/lib/guideTypes";
import { FoodSection } from "./FoodSouvenirSections";
import { Photo, restaurantPhoto } from "./Photo";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

type Category = "pho" | "vietnamese" | "seafood" | "bbq" | "street" | "korean" | "cafe" | "dessert" | "western";

// 메뉴판: 블로그 메뉴판 사진을 복사하지 않고 메뉴 이름·가격(사실 정보)만 모아 다시 그린다
interface MenuItem {
  ko: string;
  vi: string;
  price: string;
  krw: string;
  note: string;
  /** 한국인들이 많이 시키는 메뉴 */
  pick: boolean;
  /** 4살 아이가 먹기 좋은 메뉴 */
  kid: boolean;
}
interface Menu {
  asOf: string;
  sections: { title: string; items: MenuItem[] }[];
  notes: string;
  photoLinks: { label: string; url: string }[];
  sources: string[];
}

interface Restaurant {
  id: string;
  rank: number;
  name: string;
  localName: string;
  category: Category;
  area: "city" | "camranh" | "other";
  address: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  rating: string;
  koreanPopularity: string;
  mustOrder: { dish: string; price: string; note: string }[];
  priceRange: string;
  kidFriendly: string;
  waiting: string;
  payment: string;
  tips: string;
  distance: string;
  bestFor: string;
  whyPopular: string;
  pros: string[];
  cons: string[];
  blogPosts: BlogPost[];
  menu?: Menu;
}

const LIST = [...(data.restaurants as Restaurant[])].sort((a, b) => a.rank - b.rank);

const CATEGORY_LABEL: Record<Category, string> = {
  pho: "🍜 쌀국수",
  vietnamese: "🥢 베트남 음식",
  seafood: "🦐 해산물",
  bbq: "🔥 숯불구이",
  street: "🥖 길거리 음식",
  korean: "🍚 한식",
  cafe: "☕ 카페",
  dessert: "🍧 디저트",
  western: "🍕 양식",
};

type Filter = "all" | "local" | "dinner" | "cafe" | "korean-western" | "camranh";
const FILTERS: { key: Filter; label: string; match: (r: Restaurant) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "local", label: "🍜 로컬", match: (r) => ["pho", "vietnamese", "street"].includes(r.category) },
  { key: "dinner", label: "🦐 해산물·저녁", match: (r) => ["seafood", "bbq"].includes(r.category) },
  { key: "cafe", label: "☕ 카페·디저트", match: (r) => ["cafe", "dessert"].includes(r.category) },
  { key: "korean-western", label: "🍚 한식·양식", match: (r) => ["korean", "western"].includes(r.category) },
  { key: "camranh", label: "🏝️ 캄란", match: (r) => r.area === "camranh" },
];

function mapUrl(r: Restaurant) {
  return r.lat !== null && r.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.localName} Nha Trang`)}`;
}
const photoUrl = (r: Restaurant) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${r.localName} Nha Trang`)}`;

export default function FoodTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const match = FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
  const list = LIST.filter(match);
  return (
    <div className="space-y-5">
      {LIST.length === 0 ? (
        <div className={`${card} p-10 text-center text-ink-3`}>
          한국인들이 많이 가는 맛집을 조사하고 있어요. 조사가 끝나면 여기에 표시돼요.
        </div>
      ) : (
        <>
          <section className={`${card} p-5 md:p-6`}>
            <p className="text-[15px] font-semibold text-ink-3">나트랑 맛집</p>
            <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">한국인들이 많이 가는 맛집</h2>
            {data.summary && (
              <ul className="mt-3 space-y-2.5 rounded-2xl bg-primary-soft p-4 text-[14px] leading-relaxed text-ink">
                {data.summary.split("\n").map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`press min-h-10 shrink-0 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap ${
                    filter === f.key ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {data.tips && (
              <details className="mt-3 rounded-2xl bg-surface-2 px-4 py-3">
                <summary className="cursor-pointer text-[14px] font-bold text-ink-2">💡 주문 요령 · 바가지 주의 · 아이랑 팁</summary>
                <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{data.tips}</p>
              </details>
            )}
          </section>

          {list.length === 0 ? (
            <div className={`${card} p-8 text-center text-ink-3`}>이 종류의 가게가 없어요.</div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
              {list.map((r) => (
                <RestaurantCard key={r.id} r={r} />
              ))}
            </div>
          )}
          {data.updatedAt && (
            <p className="px-1 text-[12px] text-ink-4">
              {data.updatedAt} 네이버 블로그·구글 리뷰 기준이에요. 가격은 현장에서 달라질 수 있어요.
            </p>
          )}
        </>
      )}

      <FoodSection compact={LIST.length > 0} />
    </div>
  );
}

function RestaurantCard({ r }: { r: Restaurant }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const photo = restaurantPhoto(r.id);
  const menuCount = r.menu?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;
  // 메뉴판이 있으면 대표 메뉴를 메뉴판의 인기 메뉴에서 가져와 가격을 맞춘다
  const menuPicks = (r.menu?.sections ?? [])
    .flatMap((s) => s.items)
    .filter((m) => m.pick)
    .map((m) => ({ dish: m.vi ? `${m.ko} (${m.vi})` : m.ko, price: m.krw ? `${m.price} (${m.krw})` : m.price, note: m.note }));
  const topPicks = menuPicks.length > 0 ? menuPicks : r.mustOrder;
  return (
    <article className={`${card} p-5 md:p-6`}>
      {photo && (
        <div className="mb-4">
          <Photo
            photo={photo}
            alt={r.name}
            className="aspect-[2/1]"
            note={photo.kind === "shop" ? photo.caption : (photo.caption ?? "대표 메뉴 예시 (이 가게 사진 아님)")}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span className={`rounded-lg px-2 py-0.5 ${r.rank <= 3 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          {r.rank}위
        </span>
        <span className="text-ink-3">{CATEGORY_LABEL[r.category]}</span>
        {r.area === "camranh" && <span className="text-ink-3">· 🏝️ 캄란</span>}
      </div>
      <h3 className="mt-1.5 text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{r.name}</h3>
      <p className="text-[13px] text-ink-3">{r.localName}</p>
      {r.rating && <p className="mt-1 text-[13px] font-medium text-ink-2">⭐ {r.rating}</p>}

      <p className="mt-3 text-[15px] leading-relaxed text-ink">{r.whyPopular}</p>

      {topPicks.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface-2 p-4">
          <p className="text-[13px] font-semibold text-ink-3">한국인들이 주로 시키는 메뉴</p>
          <ul className="mt-1 space-y-1">
            {topPicks.slice(0, 3).map((m, i) => (
              <li key={`${m.dish}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-3 text-[15px]">
                <span className="font-semibold">{m.dish}</span>
                <span className="text-[14px] text-ink-2 tabular-nums">{m.price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[14px] font-bold text-primary-ink">우리 가족 예상 {r.priceRange}</p>
        </div>
      )}
      {r.bestFor && (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          <b className="text-ink">📅 언제</b> {r.bestFor}
        </p>
      )}
      <p className={`mt-1 text-[14px] leading-relaxed text-ink-2 ${open ? "" : "line-clamp-3"}`}>
        <b className="text-ink">🧒 아이</b> {r.kidFriendly}
      </p>

      {r.menu && menuCount > 0 && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            className="press mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink text-[15px] font-semibold text-page"
          >
            {menuOpen ? "메뉴판 접기 ▲" : `📋 메뉴판 보기 (${menuCount}개) ▼`}
          </button>
          {menuOpen && <MenuBoard menu={r.menu} />}
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-line text-[15px] font-semibold text-ink-2"
      >
        {open ? "접기 ▲" : "자세히 보기 (메뉴·웨이팅·결제·후기) ▼"}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
          {!r.menu && r.mustOrder.length > 0 && (
            <ul className="divide-y divide-line">
              {r.mustOrder.map((m, i) => (
                <li key={`${m.dish}-${i}`} className="py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-ink-2">{m.dish}</span>
                    <span className="font-semibold tabular-nums">{m.price}</span>
                  </div>
                  {m.note && <p className="mt-0.5 text-[12px] text-ink-3">{m.note}</p>}
                </li>
              ))}
            </ul>
          )}
          {[
            ["🇰🇷 한국인 인기", r.koreanPopularity],
            ["⏳ 웨이팅", r.waiting],
            ["💳 결제", r.payment],
            ["💡 팁", r.tips],
            ["📍 위치", `${r.address}${r.distance ? ` — ${r.distance}` : ""}`],
            ["🕑 영업", r.hours],
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
                {r.pros.map((p, i) => (
                  <li key={i}>· {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[13px] font-bold text-danger">아쉬워요</p>
              <ul className="space-y-1 text-ink-2">
                {r.cons.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
          {r.blogPosts.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-ink-2">블로그 후기</p>
              <ul className="-mx-3">
                {r.blogPosts.map((p, i) => (
                  <BlogPostRow key={`${p.url}-${i}`} post={p} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a className={btn.soft} href={mapUrl(r)} target="_blank" rel="noopener noreferrer">
          구글 지도
        </a>
        <a className={btn.secondary} href={photoUrl(r)} target="_blank" rel="noopener noreferrer">
          📷 음식 사진
        </a>
      </div>
    </article>
  );
}

// 앱 안에서 다시 그린 메뉴판 (가격은 조사 시점 기준)
function MenuBoard({ menu }: { menu: Menu }) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-4">
      <p className="text-[15px] font-extrabold tracking-tight">📋 메뉴판</p>
      <p className="mt-0.5 text-[12px] text-ink-3">{menu.asOf}</p>
      <p className="mt-1 text-[12px] text-ink-3">👍 한국인 인기 · 🧒 아이 추천</p>
      {menu.sections.map((sec, si) => (
        <div key={`${sec.title}-${si}`} className="mt-3">
          <p className="border-b border-line pb-1 text-[13px] font-bold text-primary-ink">{sec.title}</p>
          <ul>
            {sec.items.map((m, i) => (
              <li key={`${m.ko}-${i}`} className="border-b border-dashed border-line py-2 last:border-0">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 text-[15px] font-semibold">
                    {m.ko}
                    {m.pick && <span className="ml-1 text-[12px]">👍</span>}
                    {m.kid && <span className="ml-0.5 text-[12px]">🧒</span>}
                  </span>
                  <span className="shrink-0 text-right text-[14px] font-bold tabular-nums">{m.price}</span>
                </div>
                <div className="flex items-baseline gap-2 text-[12px] text-ink-3">
                  <span className="min-w-0 flex-1">{m.vi}</span>
                  {m.krw && <span className="shrink-0 tabular-nums">{m.krw}</span>}
                </div>
                {m.note && <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{m.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {menu.notes && <p className="mt-3 rounded-xl bg-surface p-3 text-[13px] leading-relaxed text-ink-2">💡 {menu.notes}</p>}
      {menu.photoLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {menu.photoLinks.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
              📷 {l.label} ↗
            </a>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-ink-4">
        실제 메뉴판 사진은 위 링크(블로그·구글맵)에서 볼 수 있어요. 가격은 현장에서 바뀔 수 있어요.
      </p>
    </div>
  );
}
