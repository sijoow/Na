import { cookies } from "next/headers";
import { AUTH_COOKIE, isAuthorizedToken, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { getTripStore, TripDataError, type TripStore } from "@/lib/tripStore";
import type { TripState } from "@/lib/types";
import { validateTripState } from "@/lib/validate";

// 파일 시스템/DB를 쓰므로 Node.js 런타임 + 항상 요청 시점에 실행 (캐시 금지)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1024 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

function errorJson(error: unknown, store: TripStore) {
  if (error instanceof TripDataError) return json({ error: error.message }, 500);
  console.error(error);
  const message =
    store.kind === "mongodb"
      ? "일정 DB에 연결하거나 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."
      : "일정 파일을 읽거나 저장하지 못했어요.";
  return json({ error: message }, 500);
}

/** proxy 가 먼저 막지만, 여기서도 한 번 더 확인한다 (APP_PASSCODE 가 없으면 항상 통과) */
async function unauthorized(): Promise<Response | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (await isAuthorizedToken(token)) return null;
  return json({ error: UNAUTHORIZED_MESSAGE }, 401);
}

export async function GET() {
  const denied = await unauthorized();
  if (denied) return denied;

  const store = getTripStore();
  try {
    return json(await store.load());
  } catch (error) {
    return errorJson(error, store);
  }
}

export async function PUT(request: Request) {
  const denied = await unauthorized();
  if (denied) return denied;

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return json({ error: "보내는 데이터가 너무 커요 (1MB 이하)." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "요청 형식이 올바르지 않아요 (JSON 아님)." }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return json({ error: "요청 형식이 올바르지 않아요." }, 400);
  }

  const { state, baseVersion } = body as { state?: unknown; baseVersion?: unknown };
  if (typeof baseVersion !== "string") {
    return json({ error: "baseVersion 이 없어요." }, 400);
  }
  const problem = validateTripState(state);
  if (problem) return json({ error: problem }, 400);

  const store = getTripStore();
  try {
    const result = await store.save(state as TripState, baseVersion);
    if (!result.ok) return json(result.conflict, 409);
    return json(result.payload);
  } catch (error) {
    return errorJson(error, store);
  }
}
