export type Category =
  | "sightseeing"
  | "food"
  | "activity"
  | "rest"
  | "move"
  | "shopping"
  | "etc";

export interface PlanItem {
  id: string;
  /** 'HH:MM' 또는 '' (시간 미정) */
  time: string;
  title: string;
  memo: string;
  category: Category;
  done: boolean;
}

export interface Day {
  id: string;
  /** 'YYYY-MM-DD' (로컬 날짜) */
  date: string;
  title: string;
  lodging: string;
  items: PlanItem[];
}

export type FlightDirection = "출국" | "귀국";

export interface Flight {
  id: string;
  direction: FlightDirection;
  airline: string;
  flightNo: string;
  /** 'YYYY-MM-DD' 또는 '' */
  departDate: string;
  /** 'HH:MM' 또는 '' */
  departTime: string;
  from: string;
  /** 'YYYY-MM-DD' 또는 '' */
  arriveDate: string;
  /** 'HH:MM' 또는 '' */
  arriveTime: string;
  to: string;
  memo: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  group: string;
  checked: boolean;
}

/** 숙소 비교 탭에서 고른 숙소 id (guide.ts 의 StayOption.id) */
export interface StayChoices {
  /** 도착 첫날 0.5박 (예전 파일에는 없을 수 있음) */
  arrival?: string | null;
  city: string | null;
  /** 시내 대신 빈원더스 섬 리조트 (예전 파일에는 없을 수 있음) */
  island?: string | null;
  resort: string | null;
}

export interface TripState {
  version: 1;
  tripTitle: string;
  travelers: string;
  startDate: string;
  endDate: string;
  flights: Flight[];
  days: Day[];
  checklist: ChecklistItem[];
  notes: string;
  /** 예전 파일에는 없을 수 있음 */
  stayChoices?: StayChoices;
  /** 기념품 쇼핑리스트에서 산 항목 (상품명) — 예전 파일에는 없을 수 있음 */
  boughtSouvenirs?: string[];
}

/** 일정 항목 추가/수정 폼에서 다루는 값 */
export type PlanItemInput = Pick<PlanItem, "time" | "title" | "memo" | "category">;

/** 정보 탭에서 수정 가능한 항공편 필드 */
export type FlightPatch = Partial<Omit<Flight, "id" | "direction">>;

/** GET/PUT /api/trip 응답 */
export interface TripPayload {
  state: TripState;
  version: string;
}
