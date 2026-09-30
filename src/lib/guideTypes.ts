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
  | "pier"
  | "spa";

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
  /** 1순위 업체 예약 방법 — 순서대로 */
  howTo?: string[];
  /** 신청서·카톡에 그대로 붙여 넣을 문구 */
  messages?: CopyText[];
  /** 투어에 같이 묶어서 갈 수 있는 곳 */
  addOns?: AddOn[];
}

export interface CopyText {
  label: string;
  text: string;
}

export interface AddOn {
  name: string;
  localName: string;
  what: string;
  fee: string;
  /** 넣으면 늘어나는 시간 */
  extra: string;
  kid: string;
  source: string;
  /** 사진 (images.json desert 묶음의 키) */
  photo?: string;
}

export type ShopKind = "market" | "mall" | "brand-store" | "mart" | "night-market" | "street" | "fruit";

/** 카드 맨 위 '가격 한눈에' 한 줄 — 흥정 목표가 */
export interface QuickPrice {
  item: string;
  /** 흥정 목표가 (원화 병기) */
  target: string;
  /** 시세 (블로그 실구매가·부르는 값) */
  price: string;
  note: string;
}

/** 흥정할 때 쓰는 말 */
export interface Phrase {
  /** 한글로 적은 발음 */
  say: string;
  vi: string;
  /** 뜻 · 언제 쓰는지 */
  ko: string;
}

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
  /** 카드 맨 위 가격 요약 (담시장 아이 옷 등) */
  quickTitle?: string;
  quickPrices?: QuickPrice[];
  quickNote?: string;
  phrases?: Phrase[];
  phraseNote?: string;
  /** 주문·예약 방법 (배달 가게 등) — 순서대로 */
  howTo?: string[];
  /** 카톡에 그대로 보낼 주문 문구 */
  message?: string;
  /** 주문 문구가 날짜별로 여러 개일 때 (있으면 message 대신) */
  messages?: CopyText[];
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
