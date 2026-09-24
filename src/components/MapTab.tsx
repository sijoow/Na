"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { GUIDE } from "@/data/guide";
import { formatShort } from "@/lib/date";
import type { Leg, Place } from "@/lib/guideTypes";
import type { TripState } from "@/lib/types";
import type { MapPath } from "./MapView";
import { Photo, placePhoto } from "./Photo";
import { btn, card } from "./ui";

// Leaflet은 브라우저 전용 → 서버 렌더링 없이 불러온다
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[280px] animate-pulse rounded-3xl bg-surface-2" />,
});

/** 이동 구간 버튼: 폰은 세로(아이콘 위·글자 아래) 작은 버튼, 태블릿/PC 는 가로.
 *  btn.secondary 의 기본 크기를 덮어써야 해서 전부 화면 크기 변형(max-sm:/sm:)으로 준다 */
const LEG_BTN =
  "max-sm:min-h-14 max-sm:flex-col max-sm:gap-0.5 max-sm:px-1 max-sm:text-[13px] sm:min-h-10 sm:px-3 sm:text-[14px]";

const DAY_COLORS = ["#3182f6", "#f04452", "#03b26c", "#ff9f00", "#8b5cf6", "#00b8d9", "#e5487d", "#6b7684"];

/** 동 금액을 '9만' '33.5만' '200만' 처럼 */
function fmtVnd(n: number): string {
  if (n >= 10000) return `${Number((n / 10000).toFixed(1)).toLocaleString("ko-KR")}만`;
  return n.toLocaleString("ko-KR");
}

