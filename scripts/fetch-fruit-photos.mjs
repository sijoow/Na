// 과일 가이드(fruits.json) 과일마다 위키미디어 공용 자유 라이선스 사진을 받아 Cafe24 FTP에 올리고 images.json 의 fruits 에 기록한다.
// 실행: node scripts/fetch-fruit-photos.mjs   (.env 의 CAFE24_* 사용)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const UA = "nhatrang-family-planner/1.0 (personal trip app)";
const DIR = `${env.CAFE24_UPLOAD_DIR}nhatrang/`;
const PUBLIC = `${env.CAFE24_PUBLIC_BASE_URL.replace(/\/$/, "")}${DIR.replace(/^\//, "/")}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nt-fruit-"));
const OK_LICENSE = /^(cc[ -]by|cc0|public domain|pd)/i;
const strip = (h) => String(h ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 과일 이름(fruits.json 의 name) → [파일 이름, 검색어들]. 제목에 must 가 들어간 사진만 고른다 (엉뚱한 사진 방지)
const FRUITS = {
  "망고": ["mango", ["Mango fruit cut ripe", "Mangoes fruit market"], /mango/i],
  "석가": ["sugar-apple", ["Annona squamosa fruit", "Sugar-apple fruit"], /annona|sugar.?apple|custard/i],
  "자몽 (포멜로)": ["pomelo", ["Pomelo flesh segments", "Pomelo fruit cut", "Citrus maxima fruit"], /pomelo|citrus maxima|bưởi|buoi/i],
  "스타애플": ["star-apple", ["Chrysophyllum cainito fruit", "Star apple fruit cut"], /chrysophyllum|star.?apple|cainito|vú sữa/i],
  "망고스틴": ["mangosteen", ["Mangosteen fruit opened", "Garcinia mangostana fruit"], /mangosteen|mangostana/i],
  "용과": ["dragon-fruit", ["Dragon fruit cut half", "Pitaya fruit"], /dragon|pitaya|pitahaya/i],
  "람부탄 · 롱안": ["rambutan", ["Rambutan fruit peeled", "Nephelium lappaceum fruit"], /rambutan|nephelium/i],
  "잭프루트": ["jackfruit", ["Jackfruit opened arils", "Jackfruit fruit cut"], /jackfruit|artocarpus/i],
  "두리안": ["durian", ["Durian fruit opened flesh", "Durian fruit"], /durian|durio/i],
};

async function search(q, must, attempt = 0) {
  await sleep(1500);
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "10", prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "900" })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  const text = await r.text();
  if (!text.startsWith("{")) {
    if (attempt >= 4) throw new Error("위키미디어 요청 제한이 풀리지 않아요");
    await sleep(15000 * (attempt + 1));
    return search(q, must, attempt + 1);
  }
  const pages = Object.values(JSON.parse(text)?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const md = ii?.extmetadata ?? {};
    const lic = strip(md.LicenseShortName?.value);
    if (!ii?.thumburl || !OK_LICENSE.test(lic) || (ii.width ?? 0) < 600) continue;
    if (!must.test(p.title) || /tree|leaf|leaves|flower|plant|seedling|illustration|drawing|stamp|race|festival|contest|people/i.test(p.title)) continue;
    return { thumb: ii.thumburl, source: ii.descriptionurl, license: lic, credit: strip(md.Artist?.value).slice(0, 80) || "Wikimedia Commons", title: p.title };
  }
  return null;
}

const imagesPath = path.join(root, "src/data/images.json");
const images = JSON.parse(fs.readFileSync(imagesPath, "utf8"));
images.fruits ??= {};
for (const [name, [slug, queries, must]] of Object.entries(FRUITS)) {
  if (images.fruits[name]) { console.log("•", name, "이미 있음"); continue; }
  let hit = null;
  for (const q of queries) { hit = await search(q, must); if (hit) break; }
  if (!hit) { console.log("✗", name, "사진 못 찾음"); continue; }
  const ext = (hit.thumb.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
  const file = path.join(tmp, `fruit-${slug}.${ext}`);
  const r = await fetch(hit.thumb, { headers: { "User-Agent": UA } });
  if (!r.ok) { console.log("✗", name, "다운로드 실패", r.status); continue; }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  execFileSync("curl", ["-s", "-S", "--max-time", "60", "--ftp-create-dirs", "-T", file,
    `ftp://${env.CAFE24_FTP_HOST}:${env.CAFE24_FTP_PORT}${DIR}fruit-${slug}.${ext}`, "--user", `${env.CAFE24_FTP_USER}:${env.CAFE24_FTP_PASS}`]);
  images.fruits[name] = { url: `${PUBLIC}fruit-${slug}.${ext}`, credit: hit.credit, license: hit.license, source: hit.source };
  fs.writeFileSync(imagesPath, JSON.stringify(images, null, 2) + "\n");
  console.log("✓", name, "|", hit.title, "|", hit.license);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("완료:", Object.keys(images.fruits).length, "/", Object.keys(FRUITS).length);
