import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { source, output, read, parse, serialize, elements, attr, setAttr, resources } from './project.mjs';

export function deploymentSettings(env) {
  const value = env.SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  const indexable = env.VERCEL_ENV ? env.VERCEL_ENV === 'production' : Boolean(env.SITE_URL);
  let url;
  if (value) {
    const parsed = new URL(value.includes('://') ? value : `https://${value}`);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('SITE_URL must be an HTTPS origin without credentials, path, query or fragment');
    }
    url = parsed.href;
  }
  if (indexable && !url) throw new Error('Production build needs SITE_URL or Vercel system URL variables');
  return { url, indexable };
}

export async function renderHtml(env = {}) {
  const document = parse(await read('index.html'));
  const nodes = elements(document);
  const head = nodes.find(node => node.tagName === 'head');
  const settings = deploymentSettings(env);
  function append(tagName, attrs) {
    const node = { nodeName: tagName, tagName, namespaceURI: 'http://www.w3.org/1999/xhtml', attrs: Object.entries(attrs).map(([name, value]) => ({ name, value })), childNodes: [], parentNode: head };
    head.childNodes.push(node);
  }
  for (const node of nodes) {
    const key = node.tagName === 'link' ? 'href' : node.tagName === 'script' ? 'src' : null;
    const value = key && attr(node, key);
    if (value && /^(fonts\.css|styles\.css|script\.js)(?:\?|$)/.test(value)) {
      const file = value.split('?')[0];
      const hash = createHash('sha256').update(await read(file)).digest('hex').slice(0, 12);
      setAttr(node, key, `${file}?v=${hash}`);
    }
    if (node.tagName === 'script' && attr(node, 'type') === 'application/ld+json') {
      const data = JSON.parse(node.childNodes.map(child => child.value || '').join(''));
      if (settings.url) data.url = settings.url;
      node.childNodes = [{ nodeName: '#text', value: JSON.stringify(data).replaceAll('<', '\\u003c'), parentNode: node }];
    }
  }
  if (settings.url) {
    append('link', { rel: 'canonical', href: settings.url });
    append('meta', { property: 'og:url', content: settings.url });
    append('meta', { property: 'og:image', content: new URL('assets/hero-chair.webp', settings.url).href });
    append('meta', { property: 'og:image:alt', content: 'София Серкова' });
  }
  if (!settings.indexable) append('meta', { name: 'robots', content: 'noindex, nofollow' });
  return { html: serialize(document), ...settings };
}

async function licenseFiles(directory = 'assets') {
  const result = [];
  for (const entry of await fs.readdir(path.join(source, directory), { withFileTypes: true })) {
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await licenseFiles(file));
    else if (/LICENSE|OFL/i.test(entry.name)) result.push(file);
  }
  return result;
}

export async function buildSite(env = process.env) {
  const rendered = await renderHtml(env);
  const files = await resources(parse(await read('index.html')));
  for (const file of await licenseFiles()) files.add(file);
  // Only generated output is replaced; the editable dist directory is never touched.
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  for (const file of files) {
    if (file === 'index.html') continue;
    await fs.mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await fs.copyFile(path.join(source, file), path.join(output, file));
  }
  await fs.writeFile(path.join(output, 'index.html'), rendered.html);
  const robots = rendered.indexable ? `User-agent: *\nAllow: /\nSitemap: ${rendered.url}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n';
  await fs.writeFile(path.join(output, 'robots.txt'), robots);
  if (rendered.url && rendered.indexable) {
    await fs.writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${rendered.url}</loc></url></urlset>\n`);
  }
  console.log(`Built ${files.size} source files into build/. Indexing: ${rendered.indexable ? 'enabled' : 'disabled'}.`);
  return rendered;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildSite();
