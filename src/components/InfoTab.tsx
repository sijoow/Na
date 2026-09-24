"use client";

import { useRef, useState } from "react";
import { createSeedState } from "@/lib/seed";
import { setNotes, updateFlight, updateTripInfo } from "@/lib/trip";
import type { Flight, FlightPatch, TripState } from "@/lib/types";
import { parseTripJson, serializeTrip } from "@/lib/validate";
import { btn, card } from "./ui";

interface Props {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}

export default function InfoTab({ state, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([serializeTrip(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nhatrang-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    const result = parseTripJson(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImportError(null);
    if (window.confirm("가져온 파일로 지금 일정을 모두 바꿀까요?")) {
      update(() => result.state);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-4 md:space-y-5">
        <section className={`${card} space-y-4 p-5 md:p-7`}>
          <h2 className="text-xl font-bold tracking-tight">여행 정보</h2>
          <Field label="여행 이름">
            <input
              value={state.tripTitle}
              onChange={(e) => update((s) => updateTripInfo(s, { tripTitle: e.target.value }))}
              className="w-full"
            />
          </Field>
          <Field label="인원">
            <input
              value={state.travelers}
              onChange={(e) => update((s) => updateTripInfo(s, { travelers: e.target.value }))}
              className="w-full"
            />
          </Field>
        </section>

        {state.flights.map((f) => (
          <FlightCard
            key={f.id}
            flight={f}
            onChange={(patch) => update((s) => updateFlight(s, f.id, patch))}
          />
        ))}
      </div>

      <div className="min-w-0 space-y-4 md:space-y-5">
        <section className={`${card} space-y-3 p-5 md:p-7`}>
          <h2 className="text-xl font-bold tracking-tight">메모</h2>
          <label className="block">
            <span className="sr-only">메모</span>
            <textarea
              value={state.notes}
              onChange={(e) => update((s) => setNotes(s, e.target.value))}
              rows={14}
              className="max-h-[60dvh] min-h-60 w-full leading-relaxed md:max-h-none"
              placeholder="예약번호, 연락처, 팁 등"
            />
          </label>
        </section>

        <section className={`${card} space-y-4 p-5 md:p-7`}>
          <h2 className="text-xl font-bold tracking-tight">백업 · 초기화</h2>
          <p className="text-[15px] text-ink-2">
            일정은 PC의 <code>data/trip.json</code> 파일에 자동 저장돼요.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button type="button" className={btn.secondary} onClick={exportJson}>
              ⬇️ JSON 내보내기
            </button>
            <button type="button" className={btn.secondary} onClick={() => fileRef.current?.click()}>
              ⬆️ JSON 가져오기
            </button>
            <button
              type="button"
              className={btn.danger}
              onClick={() => {
                if (window.confirm("모든 수정 내용을 지우고 처음 초안으로 되돌릴까요?")) {
                  update(() => createSeedState());
                }
              }}
            >
              ↩️ 초안으로 되돌리기
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importJson(file);
            }}
          />
          {importError && (
            <p className="rounded-2xl bg-danger-soft p-4 text-[15px] text-danger">
              가져오지 못했어요: {importError}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[14px] font-semibold text-ink-3">{label}</span>
      {children}
    </label>
  );
}

function FlightCard({ flight: f, onChange }: { flight: Flight; onChange: (patch: FlightPatch) => void }) {
  return (
    <section className={`${card} space-y-4 p-5 md:p-7`}>
      <h2 className="text-xl font-bold tracking-tight">{f.direction === "출국" ? "🛫" : "🛬"} {f.direction}편</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="항공사">
          <input value={f.airline} onChange={(e) => onChange({ airline: e.target.value })} className="w-full" />
        </Field>
        <Field label="편명">
          <input
            value={f.flightNo}
            onChange={(e) => onChange({ flightNo: e.target.value })}
            placeholder="미정"
            className="w-full"
          />
        </Field>
      </div>
      {/* 폰: 장소 한 줄 + 날짜·시간 두 칸, 태블릿/PC: 세 칸 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_7rem]">
        <Field label="출발지" className="col-span-2 sm:col-span-1">
          <input value={f.from} onChange={(e) => onChange({ from: e.target.value })} className="w-full" />
        </Field>
        <Field label="출발 날짜">
          <input
            type="date"
            value={f.departDate}
            onChange={(e) => onChange({ departDate: e.target.value })}
            className="w-full"
          />
        </Field>
        <Field label="시간">
          <input
            type="time"
            value={f.departTime}
            onChange={(e) => onChange({ departTime: e.target.value.slice(0, 5) })}
            className="w-full"
          />
        </Field>
      </div>
      {/* 폰: 장소 한 줄 + 날짜·시간 두 칸, 태블릿/PC: 세 칸 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_7rem]">
        <Field label="도착지" className="col-span-2 sm:col-span-1">
          <input value={f.to} onChange={(e) => onChange({ to: e.target.value })} className="w-full" />
        </Field>
        <Field label="도착 날짜">
          <input
            type="date"
            value={f.arriveDate}
            onChange={(e) => onChange({ arriveDate: e.target.value })}
            className="w-full"
          />
        </Field>
        <Field label="시간">
          <input
            type="time"
            value={f.arriveTime}
            onChange={(e) => onChange({ arriveTime: e.target.value.slice(0, 5) })}
            className="w-full"
          />
        </Field>
      </div>
      <Field label="메모">
        <input value={f.memo} onChange={(e) => onChange({ memo: e.target.value })} className="w-full" />
      </Field>
    </section>
  );
}
