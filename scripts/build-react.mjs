import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build as viteBuild } from "vite";
import { prepareAssets } from "./prepare-assets.mjs";
import { deploymentSettings } from "./build.mjs";
import { root, output, parse, serialize, elements, attr } from "./project.mjs";

export function renderReactHtml(template, markup, env = {}) {
  const settings = deploymentSettings(env);
  if (!template.includes("<!--app-html-->"))
    throw new Error("Missing prerender placeholder");
  const document = parse(template.replace("<!--app-html-->", () => markup));
  const nodes = elements(document);
  const head = nodes.find((node) => node.tagName === "head");
  function append(tagName, attrs) {
    const node = {
      nodeName: tagName,
      tagName,
      namespaceURI: "http://www.w3.org/1999/xhtml",
      attrs: Object.entries(attrs).map(([name, value]) => ({ name, value })),
      childNodes: [],
      parentNode: head,
    };
    head.childNodes.push(node);
  }
  if (settings.url) {
    append("link", { rel: "canonical", href: settings.url });
    append("meta", { property: "og:url", content: settings.url });
    append("meta", {
      property: "og:image",
      content: new URL("assets/hero-chair.webp", settings.url).href,
    });
    append("meta", { property: "og:image:alt", content: "София Серкова" });
    const structured = nodes.find(
      (node) =>
        node.tagName === "script" &&
        attr(node, "type") === "application/ld+json",
    );
    const data = JSON.parse(
      structured.childNodes.map((child) => child.value || "").join(""),
    );
    data.url = settings.url;
    structured.childNodes = [
      {
        nodeName: "#text",
        value: JSON.stringify(data).replaceAll("<", "\\u003c"),
        parentNode: structured,
      },
    ];
  }
  if (!settings.indexable)
    append("meta", { name: "robots", content: "noindex, nofollow" });
  return { html: serialize(document), ...settings };
}

export async function buildReactSite(env = process.env) {
  deploymentSettings(env);
  await prepareAssets();
  await viteBuild({ root });
  await viteBuild({
    root,
    publicDir: false,
    build: {
      ssr: "src/entry-server.jsx",
      outDir: ".ssr",
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "entry-server.mjs" } },
    },
  });
  const { render } = await import(
    pathToFileURL(path.join(root, ".ssr/entry-server.mjs")).href +
      `?build=${Date.now()}`
  );
  const template = await fs.readFile(path.join(output, "index.html"), "utf8");
  const result = renderReactHtml(template, render(), env);
  await fs.writeFile(path.join(output, "index.html"), result.html);
  await fs.writeFile(
    path.join(output, "robots.txt"),
    result.indexable
      ? `User-agent: *\nAllow: /\nSitemap: ${result.url}sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n",
  );
  if (result.indexable)
    await fs.writeFile(
      path.join(output, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${result.url}</loc></url></urlset>\n`,
    );
  console.log(
    `React prerender complete. Indexing: ${result.indexable ? "enabled" : "disabled"}. Legacy dist/ was not modified.`,
  );
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await buildReactSite();
