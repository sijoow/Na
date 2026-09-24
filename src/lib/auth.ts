// 가족 공유용 간단한 비밀번호 잠금 (APP_PASSCODE 가 있을 때만 동작).
// 쿠키에는 비밀번호 원문 대신 APP_PASSCODE 로 서명한 HMAC 토큰을 넣는다: "v1.<발급시각(초)>.<서명>"
// proxy 와 Route Handler 양쪽에서 쓰므로 Node 전용 API 대신 Web Crypto 만 쓴다.

export const AUTH_COOKIE = "nt_family";
/** 30일 */
export const AUTH_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const TOKEN_VERSION = "v1";
const encoder = new TextEncoder();

/** 잠금 비밀번호. 설정되지 않았으면 null (→ 잠금 없음) */
export function getAppPasscode(): string | null {
  const value = process.env.APP_PASSCODE?.trim();
  return value ? value : null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/** 길이가 같으면 내용과 상관없이 같은 시간이 걸리는 비교 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function signingInput(issuedAt: number): string {
  return `nhatrang-planner:family-access:${TOKEN_VERSION}:${issuedAt}`;
}

export async function createAuthToken(passcode: string, now = Date.now()): Promise<string> {
  const issuedAt = Math.floor(now / 1000);
  const signature = await hmacSha256(passcode, signingInput(issuedAt));
  return `${TOKEN_VERSION}.${issuedAt}.${signature}`;
}

/** 서명이 맞고 30일이 지나지 않은 토큰인지. APP_PASSCODE 를 바꾸면 기존 토큰은 모두 무효가 된다. */
export async function verifyAuthToken(
  token: string | undefined,
  passcode: string,
  now = Date.now(),
): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const [version, issuedAtText, signature, ...rest] = token.split(".");
  if (rest.length > 0 || version !== TOKEN_VERSION || !signature) return false;
  if (!/^\d{1,12}$/.test(issuedAtText ?? "")) return false;
  const issuedAt = Number(issuedAtText);
  const nowSec = Math.floor(now / 1000);
  if (issuedAt > nowSec + 300 || nowSec - issuedAt > AUTH_MAX_AGE_SEC) return false;
  const expected = await hmacSha256(passcode, signingInput(issuedAt));
  return safeEqual(signature, expected);
}

/** 입력한 비밀번호가 맞는지. 원문끼리 비교하지 않고 같은 길이의 HMAC 결과끼리 비교한다. */
export async function passcodeMatches(input: string, passcode: string): Promise<boolean> {
  if (!input) return false;
  const probe = "nhatrang-planner:passcode-check";
  const [a, b] = await Promise.all([hmacSha256(input, probe), hmacSha256(passcode, probe)]);
  return safeEqual(a, b);
}

/** 잠금이 꺼져 있으면 항상 true, 켜져 있으면 쿠키 토큰을 확인한다 */
export async function isAuthorizedToken(token: string | undefined): Promise<boolean> {
  const passcode = getAppPasscode();
  if (!passcode) return true;
  return verifyAuthToken(token, passcode);
}

export const UNAUTHORIZED_MESSAGE = "가족 비밀번호로 다시 로그인해 주세요. (페이지를 새로고침하면 로그인 화면으로 가요)";
