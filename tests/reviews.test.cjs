const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const root = 'dist/';
const source = fs.readFileSync(root + 'script.js', 'utf8');
const html = fs.readFileSync(root + 'index.html', 'utf8');
const images = JSON.parse(html.match(/id="review-images">([^<]+)/)[1]);
assert.equal(images.length, 13);
assert(images.every(path => fs.existsSync(root + path)));
function element() {
  return {
    children: [], handlers: {}, hidden: true,
    append(child) { this.children.push(child); },
    addEventListener(key, callback) { this.handlers[key] = callback; },
    focus() { this.focused = true; }
  };
}
function setup(manifest) {
  const section = element(), gallery = element(), viewer = element(), image = element(), counter = element();
  const controls = Object.fromEntries(['prev', 'next', 'close'].map(key => [key, element()]));
  section.querySelector = key => key === '.reviews-grid' ? gallery : viewer;
  viewer.querySelector = key => key === 'img' ? image : key === '.review-counter' ? counter : controls[key.match(/review-(\w+)/)[1]];
  viewer.showModal = () => { viewer.open = true; };
  viewer.close = () => { viewer.open = false; viewer.handlers.close(); };
  const env = vm.createContext({ document: {
    querySelector: key => key === '#reviews' ? section : { textContent: manifest },
    createElement: () => element()
  } });
  vm.runInContext(source.slice(source.indexOf('function setupReviews()'), source.indexOf('\nsetupReviews();')), env);
  env.setupReviews();
  return { section, gallery, viewer, image, counter, controls };
}
const site = setup(JSON.stringify(images));
assert(!site.section.hidden && site.gallery.children.length === 13);
site.gallery.children[0].handlers.click();
assert(site.viewer.open && site.counter.textContent === '1 / 13' && site.image.src === images[0]);
site.controls.next.handlers.click();
assert.equal(site.counter.textContent, '2 / 13');
site.viewer.handlers.keydown({ key: 'ArrowLeft', preventDefault() {} });
assert.equal(site.counter.textContent, '1 / 13');
site.controls.prev.handlers.click();
assert.equal(site.counter.textContent, '13 / 13');
site.controls.close.handlers.click();
assert(!site.viewer.open && site.gallery.children[0].focused);
assert(setup('[]').section.hidden && setup('{bad').section.hidden);
assert(setup(JSON.stringify(['https://example.com/review.png', 'assets/reviews/../secret.png'])).section.hidden);
console.log('10 review gallery checks passed');
