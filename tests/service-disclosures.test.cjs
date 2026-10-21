const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('dist/script.js', 'utf8');
const start = source.indexOf('function setupServiceDescription(');
const end = source.indexOf('\ndocument.documentElement.classList.add', start);
const listeners = new Map();
const toggleListeners = new Map();
const attributes = new Map();
const description = { hidden: false };
let expanded = false;
let outsideClick;
const toggle = {
  setAttribute(name, value) { attributes.set(name, value); },
  getAttribute(name) { return attributes.get(name); },
  addEventListener(name, callback) { toggleListeners.set(name, callback); },
  focus() { listeners.get('focusin')?.({ target: { matches: () => true } }); }
};
const row = {
  querySelector(selector) { return selector === '.service-toggle' ? toggle : description; },
  addEventListener(name, callback) { listeners.set(name, callback); },
  contains(target) { return target === toggle || target === description; },
  classList: { toggle(name, value) { expanded = value; } }
};
const env = vm.createContext({ document: { addEventListener(name, callback) { outsideClick = callback; } } });
vm.runInContext(source.slice(start, end), env);
const close = env.setupServiceDescription(row);
function expectOpen(value) {
  assert.equal(expanded, value);
  assert.equal(description.hidden, !value);
  assert.equal(attributes.get('aria-expanded'), String(value));
}
expectOpen(false);
assert.equal(toggle.disabled, false);
assert.equal(listeners.has('pointerenter'), false, 'Hover cannot open descriptions');
assert.equal(listeners.has('focusin'), false, 'Focus alone cannot open descriptions');
expectOpen(false);
toggleListeners.get('click')();
expectOpen(true);
listeners.get('pointerleave')?.();
expectOpen(true);
toggleListeners.get('click')();
expectOpen(false);
listeners.get('pointerenter')?.({ pointerType: 'touch' });
expectOpen(false);
toggleListeners.get('click')();
expectOpen(true);
listeners.get('pointerleave')?.();
expectOpen(true);
toggleListeners.get('click')();
expectOpen(false);
toggle.focus();
expectOpen(false);
toggleListeners.get('click')();
expectOpen(true);
listeners.get('keydown')({ key: 'Escape' });
expectOpen(false);
close();
toggleListeners.get('click')();
outsideClick({ target: {} });
expectOpen(false);
toggleListeners.get('click')();
close();
expectOpen(false);
console.log('Service disclosures: click-only opening, touch, keyboard focus, Escape and reset passed');
