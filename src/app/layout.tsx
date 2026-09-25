import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "나트랑 여행 플래너",
  description: "나트랑 6박 8일 가족 여행 일정 · 준비물 · 메모 관리",
  applicationName: "나트랑 여행 플래너",
  // 아이폰 '홈 화면에 추가' 했을 때 앱처럼 열리게 (상태바는 밝은 배경에 맞춰 기본값)
  appleWebApp: {
    capable: true,
    title: "나트랑",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#101013" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
