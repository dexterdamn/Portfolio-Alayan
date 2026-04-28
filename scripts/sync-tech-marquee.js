const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const snippet = fs.readFileSync(path.join(root, "snippets", "tech-tools-marquee-inner.html"), "utf8");

function replaceMarqueeGrid(html) {
  const re = /<div class="tech-marquee-grid reveal" aria-label="[^"]*">/;
  const m = html.match(re);
  if (!m) {
    console.error("marquee grid not found");
    return null;
  }
  const start = m.index;
  let pos = start + m[0].length;
  let depth = 1;
  while (pos < html.length && depth > 0) {
    const open = html.indexOf("<div", pos);
    const close = html.indexOf("</div>", pos);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      depth += 1;
      pos = open + 4;
    } else {
      depth -= 1;
      pos = close + 6;
    }
  }
  return html.slice(0, start) + snippet.trimEnd() + html.slice(pos);
}

for (const f of ["index.html", "about.html", "projects.html"]) {
  const p = path.join(root, f);
  let html = fs.readFileSync(p, "utf8");
  const next = replaceMarqueeGrid(html);
  if (!next) process.exit(1);
  fs.writeFileSync(p, next, "utf8");
  console.log("updated", f);
}
