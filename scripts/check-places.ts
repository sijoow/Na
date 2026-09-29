// 일정 항목마다 어느 장소에 연결되고, 어떤 버튼(🧭 길찾기 / ℹ️ 정보)이 붙는지 확인한다. `npx tsx scripts/check-places.ts`
import { readFileSync } from "node:fs";
import { findPlace, linkDayPlaces } from "../src/lib/placeMatch";
import { parseTripJson } from "../src/lib/validate";

const result = parseTripJson(readFileSync("data/trip.json", "utf8"));
if (!result.ok) {
  console.error("검증 실패:", result.error);
  process.exit(1);
}
for (const day of result.state.days) {
  console.log(`\n== ${day.date} ${day.title}`);
  const links = linkDayPlaces(day.items);
  for (const item of day.items) {
    const link = links.get(item.id);
    const marks = `${link?.route ? "🧭" : "  "}${link?.info ? "ℹ️" : "  "}`;
    const place = findPlace(item);
    console.log(`${item.time} ${marks} ${item.title}  ⇒  ${place ? `${place.kind}:${place.name}` : "—"}`);
  }
}
