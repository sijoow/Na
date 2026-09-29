// 일정의 '고르는 칸' — 마사지 가게·식당·관광 코스 후보를 탭으로 비교하고, 고르면 그 시간대 일정을
// 미리 짜 둔 일정으로 통째로 바꾼다. (파워J: 즉석으로 고치는 게 아니라, 정해 둔 선택지 중에서 고르기)
// 후보 데이터는 lib/spaSlots(마사지), lib/mealSlots(식당), lib/tourSlots(관광 코스)에 있다.

import { MEAL_SLOTS } from "./mealSlots";
import type { PlaceKind } from "./placeMatch";
import { SPA_SLOTS } from "./spaSlots";
import { TOUR_SLOTS } from "./tourSlots";
import type { Category, PlanItem, TripState } from "./types";

export interface SlotItem {
  time: string;
  title: string;
  category: Category;
  memo: string;
}

export interface ChoiceOption {
  /** 칸 안에서 겹치지 않는 id (가게 id) */
  id: string;
  /** 탭에 보일 이름 */
  tab: string;
  /** 펼쳤을 때 보여 줄 가게 카드 (맛집·마사지·배달 탭의 카드) — 앱 자료에 없는 곳은 비워 두고 요약만 보여 준다 */
  card?: { kind: PlaceKind; id: string };
  /** 이 칸에서 우리 일정 요약 */
  when: string;
  /** 예상 총액 */
  total: string;
  /** 카톡에 그대로 보낼 예약 문구 */
  message?: string;
  /** 고르면 from~to 시간대에 들어갈 일정 */
  items: SlotItem[];
  /** 대표 일정 위치 (items 안 번호) — 없으면 이동이 아닌 첫 일정 */
  mainIndex?: number;
}

export interface ChoiceSlot {
  date: string;
  /** 이 시간대(포함)의 일정을 고른 후보의 일정으로 바꾼다 */
  from: string;
  to: string;
  /** 버튼 문구에 쓰는 이름 ('식당', '마사지 가게', '코스') */
  noun: string;
  /** 후보 개수 단위 (기본 '곳') */
  unit?: string;
  options: ChoiceOption[];
}

export const CHOICE_SLOTS: ChoiceSlot[] = [...SPA_SLOTS, ...MEAL_SLOTS, ...TOUR_SLOTS];

/** 후보의 대표 일정 (정해 두지 않으면 이동이 아닌 첫 일정 — 식사·마사지) — 탭은 이 일정에 붙는다 */
export const mainItem = (o: ChoiceOption) =>
  (o.mainIndex !== undefined ? o.items[o.mainIndex] : undefined) ?? o.items.find((i) => i.category !== "move") ?? o.items[0];

/** 이 일정이 어느 칸의 대표 일정인지, 지금 어느 후보가 들어가 있는지 */
export function choiceForItem(date: string, item: PlanItem): { slot: ChoiceSlot; currentId: string } | null {
  for (const slot of CHOICE_SLOTS) {
    if (slot.date !== date || item.time < slot.from || item.time > slot.to) continue;
    const current = slot.options.find((o) => mainItem(o).title === item.title);
    if (current) return { slot, currentId: current.id };
  }
  return null;
}

/** 칸을 고른 후보의 일정으로 바꾼다 (from~to 시간대 일정을 통째로 교체) */
export function applyChoice(state: TripState, slot: ChoiceSlot, option: ChoiceOption): TripState {
  const inSlot = (time: string) => time >= slot.from && time <= slot.to;
  return {
    ...state,
    days: state.days.map((day) => {
      if (day.date !== slot.date) return day;
      const at = day.items.findIndex((i) => inSlot(i.time));
      const kept = day.items.filter((i) => !inSlot(i.time));
      const added = option.items.map((it, n) => ({ ...it, id: `${day.id}-${slot.from.replace(":", "")}-${option.id}-${n + 1}`, done: false }));
      const pos = at < 0 ? kept.findIndex((i) => i.time > slot.to) : at;
      const cut = pos < 0 ? kept.length : pos;
      return { ...day, items: [...kept.slice(0, cut), ...added, ...kept.slice(cut)] };
    }),
  };
}
