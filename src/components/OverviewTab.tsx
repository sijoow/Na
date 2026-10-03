"use client";

import { useState, useSyncExternalStore } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { formatPeriod, formatShort, type TripStatus } from "@/lib/date";
import { getPlan } from "@/lib/plans";
import BookingsCard from "./BookingsCard";
import { getDayProgress, percent, type Progress } from "@/lib/trip";
import type { Day, Flight, TripState } from "@/lib/types";
import { activityPhoto, dayPhoto, dishPhoto, groupPhoto, heroPhoto, placePhoto, refPhoto, stayPhoto, type PhotoInfo } from "./Photo";
import { btn, card } from "./ui";

// 지금 시각(HH:MM) — 1분마다 다시 계산. 서버 렌더링 땐 null (하이드레이션 불일치 없음)
function subscribeMinute(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function useNow(): string | null {
  return useSyncExternalStore(subscribeMinute, nowHHMM, () => null);
}

interface Props {
  state: TripState;
  status: TripStatus | null;
  progress: Progress;
  todayDayId: string | null;
  onOpenDay: (dayId: string) => void;
  onGo: (tab: GoTab) => void;
  update: (fn: (s: TripState) => TripState) => void;
}

export type GoTab =
  | "desert"
  | "vintickets"
  | "kids"
  | "dam"
  | "souvenir"
  | "pharmacy"
  | "stays"
  | "tours"
  | "food"
  | "spa"
  | "map"
  | "weather"
  | "schedule";

const SHORTCUTS: { tab: GoTab; label: string; desc: string; photo: () => PhotoInfo | undefined }[] = [
  { tab: "desert", label: "사막투어 (확정)", desc: "HT나트랑 · 당일 안내", photo: () => activityPhoto("phan-rang-desert") },
  { tab: "vintickets", label: "빈원더스 티켓", desc: "구매처 비교·아이 표", photo: () => placePhoto("vinwonders") },
  { tab: "kids", label: "아이랑 갈 곳", desc: "추천·가격·예약", photo: () => refPhoto("kids:capybara") ?? placePhoto("city-hotel-area") },
  { tab: "dam", label: "담시장", desc: "층별 안내·시세표", photo: () => refPhoto("dam:hero") ?? placePhoto("dam-market") },
  { tab: "souvenir", label: "기념품", desc: "사진·산 것 체크", photo: () => groupPhoto("견과·건과일") },
  { tab: "pharmacy", label: "약국 쇼핑", desc: "인기템·아이 주의", photo: () => refPhoto("pharmacy:hero") ?? groupPhoto("생활·뷰티") },
  { tab: "stays", label: "숙소", desc: "확정 숙소 3곳", photo: () => stayPhoto("movenpick-cam-ranh") ?? placePhoto("cam-ranh-resort-area") },
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

export default function OverviewTab({ state, status, progress, todayDayId, onOpenDay, onGo, update }: Props) {
  const hero = { ...heroText(status), photo: heroPhoto() };
  const days = state.days;
  const plan = getPlan(state.planId);
  const now = useNow();
  // 홈 맨 위에 보여 줄 날: 여행 중이면 오늘, 여행 전이면 첫날 (여행이 끝나면 없음)
  const focusDay = todayDayId ? days.find((d) => d.id === todayDayId) : status?.kind === "before" ? days[0] : undefined;
  const focusIndex = focusDay ? days.indexOf(focusDay) : -1;
  const focusLabel = !focusDay
    ? ""
    : todayDayId
      ? `오늘 · D${focusIndex + 1} ${formatShort(focusDay.date)}`
      : `다가오는 일정 · D${focusIndex + 1} ${formatShort(focusDay.date)} · ${status?.label === "D-1" ? "내일" : status?.label}`;
  // 날짜별 카드도 오늘부터 (지난 날은 맨 뒤로)
  const ordered = focusIndex > 0 ? [...days.slice(focusIndex), ...days.slice(0, focusIndex)] : days;
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

      {/* 그날 일정 (여행 전엔 첫날) — 예약 카드 대신 맨 위에 */}
      {focusDay && (
        <TodayCard day={focusDay} label={focusLabel} isToday={Boolean(todayDayId)} now={now} onOpenDay={onOpenDay} />
      )}

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
      </div>

      <div className="rounded-2xl bg-surface px-4 py-3">
        <p className="text-[15px] font-bold text-ink">{plan.tagline}</p>
        <p className="mt-0.5 text-[14px] text-ink-2">🏨 {plan.stays.join(" → ")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {ordered.map((day) => {
          const index = days.indexOf(day);
          const { done, total } = getDayProgress(day);
          const isToday = day.id === todayDayId;
          const isPast = Boolean(todayDayId) && index < focusIndex;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onOpenDay(day.id)}
              className={`${card} press flex flex-col overflow-hidden text-left ${
                isToday ? "ring-2 ring-primary" : ""
              } ${isPast ? "opacity-60" : ""}`}
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
                  {isPast && " · 지난 날"}
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

      {/* 예약 확인 — 이제 맨 아래에 접어 둔다 (남은 식당 예약·연락처를 볼 때만 펼치기) */}
      <details className="rounded-3xl bg-surface-2 p-4 md:p-5">
        <summary className="cursor-pointer px-1 text-[16px] font-bold text-ink">📌 예약 확인 · 연락처 (펼치기)</summary>
        <div className="mt-3">
          <BookingsCard state={state} update={update} />
        </div>
      </details>
    </div>
  );
}

/** 홈 맨 위 '그날 일정' — 오늘이면 지금 시각 다음 일정을 '다음'으로 표시하고 지난 일정은 흐리게 */
function TodayCard({
  day,
  label,
  isToday,
  now,
  onOpenDay,
}: {
  day: Day;
  label: string;
  isToday: boolean;
  now: string | null;
  onOpenDay: (dayId: string) => void;
}) {
  const nextIdx = isToday && now ? day.items.findIndex((i) => i.time && i.time >= now) : -1;
  // 오늘이면 지난 일정은 접고 바로 전 일정부터 보여 준다 (다 지났으면 마지막 2개만)
  const hideCount = !isToday || !now ? 0 : nextIdx === -1 ? Math.max(0, day.items.length - 2) : Math.max(0, nextIdx - 1);
  const [showPast, setShowPast] = useState(false);
  const shown = showPast ? day.items : day.items.slice(hideCount);
  const offset = showPast ? 0 : hideCount;
  const { done, total } = getDayProgress(day);
  return (
    <section className={`${card} overflow-hidden`}>
      <div className="px-5 pt-5 pb-2 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-lg bg-primary px-2.5 py-1 text-[13px] font-bold text-white">{label}</span>
          <span className="text-[13px] font-medium text-ink-3 tabular-nums">
            {done}/{total}
          </span>
        </div>
        <h2 className="mt-3 text-[20px] leading-snug font-bold tracking-tight">{day.title || "(제목 없음)"}</h2>
        <p className="mt-1 text-[14px] text-ink-3">🏨 {day.lodging || "-"}</p>
      </div>
      {hideCount > 0 && (
        <button type="button" onClick={() => setShowPast((v) => !v)} className="mx-5 mb-1 text-[14px] font-semibold text-primary-ink md:mx-6">
          {showPast ? "지난 일정 접기 ▲" : `지난 일정 ${hideCount}개 보기 ▼`}
        </button>
      )}
      <ul className="px-3 pb-1 md:px-4">
        {shown.map((item, j) => {
          const i = j + offset;
          const next = i === nextIdx;
          const past = isToday && now !== null && Boolean(item.time) && item.time < now && !next;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenDay(day.id)}
                className={`press flex w-full items-start gap-3 rounded-2xl px-2 py-2 text-left ${next ? "bg-primary-soft" : ""} ${
                  past || item.done ? "opacity-50" : ""
                }`}
              >
                <span className="w-12 shrink-0 pt-px text-[14px] font-semibold text-ink-3 tabular-nums">{item.time || "--:--"}</span>
                <span aria-hidden>{CATEGORY_META[item.category].emoji}</span>
                <span
                  className={`min-w-0 flex-1 text-[15px] leading-snug ${next ? "font-bold text-primary-ink" : "text-ink"} ${
                    item.done ? "line-through" : ""
                  }`}
                >
                  {item.title}
                </span>
                {next && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">다음</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-5 pt-1 pb-5 md:px-6">
        <button type="button" className={`${btn.soft} min-h-11 w-full text-[15px]`} onClick={() => onOpenDay(day.id)}>
          일정 탭에서 자세히 보기 ›
        </button>
      </div>
    </section>
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
