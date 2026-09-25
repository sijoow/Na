"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getTripStatus, isWithinTrip, toDateString } from "@/lib/date";
import { getPlan, switchPlanState } from "@/lib/plans";
import { getItemProgress } from "@/lib/trip";
import type { PlanId } from "@/lib/types";
import { useTripSync, type SaveStatus } from "@/lib/useTripSync";
import ChecklistTab from "./ChecklistTab";
import InfoTab from "./InfoTab";
import OverviewTab from "./OverviewTab";
import ScheduleTab from "./ScheduleTab";
import { btn, Modal } from "./ui";

// 조사 자료(지도·숙소·투어·후기)는 데이터가 커서 첫 화면에서 빼고, 그 탭을 열 때 불러온다
const loadMapTab = () => import("./MapTab");
const loadStaysTab = () => import("./StaysTab");
const loadToursShopsTab = () => import("./ToursShopsTab");
const loadReviewsTab = () => import("./ReviewsTab");
const loadWeather = () => import("./WeatherSection");
const loadAsk = () => import("./AskSection");
const MapTab = dynamic(loadMapTab, { loading: () => <TabLoading /> });
const StaysTab = dynamic(loadStaysTab, { loading: () => <TabLoading /> });
const ToursShopsTab = dynamic(loadToursShopsTab, { loading: () => <TabLoading /> });
const ReviewsTab = dynamic(loadReviewsTab, { loading: () => <TabLoading /> });
const WeatherSection = dynamic(loadWeather, { loading: () => <TabLoading /> });
const AskSection = dynamic(loadAsk, { loading: () => <TabLoading /> });

type Tab = "overview" | "schedule" | "map" | "stays" | "tours" | "weather" | "ai" | "reviews" | "checklist" | "info";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "홈" },
  { id: "schedule", label: "일정" },
  { id: "map", label: "지도·이동" },
  { id: "stays", label: "숙소" },
  { id: "tours", label: "투어·쇼핑" },
  { id: "weather", label: "날씨" },
  { id: "ai", label: "AI 질문" },
  { id: "reviews", label: "후기" },
  { id: "checklist", label: "준비물" },
  { id: "info", label: "정보·메모" },
];

// 폰 하단 탭바: 자주 쓰는 4개 + 더보기
const BOTTOM_TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "overview",
    label: "홈",
    icon: <path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z" />,
  },
  {
    id: "schedule",
    label: "일정",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    id: "map",
    label: "지도",
    icon: (
      <>
        <path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z" />
        <path d="M9 4.5v13M15 6.5v13" />
      </>
    ),
  },
  {
    id: "stays",
    label: "숙소",
    icon: (
      <>
        <path d="M3 5v15M3 16h18v4M21 16v-3.5a3 3 0 0 0-3-3h-7V16" />
        <circle cx="7" cy="12.5" r="1.8" />
      </>
    ),
  },
];

// '더보기' 바텀시트에 크게 보여줄 탭
const MORE_TABS: { id: Tab; emoji: string; label: string; desc: string }[] = [
  { id: "tours", emoji: "🎟️", label: "투어·쇼핑", desc: "투어 · 먹거리 · 기념품 · 아이 옷 · 환전" },
  { id: "weather", emoji: "🌦️", label: "날씨", desc: "실시간 예보 · 작년·10년 날씨 · Plan B" },
  { id: "ai", emoji: "🤖", label: "AI에게 물어보기", desc: "우리 일정 기반 답변 · 웹 검색 · 토큰 사용량" },
  { id: "reviews", emoji: "📝", label: "후기", desc: "블로그 후기 요약" },
  { id: "checklist", emoji: "✅", label: "준비물", desc: "챙길 것 체크리스트" },
  { id: "info", emoji: "🗒️", label: "정보·메모", desc: "항공편 · 메모 · 백업" },
];

// 오늘 날짜는 브라우저에서만 계산한다 (서버 렌더링 때는 null → 하이드레이션 불일치 없음)
function subscribeMinute(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}
function useToday(): string | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => toDateString(new Date()),
    () => null,
  );
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "저장 중…",
  saved: "저장됨",
  error: "저장 실패 · 다시 시도",
};

