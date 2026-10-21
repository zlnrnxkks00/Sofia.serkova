const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/script.js', 'utf8');
function node(data = {}) {
  const handlers = new Map();
  const attrs = new Map();
  const classes = new Set();
  return { dataset: data, handlers, attrs, classes, disabled: true,
    addEventListener(name, handler) { handlers.set(name, handler); },
    setAttribute(name, value) { attrs.set(name, value); },
    classList: { toggle(name, value) { if (value) classes.add(name); else classes.delete(name); } },
    focus() { this.focused = true; handlers.get('focus')?.(); }
  };
}
const entries = ['portrait', 'education', 'face', 'body', 'closing'].map((key, index) =>
  node({ historyImage: key, historyCaption: `Caption ${index}` }));
const images = ['portrait', 'education', 'body', 'face', 'closing'].map(key => Object.assign(node({ historyMedia: key }), { complete: true, naturalWidth: 1000 }));
const caption = {};
const section = {
  querySelectorAll(selector) {
    return ({ '[data-history-image]': entries, '[data-history-media]': images })[selector];
  },
  querySelector(selector) { return selector === '.history-caption' ? caption : null; }
};
const env = vm.createContext({ document: { querySelector: () => section } });
vm.runInContext(source.slice(source.indexOf('function setupHistory()'), source.indexOf('\nconst reducedMotion')), env);
const active = () => images.find(image => image.classes.has('is-active')).dataset.historyMedia;
assert.equal(active(), 'portrait');
assert(entries.every(entry => entry.disabled === false));
entries[1].handlers.get('pointerenter')({ pointerType: 'mouse' });
assert.equal(active(), 'education', 'Hover selects the matching image');
entries[2].handlers.get('pointerenter')({ pointerType: 'touch' });
assert.equal(active(), 'education', 'Touch does not cause accidental hover changes');
entries[2].handlers.get('click')();
assert.equal(active(), 'face');
entries[3].focus();
assert.equal(active(), 'body');
assert.equal(entries[3].attrs.get('aria-pressed'), 'true');
entries[4].handlers.get('click')();
assert.equal(active(), 'closing', 'The final paragraph has its own portrait');
assert.equal(caption.textContent, 'Caption 4');
assert.equal(entries[0].attrs.get('aria-pressed'), 'false');
entries[0].handlers.get('click')();
entries[0].handlers.get('click')();
assert.equal(active(), 'portrait', 'Repeated portrait selection remains stable');

(async () => {
  let resolve;
  images[1].complete = false;
  images[1].decode = () => new Promise(done => { resolve = done; });
  entries[1].handlers.get('click')();
  entries[3].handlers.get('click')();
  resolve();
  await Promise.resolve();
  assert.equal(active(), 'body', 'A delayed decode cannot replace a newer selection');
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const paths = [...html.matchAll(/data-history-media="[^"]+" src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(paths.length, 5);
  assert(html.includes('data-history-media="portrait" src="assets/history-portrait-blush.webp"'));
  assert(html.includes('data-history-media="closing" src="assets/history-closing-blush.webp"'));
  assert(html.includes('data-history-image="closing" data-history-caption="Любимое дело"'));
  paths.forEach(path => assert(fs.existsSync(`dist/${path}`)));
  assert(html.indexOf('id="my-history"') < html.indexOf('id="approach"'), 'History precedes approach');
  const history = html.slice(html.indexOf('<section class="personal-history'), html.indexOf('<section class="story"'));
  assert(history.includes('<canvas class="history-energy" aria-hidden="true"></canvas>'));
  assert(!history.includes('data-history-tab'), 'The story has no separate tabs');
  assert.equal((history.match(/<p><button class="history-entry/g) || []).length, 5);
  ['28 лет', '1998', 'ТНУ имени Вернадского', 'международный диплом массажиста', 'более 20 сертификатов', '2024', 'психосоматолога-практика'].forEach(fact => assert(history.includes(fact), fact));
  console.log('History narrative: hover, touch, focus, repeated images, decode races, facts and assets passed');
})();
