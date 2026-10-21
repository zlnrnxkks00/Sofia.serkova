import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serialize } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const source = path.join(root, 'dist');
export const output = path.join(root, 'build');
export { parse, serialize };
export const htmlValidation = {
  extends: ['html-validate:recommended'],
  rules: {
    'long-title': 'off',
    'prefer-native-element': 'off',
    'tel-non-breaking': 'off',
    'attribute-empty-style': 'off',
    'attribute-boolean-style': 'off'
  }
};
export const read = file => fs.readFile(path.join(source, file), 'utf8');
export const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
export function setAttr(node, name, value) {
  const existing = node.attrs.find(item => item.name === name);
  if (existing) existing.value = value;
  else node.attrs.push({ name, value });
}
export function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}
export function elements(document) {
  const result = [];
  walk(document, node => { if (node.tagName) result.push(node); });
  return result;
}
export function localPath(url, owner = 'index.html') {
  if (!url || url.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) return null;
  const decoded = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  if (!decoded) return null;
  const relative = decoded.startsWith('/') ? decoded.slice(1) : path.posix.join(path.posix.dirname(owner), decoded);
  if (relative.startsWith('../') || relative.includes('\\') || path.posix.isAbsolute(relative)) {
    throw new Error(`Unsafe resource path: ${owner} -> ${url}`);
  }
  return relative;
}
export async function resources(document) {
  const files = new Set(['index.html']);
  const add = (url, owner) => { const file = localPath(url, owner); if (file) files.add(file); };
  for (const node of elements(document)) {
    for (const key of ['href', 'src']) add(attr(node, key));
    const srcset = attr(node, 'srcset');
    if (srcset) srcset.split(',').forEach(item => add(item.trim().split(/\s+/)[0]));
    if (node.tagName === 'script' && attr(node, 'id') === 'review-images') {
      const manifest = JSON.parse(node.childNodes.map(child => child.value || '').join(''));
      if (!Array.isArray(manifest)) throw new Error('Review manifest must be an array');
      manifest.forEach(url => add(url));
    }
  }
  // A Set iterator also visits CSS imports discovered while walking earlier stylesheets.
  for (const file of files) {
    if (!file.endsWith('.css')) continue;
    postcss.parse(await read(file), { from: file }).walk(node => {
      const value = node.type === 'decl' ? node.value : node.type === 'atrule' ? node.params : '';
      valueParser(value).walk(part => {
        if (part.type === 'function' && part.value.toLowerCase() === 'url') {
          add(part.nodes[0]?.value, file);
        }
      });
    });
  }
  return files;
}
