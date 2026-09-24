import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 와이파이의 태블릿에서 개발 서버(http://192.168.75.222:3000)에 접속할 수 있게 허용
  allowedDevOrigins: ["192.168.75.222"],
  // 개발 모드의 N 표시가 폰 하단 탭바를 가려서 끔 (배포 화면에는 원래 없음)
  devIndicators: false,
};

export default nextConfig;
