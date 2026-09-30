// MongoDB 의 일정 문서를 로컬 data/trip.json 으로 받아온다 (db:push 의 반대).
// MONGODB_URI 가 있으면 앱은 DB 를 원본으로 쓰므로, 스크립트로 trip.json 을 고치기 전에 먼저 받아서
// 앱에서 체크한 항목 같은 최신 상태를 덮어쓰지 않게 한다.
//
//   npm run db:pull            # DB → data/trip.json (기존 파일은 data/trip.before-pull.json 으로 남김)

import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";
import { maskMongoUri, mongoConfigFromEnv, TRIPS_COLLECTION, type TripDoc } from "../src/lib/tripMongo";
import { parseTripJson, serializeTrip } from "../src/lib/validate";

const root = path.resolve(__dirname, "..");
const FILE = path.join(root, "data", "trip.json");

async function main(): Promise<number> {
  loadEnvConfig(root, true);
  const config = mongoConfigFromEnv();
  if (!config) {
    console.error("MONGODB_URI 가 없어요. 로컬 파일 모드라 받아올 게 없어요.");
    return 1;
  }
  console.log(`가져올 곳: ${maskMongoUri(config.uri).replace(/@.*$/, "@…")} → ${config.dbName}.${TRIPS_COLLECTION} (_id: "${config.tripId}")`);

  const client = new MongoClient(config.uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const doc = await client.db(config.dbName).collection<TripDoc>(TRIPS_COLLECTION).findOne({ _id: config.tripId });
    if (!doc) {
      console.error("DB 에 일정 문서가 없어요. 먼저 npm run db:push 로 올려 주세요.");
      return 1;
    }
    const text = serializeTrip(doc.state);
    const parsed = parseTripJson(text);
    if (!parsed.ok) {
      console.error(`DB 문서가 앱 검증을 통과하지 못해서 받지 않았어요: ${parsed.error}`);
      return 1;
    }
    await copyFile(FILE, path.join(root, "data", "trip.before-pull.json")).catch(() => undefined);
    await writeFile(FILE, text, "utf8");
    console.log(`완료: data/trip.json 에 받았어요. (DB version ${String(doc.version).slice(0, 8)}, ${doc.updatedAt?.toISOString?.() ?? ""})`);
    return 0;
  } finally {
    await client.close();
  }
}

main().then((code) => process.exit(code));
