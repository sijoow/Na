// 나트랑 그랩 요금 어림 계산 (동).
// Grab 공식 요금표(칸호아, VAT 8% 포함, 2026-07-08 갱신) + 건당 플랫폼 수수료 5천~1.9만동.
// https://www.grab.com/vn/en/blog/bang-thong-tin-cac-dich-vu-tren-ung-dung-grab/
// 앱 사전견적이 실제 청구액이고, 탄력요금·야간(22~06시)·우천 할증은 빠져 있어 위쪽을 넉넉히 잡는다.

export interface FareRange {
  min: number;
  max: number;
}

type Seats = 4 | 7;

interface FareModel {
  /** 처음 2km 요금 */
  base: number;
  perKm: number;
  perMin: number;
}

const MODELS: Record<Seats, FareModel> = {
  4: { base: 27000, perKm: 12960, perMin: 550 },
  7: { base: 33382, perKm: 15807, perMin: 864 },
};
const PLATFORM_FEE = { min: 5000, max: 19000 };

// 캄란공항 ⇔ 나트랑 시내 노선 고정요금 (40km까지) + 수수료 약 1.5만동 + 공항 주차료 9천동, 새벽이면 야간할증 1만~2만동
const AIRPORT_FIXED: Record<Seats, number> = { 4: 343636, 7: 392727 };

const round = (v: number) => Math.round(v / 1000) * 1000;

/** 도로 거리(km)·차로 걸리는 시간(분)으로 미터 요금 범위 */
export function estimateGrab(km: number, minutes: number, seats: Seats = 4): FareRange {
  const m = MODELS[seats];
  const fare = m.base + Math.max(0, km - 2) * m.perKm + minutes * m.perMin;
  return { min: round(fare + PLATFORM_FEE.min), max: round((fare + PLATFORM_FEE.max) * 1.15) };
}

/** 캄란공항 ⇔ 나트랑 시내 (고정요금) */
export function estimateAirport(seats: Seats = 7, night = false): FareRange {
  const fare = AIRPORT_FIXED[seats] + 15000 + 9000;
  return { min: round(fare), max: round(fare + (night ? 20000 : 0) + 10000) };
}

const man = (vnd: number) => `${Number((vnd / 10000).toFixed(1))}만`;

/** '약 4.2만~5.5만동 (2,200~2,900원)' */
export function formatFare(f: FareRange, krwPer1000Vnd = 52): string {
  const krw = (v: number) => (Math.round(((v / 1000) * krwPer1000Vnd) / 100) * 100).toLocaleString("ko-KR");
  return `약 ${man(f.min)}~${man(f.max)}동 (${krw(f.min)}~${krw(f.max)}원)`;
}
