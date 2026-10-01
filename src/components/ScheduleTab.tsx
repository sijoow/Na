"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { formatLong, formatShort } from "@/lib/date";
import { dayRoutes } from "@/lib/dayRoute";
import { linkDayPlaces, type PlaceLink } from "@/lib/placeMatch";
import { applyChoice, choiceForItem, type ChoiceOption, type ChoiceSlot } from "@/lib/choiceSlots";
import { getDayProgress, toggleItemDone } from "@/lib/trip";
import type { Day, PlanItem, TripState } from "@/lib/types";
import PlaceInfo from "./PlaceInfo";
import { dayPhoto } from "./Photo";
import ChoiceTabs from "./ChoiceTabs";
import { btn, card } from "./ui";

// 확정 일정표 — "파워J는 일정을 수시로 바꾸지 않는다, 정해 놓고 간다".
// 일정은 대화로 정해서 data/trip.json 에 넣고, 여기서는 보기 · 완료 체크 · 장소 정보 · 길찾기만 한다.
// 예외: 마사지 가게·식당 칸은 미리 짜 둔 후보 중에서 탭으로 골라 바꿀 수 있다 (lib/choiceSlots).

interface Props {
  state: TripState;
  day: Day;
  todayDayId: string | null;
  onSelectDay: (dayId: string) => void;
  update: (fn: (s: TripState) => TripState) => void;
}

