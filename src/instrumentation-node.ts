// MONGODB_DNS_SERVERS(예: "8.8.8.8,1.1.1.1")가 있으면 Node의 DNS 서버를 바꾼다.
// 일부 PC(로컬 DNS 프록시가 SRV 조회를 막는 환경)에서 mongodb+srv:// 접속이 실패하는 문제를 피하기 위한 로컬 전용 설정.
// 배포 서버(Vercel 등)에서는 설정하지 않아도 된다.
import dns from "node:dns";

const servers = (process.env.MONGODB_DNS_SERVERS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (servers.length > 0) {
  dns.setServers(servers);
  dns.promises.setServers(servers);
}
