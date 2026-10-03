"use client";

// 약국 쇼핑 탭 — 한국 여행자가 베트남 약국에서 많이 사는 것 + 아이(만 3세)에게 써도 되는지 + 한국 반입 규정.
// 자료: pharmacy.json (블로그·공식 자료 조사, 출처·날짜 포함), 사진: images.json 의 pharmacy 묶음 (위키미디어 공용)

import { useState } from "react";
import data from "@/data/pharmacy.json";
import { Photo, refPhoto } from "./Photo";
import { btn, card, Modal } from "./ui";

type GoTab = "souvenir" | "dam";

interface Src {
  url: string;
  date?: string | null;
  sponsored?: boolean;
}
interface PhItem {
  id: string;
  nameKo: string;
  local: string;
  category: string;
  what: string;
  price: string | null;
  kid: string;
  /** ok: 아이도 OK · check: 나이·용량 확인 · no: 어른용 */
  kidLevel: "ok" | "check" | "no";
  caution: string | null;
  rx: boolean | null;
  sources: Src[];
}
interface PhChain {
  name: string;
  local: string;
  what: string;
  hours: string;
  payment: string;
  tips: string;
  sources: Src[];
}
interface PharmacyData {
  asOf: string;
  summary: string;
  safety: string[];
  chains: PhChain[];
  categories: string[];
  items: PhItem[];
  customs: { text: string; sources: Src[] };
  phrases: { vi: string; ko: string }[];
}

const D = data as PharmacyData;

const KID: Record<PhItem["kidLevel"], { label: string; cls: string }> = {
  ok: { label: "🟢 아이도 OK", cls: "bg-primary-soft text-primary-ink" },
  check: { label: "🟡 아이는 확인", cls: "bg-accent-soft text-ink" },
  no: { label: "🔴 어른용", cls: "bg-danger-soft text-danger" },
};

const CAT_EMOJI: Record<string, string> = {
  "연고·크림": "🧴",
  "목·기침": "🗣️",
  "배탈·설사": "🤢",
  "열·통증": "🌡️",
  "모기·벌레": "🦟",
  "오일·밤": "🫙",
  "약국 화장품": "✨",
};

