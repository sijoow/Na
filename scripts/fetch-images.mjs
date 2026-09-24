// 위키미디어 공용에서 자유 라이선스 사진을 찾아 Cafe24 FTP에 올리고 src/data/images.json 에 기록한다.
// 실행: node scripts/fetch-images.mjs   (.env 의 CAFE24_* 사용)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const UA = "nhatrang-family-planner/1.0 (personal trip app)";
const DIR = `${env.CAFE24_UPLOAD_DIR}nhatrang/`;
const PUBLIC = `${env.CAFE24_PUBLIC_BASE_URL.replace(/\/$/, "")}${DIR.replace(/^\//, "/")}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nt-img-"));
const OK_LICENSE = /^(cc[ -]by|cc0|public domain|pd)/i;
const strip = (h) => String(h ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q, attempt = 0) {
  await sleep(1500);
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "8", prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "900" })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  const text = await r.text();
  if (!text.startsWith("{")) {
    if (attempt >= 4) throw new Error("위키미디어 요청 제한이 풀리지 않아요");
    await sleep(15000 * (attempt + 1));
    return search(q, attempt + 1);
  }
  const j = JSON.parse(text);
  const pages = Object.values(j?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const md = ii?.extmetadata ?? {};
    const lic = strip(md.LicenseShortName?.value);
    if (!ii?.thumburl || !OK_LICENSE.test(lic) || (ii.width ?? 0) < 600) continue;
    return { thumb: ii.thumburl, source: ii.descriptionurl, license: lic, credit: strip(md.Artist?.value).slice(0, 80) || "Wikimedia Commons" };
  }
  return null;
}

async function pick(queries) {
  for (const q of queries) {
    const hit = await search(q);
    if (hit) return { ...hit, query: q };
  }
  return null;
}

async function upload(name, hit) {
  const file = path.join(tmp, name);
  const r = await fetch(hit.thumb, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`다운로드 실패 ${r.status}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  execFileSync("curl", ["-s", "-S", "--max-time", "60", "--ftp-create-dirs", "-T", file,
    `ftp://${env.CAFE24_FTP_HOST}:${env.CAFE24_FTP_PORT}${DIR}${name}`, "--user", `${env.CAFE24_FTP_USER}:${env.CAFE24_FTP_PASS}`]);
  return `${PUBLIC}${name}`;
}

const mapGuide = JSON.parse(fs.readFileSync(path.join(root, "src/data/mapGuide.json"), "utf8"));
const food = JSON.parse(fs.readFileSync(path.join(root, "src/data/foodSouvenir.json"), "utf8")).food;

const PLACE_Q = {
  "cam-ranh-airport": ["Cam Ranh International Airport terminal", "Cam Ranh airport"],
  "city-hotel-area": ["Nha Trang beach Tran Phu", "Nha Trang beach"],
  "dam-market": ["Dam market Nha Trang", "Chợ Đầm Nha Trang"],
  "nha-trang-cathedral": ["Nha Trang Cathedral", "Christ the King Cathedral Nha Trang"],
  "night-market": ["Nha Trang night market", "Nha Trang street night"],
  "po-nagar": ["Po Nagar Nha Trang", "Po Nagar tower"],
  "i-resort": ["I-Resort Nha Trang mud bath", "mud bath Nha Trang"],
  "vinwonders-pier": ["Vinpearl cable car Nha Trang", "Vinpearl cable car"],
  "vinwonders": ["VinWonders Nha Trang", "Vinpearl Land Nha Trang", "Hon Tre island Nha Trang"],
  "lotte-mart": ["Lotte Mart Nha Trang", "Nha Trang Tran Hung Dao street"],
  "cam-ranh-resort-area": ["Bai Dai beach Cam Ranh", "Cam Ranh beach"],
  "nam-cuong-dunes": ["Nam Cuong sand dunes", "Ninh Thuan sand dunes", "Phan Rang sand dunes"],
  "pho-hong": ["Phở bò Nha Trang", "Pho bo"],
  "kuukuu-seafood-buffet": ["Vietnamese seafood buffet", "Nha Trang seafood"],
};

const outFile = path.join(root, "src/data/images.json");
const out = fs.existsSync(outFile)
  ? JSON.parse(fs.readFileSync(outFile, "utf8"))
  : { generatedAt: new Date().toISOString().slice(0, 10), places: {}, dishes: {} };
const save = () => fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
for (const p of mapGuide.places) {
  if (out.places[p.id]) continue;
  const qs = PLACE_Q[p.id] ?? [p.localName];
  const hit = await pick(qs);
  if (!hit) { console.log("✗ 장소", p.id); continue; }
  const url = await upload(`place-${p.id}.jpg`, hit);
  out.places[p.id] = { url, credit: hit.credit, license: hit.license, source: hit.source };
  save();
  console.log("✓ 장소", p.id, "|", hit.license, "|", hit.query);
}
for (const d of food.mustTry) {
  if (out.dishes[d.dish]) continue;
  const vi = (d.dish.match(/\(([^)]+)\)/) ?? [])[1];
  const qs = [vi, vi ? vi.split(/[\/,·]/)[0].trim() : null].filter(Boolean);
  if (!qs.length) { console.log("✗ 음식(이름 없음)", d.dish); continue; }
  const hit = await pick(qs);
  if (!hit) { console.log("✗ 음식", d.dish); continue; }
  const slug = (vi || d.dish).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const url = await upload(`dish-${slug}.jpg`, hit);
  out.dishes[d.dish] = { url, credit: hit.credit, license: hit.license, source: hit.source };
  save();
  console.log("✓ 음식", d.dish, "|", hit.license);
}
// 투어 대표 사진 (장소 사진이 없거나 특정 장소가 아닌 투어용)
const ACTIVITY_Q = {
  "phan-rang-desert": ["Nam Cuong sand dunes Ninh Thuan", "Nam Cương", "Ninh Thuận sand dune", "Phan Rang dunes", "sand dunes Vietnam"],
  "i-resort-mud": ["mud bath Vietnam", "Tháp Bà hot spring mud", "mud bath resort", "hot spring mud bath"],
  massage: ["Vietnamese spa massage", "foot massage Vietnam", "spa massage", "Thai massage spa"],
  "hopping-tour": ["Nha Trang bay islands boat", "Hon Mun island", "Nha Trang boat tour", "Nha Trang islands"],
};
out.activities ??= {};
for (const [id, qs] of Object.entries(ACTIVITY_Q)) {
  if (out.activities[id]) continue;
  const hit = await pick(qs);
  if (!hit) { console.log("✗ 투어", id); continue; }
  const url = await upload(`tour-${id}.jpg`, hit);
  out.activities[id] = { url, credit: hit.credit, license: hit.license, source: hit.source, query: hit.query };
  save();
  console.log("✓ 투어", id, "|", hit.license, "|", hit.query);
}
save();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`완료: 장소 ${Object.keys(out.places).length}/${mapGuide.places.length}, 음식 ${Object.keys(out.dishes).length}/${food.mustTry.length}`);
