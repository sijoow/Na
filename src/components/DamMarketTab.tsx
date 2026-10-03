"use client";

// 담시장 탭 — 여러 번 갈 곳이라 따로 뺐다: 한눈에 · 층별 안내 · 지도 · 추천 가게 · 시세표 · 흥정 · 아이랑 · 자주 묻는 것.
// 자료: damMarket.json (블로그 후기 조사, 출처·날짜 포함) + 투어·쇼핑 자료의 흥정 표현, 사진: images.json 의 dam 묶음

import dynamic from "next/dynamic";
import { useState } from "react";
import data from "@/data/damMarket.json";
import { GUIDE } from "@/data/guide";
import type { Place, PlaceKind } from "@/lib/guideTypes";
import { Photo, placePhoto, refPhoto } from "./Photo";
import { btn, card } from "./ui";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-3xl bg-surface-2" />,
});

type GoTab = "souvenir" | "pharmacy" | "tours";

interface Src {
  url: string;
  date?: string | null;
  title?: string;
  sponsored?: boolean;
}
interface DamData {
  asOf: string;
  summary: string;
  /** 우리 일정에서 담시장 가는 때 */
  visit: string;
  basics: { topic: string; icon?: string; text: string }[];
  layout: { building: string; floor: string; what: string; tips?: string | null }[];
  /** 층별 안내 아래 메모 (어디가 비싼지, 후기가 엇갈리는 곳) */
  layoutNotes?: { title: string; text: string }[];
  shops: { id: string; name: string; number: string | null; where: string; what: string; prices?: string | null; why?: string | null }[];
  prices: { category: string; item: string; ask: string | null; paid: string; unit: string | null; date: string; source: string }[];
  bargaining: string[];
  scams: string[];
  /** 담시장에서는 안 사는 게 나은 것 */
  avoid?: string[];
  withKids: string[];
  nearby: { id: string; name: string; kind: string; what: string; walk: string | null; lat: number | null; lng: number | null }[];
  photos: string[];
  faq: { q: string; a: string }[];
  sources: Src[];
}

const D = data as DamData;
// mapGuide.json 의 담시장 좌표 (OSM relation 21159862 와 일치)
const DAM = { lat: 12.2553289, lng: 109.1916641 };
const DAM_SHOP = GUIDE.shops.find((s) => s.id === "dam-market");

const SECTIONS: [string, string][] = [
  ["basics", "한눈에"],
  ["layout", "층별 안내"],
  ["map", "지도"],
  ["shops", "추천 가게"],
  ["prices", "시세표"],
  ["bargain", "흥정"],
  ["kids", "아이랑"],
  ["faq", "자주 묻는 것"],
];

const NEARBY_KIND: Record<string, PlaceKind> = { food: "food", cafe: "food", spa: "spa", mall: "shopping", shop: "shopping", exchange: "shopping" };

