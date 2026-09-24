// 서버 전용: 어떤 저장소를 쓸지 고른다.
// - MONGODB_URI 가 있으면 MongoDB (배포용: Vercel + MongoDB Atlas)
// - 없으면 지금처럼 로컬 파일 data/trip.json
// 환경변수는 요청 시점에 읽으므로 빌드 뒤에 바꿔도(재시작/재배포 후) 반영된다.

import "server-only";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileTripStore } from "./tripFile";
import { createMongoTripStore, mongoConfigFromEnv } from "./tripMongo";
import { TripDataError, type SaveResult, type TripStore } from "./tripStoreCommon";
import type { TripPayload, TripState } from "./types";

export { TripDataError } from "./tripStoreCommon";
export type { SaveResult, TripStore } from "./tripStoreCommon";

const LOCAL_TRIP_FILE = path.join(process.cwd(), "data", "trip.json");

/**
 * 개발 중(next dev)에 DB 문서가 비어 있는데 로컬 data/trip.json 이 있으면,
 * DB 를 초안으로 채우지 않고 먼저 옮기라고 알려준다. (화면에 초안이 떠서 '일정이 사라졌다'고 착각하지 않게)
 * 배포(production)에서는 지금처럼 초안으로 만든다.
 */
async function guardLocalDataBeforeSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    await access(LOCAL_TRIP_FILE);
  } catch {
    return; // 로컬 파일이 없으면 초안으로 시작해도 된다
  }
  throw new TripDataError(
    "MongoDB 에 아직 일정 문서가 없어요. 로컬 data/trip.json 을 먼저 DB 로 옮겨 주세요: npm run db:push",
  );
}

let cached: { key: string; store: TripStore } | undefined;

export function getTripStore(): TripStore {
  const config = mongoConfigFromEnv();
  if (!config) return fileTripStore;
  const key = `${config.uri}\n${config.dbName}\n${config.tripId}`;
  if (cached?.key !== key) {
    cached = { key, store: createMongoTripStore(config, { beforeSeed: guardLocalDataBeforeSeed }) };
  }
  return cached.store;
}

export function loadTrip(): Promise<TripPayload> {
  return getTripStore().load();
}

export function saveTrip(state: TripState, baseVersion: string): Promise<SaveResult> {
  return getTripStore().save(state, baseVersion);
}
