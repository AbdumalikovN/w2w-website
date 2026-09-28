export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addPassthroughCopy({ "node_modules/gsap/dist/gsap.min.js": "assets/vendor/gsap.min.js", "node_modules/gsap/dist/ScrollTrigger.min.js": "assets/vendor/ScrollTrigger.min.js" });

  eleventyConfig.addFilter("usd", (n) => "$" + Number(n).toLocaleString("ru-RU").replace(/ /g, " "));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("find", (arr, key, val) => (arr || []).find((x) => x[key] === val));
  eleventyConfig.addFilter("where", (arr, key, val) => (arr || []).filter((x) => x[key] === val));
  eleventyConfig.addFilter("wherenot", (arr, key, val) => (arr || []).filter((x) => x[key] !== val));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("striptags", (s) => String(s || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("jsonstr", (s) => JSON.stringify(String(s || "")));

  // Russian typesetting on the final HTML (text nodes only; <title>, tags, scripts, styles untouched):
  // short prepositions/conjunctions stick to the next word, a dash sticks to the word before it,
  // numeric ranges (10–25%) and short hyphenated words (чат-бот, AI-агент) never break.
  const SHORT = "в|во|на|не|ни|и|а|к|ко|с|со|о|об|обо|от|до|по|за|из|у|для|без|при|или|но|же|как|под|над|про|это|мы|вы|вас|нам|вам";
  const reShort = new RegExp(`(?<=^|[\\s(«"„\\u00A0])(${SHORT})\\s+(?=[^\\s<])`, "giu");
  const reDash = /(\S) ([—–]) /g;
  const reRange = /(\d)([–-])(?=\$?\d)/g;
  const reHyph = /(?<=^|[\s>(«\u00A0])([A-Za-zА-Яа-яЁё]{1,5})-(?=[A-Za-zА-Яа-яЁё])/gu;
  const reNum = /(\d) (?=[А-Яа-яЁё%])/g;
  const reThousands = /(\d) (?=\d{3}(?!\d))/g;
  const typeset = (t) => t.replace(reShort, "$1\u00A0").replace(reDash, "$1\u00A0$2 ").replace(reRange, "$1$2\u2060").replace(reHyph, "$1-\u2060").replace(reNum, "$1\u00A0").replace(reThousands, "$1\u00A0");
  eleventyConfig.addTransform("typeset", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content
      .split(/(<title>[\s\S]*?<\/title>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<textarea[\s\S]*?<\/textarea>|<pre[\s\S]*?<\/pre>|<[^>]+>)/i)
      .map((seg, i) => (i % 2 ? seg : typeset(seg)))
      .join("");
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
