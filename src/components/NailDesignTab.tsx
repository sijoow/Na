"use client";

import { useId, useState } from "react";
import data from "@/data/nailDesigns.json";
import images from "@/data/images.json";
import { Photo, type PhotoInfo } from "./Photo";
import { card } from "./ui";

// 네일 디자인 고르기 — 10/4 화이트 스파 앤 네일(아트 무제한)에서 엄마 손·발, 아이 네일.
// 그림(SVG)은 색·배치 예시이고, 실제 사진은 검색 버튼이나 images.json 의 nails 사진으로 본다.

type Pattern =
  | "solid"
  | "syrup"
  | "gradient"
  | "magnet"
  | "french"
  | "glitter"
  | "chrome"
  | "marble"
  | "check"
  | "flower"
  | "dot"
  | "heart"
  | "star"
  | "line"
  | "tortoise"
  | "cheek";
type Kind = "foot" | "hand" | "kid";
interface Look {
  pattern: Pattern;
  colors: string[];
}
interface Design {
  id: string;
  name: string;
  en: string;
  say: string;
  tags: string[];
  look: string;
  why: string;
  base: Look;
  /** 일부 손(발)가락만 다른 무늬 — at 은 0(엄지)부터 */
  accent?: Look & { at: number[] };
  /** 손가락마다 다른 한 가지 색 */
  each?: string[];
  search: string;
}
interface Group {
  id: string;
  kind: Kind;
  title: string;
  note: string;
  designs: Design[];
}

const GROUPS = data.groups as Group[];
const NAIL_PHOTOS = (images as { nails?: Record<string, PhotoInfo> }).nails ?? {};
// 사람이 실제로 한 네일 사진 (재사용 가능한 사진만) — 그룹 종류(발·손·아이)별
const GALLERY = (images as { nailGallery?: Partial<Record<Kind, PhotoInfo[]>> }).nailGallery ?? {};

interface Geo {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}
// 발: 엄지가 크고 새끼로 갈수록 작게 (아래 줄 맞춤) · 손: 같은 크기 · 아이: 작게
const GEO: Record<Kind, Geo[]> = {
  foot: [
    [6, 46, 50],
    [60, 28, 32],
    [95, 26, 29],
    [128, 24, 26],
    [159, 20, 22],
  ].map(([x, w, h]) => ({ x, y: 66 - h, w, h, rx: w * 0.28 })),
  hand: [0, 1, 2, 3, 4].map((i) => ({ x: 9 + i * 35, y: 12, w: i === 0 ? 30 : 27, h: 50, rx: 12 })),
  kid: [0, 1, 2, 3, 4].map((i) => ({ x: 16 + i * 33, y: 26, w: 22, h: 30, rx: 10 })),
};

