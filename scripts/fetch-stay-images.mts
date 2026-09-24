// 숙소 대표 사진 + 기념품 그룹·환전 사진을 모은다.
// - 숙소: 공식 호텔 사이트의 대표 이미지(og:image)를 찾아 '원래 주소 그대로' 기록(복사·재업로드 안 함).
//         못 찾으면 위키미디어 공용 자유 라이선스 사진을 Cafe24에 올린다.
// - 기념품·환전: 위키미디어 공용 자유 라이선스 사진을 Cafe24에 올린다.
// 실행: npx tsx scripts/fetch-stay-images.mts
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GUIDE, SOUVENIR } from "../src/data/guide";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const WM_UA = "nhatrang-family-planner/1.0 (personal trip app)";
const DIR = `${env.CAFE24_UPLOAD_DIR}nhatrang/`;
const PUBLIC = `${env.CAFE24_PUBLIC_BASE_URL.replace(/\/$/, "")}${DIR}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nt-stay-"));
const OTA = /agoda|booking\.com|trip\.com|tripadvisor|expedia|hotels\.com|traveloka|klook|kayak|google\.|naver|facebook|instagram|youtube|wikipedia|tripbtoz|trivago|priceline|hotelscombined|mytrip|ivivu|mytour|vntrip|luxuryescapes|wotif|orbitz/i;
const OK_LICENSE = /^(cc[ -]by|cc0|public domain|pd)/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const strip = (h: unknown) => String(h ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

type Img = { url: string; credit: string; license: string; source: string; kind: "official" | "commons" };
const outFile = path.join(root, "src/data/images.json");
const out = JSON.parse(fs.readFileSync(outFile, "utf8"));
out.stays ??= {};
out.souvenirGroups ??= {};
const save = () => fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");

async function officialSite(name: string, area: string): Promise<string | null> {
  const q = encodeURIComponent(`${name} ${area} official site`);
  const r = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, { headers: { "User-Agent": UA } });
  const h = await r.text();
  const links = [...h.matchAll(/class="result__a"[^>]+href="([^"]+)"/g)].map((m) => {
    const raw = m[1].replace(/&amp;/g, "&");
    const u = raw.includes("uddg=") ? decodeURIComponent(raw.split("uddg=")[1].split("&")[0]) : raw;
    return u.startsWith("//") ? `https:${u}` : u;
  });
  return links.find((u) => /^https?:\/\//.test(u) && !OTA.test(u)) ?? null;
}

async function ogImage(pageUrl: string): Promise<string | null> {
  try {
    const r = await fetch(pageUrl, { headers: { "User-Agent": UA, "Accept-Language": "en,ko" }, redirect: "follow" });
    if (!r.ok) return null;
    const h = await r.text();
    const m =
      h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ??
      h.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i);
    if (!m) return null;
    const img = new URL(m[1].replace(/&amp;/g, "&"), r.url).toString();
    const head = await fetch(img, { method: "GET", headers: { "User-Agent": UA } });
    const type = head.headers.get("content-type") ?? "";
    return head.ok && type.startsWith("image/") ? img : null;
  } catch {
    return null;
  }
}

async function commons(q: string, mustInclude?: string[], attempt = 0): Promise<Omit<Img, "kind"> & { thumb: string } | null> {
  await sleep(1500);
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "8", prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "900" })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  const text = await (await fetch(u, { headers: { "User-Agent": WM_UA } })).text();
  if (!text.startsWith("{")) {
    if (attempt >= 4) return null;
    await sleep(15000 * (attempt + 1));
    return commons(q, mustInclude, attempt + 1);
  }
  const pages = Object.values((JSON.parse(text)?.query?.pages ?? {}) as Record<string, { index?: number; title?: string; imageinfo?: { thumburl?: string; descriptionurl?: string; width?: number; extmetadata?: Record<string, { value?: string }> }[] }>)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const lic = strip(ii?.extmetadata?.LicenseShortName?.value);
    if (!ii?.thumburl || !OK_LICENSE.test(lic) || (ii.width ?? 0) < 600) continue;
    if (mustInclude && !mustInclude.some((w) => (p.title ?? "").toLowerCase().includes(w.toLowerCase()))) continue;
    return { thumb: ii.thumburl, url: "", source: ii.descriptionurl ?? "", license: lic, credit: strip(ii.extmetadata?.Artist?.value).slice(0, 80) || "Wikimedia Commons" };
  }
  return null;
}

async function uploadFrom(thumb: string, name: string): Promise<string> {
  const file = path.join(tmp, name);
  const r = await fetch(thumb, { headers: { "User-Agent": WM_UA } });
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  execFileSync("curl", ["-s", "-S", "--max-time", "60", "--ftp-create-dirs", "-T", file,
    `ftp://${env.CAFE24_FTP_HOST}:${env.CAFE24_FTP_PORT}${DIR}${name}`, "--user", `${env.CAFE24_FTP_USER}:${env.CAFE24_FTP_PASS}`]);
  return `${PUBLIC}${name}`;
}

