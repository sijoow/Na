"use client";

// 10/6 판랑 사막투어 — 예약 확정(10/2, HT나트랑) 뒤에는 확정 카드 → 당일 동선 → 10/5 밤 → 날씨 → 이럴 땐 → 준비물, 예약 전 비교 자료는 맨 아래에 접어 둔다.
// 업체 비교는 src/data/desertTour.json, 1순위 예약 단계·신청 문구는 투어·쇼핑 탭의 판랑 사막투어 카드와 같은 자료를 쓴다.

import { useState } from "react";
import data from "@/data/desertTour.json";
import { GUIDE } from "@/data/guide";
import { toggleChecklistItem } from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { AddOnList, CopyBlock, HowToBox } from "./HowToBox";
import { activityPhoto, desertPhoto, Photo, type PhotoInfo } from "./Photo";
import { btn, card } from "./ui";

interface LinkItem {
  label: string;
  url: string;
}

interface Vendor {
  id: string;
  rank: number;
  name: string;
  platform: string;
  url: string;
  total: string;
  vehicle: string;
  luggage: string;
  radissonDrop: string;
  startTime: string;
  cancel: string;
  payment: string;
  rating: string;
  includes: string;
  excludes?: string;
  kid?: string;
  childSeat?: string;
  /** 최근 후기 요약 */
  reviews?: string;
  /** 9/27 조사 대비 달라진 점 */
  changed?: string;
  howTo?: string[];
  /** 실제 사진이 많은 페이지 (사진은 저작권 때문에 복사하지 않고 링크만) */
  photoLinks?: LinkItem[];
  pros: string[];
  cons: string[];
  note?: string;
  /** 현지 업체: 카톡 ID·채널, 2026 후기 수와 링크 (광고·협찬은 라벨에 표시) */
  kakao?: string;
  reviewCount?: number;
  reviewLinks?: LinkItem[];
}

interface LocalBriefing {
  intro: string;
  recommendation: string;
  kakaoMessage: string;
  vendors: Vendor[];
  /** 2026 후기를 못 찾은 곳 (한 줄씩) */
  noReviews?: { name: string; note: string }[];
  /** 차만 빌리고 지프는 현장에서 */
  diy?: { summary: string; carCost: string; jeepCost: string; howTo: string[]; risks: string[] };
}

interface Briefing {
  updatedAt: string;
  status: string;
  deadlines: { date: string; text: string }[];
  conditions: { label: string; value: string }[];
  verdict: { title: string; why: string[]; backup: string; /** 가성비 선택지 (현지 업체) */ alt?: string };
  vendors: Vendor[];
  others: string;
  ask: string[];
  packing: string[];
  sources: string;
  /** 자유 라이선스 사진 (images.json desert 묶음) + 설명 */
  gallery?: { id: string; title: string; text: string }[];
  /** 아이 동반 오전 투어 모습이 잘 보이는 후기 */
  sceneLinks?: LinkItem[];
  route?: LinkItem;
  /** 카톡으로 직접 예약하는 현지 업체 */
  local?: LocalBriefing;
  /** 업체를 정하면 일정 탭에서 고르라는 안내 */
  scheduleNote?: string;
  weather?: {
    snapshot: string;
    plan: string[];
    policies: string[];
    checkpoints: { date: string; text: string }[];
    sources: string;
  };
  /** 이럴 땐 (기사 안 옴 · 짐 · 아이 · 바람) */
  cases?: { title: string; steps: string[] }[];
  /** 10/5(월) 밤에 할 일 */
  nightBefore?: string[];
  /** 현지 1·2위 최종 비교 */
  faceoff?: FaceOff;
  /** 예약 확정 내용 (확정 뒤엔 탭 맨 위에 보여 주고, 비교 자료는 접어 둔다) */
  confirmed?: {
    title: string;
    confirmedAt: string;
    summary: string;
    rows: { label: string; value: string }[];
    dayBefore: string[];
    chatUrl: string;
  };
}

