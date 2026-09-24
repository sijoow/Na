// 서버 전용: 일정 저장소(로컬 파일 / MongoDB)가 함께 쓰는 타입과 도우미.

import { createHash } from "node:crypto";
import type { TripPayload, TripState } from "./types";
import { serializeTrip } from "./validate";

/** 저장된 데이터가 깨져 있는 등, 메시지를 그대로 사용자에게 보여줘도 되는 저장소 오류 */
export class TripDataError extends Error {}

export type SaveResult =
  | { ok: true; payload: TripPayload }
  | { ok: false; conflict: TripPayload };

export interface TripStore {
  readonly kind: "file" | "mongodb";
  /** 현재 일정. 저장된 게 없으면 초안(seed)으로 만든다. */
  load(): Promise<TripPayload>;
  /** baseVersion 이 현재 버전과 다르면 저장하지 않고 현재 내용을 돌려준다 (→ 409). */
  save(state: TripState, baseVersion: string): Promise<SaveResult>;
}

/** 버전 = 저장 형식 문자열의 sha1 (파일/DB 모드 공통 규칙) */
export function versionOf(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}

export function versionOfState(state: TripState): string {
  return versionOf(serializeTrip(state));
}
