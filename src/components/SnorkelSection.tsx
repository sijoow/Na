import data from "@/data/snorkel.json";
import { btn, card } from "./ui";

// 아미아나 리조트 '시크릿 비치' 원데이패스 — 요금·락커·샤워·스노클 장비·먹을 것 (아이랑 갈 곳 탭)

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Amiana Resort Nha Trang")}`;
const row = "py-2 text-[13px] leading-relaxed text-ink-2";
const head = "mt-4 text-[13px] font-bold text-accent";

export default function SnorkelSection() {
  const { place, entry, snorkel, food } = data;
  return (
    <section className={`${card} p-5 md:p-6`}>
      <p className="text-[15px] font-semibold text-ink-3">🤿 스노클링 · 호텔 데이패스</p>
      <h3 className="mt-1 text-[19px] leading-snug font-bold tracking-tight">{place.name}</h3>
      <p className="text-[13px] text-ink-3">{place.localName}</p>
      <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-[14px] leading-relaxed text-ink">🧒 {data.kidsFit}</p>

      <dl className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
        <div className="flex gap-2">
          <dt className="shrink-0">📍</dt>
          <dd className="text-ink-2">
            {place.hotel} · {place.address}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0">🕒</dt>
          <dd className="text-ink-2">{place.hours}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0">🚕</dt>
          <dd className="text-ink-2">{place.fromHotels}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className={btn.soft} href={mapUrl} target="_blank" rel="noopener noreferrer">
          구글 지도
        </a>
        <a
          className={btn.secondary}
          href={`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent("아미아나 시크릿비치 스노클링")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          📷 사진 보기
        </a>
      </div>

      <p className={head}>요금 (원데이패스)</p>
      <ul className="divide-y divide-line">
        {entry.map((e) => (
          <li key={e.item} className={row}>
            <b className="text-ink">{e.item}</b> — <span className="font-semibold text-ink tabular-nums">{e.price}</span>
            {e.includes !== "-" && <span className="block text-[12px] text-ink-3">{e.includes}</span>}
          </li>
        ))}
      </ul>

      <p className={head}>들어가는 법</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{data.booking}</p>

      <p className={head}>락커 · 샤워</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">🔐 {data.locker}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">🚿 {data.shower}</p>

      <p className={head}>스노클링</p>
      <ul className="mt-1 space-y-1.5 text-[13px] leading-relaxed text-ink-2">
        <li>🤿 대여: {snorkel.rental}</li>
        <li>🧒 아이: {snorkel.kids}</li>
        <li>🌊 깊이: {snorkel.depth}</li>
        <li>🐟 물고기: {snorkel.marineLife}</li>
        <li>🛟 안전: {snorkel.safety}</li>
      </ul>

      <p className={head}>먹을 것</p>
      <ul className="divide-y divide-line">
        {food.map((f) => (
          <li key={f.where} className={row}>
            <b className="text-ink">{f.where}</b>
            <span className="block">{f.menu}</span>
            <span className="block font-semibold text-ink tabular-nums">{f.price}</span>
            <span className="block text-[12px] text-ink-3">{f.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">🥪 외부 음식: {data.outsideFood}</p>

      <p className={head}>넣는다면 언제</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{data.suggestedSlot}</p>

      <details className="mt-3 rounded-2xl border border-line px-3 py-2.5">
        <summary className="cursor-pointer text-[13px] font-bold text-ink-2">
          다른 곳 {data.alternatives.length} · 후기 {data.posts.length}
        </summary>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-2">
          {data.alternatives.map((a) => (
            <li key={a.name}>
              <b className="text-ink">{a.name}</b> — {a.why}
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1.5">
          {data.posts.map((p) => (
            <li key={p.url} className="text-[12px] leading-relaxed text-ink-3">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 underline-offset-2 hover:underline">
                {p.title}
              </a>{" "}
              ({p.date}) — {p.summary}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-2 text-[12px] text-ink-4">{data.checkedAt} 조사 · 공식 홈페이지 요금·메뉴판(2026-08)과 블로그 후기 기준</p>
    </section>
  );
}
