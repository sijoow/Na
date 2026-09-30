"use client";

import { useState } from "react";
import type { AddOn, CopyText } from "@/lib/guideTypes";
import { desertPhoto, Photo } from "./Photo";

// 예약·주문 방법 상자와 복사 버튼 — 투어·쇼핑 카드와 사막투어 브리핑 탭이 같이 쓴다

/** 접어 둔 문구 + 복사 버튼 (카톡·신청서에 그대로 붙여 넣기) */
export function CopyBlock({ label, text }: CopyText) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="mt-3 rounded-xl bg-surface px-3 py-2">
      <summary className="cursor-pointer text-[14px] font-bold text-ink-2">{label}</summary>
      <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{text}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            window.prompt("아래 문구를 복사하세요", text);
          }
        }}
        className="press mt-2 min-h-10 rounded-xl bg-ink px-4 text-[14px] font-semibold text-page"
      >
        {copied ? "복사했어요 ✓" : "문구 복사"}
      </button>
    </details>
  );
}

/** 주문·예약 방법 (순서) + 복사해서 보낼 문구 */
export function HowToBox({ title, steps, texts }: { title: string; steps: string[]; texts: CopyText[] }) {
  return (
    <div className="mt-3 rounded-2xl bg-accent-soft p-4">
      <p className="text-[15px] font-bold text-accent">{title}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {texts.map((t) => (
        <CopyBlock key={t.label} {...t} />
      ))}
    </div>
  );
}

/** 투어에 같이 묶어서 갈 수 있는 곳 — 넣으면 늘어나는 시간과 4살 기준 한 줄 */
export function AddOnList({ addOns }: { addOns: AddOn[] }) {
  return (
    <div className="mt-3 rounded-2xl bg-surface-2 p-4">
      <p className="text-[15px] font-bold text-ink">🧩 사막이랑 같이 묶이는 곳</p>
      <ul className="mt-1 divide-y divide-line">
        {addOns.map((x) => (
          <li key={x.name} className="py-2.5">
            {desertPhoto(x.photo) && (
              <div className="mb-2">
                <Photo photo={desertPhoto(x.photo)} alt={x.name} className="aspect-[2/1]" />
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[15px] font-semibold text-ink">{x.name}</span>
              <span className="text-[14px] font-bold text-primary-ink tabular-nums">{x.extra}</span>
            </div>
            <p className="text-[12px] text-ink-3">
              {x.localName} · {x.fee}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{x.what}</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">
              <b className="text-ink">🧒</b> {x.kid}
            </p>
            <a href={x.source} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink-4 underline">
              출처
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
