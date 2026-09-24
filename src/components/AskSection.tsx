"use client";

import { useState } from "react";
import { btn, card } from "./ui";

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  webSearches: number;
}

interface QA {
  q: string;
  a: string;
  web: boolean;
  model?: string;
  usage?: Usage;
  costUsd?: number | null;
  error?: boolean;
}

const EXAMPLES = [
  "10/5 빈원더스에서 4살 아이랑 뭘 먼저 타면 좋을까?",
  "캄란 리조트에서 판랑 사막투어 갈 때 챙길 것",
  "비 오면 10/7 일정을 어떻게 바꾸면 좋을까?",
];
const KRW_PER_USD = 1400; // 대략 환산용

export default function AskSection() {
  const [question, setQuestion] = useState("");
  const [web, setWeb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QA[]>([]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, web }),
      });
      const data = (await res.json()) as {
        answer?: string;
        error?: string;
        model?: string;
        usage?: Usage;
        costUsd?: number | null;
      };
      setHistory((h) => [
        res.ok
          ? { q: text, a: data.answer ?? "", web, model: data.model, usage: data.usage, costUsd: data.costUsd }
          : { q: text, a: data.error ?? "요청에 실패했어요.", web, error: true },
        ...h,
      ]);
      if (res.ok) setQuestion("");
    } catch {
      setHistory((h) => [{ q: text, a: "네트워크 오류예요. 다시 시도해 주세요.", web, error: true }, ...h]);
    } finally {
      setLoading(false);
    }
  };

  const totalUsd = history.reduce((sum, h) => sum + (h.costUsd ?? 0), 0);

  return (
    <div className="space-y-4">
      <section className={`${card} space-y-3 p-5 md:p-6`}>
        <div>
          <p className="text-[15px] font-semibold text-ink-3">AI에게 물어보기</p>
          <p className="mt-1 text-[14px] text-ink-2">우리 일정·숙소·항공편을 알고 답해요. 웹 검색을 켜면 최신 정보도 찾아봐요.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="sr-only">질문</span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="예: 10/4 저녁에 아이랑 가기 좋은 해산물 식당?"
              className="w-full"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-semibold text-ink-2">
              <input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} />
              웹 검색 포함 (조금 더 비쌈)
            </label>
            <button type="submit" className={`${btn.primary} ml-auto`} disabled={loading || !question.trim()}>
              {loading ? "생각 중…" : "물어보기"}
            </button>
          </div>
        </form>
        {history.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className={`${btn.secondary} min-h-10 px-3 text-left text-[13px]`} onClick={() => setQuestion(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <p className="px-1 text-[13px] text-ink-3">
          이번 화면에서 쓴 비용 약 ${totalUsd.toFixed(4)} (≈ {Math.round(totalUsd * KRW_PER_USD).toLocaleString("ko-KR")}원)
        </p>
      )}

      {history.map((h, i) => (
        <article key={history.length - i} className={`${card} p-5 md:p-6`}>
          <p className="text-[15px] font-bold text-ink">Q. {h.q}</p>
          <p className={`mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${h.error ? "text-danger" : "text-ink"}`}>
            {h.a}
          </p>
          {h.usage && (
            <p className="mt-3 border-t border-line pt-2 text-[12px] text-ink-3 tabular-nums">
              {h.model} · 입력 {h.usage.input.toLocaleString("ko-KR")} + 캐시 {h.usage.cacheRead.toLocaleString("ko-KR")} · 출력{" "}
              {h.usage.output.toLocaleString("ko-KR")} 토큰
              {h.usage.webSearches > 0 && ` · 웹검색 ${h.usage.webSearches}회`}
              {typeof h.costUsd === "number" &&
                ` · 약 $${h.costUsd.toFixed(4)} (≈ ${Math.round(h.costUsd * KRW_PER_USD).toLocaleString("ko-KR")}원)`}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
