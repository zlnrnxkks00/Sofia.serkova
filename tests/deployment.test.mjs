import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { HtmlValidate } from 'html-validate';
import { renderHtml, deploymentSettings } from '../scripts/build.mjs';
import { read, parse, elements, attr, localPath, htmlValidation } from '../scripts/project.mjs';

const original = await read('index.html');
const production = await renderHtml({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'sofia.example' });
assert.equal(production.url, 'https://sofia.example/');
assert(production.indexable);
const nodes = elements(parse(production.html));
assert.equal(attr(nodes.find(node => attr(node, 'rel') === 'canonical'), 'href'), production.url);
assert.equal(attr(nodes.find(node => attr(node, 'property') === 'og:image'), 'content'), 'https://sofia.example/assets/hero-chair.webp');
for (const file of ['styles.css', 'fonts.css', 'script.js']) {
  const hash = createHash('sha256').update(await read(file)).digest('hex').slice(0, 12);
  assert(production.html.includes(`${file}?v=${hash}`));
}
const preview = await renderHtml({ VERCEL_ENV: 'preview', SITE_URL: 'https://sofia.example', VERCEL_URL: 'preview.example' });
assert(!preview.indexable && preview.html.includes('noindex, nofollow'));
assert.equal(preview.url, production.url);
assert(!(await renderHtml({})).indexable);
assert((await renderHtml({ SITE_URL: 'https://sofia.example' })).indexable);
for (const url of ['http://sofia.example', 'https://user:secret@sofia.example', 'https://sofia.example/path', 'https://sofia.example/?q=1', 'https://sofia.example/#home']) {
  assert.throws(() => deploymentSettings({ SITE_URL: url }));
}
assert.equal(localPath('assets/example.webp?v=1'), 'assets/example.webp');
assert.equal(localPath('#home'), null);
assert.equal(localPath('https://example.com'), null);
assert.throws(() => localPath('../private'));
assert.throws(() => localPath('%2e%2e/private'));
assert.equal(await read('index.html'), original, 'Rendering must not modify source HTML');
const validator = new HtmlValidate(htmlValidation);
assert((await validator.validateString(production.html)).valid, 'Production HTML remains valid');
console.log('Production/preview SEO, URL validation, resource boundaries, automatic cache hashes and source preservation passed.');
