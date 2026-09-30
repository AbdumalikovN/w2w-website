// Win to Win — Uzbek and English versions of the site.
//
// The site is written and built in Russian (Eleventy → _site). This script reads the finished
// Russian pages and writes translated copies to _site/uz/** and _site/en/**:
//   • visible text is cut into segments (a block's inline content, markup kept as <1>…</1> / <2/>),
//     looked up in src/_i18n/uz.json and src/_i18n/en.json (key = normalised Russian text);
//   • alt / title / aria-label / placeholder / data-col / <meta content> and JSON data blocks too;
//   • internal links get the /uz/ or /en/ prefix, lang switch, canonical and og:locale are set;
//   • per-language search-index.json is written for the site search.
// A segment without a translation stays in Russian and is reported (the build does not fail).
//
//   node scripts/i18n.mjs           build _site/uz and _site/en
//   node scripts/i18n.mjs extract   write src/_i18n/segments.json and work/i18n/todo-<lang>.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "htmlparser2";
import render from "dom-serializer";
import { Element, Text, isTag, isText } from "domhandler";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "_site");
const DICT_DIR = path.join(ROOT, "src/_i18n");
const SITE_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "src/_data/site.json"), "utf8"));
const LANGS = (SITE_DATA.languages || ["ru", "en"]).filter((l) => l !== "ru"); // какие версии собирать — src/_data/site.json → languages
const LOCALE = { uz: "uz_UZ", en: "en_US" };
const BASE = (() => { let b = process.env.PATH_PREFIX || "/"; if (!b.startsWith("/")) b = "/" + b; if (!b.endsWith("/")) b += "/"; return b; })();
const DOMAIN = JSON.parse(fs.readFileSync(path.join(ROOT, "src/_data/site.json"), "utf8")).domain.replace(/\/$/, "");
const MODE = process.argv[2] || "build";

const CYR = /[\u0400-\u04FF]/;
const INLINE = new Set(["a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "del", "dfn", "em", "i", "img", "ins", "kbd", "label", "mark", "q", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "svg", "button", "output", "meter", "progress", "input", "picture"]);
const ATOMIC = new Set(["svg", "img", "picture", "br", "wbr", "input", "code", "kbd", "samp", "var", "meter", "progress"]);
const SKIP = new Set(["script", "style", "textarea", "noscript", "template"]);
const ATTRS = ["alt", "title", "aria-label", "aria-description", "aria-roledescription", "placeholder", "data-col", "label"];

/* ---------------- helpers ---------------- */
const norm = (s) => s.replace(/[\u2060\u00AD]/g, "").replace(/[\s\u00A0\u202F\u2009]+/g, " ").trim();
const escKey = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescKey = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attrKey = (v) => escKey(norm(v));

function walkFiles(dir, out = [], rel = "") {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name), r = rel ? rel + "/" + name : name;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (!rel && (LANGS.includes(name) || name === "assets")) continue;
      walkFiles(abs, out, r);
    } else if (name.endsWith(".html")) out.push(r);
  }
  return out;
}
const pageUrl = (rel) => "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, ".html");

function relink(parent) {
  const ch = parent.children;
  for (let i = 0; i < ch.length; i++) { ch[i].parent = parent; ch[i].prev = ch[i - 1] || null; ch[i].next = ch[i + 1] || null; }
}
const textOf = (n) => (isText(n) ? n.data : isTag(n) && !SKIP.has(n.name) ? n.children.map(textOf).join("") : "");
const plainText = (n) => (isText(n) ? n.data : isTag(n) && !SKIP.has(n.name) && n.name !== "svg" ? " " + n.children.map(plainText).join("") + " " : "");

const inlineMemo = new WeakMap();
function isInlineOnly(el) {
  if (inlineMemo.has(el)) return inlineMemo.get(el);
  let ok = INLINE.has(el.name);
  if (ok && !ATOMIC.has(el.name)) for (const c of el.children) if (isTag(c) && !isInlineOnly(c)) { ok = false; break; }
  inlineMemo.set(el, ok);
  return ok;
}
// elements marked translate="no" or written in a given language (lang="…", e.g. language names) stay as they are
const keep = (el) => el.attribs.translate === "no" || (el.name !== "html" && "lang" in el.attribs);
const isAtomic = (el) => ATOMIC.has(el.name) || keep(el) || !CYR.test(textOf(el));

