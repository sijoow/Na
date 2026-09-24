"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || passcode.trim().length === 0) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        // 쿠키가 생겼으니 전체 새로고침으로 첫 화면에 들어간다 (버튼은 계속 '확인 중' 상태)
        window.location.replace("/");
        return;
      }
      let message = `로그인하지 못했어요 (${res.status})`;
      try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body.error === "string") message = body.error;
      } catch {
        // 본문이 JSON이 아니면 상태 코드 메시지를 쓴다
      }
      setError(message);
      setPasscode("");
    } catch {
      setError("서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
    }
    setPending(false);
  }

  return (
    <div className="w-full max-w-sm rounded-3xl bg-surface px-6 pt-8 pb-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      </div>

      <h1 className="mt-5 text-[22px] leading-snug font-bold tracking-tight text-ink">
        가족 비밀번호를
        <br />
        입력해 주세요
      </h1>
      <p className="mt-2 text-[15px] text-ink-3">나트랑 여행 플래너는 가족만 볼 수 있어요.</p>

      <form className="mt-7" onSubmit={handleSubmit} noValidate>
        <label htmlFor="passcode" className="sr-only">
          가족 비밀번호
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          autoFocus
          enterKeyHint="go"
          placeholder="비밀번호"
          value={passcode}
          onChange={(event) => {
            setPasscode(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "passcode-error" : undefined}
          className="w-full text-[17px]"
        />
        <p
          id="passcode-error"
          role="alert"
          className="mt-2 min-h-5 text-sm font-medium text-danger"
        >
          {error}
        </p>

        <button
          type="submit"
          disabled={pending || passcode.trim().length === 0}
          className="press mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-5 text-[17px] font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-40"
        >
          {pending ? "확인 중…" : "확인"}
        </button>
      </form>
    </div>
  );
}
