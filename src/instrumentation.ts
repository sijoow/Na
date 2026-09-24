// 서버 시작 시 한 번 실행된다. Node 전용 코드는 별도 파일에서 조건부로 불러온다 (Edge 번들 제외).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