/* A run of inline nodes → key with numbered placeholders. */
function keyOf(nodes, ctx) {
  let out = "";
  for (const n of nodes) {
    if (isText(n)) out += escKey(n.data);
    else if (isTag(n)) {
      const id = ++ctx.n;
      if (isAtomic(n)) { ctx.map[id] = { node: n, atomic: true }; out += `<${id}/>`; }
      else { ctx.map[id] = { node: n, atomic: false }; out += `<${id}>` + keyOf(n.children, ctx) + `</${id}>`; }
    }
  }
  return out;
}

/* Translation string → DOM nodes, reusing the original inline elements. Returns null if the placeholders don't match. */
function build(str, map) {
  const root = { children: [] }, stack = [root], used = new Set();
  const re = /<(\/?)(\d+)(\/?)>/g;
  let last = 0, m;
  const pushText = (t) => { if (t) stack[stack.length - 1].children.push(new Text(unescKey(t))); };
  while ((m = re.exec(str))) {
    pushText(str.slice(last, m.index)); last = re.lastIndex;
    const id = +m[2], ph = map[id];
    if (!ph) return null;
    if (m[3]) { // <n/>
      if (!ph.atomic || used.has(id)) return null;
      used.add(id); stack[stack.length - 1].children.push(ph.node);
    } else if (!m[1]) { // <n>
      if (ph.atomic || used.has(id)) return null;
      used.add(id);
      const el = new Element(ph.node.name, { ...ph.node.attribs }, []);
      stack[stack.length - 1].children.push(el); stack.push(el); el._id = id;
    } else { // </n>
      const top = stack[stack.length - 1];
      if (top === root || top._id !== id) return null;
      stack.pop();
    }
  }
  pushText(str.slice(last));
  if (stack.length !== 1 || used.size !== Object.keys(map).length) return null;
  const fix = (p) => { relink(p); for (const c of p.children) if (isTag(c) && c._id) { delete c._id; fix(c); } };
  fix(root);
  return root.children;
}

/* ---------------- typography for translated text ---------------- */
function typeset(t, lang) {
  t = t.replace(/(\S) ([—–]) /g, "$1\u00A0$2 ").replace(/(\d)([–-])(?=\$?\d)/g, "$1$2\u2060");
  if (lang === "uz") t = t.replace(/(\d) (?=\d{3}(?!\d))/g, "$1\u00A0");
  return t;
}
function enNumbers(root) {
  const visit = (n) => {
    if (isText(n)) {
      if (/\+\d{3}/.test(n.data)) return; // phone numbers keep their spacing
      let t = n.data.replace(/(\d)[\u00A0\u202F\u2009](?=\d{3}(?!\d))/g, "$1,");
      if (!/[A-Za-z\u0400-\u04FF]/.test(t)) t = t.replace(/(\d),(\d{1,2})(?!\d)/g, "$1.$2");
      n.data = t;
    } else if (n.children && !(isTag(n) && SKIP.has(n.name))) n.children.forEach(visit);
  };
  visit(root);
}

/* ---------------- segment walker ---------------- */
function segments(doc, onSeg) {
  const visitRun = (parent, from, to) => {
    const ch = parent.children;
    // trim whitespace and atomic nodes at both ends
    // …but keep word-like atomic elements (e.g. <span>Company Brain</span>) so translations can move them
    const edge = (n) => (isText(n) && !n.data.trim()) || (isTag(n) && isAtomic(n) && !/\p{L}/u.test(textOf(n)));
    while (from < to && edge(ch[from])) from++;
    while (to > from && edge(ch[to - 1])) to--;
    if (from >= to) return;
    const slice = ch.slice(from, to);
    if (!CYR.test(slice.map(textOf).join(""))) return;
    // no words of its own (only elements side by side) → every element is a segment of its own
    if (!/[\p{L}\p{N}]/u.test(slice.filter(isText).map((n) => n.data).join(""))) {
      for (let i = to - 1; i >= from; i--) if (isTag(ch[i]) && !isAtomic(ch[i])) visitRun(ch[i], 0, ch[i].children.length);
      return;
    }
    onSeg(parent, from, to);
  };
  const walk = (el) => {
    const ch = el.children;
    let start = -1;
    const runs = [];
    for (let i = 0; i <= ch.length; i++) {
      const k = ch[i];
      const inRun = k && (isText(k) || (isTag(k) && !SKIP.has(k.name) && isInlineOnly(k)));
      if (inRun) { if (start < 0) start = i; continue; }
      if (start >= 0) { runs.push([start, i]); start = -1; }
      if (k && isTag(k) && !SKIP.has(k.name) && !keep(k)) walk(k);
    }
    // process runs right-to-left so earlier indices stay valid after replacement
    for (let r = runs.length - 1; r >= 0; r--) visitRun(el, runs[r][0], runs[r][1]);
  };
  walk(doc);
}

