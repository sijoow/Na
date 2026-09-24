import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인 · 나트랑 여행 플래너",
  robots: { index: false, follow: false },
};

// APP_PASSCODE 가 설정된 경우에만 proxy 가 이 화면으로 보낸다
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5 py-10">
      <LoginForm />
    </main>
  );
}
