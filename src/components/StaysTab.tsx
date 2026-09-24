"use client";

import { GUIDE, STAY_AREAS } from "@/data/guide";
import type { StayArea, StayOption } from "@/lib/guideTypes";
import { chooseStay } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { BlogPostRow } from "./ReviewsTab";
import { btn, card } from "./ui";

interface Props {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}

const AREAS: StayArea[] = ["arrival", "city", "island", "resort"];

export default function StaysTab({ state, update }: Props) {
  const choices: Record<StayArea, string | null> = {
    arrival: state.stayChoices?.arrival ?? null,
    city: state.stayChoices?.city ?? null,
    island: state.stayChoices?.island ?? null,
    resort: state.stayChoices?.resort ?? null,
  };

  if (GUIDE.stays.length === 0) {
    return (
      <div className={`${card} p-10 text-center text-ink-3`}>
        숙소 가격과 후기를 조사하고 있어요. 조사가 끝나면 여기서 비교하고 고를 수 있어요.
      </div>
    );
  }

  const choose = (area: StayArea, option: StayOption | null) => {
    const conf = STAY_AREAS[area];
    update((s) => {
      let next = chooseStay(s, area, option?.id ?? null, option ? option.name : conf.defaultLabel, conf.nights);
      // 시내 2박과 섬 2박은 같은 날짜라 둘 중 하나만 선택
      const other = area === "city" ? "island" : area === "island" ? "city" : null;
      if (other && option && next.stayChoices) {
        next = { ...next, stayChoices: { ...next.stayChoices, [other]: null } };
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {GUIDE.staysNote && (
        <p className="rounded-2xl bg-surface px-5 py-4 text-[14px] leading-relaxed whitespace-pre-line text-ink-3">
          💡 {GUIDE.staysNote}
        </p>
      )}

      {AREAS.map((area) => {
        const conf = STAY_AREAS[area];
        const options = GUIDE.stays
          .filter((o) => o.area === area)
          .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
        const chosen = options.find((o) => o.id === choices[area]);
        if (options.length === 0) {
          return (
            <section key={area} className="space-y-2 px-1">
              <h2 className="text-[22px] font-bold tracking-tight">{conf.title}</h2>
              <p className="text-[15px] text-ink-2">{conf.period}</p>
              <p className={`${card} mt-2 p-6 text-center text-ink-3`}>조사 중이에요. 곧 채워질 거예요.</p>
            </section>
          );
        }
        return (
          <section key={area} className="space-y-3">
            <div className="px-1">
              <h2 className="text-[22px] font-bold tracking-tight">{conf.title}</h2>
              <p className="text-[15px] text-ink-2">{conf.period}</p>
              <p className="mt-0.5 text-[14px] text-ink-3">{conf.hint}</p>
              {chosen && (
                <p className="mt-2 inline-block rounded-xl bg-primary-soft px-3 py-1.5 text-[15px] font-bold text-primary-ink">
                  ✓ 선택: {chosen.name}
                </p>
              )}
            </div>

            {/* 폰: 순위·이름·1박·조식만 간단히 (누르면 그 숙소 카드로 이동) */}
            <ol className={`${card} divide-y divide-line px-4 md:hidden`} aria-label={`${conf.title} 한눈에 비교`}>
              {options.map((o) => {
                const isChosen = o.id === choices[area];
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById(`stay-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className="flex min-h-16 w-full items-center gap-3 py-3 text-left active:opacity-60"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                          isChosen ? "bg-primary text-on-primary" : "bg-primary-soft text-primary-ink"
                        }`}
                        aria-hidden
                      >
                        {isChosen ? "✓" : (o.rank ?? "·")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] leading-snug font-bold">
                          <span className="sr-only">
                            {o.rank ? `추천 ${o.rank}위 ` : ""}
                            {isChosen ? "(선택됨) " : ""}
                          </span>
                          {o.name}
                        </span>
                        <span className="mt-0.5 block text-[14px] leading-snug text-ink-2">
                          1박 <b className="font-semibold text-ink tabular-nums">{o.perNight}</b> · 조식 {o.breakfast}
                        </span>
                      </span>
                      <span className="shrink-0 text-xl text-ink-4" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* 태블릿/PC: 한눈에 비교 표 */}
            <div className={`${card} hidden overflow-x-auto md:block`}>
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead className="text-[13px] text-ink-3">
                  <tr className="border-b border-line">
                    <th className="px-5 py-3 font-semibold">숙소</th>
                    <th className="px-3 py-3 font-semibold">1박</th>
                    <th className="px-3 py-3 font-semibold">{conf.nights.length}박 합계</th>
                    <th className="px-3 py-3 font-semibold">평점</th>
                    <th className="px-3 py-3 font-semibold">조식</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((o) => (
                    <tr
                      key={o.id}
                      className={`border-b border-line last:border-0 ${o.id === choices[area] ? "bg-primary-soft/60" : ""}`}
                    >
                      <td className="px-5 py-3 font-bold">
                        {o.rank && <span className="mr-1 text-primary-ink">{o.rank}위</span>}
                        {o.name}
                      </td>
                      <td className="px-3 py-3 tabular-nums">{o.perNight}</td>
                      <td className="px-3 py-3 tabular-nums">{o.total}</td>
                      <td className="px-3 py-3">{o.rating}</td>
                      <td className="px-3 py-3">{o.breakfast}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-2">
              {options.map((o) => (
                <StayCard
                  key={o.id}
                  option={o}
                  nights={conf.nights.length}
                  selected={o.id === choices[area]}
                  onChoose={() => choose(area, o.id === choices[area] ? null : o)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StayCard({
  option: o,
  nights,
  selected,
  onChoose,
}: {
  option: StayOption;
  nights: number;
  selected: boolean;
  onChoose: () => void;
}) {
  return (
    <article
      id={`stay-${o.id}`}
      className={`${card} p-5 md:p-6 ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {/* 폰: 평점은 이름 아래 줄로, 태블릿/PC: 오른쪽 */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          {o.rank && (
            <span className="rounded-lg bg-primary-soft px-2 py-1 text-[13px] font-bold text-primary-ink">
              추천 {o.rank}위
            </span>
          )}
          <h3 className="mt-2 text-[20px] leading-snug font-bold tracking-tight md:text-[21px]">{o.name}</h3>
          <p className="text-[13px] text-ink-3">{o.localName}</p>
        </div>
        <p className="text-[14px] font-semibold text-ink-2 sm:max-w-[45%] sm:shrink-0 sm:text-right">{o.rating}</p>
      </div>

      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <p className="text-[13px] font-semibold text-ink-3">우리 날짜 기준</p>
        <p className="mt-0.5 text-[22px] font-bold tracking-tight">{o.perNight}</p>
        <p className="text-[14px] text-ink-2">
          {nights}박 {o.total} · 조식 {o.breakfast}
        </p>
      </div>

      {o.verdict && <p className="mt-4 text-[15px] leading-relaxed font-medium text-ink">{o.verdict}</p>}

      {o.breakfastDetail && (
        <div className="mt-4 rounded-2xl bg-primary-soft p-4">
          <p className="text-[14px] font-bold text-primary-ink">🍳 조식 (아이 기준)</p>
          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{o.breakfastDetail}</p>
        </div>
      )}

      <dl className="mt-4 space-y-2 text-[14px]">
        <Info label="아이">{o.kids}</Info>
        <Info label="위치">{o.location}</Info>
        {o.lateCheckout && <Info label="레이트 체크아웃">{o.lateCheckout}</Info>}
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[13px] font-bold text-[#03b26c]">좋아요</p>
          <ul className="space-y-1 text-[14px] text-ink-2">
            {o.pros.map((p, i) => (
              <li key={i}>· {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[13px] font-bold text-danger">아쉬워요</p>
          <ul className="space-y-1 text-[14px] text-ink-2">
            {o.cons.map((c, i) => (
              <li key={i}>· {c}</li>
            ))}
          </ul>
        </div>
      </div>

      {o.periodPrices.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[14px] font-bold text-ink-2">기간별 금액대</p>
          {/* 폰: 기간 / 금액 / 메모를 위아래로 쌓기 */}
          <table className="w-full text-[14px] max-sm:block">
            <tbody className="max-sm:block">
              {o.periodPrices.map((r, i) => (
                <tr key={`${r.period}-${i}`} className="border-t border-line max-sm:block max-sm:py-2.5">
                  <td className="py-2 pr-2 text-ink-3 max-sm:block max-sm:p-0 max-sm:text-[13px]">{r.period}</td>
                  <td className="py-2 pr-2 font-semibold tabular-nums max-sm:block max-sm:p-0 max-sm:text-[15px]">
                    {r.perNight}
                  </td>
                  <td className="py-2 text-[13px] text-ink-3 max-sm:block max-sm:p-0 max-sm:empty:hidden">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {o.priceDetail && (
        <details className="mt-5 rounded-2xl bg-surface-2 p-4">
          <summary className="cursor-pointer text-[14px] font-bold text-ink-2">가격 상세 (출처·검증 메모)</summary>
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{o.priceDetail}</p>
        </details>
      )}

      {o.blogPosts.length > 0 && (
        <div className="mt-5">
          <p className="mb-1 text-[14px] font-bold text-ink-2">블로그 후기</p>
          <ul className="-mx-3">
            {o.blogPosts.map((p, i) => (
              <BlogPostRow key={`${p.url}-${i}`} post={p} />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={selected ? btn.soft : btn.primary} onClick={onChoose}>
          {selected ? "✓ 선택됨 (취소)" : "이 숙소로 선택"}
        </button>
        {o.links.map((l, i) => (
          <a key={`${l.url}-${i}`} className={btn.secondary} href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label} ↗
          </a>
        ))}
      </div>
    </article>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // 폰: 라벨 위, 내용 아래 (좁은 화면에서 라벨 칸 때문에 글이 세로로 길어지지 않게)
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="font-semibold text-ink-3 max-sm:text-[13px] sm:w-24 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 text-ink-2 max-sm:text-[15px]">{children}</dd>
    </div>
  );
}