function SourceLinks({ sources }: { sources: Src[] }) {
  if (!sources?.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-ink-4">
      {sources.map((s, i) => (
        <li key={i} className="break-all">
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            {s.date ? `${s.date} · ` : ""}
            {s.url.replace(/^https?:\/\//, "").slice(0, 60)}
          </a>
          {s.sponsored && " (협찬 글)"}
        </li>
      ))}
    </ul>
  );
}

export default function PharmacyTab({ onGo }: { onGo: (tab: GoTab) => void }) {
  const [cat, setCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const items = D.items.filter((i) => cat === null || i.category === cat);
  const opened = D.items.find((i) => i.id === openId);
  const hero = refPhoto("pharmacy:hero");

  return (
    <div className="space-y-5">
      <section className={`${card} overflow-hidden`}>
        {hero && <Photo photo={hero} alt="베트남 약국" className="aspect-[21/9]" />}
        <div className="space-y-3 p-5 md:p-6">
          <p className="text-[15px] font-semibold text-ink-3">💊 베트남 약국 쇼핑</p>
          <p className="text-[16px] leading-relaxed whitespace-pre-line text-ink">{D.summary}</p>
          {D.safety.length > 0 && (
            <div className="rounded-2xl bg-danger-soft p-4 text-[14px] leading-relaxed text-ink">
              <p className="mb-1.5 font-bold text-danger">⚠️ 아이(만 3세) 약 주의</p>
              <ul className="space-y-1.5">
                {D.safety.slice(0, 2).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
              {D.safety.length > 2 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer font-semibold text-danger">주의 {D.safety.length - 2}개 더 보기</summary>
                  <ul className="mt-1.5 space-y-1.5">
                    {D.safety.slice(2).map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={`${btn.soft} min-h-11 px-4 text-[14px]`} onClick={() => onGo("souvenir")}>
              🎁 기념품 보기
            </button>
            <button type="button" className={`${btn.soft} min-h-11 px-4 text-[14px]`} onClick={() => onGo("dam")}>
              🧺 담시장 보기
            </button>
          </div>
          <p className="text-[12px] text-ink-4">조사 {D.asOf} · 약은 사기 전에 약사에게 아이 나이를 꼭 말하세요.</p>
        </div>
      </section>

      {/* 분류 고르기 */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
        {[null, ...D.categories].map((c) => {
          const active = cat === c;
          const count = c ? D.items.filter((i) => i.category === c).length : D.items.length;
          if (c && count === 0) return null;
          return (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCat(c)}
              className={`press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-bold whitespace-nowrap ${
                active ? "bg-ink text-page" : "bg-surface text-ink-2 shadow-[var(--shadow-card)]"
              }`}
            >
              {c ? `${CAT_EMOJI[c] ?? "💊"} ${c}` : "전체"} <span className="font-semibold opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => {
          const photo = refPhoto(`pharmacy:${it.id}`);
          const kid = KID[it.kidLevel] ?? KID.check;
          return (
            <li key={it.id} className={`${card} overflow-hidden`}>
              <button type="button" onClick={() => setOpenId(it.id)} className="press block w-full text-left">
                {photo ? (
                  <Photo photo={photo} alt={it.nameKo} className="aspect-[4/3]" link={false} note={/예시/.test(photo.caption ?? "") ? "예시" : undefined} />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-4xl" aria-hidden>
                    {CAT_EMOJI[it.category] ?? "💊"}
                  </div>
                )}
                <span className="block px-3 pt-2 pb-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${kid.cls}`}>{kid.label}</span>
                  <span className="mt-1.5 line-clamp-2 block text-[15px] leading-snug font-bold text-ink">{it.nameKo}</span>
                  <span className="mt-0.5 line-clamp-1 block text-[12px] text-ink-3">{it.local}</span>
                  {it.price && <span className="mt-1 line-clamp-2 block text-[13px] font-semibold text-primary-ink">{it.price}</span>}
                  <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink-2">{it.what}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {D.phrases.length > 0 && (
        <section className={`${card} p-5 md:p-6`}>
          <h3 className="text-[18px] font-bold tracking-tight">🗣️ 약사에게 보여 주세요</h3>
          <p className="mt-1 text-[13px] text-ink-3">화면을 그대로 보여 주면 돼요.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {D.phrases.map((p, i) => (
              <li key={i} className="rounded-2xl bg-surface-2 px-4 py-3">
                <p className="text-[17px] leading-snug font-bold text-ink">{p.vi}</p>
                <p className="mt-1 text-[14px] text-ink-3">{p.ko}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {D.chains.length > 0 && (
        <section>
          <h3 className="mb-3 px-1 text-xl font-bold tracking-tight">어디서 사나요</h3>
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {D.chains.map((c) => (
              <div key={c.name} className={`${card} p-5`}>
                <p className="text-[18px] font-bold tracking-tight">{c.name}</p>
                <p className="text-[13px] break-words text-ink-3">{c.local}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{c.what}</p>
                {c.hours && <p className="mt-1.5 text-[13px] text-ink-3">🕘 {c.hours}</p>}
                {c.payment && <p className="mt-0.5 text-[13px] text-ink-3">💳 {c.payment}</p>}
                {c.tips && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">💡 {c.tips}</p>}
                <a
                  className={`${btn.soft} mt-3 min-h-11 px-4 text-[14px]`}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.local || c.name} Nha Trang`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  가까운 지점 찾기
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {D.customs.text && (
        <details className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <summary className="cursor-pointer text-[16px] font-bold text-ink">🛃 한국에 가져갈 때 (반입 규정)</summary>
          <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line break-words text-ink-2">{D.customs.text}</p>
          <SourceLinks sources={D.customs.sources} />
        </details>
      )}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        이 탭은 여행 후기·공식 자료를 정리한 참고용이에요. 아이에게 쓰는 약·연고는 포장 설명서와 약사 설명을 먼저 확인하세요.
      </p>

      {opened && (
        <Modal title={opened.nameKo} onClose={() => setOpenId(null)}>
          <PharmacyDetail item={opened} />
        </Modal>
      )}
    </div>
  );
}

function PharmacyDetail({ item }: { item: PhItem }) {
  const photo = refPhoto(`pharmacy:${item.id}`);
  const kid = KID[item.kidLevel] ?? KID.check;
  const rows: [string, string | null][] = [
    ["🏷️ 포장에 적힌 이름", item.local],
    ["💊 무엇에", item.what],
    ["💰 가격", item.price],
    ["🧒 아이", item.kid],
    ["⚠️ 주의", item.caution],
    ["📋 처방", item.rx ? "처방이 필요한 약이에요 (약국에서 안 팔 수 있어요)" : null],
  ];
  return (
    <div className="space-y-4 pb-2">
      {photo && <Photo photo={photo} alt={item.nameKo} className="aspect-[4/3]" note={/예시/.test(photo.caption ?? "") ? "예시 사진 (이 제품 아님)" : undefined} />}
      <span className={`inline-block rounded-full px-2.5 py-1 text-[13px] font-bold ${kid.cls}`}>{kid.label}</span>
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
      <SourceLinks sources={item.sources} />
    </div>
  );
}