function fmtKrw(vnd: number, rate: number): string {
  const krw = (vnd / 1000) * rate;
  if (krw >= 10000) return `${(krw / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  return `${Math.round(krw / 100) * 100}`;
}

function directionsUrl(from: Place, to: Place): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
}

function placeUrl(p: Place): string {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}

interface Props {
  state: TripState;
}

export default function MapTab({ state }: Props) {
  const { places, legs, grabTips, exchangeRate, vinwondersAccess, blogTopics } = GUIDE;
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const dayKeys = state.days.map((_, i) => `D${i + 1}`);
  const [day, setDay] = useState<string>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const dayLegs = useMemo(
    () => (day === "all" ? legs : legs.filter((l) => l.day === day)),
    [day, legs],
  );

  const highlightIds = useMemo(() => {
    if (day === "all") return [];
    const ids = new Set<string>();
    for (const l of dayLegs) {
      ids.add(l.fromId);
      ids.add(l.toId);
    }
    return [...ids];
  }, [day, dayLegs]);

  const paths = useMemo<MapPath[]>(() => {
    const byDay = new Map<string, Leg[]>();
    for (const l of dayLegs) byDay.set(l.day, [...(byDay.get(l.day) ?? []), l]);
    return [...byDay.entries()].map(([d, ls]) => {
      const points: [number, number][] = [];
      for (const l of ls) {
        const from = placeById.get(l.fromId);
        const to = placeById.get(l.toId);
        if (!from || !to) continue;
        const last = points[points.length - 1];
        if (!last || last[0] !== from.lat || last[1] !== from.lng) points.push([from.lat, from.lng]);
        points.push([to.lat, to.lng]);
      }
      return { color: DAY_COLORS[(Number(d.slice(1)) - 1) % DAY_COLORS.length], points };
    });
  }, [dayLegs, placeById]);

  const onSelectPlace = setSelectedPlaceId;
  const selectedPlace = selectedPlaceId ? placeById.get(selectedPlaceId) : undefined;
  const selectedTopics = selectedPlace ? blogTopics.filter((t) => t.placeId === selectedPlace.id) : [];

  const copyAddress = async (p: Place) => {
    const text = `${p.localName}${p.address ? `, ${p.address}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(p.id);
      setTimeout(() => setCopied((c) => (c === p.id ? null : c)), 2000);
    } catch {
      window.prompt("아래 주소를 복사하세요", text);
    }
  };

  if (places.length === 0) {
    return (
      <div className={`${card} p-10 text-center text-ink-3`}>
        지도·이동 정보를 조사하고 있어요. 조사가 끝나면 여기에 표시돼요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 날짜 선택 */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
        {["all", ...dayKeys].map((k, i) => {
          const d = i > 0 ? state.days[i - 1] : null;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setDay(k);
                setSelectedPlaceId(null);
              }}
              className={`press min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap ${
                day === k ? "bg-ink text-page" : "bg-surface text-ink-2"
              }`}
            >
              {d ? `${k} ${formatShort(d.date)}` : "전체"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="h-[45vh] min-h-[280px] md:h-[48vh] md:min-h-[320px] lg:h-[calc(100dvh-9rem)]">
            <MapView
              places={places}
              highlightIds={highlightIds}
              paths={paths}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {selectedPlace && (
            <section className={`${card} p-5`}>
              <div className="mb-3">
                <Photo photo={placePhoto(selectedPlace.id)} alt={selectedPlace.name} />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[19px] font-bold tracking-tight">{selectedPlace.name}</h3>
                  <p className="text-[14px] text-ink-3">{selectedPlace.localName}</p>
                </div>
                <button type="button" className={btn.icon} onClick={() => setSelectedPlaceId(null)} aria-label="닫기">
                  ✕
                </button>
              </div>
              {selectedPlace.note && <p className="mt-2 text-[15px] text-ink-2">{selectedPlace.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <a className={btn.soft} href={placeUrl(selectedPlace)} target="_blank" rel="noopener noreferrer">
                  구글 지도에서 보기
                </a>
                <button type="button" className={btn.secondary} onClick={() => copyAddress(selectedPlace)}>
                  {copied === selectedPlace.id ? "복사했어요 ✓" : "현지 주소 복사 (Grab용)"}
                </button>
              </div>
              {selectedTopics.map((t) => (
                <div key={t.topic} className="mt-4 rounded-2xl bg-surface-2 p-4">
                  <p className="text-[14px] font-bold text-ink-2">블로그 후기 요약 · {t.topic}</p>
                  <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{t.summary}</p>
                </div>
              ))}
            </section>
          )}

          <section className={`${card} p-5`}>
            <h3 className="mb-1 text-[19px] font-bold tracking-tight">
              {day === "all" ? "전체 이동 구간" : `${day} 이동`}
            </h3>
            <p className="mb-3 text-[13px] text-ink-3">
              요금은 Grab 예상 범위예요 · 1,000동 ≈ {exchangeRate.krwPer1000Vnd}원 ({exchangeRate.asOf} 기준)
            </p>
            {dayLegs.length === 0 && <p className="py-6 text-center text-ink-3">이 날은 이동 정보가 없어요.</p>}
            <ol className="divide-y divide-line">
              {dayLegs.map((l, i) => {
                const from = placeById.get(l.fromId);
                const to = placeById.get(l.toId);
                if (!from || !to) return null;
                return (
                  <li key={`${l.day}-${i}`} className="py-4 first:pt-1">
                    <div className="flex items-center gap-2 text-[13px] font-bold">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-white"
                        style={{ background: DAY_COLORS[(Number(l.day.slice(1)) - 1) % DAY_COLORS.length] }}
                      >
                        {l.day}
                      </span>
                      <span className="text-ink-3">
                        {l.distanceKm}km · 약 {l.durationMin}분 · {l.grabType}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[17px] font-bold tracking-tight">
                      {from.name} → {to.name}
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-primary-ink">
                      {l.fareVndMax > 0
                        ? `${fmtVnd(l.fareVndMin)}~${fmtVnd(l.fareVndMax)}동 (약 ${fmtKrw(l.fareVndMin, exchangeRate.krwPer1000Vnd)}~${fmtKrw(l.fareVndMax, exchangeRate.krwPer1000Vnd)}원)`
                        : "요금 정보 없음"}
                    </p>
                    {l.note && <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{l.note}</p>}
                    {/* 폰: 세 버튼을 한 줄에 같은 크기로 (아이콘 위, 글자 아래) */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                      <a
                        className={`${btn.secondary} ${LEG_BTN}`}
                        href={directionsUrl(from, to)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span aria-hidden>🧭</span>
                        <span>길찾기</span>
                      </a>
                      <button type="button" className={`${btn.secondary} ${LEG_BTN}`} onClick={() => copyAddress(to)}>
                        {copied === to.id ? (
                          <>
                            <span aria-hidden>✓</span>
                            <span>복사했어요</span>
                          </>
                        ) : (
                          <>
                            <span aria-hidden>📋</span>
                            <span>
                              <span className="sm:hidden">주소 복사</span>
                              <span className="max-sm:hidden">도착지 주소 복사</span>
                            </span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`${btn.secondary} ${LEG_BTN}`}
                        onClick={() => {
                          setSelectedPlaceId(to.id);
                          // 폰에서는 지도가 위에 있으니 올라가서 보여 준다
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <span aria-hidden>📍</span>
                        <span>
                          <span className="sm:hidden">지도 보기</span>
                          <span className="max-sm:hidden">지도에서 보기</span>
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {vinwondersAccess && (day === "all" || highlightIds.includes("vinwonders")) && (
            <section className="rounded-3xl bg-primary-soft p-5 text-primary-ink">
              <h3 className="text-[17px] font-bold">⛴️ 빈원더스 가는 법</h3>
              <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line">{vinwondersAccess}</p>
            </section>
          )}
        </div>
      </div>

      {grabTips.length > 0 && (
        <section className="pt-4">
          <h2 className="mb-3 px-1 text-xl font-bold tracking-tight">🚕 Grab 이용 팁</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grabTips.map((t) => (
              <div key={t.title} className={`${card} p-5`}>
                <p className="text-[16px] font-bold">{t.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{t.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pt-4">
        <h2 className="mb-3 px-1 text-xl font-bold tracking-tight">📍 장소</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {places.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPlaceId(p.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`${card} press p-5 text-left`}
            >
              <div className="mb-3">
                <Photo photo={placePhoto(p.id)} alt={p.name} link={false} />
              </div>
              <p className="text-[16px] font-bold">{p.name}</p>
              <p className="text-[13px] text-ink-3">{p.localName}</p>
              {p.note && <p className="mt-1.5 line-clamp-3 text-[14px] text-ink-2">{p.note}</p>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
