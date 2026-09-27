"use client";

import { useState } from "react";
import data from "@/data/bookings.json";
import { addChecklistItem, toggleChecklistItem } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { card } from "./ui";

// 출발 전에 예약·연락해야 할 것 (마감 순). 체크하면 준비물 탭의 '📌 예약' 묶음에 함께 저장된다.

interface Booking {
  id: string;
  cat: string;
  scope: "plan" | "option";
  due: string;
  check: string;
  name: string;
  need: string;
  when: string;
  how: string;
  deadline: string;
  details: string;
  source: string;
}

export const BOOKING_GROUP = "📌 예약";
const ITEMS = data.items as Booking[];
const PLAN_ITEMS = ITEMS.filter((b) => b.scope === "plan");
const OPTION_ITEMS = ITEMS.filter((b) => b.scope === "option");
const checklistId = (b: Booking) => `bk-${b.id}`;

const NEED_STYLE: Record<string, string> = {
  필수: "bg-accent text-white",
  "강력 권장": "bg-accent-soft text-accent",
  권장: "bg-surface-2 text-ink-2",
};
const CAT_EMOJI: Record<string, string> = { 식당: "🍽️", 투어: "🏜️", 마사지: "💆", 호텔: "🏨", 교통: "🚕", 준비: "🧳" };

export default function BookingsCard({
  state,
  update,
}: {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}) {
  const isDone = (b: Booking) => state.checklist.some((c) => c.id === checklistId(b) && c.checked);
  const toggle = (b: Booking) =>
    update((s) =>
      s.checklist.some((c) => c.id === checklistId(b))
        ? toggleChecklistItem(s, checklistId(b))
        : addChecklistItem(s, { id: checklistId(b), text: b.check, group: BOOKING_GROUP, checked: true }),
    );
  const done = PLAN_ITEMS.filter(isDone).length;

  return (
    <section className={`${card} p-5 md:p-6`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[19px] font-bold tracking-tight">📌 예약할 것</h2>
        <span className="text-[13px] font-semibold text-ink-3 tabular-nums">
          {done}/{PLAN_ITEMS.length} 완료
        </span>
      </div>
      <p className="mt-1 text-[13px] text-ink-3">
        마감 순서예요. 끝내면 체크하세요 (준비물 탭 {BOOKING_GROUP} 묶음에도 저장돼요). 눌러서 방법·연락처를 보세요.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {PLAN_ITEMS.map((b) => (
          <BookingRow key={b.id} b={b} done={isDone(b)} onToggle={() => toggle(b)} />
        ))}
      </ul>

      <details className="mt-3 rounded-2xl bg-surface-2 px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-bold text-ink-2">대안·선택 예약 {OPTION_ITEMS.length}개</summary>
        <ul className="mt-2 divide-y divide-line">
          {OPTION_ITEMS.map((b) => (
            <BookingRow key={b.id} b={b} done={isDone(b)} onToggle={() => toggle(b)} />
          ))}
        </ul>
      </details>
      <details className="mt-2 rounded-2xl bg-surface-2 px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-bold text-ink-2">예약 없이 가는 곳 {data.walkIns.length}곳</summary>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed">
          {data.walkIns.map((w) => (
            <li key={w.name}>
              <b className="text-ink">{w.name}</b> <span className="text-ink-3">· {w.when}</span>
              <span className="block text-ink-2">{w.note}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function BookingRow({ b, done, onToggle }: { b: Booking; done: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="py-2.5">
      <div className="flex items-start gap-3">
        <label className="mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center">
          <input type="checkbox" checked={done} onChange={onToggle} aria-label={`${b.check} 완료`} />
        </label>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={`block text-[15px] leading-snug font-semibold ${done ? "text-ink-4 line-through" : "text-ink"}`}>
            {CAT_EMOJI[b.cat] ?? "📌"} {b.check}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${NEED_STYLE[b.need] ?? NEED_STYLE["권장"]}`}>{b.need}</span>
            <span className="text-[12px] text-ink-3">{open ? "접기 ▲" : "방법 보기 ▼"}</span>
          </span>
        </button>
      </div>
      {open && (
        <div className="mt-2 ml-10 space-y-1.5 rounded-xl bg-surface-2 p-3 text-[13px] leading-relaxed">
          <p className="font-bold text-ink">{b.name}</p>
          {[
            ["📅 언제", b.when],
            ["📱 방법", b.how],
            ["⏰ 마감", b.deadline],
            ["📝 알려줄 것·주의", b.details],
          ].map(([k, v]) => (
            <p key={k}>
              <b className="text-ink">{k}</b> <span className="text-ink-2">{v}</span>
            </p>
          ))}
        </div>
      )}
    </li>
  );
}
