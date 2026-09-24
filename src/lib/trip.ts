// 상태 변경은 모두 여기의 순수 함수로 처리한다.
// 각 함수는 기존 state를 변경하지 않고 새 state를 반환한다.
// 대상이 없거나 바뀔 게 없으면 원래 state를 그대로 반환한다 (→ 저장 요청도 생기지 않음).

import type { StayArea } from "./guideTypes";
import type {
  ChecklistItem,
  Day,
  FlightPatch,
  PlanItem,
  PlanItemInput,
  TripState,
} from "./types";

// ---------- 내부 헬퍼 ----------

function mapDay(state: TripState, dayId: string, fn: (day: Day) => Day): TripState {
  let changed = false;
  const days = state.days.map((day) => {
    if (day.id !== dayId) return day;
    const next = fn(day);
    if (next !== day) changed = true;
    return next;
  });
  return changed ? { ...state, days } : state;
}

function moveInArray<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function shallowPatchChanges<T extends object>(obj: T, patch: Partial<T>): boolean {
  return (Object.keys(patch) as (keyof T)[]).some(
    (key) => patch[key] !== undefined && patch[key] !== obj[key],
  );
}

// ---------- 여행 기본 정보 ----------

export function updateTripInfo(
  state: TripState,
  patch: Partial<Pick<TripState, "tripTitle" | "travelers">>,
): TripState {
  return shallowPatchChanges(state, patch) ? { ...state, ...patch } : state;
}

// ---------- 날짜(Day) ----------

export function updateDay(
  state: TripState,
  dayId: string,
  patch: Partial<Pick<Day, "title" | "lodging">>,
): TripState {
  return mapDay(state, dayId, (day) =>
    shallowPatchChanges(day, patch) ? { ...day, ...patch } : day,
  );
}

/**
 * 두 날의 '제목 + 일정'을 서로 바꾼다.
 * 날짜(date)와 숙소(lodging)는 그 날에 묶여 있으므로 그대로 둔다.
 */
export function swapDays(state: TripState, dayIdA: string, dayIdB: string): TripState {
  if (dayIdA === dayIdB) return state;
  const a = state.days.find((d) => d.id === dayIdA);
  const b = state.days.find((d) => d.id === dayIdB);
  if (!a || !b) return state;
  const days = state.days.map((day) => {
    if (day.id === a.id) return { ...day, title: b.title, items: b.items };
    if (day.id === b.id) return { ...day, title: a.title, items: a.items };
    return day;
  });
  return { ...state, days };
}

// ---------- 일정 항목(PlanItem) ----------

export function createPlanItem(id: string, input: PlanItemInput): PlanItem {
  return {
    id,
    time: input.time,
    title: input.title.trim(),
    memo: input.memo.trim(),
    category: input.category,
    done: false,
  };
}

export function addItem(state: TripState, dayId: string, item: PlanItem): TripState {
  return mapDay(state, dayId, (day) => ({ ...day, items: [...day.items, item] }));
}

export function updateItem(
  state: TripState,
  dayId: string,
  itemId: string,
  patch: Partial<Omit<PlanItem, "id">>,
): TripState {
  return mapDay(state, dayId, (day) => {
    const target = day.items.find((i) => i.id === itemId);
    if (!target || !shallowPatchChanges(target, patch)) return day;
    return {
      ...day,
      items: day.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    };
  });
}

export function toggleItemDone(state: TripState, dayId: string, itemId: string): TripState {
  const item = state.days.find((d) => d.id === dayId)?.items.find((i) => i.id === itemId);
  if (!item) return state;
  return updateItem(state, dayId, itemId, { done: !item.done });
}

export function deleteItem(state: TripState, dayId: string, itemId: string): TripState {
  return mapDay(state, dayId, (day) => {
    if (!day.items.some((i) => i.id === itemId)) return day;
    return { ...day, items: day.items.filter((i) => i.id !== itemId) };
  });
}

/** 같은 날 안에서 한 칸 위(-1) / 아래(+1)로 이동 */
export function reorderItem(
  state: TripState,
  dayId: string,
  itemId: string,
  direction: -1 | 1,
): TripState {
  return mapDay(state, dayId, (day) => {
    const from = day.items.findIndex((i) => i.id === itemId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= day.items.length) return day;
    return { ...day, items: moveInArray(day.items, from, to) };
  });
}

