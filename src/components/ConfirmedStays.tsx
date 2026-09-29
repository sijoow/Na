import type { ConfirmedStay } from "@/lib/plans";
import { btn, card } from "./ui";

// 예약을 마친 숙소 (확정 플랜에서 숙소 고르기 대신 보여 줌)
export default function ConfirmedStays({ stays }: { stays: ConfirmedStay[] }) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-[22px] font-bold tracking-tight">✅ 확정 숙소</h2>
        <p className="text-[15px] text-ink-2">예약을 마친 숙소 3곳이에요. 체크인 전에 할 일을 확인하세요.</p>
      </div>
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
        {stays.map((s) => (
          <StayCard key={s.leg} s={s} />
        ))}
      </div>
    </section>
  );
}

/** 확정 숙소 한 곳 (일정 카드에서 펼쳐 볼 때도 쓴다) */
export function StayCard({ s }: { s: ConfirmedStay }) {
  return (
    <article className={`${card} p-5`}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-extrabold text-page">
          {s.leg}
        </span>
        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[12px] font-bold text-primary-ink">예약 확정</span>
      </div>
      <h3 className="mt-2 text-[19px] leading-snug font-bold tracking-tight">{s.name}</h3>
      <p className="text-[13px] text-ink-3">
        {s.localName} · {s.address}
      </p>
      <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-[14px] font-semibold text-ink">📅 {s.period}</p>
      <dl className="mt-3 space-y-1.5 text-[14px] leading-relaxed">
        {[
          ["🕑", s.checkInOut],
          ["🛏️", s.room],
          ["🧒", s.kids],
        ].map(([icon, text]) => (
          <div key={icon} className="flex gap-2">
            <dt className="shrink-0">{icon}</dt>
            <dd className="text-ink-2">{text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[13px] font-bold text-accent">체크인 전 할 일 · 팁</p>
      <ul className="mt-1 space-y-1 text-[14px] leading-relaxed text-ink-2">
        {s.tips.map((t) => (
          <li key={t}>· {t}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          className={btn.soft}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.localName} ${s.address}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          구글 지도
        </a>
        <a
          className={btn.secondary}
          href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(s.localName)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          📷 호텔 사진
        </a>
      </div>
    </article>
  );
}