// 1) 숙소
const seen = new Map<string, Img>();
for (const s of GUIDE.stays) {
  if (out.stays[s.id]) continue;
  const base = s.localName.split(" (")[0].replace(/[—–-]\s.*$/, "").trim();
  const area = s.area === "resort" || s.area === "arrival" ? "Cam Ranh" : "Nha Trang";
  const key = `${base}|${area}`;
  let img = seen.get(key) ?? null;
  if (!img) {
    // 이미 데이터에 공식 링크가 있으면 먼저 사용
    const known = s.links.map((l) => l.url).find((u) => !OTA.test(u));
    const site = known ?? (await officialSite(base, area));
    const og = site ? await ogImage(site) : null;
    if (og) {
      img = { url: og, credit: new URL(site!).host, license: "호텔 공식 사이트 이미지", source: site!, kind: "official" };
    } else {
      const words = base.split(/\s+/).filter((w) => w.length > 3 && !/resort|hotel|nha|trang|cam|ranh|spa/i.test(w));
      let hit = await commons(`${base} ${area}`, words.length ? words : undefined);
      // 넓은 검색어로 한 번 더 (브랜드명 + 지역)
      if (!hit && words.length) hit = await commons(`${words[0]} ${area}`, [words[0]]);
      if (hit) {
        const url = await uploadFrom(hit.thumb, `stay-${s.id}.jpg`);
        img = { url, credit: hit.credit, license: hit.license, source: hit.source, kind: "commons" };
      }
    }
    if (img) seen.set(key, img);
    await sleep(800);
  }
  if (!img) { console.log("✗ 숙소", s.name); continue; }
  out.stays[s.id] = img;
  save();
  console.log(`✓ 숙소 ${s.name} | ${img.kind} | ${img.credit}`);
}

// 2) 기념품 그룹 · 환전
const GROUP_Q: Record<string, string[]> = {
  "커피·차": ["Vietnamese coffee phin", "Vietnamese coffee"],
  "과자·간식": ["Vietnamese snacks market", "Vietnamese candy"],
  "견과·건과일": ["dried mango", "cashew nuts Vietnam", "cashew nuts"],
  "소스·라면·식재료": ["instant noodles Vietnam", "fish sauce Vietnam", "chili sauce bottle"],
  "생활·뷰티": ["toothpaste tubes", "cosmetics shelf supermarket"],
  "아이용": ["children snacks supermarket", "children toys market Vietnam"],
  기타: ["Nha Trang souvenir shop", "Vietnam souvenir shop"],
};
const groups = [...new Set(SOUVENIR.items.map((i) => i.group)), "__exchange__"];
for (const g of groups) {
  if (out.souvenirGroups[g]) continue;
  const qs = g === "__exchange__" ? ["Vietnamese dong banknotes", "Vietnam banknotes", "Vietnamese dong"] : (GROUP_Q[g] ?? [`${g} Vietnam`]);
  let hit = null;
  for (const q of qs) { hit = await commons(q); if (hit) break; }
  if (!hit) { console.log("✗ 그룹", g); continue; }
  const slug = g === "__exchange__" ? "exchange" : `souvenir-${groups.indexOf(g)}`;
  const url = await uploadFrom(hit.thumb, `${slug}.jpg`);
  out.souvenirGroups[g] = { url, credit: hit.credit, license: hit.license, source: hit.source, kind: "commons" };
  save();
  console.log("✓ 그룹", g, "|", hit.license);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`완료: 숙소 ${Object.keys(out.stays).length}/${GUIDE.stays.length}, 기념품·환전 ${Object.keys(out.souvenirGroups).length}/${groups.length}`);
