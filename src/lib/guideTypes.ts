// 여행 가이드(참고용) 데이터 타입 — 지도 장소, 이동 구간, Grab 팁, 블로그 후기, 숙소 후보.
// 조사 결과로 채우는 읽기 전용 데이터이며 src/data/guide.ts 에 있다.
// (사용자가 고른 숙소처럼 바뀌는 값은 TripState.stayChoices 에 저장한다)

export type PlaceKind =
  | "airport"
  | "lodging-area"
  | "sight"
  | "shopping"
  | "activity"
  | "food"
  | "pier";

export interface Place {
  id: string;
  name: string;
  localName: string;
  kind: PlaceKind;
  lat: number;
  lng: number;
  address: string;
  note: string;
  source: string;
}

export interface Leg {
  /** 'D1' ~ 'D8' */
  day: string;
  fromId: string;
  toId: string;
  distanceKm: number;
  durationMin: number;
  grabType: string;
  fareVndMin: number;
  fareVndMax: number;
  note: string;
  source: string;
}

export interface GrabTip {
  title: string;
  body: string;
  source: string;
}

export interface BlogPost {
  title: string;
  url: string;
  author: string;
  date: string;
  summary: string;
  withKids: boolean;
}

export interface BlogTopic {
  topic: string;
  /** 관련 장소 id (없으면 '') */
  placeId: string;
  summary: string;
  posts: BlogPost[];
}

export type StayArea = "arrival" | "city" | "island" | "resort";

export interface StayPriceRow {
  /** 예: '10/3~10/6 (토~화)', '10월 평일', '11~12월 우기' */
  period: string;
  /** 예: '약 18~22만 원' */
  perNight: string;
  note: string;
  source: string;
}

export interface StayOption {
  id: string;
  area: StayArea;
  name: string;
  localName: string;
  lat: number | null;
  lng: number | null;
  /** 예: '구글 4.6 (3,200) · 아고다 8.9' */
  rating: string;
  /** 우리 날짜 기준 1박 가격 (확인 못 하면 그렇다고 적음) */
  perNight: string;
  total: string;
  breakfast: string;
  /** 조식 상세 (4살 아이 기준 — 가장 중요한 비교 항목) */
  breakfastDetail: string;
  kids: string;
  location: string;
  lateCheckout: string;
  pros: string[];
  cons: string[];
  periodPrices: StayPriceRow[];
  links: { label: string; url: string }[];
  blogPosts: BlogPost[];
  verdict: string;
  /** 가격 조사·검증 상세 (길면 카드에서 접어서 보여줌) */
  priceDetail?: string;
  /** 추천 순위 (1이 최고, 없으면 null) */
  rank: number | null;
}

export interface Guide {
  updatedAt: string;
  exchangeRate: { krwPer1000Vnd: number; source: string; asOf: string };
  places: Place[];
  legs: Leg[];
  grabTips: GrabTip[];
  vinwondersAccess: string;
  blogTopics: BlogTopic[];
  stays: StayOption[];
  /** 가격 정보의 한계/주의 */
  staysNote: string;
  activities: ActivityInfo[];
  activitiesNote: string;
  shops: ShopInfo[];
  /** 아이 옷 쇼핑 요약 (어디서 뭘, 평균 예산) */
  shoppingSummary: string;
}

export interface PriceRow {
  item: string;
  price: string;
  note?: string;
  source: string;
}

export interface BookingOption {
  channel: string;
  price: string;
  how: string;
  url: string;
}

export interface ActivityInfo {
  id: string;
  name: string;
  placeId: string;
  /** 'D1'~'D8' 또는 '' */
  day: string;
  priceSummary: string;
  prices: PriceRow[];
  booking: BookingOption[];
  recommendation: string;
  kidTips: string;
  blogPosts: BlogPost[];
}

export type ShopKind = "market" | "mall" | "brand-store" | "mart" | "night-market" | "street";

export interface ShopInfo {
  id: string;
  name: string;
  localName: string;
  kind: ShopKind;
  lat: number | null;
  lng: number | null;
  address: string;
  hours: string;
  what: string;
  priceTable: PriceRow[];
  tips: string;
  nearDay: string;
  blogPosts: BlogPost[];
}

export interface MustTryDish {
  dish: string;
  desc: string;
  kidOk: string;
  price: string;
  where: string;
}

export interface FoodSpot {
  id: string;
  name: string;
  localName: string;
  kind: string;
  lat: number | null;
  lng: number | null;
  address: string;
  hours: string;
  menu: string;
  priceRange: string;
  kidFriendly: string;
  nearDay: string;
  tips: string;
  blogPosts: BlogPost[];
}

export interface FoodGuide {
  mustTry: MustTryDish[];
  spots: FoodSpot[];
  summary: string;
}

export interface SouvenirItem {
  name: string;
  group: string;
  where: string;
  price: string;
  qtyTip: string;
  note: string;
  source: string;
}

export interface SouvenirPlace {
  name: string;
  localName: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  tips: string;
  blogPosts: BlogPost[];
}

export interface SouvenirGuide {
  items: SouvenirItem[];
  places: SouvenirPlace[];
  customs: string;
  summary: string;
}
