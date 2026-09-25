"use client";

import { CATEGORY_META } from "@/lib/categories";
import { formatPeriod, formatShort, type TripStatus } from "@/lib/date";
import { useState } from "react";
import { getPlan, planDaysFor, PLANS } from "@/lib/plans";
import { getDayProgress, percent, type Progress } from "@/lib/trip";
import type { Flight, PlanId, TripState } from "@/lib/types";
import { activityPhoto, dayPhoto, dishPhoto, heroPhoto, placePhoto, stayPhoto, type PhotoInfo } from "./Photo";
import { btn, card } from "./ui";

interface Props {
  state: TripState;
  status: TripStatus | null;
  progress: Progress;
  todayDayId: string | null;
  onOpenDay: (dayId: string) => void;
  onSwitchPlan: (id: PlanId) => void;
  onGo: (tab: GoTab) => void;
}

export type GoTab = "stays" | "tours" | "food" | "spa" | "map" | "weather" | "schedule";

const SHORTCUTS: { tab: GoTab; label: string; desc: string; photo: () => PhotoInfo | undefined }[] = [
  { tab: "stays", label: "숙소", desc: "플랜 A·B·C 비교", photo: () => stayPhoto("movenpick-cam-ranh") ?? placePhoto("cam-ranh-resort-area") },
  { tab: "tours", label: "투어·쇼핑", desc: "가격·예약", photo: () => placePhoto("vinwonders") },
  { tab: "food", label: "맛집", desc: "한국인 인기 맛집", photo: () => dishPhoto("소고기 쌀국수 (Phở bò)") ?? placePhoto("pho-hong") },
  { tab: "spa", label: "마사지", desc: "아이랑 가족 마사지", photo: () => activityPhoto("massage") },
  { tab: "map", label: "지도·이동", desc: "Grab 요금·경로", photo: () => placePhoto("po-nagar") },
  { tab: "weather", label: "날씨", desc: "실시간 예보", photo: () => placePhoto("city-hotel-area") },
  { tab: "schedule", label: "일정", desc: "날짜별 할 일", photo: () => placePhoto("dam-market") },
];

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

export default function OverviewTab({ state, status, progress, todayDayId, onOpenDay, onSwitchPlan, onGo }: Props) {
  const hero = { ...heroText(status), photo: heroPhoto() };
  const currentPlan = state.planId ?? "A";
  const [picked, setPicked] = useState<PlanId | null>(null);
  const viewPlan = picked ?? currentPlan;
  const preview = viewPlan !== currentPlan;
  const days = planDaysFor(state, viewPlan);
  const plan = getPlan(viewPlan);
  return (
    <div className="space-y-5">
      {/* 대표 사진 히어로 */}
      <section className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-3xl">
        {hero.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- 대표 사진 배경
          <img
            src={hero.photo.url}
            alt="나트랑 해변"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
        <div className="relative flex min-h-[300px] flex-col justify-end p-5 text-white md:min-h-[340px] md:p-8">
          <p className="text-[14px] font-semibold text-white/85">{hero.small}</p>
          <p className="mt-1 text-[32px] leading-tight font-extrabold tracking-tight md:text-[40px]">{hero.big}</p>
          <p className="mt-2 text-[15px] text-white/90">
            {formatPeriod(state.startDate, state.endDate)} · {state.travelers}
          </p>
          <div className="mt-4 rounded-2xl bg-white/15 p-3 backdrop-blur-md">
            <div className="mb-1.5 flex items-baseline justify-between text-[14px]">
              <span className="font-semibold">일정 진행</span>
              <span className="font-bold tabular-nums">
                {progress.done}/{progress.total} · {percent(progress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${percent(progress)}%` }} />
            </div>
          </div>
        </div>
        {hero.photo && (
          <p className="absolute top-2 right-3 max-w-[60%] truncate text-[10px] text-white/70">
            사진: {hero.photo.credit} · {hero.photo.license}
          </p>
        )}
      </section>

      {/* 사진 바로가기 */}
      <section>
        <h2 className="mb-2.5 px-1 text-[19px] font-bold tracking-tight">여행 준비</h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-7">
          {SHORTCUTS.map((s) => {
            const photo = s.photo();
            return (
              <button
                key={s.tab}
                type="button"
                onClick={() => onGo(s.tab)}
                className="press relative h-36 w-32 shrink-0 overflow-hidden rounded-2xl bg-surface-3 text-left shadow-[var(--shadow-card)] md:w-auto"
              >
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element -- 바로가기 카드 사진
                  <img src={photo.url} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute right-3 bottom-3 left-3 text-white">
                  <span className="block text-[16px] font-bold">{s.label}</span>
                  <span className="block text-[12px] text-white/85">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 항공편 */}
      <section className={`${card} p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight">✈️ 항공편</h2>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">☔ 10월 우기 · 오전엔 야외</span>
        </div>
        <ul className="divide-y divide-line">
          {state.flights.map((f) => (
            <FlightRow key={f.id} flight={f} />
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-2 px-1 pt-3 md:pt-4">
        <h2 className="text-xl font-bold tracking-tight">날짜별 일정</h2>
        <span className="text-[13px] text-ink-3">지금 적용: 플랜 {currentPlan}</span>
      </div>

      {/* 플랜 A/B/C 일정 비교 */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-3/60 p-1" role="tablist" aria-label="플랜별 일정">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={viewPlan === p.id}
            onClick={() => setPicked(p.id)}
            className={`press min-h-12 rounded-xl px-2 text-center ${viewPlan === p.id ? "bg-surface shadow-sm" : ""}`}
          >
            <span className={`block text-[15px] font-bold ${viewPlan === p.id ? "text-ink" : "text-ink-3"}`}>
              플랜 {p.id}
              {p.id === currentPlan && " ✓"}
            </span>
            <span className="block text-[12px] text-ink-3">
              숙소 {p.stays.length}곳 · 이동 {p.moves}번
            </span>
          </button>
        ))}
      </div>

      <div className={`rounded-2xl px-4 py-3 ${preview ? "bg-primary-soft" : "bg-surface"}`}>
        <p className="text-[15px] font-bold text-ink">{plan.tagline}</p>
        <p className="mt-0.5 text-[14px] text-ink-2">🏨 {plan.stays.join(" → ")}</p>
        {preview && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-primary-ink">미리보기예요 · 지금 적용된 플랜은 {currentPlan}예요</span>
            <button type="button" className={`${btn.primary} min-h-10 px-4 text-[14px]`} onClick={() => onSwitchPlan(viewPlan)}>
              플랜 {viewPlan}로 바꾸기
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day, index) => {
          const { done, total } = getDayProgress(day);
          const isToday = !preview && day.id === todayDayId;
          return (
            <button
              key={day.id}
              type="button"
              disabled={preview}
              onClick={() => onOpenDay(day.id)}
              className={`${card} press flex flex-col overflow-hidden text-left ${
                isToday ? "ring-2 ring-primary" : ""
              }`}
            >
              {(() => {
                const photo = dayPhoto(day.title, day.items.map((i) => i.title));
                return photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 날짜 카드 대표 사진
                  <img src={photo.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-32 w-full object-cover md:h-36" />
                ) : (
                  <div className="h-3 w-full bg-primary-soft" />
                );
              })()}
              <div className="flex flex-col p-5 pt-4">
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
              </div>
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