export default function PlannerApp() {
  const sync = useTripSync();
  const { state, update, notice, dismissNotice } = sync;
  const today = useToday();
  // 주소의 #탭이름 으로 탭을 기억 (새로고침해도 유지). 서버 렌더링 땐 로딩 화면이라 불일치 없음
  const [tab, setTabState] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.slice(1);
    return TABS.some((t) => t.id === hash) ? (hash as Tab) : "overview";
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const setTab = (next: Tab) => {
    setMoreOpen(false);
    if (next === tab) {
      // 지금 탭을 다시 누르면 맨 위로
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setTabState(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0 });
  };
  const [pickedDayId, setPickedDayId] = useState<string | null>(null);

  // 알림은 4초 뒤 자동으로 닫힘
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(dismissNotice, 4000);
    return () => clearTimeout(id);
  }, [notice, dismissNotice]);

  // 첫 화면이 뜬 뒤 한가할 때 나머지 탭 코드를 미리 받아 둔다 (탭 전환이 바로 되게)
  const ready = state !== null;
  useEffect(() => {
    if (!ready) return;
    const prefetch = () => {
      void loadMapTab();
      void loadStaysTab();
      void loadToursShopsTab();
      void loadReviewsTab();
      void loadWeather();
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 1500);
    return () => window.clearTimeout(id);
  }, [ready]);

  if (!state) {
    return sync.loadError ? (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-4xl">😵</p>
        <p className="text-xl font-bold">일정을 불러오지 못했어요</p>
        <p className="text-ink-2">{sync.loadError}</p>
        <button type="button" className={btn.primary} onClick={sync.reload}>
          다시 시도
        </button>
      </main>
    ) : (
      <LoadingSkeleton />
    );
  }

  const todayDay =
    today && isWithinTrip(today, state.startDate, state.endDate)
      ? state.days.find((d) => d.date === today)
      : undefined;
  const selectedDay =
    state.days.find((d) => d.id === pickedDayId) ?? todayDay ?? state.days[0];
  const status = today ? getTripStatus(today, state.startDate, state.endDate) : null;
  const progress = getItemProgress(state);
  const inMore = MORE_TABS.some((t) => t.id === tab);
  const checklistLeft = state.checklist.filter((c) => !c.checked).length;

  // 플랜 전환 (홈의 플랜별 일정 미리보기에서) — 숙소 데이터는 누를 때만 불러온다
  const switchPlan = async (id: PlanId) => {
    const target = getPlan(id);
    if (!window.confirm(`${target.name}(으)로 일정을 바꿀까요?
지금 일정은 따로 보관돼서, 다시 돌아오면 그대로 복원돼요.`)) return;
    const { GUIDE } = await import("@/data/guide");
    update((s) => switchPlanState(s, id, GUIDE.stays));
  };

  const openDay = (dayId: string) => {
    setPickedDayId(dayId);
    setTab("schedule");
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-page/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-5 md:h-auto md:px-8 md:pt-4 md:pb-1">
          {/* 로고: 누르면 홈으로 */}
          <h1 className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                setTab("overview");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="press flex min-w-0 items-center gap-2.5 rounded-xl py-1 pr-2 text-left"
              aria-label="홈으로"
            >
              <VietnamFlag className="h-6 w-9 shrink-0 rounded-[5px] shadow-sm md:h-7 md:w-[42px]" />
              <span className="min-w-0">
                <span className="block truncate text-[18px] leading-tight font-extrabold tracking-tight md:text-[22px]">
                  <span className="text-primary">나트랑</span> 여행기
                </span>
                <span className="block truncate text-[12px] leading-tight font-medium text-ink-3 md:text-[13px]">
                  {state.tripTitle.match(/\d+박\s*\d+일/)?.[0] ?? state.tripTitle} ·{" "}
                  {state.startDate.slice(5).replace("-", ".")} – {state.endDate.slice(5).replace("-", ".")} · {state.travelers}
                </span>
              </span>
            </button>
          </h1>
          <SaveIndicator status={sync.saveStatus} error={sync.saveError} onRetry={sync.retrySave} />
        </div>
        {/* 태블릿/PC: 상단 탭 */}
        <nav
          className="mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-3 no-scrollbar md:flex md:px-6"
          aria-label="탭"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`press relative min-h-12 shrink-0 px-3 text-[17px] font-bold whitespace-nowrap ${
                tab === t.id ? "text-ink" : "text-ink-4"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 bottom-1 h-[3px] rounded-full bg-ink" aria-hidden />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-2 pb-[calc(var(--tabbar-h)+1.5rem)] md:px-8 md:pt-3 md:pb-10">
        {tab === "overview" && (
          <OverviewTab
            state={state}
            status={status}
            progress={progress}
            todayDayId={todayDay?.id ?? null}
            onOpenDay={openDay}
            onSwitchPlan={switchPlan}
            onGo={(t) => setTab(t)}
          />
        )}
        {tab === "schedule" && (
          <ScheduleTab
            state={state}
            day={selectedDay}
            todayDayId={todayDay?.id ?? null}
            onSelectDay={setPickedDayId}
            update={update}
          />
        )}
        {tab === "map" && <MapTab state={state} />}
        {tab === "stays" && <StaysTab state={state} update={update} />}
        {tab === "tours" && <ToursShopsTab state={state} update={update} />}
        {tab === "weather" && <WeatherSection />}
        {tab === "ai" && <AskSection />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "checklist" && <ChecklistTab state={state} update={update} />}
        {tab === "info" && <InfoTab state={state} update={update} />}
      </main>

      {/* 폰: 하단 고정 탭바 */}
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid h-[60px] max-w-lg grid-cols-5">
          {BOTTOM_TABS.map((t) => (
            <li key={t.id}>
              <BottomTabButton
                label={t.label}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
                ariaCurrent={tab === t.id ? "page" : undefined}
              >
                {t.icon}
              </BottomTabButton>
            </li>
          ))}
          <li>
            <BottomTabButton
              label="더보기"
              active={inMore || moreOpen}
              onClick={() => setMoreOpen(true)}
              ariaCurrent={inMore ? "page" : undefined}
              ariaHasPopup
            >
              <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
              <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
              <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
              <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
            </BottomTabButton>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <Modal title="더보기" onClose={() => setMoreOpen(false)}>
          <ul className="-mx-2 space-y-1">
            {MORE_TABS.map((t) => {
              const active = tab === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={active ? "page" : undefined}
                    className={`press flex min-h-[72px] w-full items-center gap-4 rounded-2xl px-3 text-left ${
                      active ? "bg-primary-soft" : "active:bg-surface-2"
                    }`}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl"
                      aria-hidden
                    >
                      {t.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[18px] font-bold ${active ? "text-primary-ink" : "text-ink"}`}>
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-[14px] text-ink-3">
                        {t.id === "checklist" && state.checklist.length > 0
                          ? checklistLeft === 0
                            ? "다 챙겼어요 🎉"
                            : `${checklistLeft}개 남았어요`
                          : t.desc}
                      </span>
                    </span>
                    <span className="shrink-0 text-xl text-ink-4" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}

      {notice && (
        <div
          className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+0.75rem)] z-40 flex justify-center px-4 md:bottom-8"
          role="status"
        >
          <button
            type="button"
            onClick={dismissNotice}
            className="press rounded-2xl bg-[#333d4b] px-5 py-3.5 text-[15px] font-semibold text-white shadow-xl dark:bg-surface-3"
          >
            {notice}
          </button>
        </div>
      )}
    </div>
  );
}

