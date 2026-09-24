"use client";

import { useState } from "react";
import { GUIDE } from "@/data/guide";
import type { BlogPost } from "@/lib/guideTypes";
import { card } from "./ui";

export function BlogPostRow({ post }: { post: BlogPost }) {
  return (
    <li>
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="press block rounded-2xl px-3 py-3 active:bg-surface-2"
      >
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
          <span>{post.author}</span>
          {post.date && (
            <>
              <span>·</span>
              <span className="tabular-nums">{post.date}</span>
            </>
          )}
          {post.withKids && (
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[12px] font-bold text-primary-ink">
              아이 동반
            </span>
          )}
        </div>
        <p className="mt-1 text-[16px] font-semibold tracking-tight text-ink underline-offset-2">
          {post.title} <span className="text-ink-4">↗</span>
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{post.summary}</p>
      </a>
    </li>
  );
}

export default function ReviewsTab() {
  const topics = GUIDE.blogTopics;
  const [open, setOpen] = useState<string | null>(topics[0]?.topic ?? null);

  if (topics.length === 0) {
    return (
      <div className={`${card} p-10 text-center text-ink-3`}>
        블로그 후기를 모으고 있어요. 조사가 끝나면 여기에 표시돼요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-[15px] text-ink-3">
        네이버 블로그 등 실제 후기를 모아 요약했어요. 제목을 누르면 원문이 열려요.
      </p>
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        {topics.map((t) => {
          const isOpen = open === t.topic;
          const kids = t.posts.filter((p) => p.withKids).length;
          return (
            <section key={t.topic} className={`${card} overflow-hidden`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : t.topic)}
                aria-expanded={isOpen}
                className="press flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold tracking-tight">{t.topic}</h3>
                  <p className="mt-0.5 text-[13px] text-ink-3">
                    후기 {t.posts.length}개{kids > 0 && ` · 아이 동반 ${kids}개`}
                  </p>
                </div>
                <span className={`text-ink-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                  ⌄
                </span>
              </button>
              <div className="px-5 pb-2">
                <p
                  className={`rounded-2xl bg-surface-2 p-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-2 ${
                    isOpen ? "" : "line-clamp-3"
                  }`}
                >
                  {t.summary}
                </p>
              </div>
              {isOpen && (
                <ul className="px-2 pb-3">
                  {t.posts.map((p, i) => (
                    <BlogPostRow key={`${p.url}-${i}`} post={p} />
                  ))}
                </ul>
              )}
              {!isOpen && <div className="h-3" />}
            </section>
          );
        })}
      </div>
    </div>
  );
}
