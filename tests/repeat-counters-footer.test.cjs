const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/script.js', 'utf8');
let now = 0;
let next = 0;
const pending = new Map();
let counterCallback;
const element = { dataset: { counter: '28' }, textContent: '28' };
const env = vm.createContext({
  motionEnabled: true, WeakMap, performance: { now: () => now },
  clamp: value => Math.max(0, Math.min(1, value)),
  requestAnimationFrame(callback) { const id = ++next; pending.set(id, callback); return id; },
  cancelAnimationFrame(id) { pending.delete(id); },
  window: { requestAnimationFrame(callback) { return env.requestAnimationFrame(callback); } },
  IntersectionObserver: class { constructor(callback) { counterCallback = callback; } observe() {} },
  document: { querySelectorAll: () => [element] }
});
vm.runInContext(source.slice(source.indexOf('const counterStates'), source.indexOf('\nfunction createSectionEnergy')), env);
const enter = () => counterCallback([{ target: element, isIntersecting: true }]);
const leave = () => counterCallback([{ target: element, isIntersecting: false }]);
function tick(time) {
  now = time;
  const jobs = Array.from(pending.values());
  pending.clear();
  jobs.forEach(callback => callback(time));
}
enter();
assert.equal(element.textContent, '0');
tick(600);
assert(Number(element.textContent) > 0 && Number(element.textContent) < 28);
tick(1200);
assert.equal(element.textContent, '28');
leave();
enter();
assert.equal(element.textContent, '0', 'Returning from below restarts the count');
leave();
assert.equal(pending.size, 0, 'Leaving cancels the current animation');
enter();
assert.equal(element.textContent, '0', 'Returning from above also restarts the count');
env.motionEnabled = false;
tick(1300);
assert.equal(element.textContent, '28');
leave();
enter();
assert.equal(element.textContent, '28', 'Reduced motion preserves final values');
assert.equal(pending.size, 0);

let visibility;
const documentHandlers = new Map();
const slices = [];
const mainContext = {
  createPattern: () => ({}), fillRect() {},
  drawImage(...args) { slices.push(args.slice(1)); }
};
const mainCanvas = { getContext: () => mainContext };
const makeCanvas = () => ({ getContext: () => ({
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData() {}, measureText: () => ({ width: 900, actualBoundingBoxAscent: 150, actualBoundingBoxDescent: 0 }),
  fillText() {}
}) });
env.document = {
  hidden: false, createElement: makeCanvas,
  fonts: { ready: { then(callback) { callback(); } } },
  addEventListener(name, callback) { documentHandlers.set(name, callback); }
};
env.IntersectionObserver = class {
  constructor(callback) { visibility = callback; }
  observe() { visibility([{ isIntersecting: true }]); }
};
env.ResizeObserver = class { observe() {} };
const section = {
  clientWidth: 1366, clientHeight: 140,
  querySelector: () => mainCanvas, addEventListener() {},
  classList: { add() {}, remove() {} }
};
vm.runInContext(source.slice(source.indexOf('function createSectionEnergy'), source.indexOf('\nconst sectionEnergies')), env);
const effect = env.createSectionEnergy(section, 'letters', { baseColor: [145, 73, 82], speed: .25 });
assert(slices.length > 0, 'Footer letters render statically before motion starts');
effect.setMotion(true);
tick(1400);
const firstOffset = slices.at(-1)[4];
tick(1500);
assert.notEqual(slices.at(-1)[4], firstOffset, 'Letter contours move');
visibility([{ isIntersecting: false }]);
assert.equal(pending.size, 0, 'Offscreen footer stops');
visibility([{ isIntersecting: true }]);
env.document.hidden = true;
documentHandlers.get('visibilitychange')();
assert.equal(pending.size, 0, 'Hidden tabs stop');
env.document.hidden = false;
effect.setMotion(false);
assert.equal(pending.size, 0, 'Reduced motion remains static');
console.log('15 counter replay and footer motion checks passed');