function BottomTabButton({
  label,
  active,
  onClick,
  ariaCurrent,
  ariaHasPopup,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  ariaCurrent?: "page";
  ariaHasPopup?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ariaCurrent}
      aria-haspopup={ariaHasPopup ? "dialog" : undefined}
      className={`press flex h-full w-full flex-col items-center justify-center gap-1 ${
        active ? "text-ink" : "text-ink-4"
      }`}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className="text-[12px] leading-none font-semibold">{label}</span>
    </button>
  );
}

function SaveIndicator({
  status,
  error,
  onRetry,
}: {
  status: SaveStatus;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={error ?? undefined}
        className="press min-h-10 shrink-0 rounded-xl bg-danger-soft px-3 text-sm font-semibold text-danger"
      >
        {SAVE_LABEL.error}
      </button>
    );
  }
  return (
    <span
      className={`shrink-0 text-sm font-medium ${status === "saving" ? "text-ink-3" : "text-primary-ink"}`}
      aria-live="polite"
    >
      {SAVE_LABEL[status]}
    </span>
  );
}

function TabLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-label="불러오는 중">
      <div className="h-11 w-2/3 rounded-2xl bg-surface-3/70" />
      <div className="h-64 rounded-3xl bg-surface" />
      <div className="h-40 rounded-3xl bg-surface" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-8" aria-label="불러오는 중">
      <div className="h-7 w-40 rounded-xl bg-surface-3" />
      <div className="mt-5 h-40 rounded-3xl bg-surface" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-48 rounded-3xl bg-surface" />
        ))}
      </div>
    </div>
  );
}

/** 베트남 국기 (이모지 🇻🇳 는 윈도우에서 'VN' 글자로 보일 수 있어 직접 그림) */
function VietnamFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} role="img" aria-label="베트남 국기">
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        fill="#FFFF00"
        points="15,4 16.41,8.06 20.71,8.15 17.28,10.74 18.53,14.85 15,12.4 11.47,14.85 12.72,10.74 9.29,8.15 13.59,8.06"
      />
    </svg>
  );
}
