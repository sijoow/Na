"use client";

import { useState } from "react";
import spasData from "@/data/spas.json";
import type { ChoiceOption, ChoiceSlot } from "@/lib/choiceSlots";
import PlaceInfo from "./PlaceInfo";
import { SpaCard, type SpaShop } from "./SpaSection";
import { btn } from "./ui";

// 일정의 고르는 칸 (마사지 가게 · 식당): 후보를 한 곳에서 탭으로 비교하고,
// 고르면 그 가게에 맞춰 미리 짜 둔 이동·식사(마사지) 일정으로 그 시간대가 바뀐다

const SPAS = spasData.shops as SpaShop[];

/** 마지막 글자에 받침이 있는지 (식당 → 식당으로 / 가게 → 가게로) */
const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

export default function ChoiceTabs({
  slot,
  currentId,
  onPick,
}: {
  slot: ChoiceSlot;
  currentId: string;
  onPick: (option: ChoiceOption) => void;
}) {
  const [tab, setTab] = useState(currentId);
  const option = slot.options.find((o) => o.id === tab) ?? slot.options[0];
  const isCurrent = option.id === currentId;
  const noun = slot.noun;
  const card = option.card;
  const spa = card?.kind === "spa" ? SPAS.find((s) => s.id === card.id) : undefined;

  return (
    <div className="space-y-2">
      <div role="tablist" aria-label={`${noun} 고르기`} className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-1 no-scrollbar">
        {slot.options.map((o) => {
          const active = o.id === option.id;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(o.id)}
              className={`press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap ${
                active ? "bg-ink text-page" : "bg-surface text-ink-2"
              }`}
            >
              {o.id === currentId && "📌 "}
              {o.tab}
            </button>
          );
        })}
      </div>
      {isCurrent ? (
        <p className="px-1 text-[13px] font-semibold text-primary-ink">
          📌 지금 일정에 들어간 {noun}
          {hasBatchim(noun) ? "이에요" : "예요"}. 다른 탭을 눌러 비교해 보세요.
        </p>
      ) : (
        <button
          type="button"
          className={`${btn.primary} w-full`}
          onClick={() => {
            if (window.confirm(`${option.tab} — 이 ${noun}${hasBatchim(noun) ? "으로" : "로"} 바꿀까요?\n이 시간대 일정이 같이 바뀌어요.`)) {
              onPick(option);
            }
          }}
        >
          ✅ 이 {noun}
          {hasBatchim(noun) ? "으로" : "로"} 정하기 ({option.tab})
        </button>
      )}

      {spa ? (
        <SpaCard shop={spa} slot={option} />
      ) : (
        <>
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="text-[13px] font-bold text-accent">📌 우리 일정에서</p>
            <p className="mt-1 text-[15px] leading-snug font-bold text-ink">{option.when}</p>
            <p className="mt-1 text-[15px] leading-snug font-bold text-primary-ink">예상 {option.total}</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-ink-2">
              {option.items.map((it, idx) => (
                <li key={`${it.time}-${it.title}`}>
                  <span className="font-semibold tabular-nums">{it.time}</span> {it.title}
                  {/* 식사·관광 일정은 메뉴·영업시간·결제 메모까지 (앱 자료에 카드가 없는 가게도 여기서 비교).
                      대표 일정이 이동이면(투어 업체 출발) 그 메모가 업체별 핵심이라 같이 보여 준다 */}
                  {(it.category !== "move" || idx === option.mainIndex) && it.memo && (
                    <span className="mt-0.5 block text-[12px] text-ink-3">{it.memo}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {card && <PlaceInfo place={card} />}
        </>
      )}
    </div>
  );
}
