// Concatenates src/_css/*.css (in filename order) into /assets/css/main.css
import fs from "node:fs";
import path from "node:path";

export const data = { permalink: "/assets/css/main.css", eleventyExcludeFromCollections: true };

export function render() {
  const dir = path.resolve("src/_css");
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .sort()
    .map((f) => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}
