import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/appIconArt";

// 아이폰 '홈 화면에 추가' 아이콘 (iOS 가 모서리를 직접 둥글게 자르므로 꽉 찬 사각형)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={size.width} />, { ...size });
}
