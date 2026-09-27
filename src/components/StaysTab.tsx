"use client";

import { getPlan } from "@/lib/plans";
import ConfirmedStays from "./ConfirmedStays";
import { card } from "./ui";

// 숙소 확정(2026-09-27) 뒤로는 예약한 숙소 3곳만 보여 준다.
// 숙소를 고를 때 비교한 자료(구간별 비교 · 후보 순위)는 '호텔 순위' 탭에 남아 있다.
export default function StaysTab() {
  const plan = getPlan();
  return (
    <div className="space-y-6">
      <div className={`${card} px-5 py-4`}>
        <p className="text-[15px] font-bold text-ink">{plan.tagline}</p>
        <p className="mt-0.5 text-[14px] text-ink-2">🏨 {plan.stays.join(" → ")}</p>
        <p className="mt-1 text-[13px] text-ink-3">{plan.extra}</p>
      </div>
      <ConfirmedStays stays={plan.confirmed ?? []} />
      <p className="px-1 text-[13px] text-ink-3">
        숙소를 고를 때 비교한 자료(구간별 비교, 후보 호텔 순위·가격)는 더보기 → 호텔 순위에서 볼 수 있어요.
      </p>
    </div>
  );
}
