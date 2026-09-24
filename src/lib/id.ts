/** 새 항목용 고유 ID. 이벤트 핸들러에서만 호출한다 (상태 변경 함수는 순수 함수로 유지). */
export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // 비보안 컨텍스트(http://192.168.x.x 등)에서는 randomUUID가 없을 수 있음
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `id-${Date.now().toString(36)}-${rand()}${rand()}`;
}
