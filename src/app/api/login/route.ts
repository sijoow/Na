import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE_SEC, createAuthToken, getAppPasscode, passcodeMatches } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
/** 틀렸을 때 기다리는 시간 (무차별 대입 완화) */
const FAIL_DELAY_MS = 1000;
const FAIL_JITTER_MS = 500;
const MAX_PASSCODE_LENGTH = 200;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** https 로 들어온 요청인지 (Vercel 등 앞단 프록시는 x-forwarded-proto 로 알려준다) */
function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const passcode = getAppPasscode();
  if (!passcode) return json({ error: "비밀번호 잠금이 설정되어 있지 않아요." }, 400);

  let input: unknown;
  try {
    input = ((await request.json()) as { passcode?: unknown } | null)?.passcode;
  } catch {
    return json({ error: "요청 형식이 올바르지 않아요." }, 400);
  }
  if (typeof input !== "string" || input.trim().length === 0) {
    return json({ error: "비밀번호를 입력해 주세요." }, 400);
  }

  const ok = input.length <= MAX_PASSCODE_LENGTH && (await passcodeMatches(input.trim(), passcode));
  if (!ok) {
    await sleep(FAIL_DELAY_MS + Math.random() * FAIL_JITTER_MS);
    return json({ error: "비밀번호가 맞지 않아요. 다시 입력해 주세요." }, 401);
  }

  const response = json({ ok: true });
  response.cookies.set(AUTH_COOKIE, await createAuthToken(passcode), {
    httpOnly: true,
    // 프로덕션(https)에서는 secure. 같은 와이파이에서 http 로 `npm start` 할 때는 secure 를 빼야 쿠키가 저장된다.
    secure: process.env.NODE_ENV === "production" && isHttps(request),
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE_SEC,
  });
  return response;
}