function NailLayers({ id, i, g, look }: { id: string; i: number; g: Geo; look: Look }) {
  const { x, y, w, h } = g;
  const [c0, c1 = "#ffffff", c2 = c1] = look.colors;
  const fill = (f: string, opacity = 1) => <rect x={x} y={y} width={w} height={h} fill={f} opacity={opacity} />;
  const grad = `${id}g`;
  const cx = x + w / 2;
  const cy = y + h * 0.55;
  switch (look.pattern) {
    case "syrup":
      return (
        <>
          <defs>
            <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#f6ddd2" />
              <stop offset="0.55" stopColor={c0} stopOpacity="0.72" />
              <stop offset="1" stopColor={c0} />
            </linearGradient>
          </defs>
          {fill("#f6ddd2")}
          {fill(`url(#${grad})`)}
        </>
      );
    case "gradient":
      return (
        <>
          <defs>
            <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={c0} />
              <stop offset="1" stopColor={c1} />
            </linearGradient>
          </defs>
          {fill(`url(#${grad})`)}
        </>
      );
    case "magnet":
      return (
        <>
          <defs>
            <linearGradient id={grad} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0.15" stopColor={c1} stopOpacity="0" />
              <stop offset="0.42" stopColor={c1} stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="0.58" stopColor={c1} stopOpacity="0.9" />
              <stop offset="0.85" stopColor={c1} stopOpacity="0" />
            </linearGradient>
          </defs>
          {fill(c0)}
          {fill(`url(#${grad})`)}
        </>
      );
    case "french":
      return (
        <>
          {fill(c0)}
          <path d={`M${x},${y} H${x + w} V${y + h * 0.3} Q${cx},${y + h * 0.06} ${x},${y + h * 0.3} Z`} fill={c1} />
        </>
      );
    case "glitter":
      return (
        <>
          {fill(c0)}
          {Array.from({ length: 14 }, (_, k) => (
            <circle
              key={k}
              cx={x + (((k * 37 + i * 11) % 100) / 100) * w}
              cy={y + (((k * 53 + i * 29) % 100) / 100) * h}
              r={0.7 + (k % 3) * 0.45}
              fill={k % 2 ? c1 : "#ffffff"}
              opacity="0.9"
            />
          ))}
        </>
      );
    case "chrome":
      return (
        <>
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0" stopColor={c0} />
              <stop offset="0.3" stopColor="#ffffff" />
              <stop offset="0.55" stopColor={c1} />
              <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="1" stopColor={c0} />
            </linearGradient>
          </defs>
          {fill(c0)}
          {fill(`url(#${grad})`, 0.85)}
        </>
      );
    case "marble":
      return (
        <>
          {fill(c0)}
          <path
            d={`M${x - 2},${y + h * 0.3} C${x + w * 0.3},${y + h * 0.1} ${x + w * 0.5},${y + h * 0.62} ${x + w + 2},${y + h * 0.42}`}
            stroke={c1}
            strokeWidth="1.6"
            fill="none"
            opacity="0.75"
          />
          <path
            d={`M${x - 2},${y + h * 0.72} C${x + w * 0.35},${y + h * 0.55} ${x + w * 0.6},${y + h * 0.95} ${x + w + 2},${y + h * 0.7}`}
            stroke={c2}
            strokeWidth="0.9"
            fill="none"
            opacity="0.9"
          />
        </>
      );
    case "check":
      return (
        <>
          {fill(c0)}
          {[1, 2].map((k) => (
            <rect key={`v${k}`} x={x + (w / 3) * k - w * 0.05} y={y} width={w * 0.1} height={h} fill={c1} opacity="0.5" />
          ))}
          {[1, 2, 3].map((k) => (
            <rect key={`h${k}`} x={x} y={y + (h / 4) * k - h * 0.03} width={w} height={h * 0.06} fill={c1} opacity="0.5" />
          ))}
        </>
      );
    case "flower": {
      const r = w * 0.13;
      return (
        <>
          {fill(c0)}
          {[0, 1, 2, 3, 4].map((k) => {
            const a = ((k * 72 - 90) * Math.PI) / 180;
            return <circle key={k} cx={cx + Math.cos(a) * r * 1.25} cy={cy + Math.sin(a) * r * 1.25} r={r} fill={c1} />;
          })}
          <circle cx={cx} cy={cy} r={r * 0.75} fill={c2} />
        </>
      );
    }
    case "dot":
      return (
        <>
          {fill(c0)}
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <circle
              key={k}
              cx={x + w * (k % 2 ? 0.68 : 0.32)}
              cy={y + h * (0.2 + Math.floor(k / 2) * 0.28 + (k % 2 ? 0.12 : 0))}
              r={w * 0.07}
              fill={c1}
            />
          ))}
        </>
      );
    case "heart": {
      const s = w * 0.5;
      return (
        <>
          {fill(c0)}
          <path
            transform={`translate(${cx} ${cy - s * 0.5}) scale(${s})`}
            d="M0,0.3 C0,-0.1 -0.5,-0.1 -0.5,0.25 C-0.5,0.55 -0.2,0.75 0,0.95 C0.2,0.75 0.5,0.55 0.5,0.25 C0.5,-0.1 0,-0.1 0,0.3 Z"
            fill={c1}
          />
        </>
      );
    }
    case "star": {
      const s = w * 0.28;
      const pts = Array.from({ length: 10 }, (_, k) => {
        const a = ((k * 36 - 90) * Math.PI) / 180;
        const r = k % 2 ? s * 0.42 : s;
        return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
      }).join(" ");
      return (
        <>
          {fill(c0)}
          <polygon points={pts} fill={c1} />
        </>
      );
    }
    case "line":
      return (
        <>
          {fill(c0)}
          <path
            d={`M${x + w * 0.18},${y + h} Q${x + w * 0.95},${y + h * 0.6} ${x + w * 0.55},${y}`}
            stroke={c1}
            strokeWidth="1.3"
            fill="none"
          />
        </>
      );
    case "tortoise":
      return (
        <>
          {fill(c0)}
          {[
            [0.3, 0.25, 0.22, 0.14],
            [0.7, 0.45, 0.2, 0.16],
            [0.35, 0.68, 0.24, 0.13],
            [0.75, 0.82, 0.16, 0.1],
          ].map(([px, py, rx, ry], k) => (
            <ellipse key={k} cx={x + w * px} cy={y + h * py} rx={w * rx} ry={h * ry} fill={k % 2 ? c2 : c1} opacity="0.78" />
          ))}
        </>
      );
    case "cheek":
      return (
        <>
          <defs>
            <radialGradient id={grad} cx="0.5" cy="0.55" r="0.45">
              <stop offset="0" stopColor={c1} stopOpacity="0.85" />
              <stop offset="1" stopColor={c1} stopOpacity="0" />
            </radialGradient>
          </defs>
          {fill(c0)}
          {fill(`url(#${grad})`)}
        </>
      );
    default:
      return fill(c0);
  }
}

