/* eslint-disable @next/next/no-img-element -- 외부(Cafe24·호텔 공식 사이트) 이미지를 그대로 보여주는 단순 썸네일 */
import images from "@/data/images.json";

export interface PhotoInfo {
  url: string;
  credit: string;
  license: string;
  source: string;
  kind?: string;
  /** 사진 설명 (예: "반쎄오 (대표 메뉴 예시, 이 가게 사진 아님)") */
  caption?: string;
}

type PhotoMap = Record<string, PhotoInfo>;
// 스크립트가 채우는 파일이라 없는 키가 있을 수 있음
const IMG = images as unknown as {
  places?: PhotoMap;
  dishes?: PhotoMap;
  activities?: PhotoMap;
  stays?: PhotoMap;
  souvenirGroups?: PhotoMap;
  restaurants?: PhotoMap;
};

export const placePhoto = (id?: string | null) => (id ? IMG.places?.[id] : undefined);
export const dishPhoto = (dish: string) => IMG.dishes?.[dish];

// 가게 이름·메뉴에 이 단어가 있으면 그 음식 사진을 '대표 메뉴 사진'으로 보여준다
const DISH_KEYWORDS: [string[], string][] = [
  [["어묵", "하이까", "분까", "Bún cá"], "어묵 쌀국수"],
  [["분짜"], "분짜 ("],
  [["쌀국수", "퍼", "Phở"], "소고기 쌀국수"],
  [["넴느엉", "Nem"], "넴느엉"],
  [["반쎄오", "Bánh xèo"], "반쎄오"],
  [["반미", "Bánh mì"], "반미"],
  [["반깐", "Bánh căn"], "반깐"],
  [["해산물", "새우", "랍스터", "조개", "seafood", "Hải sản"], "해산물 구이"],
  [["아보카도"], "아보카도"],
  [["과일", "망고", "주스"], "망고"],
  [["커피", "카페", "Cà phê"], "연유커피"],
  [["볶음밥", "한식", "죽"], "계란볶음밥"],
];
export function menuPhoto(text: string): PhotoInfo | undefined {
  for (const [words, dishPrefix] of DISH_KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      const key = Object.keys(IMG.dishes ?? {}).find((k) => k.startsWith(dishPrefix));
      if (key) return IMG.dishes![key];
    }
  }
  return undefined;
}
export const activityPhoto = (id: string) => IMG.activities?.[id];
export const stayPhoto = (id: string) => IMG.stays?.[id];
export const groupPhoto = (group: string) => IMG.souvenirGroups?.[group];
export const restaurantPhoto = (id: string) => IMG.restaurants?.[id];

/**
 * 사진 + 출처 표시.
 * 위키미디어 사진은 라이선스상 저작자·라이선스 표기가 필요하고,
 * 호텔 공식 이미지는 복사하지 않고 공식 사이트 주소 그대로 보여준다(no-referrer).
 */
export function Photo({
  photo,
  alt,
  className = "aspect-[16/9]",
  link = true,
  note,
}: {
  /** 캡션 앞에 붙일 설명 (예: '대표 메뉴 사진') */
  note?: string;
  photo: PhotoInfo | undefined;
  alt: string;
  className?: string;
  /** 버튼 안에 넣을 때는 false (링크 중첩 방지) */
  link?: boolean;
}) {
  if (!photo) return null;
  const caption =
    (note ? `${note} · ` : "") +
    (photo.kind === "official" ? `사진 출처: ${photo.credit}` : `사진: ${photo.credit} · ${photo.license}`);
  return (
    <figure className="overflow-hidden rounded-2xl bg-surface-2">
      <img
        src={photo.url}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`w-full object-cover ${className}`}
      />
      <figcaption className="truncate px-2 py-1 text-[11px] text-ink-4">
        {link ? (
          <a href={photo.source} target="_blank" rel="noopener noreferrer">
            {caption}
          </a>
        ) : (
          caption
        )}
      </figcaption>
    </figure>
  );
}

// 일정 제목에 이 단어가 있으면 그 장소/투어 사진을 날짜 카드 대표 사진으로
const DAY_KEYWORDS: [string, () => PhotoInfo | undefined][] = [
  ["빈원더스", () => IMG.places?.["vinwonders"]],
  ["사막", () => IMG.activities?.["phan-rang-desert"]],
  ["머드", () => IMG.activities?.["i-resort-mud"]],
  ["포나가르", () => IMG.places?.["po-nagar"]],
  ["대성당", () => IMG.places?.["nha-trang-cathedral"]],
  ["담시장", () => IMG.places?.["dam-market"]],
  ["야시장", () => IMG.places?.["night-market"]],
  ["리조트", () => IMG.places?.["cam-ranh-resort-area"]],
  ["해변", () => IMG.places?.["city-hotel-area"]],
  ["출국", () => IMG.places?.["cam-ranh-airport"]],
  ["귀국", () => IMG.places?.["cam-ranh-airport"]],
];

/** 날짜 카드용 대표 사진: 제목 → 일정 순서로 키워드를 찾아 첫 번째 사진 */
export function dayPhoto(title: string, itemTitles: string[]): PhotoInfo | undefined {
  for (const text of [title, ...itemTitles]) {
    for (const [word, get] of DAY_KEYWORDS) {
      if (text.includes(word)) {
        const p = get();
        if (p) return p;
      }
    }
  }
  return undefined;
}

/** 배경용 대표 사진 (홈 상단) */
export const heroPhoto = () => IMG.places?.["city-hotel-area"] ?? IMG.places?.["vinwonders"];
