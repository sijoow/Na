// 서버 전용: MONGODB_URI 가 있을 때 쓰는 MongoDB 저장소.
// 문서 하나 = 여행 하나: trips 컬렉션의 { _id: TRIP_ID, state, version, updatedAt }
// - version 은 파일 모드와 같은 규칙 (serializeTrip(state) 의 sha1)
// - 저장은 낙관적 동시성: { _id, version: baseVersion } 인 문서만 바꾸고, 못 바꾸면 409용 현재 내용을 돌려준다
// (scripts/push-trip-to-mongo.ts 도 이 파일을 쓰므로 'server-only' 는 넣지 않는다)

import dns from "node:dns";
import { MongoClient, MongoServerError, type Collection, type Filter } from "mongodb";
import { createSeedState } from "./seed";
import {
  TripDataError,
  versionOf,
  versionOfState,
  type SaveResult,
  type TripStore,
} from "./tripStoreCommon";
import type { TripPayload, TripState } from "./types";
import { serializeTrip, validateTripState } from "./validate";

export const DEFAULT_DB_NAME = "nhatrang_planner";
export const DEFAULT_TRIP_ID = "nhatrang-2026";
export const TRIPS_COLLECTION = "trips";

export interface MongoTripConfig {
  uri: string;
  dbName: string;
  tripId: string;
}

export interface TripDoc {
  _id: string;
  state: TripState;
  version: string;
  updatedAt: Date;
}

/** MONGODB_URI 가 없거나 비어 있으면 null (→ 로컬 파일 모드) */
export function mongoConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MongoTripConfig | null {
  const uri = env.MONGODB_URI?.trim();
  if (!uri) return null;
  return {
    uri,
    dbName: env.MONGODB_DB?.trim() || DEFAULT_DB_NAME,
    tripId: env.TRIP_ID?.trim() || DEFAULT_TRIP_ID,
  };
}

/** 로그에 찍을 때 연결 문자열의 비밀번호를 가린다 */
export function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/([^:/@]+):([^@]*)@/, "//$1:****@");
}

// ── DNS 안전장치 ───────────────────────────────────────────────────
// mongodb+srv:// 주소는 연결 전에 DNS 로 SRV/TXT 레코드를 조회한다.
// 일부 PC 는 로컬 DNS(예: 127.0.0.1)가 SRV 조회를 거절해서 "querySrv ECONNREFUSED" 로 실패한다.
// 그럴 때는 공용 DNS(또는 MONGODB_DNS_SERVERS)로 바꿔서 한 번만 다시 시도한다.

const FALLBACK_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];
const DNS_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEOUT",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ESERVFAIL",
  "EREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
]);

/** MONGODB_DNS_SERVERS="8.8.8.8,1.1.1.1" → ["8.8.8.8", "1.1.1.1"] (없으면 null) */
export function dnsServersFromEnv(env: NodeJS.ProcessEnv = process.env): string[] | null {
  const servers = (env.MONGODB_DNS_SERVERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return servers.length > 0 ? servers : null;
}

/** SRV/TXT DNS 조회 단계에서 난 실패인지 (드라이버가 감싼 오류의 cause 도 확인) */
export function isSrvDnsError(error: unknown, depth = 0): boolean {
  if (typeof error !== "object" || error === null || depth > 3) return false;
  const e = error as { code?: unknown; syscall?: unknown; message?: unknown; cause?: unknown };
  const syscall = typeof e.syscall === "string" ? e.syscall : "";
  const message = typeof e.message === "string" ? e.message : "";
  const code = typeof e.code === "string" ? e.code : "";
  const duringSrvLookup = /^query(Srv|Txt)$/.test(syscall) || /\bquery(Srv|Txt)\b/.test(message);
  if (duringSrvLookup && (DNS_ERROR_CODES.has(code) || [...DNS_ERROR_CODES].some((c) => message.includes(c)))) {
    return true;
  }
  return isSrvDnsError(e.cause, depth + 1);
}

function sameServers(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i]);
}

/** 연결 문자열은 절대 로그에 남기지 않는다 */
function applyDnsServers(servers: string[], reason: string): void {
  if (sameServers(dns.getServers(), servers)) return;
  console.warn(`[mongodb] ${reason} → DNS 서버를 ${servers.join(", ")} 로 바꿔요.`);
  dns.setServers(servers);
}

