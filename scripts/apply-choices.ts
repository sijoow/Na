// data/trip.json 의 고르는 칸(마사지 가게·식당)을 후보 데이터(lib/choiceSlots)에 맞춰 정리한다.
// 칸마다 지금 들어간 후보를 찾아 그 후보의 일정으로 다시 쓰고, 없으면 첫 번째 후보(1순위)로 채운다.
// `npx tsx scripts/apply-choices.ts`
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { applyChoice, CHOICE_SLOTS, mainItem } from "../src/lib/choiceSlots";
import { parseTripJson, serializeTrip } from "../src/lib/validate";

const FILE = "data/trip.json";
const parsed = parseTripJson(readFileSync(FILE, "utf8"));
if (!parsed.ok) {
  console.error("검증 실패:", parsed.error);
  process.exit(1);
}
let state = parsed.state;

for (const slot of CHOICE_SLOTS) {
  const day = state.days.find((d) => d.date === slot.date);
  if (!day) continue;
  const inSlot = day.items.filter((i) => i.time >= slot.from && i.time <= slot.to);
  const current = slot.options.find((o) => inSlot.some((i) => i.title === mainItem(o).title));
  const option = current ?? slot.options[0];
  state = applyChoice(state, slot, option);
  console.log(`${slot.date} ${slot.from}~${slot.to} ${slot.noun}: ${option.tab}${current ? "" : " (1순위로 채움)"}`);
}

const text = serializeTrip(state);
writeFileSync(`${FILE}.tmp`, text, "utf8");
renameSync(`${FILE}.tmp`, FILE);
