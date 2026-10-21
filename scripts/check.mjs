import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { HtmlValidate } from 'html-validate';
import sharp from 'sharp';
import { root, source, read, parse, elements, attr, resources, htmlValidation } from './project.mjs';

const html = await read('index.html');
const validator = new HtmlValidate(htmlValidation);
const report = await validator.validateString(html, 'dist/index.html');
if (!report.valid) {
  for (const result of report.results) {
    for (const item of result.messages) console.error(`${result.filePath}:${item.line}:${item.column} ${item.ruleId}: ${item.message}`);
  }
  throw new Error('HTML validation failed');
}
const document = parse(html);
const nodes = elements(document);
const ids = new Map();
for (const node of nodes) {
  const id = attr(node, 'id');
  if (id) { assert(!ids.has(id), `Duplicate ID: ${id}`); ids.set(id, node); }
}
for (const node of nodes) {
  const href = attr(node, 'href');
  if (href?.startsWith('#')) assert(ids.has(decodeURIComponent(href.slice(1))), `Broken anchor: ${href}`);
  for (const key of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const id of (attr(node, key) || '').split(/\s+/).filter(Boolean)) assert(ids.has(id), `Broken ${key}: ${id}`);
  }
  if (attr(node, 'target') === '_blank') assert((attr(node, 'rel') || '').split(/\s+/).includes('noopener'), 'External window needs noopener');
  if (node.tagName === 'script' && ['application/json', 'application/ld+json'].includes(attr(node, 'type'))) {
    JSON.parse(node.childNodes.map(child => child.value || '').join(''));
  }
}
const files = await resources(document);
let imageCount = 0;
for (const file of files) {
  const fullPath = path.join(source, file);
  assert((await fs.stat(fullPath)).isFile(), `Missing asset: ${file}`);
  if (file.endsWith('.js')) new vm.Script(await read(file), { filename: file });
  if (/\.(webp|png|jpe?g)$/.test(file)) {
    const metadata = await sharp(fullPath).metadata();
    assert(metadata.width > 0 && metadata.height > 0, `Invalid image: ${file}`);
    imageCount++;
  }
}
for (const node of nodes.filter(item => item.tagName === 'img' && attr(item, 'src')?.endsWith('.webp'))) {
  const metadata = await sharp(path.join(source, attr(node, 'src'))).metadata();
  assert.equal(Number(attr(node, 'width')), metadata.width, `Incorrect image width: ${attr(node, 'src')}`);
  assert.equal(Number(attr(node, 'height')), metadata.height, `Incorrect image height: ${attr(node, 'src')}`);
}
assert(!html.includes('chatgpt.site'), 'Obsolete hosting URL');
assert(!html.includes('file:///') && !html.includes('/Users/'), 'Local paths in published HTML');
const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
assert.equal(config.outputDirectory, 'build');
assert(!Object.hasOwn(config, 'public'), 'Vercel no longer accepts the public configuration property');
console.log(`Valid HTML/CSS/JS, ${ids.size} IDs, ${files.size} local resources and ${imageCount} raster images checked.`);
