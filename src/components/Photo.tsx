/* eslint-disable @next/next/no-img-element -- 외부(Cafe24·호텔 공식 사이트) 이미지를 그대로 보여주는 단순 썸네일 */
import images from "@/data/images.json";

export interface PhotoInfo {
  url: string;
  credit: string;
  license: string;
  source: string;
  kind?: string;
}

type PhotoMap = Record<string, PhotoInfo>;
// 스크립트가 채우는 파일이라 없는 키가 있을 수 있음
const IMG = images as unknown as {
  places?: PhotoMap;
  dishes?: PhotoMap;
  activities?: PhotoMap;
  stays?: PhotoMap;
  souvenirGroups?: PhotoMap;
};

export const placePhoto = (id?: string | null) => (id ? IMG.places?.[id] : undefined);
export const dishPhoto = (dish: string) => IMG.dishes?.[dish];
export const activityPhoto = (id: string) => IMG.activities?.[id];
export const stayPhoto = (id: string) => IMG.stays?.[id];
export const groupPhoto = (group: string) => IMG.souvenirGroups?.[group];

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
}: {
  photo: PhotoInfo | undefined;
  alt: string;
  className?: string;
  /** 버튼 안에 넣을 때는 false (링크 중첩 방지) */
  link?: boolean;
}) {
  if (!photo) return null;
  const caption =
    photo.kind === "official" ? `사진 출처: ${photo.credit}` : `사진: ${photo.credit} · ${photo.license}`;
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
