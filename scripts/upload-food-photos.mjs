// 맛집 사진(위키미디어 공용 자유 라이선스)을 받아 Cafe24 FTP에 올리고 src/data/images.json 의 restaurants 에 기록한다.
// 실행: node scripts/upload-food-photos.mjs <선택 목록.json>   (.env 의 CAFE24_* 사용)
// 선택 목록: [{ id, kind: "shop"|"dish"|"reuse"|"none", thumbUrl, descriptionUrl, license, credit, caption, dishKey }]
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
const OK_LICENSE = /^(cc[ -]by|cc0|public domain|pd)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const listPath = process.argv[2];
if (!listPath) throw new Error("선택 목록 JSON 경로를 넣어 주세요");
const picks = JSON.parse(fs.readFileSync(listPath, "utf8"));
const imagesPath = path.join(root, "src/data/images.json");
const images = JSON.parse(fs.readFileSync(imagesPath, "utf8"));
images.restaurants ??= {};
const save = () => fs.writeFileSync(imagesPath, JSON.stringify(images, null, 2) + "\n");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nt-food-"));

async function download(url, file, attempt = 0) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if ((r.status === 429 || r.status >= 500) && attempt < 4) {
    await sleep(10000 * (attempt + 1));
    return download(url, file, attempt + 1);
  }
  if (!r.ok) throw new Error(`다운로드 실패 ${r.status}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

let ok = 0;
for (const p of picks) {
  if (p.kind === "none") continue;
  if (p.kind === "reuse") {
    const d = images.dishes?.[p.dishKey];
    if (!d) { console.log("✗ 재사용할 음식 사진 없음", p.id, p.dishKey); continue; }
    images.restaurants[p.id] = { ...d, kind: "dish", caption: p.caption };
    ok++; save(); console.log("↺", p.id, "←", p.dishKey);
    continue;
  }
  if (!OK_LICENSE.test(p.license ?? "") || !/^https:\/\/upload\.wikimedia\.org\//.test(p.thumbUrl ?? "")) {
    console.log("✗ 라이선스·주소 확인 실패", p.id, p.license); continue;
  }
  const ext = (p.thumbUrl.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
  const name = `food-${p.id}.${ext}`;
  const file = path.join(tmp, name);
  try {
    await sleep(1200);
    await download(p.thumbUrl, file);
    execFileSync("curl", ["-s", "-S", "--max-time", "60", "--ftp-create-dirs", "-T", file,
      `ftp://${env.CAFE24_FTP_HOST}:${env.CAFE24_FTP_PORT}${DIR}${name}`, "--user", `${env.CAFE24_FTP_USER}:${env.CAFE24_FTP_PASS}`]);
    images.restaurants[p.id] = {
      url: `${PUBLIC}${name}`, credit: p.credit || "Wikimedia Commons", license: p.license,
      source: p.descriptionUrl, kind: p.kind, caption: p.caption,
    };
    ok++; save(); console.log("✓", p.id, "|", p.kind, "|", p.license);
  } catch (e) {
    console.log("✗", p.id, e.message);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`완료: ${ok}/${picks.length}곳`);
