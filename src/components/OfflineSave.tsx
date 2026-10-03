"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import images from "@/data/images.json";
import { btn, card } from "./ui";

// 홈 맨 위 '✈️ 비행기 모드에서도 보기' — 서비스워커(public/sw.js)를 켜고, 모든 탭의 코드·일정·사진을 미리 받아 둔다.
// 한 번 저장한 뒤에는 새 버전이 배포될 때마다(스크립트 주소가 바뀌면) 인터넷이 될 때 조용히 다시 받는다.
// 오프라인에서는 보기 전용: 체크·수정은 인터넷이 돼야 저장되고, 지도 배경·실시간 예보·AI 질문은 안 된다.

// public/sw.js 와 같은 이름이어야 한다
const SHELL = "nt-shell-v1";
const STATIC = "nt-static-v1";
const IMG = "nt-img-v1";
const KEY = "nt-offline-saved";

interface Saved {
  at: number;
  sig: string;
  files: number;
  photos: number;
}
type Status = "unsupported" | "idle" | "saving" | "done" | "error";

/** images.json 안의 모든 사진 주소 */
function photoUrls(): string[] {
  const urls = new Set<string>();
  const walk = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      if (k === "url" && typeof v === "string" && /^https?:/.test(v)) urls.add(v);
      else walk(v);
    }
  };
  walk(images);
  return [...urls];
}

/** 지금 화면이 쓰는 /_next/static 파일 주소 (배포마다 바뀜) */
function staticUrls(): string[] {
  const urls = new Set<string>();
  for (const e of performance.getEntriesByType("resource")) if (e.name.includes("/_next/static/")) urls.add(e.name);
  document.querySelectorAll<HTMLScriptElement>("script[src]").forEach((s) => s.src.includes("/_next/static/") && urls.add(s.src));
  document.querySelectorAll<HTMLLinkElement>("link[href]").forEach((l) => l.href.includes("/_next/static/") && urls.add(l.href));
  return [...urls];
}

/**
 * 받은 JS·CSS 안에 적힌 다른 파일(탭 안에서 늦게 불러오는 코드·글꼴·지도 아이콘)까지 따라가며 모두 저장한다.
 * 화면에 아직 안 뜬 탭의 조각 파일이 빠지면 오프라인에서 그 탭이 안 열리기 때문.
 */
async function saveStaticFiles(seed: string[], cache: Cache, onFile: () => void): Promise<number> {
  const seen = new Set(seed.map((u) => new URL(u, location.origin).href));
  const queue = [...seen];
  for (let u = queue.pop(); u; u = queue.pop()) {
    try {
      if (/\.(?:js|css)(?:\?|$)/.test(u)) {
        const res = await fetch(u);
        if (!res.ok) continue;
        await cache.put(u, res.clone());
        const text = await res.text();
        const found: string[] = [];
        for (const m of text.matchAll(/static\/(?:chunks|media|css)\/[\w.~/-]+?\.(?:js|css|woff2?|png|svg|jpe?g|webp)/g)) {
          found.push(`${location.origin}/_next/${m[0]}`);
        }
        if (u.includes(".css")) {
          for (const m of text.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)) {
            if (!/^(?:data:|#|https?:)/.test(m[1])) found.push(new URL(m[1], u).href);
          }
        }
        for (const f of found) {
          if (!seen.has(f)) {
            seen.add(f);
            queue.push(f);
          }
        }
      } else if (!(await cache.match(u))) {
        await cache.add(u);
      }
    } catch {
      // 한 파일이 실패해도 나머지는 계속 받는다
    }
    onFile();
  }
  return seen.size;
}

/** 배포 버전 표시 — 처음 HTML에 들어 있는 스크립트 주소들로 만든 짧은 값 */
function buildSignature(): string {
  const text = [...document.querySelectorAll<HTMLScriptElement>('script[src*="/_next/static/"]')]
    .map((s) => s.getAttribute("src") ?? "")
    .filter((s) => !s.includes("/chunks/") || s.includes("main") || s.includes("app"))
    .sort()
    .join("|");
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return String(h);
}

function readSaved(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
  } catch {
    return null;
  }
}

const canUse = () => typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window && process.env.NODE_ENV === "production";

const fmt = (t: number) =>
  new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));