/** 디자인 한 개를 손(발)톱 다섯 개 그림으로 */
function NailPreview({ design, kind }: { design: Design; kind: Kind }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 186 76" role="img" aria-label={`${design.name} 예시 그림`} className="w-full rounded-2xl">
      <rect width="186" height="76" rx="14" fill="#f9e7dc" />
      {GEO[kind].map((g, i) => {
        const look: Look = design.accent?.at.includes(i)
          ? design.accent
          : design.each
            ? { pattern: "solid", colors: [design.each[i % design.each.length]] }
            : design.base;
        const id = `${uid}n${i}`;
        return (
          <g key={i}>
            <defs>
              <clipPath id={`${id}c`}>
                <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}c)`}>
              <NailLayers id={id} i={i} g={g} look={look} />
              <ellipse cx={g.x + g.w * 0.3} cy={g.y + g.h * 0.3} rx={g.w * 0.11} ry={g.h * 0.2} fill="#ffffff" opacity="0.33" />
            </g>
            <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx} fill="none" stroke="rgba(60,30,20,0.16)" />
          </g>
        );
      })}
    </svg>
  );
}

const naver = (q: string) => `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(q)}`;
const pinterest = (q: string) => `https://www.pinterest.co.kr/search/pins/?q=${encodeURIComponent(q)}`;
const insta = (q: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s/g, ""))}/`;
const linkBtn = "press inline-flex min-h-9 items-center rounded-full bg-surface px-3 text-[12px] font-semibold text-ink-2";

function DesignCard({ design, kind }: { design: Design; kind: Kind }) {
  const photo = NAIL_PHOTOS[design.id];
  return (
    <li className="rounded-2xl bg-surface-2 p-3">
      <NailPreview design={design} kind={kind} />
      {photo && (
        <div className="mt-2">
          <Photo photo={photo} alt={`${design.name} 실제 사진`} className="aspect-[4/3]" note={photo.caption ?? "실제 사진 예시"} />
        </div>
      )}
      <p className="mt-2 text-[16px] leading-snug font-bold text-ink">{design.name}</p>
      <p className="text-[12px] font-semibold text-primary-ink">{design.en}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {design.tags.map((t) => (
          <span key={t} className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-bold text-primary-ink">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{design.look}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-3">👍 {design.why}</p>
      <p className="mt-1.5 rounded-xl bg-surface px-2.5 py-1.5 text-[12px] leading-snug text-ink-2">
        <b>샵에서</b> {design.say}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <a className={linkBtn} href={naver(design.search)} target="_blank" rel="noopener noreferrer">
          📷 실제 사진 (네이버)
        </a>
        <a className={linkBtn} href={pinterest(design.search)} target="_blank" rel="noopener noreferrer">
          핀터레스트
        </a>
        <a className={linkBtn} href={insta(design.search)} target="_blank" rel="noopener noreferrer">
          인스타
        </a>
      </div>
    </li>
  );
}

export default function NailDesignTab() {
  const [groupId, setGroupId] = useState(GROUPS[0].id);
  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];
  const photos = GALLERY[group.kind] ?? [];
  const [zoom, setZoom] = useState<PhotoInfo | null>(null);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary-soft p-5 md:p-6">
        <p className="text-[15px] font-bold text-primary-ink">💅 네일 디자인 고르기</p>
        <p className="mt-1 text-[15px] leading-relaxed font-semibold text-ink">{data.shop}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{data.intro}</p>
      </section>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar" aria-label="누구 네일">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupId(g.id)}
            className={`press min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap ${
              g.id === group.id ? "bg-ink text-page" : "bg-surface text-ink-2 shadow-[var(--shadow-card)]"
            }`}
          >
            {g.title} ({g.designs.length})
          </button>
        ))}
      </nav>

      <section className={`${card} p-4 md:p-6`}>
        <p className="text-[14px] leading-relaxed text-ink-2">{group.note}</p>
        {photos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-[16px] font-bold text-ink">📷 실제 사진 {photos.length}장</h3>
            <p className="text-[12px] text-ink-3">누르면 크게 보여요. 마음에 드는 사진을 직원에게 그대로 보여 주세요.</p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => (
                <li key={p.url}>
                  <button type="button" onClick={() => setZoom(p)} className="press block w-full text-left">
                    <Photo photo={p} alt={p.caption ?? "네일 실제 사진"} className="aspect-square" link={false} />
                    <span className="mt-1 block text-[12px] leading-snug font-semibold text-ink-2">{p.caption}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h3 className="mt-5 text-[16px] font-bold text-ink">🎨 추천 디자인 {group.designs.length}가지</h3>
        <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {group.designs.map((d) => (
            <DesignCard key={d.id} design={d} kind={group.kind} />
          ))}
        </ul>
      </section>

      <section className={`${card} p-5 md:p-6`}>
        <h3 className="text-[17px] font-bold">🙅 촌스러워 보이기 쉬운 것</h3>
        <ul className="mt-2 divide-y divide-line">
          {data.avoid.map((a) => (
            <li key={a.name} className="py-2.5">
              <p className="text-[15px] font-bold text-ink">{a.name}</p>
              <p className="text-[13px] leading-relaxed text-ink-2">{a.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} p-5 md:p-6`}>
        <h3 className="text-[17px] font-bold">🗣️ 네일샵에서 쓰는 말</h3>
        <ol className="mt-2 space-y-2.5">
          {data.phrases.map((p) => (
            <li key={p.ko}>
              <p className="text-[15px] leading-snug font-bold text-ink">{p.ko}</p>
              <p className="text-[13px] leading-snug font-semibold text-primary-ink">{p.vi}</p>
              <p className="text-[13px] leading-snug text-ink-2">{p.en}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${card} p-5 md:p-6`}>
        <h3 className="text-[17px] font-bold">💡 받을 때 팁</h3>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-2">
          {data.tips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        {data.updatedAt} 기준 · 그림은 색과 배치를 보여 주는 예시예요. 실제 사진은 위 사진 모음이나 버튼으로 찾아보세요.
      </p>

      {zoom && (
        <button
          type="button"
          onClick={() => setZoom(null)}
          aria-label="사진 닫기"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom.url}
            alt={zoom.caption ?? "네일 실제 사진"}
            referrerPolicy="no-referrer"
            className="max-h-[78dvh] max-w-full rounded-2xl object-contain"
          />
          <span className="text-center text-[16px] leading-snug font-bold text-white">{zoom.caption}</span>
          <span className="text-center text-[12px] text-white/70">
            사진: {zoom.credit} · {zoom.license} · 화면을 누르면 닫혀요
          </span>
        </button>
      )}
    </div>
  );
}
