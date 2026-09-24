"use client";

import { useState } from "react";
import { newId } from "@/lib/id";
import {
  addChecklistItem,
  deleteChecklistItem,
  groupChecklist,
  percent,
  toggleChecklistItem,
} from "@/lib/trip";
import type { TripState } from "@/lib/types";
import { btn, card, ProgressBar } from "./ui";

const NEW_GROUP = "__new__";

interface Props {
  state: TripState;
  update: (fn: (s: TripState) => TripState) => void;
}

export default function ChecklistTab({ state, update }: Props) {
  const groups = groupChecklist(state.checklist);
  const checked = state.checklist.filter((c) => c.checked).length;
  const total = state.checklist.length;

  const [text, setText] = useState("");
  const [group, setGroup] = useState(groups[0]?.group ?? NEW_GROUP);
  const [newGroup, setNewGroup] = useState("");
  const targetGroup = group === NEW_GROUP ? newGroup.trim() : group;
  const canAdd = text.trim().length > 0 && targetGroup.length > 0;

  const add = () => {
    if (!canAdd) return;
    update((s) =>
      addChecklistItem(s, { id: newId(), text: text.trim(), group: targetGroup, checked: false }),
    );
    setText("");
    if (group === NEW_GROUP) {
      setGroup(targetGroup);
      setNewGroup("");
    }
  };

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-4 p-5 md:p-7`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink-3">준비물</p>
            <p className="mt-1 text-[24px] font-bold tracking-tight md:text-[26px]">
              {total - checked === 0 ? "다 챙겼어요 🎉" : `${total - checked}개 남았어요`}
            </p>
          </div>
          <span className="text-[15px] font-bold text-primary-ink">
            {checked}/{total}
          </span>
        </div>
        <ProgressBar value={percent({ done: checked, total })} />
        {/* 폰: 이름 한 줄 가득, 아래에 그룹 + 추가 버튼 */}
        <form
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="col-span-2 sm:min-w-48 sm:flex-1">
            <span className="sr-only">준비물 이름</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="추가할 준비물"
              className="min-h-11 w-full"
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">그룹</span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="min-h-12 w-full sm:min-h-11 sm:w-auto"
            >
              {groups.map((g) => (
                <option key={g.group} value={g.group}>
                  {g.group}
                </option>
              ))}
              <option value={NEW_GROUP}>+ 새 그룹…</option>
            </select>
          </label>
          {group === NEW_GROUP && (
            <label className="col-span-2 max-sm:order-last">
              <span className="sr-only">새 그룹 이름</span>
              <input
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="새 그룹 이름"
                className="min-h-11 w-full sm:w-40"
              />
            </label>
          )}
          <button type="submit" className={btn.primary} disabled={!canAdd}>
            추가
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g.group} className={`${card} min-w-0 px-5 pt-5 pb-2`}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">{g.group}</h3>
              <span className="text-[14px] font-semibold text-ink-3">
                {g.checked}/{g.items.length}
              </span>
            </div>
            <ul>
              {g.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <label className="flex min-h-13 flex-1 cursor-pointer items-center gap-3 py-1.5 text-[16px]">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => update((s) => toggleChecklistItem(s, item.id))}
                    />
                    <span
                      className={
                        item.checked ? "text-ink-4 line-through" : "text-ink"
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="press h-11 w-11 shrink-0 rounded-xl text-ink-4 active:bg-surface-2"
                    aria-label={`${item.text} 삭제`}
                    onClick={() => {
                      if (window.confirm(`'${item.text}' 을(를) 목록에서 지울까요?`)) {
                        update((s) => deleteChecklistItem(s, item.id));
                      }
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
