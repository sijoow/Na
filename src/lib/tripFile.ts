// 서버(Route Handler)에서만 사용한다. MONGODB_URI 가 없을 때 쓰는 로컬 파일 저장소.
// 일정 데이터의 원본은 프로젝트 폴더의 data/trip.json 파일이다.
// Claude가 대화 중에 이 파일을 직접 고칠 수 있으므로, 버전은 '파일 내용의 sha1'로 계산한다.
// (파일을 손으로 고쳐도 버전이 자동으로 바뀌어 화면이 새 내용을 불러온다)

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedState } from "./seed";
import { TripDataError, versionOf, type SaveResult, type TripStore } from "./tripStoreCommon";
import type { TripPayload, TripState } from "./types";
import { parseTripJson, serializeTrip } from "./validate";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "trip.json");
const TMP_FILE = `${DATA_FILE}.tmp`;

async function writeAtomic(text: string): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TMP_FILE, text, "utf8");
  await rename(TMP_FILE, DATA_FILE);
}

/** 파일이 없으면 초안으로 만든다. 파일이 깨져 있으면 덮어쓰지 않고 오류를 던진다. */
async function readOrCreate(): Promise<TripPayload> {
  let text: string;
  try {
    text = await readFile(DATA_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seedText = serializeTrip(createSeedState());
    await writeAtomic(seedText);
    return { state: JSON.parse(seedText) as TripState, version: versionOf(seedText) };
  }
  const parsed = parseTripJson(text);
  if (!parsed.ok) {
    throw new TripDataError(`data/trip.json 파일에 문제가 있어요: ${parsed.error}`);
  }
  return { state: parsed.state, version: versionOf(text) };
}

// 읽기/쓰기를 한 줄로 세워서 동시에 들어온 요청이 서로 섞이지 않게 한다.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export function loadTrip(): Promise<TripPayload> {
  return enqueue(readOrCreate);
}

/** baseVersion이 현재 파일 버전과 다르면 저장하지 않고 현재 내용을 돌려준다 (409). */
export function saveTrip(state: TripState, baseVersion: string): Promise<SaveResult> {
  return enqueue(async () => {
    const current = await readOrCreate();
    if (current.version !== baseVersion) return { ok: false, conflict: current };
    const text = serializeTrip(state);
    await writeAtomic(text);
    return { ok: true, payload: { state, version: versionOf(text) } };
  });
}

export const fileTripStore: TripStore = {
  kind: "file",
  load: loadTrip,
  save: saveTrip,
};
