// Next 16 의 proxy (예전 middleware). 가족 비밀번호 잠금을 담당한다.
// APP_PASSCODE 가 없으면 아무것도 막지 않는다 (지금처럼 누구나 접속).
// 있으면 쿠키 토큰을 확인해서: 페이지 → /login 으로 이동, API → 401.

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, getAppPasscode, UNAUTHORIZED_MESSAGE, verifyAuthToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const passcode = getAppPasscode();

  if (!passcode) {
    // 잠금이 꺼져 있으면 로그인 화면은 필요 없다
    if (pathname === "/login") return redirectTo(request, "/");
    return NextResponse.next();
  }

  // 로그인 요청 자체는 통과
  if (pathname === "/api/login") return NextResponse.next();

  const authorized = await verifyAuthToken(request.cookies.get(AUTH_COOKIE)?.value, passcode);

  if (pathname === "/login") {
    return authorized ? redirectTo(request, "/") : NextResponse.next();
  }
  if (authorized) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: UNAUTHORIZED_MESSAGE },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return redirectTo(request, "/login");
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Next 내부 파일(_next/…)과 public 폴더의 정적 파일(이미지 등)은 검사하지 않는다
  // 앱 아이콘(/icon/…, /apple-icon)과 manifest 는 폰이 쿠키 없이 받아 가므로 잠그지 않는다
  matcher: [
    "/((?!_next/|__nextjs|favicon\\.ico|icon/|apple-icon$|manifest\\.webmanifest$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