function jump(id: string) {
  document.getElementById(`dam-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={`dam-${id}`} className="mb-3 scroll-mt-28 px-1 text-xl font-bold tracking-tight">
      {children}
    </h3>
  );
}

export default function DamMarketTab({ onGo }: { onGo: (tab: GoTab) => void }) {
  const hero = refPhoto("dam:hero") ?? placePhoto("dam-market");
  const [copied, setCopied] = useState(false);
  const copyDest = async () => {
    try {
      await navigator.clipboard.writeText("Chợ Đầm");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${card} overflow-hidden`}>
        {hero && <Photo photo={hero} alt="담시장" className="aspect-[16/9] md:aspect-[21/9]" />}
        <div className="space-y-3 p-5 md:p-6">
          <p className="text-[15px] font-semibold text-ink-3">🧺 담시장 (Chợ Đầm)</p>
          {D.visit && <p className="rounded-2xl bg-primary-soft px-4 py-2.5 text-[15px] font-bold text-primary-ink">📅 {D.visit}</p>}
          <p className="text-[16px] leading-relaxed whitespace-pre-line text-ink">{D.summary}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              className={`${btn.soft} min-h-11 px-4 text-[14px]`}
              href={`https://www.google.com/maps/search/?api=1&query=${DAM.lat},${DAM.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              🗺️ 구글 지도
            </a>
            <button type="button" className={`${btn.soft} min-h-11 px-4 text-[14px]`} onClick={copyDest}>
              {copied ? "✓ 복사했어요" : "🚕 그랩 목적지 'Chợ Đầm' 복사"}
            </button>
            <button type="button" className={`${btn.secondary} min-h-11 px-4 text-[14px]`} onClick={() => onGo("souvenir")}>
              🎁 기념품 리스트
            </button>
          </div>
          <p className="text-[12px] text-ink-4">
            조사 {D.asOf} · 블로그 후기 {D.sources.length}개 정리
          </p>
        </div>
      </section>

      {/* 섹션 바로가기 */}
      <nav className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 flex gap-2 overflow-x-auto bg-page/90 px-4 py-2 backdrop-blur-md no-scrollbar md:top-28 md:mx-0 md:px-0">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => jump(id)}
            className="press min-h-9 shrink-0 rounded-full bg-surface px-3.5 text-[13px] font-bold whitespace-nowrap text-ink-2 shadow-[var(--shadow-card)]"
          >
            {label}
          </button>
        ))}
      </nav>

      {D.basics.length > 0 && (
        <section>
          <H id="basics">한눈에</H>
          <ul className={`${card} divide-y divide-line px-5`}>
            {D.basics.map((b, i) => (
              <li key={i} className="flex gap-3 py-3.5">
                <span className="w-7 shrink-0 text-xl" aria-hidden>
                  {b.icon ?? "•"}
                </span>
                <span className="min-w-0">
                  <b className="block text-[15px] text-ink">{b.topic}</b>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-2">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {D.layout.length > 0 && (
        <section>
          <H id="layout">층별 안내</H>
          <FloorGuide layout={D.layout} />
          {D.layoutNotes && D.layoutNotes.length > 0 && (
            <div className="mt-3 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {D.layoutNotes.map((n) => (
                <div key={n.title} className="rounded-3xl bg-surface-2 p-4">
                  <p className="text-[15px] font-bold text-ink">💬 {n.title}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <H id="map">지도</H>
        <NearbyMap />
      </section>

      {D.shops.length > 0 && (
        <section>
          <H id="shops">추천 가게 (블로그에 자주 나온 곳)</H>
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
            {D.shops.map((s) => (
              <article key={s.id} className={`${card} p-5`}>
                <div className="flex items-start gap-3">
                  {/* 번호가 길어도 카드 폭의 40%까지만 쓰고 배지 안에서 줄바꿈 (이름 칸이 한 글자씩 세로로 깨지지 않게) */}
                  {s.number && (
                    <span className="max-w-[40%] shrink-0 rounded-xl bg-ink px-2.5 py-1.5 text-center text-[15px] leading-tight font-extrabold break-words text-page tabular-nums">
                      {s.number}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] leading-snug font-bold">{s.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">📍 {s.where}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">{s.what}</p>
                {s.prices && <p className="mt-1.5 text-[14px] leading-relaxed font-semibold text-primary-ink">💰 {s.prices}</p>}
                {s.why && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">👍 {s.why}</p>}
              </article>
            ))}
          </div>
          <p className="mt-2 px-1 text-[12px] text-ink-4">가게 번호는 후기 시점 기준이에요. 싸게 산 가게는 번호를 사진으로 남겨 두세요.</p>
        </section>
      )}

      {D.prices.length > 0 && (
        <section>
          <H id="prices">시세표 (실제로 산 값)</H>
          <PriceTable />
        </section>
      )}

      <section>
        <H id="bargain">흥정</H>
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          {D.bargaining.length > 0 && (
            <div className={`${card} p-5`}>
              <p className="text-[16px] font-bold">💡 이렇게 깎아요</p>
              <ol className="mt-2 space-y-2 text-[14px] leading-relaxed text-ink-2">
                {D.bargaining.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-ink">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {DAM_SHOP?.phrases && DAM_SHOP.phrases.length > 0 && (
            <div className={`${card} p-5`}>
              <p className="text-[16px] font-bold">🗣️ 이렇게 말해요</p>
              <ul className="mt-2 divide-y divide-line">
                {DAM_SHOP.phrases.map((p, i) => (
                  <li key={i} className="py-2.5">
                    <p className="text-[16px] font-bold text-ink">{p.say}</p>
                    <p className="text-[13px] text-ink-3">
                      {p.vi} · {p.ko}
                    </p>
                  </li>
                ))}
              </ul>
              {DAM_SHOP.phraseNote && <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{DAM_SHOP.phraseNote}</p>}
            </div>
          )}
          {D.avoid && D.avoid.length > 0 && (
            <div className={`${card} p-5 lg:col-span-2`}>
              <p className="text-[16px] font-bold">🙅 담시장에선 안 사는 게 나은 것</p>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-2">
                {D.avoid.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
          {D.scams.length > 0 && (
            <div className="rounded-3xl bg-danger-soft p-5 lg:col-span-2">
              <p className="text-[16px] font-bold text-danger">⚠️ 이런 건 조심</p>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink">
                {D.scams.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {D.withKids.length > 0 && (
        <section>
          <H id="kids">아이랑 갈 때</H>
          <ul className={`${card} space-y-2 p-5 text-[14px] leading-relaxed text-ink-2`}>
            {D.withKids.map((t, i) => (
              <li key={i}>🧒 {t}</li>
            ))}
          </ul>
          <button type="button" className={`${btn.secondary} mt-3 min-h-11 px-4 text-[14px]`} onClick={() => onGo("tours")}>
            👕 아이 옷 사는 곳 (투어·쇼핑 탭)
          </button>
        </section>
      )}

      {D.faq.length > 0 && (
        <section>
          <H id="faq">자주 묻는 것</H>
          <div className="space-y-2">
            {D.faq.map((f, i) => (
              <details key={i} className={`${card} px-5 py-4`}>
                <summary className="cursor-pointer text-[15px] font-bold text-ink">Q. {f.q}</summary>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {D.photos.length > 0 && (
        <section>
          <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">📸 담시장 사진</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {D.photos.map((id) => {
              const p = refPhoto(`dam:${id}`);
              return p ? <Photo key={id} photo={p} alt={p.caption ?? "담시장"} className="aspect-[4/3]" note={p.caption} /> : null;
            })}
          </div>
        </section>
      )}

      {D.sources.length > 0 && (
        <details className={`${card} px-5 py-4`}>
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">📚 출처 {D.sources.length}개 (펼치기)</summary>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink-3">
            {D.sources.map((s, i) => (
              <li key={i} className="break-all">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {s.date ? `${s.date} · ` : ""}
                  {s.title || s.url}
                </a>
                {s.sponsored && " (협찬 글)"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** 건물별로 층을 위에서부터 쌓아 보여 주는 간단한 층별 안내도 */
function FloorGuide({ layout }: { layout: DamData["layout"] }) {
  // 지금 쇼핑하는 신관을 맨 앞에, 닫힌 구관은 맨 뒤에
  const order = (b: string) => (b.includes("신관") ? 0 : b.includes("구관") ? 2 : 1);
  const buildings = [...new Set(layout.map((l) => l.building))].sort((a, b) => order(a) - order(b));
  // 층: 안내 → 3층 → 2층 → 1층 → 그 밖
  const floorNum = (f: string) => (f.includes("안내") ? 100 : Number(f.match(/\d+/)?.[0] ?? 0));
  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
      {buildings.map((b) => {
        const floors = layout.filter((l) => l.building === b).sort((x, y) => floorNum(y.floor) - floorNum(x.floor));
        return (
          <div key={b} className={`${card} p-4`}>
            <p className="mb-2 px-1 text-[16px] font-bold">🏢 {b}</p>
            <ol className="space-y-2">
              {floors.map((f, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-surface-2 p-3">
                  <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-ink px-2 text-[13px] font-extrabold text-page">
                    {f.floor}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] leading-relaxed font-semibold text-ink">{f.what}</span>
                    {f.tips && <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{f.tips}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

/** 담시장 + 걸어서 갈 만한 곳 지도 (좌표가 확인된 곳만) */
function NearbyMap() {
  const [selected, setSelected] = useState<string | null>("dam-market");
  const spots = D.nearby.filter((n) => n.lat !== null && n.lng !== null);
  const places: Place[] = [
    {
      id: "dam-market",
      name: "담시장",
      localName: "Chợ Đầm",
      kind: "shopping",
      lat: DAM.lat,
      lng: DAM.lng,
      address: "Chợ Đầm, Phan Bội Châu, Nha Trang",
      note: D.visit,
      source: "https://www.openstreetmap.org/relation/21159862",
    },
    ...spots.map((n) => ({
      id: n.id,
      name: n.name,
      localName: "",
      kind: NEARBY_KIND[n.kind] ?? ("sight" as PlaceKind),
      lat: n.lat as number,
      lng: n.lng as number,
      address: "",
      note: `${n.what}${n.walk ? ` · ${n.walk}` : ""}`,
      source: "",
    })),
  ];
  return (
    <div className="space-y-3">
      <div className="h-[320px] overflow-hidden rounded-3xl md:h-[400px]">
        {/* 이름표는 담시장과 고른 곳만 (전부 띄우면 겹쳐요) */}
        <MapView
          places={places}
          highlightIds={["dam-market", ...(selected && selected !== "dam-market" ? [selected] : [])]}
          paths={[]}
          selectedPlaceId={selected}
          onSelectPlace={setSelected}
        />
      </div>
      {D.nearby.length > 0 && (
        <ul className={`${card} divide-y divide-line px-5`}>
          {D.nearby.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3">
              <button type="button" className="min-w-0 text-left" onClick={() => n.lat !== null && setSelected(n.id)}>
                <b className="block text-[15px] text-ink">{n.name}</b>
                <span className="block text-[13px] leading-relaxed text-ink-3">
                  {n.what}
                  {n.walk && ` · ${n.walk}`}
                </span>
              </button>
              <a
                className="shrink-0 text-[13px] font-semibold text-primary-ink"
                href={
                  n.lat !== null && n.lng !== null
                    ? `https://www.google.com/maps/search/?api=1&query=${n.lat},${n.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${n.name} Nha Trang`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                지도 ›
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 분류별 시세표 — 부른 값 / 실제로 산 값 / 날짜(출처) */
function PriceTable() {
  const cats = [...new Set(D.prices.map((p) => p.category))];
  const [cat, setCat] = useState<string>(cats[0] ?? "");
  const rows = D.prices.filter((p) => p.category === cat);
  return (
    <div className={`${card} p-4 md:p-5`}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`press min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap ${
              cat === c ? "bg-ink text-page" : "bg-surface-2 text-ink-2"
            }`}
          >
            {c} {D.prices.filter((p) => p.category === c).length}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r, i) => (
          <li key={i} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <b className="min-w-0 text-[15px] text-ink">
                {r.item}
                {r.unit && <span className="ml-1 text-[12px] font-medium text-ink-4">({r.unit})</span>}
              </b>
              <span className="shrink-0 text-[15px] font-bold text-primary-ink tabular-nums">{r.paid}</span>
            </div>
            <p className="mt-0.5 text-[12px] text-ink-4">
              {r.ask && <>처음 부른 값 {r.ask} · </>}
              <a href={r.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {r.date} 후기
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-4">후기에서 실제로 산 값이에요. 가게·흥정에 따라 달라요. 1만동 ≈ 520원.</p>
    </div>
  );
}
