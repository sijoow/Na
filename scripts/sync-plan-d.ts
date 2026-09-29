// data/trip.json 의 날짜별 일정을 확정 숙소(플랜 D) 초안으로 맞춘다.
// 이미 손으로 다듬은 날은 --keep 으로 건너뛴다. `npx tsx scripts/sync-plan-d.ts --keep 2026-10-04`
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { createPlanDays } from "../src/lib/seed";
import { parseTripJson, serializeTrip } from "../src/lib/validate";

const keep = new Set(
  process.argv.slice(2).flatMap((arg, i, all) => (all[i - 1] === "--keep" ? [arg] : [])),
);

const FILE = "data/trip.json";
const parsed = parseTripJson(readFileSync(FILE, "utf8"));
if (!parsed.ok) {
  console.error("검증 실패:", parsed.error);
  process.exit(1);
}
const state = parsed.state;
const planDays = createPlanDays("D");

for (const day of state.days) {
  if (keep.has(day.date)) {
    console.log(`건너뜀 ${day.date} · ${day.items.length}개 · ${day.title}`);
    continue;
  }
  const source = planDays.find((d) => d.date === day.date);
  if (!source) continue;
  day.title = source.title;
  day.lodging = source.lodging;
  // 항목 id 는 이 파일의 날짜 id 를 그대로 따른다 (d1-i1 …)
  day.items = source.items.map((item, i) => ({ ...item, id: `${day.id}-i${i + 1}` }));
  console.log(`맞춤   ${day.date} · ${day.items.length}개 · ${day.title}`);
}

writeFileSync(`${FILE}.tmp`, serializeTrip(state), "utf8");
renameSync(`${FILE}.tmp`, FILE);
