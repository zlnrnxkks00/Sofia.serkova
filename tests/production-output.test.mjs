import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildSite } from '../scripts/build.mjs';
import { source, output, read, parse, serialize, elements, resources } from '../scripts/project.mjs';

await buildSite({ VERCEL_ENV: 'production', SITE_URL: 'https://sofia.example' });
const built = await fs.readFile(path.join(output, 'index.html'), 'utf8');
const original = parse(await read('index.html'));
const generated = parse(built);
assert.equal(serialize(elements(original).find(node => node.tagName === 'body')), serialize(elements(generated).find(node => node.tagName === 'body')), 'Published body markup must match the editable source');
for (const file of await resources(generated)) {
  assert((await fs.stat(path.join(output, file))).isFile(), `Unpackaged resource: ${file}`);
  if (file !== 'index.html') assert((await fs.readFile(path.join(source, file))).equals(await fs.readFile(path.join(output, file))), `Asset changed: ${file}`);
}
assert((await fs.readFile(path.join(output, 'robots.txt'), 'utf8')).includes('Sitemap: https://sofia.example/sitemap.xml'));
assert((await fs.readFile(path.join(output, 'sitemap.xml'), 'utf8')).includes('<loc>https://sofia.example/</loc>'));
for (const file of ['README.md', '.env', '.openai', 'assets/hero-cutout.webp']) {
  await assert.rejects(fs.access(path.join(output, file)), `Private or unused file deployed: ${file}`);
}
await buildSite({ VERCEL_ENV: 'preview', VERCEL_URL: 'preview.example' });
assert.equal(await fs.readFile(path.join(output, 'robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
await assert.rejects(fs.access(path.join(output, 'sitemap.xml')), 'Preview must not retain a stale production sitemap');
console.log('All published assets match their originals; production/preview files, source-only exclusions and unchanged body markup passed.');
