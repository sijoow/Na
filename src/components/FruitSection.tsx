"use client";

import { GUIDE } from "@/data/guide";
import fruits from "@/data/fruits.json";
import { fruitPhoto, Photo } from "./Photo";
import { ShopCard } from "./ToursShopsTab";
import { card } from "./ui";

// 맛집 탭 맨 위: 10월 나트랑 제철 과일 · 과일가게 · 살 때 쓰는 말 · 주의할 점
// (동남아는 과일 먹으러 가는 곳 — 일정의 과일 칸을 누르면 같은 가게 카드가 펼쳐져요)

const FRUIT_SHOPS = GUIDE.shops.filter((s) => s.kind === "fruit");

export default function FruitSection() {
  return (
    <section className={`${card} p-5 md:p-6`}>
      <p className="text-[15px] font-semibold text-ink-3">동남아는 과일 먹으러 가는 곳</p>
      <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">🥭 10월 나트랑 과일</h2>
      <p className="mt-2 rounded-2xl bg-primary-soft p-4 text-[14px] leading-relaxed text-ink">{fruits.summary}</p>

      <h3 className="mt-5 text-[17px] font-bold tracking-tight">지금 먹을 과일</h3>
      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fruits.season.map((f) => (
          <li key={f.name} className="rounded-2xl bg-surface-2 p-4">
            <Photo photo={fruitPhoto(f.name)} alt={f.name} className="aspect-[4/3]" />
            <p className="mt-2 text-[16px] font-bold text-ink">
              {f.name} <span className="text-[13px] font-semibold text-primary-ink">{f.vi}</span>
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-accent">{f.when}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{f.taste}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">🧒 {f.kid}</p>
            <p className="mt-1 text-[13px] font-semibold text-ink tabular-nums">💰 {f.price}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-[17px] font-bold tracking-tight">과일 음료</h3>
      <ul className="mt-2 divide-y divide-line">
        {fruits.drinks.map((d) => (
          <li key={d.name} className="py-2">
            <p className="text-[15px] font-bold text-ink">
              {d.name} <span className="text-[13px] font-semibold text-primary-ink">{d.vi}</span>
            </p>
            <p className="text-[13px] text-ink-2">{d.note}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-surface-2 p-4">
        <p className="text-[15px] font-bold text-ink">🗣️ 과일 살 때 쓰는 말</p>
        <ol className="mt-2 space-y-2.5">
          {fruits.phrases.map((p) => (
            <li key={p.vi}>
              <p className="text-[16px] leading-snug font-bold text-ink">{p.say}</p>
              <p className="text-[13px] leading-snug font-semibold text-primary-ink">{p.vi}</p>
              <p className="text-[13px] leading-snug text-ink-2">{p.ko}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 rounded-2xl bg-accent-soft p-4">
        <p className="text-[15px] font-bold text-accent">⚠️ 주의할 점</p>
        <ul className="mt-1 space-y-1 text-[14px] leading-relaxed text-ink">
          {fruits.cautions.map((c) => (
            <li key={c}>· {c}</li>
          ))}
        </ul>
      </div>

      {FRUIT_SHOPS.length > 0 && (
        <details className="mt-3 rounded-2xl border border-line px-4 py-3">
          <summary className="cursor-pointer text-[15px] font-bold text-ink-2">
            🧺 우리 일정의 과일가게 {FRUIT_SHOPS.length}곳 자세히
          </summary>
          <div className="mt-3 space-y-3">
            {FRUIT_SHOPS.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </details>
      )}

      <details className="mt-2 px-1">
        <summary className="cursor-pointer text-[12px] text-ink-4">출처 ({fruits.updatedAt} 조사)</summary>
        <ul className="mt-1 space-y-0.5 text-[11px] break-all text-ink-4">
          {fruits.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