export default function OfflineSave({ loaders }: { loaders: (() => Promise<unknown>)[] }) {
  const [saved, setSaved] = useState<Saved | null>(() => (typeof window === "undefined" ? null : readSaved()));
  const [status, setStatus] = useState<Status>(() => (!canUse() ? "unsupported" : readSaved() ? "done" : "idle"));
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current || !canUse()) return;
    running.current = true;
    setStatus("saving");
    setError(null);
    try {
      await navigator.serviceWorker.ready;
      // 1) 모든 탭 코드 받기 (받는 동안 스크립트 태그가 문서에 추가된다)
      await Promise.allSettled(loaders.map((load) => load()));
      const photos = photoUrls();
      // 코드 파일은 따라가며 찾느라 처음엔 개수를 몰라서, 대략 130개로 잡고 진행률을 보여 준다
      let total = 130 + photos.length + 2;
      let done = 0;
      const tick = () => setProgress({ done: ++done, total: Math.max(total, done) });
      setProgress({ done: 0, total });

      const staticCache = await caches.open(STATIC);
      const fileCount = await saveStaticFiles(staticUrls(), staticCache, tick);
      total = fileCount + photos.length + 2;

      // 2) 화면(HTML)과 일정
      const shell = await caches.open(SHELL);
      const [html, trip] = await Promise.all([fetch("/", { cache: "reload" }), fetch("/api/trip", { cache: "no-store" })]);
      if (!html.ok || html.redirected || !trip.ok) throw new Error("화면이나 일정을 받지 못했어요. 로그인 상태와 인터넷을 확인해 주세요.");
      await shell.put("/", html);
      tick();
      await shell.put("/api/trip", trip);
      tick();

      // 3) 사진 — 6장씩 나눠 받기 (다른 사이트 사진이라 no-cors 로 받아 그대로 저장)
      const imgCache = await caches.open(IMG);
      let failed = 0;
      const queue = [...photos];
      await Promise.all(
        Array.from({ length: 6 }, async () => {
          for (let u = queue.shift(); u; u = queue.shift()) {
            try {
              if (!(await imgCache.match(u, { ignoreVary: true }))) {
                const res = await fetch(u, { mode: "no-cors", referrerPolicy: "no-referrer" });
                await imgCache.put(u, res);
              }
            } catch {
              failed++;
            }
            tick();
          }
        }),
      );

      const next: Saved = { at: Date.now(), sig: buildSignature(), files: fileCount, photos: photos.length - failed };
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
      setStatus("error");
    } finally {
      running.current = false;
    }
  }, [loaders]);

  useEffect(() => {
    if (!canUse()) return;
    performance.setResourceTimingBufferSize?.(2000);
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    // 이미 저장한 적이 있고 새 버전이 배포됐으면, 인터넷이 될 때 조용히 다시 받는다 (화면이 다 뜬 뒤에)
    const prev = readSaved();
    if (!prev || !navigator.onLine || prev.sig === buildSignature()) return;
    const timer = setTimeout(() => void run(), 2000);
    return () => clearTimeout(timer);
  }, [run]);

  if (status === "unsupported") return null;

  return (
    <section className={`${card} mb-4 p-4 md:p-5`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 text-[15px] font-bold text-ink">✈️ 비행기 모드에서도 보기</p>
        {status !== "saving" && (
          <button type="button" onClick={() => void run()} className={status === "done" ? btn.secondary : btn.primary}>
            {status === "done" ? "다시 저장" : "📥 오프라인 저장"}
          </button>
        )}
      </div>
      {status === "idle" && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
          한 번 저장해 두면 인터넷 없이도 일정·맛집·네일 디자인·사진을 볼 수 있어요. 와이파이에서 눌러 주세요 (사진 약 {photoUrls().length}장).
        </p>
      )}
      {status === "saving" && (
        <div className="mt-2">
          <p className="text-[13px] font-semibold text-primary-ink tabular-nums">
            저장하는 중… {progress.done} / {progress.total || "?"}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 3}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-3">끝날 때까지 이 화면을 열어 두세요.</p>
        </div>
      )}
      {status === "done" && saved && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
          ✅ {fmt(saved.at)} 저장됨 · 파일 {saved.files}개 · 사진 {saved.photos}장. 비행기에서는 이 주소(홈 화면 아이콘)를 그대로 열면 돼요.
          <span className="block text-[12px] text-ink-3">
            오프라인에서는 보기만 돼요. 체크·수정은 인터넷이 돼야 저장되고, 지도 배경·실시간 예보·AI 질문은 안 돼요.
          </span>
        </p>
      )}
      {status === "error" && <p className="mt-1.5 text-[13px] font-semibold text-danger">{error}</p>}
    </section>
  );
}
