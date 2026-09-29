"use client";

import { GUIDE } from "@/data/guide";
import restaurantsData from "@/data/restaurants.json";
import spasData from "@/data/spas.json";
import type { Place } from "@/lib/guideTypes";
import type { PlaceMatch } from "@/lib/placeMatch";
import { getPlan } from "@/lib/plans";
import { StayCard } from "./ConfirmedStays";
import { RadissonDelivery, RestaurantCard, type Restaurant } from "./FoodTab";
import { Photo, placePhoto } from "./Photo";
import { SpaCard, type SpaShop } from "./SpaSection";
import { ActivityCard, ShopCard } from "./ToursShopsTab";
import { card } from "./ui";

// 일정 카드를 누르면 펼쳐지는 장소 정보 — 맛집·투어·쇼핑·마사지·숙소 탭의 카드를 그대로 보여 준다

type MealSpot = (typeof restaurantsData.nearSheraton.spots)[number];

export default function PlaceInfo({ place }: { place: Pick<PlaceMatch, "kind" | "id"> }) {
  switch (place.kind) {
    case "restaurant": {
      const r = (restaurantsData.restaurants as Restaurant[]).find((x) => x.id === place.id);
      return r ? <RestaurantCard r={r} /> : null;
    }
    case "meal": {
      const m = restaurantsData.nearSheraton.spots.find((x) => x.id === place.id);
      return m ? <MealCard m={m} /> : null;
    }
    case "delivery":
      return <RadissonDelivery />;
    case "spa": {
      const s = (spasData.shops as SpaShop[]).find((x) => x.id === place.id);
      return s ? <SpaCard shop={s} /> : null;
    }
    case "fruit":
    case "shop": {
      const s = GUIDE.shops.find((x) => x.id === place.id);
      return s ? <ShopCard shop={s} /> : null;
    }
    case "activity": {
      const a = GUIDE.activities.find((x) => x.id === place.id);
      return a ? <ActivityCard activity={a} /> : null;
    }
    case "hotel": {
      const s = getPlan("D").confirmed?.find((h) => h.leg === place.id);
      return s ? <StayCard s={s} /> : null;
    }
    case "place": {
      const p = GUIDE.places.find((x) => x.id === place.id);
      return p ? <PlaceCard p={p} /> : null;
    }
    default:
      return null;
  }
}

// 쉐라톤 근처 끼니 식당 (맛집 탭 '쉐라톤에서 먹을 곳'과 같은 내용)
function MealCard({ m }: { m: MealSpot }) {
  return (
    <article className={`${card} p-5`}>
      <p className="text-[13px] font-bold text-primary-ink">
        {m.meal} · {m.walk}
      </p>
      <h3 className="mt-1 text-[19px] leading-snug font-bold tracking-tight">{m.name}</h3>
      <p className="text-[13px] text-ink-3">{m.localName}</p>
      <dl className="mt-3 space-y-1.5 text-[14px] leading-relaxed">
        {[
          ["🕑", m.opens],
          ["🍽️", `${m.menu} · ${m.price}`],
          ["🧒", m.kid],
        ].map(([icon, text]) => (
          <div key={icon} className="flex gap-2">
            <dt className="shrink-0">{icon}</dt>
            <dd className="text-ink-2">{text}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

// 지도 장소 (공항·케이블카 탑승장 등 — 요금표 없는 곳)
function PlaceCard({ p }: { p: Place }) {
  return (
    <article className={`${card} p-5`}>
      {placePhoto(p.id) && (
        <div className="mb-4">
          <Photo photo={placePhoto(p.id)} alt={p.name} />
        </div>
      )}
      <h3 className="text-[19px] leading-snug font-bold tracking-tight">{p.name}</h3>
      <p className="text-[13px] text-ink-3">
        {p.localName}
        {p.address && ` · ${p.address}`}
      </p>
      {p.note && <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{p.note}</p>}
    </article>
  );
}
