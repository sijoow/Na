// 로컬 data/trip.json 을 MongoDB 문서로 올린다 (배포 전에 한 번).
//
//   npm run db:push                      # DB에 문서가 없을 때만 올림
//   npm run db:push -- --force           # DB에 있는 내용을 덮어씀
//   npm run db:push -- 다른파일.json      # data/trip.json 대신 다른 파일
//
// 연결 정보는 .env.local (또는 환경변수)의 MONGODB_URI / MONGODB_DB / TRIP_ID 를 쓴다.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import {
  closeMongoClient,
  maskMongoUri,
  mongoConfigFromEnv,
  pushTripToMongo,
  TRIPS_COLLECTION,
} from "../src/lib/tripMongo";
import { parseTripJson } from "../src/lib/validate";

const root = path.resolve(__dirname, "..");

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  const file = path.resolve(root, fileArg ?? "data/trip.json");

  loadEnvConfig(root, true);
  const config = mongoConfigFromEnv();
  if (!config) {
    console.error("MONGODB_URI 가 없어요. .env.local 에 MONGODB_URI=... 를 넣고 다시 실행해 주세요.");
    return 1;
  }

  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch {
    console.error(`파일을 읽지 못했어요: ${file}`);
    return 1;
  }
  const parsed = parseTripJson(text);
  if (!parsed.ok) {
    console.error(`${path.relative(root, file)} 에 문제가 있어서 올리지 않았어요: ${parsed.error}`);
    return 1;
  }

  const target = `${maskMongoUri(config.uri)} → ${config.dbName}.${TRIPS_COLLECTION} (_id: "${config.tripId}")`;
  console.log(`올릴 파일: ${path.relative(root, file)}`);
  console.log(`대상: ${target}`);

  const result = await pushTripToMongo(config, parsed.state, { force });
  switch (result.status) {
    case "created":
      console.log(`완료: 새 문서를 만들었어요. (version ${result.version.slice(0, 8)})`);
      return 0;
    case "replaced":
      console.log(`완료: 기존 문서를 덮어썼어요. (version ${result.version.slice(0, 8)})`);
      return 0;
    case "unchanged":
      console.log("DB에 이미 같은 내용이 있어요. 바꾼 것이 없어요.");
      return 0;
    case "exists": {
      const when = result.existingUpdatedAt ? result.existingUpdatedAt.toLocaleString("ko-KR") : "알 수 없음";
      console.error(
        `DB에 이미 다른 내용의 문서가 있어요 (마지막 저장: ${when}). 덮어쓰려면 --force 를 붙이세요:\n` +
          "  npm run db:push -- --force",
      );
      return 2;
    }
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error("DB에 올리지 못했어요:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeMongoClient());