function newClient(uri: string): MongoClient {
  return new MongoClient(uri, {
    appName: "nhatrang-planner",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    ignoreUndefined: true,
  });
}

async function connectWithDnsFallback(uri: string): Promise<MongoClient> {
  const isSrv = uri.startsWith("mongodb+srv://");
  const custom = dnsServersFromEnv();
  if (isSrv && custom) applyDnsServers(custom, "MONGODB_DNS_SERVERS 설정");

  const first = newClient(uri);
  try {
    return await first.connect();
  } catch (error) {
    await first.close().catch(() => undefined);
    const servers = custom ?? FALLBACK_DNS_SERVERS;
    if (!isSrv || !isSrvDnsError(error) || sameServers(dns.getServers(), servers)) throw error;
    const code = (error as { code?: unknown }).code;
    applyDnsServers(servers, `SRV DNS 조회 실패(${typeof code === "string" ? code : "DNS"})`);
  }

  const second = newClient(uri);
  try {
    return await second.connect();
  } catch (error) {
    await second.close().catch(() => undefined);
    throw error;
  }
}

// ── 연결: 전역 캐시 ────────────────────────────────────────────────
// 개발 서버의 HMR(모듈 재실행)이나 서버리스의 따뜻한 인스턴스에서 연결을 새로 만들지 않고 재사용한다.

interface ClientEntry {
  uri: string;
  ready: Promise<MongoClient>;
}

const CACHE_KEY = Symbol.for("nhatrang-planner.mongo-client");
type GlobalWithCache = typeof globalThis & { [CACHE_KEY]?: { current?: ClientEntry } };

function cacheSlot(): { current?: ClientEntry } {
  const g = globalThis as GlobalWithCache;
  g[CACHE_KEY] ??= {};
  return g[CACHE_KEY];
}

function closeEntry(entry: ClientEntry): Promise<void> {
  return entry.ready.then(
    (client) => client.close(),
    () => undefined, // 연결에 실패한 클라이언트는 이미 닫았다
  );
}

export function getMongoClient(uri: string): Promise<MongoClient> {
  const slot = cacheSlot();
  if (slot.current?.uri === uri) return slot.current.ready;
  if (slot.current) void closeEntry(slot.current).catch(() => undefined);

  const entry: ClientEntry = { uri, ready: connectWithDnsFallback(uri) };
  // 연결에 실패하면 캐시를 비워서 다음 요청 때 다시 시도한다
  entry.ready.catch(() => {
    if (slot.current === entry) slot.current = undefined;
  });
  slot.current = entry;
  return entry.ready;
}

/** 스크립트·테스트용: 캐시된 연결을 닫는다 */
export async function closeMongoClient(): Promise<void> {
  const slot = cacheSlot();
  const entry = slot.current;
  slot.current = undefined;
  if (entry) await closeEntry(entry);
}

export async function getTripCollection(config: MongoTripConfig): Promise<Collection<TripDoc>> {
  const client = await getMongoClient(config.uri);
  return client.db(config.dbName).collection<TripDoc>(TRIPS_COLLECTION);
}

// ── 저장소 ─────────────────────────────────────────────────────────

/** 저장 형식으로 한 번 정규화해서, DB에 들어가는 내용과 버전 계산 대상이 정확히 같게 한다 */
function normalize(state: TripState): { state: TripState; version: string } {
  const text = serializeTrip(state);
  return { state: JSON.parse(text) as TripState, version: versionOf(text) };
}

function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}

export interface MongoTripStoreOptions {
  /** 초안 문서를 만들기 직전에 호출. 오류를 던지면 만들지 않는다 (예: 개발 중 로컬 파일이 있을 때) */
  beforeSeed?: () => Promise<void>;
}

