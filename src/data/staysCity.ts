import type { StayOption } from "@/lib/guideTypes";

// 나트랑 시내 2박 (10/4~10/6) — 2026-09-24 조사. 실시간 가격은 예약 사이트 차단으로 확인 불가 → 날짜·출처가 붙은 최근 참고가.
// 거리: 담시장 / 빈원더스 케이블카역 / 아이리조트(머드) / 야시장

const NO_LIVE = "실시간 확인 불가 · 참고가";

export const CITY_STAYS: StayOption[] = [
  {
    id: "intercontinental-nha-trang",
    area: "city",
    name: "인터컨티넨탈 나트랑",
    localName: "InterContinental Nha Trang (32-34 Tran Phu)",
    lat: null,
    lng: null,
    rating: "트립닷컴 9.2 (538) · 트립어드바이저 4점대 (1,545)",
    perNight: "조식 포함 약 20~30만원 (추정)",
    total: "약 40~60만원 (추정)",
    breakfast: "4살 무료 (5세 이하)",
    breakfastDetail:
      "1층 Cookbook Café 06:00~10:30. 베이커리, 계란요리·쌀국수 즉석 코너(자리로 가져다줌), 반미·반쎄오·스프링롤, 과일·디저트.\n한식 코너 별도(잡채·갈비찜 등 5가지, 라면·김치볶음밥 후기). 바다 보이는 창, 아이 있으면 '패밀리존' 추천.\n👍 '조식 중요하면 나트랑에선 여기 선택해도 후회 없음' / 👎 '한식 주문코너가 사라졌고 엄청나진 않았다'는 후기도.\n요금: 5세 이하 무료 · 6~11세 51만동 · 성인 66만동.",
    kids: "키즈클럽 Planet Trekker(10~18시, '선생님 둘이 계속 돌봐줌' — 평가 최상), 유아풀(그늘이라 물이 참), 6세 이하 기존 침대 무료, 엑스트라베드 130만동",
    location: "담시장 1.1km(5분) · 케이블카역 5.2km(12~15분) · 아이리조트 15~20분 · 야시장 도보 8분",
    lateCheckout: "체크인 15시 · 짐 보관 무료 · 얼리체크인 불가 사례(10/3 도착) — 10/4 연휴라 보장 어려움",
    pros: ["한국 부모 후기 '시내 조식 1위' · 한식 코너", "키즈클럽 평가 최상 · 4살 조식 무료", "담시장·야시장 모두 가까움"],
    cons: ["비쌈 (2박 약 40~60만원 추정)", "키즈풀이 그늘이라 물이 차갑고 수영장 바람 셈", "얼리체크인 불확실"],
    periodPrices: [
      { period: "클래식 룸 (2026-09 게시, 투숙일 미상)", perNight: "136,390원", note: "조식 불포함 추정", source: "https://blog.naver.com/ehddhks5182/224420718918" },
      { period: "디럭스 오션뷰 킹", perNight: "약 23만원", note: "블로그 참고가", source: "https://blog.naver.com/somewhere_today/224394570337" },
      { period: "8월 말~9월 초 (디럭스 시티뷰)", perNight: "약 29.5만원", note: "아고다 3박 88.5만원", source: "https://blog.naver.com/22zzazza/224404166147" },
      { period: "10/4 (한국 연휴 주말)", perNight: "참고가보다 오를 가능성", note: "개천절 연휴 10/3~10/5", source: "" },
    ],
    links: [
      { label: "트립닷컴", url: "https://us.trip.com/hotels/nha-trang-hotel-detail-2037637/intercontinental-nha-trang/" },
      { label: "트립어드바이저", url: "https://www.tripadvisor.com/Hotel_Review-g293928-d6410942-Reviews-Intercontinental_Nha_Trang_By_IHG-Nha_Trang_Khanh_Hoa_Province.html" },
    ],
    blogPosts: [
      { title: "인터컨티넨탈 조식 — 조식 중요하면 여기", url: "https://cafe.naver.com/zzop/3789291", author: "나트랑 카페", date: "", summary: "조식을 중시하면 나트랑에서 후회 없는 선택이라는 평.", withKids: false },
      { title: "인터컨 키즈클럽 · 조식 후기", url: "https://cafe.naver.com/zzop/3395161", author: "나트랑 카페", date: "", summary: "키즈클럽 선생님 둘이 계속 돌봐줌. 조식은 한식 주문코너가 사라져 엄청나진 않았다는 솔직 평.", withKids: true },
      { title: "인터컨 한식 코너 구성", url: "https://cafe.naver.com/mindy7857/3806700", author: "베트남 카페", date: "", summary: "조식 한식 코너 메뉴 사진과 구성.", withKids: false },
    ],
    verdict: "조식 + 키즈클럽 둘 다 최상위, 4살 조식 무료. 조식 최우선이면 시내 1순위 — 대신 가장 비싼 축.",
    rank: 1,
  },
  {
    id: "hyatt-regency-nha-trang",
    area: "city",
    name: "하얏트 리젠시 나트랑",
    localName: "Hyatt Regency Nha Trang (44 Tran Phu · 2025-12 오픈)",
    lat: null,
    lng: null,
    rating: "트립닷컴 9.4 (188) · 트립어드바이저 4점대 (94)",
    perNight: "약 23~40만원 (조식 포함 여부 혼재, 추정)",
    total: "약 46~80만원 (추정)",
    breakfast: "아이 무료 여부 확인 필요",
    breakfastDetail:
      "6층 Market Café 06:30~10:30. 도넛·초코분수·크레페·요거트 등 아이가 좋아할 메뉴가 많고, 한식 코너(김치 여러 종, 비빔밥, 잡채, 제육, 불고기, 만두).\n👍 '아이랑 즐길만한 메뉴 가장 많은 곳'(2026-09), '어른·아이 모두 만족', 통창에 테이블 간격 여유 / 👎 '엄청 다양한 느낌은 아니지만 충분'.\n요금: 12세 이하 무료(익스피디아 계열) vs 아동 34.65만동(트립닷컴) — 예약 시 확인.",
    kids: "30층 실내 인피니티풀 + 유아풀(09~19시, 비 와도 이용), Camp Hyatt(08~22시, 5살 미만에 적당·작음), 엑스트라베드 221만동(비쌈)",
    location: "담시장 1.6km(6~7분) · 케이블카역 4.9km(12~15분) · 아이리조트 15~20분 · 야시장 도보 2~3분",
    lateCheckout: "체크인 15시 · 체크아웃 11시 · 성수기 얼리체크인 불가(짐 보관은 잘 해줌) · 에이전트 패키지로 12:30 얼리체크인 사례",
    pros: ["아이 메뉴(초코분수·크레페) + 한식 코너 가장 풍부", "30층 실내풀·유아풀 — 10월 우기에도 OK", "신축 · 야시장 도보 3분"],
    cons: ["가장 비쌈", "체크아웃 11시 · 서비스 아쉽다는 평", "키즈클럽 작음 · 아이 조식 무료 여부 불명확"],
    periodPrices: [
      { period: "트립닷컴 최저가 (날짜 미상)", perNight: "398,208원~", note: "2026-09-24 조회", source: "https://www.trip.com/hotels/nha-trang-hotel-detail-119276743/hyatt-regency-nha-trang/" },
      { period: "7월 중순 3박", perNight: "약 23만원대", note: "3박 70만원대", source: "https://blog.naver.com/psps1108/224418602268" },
    ],
    links: [
      { label: "트립닷컴", url: "https://www.trip.com/hotels/nha-trang-hotel-detail-119276743/hyatt-regency-nha-trang/" },
      { label: "오픈 보도자료", url: "https://newsroom.hyatt.com/281225-Hyatt-Regency-Nha-Trang-Opens" },
    ],
    blogPosts: [
      { title: "하얏트 리젠시 나트랑 — 아이랑 즐길 조식", url: "https://blog.naver.com/hwan_ddung/224413393839", author: "hwan_ddung", date: "2026-09", summary: "아이랑 즐길 만한 메뉴가 가장 많은 조식, 실내풀 이용 후기.", withKids: true },
      { title: "하얏트 조식 · 통창 분위기", url: "https://blog.naver.com/clothes1213/224407661318", author: "clothes1213", date: "2026", summary: "통창에 테이블 간격이 여유로운 조식당.", withKids: false },
      { title: "하얏트 한식 코너", url: "https://cafe.naver.com/zzop/4222353", author: "나트랑 카페", date: "", summary: "김치·비빔밥·잡채·제육·불고기·만두 한식 코너.", withKids: false },
    ],
    verdict: "아이 입맛 조식 + 비 와도 쓰는 실내풀이 강점. 예산 여유 있고 우기가 걱정되면 1순위급.",
    rank: 2,
  },
  {
    id: "sheraton-nha-trang",
    area: "city",
    name: "쉐라톤 나트랑",
    localName: "Sheraton Nha Trang Hotel & Spa (26-28 Tran Phu)",
    lat: null,
    lng: null,
    rating: "트립닷컴 9.3 (495) · 트립어드바이저 4점대 (4,136, 나트랑 2위)",
    perNight: "조식 포함 172,810원~ (10/20 화 기준 참고)",
    total: "약 35~40만원 (추정)",
    breakfast: "4살 무료 (5~6세 이하)",
    breakfastDetail:
      "Feast 06:30~10:30. 빵·샐러드·시리얼·쌀국수·도넛·망고·철판 아이스크림.\n한식: 제육, 떡볶이, 소고기무국, 야채죽, 비빔밥, 불고기, 미역국 + 한국인 직원.\n👍 '훌륭했던 조식, 아이는 떡볶이 먹었어요', '비빔밥·불고기로 아이 밥 먹이기 좋음' / 👎 '미역국이 짰다', 바쁠 때 테이블 찾기 어려움.\n요금: 5세 이하 무료(트립닷컴) / 만 6세 이하 무료(카페 후기).",
    kids: "6층 인피니티풀(07~19시), 키즈풀 수심 0.3m, 키즈클럽 같은 층(4~12세 무료·일부 유료)",
    location: "담시장 1.0km(5분) · 케이블카역 5.4km(약 15분) · 아이리조트 15~20분 · 야시장 도보 10분",
    lateCheckout: "체크인 15시 · 짐 보관 · 유료 얼리체크인(오전 9시) 사전 결제 사례, 2026-07 3시간 일찍 체크인 사례",
    pros: ["한식 조식(떡볶이·야채죽) + 한국인 직원", "수영장 '나트랑 호텔 No.1' 평 · 키즈풀 0.3m", "5성급 중 가성비 (10/20 조식 포함 17.3만원)"],
    cons: ["시설 연식(수건·소파 낡음)", "조식당 혼잡", "조식 평 호불호"],
    periodPrices: [
      { period: "10/20(화) 조식 포함", perNight: "172,810원", note: "여기어때 · 무료취소 187,965원 — 우리 날짜와 가장 가까운 참고가", source: "https://blog.naver.com/ashzero_0222/224415365161" },
      { period: "킹 오션뷰 (날짜 미상)", perNight: "166,748원", note: "2베드 오션뷰 182,662원", source: "https://blog.naver.com/ehddhks5182/224420689129" },
      { period: "10/4 (한국 연휴 주말)", perNight: "참고가보다 오를 가능성", note: "개천절 연휴", source: "" },
    ],
    links: [
      { label: "트립닷컴", url: "https://us.trip.com/hotels/nha-trang-hotel-detail-993638/sheraton-nha-trang/" },
      { label: "트립어드바이저", url: "https://www.tripadvisor.com/Hotel_Review-g293928-d1534400-Reviews-Sheraton_Nha_Trang_Hotel_Spa-Nha_Trang_Khanh_Hoa_Province.html" },
    ],
    blogPosts: [
      { title: "훌륭했던 쉐라톤 조식 — 아이는 떡볶이", url: "https://cafe.naver.com/mindy7857/5051391", author: "베트남 카페", date: "", summary: "한식 메뉴 덕분에 아이 식사 걱정 없었다는 후기.", withKids: true },
      { title: "쉐라톤 조식 실망 후기", url: "https://cafe.naver.com/zzop/3272983", author: "나트랑 카페", date: "", summary: "미역국이 짰고 다른 호텔 조식이 더 만족스러웠다는 평.", withKids: false },
      { title: "쉐라톤 10월 가격 (여기어때)", url: "https://blog.naver.com/ashzero_0222/224415365161", author: "ashzero_0222", date: "2026-09", summary: "10/20 조식 포함 172,810원 등 가격 정보.", withKids: false },
    ],
    verdict: "한식 조식·한국인 직원·키즈풀까지 갖춘 5성급 가성비. 조식 혼잡은 일찍 가면 해결.",
    rank: 3,
  },
  {
    id: "vinpearl-empire",
    area: "city",
    name: "빈펄 엠파이어 (Meliá)",
    localName: "Vinpearl Empire Nha Trang (44-46 Le Thanh Ton)",
    lat: null,
    lng: null,
    rating: "트립닷컴 8.9 (775)",
    perNight: "조식 포함 약 7~11만원",
    total: "약 14~22만원",
    breakfast: "1~4세 무료",
    breakfastDetail:
      "Amber 06:00~10:00. '호불호 없는 맛있는 조식, 가짓수 다양, 쌀국수 맛집', 비빔밥·김치·라면 등 한식. 한국인이 아주 많음.\n👎 '밥은 soso', '사람이 너무 많다'.\n요금: 1~4세 무료 · 5~11세 15만동 · 성인 30만동.",
    kids: "키즈돔(6층, 08~22시), 수영장 6층 시티뷰 — 키즈풀은 '목욕탕 크기', 비 오면 풀장 이용 불가 후기",
    location: "담시장 1.4km(6분) · 케이블카역 5.1km(12~15분) · 아이리조트 15~20분 · 야시장 도보 6분",
    lateCheckout: "체크인 15시 · 얼리체크인 오래된 사례 1건",
    pros: ["조식 가성비 최고 · 한식 많음", "1~4세 조식 무료", "2박 약 14~22만원"],
    cons: ["수영장·키즈풀 약함, 비 오면 풀장 불가", "해변 앞 호텔 아님", "빈펄 계열 중 룸컨디션 최하 평"],
    periodPrices: [
      { period: "2026-09 게시", perNight: "조식 포함 8만원", note: NO_LIVE, source: "https://blog.naver.com/godesylove/224403622932" },
      { period: "아고다 (게시 2026)", perNight: "6만원대 / 조식 포함 7만원대", note: NO_LIVE, source: "https://blog.naver.com/lovekra88/224367403811" },
    ],
    links: [
      { label: "트립닷컴", url: "https://us.trip.com/hotels/nha-trang-hotel-detail-15965564/vinpearl-empire-nha-trang-affiliated-by-meli/" },
    ],
    blogPosts: [
      { title: "빈펄 엠파이어 조식 — 호불호 없는 쌀국수 맛집", url: "https://cafe.naver.com/zzop/4068449", author: "나트랑 카페", date: "", summary: "가짓수 다양하고 맛있는 조식, 한식 있음.", withKids: false },
    ],
    verdict: "예산 우선이면 최고의 조식 가성비. 대신 수영장·해변은 기대하지 말 것.",
    rank: null,
  },
  {
    id: "vinpearl-beachfront",
    area: "city",
    name: "빈펄 비치프론트",
    localName: "Vinpearl Beachfront Nha Trang (78-80 Tran Phu)",
    lat: null,
    lng: null,
    rating: "트립닷컴 9.2 (1,052) · 트립어드바이저 4점대 (2,194)",
    perNight: "조식 포함 약 9.5~14만원 + 아이 추가요금",
    total: "약 25~34만원",
    breakfast: "11세 이하 14만동 (유료)",
    breakfastDetail:
      "06:30~10:30. 평가 엇갈림 — '숙소는 별1, 조식은 별4' vs '조식 그냥 그랬다, 한식 입맛엔 별로'(오래된 후기).\n요금: 성인 28만동 · 11세 이하 14만동.",
    kids: "6층 수영장·키즈풀·키즈클럽 · 4세 미만만 무료, 4~11세 숙박 추가요금",
    location: "담시장 2.4km(8~10분) · 케이블카역 4.0km(10~12분, 가장 가까움) · 아이리조트 약 20분",
    lateCheckout: "정보 없음",
    pros: ["빈원더스 가기 가장 편함", "가성비 · 넓은 객실(간이주방)", "해변 앞"],
    cons: ["세일링클럽 음악 소음('한숨도 못 잤다')", "벌레 후기", "4살 아이 추가요금"],
    periodPrices: [
      { period: "2025-08 (오션뷰 스튜디오 2인 조식)", perNight: "약 13.8만원", note: "아고다 4박 551,622원", source: "https://blog.naver.com/sunnnys_/224260146943" },
      { period: "시티뷰 조식 포함", perNight: "약 9.5만원", note: "2박 190,100원", source: "https://blog.naver.com/rbfl0009/224139739239" },
    ],
    links: [
      { label: "트립닷컴", url: "https://us.trip.com/hotels/nha-trang-hotel-detail-23781877/vinpearl-condotel-beachfront-nha-trang/" },
    ],
    blogPosts: [
      { title: "비치프론트 아이 요금 추가 후기", url: "https://blog.naver.com/bjh3714/223731376149", author: "bjh3714", date: "", summary: "예약 사이트와 규정이 달라 아이 요금으로 1박 약 2.5만원 추가 결제.", withKids: true },
    ],
    verdict: "빈원더스 동선 최우선이면 고려. 조식 평 엇갈리고 소음·아이 추가요금이 걸림.",
    rank: null,
  },
  {
    id: "four-points-nha-trang",
    area: "city",
    name: "포포인츠 바이 쉐라톤",
    localName: "Four Points by Sheraton Nha Trang (06 Nguyen Chanh · 2025 오픈)",
    lat: null,
    lng: null,
    rating: "트립닷컴 9.1 (144)",
    perNight: "약 8.5~13만원",
    total: "약 17~26만원",
    breakfast: "아이 무료",
    breakfastDetail:
      "1층 The Mesh 06:30~10:00. 샐러드·과일·치즈햄·계란·누들·밥·빵.\n👎 '조식은 매~우 심플', '한식·트렌디한 요리 없음' / 👍 '아이가 볶음밥에 꽂혀 평소보다 잘 먹었다'.",
    kids: "키즈풀(아크릴 분리), 키즈클럽 없음, 커넥팅룸",
    location: "담시장 약 1.0km(5분) · 케이블카역 약 5.4km(15분) · 아이리조트 15~20분",
    lateCheckout: "체크인 15시 · 얼리체크인 정보 없음",
    pros: ["신축 · 깨끗", "저렴", "방음 좋음"],
    cons: ["조식 단출 · 한식 없음", "화장실 수온·엘리베이터 냄새 후기", "침구 벌레·습도 후기 1건(2026-09)"],
    periodPrices: [
      { period: "2026-02 (3박 조식 불포함)", perNight: "약 8.6만원", note: "3박 259,258원", source: "https://blog.naver.com/97kmj1213/224183787505" },
      { period: "3인 가족 3박", perNight: "약 11.3만원", note: "3박 34만원", source: "https://cafe.naver.com/mindy7857/5370256" },
    ],
    links: [
      { label: "트립닷컴", url: "https://www.trip.com/hotels/nha-trang-hotel-detail-133207082/four-points-by-sheraton-nha-trang/" },
    ],
    blogPosts: [
      { title: "포포인츠 조식 — 매우 심플", url: "https://cafe.naver.com/zzop/3831800", author: "나트랑 카페", date: "", summary: "조식은 단출하지만 아이가 볶음밥을 잘 먹었다는 후기.", withKids: true },
    ],
    verdict: "싸고 새 건물이지만 '조식 최우선' 기준에선 순위가 가장 낮음.",
    rank: null,
  },
];

export const CITY_NOTE =
  "시내 숙소 가격은 예약 사이트 차단으로 실시간 확인을 못 했어요 — 날짜·출처가 붙은 최근 참고가예요. 10/4는 한국 개천절 연휴(10/3~10/5) 주말이라 더 비쌀 수 있고 얼리체크인도 보장이 어려워요. 참고: 노보텔 나트랑은 16세 미만 숙박·조식 무료(공식), 야시장 0.2km.";
