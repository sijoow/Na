// data/trip.json 이 앱 검증을 통과하는지 확인한다. `npx tsx scripts/check-trip.ts`
import { readFileSync } from "node:fs";
import { parseTripJson } from "../src/lib/validate";

const result = parseTripJson(readFileSync("data/trip.json", "utf8"));
if (!result.ok) {
  console.error("검증 실패:", result.error);
  process.exit(1);
}
for (const day of result.state.days) {
  console.log(`${day.date} · ${day.items.length}개 · ${day.title}`);
}
