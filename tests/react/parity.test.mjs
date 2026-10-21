import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import * as sass from "sass";
import postcss from "postcss";
import { render } from "../../.ssr/entry-server.mjs";
import { root } from "../../scripts/project.mjs";

const manifest = JSON.parse(
  await fs.readFile("tests/fixtures/legacy-manifest.json", "utf8"),
);
for (const [file, expected] of Object.entries(manifest.files))
  assert.equal(
    createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex"),
    expected,
    `Legacy snapshot changed: ${file}`,
  );
const legacyDom = new JSDOM(await fs.readFile("dist/index.html", "utf8"), {
  runScripts: "outside-only",
});
const legacy = legacyDom.window.document;
const nextDom = new JSDOM(`<div id="root">${render()}</div>`);
const next = nextDom.window.document;
const ids = (document) =>
  [...document.querySelectorAll("main section")].map((section) => section.id);
assert.deepEqual(ids(next), ids(legacy), "Section order and anchors");
const compact = (text) => text.replace(/\s/g, "");
for (const id of ids(legacy)) {
  const original = legacy.getElementById(id).cloneNode(true);
  const converted = next.getElementById(id).cloneNode(true);
  for (const section of [original, converted])
    section
      .querySelectorAll("script,.review-counter")
      .forEach((node) => node.remove());
  assert.equal(
    compact(converted.textContent),
    compact(original.textContent),
    `Changed section text: ${id}`,
  );
}
assert.deepEqual(
  [...next.querySelectorAll("a")].map((link) => link.getAttribute("href")),
  [...legacy.querySelectorAll("a")].map((link) => link.getAttribute("href")),
  "All navigation, telephone and social links",
);
for (const image of legacy.querySelectorAll("img")) {
  const converted = next.querySelector(
    `img[src="${image.getAttribute("src")}"]`,
  );
  assert(converted, `Missing original image: ${image.src}`);
  if (!image.classList.contains("review-full-image"))
    for (const key of ["alt", "width", "height"])
      assert.equal(converted.getAttribute(key), image.getAttribute(key));
}
legacyDom.window.eval(await fs.readFile("dist/assets/lucide.min.js", "utf8"));
legacyDom.window.lucide.createIcons();
for (const name of ["menu", "phone", "map-pin", "clock-3"]) {
  const paths = (svg) =>
    [...svg.querySelectorAll("path,circle,line,polyline,rect")].map((node) => [
      node.tagName.toLowerCase(),
      [...node.attributes]
        .filter((attr) => attr.name !== "key")
        .map((attr) => [attr.name, attr.value])
        .sort(),
    ]);
  assert.deepEqual(
    paths(next.querySelector(`.lucide-${name}`)),
    paths(legacy.querySelector(`.lucide-${name}`)),
    `Icon geometry changed: ${name}`,
  );
}
const normalize = (value) =>
  value
    .replaceAll("'", '"')
    .replaceAll("/assets/", "assets/")
    .replace(/\s/g, "")
    .replace(/(?<![\d])\.(\d)/g, "0.$1");
function declarations(css) {
  const result = [];
  postcss.parse(css).walkDecls((decl) => {
    const parents = [];
    for (
      let parent = decl.parent;
      parent?.type !== "root";
      parent = parent.parent
    )
      parents.unshift(
        parent.type === "atrule"
          ? `@${parent.name} ${parent.params}`
          : parent.selector,
      );
    result.push([
      parents.map(normalize),
      decl.prop,
      normalize(decl.value),
      Boolean(decl.important),
    ]);
  });
  return result;
}
const originalCss =
  (await fs.readFile("dist/fonts.css", "utf8")) +
  (await fs.readFile("dist/styles.css", "utf8"));
const compiled = sass.compile(path.join(root, "src/styles/index.scss")).css;
assert.deepEqual(
  declarations(compiled),
  declarations(sass.compileString(originalCss).css),
  "SCSS must preserve every CSS declaration, selector, breakpoint and cascade order",
);
legacyDom.window.close();
nextDom.window.close();
console.log(
  `${Object.keys(manifest.files).length} legacy files unchanged; all section text, links, images, key icon shapes and ${declarations(compiled).length} CSS declarations match.`,
);