/** 시간 오름차순 정렬. 시간이 비어 있는 항목은 맨 뒤 (같은 조건끼리는 기존 순서 유지). */
export function sortItemsByTime(items: readonly PlanItem[]): PlanItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ta = a.item.time;
      const tb = b.item.time;
      if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
      if (!ta && tb) return 1;
      if (ta && !tb) return -1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export function sortDayByTime(state: TripState, dayId: string): TripState {
  return mapDay(state, dayId, (day) => {
    const sorted = sortItemsByTime(day.items);
    const unchanged = sorted.every((item, i) => item === day.items[i]);
    return unchanged ? day : { ...day, items: sorted };
  });
}

/** 다른 날로 옮긴다 (대상 날의 맨 뒤에 추가). */
export function moveItemToDay(
  state: TripState,
  fromDayId: string,
  itemId: string,
  toDayId: string,
): TripState {
  if (fromDayId === toDayId) return state;
  const from = state.days.find((d) => d.id === fromDayId);
  const item = from?.items.find((i) => i.id === itemId);
  if (!item || !state.days.some((d) => d.id === toDayId)) return state;
  const removed = deleteItem(state, fromDayId, itemId);
  return addItem(removed, toDayId, item);
}

// ---------- 항공편 ----------

export function updateFlight(state: TripState, flightId: string, patch: FlightPatch): TripState {
  const target = state.flights.find((f) => f.id === flightId);
  if (!target || !shallowPatchChanges(target, patch)) return state;
  return {
    ...state,
    flights: state.flights.map((f) => (f.id === flightId ? { ...f, ...patch } : f)),
  };
}

// ---------- 준비물(Checklist) ----------

export function addChecklistItem(state: TripState, item: ChecklistItem): TripState {
  return { ...state, checklist: [...state.checklist, item] };
}

export function toggleChecklistItem(state: TripState, id: string): TripState {
  if (!state.checklist.some((c) => c.id === id)) return state;
  return {
    ...state,
    checklist: state.checklist.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
  };
}

export function deleteChecklistItem(state: TripState, id: string): TripState {
  if (!state.checklist.some((c) => c.id === id)) return state;
  return { ...state, checklist: state.checklist.filter((c) => c.id !== id) };
}

// ---------- 숙소 선택 ----------

/**
 * 숙소 비교 탭에서 고른 숙소를 기록하고, 해당 숙박 날짜들의 '숙소' 칸도 그 이름으로 바꾼다.
 * stayId가 null이면 선택을 취소하고 숙소 칸을 기본 이름(fallbackLabel)으로 되돌린다.
 */
export function chooseStay(
  state: TripState,
  area: StayArea,
  stayId: string | null,
  lodgingLabel: string,
  nightDates: readonly string[],
): TripState {
  const prev = state.stayChoices ?? { arrival: null, city: null, resort: null };
  const nights = new Set(nightDates);
  return {
    ...state,
    stayChoices: { ...prev, [area]: stayId },
    days: state.days.map((day) =>
      nights.has(day.date) && day.lodging !== lodgingLabel ? { ...day, lodging: lodgingLabel } : day,
    ),
  };
}

// ---------- 기념품 쇼핑리스트 ----------

export function toggleSouvenir(state: TripState, name: string): TripState {
  const bought = state.boughtSouvenirs ?? [];
  return {
    ...state,
    boughtSouvenirs: bought.includes(name) ? bought.filter((n) => n !== name) : [...bought, name],
  };
}

// ---------- 메모 ----------

export function setNotes(state: TripState, notes: string): TripState {
  return notes === state.notes ? state : { ...state, notes };
}

// ---------- 조회용 헬퍼 ----------

export interface Progress {
  done: number;
  total: number;
}

export function getItemProgress(state: TripState): Progress {
  let done = 0;
  let total = 0;
  for (const day of state.days) {
    for (const item of day.items) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { done, total };
}

export function getDayProgress(day: Day): Progress {
  return { done: day.items.filter((i) => i.done).length, total: day.items.length };
}

export function percent({ done, total }: Progress): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export interface ChecklistGroup {
  group: string;
  items: ChecklistItem[];
  checked: number;
}

/** 그룹이 처음 등장한 순서대로 묶는다. */
export function groupChecklist(items: readonly ChecklistItem[]): ChecklistGroup[] {
  const map = new Map<string, ChecklistGroup>();
  for (const item of items) {
    let g = map.get(item.group);
    if (!g) {
      g = { group: item.group, items: [], checked: 0 };
      map.set(item.group, g);
    }
    g.items.push(item);
    if (item.checked) g.checked += 1;
  }
  return [...map.values()];
}
