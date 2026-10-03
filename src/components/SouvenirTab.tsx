"use client";

// 기념품 탭 — 투어·쇼핑 탭에 있던 기념품 쇼핑리스트를 따로 빼서, 품목마다 사진을 붙였다.
// 산 것 체크는 예전처럼 state.boughtSouvenirs(품목 이름)에 저장한다.

import { useState } from "react";
import { SOUVENIR } from "@/data/guide";
import type { SouvenirItem } from "@/lib/guideTypes";
import { toggleSouvenir } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { mapUrl, SouvenirSummary } from "./FoodSouvenirSections";
import { groupPhoto, Photo, souvenirItemPhoto } from "./Photo";
import { btn, card, Modal, ProgressBar } from "./ui";

type GoTab = "dam" | "pharmacy";

const GROUP_EMOJI: Record<string, string> = {
  "커피·차": "☕",
  "과자·간식": "🍬",
  "견과·건과일": "🥜",
  "소스·라면·식재료": "🍜",
  "생활·뷰티": "🪥",
  아이용: "🧒",
  기타: "🌿",
};

/** 긴 가격 설명에서 카드에 보여 줄 첫 마디만 (전체는 눌러서 보기) */
function priceHeadline(price: string): string {
  const first = price.split(/ \/ |\. |; /)[0].trim();
  return first.length > 44 ? `${first.slice(0, 44)}…` : first;
}

/** 품목 사진이 없으면 분류 사진을 예시로 */
function itemPhoto(it: SouvenirItem) {
  const own = souvenirItemPhoto(it.id);
  if (own) return { photo: own, example: /예시/.test(own.caption ?? "") };
  return { photo: groupPhoto(it.group), example: true };
}