export default function ScheduleTab({ state, day, todayDayId, onSelectDay, update }: Props) {
  const chipsRef = useRef<HTMLElement>(null);

  // 폰: 고른 날짜 칩이 가운데 오도록 칩 줄을 옆으로 스크롤
  useEffect(() => {
    const box = chipsRef.current;
    const chip = box?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!box || !chip || box.clientWidth === 0) return;
    box.scrollTo({ left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [day.id]);
  const dayIndex = state.days.findIndex((d) => d.id === day.id);
  // 그날 동선 — 전날 숙소에서 출발해 일정 순서대로 (구글 지도 경유지 9곳 넘으면 나눔)
  const routes = dayRoutes(day, dayIndex > 0 ? state.days[dayIndex - 1].lodging : null);
  // 장소 정보·길찾기 버튼은 하루 안에서 겹치지 않게 (이동엔 길찾기, 처음 방문엔 정보)
  const links = linkDayPlaces(day.items);

  return (
    <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
      {/* 태블릿/PC: 왼쪽 날짜 목록 */}
      <aside className="hidden md:block">
        <nav className="sticky top-28 space-y-1.5" aria-label="날짜 선택">
          {state.days.map((d, i) => {
            const { done, total } = getDayProgress(d);
            const active = d.id === day.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDay(d.id)}
                aria-current={active ? "true" : undefined}
                className={`press w-full rounded-2xl px-4 py-3 text-left ${
                  active ? "bg-surface shadow-sm" : "active:bg-surface/60"
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span className={`font-bold ${active ? "text-primary-ink" : "text-ink-3"}`}>
                    D{i + 1} · {formatShort(d.date)}
                    {d.id === todayDayId && " · 오늘"}
                  </span>
                  <span className="text-ink-4">
                    {done}/{total}
                  </span>
                </div>
                <div className={`mt-0.5 truncate text-[15px] font-bold ${active ? "text-ink" : "text-ink-2"}`}>
                  {d.title || "(제목 없음)"}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 폰: 가로 스크롤 날짜 칩 — 헤더 아래에 붙어 있어서 스크롤해도 날짜를 바로 바꿀 수 있다 */}
      <nav
        ref={chipsRef}
        aria-label="날짜 선택"
        className="sticky top-[var(--app-header-h)] z-20 -mx-4 mb-3 flex gap-2 overflow-x-auto bg-page/95 px-4 py-2 backdrop-blur-md no-scrollbar md:hidden"
      >
        {state.days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              onSelectDay(d.id);
              window.scrollTo({ top: 0 });
            }}
            aria-current={d.id === day.id ? "true" : undefined}
            className={`press min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap ${
              d.id === day.id ? "bg-ink text-page" : "bg-surface text-ink-2"
            }`}
          >
            D{i + 1} {formatShort(d.date)}
            {d.id === todayDayId && " · 오늘"}
          </button>
        ))}
      </nav>

      <section className="min-w-0 space-y-4">
        <div className={`${card} overflow-hidden`}>
          {(() => {
            const photo = dayPhoto(day.title, day.items.map((i) => i.title));
            return photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- 날짜 대표 사진 배너
              <img src={photo.url} alt="" referrerPolicy="no-referrer" className="h-36 w-full object-cover md:h-44" />
            ) : null;
          })()}
          <div className="space-y-2 p-5 md:p-6">
            <p className="text-[15px] font-bold text-primary-ink">
              D{dayIndex + 1} · {formatLong(day.date)}
              {day.id === todayDayId && " · 오늘"}
            </p>
            <h2 className="text-[24px] leading-snug font-bold tracking-tight">{day.title || "(제목 없음)"}</h2>
            <p className="flex gap-2 text-[15px]">
              <span className="shrink-0 font-semibold text-ink-3">🏨 숙소</span>
              <span className="text-ink">{day.lodging || "-"}</span>
            </p>
            {routes.map((r, i) => (
              <div key={r.url} className="pt-1">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className={`${btn.soft} w-full`}>
                  🗺️ {routes.length > 1 ? `동선 ${i + 1}/${routes.length}` : "오늘 동선"} 구글 지도로 열기 · {r.stops.length}곳
                </a>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{r.stops.map((s) => s.name).join(" → ")}</p>
              </div>
            ))}
            <p className="pt-1 text-[13px] leading-relaxed text-ink-3">
              🔒 확정 일정이에요. 장소가 있는 일정은 누르면 정보가 펼쳐지고, 🧭 길찾기는 지금 위치에서 출발해요.
            </p>
          </div>
        </div>

        {day.items.length === 0 ? (
          <div className={`${card} p-10 text-center text-ink-3`}>아직 정해진 일정이 없어요.</div>
        ) : (
          <ul className={`${card} px-2 pt-4 pb-1 md:px-4`}>
            {day.items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                isFirst={i === 0}
                isLast={i === day.items.length - 1}
                link={links.get(item.id)}
                choice={choiceForItem(day.date, item)}
                onPick={(slot, option) => update((s) => applyChoice(s, slot, option))}
                onToggle={() => update((s) => toggleItemDone(s, day.id, item.id))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  link,
  choice,
  onPick,
  onToggle,
}: {
  item: PlanItem;
  isFirst: boolean;
  isLast: boolean;
  link: PlaceLink | undefined;
  /** 이 일정이 고르는 칸(마사지 가게·식당)의 대표 일정이면 그 칸과 지금 들어간 후보 */
  choice: { slot: ChoiceSlot; currentId: string } | null;
  onPick: (slot: ChoiceSlot, option: ChoiceOption) => void;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[item.category];
  const place = link?.place ?? null;
  const route = link?.route ?? null;
  const canOpen = link?.info === true || choice !== null;
  const [open, setOpen] = useState(false);
  // 처음 펼칠 때 만들고, 접을 때는 남겨 둬야 닫히는 애니메이션이 보인다
  const [loaded, setLoaded] = useState(false);
  const toggle = () => {
    setOpen((v) => !v);
    setLoaded(true);
  };
  const hasBar = route !== null || canOpen;

  const chip = (
    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[12px] font-bold ${meta.chipClass}`}>
      {meta.emoji} {meta.label}
    </span>
  );
  const check = (
    <label className="relative z-10 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface">
      <input type="checkbox" checked={item.done} onChange={onToggle} aria-label={`${item.title} 완료`} />
    </label>
  );
  const body = (
    <>
      {/* 분류 칩은 모바일에선 카드 위 시간 줄에 */}
      <span className="hidden md:inline">{chip}</span>
      <span
        className={`block text-[16px] leading-snug font-semibold tracking-tight text-ink md:mt-1 md:text-[17px] ${
          item.done ? "line-through" : ""
        }`}
      >
        {item.title}
      </span>
      {item.memo && (
        <span className="mt-1 block text-[14px] leading-relaxed whitespace-pre-line text-ink-3">{item.memo}</span>
      )}
    </>
  );
  const bodyClass = `block w-full px-3.5 text-left ${hasBar ? "pt-3 pb-2" : "py-3"}`;

  return (
    <li className={`relative md:flex md:items-stretch md:gap-3 ${item.done ? "opacity-55" : ""}`}>
      {/* 모바일: 완료 체크 · 시간 · 분류를 카드 위 한 줄에 — 카드가 화면 너비를 다 쓴다 */}
      <div className="flex items-center gap-2 pb-1.5 md:hidden">
        {check}
        <span className="text-[17px] font-bold tabular-nums text-ink">{item.time || "--:--"}</span>
        {chip}
      </div>
      {/* PC: 왼쪽 시간 + 타임라인(선 + 완료 체크) */}
      <span className="hidden w-14 shrink-0 pt-3 text-right text-[16px] font-bold tabular-nums text-ink md:block">
        {item.time || "--:--"}
      </span>
      <span className="relative hidden w-8 shrink-0 justify-center md:flex">
        <span
          className={`absolute w-0.5 bg-line ${isFirst ? "top-5" : "top-0"} ${isLast ? "h-5" : "bottom-0"}`}
          aria-hidden
        />
        <span className="mt-2">{check}</span>
      </span>
      {/* 내용 — 장소가 있으면 누를 때 정보가 아래로 펼쳐진다 */}
      <div className="mb-4 min-w-0 overflow-hidden rounded-2xl bg-surface-2 md:mb-3 md:flex-1">
        {canOpen ? (
          <button type="button" onClick={toggle} aria-expanded={open} className={`${bodyClass} active:bg-surface-3`}>
            {body}
          </button>
        ) : (
          <div className={bodyClass}>{body}</div>
        )}
        {hasBar && (
          <div className="flex flex-wrap gap-2 px-3.5 pb-3">
            {route && place && (
              <a
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-9 max-w-full items-center gap-1 rounded-full bg-primary-soft px-3 text-[13px] font-bold text-primary-ink"
              >
                <span aria-hidden>🧭</span>
                <span className="truncate">{place.name.replace(/\s*\(.*$/, "")} 길찾기</span>
              </a>
            )}
            {canOpen && (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className="press inline-flex min-h-9 items-center rounded-full bg-surface px-3 text-[13px] font-semibold text-ink-2"
              >
                {open
                  ? "접기 ▲"
                  : choice
                    ? `${choice.slot.noun} 비교 · 고르기 (${choice.slot.options.length}${choice.slot.unit ?? "곳"}) ▼`
                    : "정보 보기 ▼"}
              </button>
            )}
          </div>
        )}
        {canOpen && (
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              {loaded && (
                <div className="px-2 pb-2">
                  {choice ? (
                    <ChoiceTabs
                      slot={choice.slot}
                      currentId={choice.currentId}
                      onPick={(option) => onPick(choice.slot, option)}
                    />
                  ) : (
                    place && <PlaceInfo place={place} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
