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
}

// 순위: 아이 기준 조식 점수가 높은 순 (같으면 입력 순서)
const HOTELS = (ranking.hotels as RankedHotel[])
  .map((h, i) => ({ h, i }))
  .sort((a, b) => b.h.breakfastScore - a.h.breakfastScore || a.i - b.i)
  .map(({ h }) => h);
const PENDING = ranking.pending as string[];

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[14px] font-bold text-accent" aria-label={`조식 ${score}점 / 5점`}>
      {"★".repeat(Math.floor(score))}
      {score % 1 >= 0.5 ? "½" : ""}
      <span className="text-ink-4">{"★".repeat(5 - Math.ceil(score))}</span>
      <span className="ml-0.5 text-ink-2">{score}</span>
    </span>
  );
}

function imageSearch(h: RankedHotel, extra: string) {
  const q = `${h.localName.split(" (")[0]} Nha Trang ${extra}`.trim();
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}

export default function RankingTab() {
  return (
    <div className="space-y-5">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-semibold text-ink-3">나트랑 시내 호텔 순위</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">4살 아이 조식 기준 추천 순위</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          네이버 블로그 후기와 예약 사이트 평점을 토대로 조식(아이 메뉴·한식·혼잡도)을 가장 크게 반영했어요. 가격은 아고다
          실시간 조회(2026-09-25, 성인 2 + 4세, 조식 포함) 기준 참고가예요.
        </p>
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
                  <span className="mt-0.5 block text-[13px] text-ink-3">{h.perNight}</span>
                </span>
                <Stars score={h.breakfastScore} />
              </a>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {HOTELS.map((h, i) => (
          <HotelCard key={h.id} hotel={h} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function HotelCard({ hotel: h, rank }: { hotel: RankedHotel; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <article id={`rank-${h.id}`} className={`${card} p-5 md:p-6 ${rank === 1 ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-lg px-2 py-1 text-[13px] font-bold ${rank === 1 ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          {rank}위
        </span>
        <Stars score={h.breakfastScore} />
      </div>
      <h3 className="mt-2 text-[20px] leading-snug font-bold tracking-tight">{h.name}</h3>
      <p className="text-[13px] text-ink-3">{h.localName}</p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{h.rating}</p>

      <div className="mt-3 rounded-2xl bg-surface-2 p-4">
        <p className="text-[18px] font-bold tracking-tight">{h.perNight}</p>
        <p className="mt-0.5 text-[14px] text-ink-2">{h.total}</p>
        <p className="mt-0.5 text-[13px] text-ink-3">조식: {h.breakfast}</p>
      </div>

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
          <div className="rounded-2xl bg-primary-soft p-4">
            <p className="font-bold text-primary-ink">🍳 조식 (아이 기준)</p>
            <p className="mt-1 whitespace-pre-line text-ink">{h.breakfastDetail}</p>
          </div>
          <p>
            <b className="text-ink">🧒 아이 시설</b> <span className="text-ink-2">{h.kids}</span>
          </p>
          <p>
            <b className="text-ink">📍 위치</b> <span className="text-ink-2">{h.location}</span>
          </p>
          <p>
            <b className="text-ink">🕑 체크인·새벽 입실</b> <span className="text-ink-2">{h.lateCheckout}</span>
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