export default function SouvenirTab({
  state,
  update,
  onGo,
}: {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
  onGo: (tab: GoTab) => void;
}) {
  const bought = new Set(state.boughtSouvenirs ?? []);
  const groups = [...new Set(SOUVENIR.items.map((i) => i.group))];
  const [filter, setFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const done = SOUVENIR.items.filter((i) => bought.has(i.name)).length;
  const total = SOUVENIR.items.length;
  const opened = SOUVENIR.items.find((i) => i.id === openId);
  const toggle = (it: SouvenirItem) => update((s) => toggleSouvenir(s, it.name));

  return (
    <div className="space-y-5">
      <section className={`${card} space-y-3 p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">🎁 기념품 쇼핑리스트</p>
        <p className="text-[24px] font-bold tracking-tight">
          {done}/{total} 샀어요
        </p>
        <ProgressBar value={total ? Math.round((done / total) * 100) : 0} />
        {SOUVENIR.summary && <SouvenirSummary text={SOUVENIR.summary} />}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className={`${btn.soft} min-h-11 px-4 text-[14px]`} onClick={() => onGo("dam")}>
            🧺 담시장 공략 보기
          </button>
          <button type="button" className={`${btn.soft} min-h-11 px-4 text-[14px]`} onClick={() => onGo("pharmacy")}>
            💊 약국 쇼핑 보기
          </button>
        </div>
      </section>

      {SOUVENIR.customs && (
        <details className="rounded-3xl bg-danger-soft p-5">
          <summary className="cursor-pointer text-[16px] font-bold text-danger">⚠️ 한국 입국 반입 금지·주의 (꼭 읽기)</summary>
          <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line break-words text-ink">{SOUVENIR.customs}</p>
        </details>
      )}

      {/* 분류 고르기 */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
        {[null, ...groups].map((g) => {
          const active = filter === g;
          const count = g ? SOUVENIR.items.filter((i) => i.group === g).length : total;
          return (
            <button
              key={g ?? "all"}
              type="button"
              onClick={() => setFilter(g)}
              className={`press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-bold whitespace-nowrap ${
                active ? "bg-ink text-page" : "bg-surface text-ink-2 shadow-[var(--shadow-card)]"
              }`}
            >
              {g ? `${GROUP_EMOJI[g] ?? "🛍️"} ${g}` : "전체"} <span className="font-semibold opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {groups
        .filter((g) => filter === null || g === filter)
        .map((g) => {
          const items = SOUVENIR.items.filter((i) => i.group === g);
          return (
            <section key={g}>
              <h3 className="mb-2.5 px-1 text-[19px] font-bold tracking-tight">
                {GROUP_EMOJI[g] ?? "🛍️"} {g}
              </h3>
              <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 xl:grid-cols-4">
                {items.map((it) => (
                  <SouvenirCard
                    key={it.id}
                    item={it}
                    checked={bought.has(it.name)}
                    onOpen={() => setOpenId(it.id)}
                    onToggle={() => toggle(it)}
                  />
                ))}
              </ul>
            </section>
          );
        })}

      {SOUVENIR.places.length > 0 && (
        <section>
          <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">어디서 사나요</h3>
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {SOUVENIR.places.map((p, i) => (
              <div key={`${p.name}-${i}`} className={`${card} p-5`}>
                <p className="text-[18px] font-bold tracking-tight">{p.name}</p>
                <p className="text-[13px] break-words text-ink-3">
                  {p.localName} · {p.hours}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{p.tips}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className={`${btn.soft} min-h-11 px-4 text-[14px]`}
                    href={mapUrl(p.localName || p.name, p.lat, p.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    지도
                  </a>
                  {p.name === "담시장" && (
                    <button type="button" className={`${btn.secondary} min-h-11 px-4 text-[14px]`} onClick={() => onGo("dam")}>
                      담시장 탭에서 자세히
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {opened && (
        <Modal title={opened.name} onClose={() => setOpenId(null)}>
          <SouvenirDetail item={opened} checked={bought.has(opened.name)} onToggle={() => toggle(opened)} />
        </Modal>
      )}
    </div>
  );
}

function SouvenirCard({
  item,
  checked,
  onOpen,
  onToggle,
}: {
  item: SouvenirItem;
  checked: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { photo, example } = itemPhoto(item);
  return (
    <li className={`${card} overflow-hidden ${checked ? "opacity-70" : ""}`}>
      <button type="button" onClick={onOpen} className="press block w-full text-left">
        {photo ? (
          <Photo photo={photo} alt={item.name} className="aspect-[4/3]" link={false} note={example ? "예시" : undefined} />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-4xl" aria-hidden>
            {GROUP_EMOJI[item.group] ?? "🛍️"}
          </div>
        )}
        <span className="block px-3 pt-2">
          <span className={`line-clamp-2 text-[15px] leading-snug font-bold ${checked ? "text-ink-4 line-through" : "text-ink"}`}>
            {item.name}
          </span>
          <span className="mt-1 line-clamp-2 text-[13px] leading-snug font-semibold text-primary-ink">
            {priceHeadline(item.price)}
          </span>
          <span className="mt-1 block text-[12px] text-ink-4">눌러서 자세히 ›</span>
        </span>
      </button>
      <label className="mx-3 mt-2 mb-3 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface-2 px-3 text-[14px] font-semibold text-ink-2">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {checked ? "샀어요 ✓" : "샀어요"}
      </label>
    </li>
  );
}

function SouvenirDetail({ item, checked, onToggle }: { item: SouvenirItem; checked: boolean; onToggle: () => void }) {
  const { photo, example } = itemPhoto(item);
  const rows: [string, string][] = [
    ["💰 가격", item.price],
    ["📍 어디서", item.where],
    ["🧮 몇 개", item.qtyTip],
    ["💡 메모", item.note],
  ];
  return (
    <div className="space-y-4 pb-2">
      {photo && <Photo photo={photo} alt={item.name} className="aspect-[4/3]" note={example ? "예시 사진 (이 제품 아님)" : undefined} />}
      <dl className="space-y-3">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-[13px] font-bold text-ink-3">{k}</dt>
              <dd className="mt-0.5 text-[15px] leading-relaxed break-words text-ink">{v}</dd>
            </div>
          ))}
      </dl>
      {item.source && <p className="text-[12px] leading-relaxed break-all text-ink-4">출처: {item.source}</p>}
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 text-[16px] font-bold">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {checked ? "샀어요 ✓" : "샀으면 체크"}
      </label>
    </div>
  );
}
