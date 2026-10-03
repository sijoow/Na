"use client";

// 아이랑 갈 곳 — 만 3세(101cm, 발이 안 닿는 깊은 물을 무서워함) 기준 추천 목록 + 10/5 빈원더스 대신 코스 + 엄마·아이 네일.
// 자료는 src/data/kidsPlaces.json (2026-10-01 조사), 사진은 images.json (위키미디어 공용 자유 라이선스).

import data from "@/data/kidsPlaces.json";
import { Photo, refPhoto } from "./Photo";
import { btn, card } from "./ui";

type Fit = "good" | "care" | "no";

interface Place {
  id: string;
  rank: number;
  emoji: string;
  category: string;
  name: string;
  localName: string;
  when: string;
  fit: Fit;
  fitText: string;
  price: string;
  priceDetail: string;
  booking: string;
  hours: string;
  move: string;
  duration: string;
  rating: string;
  lat: number;
  lng: number;
  highlights: string[];
  cautions: string[];
  /** '묶음:키' (예: kids:capybara, places:vinwonders) */
  photo: string;
  photoCaption: string;
  links: { label: string; url: string }[];
  sources: string;
}

interface NailShop {
  id: string;
  rank: number;
  name: string;
  localName: string;
  price: string;
  priceDetail: string;
  kids: string;
  booking: string;
  hours: string;
  move: string;
  rating: string;
  lat: number;
  lng: number;
  instagram: string;
  /** 카톡 1:1 채팅 링크 (예약할 가게만) */
  kakao?: string;
  /** 구글 이미지 검색어 (가게 사진 보기) */
  photoQuery: string;
  caution?: string;
}

interface KidsData {
  checkedAt: string;
  intro: string;
  legend: { fit: Fit; label: string }[];
  plan: { title: string; summary: string; steps: { time: string; text: string }[]; total: string; note: string };
  places: Place[];
  notRecommended: { name: string; price: string; why: string; detail?: NotRecommendedDetail }[];
  nails: {
    title: string;
    intro: string;
    examplePhoto: string;
    examplePhotoCaption: string;
    tips: string[];
    shops: NailShop[];
    sources: string;
  };
}

/** 비추 장소인데 그래도 가려는 경우를 위한 상세 (원숭이섬: 패키지·가는 법·안전 수칙) */
interface NotRecommendedDetail {
  checkedAt: string;
  verdict: string;
  ifGoing: string[];
  pier: { name: string; lat: number; lng: number; move: string };
  hours: string;
  packages: { name: string; where: string; url: string; price: string; note: string }[];
  safety: string[];
  posts: { title: string; url: string; date: string; summary: string }[];
}

const D = data as KidsData;

const FIT: Record<Fit, { label: string; cls: string }> = {
  good: { label: "✅ 딱 좋아요", cls: "bg-primary-soft text-primary-ink" },
  care: { label: "⚠️ 조건부", cls: "bg-accent-soft text-accent" },
  no: { label: "❌ 비추", cls: "bg-danger-soft text-danger" },
};

const mapUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const imageSearch = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
const smallBtn = "press inline-flex min-h-10 items-center rounded-xl bg-surface-2 px-3 text-[13px] font-semibold text-ink-2";

export default function KidsPlacesTab({ onGo }: { onGo?: (tab: "schedule") => void }) {
  return (
    <div className="space-y-4">
      <section className={`${card} p-5 md:p-6`}>
        <p className="text-[15px] font-bold text-primary-ink">👶 아이랑 갈 곳</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">만 3세 · 깊은 물 무서워하는 아이 기준 추천</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{D.intro}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {D.legend.map((l) => (
            <span key={l.fit} className={`rounded-lg px-2 py-1 text-[12px] font-bold ${FIT[l.fit].cls}`}>
              {FIT[l.fit].label.split(" ")[0]} {l.label}
            </span>
          ))}
        </div>
      </section>

      <PlanCard plan={D.plan} />

      <section className="space-y-3">
        <h3 className="px-1 text-[19px] font-bold tracking-tight">📋 추천 순서 ({D.places.length}곳)</h3>
        {D.places.map((p) => (
          <PlaceCard key={p.id} p={p} />
        ))}
      </section>

      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">❌ 이번엔 비추 ({D.notRecommended.length})</h3>
        <ul className="mt-2 divide-y divide-line">
          {D.notRecommended.map((n) => (
            <li key={n.name} className="py-2.5">
              <p className="text-[15px] font-bold text-ink">{n.name}</p>
              <p className="text-[13px] font-semibold text-ink-3">{n.price}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{n.why}</p>
              {n.detail && <NotRecommendedMore d={n.detail} />}
            </li>
          ))}
        </ul>
      </section>

      <NailSection onGo={onGo} />

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        {D.checkedAt} 기준 · 사진은 위키미디어 공용 자유 라이선스예요. 그 장소 사진이 아닌 예시 사진은 캡션에 적어 뒀어요. 가게 실제 사진은 &apos;📷 사진 보기&apos;로
        열어요.
      </p>
    </div>
  );
}

