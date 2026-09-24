// 서버(API)와 클라이언트(JSON 가져오기)가 함께 쓰는 검증기.
// 문제가 있으면 어디가 잘못됐는지 한국어로 알려준다 (data/trip.json 을 직접 고칠 때 도움).

import { isCategory } from "./categories";
import { isDateString, isTimeString } from "./date";
import type { TripState } from "./types";

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class ValidationError extends Error {}

function fail(path: string, expected: string): never {
  throw new ValidationError(`${path} 값이 올바르지 않아요 (${expected}).`);
}

function checkString(obj: Rec, key: string, path: string): void {
  if (typeof obj[key] !== "string") fail(`${path}.${key}`, "문자열이어야 해요");
}

function checkId(obj: Rec, path: string, seen: Set<string>): void {
  const id = obj.id;
  if (typeof id !== "string" || id.length === 0) fail(`${path}.id`, "비어 있지 않은 문자열");
  if (seen.has(id)) {
    throw new ValidationError(`${path}.id "${id}" 가 중복돼요. id는 서로 달라야 해요.`);
  }
  seen.add(id);
}

function checkTime(obj: Rec, key: string, path: string): void {
  const v = obj[key];
  if (!(v === "" || isTimeString(v))) fail(`${path}.${key}`, "'HH:MM' 형식 또는 빈 문자열");
}

function checkOptionalDate(obj: Rec, key: string, path: string): void {
  const v = obj[key];
  if (!(v === "" || isDateString(v))) fail(`${path}.${key}`, "'YYYY-MM-DD' 형식 또는 빈 문자열");
}

function checkArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "배열이어야 해요");
  return value;
}

function checkRecord(value: unknown, path: string): Rec {
  if (!isRecord(value)) fail(path, "객체여야 해요");
  return value;
}

function assertTripState(value: unknown): asserts value is TripState {
  const root = checkRecord(value, "최상위");
  if (root.version !== 1) fail("version", "숫자 1");
  for (const key of ["tripTitle", "travelers", "notes"]) checkString(root, key, "trip");
  if (!isDateString(root.startDate)) fail("startDate", "'YYYY-MM-DD' 형식");
  if (!isDateString(root.endDate)) fail("endDate", "'YYYY-MM-DD' 형식");

  const flightIds = new Set<string>();
  checkArray(root.flights, "flights").forEach((raw, i) => {
    const path = `flights[${i}]`;
    const f = checkRecord(raw, path);
    checkId(f, path, flightIds);
    if (f.direction !== "출국" && f.direction !== "귀국") fail(`${path}.direction`, "'출국' 또는 '귀국'");
    for (const key of ["airline", "flightNo", "from", "to", "memo"]) checkString(f, key, path);
    checkOptionalDate(f, "departDate", path);
    checkOptionalDate(f, "arriveDate", path);
    checkTime(f, "departTime", path);
    checkTime(f, "arriveTime", path);
  });

  const dayIds = new Set<string>();
  const itemIds = new Set<string>();
  const days = checkArray(root.days, "days");
  if (days.length === 0) fail("days", "하루 이상 있어야 해요");
  days.forEach((raw, i) => {
    const path = `days[${i}]`;
    const d = checkRecord(raw, path);
    checkId(d, path, dayIds);
    if (!isDateString(d.date)) fail(`${path}.date`, "'YYYY-MM-DD' 형식");
    checkString(d, "title", path);
    checkString(d, "lodging", path);
    checkArray(d.items, `${path}.items`).forEach((rawItem, j) => {
      const itemPath = `${path}.items[${j}]`;
      const item = checkRecord(rawItem, itemPath);
      checkId(item, itemPath, itemIds);
      checkTime(item, "time", itemPath);
      checkString(item, "title", itemPath);
      checkString(item, "memo", itemPath);
      if (!isCategory(item.category)) {
        fail(
          `${itemPath}.category`,
          "sightseeing / food / activity / rest / move / shopping / etc 중 하나",
        );
      }
      if (typeof item.done !== "boolean") fail(`${itemPath}.done`, "true 또는 false");
    });
  });

  if (root.stayChoices !== undefined) {
    const sc = checkRecord(root.stayChoices, "stayChoices");
    for (const key of ["arrival", "city", "island", "resort"]) {
      if ((key === "arrival" || key === "island") && sc[key] === undefined) continue;
      if (!(sc[key] === null || typeof sc[key] === "string")) {
        fail(`stayChoices.${key}`, "문자열 또는 null");
      }
    }
  }

  if (root.boughtSouvenirs !== undefined) {
    const list = checkArray(root.boughtSouvenirs, "boughtSouvenirs");
    list.forEach((v, i) => {
      if (typeof v !== "string") fail(`boughtSouvenirs[${i}]`, "문자열");
    });
  }

  const checklistIds = new Set<string>();
  checkArray(root.checklist, "checklist").forEach((raw, i) => {
    const path = `checklist[${i}]`;
    const c = checkRecord(raw, path);
    checkId(c, path, checklistIds);
    checkString(c, "text", path);
    checkString(c, "group", path);
    if (typeof c.checked !== "boolean") fail(`${path}.checked`, "true 또는 false");
  });
}

/** 문제가 없으면 null, 있으면 사용자에게 보여줄 한국어 메시지 */
export function validateTripState(value: unknown): string | null {
  try {
    assertTripState(value);
    return null;
  } catch (error) {
    if (error instanceof ValidationError) return error.message;
    throw error;
  }
}

export function isTripState(value: unknown): value is TripState {
  return validateTripState(value) === null;
}

export type ParseResult = { ok: true; state: TripState } | { ok: false; error: string };

/** JSON 문자열을 파싱·검증한다. 앞에 붙은 BOM은 무시한다. */
export function parseTripJson(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ""));
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : "";
    return { ok: false, error: `JSON 문법 오류가 있어요${detail}` };
  }
  const problem = validateTripState(parsed);
  if (problem) return { ok: false, error: problem };
  return { ok: true, state: parsed as TripState };
}

/** 저장 파일 형식: 2칸 들여쓰기 + 마지막 줄바꿈 */
export function serializeTrip(state: TripState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}
