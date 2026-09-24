// 날짜는 항상 '로컬 달력 날짜'로 다룬다.
// 'YYYY-MM-DD' 문자열을 new Date('2026-10-03')처럼 파싱하면 UTC 자정으로 해석되어
// 시간대에 따라 하루가 밀릴 수 있으므로 절대 사용하지 않는다.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toDateString(date) === value;
}

/** 'HH:MM' (00:00 ~ 23:59) */
export function isTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

/** 'YYYY-MM-DD' → 로컬 자정 Date (new Date(y, m-1, d)) */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → 로컬 기준 'YYYY-MM-DD' */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayOf(value: string): string {
  return WEEKDAYS[parseLocalDate(value).getDay()];
}

/** '10/3 (토)' — 빈 값이면 '' */
export function formatShort(value: string): string {
  if (!isDateString(value)) return "";
  const date = parseLocalDate(value);
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdayOf(value)})`;
}

/** '10월 3일 (토)' */
export function formatLong(value: string): string {
  if (!isDateString(value)) return "";
  const date = parseLocalDate(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdayOf(value)})`;
}

/** '2026.10.03 (토) – 10.10 (토)' */
export function formatPeriod(start: string, end: string): string {
  if (!isDateString(start) || !isDateString(end)) return "";
  const [sy, sm, sd] = start.split("-");
  const [ey, em, ed] = end.split("-");
  const endPart = sy === ey ? `${em}.${ed}` : `${ey}.${em}.${ed}`;
  return `${sy}.${sm}.${sd} (${weekdayOf(start)}) – ${endPart} (${weekdayOf(end)})`;
}

/** b - a (일 단위, 로컬 날짜 기준) */
export function diffDays(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / MS_PER_DAY);
}

export type TripStatusKind = "before" | "dday" | "during" | "after";

export interface TripStatus {
  kind: TripStatusKind;
  label: string;
}

/** 시작 전: D-N / 시작일: D-DAY / 여행 중: 여행 N일차 / 끝난 뒤: 여행 완료 */
export function getTripStatus(today: string, start: string, end: string): TripStatus {
  const untilStart = diffDays(today, start);
  if (untilStart > 0) return { kind: "before", label: `D-${untilStart}` };
  if (untilStart === 0) return { kind: "dday", label: "D-DAY" };
  if (diffDays(today, end) >= 0) {
    return { kind: "during", label: `여행 ${-untilStart + 1}일차` };
  }
  return { kind: "after", label: "여행 완료" };
}

/** 여행 기간(시작일~종료일) 안에 있는지 */
export function isWithinTrip(today: string, start: string, end: string): boolean {
  return diffDays(start, today) >= 0 && diffDays(today, end) >= 0;
}
