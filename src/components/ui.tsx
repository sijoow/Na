"use client";

import { useEffect, type ReactNode } from "react";

// 토스풍 공통 스타일: 테두리 없는 큰 라운드, 파란 주 버튼, 회색 보조 버튼, 누를 때 살짝 작아짐
export const btn = {
  primary:
    "press inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-40",
  soft: "press inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary-soft px-5 text-[15px] font-semibold text-primary-ink disabled:opacity-40",
  secondary:
    "press inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-surface-2 px-5 text-[15px] font-semibold text-ink-2 active:bg-surface-3 disabled:opacity-40",
  danger:
    "press inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-danger-soft px-5 text-[15px] font-semibold text-danger",
  icon: "press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-ink-3 active:bg-surface-2 disabled:opacity-25",
};

export const card = "rounded-3xl bg-surface";

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** 태블릿/PC에서는 가운데 창, 폰에서는 아래에서 올라오는 바텀시트 */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-[28px] bg-surface shadow-2xl sm:max-w-lg sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 폰 바텀시트 손잡이 */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
          <h2 className="min-w-0 text-xl font-bold tracking-tight">{title}</h2>
          <button type="button" className={`${btn.icon} -mr-2`} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div
          className={`overflow-y-auto overscroll-contain px-5 pt-3 sm:px-6 ${
            footer ? "pb-3" : "pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
          }`}
        >
          {children}
        </div>
        {footer && (
          <div className="flex gap-2 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 [&>*]:flex-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-surface-2 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
