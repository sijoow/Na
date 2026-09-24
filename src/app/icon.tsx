import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/appIconArt";

// 브라우저 탭·안드로이드 홈 화면 아이콘 (/icon/192, /icon/512, /icon/maskable)
export function generateImageMetadata() {
  return [
    { id: "192", contentType: "image/png", size: { width: 192, height: 192 } },
    { id: "512", contentType: "image/png", size: { width: 512, height: 512 } },
    { id: "maskable", contentType: "image/png", size: { width: 512, height: 512 } },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id);
  const size = iconId === "192" ? 192 : 512;
  const maskable = iconId === "maskable";
  return new ImageResponse(
    (
      <AppIconArt
        size={size}
        // maskable 은 안드로이드가 원/둥근 사각형으로 잘라내므로 그림을 안쪽에 작게, 모서리는 꽉 채움
        scale={maskable ? 0.6 : 0.78}
        radius={maskable ? 0 : Math.round(size * 0.22)}
      />
    ),
    { width: size, height: size },
  );
}
