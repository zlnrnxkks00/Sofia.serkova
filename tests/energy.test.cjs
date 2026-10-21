const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('dist/script.js', 'utf8');
const start = source.indexOf('function createSectionEnergy(');
const end = source.indexOf('\nconst sectionEnergies =', start);
let now = 0;
let nextFrame = 0;
const pending = new Map();
const handlers = new Map();
const documentHandlers = new Map();
let observeVisibility;
let observeResize;
let textSelector;
let lastMask;
const classes = new Set();
const frames = [];
const textRect = { left: 150, top: 274, width: 400, height: 60 };

function context() {
  return {
    createImageData(width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; },
    putImageData(image) { this.image = image; },
    createPattern() { return {}; },
    fillRect() {},
    drawImage(canvas) { frames.push({ width: canvas.width, height: canvas.height, data: Uint8ClampedArray.from(canvas.ctx.image.data) }); }
  };
}
function canvas() {
  return { ctx: context(), getContext() { return this.ctx; } };
}
const mainCanvas = canvas();
const section = {
  clientWidth: 1000, clientHeight: 600,
  querySelector() { return mainCanvas; },
  querySelectorAll(selector) { textSelector = selector; return [{ closest() { return {}; } }]; },
  getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; },
  addEventListener(name, callback) { handlers.set(name, callback); },
  classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } }
};
const document = {
  hidden: false,
  fonts: { ready: { then(callback) { callback(); } } },
  createElement() { return canvas(); },
  createTreeWalker() {
    let visited = false;
    return { currentNode: { textContent: 'Protected text' }, nextNode() { if (visited) return null; visited = true; return this.currentNode; } };
  },
  createRange() { return { selectNodeContents() {}, getClientRects() { return [textRect]; } }; },
  addEventListener(name, callback) { documentHandlers.set(name, callback); }
};
const env = vm.createContext({
  Float32Array: class extends Float32Array { constructor(size) { super(size); lastMask = this; } },
  document, NodeFilter: { SHOW_TEXT: 4 }, performance: { now: () => now },
  getComputedStyle: () => ({ transform: 'matrix(1,0,0,1,0,34)' }),
  DOMMatrixReadOnly: class { constructor() { this.m41 = 0; this.m42 = 34; } },
  clamp: (value, min = 0, max = 1) => Math.max(min, Math.min(max, value)),
  requestAnimationFrame(callback) { const id = ++nextFrame; pending.set(id, callback); return id; },
  cancelAnimationFrame(id) { pending.delete(id); },
  IntersectionObserver: class { constructor(callback) { this.callback = callback; observeVisibility = callback; } observe() { this.callback([{ isIntersecting: true }]); } },
  ResizeObserver: class { constructor(callback) { observeResize = callback; } observe() {} }
});
vm.runInContext(source.slice(start, end), env);
const effect = env.createSectionEnergy(section, 'cells');
const event = { pointerType: 'mouse', clientX: 300, clientY: 350 };
function paint(time) {
  now = time;
  const [id, callback] = pending.entries().next().value;
  pending.delete(id);
  callback(now);
}
function centroid(frame) {
  let total = 0, xSum = 0, ySum = 0;
  for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) {
    const i = (y * frame.width + x) * 4;
    const weight = 225 - frame.data[i] + 244 - frame.data[i + 1] + 203 - frame.data[i + 2];
    total += weight; xSum += x * weight; ySum += y * weight;
  }
  return { x: xSum / total / frame.width, y: ySum / total / frame.height };
}
effect.setMotion(true);
assert(classes.has('energy-active'), 'Idle energy is visible without a pointer');
paint(0);
const initial = centroid(frames.at(-1));
assert(initial.x > .68 && initial.y < .42, 'Energy starts in the upper-right region');
const first = frames.at(-1);
const maskAt = x => lastMask[Math.round(270 * first.width / 1000) * first.width + Math.round(x * first.width / 1000)];
assert(maskAt(650) > .35 && maskAt(650) < .8, 'Text protection fades gradually beyond the old 64px boundary');
assert(maskAt(710) > maskAt(650) && maskAt(710) < .97, 'Diffuse protection retains a smooth outer tail');
const protectedPixel = (Math.round(270 * first.width / 1000) * first.width + Math.round(350 * first.width / 1000)) * 4;
assert.equal(Array.from(first.data.slice(protectedPixel, protectedPixel + 3)).join(','), '225,244,203');
paint(40);
assert.notDeepEqual(first.data, frames.at(-1).data, 'Idle energy keeps pulsing');
handlers.get('pointerenter')(event);
for (let t = 40; t <= 2000; t += 40) paint(t);
const followed = centroid(frames.at(-1));
assert(followed.x < initial.x - .2, 'Energy smoothly follows the cursor away from its origin');
assert.notDeepEqual(first.data, frames.at(-1).data, 'The field is animated');
handlers.get('pointerleave')();
assert.equal(pending.size, 1, 'Energy keeps animating after pointer leave');
assert(classes.has('energy-active'));
paint(2040);
assert(Math.abs(centroid(frames.at(-1)).x - followed.x) < .1, 'Return does not jump');
for (let t = 2080; t <= 6000; t += 40) paint(t);
const returned = centroid(frames.at(-1));
assert(returned.x > followed.x + .2 && returned.y < .42, 'Energy returns to the upper-right');
observeVisibility([{ isIntersecting: false }]);
assert.equal(pending.size, 0, 'Offscreen animation stops');
observeVisibility([{ isIntersecting: true }]);
assert.equal(pending.size, 1, 'Visible idle animation resumes');
document.hidden = true;
documentHandlers.get('visibilitychange')();
assert.equal(pending.size, 0, 'Hidden document animation stops');
document.hidden = false;
documentHandlers.get('visibilitychange')();
assert.equal(pending.size, 1);
effect.setMotion(false);
assert.equal(pending.size, 0);
assert(!classes.has('energy-active'));
section.clientHeight = 1500;
observeResize();
assert(textSelector.includes('#touch-title') && textSelector.includes('.touch-inner p'), 'Text protection covers both sections');
effect.setMotion(true);
handlers.get('pointerenter')({ pointerType: 'mouse', clientX: 450, clientY: 200 });
paint(6040);
handlers.get('pointermove')({ pointerType: 'mouse', clientX: 450, clientY: 1200 });
for (let t = 6080; t <= 8400; t += 40) paint(t);
const lower = centroid(frames.at(-1));
assert(lower.y > .65, 'One continuous field follows the cursor into the portrait section');
assert.equal(pending.size, 1, 'Crossing the section boundary retains a single animation loop');
handlers.get('pointerleave')();
for (let t = 8440; t <= 10800; t += 40) paint(t);
assert(centroid(frames.at(-1)).y < .4, 'Combined surface returns to its upper-right home');
effect.setMotion(false);
section.clientHeight = 600;
const heroEffect = env.createSectionEnergy(section, 'cells', {
  baseColor: [234, 240, 226], strength: .22, speed: .45,
  origin: { x: .57, y: .4 }, textSelector: '#hero-title, .hero-copy'
});
assert(textSelector.includes('#hero-title'), 'Hero uses its own protected text selectors');
heroEffect.setMotion(true);
paint(11000);
const heroFirst = frames.at(-1);
assert.equal(Array.from(heroFirst.data.slice(protectedPixel, protectedPixel + 3)).join(','), '234,240,226', 'Hero text retains the sage background');
let darkestRed = 255;
for (let i = 0; i < heroFirst.data.length; i += 4) darkestRed = Math.min(darkestRed, heroFirst.data[i]);
assert(darkestRed >= 193 && darkestRed < 234, 'Hero field is visible but substantially softer than the original effect');
paint(11040);
assert.notDeepEqual(heroFirst.data, frames.at(-1).data, 'Soft hero field still animates');
heroEffect.setMotion(false);
assert.equal(pending.size, 0, 'Reduced motion also stops the hero effect');
const heroOptionsSource = source.match(/createSectionEnergy\(hero, 'cells', (\{[\s\S]*?\n  \})\)/)[1];
const mintOptions = vm.runInContext(`(${heroOptionsSource})`, env);
const mintEffect = env.createSectionEnergy(section, 'cells', mintOptions);
mintEffect.setMotion(true);
paint(11200);
const mintFrame = frames.at(-1);
let mintPixels = 0;
let minimumRed = 255;
for (let i = 0; i < mintFrame.data.length; i += 4) {
  minimumRed = Math.min(minimumRed, mintFrame.data[i]);
  assert(mintFrame.data[i + 1] >= mintFrame.data[i], 'Energy palette stays green rather than rose or gray');
  if (mintFrame.data[i] < 230) mintPixels++;
}
assert(minimumRed >= 207 && minimumRed < 234, 'Mint tint remains pale and soft');
assert(mintPixels > 100 && mintPixels < mintFrame.width * mintFrame.height * .3, 'Small rounded fields occupy less than a third of the background');
paint(11240);
assert.notDeepEqual(mintFrame.data, frames.at(-1).data, 'Mint fields continue moving');
mintEffect.setMotion(false);
assert.equal(pending.size, 0, 'Mint hero effect respects reduced motion');
const historyOptionsSource = source.match(/createSectionEnergy\(document.querySelector\('#my-history'\), 'cells', (\{[\s\S]*?\n  \})\)/)[1];
const historyOptions = vm.runInContext(`(${historyOptionsSource})`, env);
assert.equal(Object.keys(historyOptions).join(','), 'textSelector', 'History shares audience palette, speed, grain and geometry defaults');
const historyEffect = env.createSectionEnergy(section, 'cells', historyOptions);
assert(textSelector.includes('#history-title') && textSelector.includes('.history-entry') && textSelector.includes('.history-caption'), 'History text is protected');
historyEffect.setMotion(true);
paint(11400);
const historyFrame = frames.at(-1);
assert.equal(Array.from(historyFrame.data.slice(protectedPixel, protectedPixel + 3)).join(','), '225,244,203', 'History retains mint behind the text');
paint(11440);
assert.notDeepEqual(historyFrame.data, frames.at(-1).data, 'History background animates');
historyEffect.setMotion(false);
assert.equal(pending.size, 0, 'History respects reduced motion');
const footerOptionsSource = source.match(/createSectionEnergy\(document.querySelector\('.footer'\), 'cells', (\{[\s\S]*?\n  \})\)/)[1];
const footerOptions = vm.runInContext(`(${footerOptionsSource})`, env);
assert.deepEqual(Array.from(footerOptions.baseColor), [145, 73, 82], 'Footer preserves its rose base');
assert.equal(Object.keys(footerOptions).sort().join(','), 'baseColor,colors,origin,radius,textHalo,textSelector', 'Footer adapts palette and geometry while keeping the history animation');
assert.deepEqual(Array.from(footerOptions.colors[0]), [225, 244, 203], 'Light mint leads the footer palette');
assert.deepEqual(Array.from(footerOptions.colors[3]), [48, 56, 44], 'Dark green complements light mint');
const footerEffect = env.createSectionEnergy(section, 'cells', footerOptions);
assert(textSelector.includes('.footer-inner .wordmark') && textSelector.includes('a:last-child'), 'Footer protects its logo and phone text');
footerEffect.setMotion(true);
paint(11600);
const footerFrame = frames.at(-1);
assert.equal(Array.from(footerFrame.data.slice(protectedPixel, protectedPixel + 3)).join(','), '145,73,82', 'Footer stays rose behind the text');
paint(11640);
assert.notDeepEqual(footerFrame.data, frames.at(-1).data, 'Footer energy animates like history');
footerEffect.setMotion(false);
assert.equal(pending.size, 0, 'Footer cells respect reduced motion');
console.log(JSON.stringify({ initial, followed, returned, lower, mintPixels, minimumRed, tests: 42, result: 'passed' }));