function allElements(n, out = []) {
  if (isTag(n)) out.push(n);
  if (n.children && !(isTag(n) && SKIP.has(n.name))) for (const c of n.children) allElements(c, out);
  return out;
}
const scripts = (doc) => { const out = []; const f = (n) => { if (isTag(n) && n.name === "script") out.push(n); else if (n.children) n.children.forEach(f); }; f(doc); return out; };

/* ---------------- JSON translation ---------------- */
function mapJson(o, tr) {
  if (Array.isArray(o)) return o.map((v) => mapJson(v, tr));
  if (o && typeof o === "object") { const r = {}; for (const k in o) r[k] = mapJson(o[k], tr); return r; }
  if (typeof o === "string" && CYR.test(o)) return tr(o);
  return o;
}
const jsonOut = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/* ---------------- main ---------------- */
const pages = walkFiles(SITE).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
const dicts = {};
for (const l of LANGS) { const f = path.join(DICT_DIR, l + ".json"); dicts[l] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {}; }

if (MODE === "extract") {
  const seen = new Map();
  const add = (key, url, where) => {
    if (!CYR.test(key)) return;
    const s = seen.get(key);
    if (s) { s.n++; if (!s.pages.includes(url)) s.pages.push(url); }
    else seen.set(key, { n: 1, pages: [url], where });
  };
  for (const rel of pages) {
    const url = pageUrl(rel), doc = parseDocument(fs.readFileSync(path.join(SITE, rel), "utf8"));
    for (const el of allElements(doc)) {
      for (const a of ATTRS) if (el.attribs[a] && CYR.test(el.attribs[a])) add(attrKey(el.attribs[a]), url, "@" + a);
      if (el.name === "meta" && el.attribs.content && CYR.test(el.attribs.content)) add(attrKey(el.attribs.content), url, "@meta");
    }
    for (const s of scripts(doc)) {
      const t = s.attribs.type || "";
      const body = s.children.map((c) => c.data || "").join("");
      if (t === "application/ld+json" || "data-calc-data" in s.attribs) mapJson(JSON.parse(body), (v) => (add(attrKey(v), url, "json"), v));
      else if (/window\.W2W\s*=/.test(body)) for (const m of body.matchAll(/"city":"([^"]+)"/g)) add(attrKey(m[1]), url, "json");
    }
    segments(doc, (parent, from, to) => {
      const ctx = { n: 0, map: {} };
      const key = norm(keyOf(parent.children.slice(from, to), ctx));
      add(key, url, parent.name + (parent.attribs && parent.attribs.class ? "." + parent.attribs.class.split(/\s+/)[0] : ""));
    });
  }
  const list = [...seen.entries()].map(([key, v]) => ({ key, n: v.n, where: v.where, pages: v.pages.slice(0, 4) }));
  fs.mkdirSync(DICT_DIR, { recursive: true });
  fs.writeFileSync(path.join(DICT_DIR, "segments.json"), JSON.stringify(list, null, 1));
  const words = list.reduce((a, s) => a + s.key.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length, 0);
  console.log(`segments: ${list.length} unique, ~${words} words, ${pages.length} pages`);
  fs.mkdirSync(path.join(ROOT, "work/i18n"), { recursive: true });
  for (const l of LANGS) {
    const todo = list.filter((s) => !dicts[l][s.key]);
    fs.writeFileSync(path.join(ROOT, `work/i18n/todo-${l}.json`), JSON.stringify(todo, null, 1));
    const stale = Object.keys(dicts[l]).filter((k) => !seen.has(k));
    console.log(`${l}: ${list.length - todo.length} translated, ${todo.length} missing, ${stale.length} unused`);
  }
  process.exit(0);
}

