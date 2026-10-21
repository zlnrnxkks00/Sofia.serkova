import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { HtmlValidate } from "html-validate";
import { JSDOM } from "jsdom";
import { render } from "../../.ssr/entry-server.mjs";
import { renderReactHtml } from "../../scripts/build-react.mjs";
import {
  output,
  resources,
  parse,
  htmlValidation,
} from "../../scripts/project.mjs";

const html = await fs.readFile("build/index.html", "utf8");
const validator = new HtmlValidate(htmlValidation);
const report = await validator.validateString(html);
if (!report.valid)
  console.error(
    report.results.flatMap((result) =>
      result.messages.map(({ ruleId, message, line, column }) => ({
        ruleId,
        message,
        line,
        column,
      })),
    ),
  );
assert(report.valid, "Prerendered HTML is valid");
const document = new JSDOM(html).window.document;
assert.equal(document.documentElement.lang, "ru");
assert.equal(document.querySelectorAll("h1").length, 1);
assert.equal(document.querySelectorAll(".review-item").length, 13);
assert.equal(document.querySelectorAll(".service-description").length, 4);
assert(
  [...document.querySelectorAll(".service-description")].every(
    (node) => !node.hidden && node.textContent.length > 30,
  ),
);
assert(
  document.querySelector("#contact").textContent.includes("+7 978 808 84 92"),
);
assert(!html.includes("<!--app-html-->"));
assert(
  !html.includes("assets/lucide.min.js") && !html.includes("script.js?v="),
);
assert.equal(document.querySelectorAll('script[type="module"]').length, 1);
for (const file of await resources(parse(html), { directory: output }))
  assert(
    (await fs.stat(path.join(output, file))).isFile(),
    `Missing React production resource: ${file}`,
  );
const licenses = await fs.readFile(
  path.join(output, "assets/THIRD-PARTY-LICENSES.md"),
  "utf8",
);
for (const dependency of ["react", "react-dom", "lucide-react"])
  assert(licenses.includes(dependency), `Missing license: ${dependency}`);
assert(licenses.includes("Permission is hereby granted"));
for (const file of [
  ".env",
  ".ssr",
  "node_modules",
  "README.md",
  "script.js",
  "styles.css",
])
  await assert.rejects(fs.access(path.join(output, file)));

const template = await fs.readFile("index.html", "utf8");
const production = renderReactHtml(template, render(), {
  SITE_URL: "https://sofia.example",
  VERCEL_ENV: "production",
});
const prod = new JSDOM(production.html).window.document;
assert(production.indexable);
assert.equal(
  prod.querySelector('[rel="canonical"]').href,
  "https://sofia.example/",
);
assert.equal(
  prod.querySelector('[property="og:image"]').content,
  "https://sofia.example/assets/hero-chair.webp",
);
assert.equal(
  JSON.parse(prod.querySelector('[type="application/ld+json"]').textContent)
    .url,
  "https://sofia.example/",
);
assert(!prod.querySelector('[name="robots"]'));
const preview = renderReactHtml(template, render(), {
  SITE_URL: "https://sofia.example",
  VERCEL_ENV: "preview",
});
assert(!preview.indexable && preview.html.includes("noindex, nofollow"));
assert.throws(() =>
  renderReactHtml(template, render(), { SITE_URL: "http://unsafe.example" }),
);
console.log(
  "All content exists without JavaScript; React assets, production/preview SEO, JSON-LD, metadata and valid HTML passed.",
);
