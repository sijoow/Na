import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { AUTH_COOKIE, isAuthorizedToken, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { getTripStore } from "@/lib/tripStore";
import type { TripState } from "@/lib/types";

// 간단한 'AI에게 물어보기': 우리 여행 일정을 근거로 답하고, 원하면 웹 검색도 한다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 모델은 환경변수로 바꿀 수 있음 (기본 claude-opus-5, 비용 절약을 위해 effort low)
const MODEL = process.env.AI_MODEL?.trim() || "claude-opus-5";
const MAX_QUESTION = 500;

// 예상 비용 계산용 (USD / 1M 토큰). 목록에 없는 모델은 비용 표시 생략.
const PRICE: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};
const WEB_SEARCH_USD = 10 / 1000; // 검색 1회당

const SYSTEM = `너는 한국인 가족(성인 2 + 만 4살 아이)의 베트남 나트랑 여행 도우미야.
아래 <trip> 일정·항공·숙소 정보를 근거로 짧고 실용적으로 한국어로 답해.
4살 아이 동반이라는 점을 항상 고려하고, 가격은 동(VND)과 원화를 같이 적어.
모르는 건 추측하지 말고 모른다고 해. 웹 검색 결과를 쓰면 출처를 짧게 밝혀.`;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** 토큰을 아끼기 위해 일정은 한 줄씩 간단한 글로 바꿔서 넘긴다 */
function tripAsText(s: TripState): string {
  const lines: string[] = [`여행: ${s.tripTitle} (${s.startDate} ~ ${s.endDate}), ${s.travelers}`];
  for (const f of s.flights) {
    lines.push(`항공 ${f.direction}: ${f.airline} ${f.flightNo || "(편명 미정)"} ${f.from} ${f.departDate} ${f.departTime} → ${f.to} ${f.arriveDate} ${f.arriveTime}`);
  }
  s.days.forEach((d, i) => {
    lines.push(`D${i + 1} ${d.date} [${d.title}] 숙소: ${d.lodging}`);
    for (const it of d.items) lines.push(`  - ${it.time || "--:--"} ${it.title}${it.memo ? ` (${it.memo})` : ""}`);
  });
  return lines.join("\n");
}

export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!(await isAuthorizedToken(token))) return json({ error: UNAUTHORIZED_MESSAGE }, 401);

  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았어요. .env 에 넣고 서버를 다시 켜 주세요." }, 503);
  }

  let body: { question?: unknown; web?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "요청 형식이 올바르지 않아요." }, 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return json({ error: "질문을 입력해 주세요." }, 400);
  if (question.length > MAX_QUESTION) return json({ error: `질문은 ${MAX_QUESTION}자 이내로 써 주세요.` }, 400);
  const useWeb = body.web === true;

  let trip: TripState;
  try {
    trip = (await getTripStore().load()).state;
  } catch {
    return json({ error: "일정을 불러오지 못했어요." }, 500);
  }

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: question }];
  const usage = { input: 0, output: 0, cacheRead: 0, webSearches: 0 };

  try {
    let answer = "";
    // 웹 검색이 길어지면 pause_turn 으로 멈출 수 있어 최대 3번 이어서 요청
    for (let turn = 0; turn < 3; turn++) {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // 안전 필터로 거절되면 서버가 다른 모델로 자동 재시도
        output_config: { effort: "low" },
        system: [
          { type: "text", text: SYSTEM },
          { type: "text", text: `<trip>\n${tripAsText(trip)}\n</trip>`, cache_control: { type: "ephemeral" } },
        ],
        tools: useWeb ? [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }] : undefined,
        messages,
      });

      usage.input += res.usage.input_tokens;
      usage.output += res.usage.output_tokens;
      usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
      usage.webSearches += res.usage.server_tool_use?.web_search_requests ?? 0;

      if (res.stop_reason === "refusal") {
        answer = "이 질문에는 답할 수 없어요. 다르게 물어봐 주세요.";
        break;
      }
      answer = res.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (res.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: res.content });
    }

    const price = PRICE[MODEL];
    const usd = price
      ? ((usage.input + usage.cacheRead * 0.1) * price.input + usage.output * price.output) / 1_000_000 +
        usage.webSearches * WEB_SEARCH_USD
      : null;

    return json({ answer: answer || "(답변이 비어 있어요)", model: MODEL, usage, costUsd: usd });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json({ error: "ANTHROPIC_API_KEY 가 올바르지 않아요." }, 500);
    if (error instanceof Anthropic.RateLimitError) return json({ error: "잠시 요청이 많아요. 조금 뒤 다시 시도해 주세요." }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: `AI 요청 실패 (${error.status})` }, 502);
    console.error(error);
    return json({ error: "AI 요청 중 문제가 생겼어요." }, 500);
  }
}
