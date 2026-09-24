// 앱 아이콘 그림 (app/icon.tsx, app/apple-icon.tsx 가 ImageResponse 로 PNG 를 만든다)
// 파란 배경 + 흰 야자수 + 물결. 이모지 대신 SVG 로 그려서 빌드 때 외부 다운로드가 없다.

export const ICON_BLUE = "#3182f6";

interface Props {
  /** 아이콘 한 변 픽셀 */
  size: number;
  /** 그림 크기 비율 (maskable 아이콘은 안전 영역 안에 들어가게 작게) */
  scale?: number;
  /** 모서리 둥글기 (0 이면 꽉 찬 사각형 — iOS 는 직접 둥글게 자른다) */
  radius?: number;
}

export function AppIconArt({ size, scale = 0.78, radius = 0 }: Props) {
  const inner = Math.round(size * scale);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ICON_BLUE,
        borderRadius: radius,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 100 100" fill="none">
        {/* 줄기 */}
        <path d="M54 86 C 55 70, 53 54, 47 41" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
        {/* 잎 */}
        <path d="M47 40 C 37 25, 19 25, 9 42 C 23 35, 35 36, 47 40 Z" fill="#ffffff" />
        <path d="M47 40 C 59 23, 78 24, 90 41 C 75 33, 61 35, 47 40 Z" fill="#ffffff" />
        <path d="M47 40 C 41 22, 27 13, 13 17 C 27 23, 38 30, 47 40 Z" fill="#ffffff" />
        <path d="M47 40 C 55 21, 70 12, 85 17 C 69 22, 57 30, 47 40 Z" fill="#ffffff" />
        <path d="M47 40 C 43 26, 48 13, 58 6 C 54 19, 52 29, 47 40 Z" fill="#ffffff" />
        {/* 물결 */}
        <path
          d="M14 88 C 26 82, 38 82, 50 88 C 62 94, 74 94, 86 88"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