const ruIndex = JSON.parse(fs.readFileSync(path.join(SITE, "search-index.json"), "utf8"));
// pages that must stay out of the sitemap: noindex, redirect stubs, 404
const noindexPages = new Set(pages.filter((rel) => rel === "404.html" || /<meta name="robots" content="noindex"|http-equiv="refresh"/i.test(fs.readFileSync(path.join(SITE, rel), "utf8"))));
const sitemapPages = [];
for (const lang of LANGS) {
  const dict = dicts[lang], missing = new Map(), bad = new Set();
  const tr = (key) => { const t = dict[key]; if (t == null || t === "") { missing.set(key, (missing.get(key) || 0) + 1); return null; } return t; };
  const trAttr = (v) => { const t = tr(attrKey(v)); return t == null ? v : unescKey(t); };
  const localUrl = (href) => {
    if (!href || !href.startsWith(BASE)) return href;
    const rest = href.slice(BASE.length);
    if (/^(assets\/|uz\/|en\/|uz$|en$)/.test(rest)) return href;
    const p = rest.split(/[?#]/)[0];
    if (/\.[a-z0-9]+$/i.test(p) && !/\.html$/i.test(p)) return href;
    return BASE + lang + "/" + rest;
  };
  const localAbs = (href) => (href && href.startsWith(DOMAIN + "/") && !href.startsWith(DOMAIN + "/" + lang + "/") ? DOMAIN + "/" + lang + href.slice(DOMAIN.length) : href);
  const docsByUrl = new Map();

  for (const rel of pages) {
    const src = fs.readFileSync(path.join(SITE, rel), "utf8");
    const doc = parseDocument(src);
    const els = allElements(doc);
    const isRedirect = els.some((e) => e.name === "meta" && (e.attribs["http-equiv"] || "").toLowerCase() === "refresh");

    // 1) attributes
    for (const el of els) {
      for (const a of ATTRS) if (el.attribs[a] && CYR.test(el.attribs[a])) el.attribs[a] = trAttr(el.attribs[a]);
      if (el.name === "meta" && el.attribs.content && CYR.test(el.attribs.content)) el.attribs.content = trAttr(el.attribs.content);
    }
    // 2) text segments
    segments(doc, (parent, from, to) => {
      const slice = parent.children.slice(from, to);
      const ctx = { n: 0, map: {} };
      const key = norm(keyOf(slice, ctx));
      const t = tr(key);
      if (t == null) return;
      const nodes = build(t, ctx.map);
      if (!nodes) { bad.add(key); return; }
      const lead = isText(slice[0]) ? slice[0].data.match(/^\s*/)[0] : "";
      const trail = isText(slice[slice.length - 1]) ? slice[slice.length - 1].data.match(/\s*$/)[0] : "";
      const fixText = (n) => { if (isText(n)) n.data = typeset(n.data, lang); else if (isTag(n) && !ATOMIC.has(n.name)) n.children.forEach(fixText); };
      if (parent.name !== "title") nodes.forEach(fixText);
      if (lead) nodes.unshift(new Text(lead.replace(/\u00A0/g, " ")));
      if (trail) nodes.push(new Text(trail.replace(/\u00A0/g, " ")));
      parent.children.splice(from, to - from, ...nodes);
      relink(parent);
    });
    // 3) scripts: JSON data, runtime config, redirect stubs
    for (const s of scripts(doc)) {
      const t = s.attribs.type || "";
      const node = s.children[0];
      if (!node) continue;
      if (t === "application/ld+json" || "data-calc-data" in s.attribs) node.data = jsonOut(mapJson(JSON.parse(node.data), trAttr));
      else if (/window\.W2W\s*=/.test(node.data)) {
        node.data = node.data
          .replace(/"city":"([^"]+)"/g, (m, c) => '"city":' + JSON.stringify(trAttr(c)))
          .replace(/thanks: "([^"]*)"/, (m, u) => 'thanks: "' + localUrl(u) + '"');
      } else if (isRedirect) node.data = node.data.replace(/location\.replace\("([^"]*)"/, (m, u) => 'location.replace("' + localUrl(u) + '"');
    }
    // 4) links, language switch, locale (fresh list: segments above replaced some inline elements)
    for (const el of allElements(doc)) {
      if (el.name === "html") el.attribs.lang = lang;
      if ((el.name === "a" || el.name === "area") && el.attribs.href && !("data-lang-link" in el.attribs)) el.attribs.href = localUrl(el.attribs.href);
      if (el.name === "form" && el.attribs.action) el.attribs.action = localUrl(el.attribs.action);
      if (el.name === "link" && el.attribs.rel === "canonical") el.attribs.href = localAbs(el.attribs.href);
      if (el.name === "meta") {
        const p = el.attribs.property || "";
        if (p === "og:url") el.attribs.content = localAbs(el.attribs.content);
        if (p === "og:locale") el.attribs.content = LOCALE[lang];
        if (p === "og:image") el.attribs.content = el.attribs.content.replace(/\/og-ru\./, "/og-" + lang + ".");
        if ((el.attribs["http-equiv"] || "").toLowerCase() === "refresh") el.attribs.content = el.attribs.content.replace(/url=(.*)$/i, (m, u) => "url=" + localUrl(u));
      }
      if ("data-lang-link" in el.attribs) {
        if (el.attribs["data-lang-link"] === lang) el.attribs["aria-current"] = "true"; else delete el.attribs["aria-current"];
      }
      if ("data-lang-current" in el.attribs) { el.children = [new Text(lang.toUpperCase())]; relink(el); }
    }
    if (lang === "en") enNumbers(doc);

    const out = render(doc, { encodeEntities: "utf8" });
    const dest = path.join(SITE, lang, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    docsByUrl.set(pageUrl(rel), doc);
  }

  // per-language search index
  const index = [];
  for (const e of ruIndex) {
    const u = e.url.startsWith(BASE) ? "/" + e.url.slice(BASE.length) : e.url;
    const doc = docsByUrl.get(u);
    if (!doc) continue;
    const els = allElements(doc);
    const main = els.find((x) => x.name === "main");
    const titleEl = els.find((x) => x.name === "title");
    let title = tr(attrKey(e.title));
    title = title != null ? unescKey(title) : titleEl ? norm(textOf(titleEl)).replace(/\s+[—–-]\s+Win to Win$/, "") : e.title;
    const text = main ? norm(plainText(main)).slice(0, 6000) : "";
    index.push({ url: localUrl(e.url), title, text });
  }
  fs.writeFileSync(path.join(SITE, lang, "search-index.json"), JSON.stringify(index));

  sitemapPages.push(...pages.filter((rel) => !noindexPages.has(rel)).map((rel) => pageUrl(rel)));
  const miss = [...missing.keys()];
  console.log(`[i18n] ${lang}: ${pages.length} pages, ${miss.length} strings without translation, ${bad.size} with broken markup`);
  if (process.env.I18N_VERBOSE) { miss.slice(0, 50).forEach((k) => console.log("  - " + k.slice(0, 120))); [...bad].slice(0, 30).forEach((k) => console.log("  ! " + k.slice(0, 120))); }
}

/* ---------------- sitemap.xml (all languages, with hreflang alternates) ---------------- */
{
  const urls = [...new Set(sitemapPages)];
  const abs = (lang, u) => DOMAIN + (lang === "ru" ? "" : "/" + lang) + u;
  const alt = (u) => ["ru", ...LANGS].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(l, u)}"/>`).join("") + `<xhtml:link rel="alternate" hreflang="x-default" href="${abs("ru", u)}"/>`;
  const body = urls.flatMap((u) => ["ru", ...LANGS].map((l) => `<url><loc>${abs(l, u)}</loc>${alt(u)}</url>`)).join("\n");
  fs.writeFileSync(path.join(SITE, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`);
  console.log(`[i18n] sitemap.xml: ${urls.length * (LANGS.length + 1)} URLs`);
}