/** 비추 장소 펼쳐 보기 — 그래도 간다면 언제·어떻게, 패키지 상품, 안전 수칙, 후기 */
function NotRecommendedMore({ d }: { d: NotRecommendedDetail }) {
  return (
    <details className="mt-2 rounded-2xl border border-line px-3 py-2.5">
      <summary className="cursor-pointer text-[13px] font-bold text-ink-2">📦 패키지 · 가는 법 · 안전 수칙 ({d.checkedAt} 조사)</summary>
      <p className="mt-2 text-[13px] leading-relaxed font-semibold text-ink">{d.verdict}</p>

      <p className="mt-3 text-[13px] font-bold text-accent">그래도 간다면 (10/9 오전)</p>
      <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-ink-2">
        {d.ifGoing.map((t) => (
          <li key={t}>· {t}</li>
        ))}
      </ul>

      <p className="mt-3 text-[13px] font-bold text-accent">패키지 · 표</p>
      <ul className="mt-1 space-y-2">
        {d.packages.map((p) => (
          <li key={p.name} className="rounded-xl bg-surface-2 px-3 py-2">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-primary-ink underline-offset-2 hover:underline">
              {p.name} ↗
            </a>
            <span className="ml-1 text-[12px] text-ink-3">{p.where}</span>
            <p className="text-[13px] font-semibold text-ink">{p.price}</p>
            <p className="text-[12px] leading-relaxed text-ink-3">{p.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[13px] font-bold text-accent">선착장 · 시간</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
        <a href={mapUrl(d.pier.lat, d.pier.lng)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-ink">
          📍 {d.pier.name}
        </a>{" "}
        — {d.pier.move}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">🕒 {d.hours}</p>

      <p className="mt-3 text-[13px] font-bold text-danger">안전 수칙</p>
      <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-ink-2">
        {d.safety.map((t) => (
          <li key={t}>· {t}</li>
        ))}
      </ul>

      <p className="mt-3 text-[13px] font-bold text-ink-3">최근 후기</p>
      <ul className="mt-1 space-y-1">
        {d.posts.map((p) => (
          <li key={p.url} className="text-[12px] leading-relaxed text-ink-3">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 underline-offset-2 hover:underline">
              {p.title}
            </a>{" "}
            ({p.date}) — {p.summary}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** 10/5 빈원더스 대신 하루 코스 */
function PlanCard({ plan }: { plan: KidsData["plan"] }) {
  return (
    <section className={`${card} p-5 ring-2 ring-accent md:p-6`}>
      <p className="text-[14px] font-bold text-accent">⭐ 추천 코스</p>
      <h3 className="mt-1 text-[18px] leading-snug font-bold tracking-tight">{plan.title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{plan.summary}</p>
      <ol className="mt-3 space-y-2">
        {plan.steps.map((s) => (
          <li key={s.time} className="flex gap-3 text-[14px] leading-snug">
            <span className="w-12 shrink-0 font-bold text-primary-ink tabular-nums">{s.time}</span>
            <span className="min-w-0 text-ink">{s.text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-2xl bg-primary-soft p-3 text-[15px] font-bold text-primary-ink">💵 {plan.total}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{plan.note}</p>
    </section>
  );
}

function PlaceCard({ p }: { p: Place }) {
  const photo = refPhoto(p.photo);
  const fit = FIT[p.fit];
  const rows: [string, string][] = [
    ["예약", p.booking],
    ["시간", p.hours],
    ["이동", p.move],
    ["소요", p.duration],
    ["평점", p.rating],
  ];
  return (
    <article className={`${card} overflow-hidden`}>
      {photo && <Photo photo={photo} alt={p.name} className="aspect-[16/9]" note={p.photoCaption} />}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-ink px-2 py-0.5 text-[12px] font-bold text-page">{p.rank}</span>
          <span className="rounded-lg bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-ink-3">{p.category}</span>
          <span className={`rounded-lg px-2 py-0.5 text-[12px] font-bold ${fit.cls}`}>{fit.label}</span>
        </div>
        <h4 className="mt-2 text-[19px] leading-snug font-bold tracking-tight">
          {p.emoji} {p.name}
        </h4>
        <p className="mt-0.5 text-[12px] text-ink-3">{p.localName}</p>
        <p className="mt-1 text-[13px] font-semibold text-accent">📅 {p.when}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{p.fitText}</p>

        <div className="mt-3 rounded-2xl bg-surface-2 p-3">
          <p className="text-[17px] font-bold text-primary-ink tabular-nums">💵 {p.price}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{p.priceDetail}</p>
        </div>

        <dl className="mt-3 divide-y divide-line">
          {rows
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="flex gap-3 py-1.5 text-[13px] leading-snug">
                <dt className="w-10 shrink-0 font-semibold text-ink-3">{label}</dt>
                <dd className="min-w-0 text-ink">{value}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-3 grid grid-cols-1 gap-2 text-[13px] leading-relaxed sm:grid-cols-2">
          {p.highlights.length > 0 && (
            <ul className="rounded-2xl bg-primary-soft p-3 text-ink">
              {p.highlights.map((h) => (
                <li key={h}>👍 {h}</li>
              ))}
            </ul>
          )}
          {p.cautions.length > 0 && (
            <ul className="rounded-2xl bg-accent-soft p-3 text-ink">
              {p.cautions.map((c) => (
                <li key={c}>⚠️ {c}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a className={smallBtn} href={mapUrl(p.lat, p.lng)} target="_blank" rel="noopener noreferrer">
            🗺️ 구글 지도
          </a>
          <a className={smallBtn} href={imageSearch(`${p.localName.split(" · ")[0]} Nha Trang`)} target="_blank" rel="noopener noreferrer">
            📷 사진 보기
          </a>
          {p.links.map((l) => (
            <a key={l.url} className={smallBtn} href={l.url} target="_blank" rel="noopener noreferrer">
              🔗 {l.label}
            </a>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-4">출처: {p.sources}</p>
      </div>
    </article>
  );
}

/** 💅 엄마·아이 네일 — 가격·아이 메뉴·예약·사진 링크 */
function NailSection({ onGo }: { onGo?: (tab: "schedule") => void }) {
  const n = D.nails;
  const example = refPhoto(n.examplePhoto);
  return (
    <section className="space-y-3">
      <div className={`${card} overflow-hidden`}>
        {example && <Photo photo={example} alt="젤네일 예시" className="aspect-[16/9]" note={n.examplePhotoCaption} />}
        <div className="p-5">
          <h3 className="text-[19px] font-bold tracking-tight">💅 {n.title}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{n.intro}</p>
          <ul className="mt-3 space-y-1 rounded-2xl bg-primary-soft p-3 text-[13px] leading-relaxed text-ink">
            {n.tips.map((t) => (
              <li key={t}>🧒 {t}</li>
            ))}
          </ul>
        </div>
      </div>
      {n.shops.map((s) => (
        <article key={s.id} className={`${card} p-5 ${s.rank === 1 ? "ring-2 ring-accent" : ""}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h4 className="text-[18px] leading-snug font-bold tracking-tight">
              <span className="mr-1.5 rounded-lg bg-ink px-2 py-0.5 align-middle text-[12px] text-page">{s.rank}</span>
              {s.name}
            </h4>
            <span className="text-[16px] font-bold text-primary-ink tabular-nums">{s.price}</span>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-3">{s.localName}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{s.priceDetail}</p>
          <dl className="mt-2 divide-y divide-line">
            {(
              [
                ["아이", s.kids],
                ["예약", s.booking],
                ["시간", s.hours],
                ["이동", s.move],
                ["평점", s.rating],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex gap-3 py-1.5 text-[13px] leading-snug">
                  <dt className="w-10 shrink-0 font-semibold text-ink-3">{label}</dt>
                  <dd className="min-w-0 text-ink">{value}</dd>
                </div>
              ))}
          </dl>
          {s.caution && <p className="mt-2 rounded-xl bg-accent-soft px-3 py-2 text-[12px] leading-relaxed text-ink">⚠️ {s.caution}</p>}
          {s.kakao && (
            <a className={`${btn.primary} mt-3 w-full`} href={s.kakao} target="_blank" rel="noopener noreferrer">
              💬 카톡으로 예약하기
            </a>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a className={smallBtn} href={mapUrl(s.lat, s.lng)} target="_blank" rel="noopener noreferrer">
              🗺️ 구글 지도
            </a>
            <a className={smallBtn} href={imageSearch(s.photoQuery)} target="_blank" rel="noopener noreferrer">
              📷 가게 사진
            </a>
            {s.instagram && (
              <a className={smallBtn} href={s.instagram} target="_blank" rel="noopener noreferrer">
                📸 인스타 (디자인)
              </a>
            )}
          </div>
        </article>
      ))}
      {onGo && (
        <button type="button" className={`${btn.secondary} w-full`} onClick={() => onGo("schedule")}>
          일정 탭 10/4 &apos;엄마·아이 네일&apos; 칸에서 가게 바꾸기
        </button>
      )}
      <p className="px-1 text-[11px] leading-relaxed text-ink-4">출처: {n.sources}</p>
    </section>
  );
}
