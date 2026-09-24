"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { formatLong, formatShort } from "@/lib/date";
import { newId } from "@/lib/id";
import {
  addItem,
  createPlanItem,
  deleteItem,
  getDayProgress,
  moveItemToDay,
  reorderItem,
  sortDayByTime,
  swapDays,
  toggleItemDone,
  updateDay,
  updateItem,
} from "@/lib/trip";
import type { Day, PlanItem, PlanItemInput, TripState } from "@/lib/types";
import { btn, card, Modal } from "./ui";

interface Props {
  state: TripState;
  day: Day;
  todayDayId: string | null;
  onSelectDay: (dayId: string) => void;
  update: (fn: (s: TripState) => TripState) => void;
}

type Dialog =
  | { kind: "add" }
  | { kind: "edit"; item: PlanItem }
  | { kind: "more"; item: PlanItem }
  | { kind: "swap" }
  | null;

export default function ScheduleTab({ state, day, todayDayId, onSelectDay, update }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const chipsRef = useRef<HTMLElement>(null);

  // 폰: 고른 날짜 칩이 가운데 오도록 칩 줄을 옆으로 스크롤
  useEffect(() => {
    const box = chipsRef.current;
    const chip = box?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!box || !chip || box.clientWidth === 0) return;
    box.scrollTo({ left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [day.id]);
  const dayIndex = state.days.findIndex((d) => d.id === day.id);
  const otherDays = state.days.filter((d) => d.id !== day.id);

  return (
    <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
      {/* 태블릿/PC: 왼쪽 날짜 목록 */}
      <aside className="hidden md:block">
        <nav className="sticky top-28 space-y-1.5" aria-label="날짜 선택">
          {state.days.map((d, i) => {
            const { done, total } = getDayProgress(d);
            const active = d.id === day.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDay(d.id)}
                aria-current={active ? "true" : undefined}
                className={`press w-full rounded-2xl px-4 py-3 text-left ${
                  active ? "bg-surface shadow-sm" : "active:bg-surface/60"
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span className={`font-bold ${active ? "text-primary-ink" : "text-ink-3"}`}>
                    D{i + 1} · {formatShort(d.date)}
                    {d.id === todayDayId && " · 오늘"}
                  </span>
                  <span className="text-ink-4">
                    {done}/{total}
                  </span>
                </div>
                <div className={`mt-0.5 truncate text-[15px] font-bold ${active ? "text-ink" : "text-ink-2"}`}>
                  {d.title || "(제목 없음)"}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 폰: 가로 스크롤 날짜 칩 — 헤더 아래에 붙어 있어서 스크롤해도 날짜를 바로 바꿀 수 있다 */}
      <nav
        ref={chipsRef}
        aria-label="날짜 선택"
        className="sticky top-[var(--app-header-h)] z-20 -mx-4 mb-3 flex gap-2 overflow-x-auto bg-page/95 px-4 py-2 backdrop-blur-md no-scrollbar md:hidden"
      >
        {state.days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              onSelectDay(d.id);
              window.scrollTo({ top: 0 });
            }}
            aria-current={d.id === day.id ? "true" : undefined}
            className={`press min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap ${
              d.id === day.id ? "bg-ink text-page" : "bg-surface text-ink-2"
            }`}
          >
            D{i + 1} {formatShort(d.date)}
            {d.id === todayDayId && " · 오늘"}
          </button>
        ))}
      </nav>

      <section className="min-w-0 space-y-4">
        <div className={`${card} space-y-3 p-5 md:p-6`}>
          <p className="text-[15px] font-bold text-primary-ink">
            D{dayIndex + 1} · {formatLong(day.date)}
            {day.id === todayDayId && " · 오늘"}
          </p>
          <label className="block">
            <span className="sr-only">이 날의 제목</span>
            <input
              value={day.title}
              onChange={(e) => update((s) => updateDay(s, day.id, { title: e.target.value }))}
              placeholder="이 날의 제목"
              className="w-full !bg-transparent !px-0 text-[24px] font-bold tracking-tight focus:!border-transparent"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-[15px] font-semibold text-ink-3">🏨 숙소</span>
            <input
              value={day.lodging}
              onChange={(e) => update((s) => updateDay(s, day.id, { lodging: e.target.value }))}
              placeholder="숙소"
              className="w-full"
            />
          </label>
          {/* 폰: 추가 버튼은 한 줄 가득, 나머지 둘은 반씩 */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-wrap">
            <button
              type="button"
              className={`${btn.primary} col-span-2`}
              onClick={() => setDialog({ kind: "add" })}
            >
              + 일정 추가
            </button>
            <button
              type="button"
              className={`${btn.secondary} max-sm:px-2 max-sm:text-[14px]`}
              onClick={() => update((s) => sortDayByTime(s, day.id))}
              disabled={day.items.length < 2}
            >
              🕘 시간순 정렬
            </button>
            <button
              type="button"
              className={`${btn.soft} max-sm:px-2 max-sm:text-[14px]`}
              onClick={() => setDialog({ kind: "swap" })}
            >
              🔁 다른 날과 바꾸기
            </button>
          </div>
        </div>

        {day.items.length === 0 ? (
          <div className={`${card} p-10 text-center text-ink-3`}>
            아직 일정이 없어요. &lsquo;+ 일정 추가&rsquo;를 눌러 보세요.
          </div>
        ) : (
          <ul className={`${card} divide-y divide-line px-2 md:px-3`}>
            {day.items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                isFirst={i === 0}
                isLast={i === day.items.length - 1}
                onToggle={() => update((s) => toggleItemDone(s, day.id, item.id))}
                onEdit={() => setDialog({ kind: "edit", item })}
                onMove={(dir) => update((s) => reorderItem(s, day.id, item.id, dir))}
                onMore={() => setDialog({ kind: "more", item })}
              />
            ))}
          </ul>
        )}
      </section>

      {dialog?.kind === "add" && (
        <ItemFormDialog
          title="일정 추가"
          onClose={close}
          onSubmit={(input) => {
            update((s) => addItem(s, day.id, createPlanItem(newId(), input)));
            close();
          }}
        />
      )}
      {dialog?.kind === "edit" && (
        <ItemFormDialog
          title="일정 수정"
          initial={dialog.item}
          onClose={close}
          onSubmit={(input) => {
            update((s) =>
              updateItem(s, day.id, dialog.item.id, {
                time: input.time,
                title: input.title.trim(),
                memo: input.memo.trim(),
                category: input.category,
              }),
            );
            close();
          }}
        />
      )}
      {dialog?.kind === "more" && (
        <Modal title={dialog.item.title} onClose={close}>
          <div className="space-y-5">
            <button
              type="button"
              className={`${btn.soft} w-full`}
              onClick={() => setDialog({ kind: "edit", item: dialog.item })}
            >
              ✏️ 수정하기
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${btn.secondary} flex-1`}
                onClick={() => update((s) => reorderItem(s, day.id, dialog.item.id, -1))}
              >
                ▲ 위로
              </button>
              <button
                type="button"
                className={`${btn.secondary} flex-1`}
                onClick={() => update((s) => reorderItem(s, day.id, dialog.item.id, 1))}
              >
                ▼ 아래로
              </button>
            </div>
            <div>
              <p className="mb-2 text-[15px] font-semibold text-ink-3">다른 날로 옮기기</p>
              <div className="grid grid-cols-2 gap-2">
                {otherDays.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`${btn.secondary} justify-start text-left`}
                    onClick={() => {
                      update((s) => moveItemToDay(s, day.id, dialog.item.id, d.id));
                      close();
                    }}
                  >
                    D{state.days.indexOf(d) + 1} {formatShort(d.date)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={`${btn.danger} w-full`}
              onClick={() => {
                if (window.confirm(`'${dialog.item.title}' 일정을 삭제할까요?`)) {
                  update((s) => deleteItem(s, day.id, dialog.item.id));
                  close();
                }
              }}
            >
              🗑️ 삭제
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === "swap" && (
        <Modal title="다른 날과 일정 바꾸기" onClose={close}>
          <p className="mb-4 text-[15px] text-ink-2">
            제목과 일정만 서로 바뀌어요. 날짜와 숙소는 그대로예요.
          </p>
          <div className="space-y-2">
            {otherDays.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`${btn.secondary} w-full justify-start text-left`}
                onClick={() => {
                  const label = `D${state.days.indexOf(d) + 1} ${formatShort(d.date)}`;
                  if (window.confirm(`${label} '${d.title}' 와(과) 일정을 바꿀까요?`)) {
                    update((s) => swapDays(s, day.id, d.id));
                    close();
                  }
                }}
              >
                <span className="shrink-0 font-bold text-primary-ink">
                  D{state.days.indexOf(d) + 1} {formatShort(d.date)}
                </span>
                <span className="truncate">{d.title}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onMove,
  onMore,
}: {
  item: PlanItem;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
  onMore: () => void;
}) {
  const meta = CATEGORY_META[item.category];
  return (
    <li className={`flex items-start gap-1 py-2.5 md:gap-3 md:py-4 ${item.done ? "opacity-50" : ""}`}>
      <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={item.done}
          onChange={onToggle}
          aria-label={`${item.title} 완료`}
        />
      </label>
      {/* 내용을 누르면 바로 수정 (폰에서는 연필 버튼 대신) */}
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left active:bg-surface-2"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-bold tabular-nums text-ink md:text-[17px]">
            {item.time || "--:--"}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold ${meta.chipClass}`}>
            {meta.emoji} {meta.label}
          </span>
        </span>
        <span
          className={`mt-1 block text-[17px] leading-snug font-semibold tracking-tight text-ink ${
            item.done ? "line-through" : ""
          }`}
        >
          {item.title}
        </span>
        {item.memo && (
          <span className="mt-1 block text-[15px] leading-relaxed whitespace-pre-line text-ink-3 md:text-[14px]">
            {item.memo}
          </span>
        )}
      </button>
      <div className="flex shrink-0 gap-0.5">
        <button type="button" className={`${btn.icon} max-sm:hidden`} onClick={onEdit} aria-label="수정">
          ✏️
        </button>
        <button
          type="button"
          className={`${btn.icon} max-sm:hidden`}
          onClick={() => onMove(-1)}
          disabled={isFirst}
          aria-label="위로"
        >
          ▲
        </button>
        <button
          type="button"
          className={`${btn.icon} max-sm:hidden`}
          onClick={() => onMove(1)}
          disabled={isLast}
          aria-label="아래로"
        >
          ▼
        </button>
        <button type="button" className={btn.icon} onClick={onMore} aria-label={`${item.title} 더보기`}>
          ⋯
        </button>
      </div>
    </li>
  );
}

function ItemFormDialog({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: PlanItem;
  onClose: () => void;
  onSubmit: (input: PlanItemInput) => void;
}) {
  const [form, setForm] = useState<PlanItemInput>({
    time: initial?.time ?? "",
    title: initial?.title ?? "",
    memo: initial?.memo ?? "",
    category: initial?.category ?? "sightseeing",
  });
  const canSave = form.title.trim().length > 0;
  const submit = () => {
    if (canSave) onSubmit({ ...form, time: form.time.slice(0, 5) });
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose}>
            취소
          </button>
          <button type="button" className={btn.primary} onClick={submit} disabled={!canSave}>
            저장
          </button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex gap-3">
          <label className="block w-36 shrink-0">
            <span className="mb-1.5 block text-[14px] font-semibold text-ink-3">시간</span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full"
            />
          </label>
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block text-[14px] font-semibold text-ink-3">제목</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 빈원더스"
              className="w-full"
              autoFocus
            />
          </label>
        </div>
        {form.time && (
          <button
            type="button"
            className="text-[14px] font-medium text-ink-3 underline"
            onClick={() => setForm({ ...form, time: "" })}
          >
            시간 지우기
          </button>
        )}
        <fieldset>
          <legend className="mb-1.5 text-[14px] font-semibold text-ink-3">분류</legend>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c];
              const selected = form.category === c;
              // 폰: 이모지 위·이름 아래로 모든 칸 모양을 맞춤 ('액티비티'처럼 긴 이름도 한 줄)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  aria-pressed={selected}
                  className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[14px] font-bold sm:min-h-12 sm:flex-row sm:gap-1 ${
                    selected ? `${meta.chipClass} ring-2 ${meta.ringClass}` : "bg-surface-2 text-ink-3"
                  }`}
                >
                  <span aria-hidden>{meta.emoji}</span>
                  <span className="whitespace-nowrap">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-semibold text-ink-3">메모</span>
          <textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            rows={3}
            placeholder="준비물, 예약번호, 주의할 점 등"
            className="w-full"
          />
        </label>
      </form>
    </Modal>
  );
}
