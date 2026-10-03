import type { MetadataRoute } from "next";

// 휴대폰 '홈 화면에 추가' 용 앱 정보 (오프라인 보기는 public/sw.js + components/OfflineSave — 인터넷이 되면 항상 새 일정을 받고, 오프라인에서는 보기 전용)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "나트랑 여행 플래너",
    short_name: "나트랑",
    description: "나트랑 6박 8일 가족 여행 일정 · 준비물 · 메모 관리",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#0a8ea0",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