export function createMongoTripStore(
  config: MongoTripConfig,
  options: MongoTripStoreOptions = {},
): TripStore {
  const byId: Filter<TripDoc> = { _id: config.tripId };
  const where = `${config.dbName}.${TRIPS_COLLECTION} / _id "${config.tripId}"`;

  /** 문서가 없을 때 초안으로 만든다. 여러 요청이 동시에 만들려 해도 한 번만 들어간다. */
  async function insertSeed(col: Collection<TripDoc>): Promise<TripDoc> {
    await options.beforeSeed?.();
    const seed = normalize(createSeedState());
    const doc: TripDoc = {
      _id: config.tripId,
      state: seed.state,
      version: seed.version,
      updatedAt: new Date(),
    };
    try {
      await col.insertOne(doc);
      return doc;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
    // 다른 요청이 먼저 만들었다 → 그 문서를 쓴다
    const existing = await col.findOne(byId);
    if (!existing) throw new Error(`초안 문서를 만들지 못했어요 (${where})`);
    return existing;
  }

  /** 저장된 내용을 검증한다. 깨져 있으면 덮어쓰지 않고 오류(→ 500)를 낸다. */
  async function toPayload(col: Collection<TripDoc>, doc: TripDoc): Promise<TripPayload> {
    const problem = validateTripState(doc.state);
    if (problem) {
      throw new TripDataError(`DB에 저장된 일정 데이터에 문제가 있어요 (${where}): ${problem}`);
    }
    const actual = versionOfState(doc.state);
    if (doc.version !== actual) {
      // Atlas 화면 등에서 state 만 직접 고친 경우: 내용은 그대로 두고 버전만 내용에 맞춘다
      // (파일 모드에서 파일을 손으로 고쳐도 화면이 새 내용을 불러오는 것과 같은 동작)
      await col.updateOne(
        { _id: doc._id, version: doc.version },
        { $set: { version: actual, updatedAt: new Date() } },
      );
    }
    return { state: doc.state, version: actual };
  }

  async function load(): Promise<TripPayload> {
    const col = await getTripCollection(config);
    const doc = (await col.findOne(byId)) ?? (await insertSeed(col));
    return toPayload(col, doc);
  }

  async function save(state: TripState, baseVersion: string): Promise<SaveResult> {
    const next = normalize(state);
    const col = await getTripCollection(config);
    const updated = await col.findOneAndUpdate(
      { _id: config.tripId, version: baseVersion },
      { $set: { state: next.state, version: next.version, updatedAt: new Date() } },
      { returnDocument: "after", projection: { _id: 1 } },
    );
    if (updated) return { ok: true, payload: { state: next.state, version: next.version } };
    // 버전이 달라 저장하지 않았다 (다른 기기가 먼저 저장했거나 문서가 없음) → 현재 내용을 돌려준다
    return { ok: false, conflict: await load() };
  }

  return { kind: "mongodb", load, save };
}

// ── 로컬 → DB 이전 (scripts/push-trip-to-mongo.ts) ──────────────────

export type PushResult =
  | { status: "created" | "replaced" | "unchanged"; version: string }
  | { status: "exists"; version: string; existingVersion: string; existingUpdatedAt: Date | null };

/** state 를 DB 문서로 올린다. 이미 문서가 있으면 force 없이는 덮어쓰지 않는다. */
export async function pushTripToMongo(
  config: MongoTripConfig,
  state: TripState,
  options: { force?: boolean } = {},
): Promise<PushResult> {
  const problem = validateTripState(state);
  if (problem) throw new TripDataError(problem);

  const next = normalize(state);
  const col = await getTripCollection(config);
  const doc: TripDoc = {
    _id: config.tripId,
    state: next.state,
    version: next.version,
    updatedAt: new Date(),
  };

  const existing = await col.findOne(
    { _id: config.tripId },
    { projection: { state: 1, version: 1, updatedAt: 1 } },
  );
  if (existing && versionOfState(existing.state) === next.version) {
    return { status: "unchanged", version: next.version };
  }
  if (existing && !options.force) {
    return {
      status: "exists",
      version: next.version,
      existingVersion: String(existing.version),
      existingUpdatedAt: existing.updatedAt instanceof Date ? existing.updatedAt : null,
    };
  }
  if (!existing) {
    try {
      await col.insertOne(doc);
      return { status: "created", version: next.version };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      if (!options.force) {
        const now = await col.findOne({ _id: config.tripId });
        return {
          status: "exists",
          version: next.version,
          existingVersion: String(now?.version),
          existingUpdatedAt: now?.updatedAt instanceof Date ? now.updatedAt : null,
        };
      }
    }
  }
  await col.replaceOne({ _id: config.tripId }, doc, { upsert: true });
  return { status: "replaced", version: next.version };
}
