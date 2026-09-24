"use client";

// 화면 ↔ 서버(data/trip.json) 동기화 훅.
// - 수정은 화면에 바로 반영하고(낙관적 업데이트), 잠시 뒤(디바운스) PUT으로 저장한다.
// - 저장할 게 없을 때는 5초마다 / 창에 다시 들어올 때 GET으로 확인해서,
//   다른 기기나 Claude가 파일을 고쳤으면 새 내용으로 바꾼다.
// - 서버 버전이 달라 저장이 거절되면(409) 서버 내용을 불러오고 알려준다.

import { useCallback, useEffect, useRef, useState } from "react";
import type { TripPayload, TripState } from "./types";

const SAVE_DELAY_MS = 600;
const POLL_MS = 5000;
const API = "/api/trip";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface TripSync {
  state: TripState | null;
  loadError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  notice: string | null;
  update: (fn: (state: TripState) => TripState) => void;
  retrySave: () => void;
  reload: () => void;
  dismissNotice: () => void;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // 본문이 JSON이 아니면 상태 코드로 대신한다
  }
  return `서버 오류 (${res.status})`;
}

async function fetchTrip(): Promise<TripPayload> {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as TripPayload;
}

export function useTripSync(): TripSync {
  const [state, setState] = useState<TripState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stateRef = useRef<TripState | null>(null);
  const versionRef = useRef<string | null>(null);
  /** 아직 저장 요청을 보내지 않은 수정이 있는지 */
  const dirtyRef = useRef(false);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyServer = useCallback((payload: TripPayload, message: string | null) => {
    stateRef.current = payload.state;
    versionRef.current = payload.version;
    setState(payload.state);
    if (message) setNotice(message);
  }, []);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // 이미 저장 중이면 그 저장이 끝난 뒤 아래 반복문이 남은 수정을 이어서 저장한다
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      while (dirtyRef.current) {
        const snapshot = stateRef.current;
        const baseVersion = versionRef.current;
        if (!snapshot || baseVersion === null) break;
        dirtyRef.current = false;
        setSaveStatus("saving");
        try {
          const res = await fetch(API, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: snapshot, baseVersion }),
          });
          if (res.status === 409) {
            const current = (await res.json()) as TripPayload;
            dirtyRef.current = false;
            applyServer(current, "다른 곳에서 바뀐 내용을 불러왔어요");
            setSaveStatus("saved");
            setSaveError(null);
            break;
          }
          if (!res.ok) throw new Error(await readError(res));
          const saved = (await res.json()) as TripPayload;
          versionRef.current = saved.version;
          setSaveError(null);
          if (!dirtyRef.current) setSaveStatus("saved");
        } catch (error) {
          dirtyRef.current = true;
          setSaveStatus("error");
          setSaveError(error instanceof Error ? error.message : "저장하지 못했어요");
          break;
        }
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [applyServer]);

  const update = useCallback(
    (fn: (s: TripState) => TripState) => {
      const prev = stateRef.current;
      if (!prev) return;
      const next = fn(prev);
      if (next === prev) return;
      stateRef.current = next;
      setState(next);
      dirtyRef.current = true;
      setSaveStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush],
  );

  const retrySave = useCallback(() => {
    dirtyRef.current = true;
    void flush();
  }, [flush]);

  /** 저장할 게 없을 때만 서버 내용을 확인한다. */
  const checkServer = useCallback(async () => {
    if (dirtyRef.current || inFlightRef.current || timerRef.current) return;
    const knownVersion = versionRef.current;
    try {
      const payload = await fetchTrip();
      // 확인하는 사이에 수정/저장이 있었다면 이번 결과는 버린다
      if (dirtyRef.current || inFlightRef.current || versionRef.current !== knownVersion) return;
      if (payload.version !== knownVersion) {
        applyServer(payload, "다른 곳에서 바뀐 내용을 불러왔어요");
      }
      setLoadError(null);
    } catch {
      // 잠깐의 네트워크 오류는 다음 확인 때 다시 시도
    }
  }, [applyServer]);

  const onLoaded = useCallback(
    (payload: TripPayload) => {
      applyServer(payload, null);
      setLoadError(null);
      setSaveStatus("saved");
    },
    [applyServer],
  );
  const onLoadFailed = useCallback((error: unknown) => {
    setLoadError(error instanceof Error ? error.message : "불러오지 못했어요");
  }, []);

  const reload = useCallback(() => {
    setLoadError(null);
    fetchTrip().then(onLoaded, onLoadFailed);
  }, [onLoaded, onLoadFailed]);

  // 처음 불러오기
  useEffect(() => {
    let cancelled = false;
    fetchTrip().then(
      (payload) => {
        if (!cancelled) onLoaded(payload);
      },
      (error: unknown) => {
        if (!cancelled) onLoadFailed(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [onLoaded, onLoadFailed]);

  // 주기적 확인 + 창에 다시 들어올 때 확인 / 나갈 때 즉시 저장
  useEffect(() => {
    const interval = setInterval(() => void checkServer(), POLL_MS);
    const onFocus = () => void checkServer();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkServer();
      else void flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || inFlightRef.current) {
        void flush();
        event.preventDefault();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [checkServer, flush]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  return {
    state,
    loadError,
    saveStatus,
    saveError,
    notice,
    update,
    retrySave,
    reload,
    dismissNotice,
  };
}