interface FaceOff {
  title: string;
  verdict: string;
  reasons: string[];
  caution: string[];
  /** win: a(왼쪽) · b(오른쪽) · same */
  rows: { item: string; a: string; b: string; win: "a" | "b" | "same" }[];
  timing: string;
  questions: string[];
  extra: string[];
  sources: string;
  /** 추천 업체 연락 방법 (카톡 채널·ID·보낼 문구) */
  contact?: { name: string; kakaoId: string; channelName: string; channelUrl: string; chatUrl: string; steps: string[]; message: string; note: string };
}

const B = data as Briefing;
const DESERT = GUIDE.activities.find((a) => a.id === "phan-rang-desert");
const CHECK_ID = "bk-desert-tour";

export default function DesertTourTab({
  state,
  update,
}: {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}) {
  const day = state.days.find((d) => d.date === "2026-10-06");
  const check = state.checklist.find((c) => c.id === CHECK_ID);
  const photo = activityPhoto("phan-rang-desert");

  const toggle = check ? () => update((s) => toggleChecklistItem(s, CHECK_ID)) : undefined;

  // 예약 전 비교 자료 — 확정 뒤에는 맨 아래에 접어 둔다
  const research = (
    <>
      {/* 결론 */}
      <section className={`${card} overflow-hidden`}>
        {!B.confirmed && photo && <Photo photo={photo} alt="판랑 남끄엉 사막" className="aspect-[21/9]" />}
        <div className="p-5 md:p-6">
          <p className="text-[15px] font-bold text-primary-ink">🏜️ 10/6(화) 판랑 사막투어 · {B.confirmed ? "예약 전 브리핑" : "예약 브리핑"}</p>
          <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">{B.verdict.title}</h2>
          <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-ink">
            {B.verdict.why.map((w) => (
              <li key={w}>✔️ {w}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-[14px] leading-relaxed text-ink-2">🔁 {B.verdict.backup}</p>
          {B.verdict.alt && (
            <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-[14px] leading-relaxed text-ink">{B.verdict.alt}</p>
          )}

          {!B.confirmed && check && toggle && <DoneCheck checked={check.checked} onToggle={toggle} />}
          <p className="mt-2 text-[12px] text-ink-3">{B.status}</p>
        </div>
      </section>

      {B.faceoff && <FaceOffSection f={B.faceoff} />}

      {/* 마감 */}
      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">⏰ 마감 날짜</h3>
        <ol className="mt-2 space-y-2">
          {B.deadlines.map((d) => (
            <li key={d.date + d.text} className="flex gap-3 text-[14px] leading-snug">
              <span className="w-16 shrink-0 font-bold text-accent tabular-nums">{d.date}</span>
              <span className="text-ink">{d.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 우리 조건 */}
      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">📌 우리 조건 (업체에 그대로 말할 것)</h3>
        <dl className="mt-2 divide-y divide-line">
          {B.conditions.map((c) => (
            <div key={c.label} className="flex gap-3 py-2 text-[14px] leading-snug">
              <dt className="w-20 shrink-0 font-semibold text-ink-3">{c.label}</dt>
              <dd className="min-w-0 text-ink">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 업체 비교 */}
      <section className="space-y-3">
        <h3 className="px-1 text-[19px] font-bold tracking-tight">🔍 업체 비교 ({B.vendors.length}곳)</h3>
        {B.scheduleNote && <p className="px-1 text-[13px] leading-relaxed text-primary-ink">📅 {B.scheduleNote}</p>}
        {B.vendors.map((v) => (
          <VendorCard key={v.id} v={v} />
        ))}
        {B.others && <p className="px-1 text-[13px] leading-relaxed text-ink-3">{B.others}</p>}
      </section>

      {/* 현지 업체 (카톡 직접 예약) */}
      {B.local && <LocalSection local={B.local} />}

      {/* 1순위 예약 방법 */}
      {DESERT?.howTo && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">🥇 1순위 예약하기 — {B.vendors[0]?.name}</h3>
          <HowToBox title="📱 예약 방법" steps={DESERT.howTo} texts={DESERT.messages ?? []} />
        </section>
      )}

      {/* 예약 전·후 확인할 것 */}
      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">💬 카톡으로 꼭 받아 둘 답</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
          {B.ask.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </section>
    </>
  );

  return (
    <div className="space-y-4">
      {B.confirmed && <ConfirmedCard c={B.confirmed} photo={photo} checked={check?.checked} onToggle={toggle} />}
      {!B.confirmed && research}

      {/* 당일 동선 (일정 탭과 같은 데이터) */}
      {day && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">🕖 당일 동선 · {day.title}</h3>
          {B.route && (
            <a className={`${btn.soft} mt-3 w-full`} href={B.route.url} target="_blank" rel="noopener noreferrer">
              🗺️ {B.route.label}
            </a>
          )}
          <ol className="mt-3 space-y-1.5">
            {day.items
              .filter((i) => i.time < "13:30")
              .map((i) => (
                <li key={i.id} className="flex gap-3 text-[14px] leading-snug">
                  <span className="w-12 shrink-0 font-bold text-ink tabular-nums">{i.time}</span>
                  <span className="min-w-0 text-ink-2">{i.title}</span>
                </li>
              ))}
          </ol>
        </section>
      )}

      {/* 10/5 밤 체크리스트 */}
      {B.nightBefore && B.nightBefore.length > 0 && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">🌙 10/5(월) 밤 체크리스트</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
            {B.nightBefore.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>
      )}

      {/* 날씨 · 비 오면 */}
      {B.weather && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">☔ 날씨 · 비 오면</h3>
          <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-[14px] leading-relaxed text-ink">🌤️ {B.weather.snapshot}</p>
          <ul className="mt-3 space-y-1.5 text-[14px] leading-relaxed text-ink">
            {B.weather.plan.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] font-bold text-ink-2">비 올 때 업체 규정</p>
          <ul className="mt-1 space-y-1.5 text-[13px] leading-relaxed text-ink-2">
            {B.weather.policies.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] font-bold text-ink-2">언제 확인할까</p>
          <ol className="mt-1 space-y-1.5">
            {B.weather.checkpoints.map((c) => (
              <li key={c.date} className="flex gap-3 text-[13px] leading-snug">
                <span className="w-20 shrink-0 font-bold text-accent">{c.date}</span>
                <span className="min-w-0 text-ink">{c.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[12px] text-ink-4">{B.weather.sources}</p>
        </section>
      )}

      {/* 이럴 땐 */}
      {B.cases && B.cases.length > 0 && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">🚨 이럴 땐</h3>
          <div className="mt-2 space-y-2">
            {B.cases.map((c) => (
              <details key={c.title} className="rounded-2xl bg-surface-2 px-4 py-3">
                <summary className="cursor-pointer text-[15px] font-bold text-ink">{c.title}</summary>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
                  {c.steps.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 준비물 */}
      <section className={`${card} p-5`}>
        <h3 className="text-[17px] font-bold">🎒 4살 아이 준비물</h3>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[14px] leading-snug text-ink sm:grid-cols-2">
          {B.packing.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
        {DESERT?.addOns && DESERT.addOns.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-[14px] font-bold text-ink-2">🧩 같이 묶이는 곳 (이번엔 빼요)</summary>
            <AddOnList addOns={DESERT.addOns} />
          </details>
        )}
      </section>

      {/* 이렇게 생겼어요 — 자유 라이선스 사진 + 실제 후기 사진 링크 */}
      {B.gallery && B.gallery.length > 0 && (
        <section className={`${card} p-5`}>
          <h3 className="text-[17px] font-bold">📸 이렇게 생겼어요</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {B.gallery.map((g) => (
              <figure key={g.id}>
                <Photo photo={desertPhoto(g.id)} alt={g.title} className="aspect-[4/3]" />
                <figcaption className="mt-1.5">
                  <p className="text-[15px] font-bold text-ink">{g.title}</p>
                  <p className="text-[13px] leading-relaxed text-ink-2">{g.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            위 사진은 자유 라이선스 예시 사진이라 판랑 남끄엉과 다른 사구도 섞여 있어요. 실제 판랑 모습은 아래 후기에서 보세요.
          </p>
          {B.sceneLinks && B.sceneLinks.length > 0 && <LinkList title="📷 아이랑 다녀온 실제 후기 사진" links={B.sceneLinks} />}
        </section>
      )}

      {/* 예약 전 비교 자료 — 확정 뒤엔 접어 둔다 */}
      {B.confirmed && (
        <details className={`${card} p-5`}>
          <summary className="cursor-pointer text-[16px] font-bold text-ink-2">📚 예약 전에 비교했던 자료 (참고)</summary>
          <div className="mt-4 space-y-4">{research}</div>
        </details>
      )}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        {B.updatedAt} 기준 · {B.sources}
      </p>
    </div>
  );
}

/** ✅ 예약 확정 카드 — 확정 내용 · 카톡 버튼 · 전날까지 할 일 */
function ConfirmedCard({
  c,
  photo,
  checked,
  onToggle,
}: {
  c: NonNullable<Briefing["confirmed"]>;
  photo?: PhotoInfo;
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className={`${card} overflow-hidden ring-2 ring-primary`}>
      {photo && <Photo photo={photo} alt="판랑 남끄엉 사막" className="aspect-[21/9]" />}
      <div className="p-5 md:p-6">
        <p className="text-[15px] font-bold text-primary-ink">🏜️ 10/6(화) 판랑 사막투어 · ✅ 예약 확정</p>
        <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-tight">{c.title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{c.summary}</p>
        <dl className="mt-3 divide-y divide-line rounded-2xl bg-surface-2 px-3">
          {c.rows.map((r) => (
            <div key={r.label} className="flex gap-3 py-2 text-[14px] leading-snug">
              <dt className="w-12 shrink-0 font-semibold text-ink-3">{r.label}</dt>
              <dd className="min-w-0 text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
        <a className={`${btn.primary} mt-3 w-full`} href={c.chatUrl} target="_blank" rel="noopener noreferrer">
          HT나트랑 카톡 열기
        </a>
        <div className="mt-3 rounded-2xl bg-primary-soft p-3">
          <p className="text-[14px] font-bold text-primary-ink">📋 전날(10/5)까지 할 일</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
            {c.dayBefore.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>
        {checked !== undefined && onToggle && <DoneCheck checked={checked} onToggle={onToggle} />}
        <p className="mt-2 text-[12px] text-ink-3">{c.confirmedAt}</p>
      </div>
    </section>
  );
}

/** 예약 완료 체크 (준비물 탭 예약 목록과 같은 칸) */
function DoneCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <label className="press mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-primary-soft px-4">
      <input type="checkbox" checked={checked} onChange={onToggle} aria-label="사막투어 예약 완료" />
      <span className="text-[15px] font-bold text-primary-ink">
        {checked ? "예약 완료 ✓" : "예약하면 체크 (준비물 탭 예약 목록과 같이 바뀌어요)"}
      </span>
    </label>
  );
}

/** 현지 1·2위 최종 비교 — 항목마다 두 업체를 나란히, 앞서는 쪽을 표시 */
function FaceOffSection({ f }: { f: FaceOff }) {
  const cell = (on: boolean) => `rounded-xl p-2.5 text-[13px] leading-snug ${on ? "bg-primary-soft text-ink ring-1 ring-primary" : "bg-surface-2 text-ink-2"}`;
  return (
    <section className={`${card} p-5`}>
      <h3 className="text-[17px] font-bold">{f.title}</h3>
      <p className="mt-2 rounded-2xl bg-accent-soft p-3 text-[15px] leading-snug font-bold text-ink">👉 {f.verdict}</p>
      {f.contact && <ContactBox c={f.contact} />}
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink">
        {f.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[13px] font-bold text-ink-3">
        <span>현지 코이팜</span>
        <span>HT나트랑</span>
      </div>
      <ul className="mt-1 space-y-2.5">
        {f.rows.map((r) => (
          <li key={r.item}>
            <p className="text-[13px] font-bold text-ink">
              {r.item} {r.win === "same" ? <span className="font-normal text-ink-3">· 비슷</span> : null}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <p className={cell(r.win === "a")}>{r.win === "a" && "✅ "}{r.a}</p>
              <p className={cell(r.win === "b")}>{r.win === "b" && "✅ "}{r.b}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">🕖 {f.timing}</p>
      <ul className="mt-3 space-y-1.5 rounded-2xl bg-surface-2 p-3 text-[13px] leading-relaxed text-ink">
        {f.caution.map((c) => (
          <li key={c}>⚠️ {c}</li>
        ))}
      </ul>
      <CopyBlock
        label="💬 확정 전에 두 업체에 보낼 질문 (복사)"
        text={[...f.questions.map((q, i) => `${i + 1}. ${q}`), "", ...f.extra].join("\n")}
      />
      <p className="mt-2 text-[12px] leading-relaxed text-ink-4">{f.sources}</p>
    </section>
  );
}

/** 📱 추천 업체 연락 — 카톡 채널 버튼 · ID · 그대로 보낼 예약 문구 */
function ContactBox({ c }: { c: NonNullable<FaceOff["contact"]> }) {
  return (
    <div className="mt-3 rounded-2xl bg-primary-soft p-4">
      <p className="text-[15px] font-bold text-primary-ink">📱 {c.name} 예약은 카카오톡으로 해요</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a className={`${btn.primary} w-full`} href={c.chatUrl} target="_blank" rel="noopener noreferrer">
          카톡 1:1 채팅 열기
        </a>
        <a className={`${btn.soft} w-full bg-surface`} href={c.channelUrl} target="_blank" rel="noopener noreferrer">
          채널 보기 · 친구 추가
        </a>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink">
        채널 이름 <b>{c.channelName}</b> · 카톡 ID <b>{c.kakaoId}</b>
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
        {c.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <CopyBlock label="💬 HT나트랑에 보낼 예약 문구 (복사)" text={c.message} />
      <p className="mt-2 text-[12px] leading-relaxed text-ink-3">{c.note}</p>
    </div>
  );
}

/** 사진이 많은 후기·상품 페이지 링크 목록 */
function LinkList({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <div className="mt-3 rounded-2xl bg-surface-2 p-3">
      <p className="text-[14px] font-bold text-ink-2">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] leading-snug text-primary-ink underline underline-offset-2"
            >
              {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 긴 설명을 폰에서 읽기 쉽게 문장 단위로 나눈다 (~요. 끝에서) */
const sentences = (text: string) =>
  text
    .split(/(?<=요\.)\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

/** 카톡으로 직접 예약하는 현지 업체 — 후기 많은 순서, 그대로 보낼 카톡 문구, 차만 빌리는 방법 */
function LocalSection({ local }: { local: LocalBriefing }) {
  return (
    <section className="space-y-3">
      <h3 className="px-1 text-[19px] font-bold tracking-tight">🚐 현지 업체 · 카톡 직접 예약 ({local.vendors.length}곳)</h3>
      <div className={`${card} p-5`}>
        <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink">
          {sentences(local.intro).map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
        <div className="mt-3 rounded-2xl bg-primary-soft p-3">
          <p className="text-[14px] font-bold text-primary-ink">👍 추천</p>
          <ul className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-ink">
            {sentences(local.recommendation).map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
        {local.kakaoMessage && <CopyBlock label="💬 현지 업체에 보낼 카톡 문구 (복사)" text={local.kakaoMessage} />}
      </div>
      {local.vendors.map((v, i) => (
        <VendorCard key={v.id} v={v} badge={`현지 ${i + 1}`} defaultOpen={false} />
      ))}
      {local.noReviews && local.noReviews.length > 0 && (
        <div className={`${card} p-5`}>
          <p className="text-[14px] font-bold text-ink-2">🤔 2026 후기를 못 찾은 곳</p>
          <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-ink-2">
            {local.noReviews.map((n) => (
              <li key={n.name}>
                <b className="text-ink">{n.name}</b> — {n.note}
              </li>
            ))}
          </ul>
        </div>
      )}
      {local.diy && (
        <details className={`${card} p-5`}>
          <summary className="cursor-pointer text-[15px] font-bold text-ink">🚗 차만 빌리고 지프는 현장에서 (직접 하기)</summary>
          <p className="mt-2 text-[14px] leading-relaxed text-ink">{local.diy.summary}</p>
          <dl className="mt-2 divide-y divide-line rounded-2xl bg-surface-2 px-3">
            {(
              [
                ["차", local.diy.carCost],
                ["지프", local.diy.jeepCost],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex gap-3 py-2 text-[13px] leading-snug">
                <dt className="w-10 shrink-0 font-semibold text-ink-3">{label}</dt>
                <dd className="min-w-0 text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
            {local.diy.howTo.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
          <ul className="mt-2 rounded-2xl bg-accent-soft p-3 text-[13px] leading-relaxed text-ink">
            {local.diy.risks.map((r) => (
              <li key={r}>⚠️ {r}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function VendorCard({ v, badge, defaultOpen }: { v: Vendor; badge?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? v.rank === 1);
  const rows: [string, string | undefined][] = [
    ["차량", v.vehicle],
    ["짐", v.luggage],
    ["래디슨 드랍", v.radissonDrop],
    ["출발 시간", v.startTime],
    ["포함", v.includes],
    ["불포함", v.excludes],
    ["아이", v.kid],
    ["카시트", v.childSeat],
    ["취소", v.cancel],
    ["결제", v.payment],
    ["평점", v.rating],
    ["최근 후기", v.reviews],
    ["카톡", v.kakao],
  ];
  const top = !badge && v.rank === 1;
  return (
    <article className={`${card} p-5 ${top ? "ring-2 ring-accent" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span className={`rounded-lg px-2 py-0.5 ${top ? "bg-accent text-white" : "bg-primary-soft text-primary-ink"}`}>
          {badge ?? `${v.rank}순위`}
        </span>
        {v.reviewCount !== undefined && <span className="text-ink-3">· 2026 후기 {v.reviewCount}개</span>}
        <span className="text-ink-3">{v.platform}</span>
      </div>
      <h4 className="mt-1.5 text-[19px] leading-snug font-bold tracking-tight">{v.name}</h4>
      <p className="mt-1 text-[17px] leading-snug font-bold text-primary-ink">{v.total}</p>
      {v.changed && (
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
          <b className={v.changed.startsWith("변동 없") ? "text-ink-3" : "text-accent"}>🔄 9/27 대비</b> {v.changed}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press mt-2 inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3 text-[13px] font-semibold text-ink-2"
      >
        {open ? "접기 ▲" : "조건 자세히 ▼"}
      </button>
      {open && (
        <>
          <dl className="mt-3 divide-y divide-line rounded-2xl bg-surface-2 px-3">
            {rows
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex gap-3 py-2 text-[13px] leading-snug">
                  <dt className="w-16 shrink-0 font-semibold text-ink-3">{label}</dt>
                  <dd className="min-w-0 text-ink">{value}</dd>
                </div>
              ))}
          </dl>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[13px] leading-relaxed sm:grid-cols-2">
            <ul className="rounded-2xl bg-primary-soft p-3 text-ink">
              {v.pros.map((p) => (
                <li key={p}>👍 {p}</li>
              ))}
            </ul>
            <ul className="rounded-2xl bg-accent-soft p-3 text-ink">
              {v.cons.map((c) => (
                <li key={c}>⚠️ {c}</li>
              ))}
            </ul>
          </div>
          {v.note && <p className="mt-2 text-[13px] leading-relaxed text-ink-2">💡 {v.note}</p>}
          {/* 1순위는 아래 '1순위 예약하기'에 단계·문구가 있어서, 나머지 업체만 여기서 예약 방법을 보여 준다 */}
          {v.rank > 1 && v.howTo && v.howTo.length > 0 && (
            <div className="mt-3 rounded-2xl bg-accent-soft p-3">
              <p className="text-[14px] font-bold text-accent">📱 이 업체로 예약하는 법</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
                {v.howTo.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            </div>
          )}
          {v.reviewLinks && v.reviewLinks.length > 0 && <LinkList title="📝 후기 보기 (광고·협찬은 표시)" links={v.reviewLinks} />}
          {v.photoLinks && v.photoLinks.length > 0 && <LinkList title="📷 실제 사진 보기 (차량·지프·썰매)" links={v.photoLinks} />}
        </>
      )}
      {v.url && (
        <a className={`${btn.soft} mt-3`} href={v.url} target="_blank" rel="noopener noreferrer">
          예약 페이지 열기 ↗
        </a>
      )}
    </article>
  );
}
