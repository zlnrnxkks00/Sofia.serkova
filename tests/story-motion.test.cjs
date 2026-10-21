const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/script.js', 'utf8');
const start = source.indexOf('const reducedMotion =');
const end = source.indexOf('\nstoryButtons.forEach((button, index)', start);
function node() {
  const classes = new Set();
  return {
    attributes: {}, inert: false,
    classList: { toggle(key, value) { if (value) classes.add(key); else classes.delete(key); }, contains(key) { return classes.has(key); }, remove(key) { classes.delete(key); }, add(key) { classes.add(key); } },
    style: { removeProperty(key) { delete this[key]; } },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; }
  };
}
function scene(width, height, reduced = false) {
  let top = 0;
  const panels = [node(), node(), node()];
  const buttons = [node(), node(), node()];
  const story = { offsetHeight: height * 2.7, getBoundingClientRect: () => ({ top, bottom: top + height * 2.7, height: height * 2.7 }) };
  const stage = { offsetHeight: height };
  const image = node();
  const images = [image, node(), node()];
  const header = { ...node(), offsetHeight: 104, querySelectorAll: () => [] };
  const hero = { getBoundingClientRect: () => ({ bottom: 1000 }) };
  const selectors = { '.story': story, '.story-stage': stage, '.story-image': image, '.story-progress > span': node(), '.hero': hero, '.hero-image': node(), '.header': header };
  const document = { documentElement: node(), querySelector: key => selectors[key], querySelectorAll: key => key === '[data-story-panel]' ? panels : key === '[data-story-step]' ? buttons : key === '[data-story-image]' ? images : [] };
  const reducedMedia = { matches: reduced };
  const flowingMedia = { matches: width <= 1100 || height <= 650 };
  const env = vm.createContext({
    document, window: { innerHeight: height, matchMedia: key => key.includes('prefers-reduced') ? reducedMedia : flowingMedia, requestAnimationFrame() {} },
    CSS: { supports: () => true }, sectionEnergies: [],
    IntersectionObserver: class { observe() {} disconnect() {} }
  });
  vm.runInContext(source.slice(start, end), env);
  env.configureMotion();
  return { env, panels, image, images, document, stage, story, flowingMedia, reducedMedia, setTop(value) { top = value; } };
}
const desktop = scene(1366, 768);
assert(desktop.document.documentElement.classList.contains('has-story-motion'), 'Typical browser height keeps the pinned sequence');
desktop.setTop(-(desktop.story.offsetHeight - desktop.stage.offsetHeight) * .5);
desktop.env.paintScroll();
assert(desktop.panels[1].classList.contains('is-active'), 'Native scroll advances to the second panel');
assert(desktop.image.style.transform.includes('scale('), 'Pinned background image animates');
assert(desktop.images[1].classList.contains('is-active') && !desktop.images[0].classList.contains('is-active'), 'Practice selects the cups background');
assert(desktop.images.every(image => image.style.transform.includes('scale(')), 'All layers share the same parallax position');
desktop.setTop(-(desktop.story.offsetHeight - desktop.stage.offsetHeight) * .9);
desktop.env.paintScroll();
assert(desktop.panels[2].classList.contains('is-active'));
assert(desktop.images[2].classList.contains('is-active') && !desktop.images[1].classList.contains('is-active'), 'Choice selects the FOHOW background');
desktop.flowingMedia.matches = true;
desktop.env.configureMotion();
assert(desktop.images[0].classList.contains('is-active') && desktop.images.slice(1).every(image => !image.classList.contains('is-active')), 'Resizing to flowing mode resets the shared layer to the original image');
assert(desktop.images.every(image => !image.style.transform), 'Resizing clears all stale parallax transforms');
const short = scene(1366, 600);
assert(!short.document.documentElement.classList.contains('has-story-motion'));
short.env.paintScroll();
assert(short.image.style.transform.includes('scale('), 'Short-window flowing layout still animates its background');
assert(short.panels.every(panel => !panel.inert), 'Flowing panels all remain accessible');
const reduced = scene(1366, 768, true);
reduced.env.paintScroll();
assert(!reduced.image.style.transform && reduced.panels.every(panel => !panel.inert), 'Reduced motion stays static and accessible');
const phone = scene(390, 844);
assert(phone.images[0].classList.contains('is-active') && !phone.images[1].classList.contains('is-active'), 'Phone retains the original shared backdrop');
console.log('14 story motion and background-switching checks passed');
