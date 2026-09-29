// Скачивает Onest (400/500/600/700/800, кириллица + латиница) с Google Fonts для самохостинга
// и пишет src/assets/css/fonts.css. Если файлы уже есть, ничего не делает.
// При недоступности сети пишет fonts.css с @import Google Fonts — сайт остаётся рабочим.
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const WEIGHTS = [400, 500, 600, 700, 800];
const SUBSETS = new Set(["cyrillic", "cyrillic-ext", "latin", "latin-ext"]);
const FONT_DIR = new URL("../src/assets/fonts/", import.meta.url);
const CSS_DIR = new URL("../src/assets/css/", import.meta.url);
const CSS_FILE = new URL("fonts.css", CSS_DIR);
const API = `https://fonts.googleapis.com/css2?family=Onest:wght@${WEIGHTS.join(";")}&display=swap`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const FALLBACK = `@import url("${API}");\n`;

async function exists(url) { try { await access(url, constants.F_OK); return true; } catch { return false; } }

async function main() {
  await mkdir(FONT_DIR, { recursive: true });
  await mkdir(CSS_DIR, { recursive: true }); // папки нет в репозитории: main.css собирается из src/_css, а fonts.css не хранится в git
  if (await exists(new URL("onest-400-cyrillic.woff2", FONT_DIR)) && await exists(CSS_FILE)) {
    console.log("fonts: already present, skipping");
    return;
  }
  try {
    const css = await (await fetch(API, { headers: { "User-Agent": UA } })).text();
    const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]*)\}/g)];
    const rules = [];
    for (const [, subset, body] of blocks) {
      if (!SUBSETS.has(subset)) continue;
      const weight = /font-weight: (\d+)/.exec(body)[1];
      const src = /url\((https:[^)]+)\)/.exec(body)[1];
      const range = /unicode-range: ([^;]+);/.exec(body)[1];
      const name = `onest-${weight}-${subset}.woff2`;
      const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
      await writeFile(new URL(name, FONT_DIR), buf);
      rules.push(`@font-face{font-family:'Onest';font-style:normal;font-weight:${weight};font-display:swap;src:url('../fonts/${name}') format('woff2');unicode-range:${range};}`);
    }
    if (!rules.length) throw new Error("no font-face rules parsed");
    await writeFile(CSS_FILE, rules.join("\n") + "\n");
    console.log(`fonts: downloaded ${rules.length} files`);
  } catch (e) {
    console.warn("fonts: download failed, using Google Fonts @import fallback:", e.message);
    await writeFile(CSS_FILE, FALLBACK);
  }
}
main();
