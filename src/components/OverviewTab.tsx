"use client";

import { CATEGORY_META } from "@/lib/categories";
import { formatPeriod, formatShort, type TripStatus } from "@/lib/date";
import { getDayProgress, percent, type Progress } from "@/lib/trip";
import type { Flight, TripState } from "@/lib/types";
import { card, ProgressBar } from "./ui";

interface Props {
  state: TripState;
  status: TripStatus | null;
  progress: Progress;
  todayDayId: string | null;
  onOpenDay: (dayId: string) => void;
}

/** 폰의 날짜 카드에는 일정 처음 몇 개만 보여 주고 나머지는 '외 N개'로 줄인다 */
const PHONE_PREVIEW = 5;

function heroText(status: TripStatus | null): { small: string; big: string } {
  if (!status) return { small: "나트랑 가족여행", big: "" };
  switch (status.kind) {
    case "before":
      return { small: "나트랑 여행까지", big: `${status.label.replace("D-", "")}일 남았어요` };
    case "dday":
      return { small: "드디어 오늘", big: "나트랑으로 떠나요 ✈️" };
    case "during":
      return { small: "나트랑 여행", big: `${status.label}예요` };
    default:
      return { small: "나트랑 여행", big: "즐거운 여행이었어요" };
  }
}

export default function OverviewTab({ state, status, progress, todayDayId, onOpenDay }: Props) {
  const hero = heroText(status);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* 요약 카드 */}
        <section className={`${card} p-5 md:p-7`}>
          <p className="text-[15px] font-semibold text-ink-3">{hero.small}</p>
          <p className="mt-1 text-[26px] leading-tight font-bold tracking-tight md:text-[32px]">
            {hero.big}
          </p>
          <p className="mt-3 text-[15px] text-ink-2">
            {formatPeriod(state.startDate, state.endDate)}
            <br />
            {state.travelers}
          </p>
          <div className="mt-5 md:mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[15px] font-semibold text-ink-2">일정 진행</span>
              <span className="text-[15px] font-bold text-primary-ink">
                {progress.done}/{progress.total} · {percent(progress)}%
              </span>
            </div>
            <ProgressBar value={percent(progress)} />
          </div>
        </section>

        {/* 항공편 + 우기 안내 */}
        <section className={`${card} flex flex-col p-5 md:p-7`}>
          <h2 className="mb-2 text-[15px] font-semibold text-ink-3">항공편</h2>
          <ul className="mb-4 divide-y divide-line">
            {state.flights.map((f) => (
              <FlightRow key={f.id} flight={f} />
            ))}
          </ul>
          <div className="mt-auto rounded-2xl bg-primary-soft px-4 py-3 text-[15px] leading-snug text-primary-ink">
            <b>☔ 10월은 우기 시작이에요</b>
            <br />
            섬·물놀이 일정은 날씨를 보고 &lsquo;다른 날과 바꾸기&rsquo;로 옮겨요
          </div>
        </section>
      </div>

      <h2 className="px-1 pt-3 text-xl font-bold tracking-tight md:pt-4">날짜별 일정</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {state.days.map((day, index) => {
          const { done, total } = getDayProgress(day);
          const isToday = day.id === todayDayId;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onOpenDay(day.id)}
              className={`${card} press flex flex-col p-5 text-left ${
                isToday ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-primary-soft px-2 py-1 text-[13px] font-bold text-primary-ink">
                  D{index + 1} · {formatShort(day.date)}
                  {isToday && " · 오늘"}
                </span>
                <span className="text-[13px] font-medium text-ink-3">
                  {done}/{total}
                </span>
              </div>
              <h3 className="mt-3 text-[18px] leading-snug font-bold tracking-tight">
                {day.title || "(제목 없음)"}
              </h3>
              <p className="mt-1 text-sm text-ink-3">🏨 {day.lodging || "-"}</p>
              <ul className="mt-4 space-y-1.5 text-[15px] md:text-[14px]">
                {day.items.length === 0 && <li className="text-ink-4">일정 없음</li>}
                {day.items.map((item, i) => (
                  <li
                    key={item.id}
                    className={`flex gap-2 ${item.done ? "text-ink-4 line-through" : "text-ink-2"} ${
                      i >= PHONE_PREVIEW ? "max-md:hidden" : ""
                    }`}
                  >
                    <span className="w-11 shrink-0 font-medium tabular-nums text-ink-3">
                      {item.time || "--:--"}
                    </span>
                    <span aria-hidden>{CATEGORY_META[item.category].emoji}</span>
                    <span className="min-w-0">{item.title}</span>
                  </li>
                ))}
                {day.items.length > PHONE_PREVIEW && (
                  <li className="pt-0.5 pl-[3.25rem] font-semibold text-ink-3 md:hidden">
                    외 {day.items.length - PHONE_PREVIEW}개
                  </li>
                )}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlightRow({ flight: f }: { flight: Flight }) {
  const name = [f.airline, f.flightNo].filter(Boolean).join(" ") || "항공편";
  return (
    <li className="flex items-center gap-4 py-3 first:pt-1">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl">
        {f.direction === "출국" ? "🛫" : "🛬"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold">
          {f.direction} · {name}
          {!f.flightNo && <span className="ml-1 font-medium text-ink-4">(편명 미정)</span>}
        </p>
        <p className="mt-0.5 text-[14px] text-ink-2 tabular-nums">
          {f.from} {formatShort(f.departDate)} {f.departTime} → {f.to} {formatShort(f.arriveDate)}{" "}
          {f.arriveTime}
        </p>
      </div>
    </li>
  );
}
