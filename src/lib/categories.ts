import type { Category } from "./types";

export const CATEGORIES: readonly Category[] = [
  "sightseeing",
  "food",
  "activity",
  "rest",
  "move",
  "shopping",
  "etc",
];

export interface CategoryMeta {
  label: string;
  emoji: string;
  /** 칩에 쓰는 Tailwind 클래스 (라이트/다크 모두 대비 확보) */
  chipClass: string;
  /** 선택된 상태(폼의 분류 선택 버튼)에 쓰는 테두리 색 */
  ringClass: string;
}

// 토스풍: 옅은 배경 + 진한 글자, 테두리 없음
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  sightseeing: {
    label: "관광",
    emoji: "📸",
    chipClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    ringClass: "ring-blue-500",
  },
  food: {
    label: "식사",
    emoji: "🍜",
    chipClass: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    ringClass: "ring-orange-500",
  },
  activity: {
    label: "액티비티",
    emoji: "🤿",
    chipClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    ringClass: "ring-emerald-500",
  },
  rest: {
    label: "휴식",
    emoji: "🌴",
    chipClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    ringClass: "ring-violet-500",
  },
  move: {
    label: "이동",
    emoji: "🚕",
    chipClass: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    ringClass: "ring-slate-500",
  },
  shopping: {
    label: "쇼핑",
    emoji: "🛍️",
    chipClass: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
    ringClass: "ring-pink-500",
  },
  etc: {
    label: "기타",
    emoji: "📌",
    chipClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    ringClass: "ring-amber-500",
  },
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
